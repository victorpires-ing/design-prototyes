import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, Calendar, Check, CheckCircle, Package, Ticket01, Trash01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { InputBase } from "@/components/base/input/input";
import { InputGroup } from "@/components/base/input/input-group";
import { cx } from "@/utils/cx";
import { FreepassHeader } from "../components/FreepassHeader";
import { getEvento, type ItemCortesia, type TipoItem } from "../data/eventos";
import { addEnvios, consumidoDe, nomeDoEmail } from "../data/envios-store";
import { Stepper, stepVariants } from "./reenviar-cortesia";

type Modo = "enviar" | "resgatar";
type Etapa = "destinatarios" | "itens" | "confirmar" | "sucesso";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
let uid = 1;

const GRUPOS: { tipo: TipoItem; titulo: string }[] = [
    { tipo: "ingresso", titulo: "Ingressos" },
    { tipo: "produto", titulo: "Produtos" },
    { tipo: "combo", titulo: "Combos" },
];

/** Mini stepper numérico horizontal — verde (com check) nas concluídas, ring nas pendentes. */
function MiniStepper({ total, atual }: { total: number; atual: number }) {
    return (
        <div className="flex items-center justify-center gap-3">
            <span className="text-sm font-medium text-secondary">
                Etapa {atual + 1} de {total}
            </span>
            <div className="flex items-center gap-2">
                {Array.from({ length: total }).map((_, i) => {
                    const complete = i < atual;
                    const current = i === atual;
                    return (
                        <span
                            key={i}
                            className={cx(
                                "flex size-7 items-center justify-center rounded-full text-sm font-semibold transition duration-100 ease-linear",
                                complete
                                    ? "bg-success-solid text-white"
                                    : current
                                      ? "bg-primary text-secondary ring-1 ring-inset ring-secondary"
                                      : "bg-primary text-quaternary opacity-60 ring-1 ring-inset ring-secondary",
                            )}
                        >
                            {complete ? <Check className="size-4" aria-hidden="true" /> : i + 1}
                        </span>
                    );
                })}
            </div>
        </div>
    );
}

const iconeDoItem = (tipo: TipoItem) => (tipo === "combo" ? Package : tipo === "ingresso" ? Ticket01 : null);

/** Wizard de distribuição de cortesias (envio para outras pessoas ou resgate para si). */
function DistribuirCortesias({ modo }: { modo: Modo }) {
    const { eventoId = "" } = useParams();
    const navigate = useNavigate();
    const evento = getEvento(eventoId);

    const passos: Etapa[] = modo === "enviar" ? ["destinatarios", "itens", "confirmar"] : ["itens", "confirmar"];
    const [etapa, setEtapa] = useState<Etapa>(passos[0]);
    const [direction, setDirection] = useState(1);

    // Destinatários (só no modo enviar).
    const [emails, setEmails] = useState<{ id: number; email: string }[]>([]);
    const [emailInput, setEmailInput] = useState("");
    const [erroEmail, setErroEmail] = useState<string | null>(null);

    // Seleção de itens: itemId → quantidade por pessoa.
    const [selecao, setSelecao] = useState<Record<string, number>>({});
    const [tambemDistribui, setTambemDistribui] = useState(false);

    const voltarDetalhe = () => navigate(`/freepass/distribuicao-cortesias/${eventoId}`);
    const goTo = (e: Etapa, dir: number) => {
        setDirection(dir);
        setEtapa(e);
    };
    const idxAtual = passos.indexOf(etapa);
    const avancar = () => idxAtual < passos.length - 1 && goTo(passos[idxAtual + 1], 1);
    const retroceder = () => (idxAtual > 0 ? goTo(passos[idxAtual - 1], -1) : voltarDetalhe());

    const nRecipientes = modo === "enviar" ? Math.max(1, emails.length) : 1;

    // Disponibilidade por item (desconta o que já foi distribuído na sessão).
    const dispDe = (item: ItemCortesia) => Math.max(0, item.disponivel - consumidoDe(eventoId, item.id));

    const itensSelecionados = useMemo(
        () => (evento?.itens ?? []).filter((it) => (selecao[it.id] ?? 0) > 0),
        [evento, selecao],
    );
    const totalPorCortesia = itensSelecionados.reduce((s, it) => s + (selecao[it.id] ?? 0), 0);

    if (!evento) {
        return (
            <div className="flex min-h-screen flex-col bg-secondary">
                <FreepassHeader />
                <main className="mx-auto w-full max-w-[768px] flex-1 px-4 py-6 md:px-6">
                    <div className="rounded-2xl bg-primary px-6 py-16 text-center text-sm text-tertiary ring-1 ring-border-secondary">Evento não encontrado.</div>
                </main>
            </div>
        );
    }

    /* --------------------------- Ações de e-mail --------------------------- */
    const adicionarEmail = () => {
        const v = emailInput.trim().toLowerCase();
        if (!v) return;
        if (!EMAIL_RE.test(v)) return setErroEmail("E-mail inválido.");
        if (emails.some((e) => e.email === v)) {
            setEmailInput("");
            return;
        }
        setEmails((prev) => [...prev, { id: uid++, email: v }]);
        setEmailInput("");
        setErroEmail(null);
    };
    const removerEmail = (id: number) => setEmails((prev) => prev.filter((e) => e.id !== id));

    /* --------------------------- Seleção de itens -------------------------- */
    const toggleItem = (item: ItemCortesia) =>
        setSelecao((prev) => {
            const next = { ...prev };
            if (next[item.id]) delete next[item.id];
            else next[item.id] = 1;
            return next;
        });
    const setQtd = (item: ItemCortesia, q: number) => setSelecao((prev) => ({ ...prev, [item.id]: Math.max(1, q) }));

    /* --------------------------- Confirmar -------------------------------- */
    const confirmar = (comoResgate: boolean) => {
        for (const it of itensSelecionados) {
            const qtd = selecao[it.id] ?? 0;
            if (comoResgate) {
                addEnvios(eventoId, it.id, [{ destinatario: "Você", email: "voce@ingresse.com", quantidade: qtd, status: "resgatado" }]);
            } else {
                addEnvios(
                    eventoId,
                    it.id,
                    emails.map((e) => ({ destinatario: nomeDoEmail(e.email), email: e.email, quantidade: qtd, status: tambemDistribui ? "aberto" : "enviado" })),
                );
            }
        }
        goTo("sucesso", 1);
    };

    return (
        <div className="flex min-h-screen flex-col bg-secondary">
            <FreepassHeader />

            <div className="sticky top-16 z-20 border-b border-secondary bg-primary md:top-18">
                <div className="mx-auto flex w-full max-w-[1440px] items-center gap-3 px-4 py-2.5 md:px-8">
                    <button
                        type="button"
                        onClick={etapa === "sucesso" ? voltarDetalhe : retroceder}
                        aria-label="Voltar"
                        className="flex size-9 shrink-0 items-center justify-center rounded-md text-fg-secondary transition duration-100 ease-linear hover:bg-secondary"
                    >
                        <ArrowLeft className="size-5" aria-hidden="true" />
                    </button>
                    <div className="flex min-w-0 flex-col">
                        <span className="line-clamp-2 text-sm font-semibold text-primary">{evento.nome}</span>
                        <span className="text-sm text-tertiary">Data do evento: {evento.data}</span>
                    </div>
                </div>
            </div>

            <main className="mx-auto flex w-full max-w-[560px] flex-1 flex-col gap-5 overflow-x-hidden px-4 py-6 md:px-6">
                {etapa !== "sucesso" && <MiniStepper total={passos.length} atual={idxAtual} />}

                <AnimatePresence mode="wait" custom={direction} initial={false}>
                    <motion.div
                        key={etapa}
                        custom={direction}
                        variants={stepVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="flex flex-1 flex-col gap-5"
                    >
                        {/* -------------------------- Etapa 1: destinatários -------------------------- */}
                        {etapa === "destinatarios" && (
                            <>
                                <h2 className="text-center text-lg font-semibold text-primary">Para quem vai enviar?</h2>
                                <div className="flex flex-col gap-4 rounded-2xl bg-primary p-4 ring-1 ring-border-secondary">
                                    <div className="flex flex-col gap-1.5">
                                        <InputGroup
                                            size="md"
                                            aria-label="E-mail do convidado"
                                            value={emailInput}
                                            onChange={(v) => {
                                                setEmailInput(v);
                                                if (erroEmail) setErroEmail(null);
                                            }}
                                            isInvalid={!!erroEmail}
                                            trailingAddon={
                                                <Button color="secondary" size="md" onClick={adicionarEmail}>
                                                    Convidar
                                                </Button>
                                            }
                                        >
                                            <InputBase placeholder="Digite o e-mail do convidado" />
                                        </InputGroup>
                                        {erroEmail && <span className="text-sm text-error-primary">{erroEmail}</span>}
                                    </div>

                                    {emails.length > 0 && (
                                        <div className="flex flex-col">
                                            <AnimatePresence initial={false}>
                                                {emails.map((e) => (
                                                    <motion.div
                                                        key={e.id}
                                                        layout
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: "auto" }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        transition={{ duration: 0.2, ease: "easeOut" }}
                                                        className="overflow-hidden border-t border-secondary first:border-t-0"
                                                    >
                                                        <div className="flex items-center gap-3 py-3">
                                                            <span className="min-w-0 flex-1 truncate text-sm text-secondary">{e.email}</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => removerEmail(e.id)}
                                                                aria-label={`Remover ${e.email}`}
                                                                className="flex size-8 shrink-0 items-center justify-center rounded-md text-fg-quaternary transition duration-100 ease-linear hover:bg-secondary hover:text-fg-error-secondary"
                                                            >
                                                                <Trash01 className="size-4" aria-hidden="true" />
                                                            </button>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </AnimatePresence>
                                        </div>
                                    )}
                                </div>

                                <Button size="lg" color="primary" isDisabled={emails.length === 0} onClick={avancar} className="w-full sm:w-auto sm:self-end">
                                    Continuar
                                </Button>
                            </>
                        )}

                        {/* -------------------------- Etapa 2: itens + quantidades -------------------------- */}
                        {etapa === "itens" && (
                            <>
                                <h2 className="text-center text-lg font-semibold text-primary">
                                    {modo === "enviar" ? "O que cada pessoa vai receber?" : "O que você quer resgatar?"}
                                </h2>
                                {GRUPOS.map(({ tipo, titulo }) => {
                                    const itens = evento.itens.filter((i) => i.tipo === tipo);
                                    if (!itens.length) return null;
                                    return (
                                        <section key={tipo} className="flex flex-col gap-3">
                                            <h3 className="text-sm font-semibold text-primary">{titulo}</h3>
                                            <div className="flex flex-col gap-3">
                                                {itens.map((item) => {
                                                    const qtd = selecao[item.id] ?? 0;
                                                    const disp = dispDe(item);
                                                    const marcado = qtd > 0;
                                                    // Só dá pra selecionar se houver o suficiente para dar 1 a cada destinatário.
                                                    const podeSelecionar = disp >= nRecipientes;
                                                    const maxPorPessoa = Math.max(1, Math.floor(disp / nRecipientes));
                                                    // Vai subtraindo conforme a quantidade escolhida (× destinatários).
                                                    const restante = Math.max(0, disp - qtd * nRecipientes);
                                                    return (
                                                        <div
                                                            key={item.id}
                                                            className={cx(
                                                                "flex items-start gap-3 rounded-xl bg-primary p-4 ring-1 transition duration-100 ease-linear",
                                                                marcado ? "ring-brand" : "ring-border-secondary",
                                                            )}
                                                        >
                                                            <Checkbox size="md" isSelected={marcado} isDisabled={!podeSelecionar} onChange={() => toggleItem(item)} className="mt-0.5" />
                                                            <button
                                                                type="button"
                                                                disabled={!podeSelecionar}
                                                                onClick={() => podeSelecionar && toggleItem(item)}
                                                                className="flex min-w-0 flex-1 flex-col gap-1.5 text-left disabled:cursor-not-allowed"
                                                            >
                                                                <span className="truncate text-sm font-semibold text-primary">{item.nome}</span>
                                                                {item.detalhe && <span className="truncate text-sm text-tertiary">{item.detalhe}</span>}
                                                                {item.data && (
                                                                    <span className="flex items-center gap-1.5 text-sm text-tertiary">
                                                                        <Calendar className="size-4 shrink-0 text-fg-quaternary" aria-hidden="true" />
                                                                        {item.data}
                                                                    </span>
                                                                )}
                                                                <span className={cx("text-sm font-medium", podeSelecionar ? "text-blue-600" : "text-error-primary")}>
                                                                    {podeSelecionar
                                                                        ? `${restante} de ${disp} ${disp === 1 ? "disponível" : "disponíveis"}`
                                                                        : `${disp} ${disp === 1 ? "disponível" : "disponíveis"}, quantidade insuficiente para enviar a todos`}
                                                                </span>
                                                            </button>
                                                            {marcado && (
                                                                <div className="flex shrink-0 flex-col items-center gap-1">
                                                                    <Stepper value={qtd} onChange={(q) => setQtd(item, q)} min={1} max={maxPorPessoa} />
                                                                    {modo === "enviar" && <span className="text-sm text-tertiary">por pessoa</span>}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </section>
                                    );
                                })}

                                <Button size="lg" color="primary" isDisabled={itensSelecionados.length === 0} onClick={avancar} className="w-full sm:w-auto sm:self-end">
                                    Continuar
                                </Button>
                            </>
                        )}

                        {/* -------------------------- Etapa 3: confirmação -------------------------- */}
                        {etapa === "confirmar" && (
                            <>
                                <div className="flex flex-col gap-1 text-center">
                                    <h2 className="text-lg font-semibold text-primary">{modo === "enviar" ? "Confirme o envio" : "Confirme o resgate"}</h2>
                                    <p className="text-sm text-tertiary">
                                        {modo === "enviar"
                                            ? "Os destinatários receberão os itens imediatamente. Não será possível cancelar este envio."
                                            : "Os itens ficarão disponíveis na sua carteira imediatamente."}
                                    </p>
                                </div>

                                <div className="flex flex-col gap-3 rounded-2xl bg-primary p-5 ring-1 ring-border-secondary">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-semibold text-primary">{modo === "enviar" ? "Cada envio tem" : "Você vai resgatar"}</span>
                                        <span className="text-sm text-tertiary">
                                            {totalPorCortesia} {totalPorCortesia === 1 ? "item" : "itens"}
                                        </span>
                                    </div>
                                    <div className="flex flex-col gap-2 border-t border-secondary pt-3">
                                        {itensSelecionados.map((it) => {
                                            const Icon = iconeDoItem(it.tipo);
                                            return (
                                                <div key={it.id} className="flex items-center gap-3">
                                                    {it.tipo === "produto" && it.foto ? (
                                                        <img src={it.foto} alt="" className="size-8 shrink-0 rounded-md object-cover ring-1 ring-border-secondary" />
                                                    ) : (
                                                        <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-secondary text-fg-secondary">
                                                            {Icon && <Icon className="size-4" aria-hidden="true" />}
                                                        </span>
                                                    )}
                                                    <span className="min-w-0 flex-1 truncate text-sm text-secondary">
                                                        {it.nome}
                                                        {it.detalhe ? ` · ${it.detalhe}` : ""}
                                                    </span>
                                                    <span className="shrink-0 text-sm font-medium text-primary tabular-nums">{selecao[it.id]}x</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {modo === "enviar" && (
                                    <div className="flex flex-col gap-3 rounded-2xl bg-primary p-5 ring-1 ring-border-secondary">
                                        <span className="text-sm font-semibold text-primary">Quem vai receber</span>
                                        <div className="flex flex-col divide-y divide-secondary">
                                            {emails.map((e) => (
                                                <div key={e.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                                                    <span className="min-w-0 truncate text-sm text-secondary">{e.email}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="-mx-5 border-t border-secondary px-5 pt-3">
                                            <Checkbox
                                                size="sm"
                                                isSelected={tambemDistribui}
                                                onChange={setTambemDistribui}
                                                label="Quem vai receber também pode distribuir cortesias"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                    <Button size="lg" color="secondary" onClick={retroceder} className="w-full sm:w-auto">
                                        Voltar e editar
                                    </Button>
                                    {modo === "enviar" ? (
                                        <Button size="lg" color="primary" onClick={() => confirmar(false)} className="w-full sm:w-auto">
                                            Confirmar envio
                                        </Button>
                                    ) : (
                                        <Button size="lg" color="primary" onClick={() => confirmar(true)} className="w-full sm:w-auto">
                                            Confirmar resgate
                                        </Button>
                                    )}
                                </div>
                            </>
                        )}

                        {/* -------------------------- Sucesso -------------------------- */}
                        {etapa === "sucesso" && (
                            <div className="flex flex-col items-center gap-6 rounded-2xl bg-primary p-6 text-center ring-1 ring-border-secondary md:p-8">
                                <span className="flex size-14 items-center justify-center rounded-full bg-success-secondary text-fg-success-primary">
                                    <CheckCircle className="size-7" aria-hidden="true" />
                                </span>
                                <div className="flex flex-col gap-1">
                                    <h2 className="text-display-xs font-semibold text-primary">Tudo certo!</h2>
                                    <p className="max-w-sm text-sm text-tertiary">
                                        {modo === "enviar" ? "As cortesias foram enviadas. Os destinatários receberão um e-mail para resgatar." : "Os itens já estão na sua carteira de ingressos."}
                                    </p>
                                </div>
                                <Button size="lg" color="primary" onClick={voltarDetalhe} className="w-full">
                                    Voltar ao evento
                                </Button>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
}

export function EnviarCortesiasFlow() {
    return <DistribuirCortesias modo="enviar" />;
}

export function ResgatarCortesiasFlow() {
    return <DistribuirCortesias modo="resgatar" />;
}
