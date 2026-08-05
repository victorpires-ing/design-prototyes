import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowDown, ArrowLeft, ChevronRight, XClose } from "@untitledui/icons";
import { Avatar } from "@/components/base/avatar/avatar";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { AppShell } from "../../components/AppShell";
import { BottomSheet } from "../../components/BottomSheet";
import { StatusBar } from "../../components/StatusBar";
import { BankCardSendAnimation } from "../components/BankCardSendAnimation";
import { Zigzag } from "../../components/Zigzag";
import { getCombo, getEvento, getItem } from "../data/eventos";
import alertAmareloIcon from "../../assets/alert-amarelo.png";

const DESTINATARIO = "Mariana Costa Lima";
const INICIAIS = "MC";

export function TransferirIngresso() {
    const navigate = useNavigate();
    const { eventId, id } = useParams();
    const evento = getEvento(eventId);
    const combo = getCombo(eventId, id);
    const item = getItem(eventId, id);
    const isCombo = !!combo;

    const evNome = evento.title;
    const title = item?.title ?? "Ingresso";
    const tipo = item?.tipo;
    const sessao = evento.sessao;

    const [email, setEmail] = useState("");
    const [searched, setSearched] = useState(false);
    const [confirming, setConfirming] = useState(false);
    // Config de transferência por ingresso: paga (com taxa) e/ou primeira gratuita
    const [paidOpen, setPaidOpen] = useState(false);
    const transferenciaPaga = !!item?.transferenciaPaga;
    const primeiraGratis = !!item?.primeiraTransferenciaGratis;
    const recebidoDe = item?.recebidoDe;
    const taxa = item?.taxaTransferencia ?? 0;
    const taxaLabel = `R$ ${taxa.toFixed(2).replace(".", ",")}`;

    // Questionário (apenas eventos que pedem formulário, ex.: São Silvestre)
    const [formOpen, setFormOpen] = useState(false);
    const [respostas, setRespostas] = useState<Record<string, string>>({});
    const perguntas = combo?.questionario ?? [];
    const temFormulario = perguntas.length > 0;
    const formOk = perguntas.every((q) => (respostas[q.pergunta] ?? "").trim() !== "");

    // Ao buscar, rola suavemente até o resultado (feedback de que algo aconteceu).
    const resultRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (searched) resultRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, [searched]);

    const destino = isCombo ? `/ingresse-app/ingressos/combo/${evento.id}/${id}` : `/ingresse-app/ingressos/detalhe/${evento.id}/${id}`;
    const voltar = () => navigate(destino);

    const confirmarTransferencia = () => {
        setConfirming(false);
        navigate(`/ingresse-app/ingressos/transferir-pagamento/${evento.id}/${id}/sucesso`);
    };

    return (
        <AppShell showTabBar={false}>
            {formOpen ? (
                /* Tela de formulário do participante (tela cheia, não modal) */
                <div className="flex min-h-full flex-col bg-secondary">
                    <StatusBar tone="dark" />

                    <div className="px-5 pt-2">
                        <button
                            type="button"
                            aria-label="Voltar"
                            onClick={() => setFormOpen(false)}
                            className="flex size-10 items-center justify-center rounded-lg bg-primary text-fg-secondary ring-1 ring-border-secondary transition duration-100 ease-linear active:bg-secondary"
                        >
                            <ArrowLeft className="size-5" />
                        </button>
                        <h1 className="pt-4 text-xl font-bold text-primary">Formulário do participante</h1>
                    </div>

                    <div className="flex flex-1 flex-col px-5 pt-4 pb-8">
                        <p className="text-sm text-tertiary">Para concluir, responda as mesmas perguntas da inscrição com os dados de {DESTINATARIO}.</p>

                        {/* Para quem está transferindo */}
                        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-primary p-4 ring-1 ring-border-secondary">
                            <Avatar size="md" initials={INICIAIS} alt={DESTINATARIO} />
                            <div className="min-w-0 flex-1">
                                <p className="text-xs text-tertiary">Transferindo para</p>
                                <p className="text-sm font-bold text-primary">{DESTINATARIO}</p>
                            </div>
                        </div>

                        <div className="mt-5 flex flex-col gap-4">
                            {perguntas.map((q) => (
                                <Input
                                    key={q.pergunta}
                                    isRequired
                                    label={q.pergunta}
                                    placeholder="Sua resposta"
                                    value={respostas[q.pergunta] ?? ""}
                                    onChange={(v) => setRespostas((r) => ({ ...r, [q.pergunta]: v }))}
                                />
                            ))}
                        </div>

                        <Button
                            size="lg"
                            color="primary"
                            className="mt-6 w-full rounded-full"
                            isDisabled={!formOk}
                            onClick={() => {
                                setFormOpen(false);
                                setConfirming(true);
                            }}
                        >
                            Continuar
                        </Button>
                    </div>
                </div>
            ) : (
            <div className="flex min-h-full flex-col bg-secondary">
                <StatusBar tone="dark" />

                {/* Top bar + título */}
                <div className="px-5 pt-2">
                    <button
                        type="button"
                        aria-label="Voltar"
                        onClick={voltar}
                        className="flex size-10 items-center justify-center rounded-lg bg-primary text-fg-secondary ring-1 ring-border-secondary transition duration-100 ease-linear active:bg-secondary"
                    >
                        <ArrowLeft className="size-5" />
                    </button>
                    <h1 className="pt-4 text-xl font-bold text-primary">Transferir ingresso</h1>
                </div>

                <div className="px-5 pt-5 pb-8">
                    {/* Card do ingresso (compacto) */}
                    <div className="rounded-3xl bg-primary shadow-sm ring-1 ring-border-secondary">
                        {isCombo && combo ? (
                            <>
                                <div className="p-5">
                                    <p className="text-xs font-medium tracking-wide text-tertiary uppercase">{evento.title}</p>
                                    <div className="my-3 border-t border-tertiary" />
                                    <p className="text-2xl leading-tight font-bold text-primary">{combo.nome}</p>
                                    <p className="mt-1.5 text-sm text-tertiary">{combo.dataEvento}</p>
                                </div>

                                <div className="relative py-1">
                                    <div className="absolute top-1/2 -left-2.5 size-5 -translate-y-1/2 rounded-full bg-secondary" />
                                    <div className="absolute top-1/2 -right-2.5 size-5 -translate-y-1/2 rounded-full bg-secondary" />
                                    <div className="px-3">
                                        <Zigzag />
                                    </div>
                                </div>

                                <div className="p-5">
                                    <p className="text-xs font-semibold text-tertiary">{combo.inclusosTitulo ?? "Itens do combo"}</p>
                                    <div className="mt-3 flex flex-col gap-3">
                                        {combo.inclusos?.map((inc, i) => (
                                            <div key={i} className={i > 0 ? "border-t border-tertiary pt-3" : ""}>
                                                <p className="text-sm font-bold text-primary">{inc.grupo ? `${inc.grupo} | ${inc.nome}` : inc.nome}</p>
                                                {inc.data && <p className="mt-0.5 text-sm text-tertiary">{inc.data}</p>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="p-5">
                                    <p className="text-xs font-medium tracking-wide text-tertiary uppercase">{evNome}</p>
                                    <div className="my-3 border-t border-tertiary" />
                                    <p className="text-2xl leading-tight font-bold text-primary">{title}</p>
                                    {tipo && <p className="mt-1.5 text-sm text-tertiary">{tipo}</p>}
                                </div>

                                <div className="relative py-1">
                                    <div className="absolute top-1/2 -left-2.5 size-5 -translate-y-1/2 rounded-full bg-secondary" />
                                    <div className="absolute top-1/2 -right-2.5 size-5 -translate-y-1/2 rounded-full bg-secondary" />
                                    <div className="px-3">
                                        <Zigzag />
                                    </div>
                                </div>

                                <div className="p-5">
                                    <p className="text-xs font-semibold text-tertiary">Sessão</p>
                                    <p className="mt-1 text-sm font-bold text-primary">{sessao}</p>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Conector */}
                    <div className="flex justify-center py-3">
                        <span className="flex size-12 items-center justify-center rounded-full bg-primary text-fg-secondary ring-1 ring-border-secondary">
                            <ArrowDown className="size-5" />
                        </span>
                    </div>

                    {/* Busca por e-mail */}
                    <div className="rounded-2xl bg-primary p-5 ring-1 ring-border-secondary">
                        <p className="text-md font-bold text-primary">E-mail de quem vai receber</p>
                        <div className="mt-3">
                            <Input
                                type="email"
                                placeholder="nome@exemplo.com"
                                value={email}
                                onChange={(v) => {
                                    setEmail(v);
                                    setSearched(false);
                                }}
                            />
                        </div>
                        <p className="mt-2 text-sm text-tertiary">Este e-mail precisa estar cadastrado.</p>

                        <Button
                            size="lg"
                            color="primary"
                            className="mt-4 w-full rounded-full"
                            isDisabled={email.trim() === ""}
                            onClick={() => setSearched(true)}
                        >
                            Encontrar conta
                        </Button>
                    </div>

                    {/* Aviso: primeira transferência gratuita (some quando a conta é encontrada) */}
                    {primeiraGratis && !searched && (
                        <p className="mt-3 flex items-start gap-1.5 px-1 text-sm text-tertiary">
                            <img src={alertAmareloIcon} alt="" aria-hidden="true" className="mt-0.5 size-9 shrink-0 object-contain" />
                            <span>Esta transferência é gratuita. As próximas transferências deste ingresso terão uma taxa.</span>
                        </p>
                    )}

                    {/* Resultados da busca */}
                    {searched && (
                        <div
                            ref={resultRef}
                            className="mt-4 scroll-mt-6 rounded-2xl bg-primary p-5 ring-1 ring-border-secondary duration-300 animate-in fade-in slide-in-from-bottom-3"
                        >
                            <p className="text-md font-bold text-primary">Conta encontrada</p>
                            <p className="mt-1 text-sm text-tertiary">
                                Confira o nome e o e-mail antes de continuar{transferenciaPaga ? " para o pagamento" : ""}.
                            </p>

                            <div className="my-4 border-t border-tertiary" />

                            <button
                                type="button"
                                onClick={() => (transferenciaPaga ? setPaidOpen(true) : temFormulario ? setFormOpen(true) : setConfirming(true))}
                                className="flex w-full items-center gap-3 text-left transition duration-100 ease-linear active:opacity-70"
                            >
                                <Avatar size="md" initials={INICIAIS} alt={DESTINATARIO} />
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-bold text-primary">{DESTINATARIO}</p>
                                    <p className="truncate text-sm text-tertiary">{email}</p>
                                </div>
                                <ChevronRight className="size-5 shrink-0 text-fg-quaternary" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
            )}

            {/* Bottom sheet: transferência com pagamento (feature paga) */}
            <BottomSheet isOpen={paidOpen} onClose={() => setPaidOpen(false)}>
                <div className="flex justify-end">
                    <button
                        type="button"
                        aria-label="Fechar"
                        onClick={() => setPaidOpen(false)}
                        className="shrink-0 text-fg-quaternary transition duration-100 ease-linear active:text-fg-secondary"
                    >
                        <XClose className="size-6" />
                    </button>
                </div>
                <div className="flex flex-col items-center text-center">
                    {paidOpen && <BankCardSendAnimation />}
                    <h2 className="mt-2 text-lg font-bold text-primary">Esta transferência agora tem um valor</h2>
                    <p className="mt-1 text-sm leading-relaxed text-tertiary">
                        Você recebeu este ingresso de {recebidoDe}. Para transferi-lo novamente, será cobrada uma taxa de
                        <br />
                        <span className="text-md font-medium whitespace-nowrap text-secondary">{taxaLabel}</span>.
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-tertiary">
                        Após o pagamento, o ingresso será transferido para <span className="font-medium text-secondary">{DESTINATARIO}</span>.
                    </p>
                </div>
                <Button
                    size="lg"
                    color="primary"
                    className="mt-5 w-full rounded-full"
                    onClick={() => navigate(`/ingresse-app/ingressos/transferir-pagamento/${evento.id}/${id}`)}
                >
                    Continuar para o pagamento
                </Button>
            </BottomSheet>

            {/* Bottom sheet: confirmar transferência */}
            <BottomSheet isOpen={confirming} onClose={() => setConfirming(false)}>
                <div className="flex justify-end">
                    <button
                        type="button"
                        aria-label="Fechar"
                        onClick={() => setConfirming(false)}
                        className="text-fg-quaternary transition duration-100 ease-linear active:text-fg-secondary"
                    >
                        <XClose className="size-6" />
                    </button>
                </div>

                <h2 className="text-lg font-bold text-primary">Tudo certo para transferir?</h2>
                <p className="mt-1 text-sm leading-relaxed text-tertiary">
                    Você está transferindo este ingresso para <span className="font-semibold text-secondary">{DESTINATARIO}</span>. Depois de confirmar, não será
                    possível desfazer a transferência.
                </p>

                <div className="mt-4 flex items-center gap-3 rounded-2xl bg-primary p-4 ring-1 ring-border-secondary">
                    <Avatar size="md" initials={INICIAIS} alt={DESTINATARIO} />
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-primary">{DESTINATARIO}</p>
                        <p className="truncate text-sm text-tertiary">{email}</p>
                    </div>
                </div>

                {/* Recap das respostas do formulário */}
                {temFormulario && (
                    <div className="mt-4 divide-y divide-border-secondary overflow-hidden rounded-2xl bg-primary ring-1 ring-border-secondary">
                        {perguntas.map((q) => (
                            <div key={q.pergunta} className="p-3">
                                <p className="text-xs text-tertiary">{q.pergunta}</p>
                                <p className="mt-0.5 text-sm font-semibold text-primary">{respostas[q.pergunta]}</p>
                            </div>
                        ))}
                    </div>
                )}

                <Button size="lg" color="primary" className="mt-5 w-full rounded-full" onClick={confirmarTransferencia}>
                    Confirmar transferência
                </Button>
                <Button
                    size="lg"
                    color="secondary"
                    className="mt-3 w-full rounded-full"
                    onClick={() => {
                        setConfirming(false);
                        if (temFormulario) setFormOpen(true);
                    }}
                >
                    Cancelar
                </Button>
            </BottomSheet>
        </AppShell>
    );
}
