import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useLocation, useNavigate, useParams } from "react-router";
import { ArrowDown, ArrowLeft, CheckCircle, ChevronDown, Minus, Plus, Trash01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { InputBase } from "@/components/base/input/input";
import { InputGroup } from "@/components/base/input/input-group";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { cx } from "@/utils/cx";
import { FreepassHeader } from "../components/FreepassHeader";
import { getEvento, type EventoCortesia, type ItemCortesia } from "../data/eventos";
import { addEnvios, nomeDoEmail, useEnvios } from "../data/envios-store";

type Etapa = "destinatarios" | "confirmar";

interface Destinatario {
    id: string;
    email: string;
    qtd: number;
}

const MAX_VISIVEIS = 4;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
let nid = 1;

/** Slide horizontal direcional entre as etapas (avançar → esquerda, voltar → direita). */
const stepVariants = {
    enter: (dir: number) => ({ x: dir >= 0 ? 40 : -40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir >= 0 ? -40 : 40, opacity: 0 }),
};

export function ReenviarCortesia() {
    const { eventoId = "", itemId = "" } = useParams();
    const navigate = useNavigate();
    const evento = getEvento(eventoId);
    const item = evento?.itens.find((i) => i.id === itemId);

    const [etapa, setEtapa] = useState<Etapa>("destinatarios");
    const [emailInput, setEmailInput] = useState("");
    const [dests, setDests] = useState<Destinatario[]>([]);
    const [mostrarTodos, setMostrarTodos] = useState(false);
    const [direction, setDirection] = useState(1);
    const [erroEmail, setErroEmail] = useState<string | null>(null);
    const campoRef = useRef<HTMLDivElement>(null);

    const goTo = (next: Etapa, dir: number) => {
        setDirection(dir);
        setEtapa(next);
    };

    const voltarDetalhe = () => navigate(`/freepass/distribuicao-cortesias/${eventoId}/${itemId}`);

    const enviosPrevios = useEnvios(eventoId, itemId);
    const consumido = enviosPrevios.reduce((s, e) => s + e.quantidade, 0);

    const totalQtd = dests.reduce((s, d) => s + d.qtd, 0);
    const disponivel = Math.max(0, (item?.disponivel ?? 0) - consumido);
    const restante = disponivel - totalQtd;
    const semSaldo = restante <= 0;

    const confirmarEnvio = () => {
        addEnvios(
            eventoId,
            itemId,
            dests.map((d) => ({ destinatario: nomeDoEmail(d.email), email: d.email, quantidade: d.qtd, status: "enviado" as const })),
        );
        navigate(`/freepass/distribuicao-cortesias/${eventoId}/${itemId}/enviar/sucesso`, { state: { dests } });
    };

    const adicionar = () => {
        if (!item) return;
        // Sem saldo: sinaliza que todas as cortesias já foram encaminhadas.
        if (semSaldo) {
            setErroEmail("Você já encaminhou todas as cortesias");
            return;
        }
        // Aceita colar uma lista separada por espaço, vírgula, ponto-e-vírgula ou quebra de linha.
        const tokens = emailInput
            .split(/[\s,;]+/)
            .map((e) => e.trim())
            .filter(Boolean);
        if (!tokens.length) return;

        const validos = tokens.filter((e) => EMAIL_RE.test(e));
        const invalidos = tokens.filter((e) => !EMAIL_RE.test(e));

        if (validos.length > 0) {
            const next = dests.map((d) => ({ ...d }));
            let usado = next.reduce((s, d) => s + d.qtd, 0);
            for (const email of validos) {
                if (usado >= disponivel) break; // sem saldo — para de adicionar
                const idx = next.findIndex((d) => d.email.toLowerCase() === email.toLowerCase());
                if (idx >= 0) next[idx].qtd += 1; // duplicado → soma quantidade, sem duplicar linha
                else next.push({ id: `d${nid++}`, email, qtd: 1 });
                usado += 1;
            }
            setDests(next);
            // No mobile os e-mails entram acima do input → rola até o campo para ver o novo e-mail.
            if (window.matchMedia("(max-width: 767px)").matches) {
                requestAnimationFrame(() => campoRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }));
            }
        }

        // Mantém no campo apenas os inválidos e sinaliza o erro; se tudo era válido, limpa.
        if (invalidos.length > 0) {
            setEmailInput(invalidos.join(" "));
            setErroEmail(invalidos.length === 1 ? "Digite um e-mail válido." : "Alguns e-mails são inválidos. Revise e tente de novo.");
        } else {
            setEmailInput("");
            setErroEmail(null);
        }
    };

    // Remover/alterar destinatários libera saldo → limpa o aviso de "todas encaminhadas".
    const setDest = (id: string, patch: Partial<Destinatario>) => {
        setErroEmail(null);
        setDests((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));
    };
    const removeDest = (id: string) => {
        setErroEmail(null);
        setDests((prev) => prev.filter((d) => d.id !== id));
    };

    return (
        <div className="flex min-h-screen flex-col bg-secondary">
            <FreepassHeader />

            <div className="border-b border-secondary bg-primary">
                <div className="mx-auto flex h-14 w-full max-w-[1440px] items-center gap-2 px-4 md:px-8">
                    <button
                        type="button"
                        onClick={() => (etapa === "confirmar" ? goTo("destinatarios", -1) : voltarDetalhe())}
                        aria-label="Voltar"
                        className="flex size-9 items-center justify-center rounded-md text-fg-secondary transition duration-100 ease-linear hover:bg-secondary"
                    >
                        <ArrowLeft className="size-5" aria-hidden="true" />
                    </button>
                    <h1 className="text-md font-semibold text-primary">Enviar para alguém</h1>
                </div>
            </div>

            <main className="mx-auto flex w-full max-w-[768px] flex-1 flex-col gap-5 overflow-x-hidden px-4 py-6 md:px-6">
                {!item || !evento ? (
                    <div className="rounded-2xl bg-primary px-6 py-16 text-center text-sm text-tertiary ring-1 ring-border-secondary">Cortesia não encontrada.</div>
                ) : evento.passado ? (
                    <div className="flex flex-col items-center gap-4 rounded-2xl bg-primary px-6 py-16 text-center ring-1 ring-border-secondary">
                        <p className="text-sm text-tertiary">Este evento já aconteceu. Não é possível reenviar cortesias.</p>
                        <Button size="md" color="secondary" onClick={voltarDetalhe}>
                            Voltar
                        </Button>
                    </div>
                ) : (
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
                            {etapa === "destinatarios" ? (
                                <>
                        <ItemResumoSticky evento={evento} item={item} connector hideDisponivel />

                        <div className="flex flex-col gap-4 rounded-2xl bg-primary p-5 ring-1 ring-border-secondary md:p-6">
                            <h2 className="text-lg font-semibold text-primary">Quem vai receber?</h2>

                            {dests.length > 0 && (
                                <div className="order-1 flex flex-col md:order-2">
                                    <AnimatePresence>
                                        {dests.map((d) => (
                                            <motion.div
                                                key={d.id}
                                                layout
                                                initial={{ opacity: 0, height: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, height: "auto", scale: 1 }}
                                                exit={{ opacity: 0, height: 0, scale: 0.8 }}
                                                transition={{ duration: 0.22, ease: "easeOut" }}
                                                className="overflow-hidden border-b border-secondary md:border-t md:border-b-0"
                                            >
                                                <div className="flex items-center py-3 pr-px">
                                                    <button
                                                        type="button"
                                                        onClick={() => removeDest(d.id)}
                                                        aria-label={`Remover ${d.email}`}
                                                        className="-ml-2 flex size-9 shrink-0 items-center justify-center rounded-md text-fg-quaternary transition duration-100 ease-linear hover:bg-secondary hover:text-fg-error-secondary"
                                                    >
                                                        <Trash01 className="size-4" aria-hidden="true" />
                                                    </button>
                                                    <span className="min-w-0 flex-1 truncate pr-3 text-sm text-secondary">{d.email}</span>
                                                    <Stepper value={d.qtd} onChange={(q) => (q < 1 ? removeDest(d.id) : setDest(d.id, { qtd: q }))} min={0} max={d.qtd + restante} />
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            )}

                            <div ref={campoRef} className="order-2 flex flex-col gap-1.5 md:order-1">
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
                                        <Button color="secondary" size="md" onClick={adicionar}>
                                            Convidar
                                        </Button>
                                    }
                                >
                                    <InputBase placeholder="E-mail do convidado" />
                                </InputGroup>
                                <AnimatePresence initial={false} mode="wait">
                                    {erroEmail ? (
                                        <motion.p
                                            key="email-invalido"
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ duration: 0.2, ease: "easeOut" }}
                                            className="overflow-hidden text-sm text-error-primary"
                                        >
                                            {erroEmail}
                                        </motion.p>
                                    ) : (
                                        <motion.p
                                            key="resta"
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ duration: 0.2, ease: "easeOut" }}
                                            className="overflow-hidden text-sm text-tertiary"
                                        >
                                            {semSaldo
                                                ? disponivel === 1
                                                    ? "Toda a cortesia foi distribuída"
                                                    : `Todas as ${disponivel} cortesias foram distribuídas`
                                                : `${restante === 1 ? "Resta" : "Restam"} ${restante} de ${disponivel} ${disponivel === 1 ? "cortesia disponível" : "cortesias disponíveis"}`}
                                        </motion.p>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        <Button
                            size="lg"
                            color="primary"
                            isDisabled={dests.length === 0}
                            onClick={() => goTo("confirmar", 1)}
                            className="w-full sm:w-auto sm:self-end"
                        >
                            {totalQtd > 0 ? `Enviar ${totalQtd} ${totalQtd === 1 ? "Cortesia" : "Cortesias"}` : "Enviar cortesia"}
                        </Button>
                    </>
                ) : (
                    /* ------- Confirmar transferência ------- */
                    <>
                        <ItemResumoSticky evento={evento} item={item} hideDisponivel />

                        <div className="flex flex-col gap-5 rounded-2xl bg-primary p-5 ring-1 ring-border-secondary md:p-6">
                            <div className="flex flex-col gap-1">
                                <h2 className="text-lg font-semibold text-primary">Confirmar transferência</h2>
                                <p className="text-sm text-tertiary">Os destinatários receberão o item imediatamente. Não será possível cancelar este envio.</p>
                            </div>

                            <div className="flex flex-col gap-3 rounded-xl bg-primary p-4 ring-1 ring-border-secondary">
                                <h3 className="text-sm font-semibold text-primary">Quem vai receber</h3>
                                <div className="flex flex-col gap-2.5">
                                    {dests.slice(0, MAX_VISIVEIS).map((d) => (
                                        <div key={d.id} className="flex items-center justify-between gap-3">
                                            <span className="min-w-0 truncate text-sm text-secondary">{d.email}</span>
                                            <span className="shrink-0 text-sm text-tertiary tabular-nums">{d.qtd}x</span>
                                        </div>
                                    ))}
                                    <AnimatePresence initial={false}>
                                        {mostrarTodos && dests.length > MAX_VISIVEIS && (
                                            <motion.div
                                                key="extras"
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                exit={{ opacity: 0, height: 0 }}
                                                transition={{ duration: 0.2, ease: "easeOut" }}
                                                className="flex flex-col gap-2.5 overflow-hidden"
                                            >
                                                {dests.slice(MAX_VISIVEIS).map((d) => (
                                                    <div key={d.id} className="flex items-center justify-between gap-3">
                                                        <span className="min-w-0 truncate text-sm text-secondary">{d.email}</span>
                                                        <span className="shrink-0 text-sm text-tertiary tabular-nums">{d.qtd}x</span>
                                                    </div>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                    {dests.length > MAX_VISIVEIS && (
                                        <button
                                            type="button"
                                            onClick={() => setMostrarTodos((v) => !v)}
                                            className="flex items-center justify-center gap-1 pt-1 text-sm font-medium text-tertiary transition hover:text-secondary"
                                        >
                                            {mostrarTodos ? "Ver menos" : `+${dests.length - MAX_VISIVEIS} pessoas`}
                                            <ChevronDown className={cx("size-4 transition-transform", mostrarTodos && "rotate-180")} aria-hidden="true" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <Button size="lg" color="secondary" onClick={() => goTo("destinatarios", -1)}>
                                Voltar e editar
                            </Button>
                            <Button size="lg" color="primary" onClick={confirmarEnvio}>
                                Confirmar e enviar
                            </Button>
                        </div>
                                </>
                            )}
                        </motion.div>
                    </AnimatePresence>
                )}
            </main>
        </div>
    );
}

const ItemResumo = ({
    evento,
    item,
    disponivel,
    nested = false,
    connector = false,
    hideDisponivel = false,
}: {
    evento: EventoCortesia;
    item: ItemCortesia;
    disponivel?: number;
    nested?: boolean;
    connector?: boolean;
    hideDisponivel?: boolean;
}) => {
    const disp = Math.max(0, disponivel ?? item.disponivel);
    return (
        <>
            <div className={cx("flex flex-col gap-4 rounded-2xl bg-primary ring-1 ring-border-secondary", nested ? "rounded-xl p-4" : "p-5 md:p-6")}>
                <span className="text-sm text-tertiary">{evento.nome}</span>
                <div className="h-px bg-border-secondary" />
                <div className="flex flex-col gap-1">
                    <span className={cx("font-bold text-primary", nested ? "text-lg" : "text-display-xs")}>{item.nome}</span>
                    <span className="text-sm text-tertiary">Data do evento: {evento.data}</span>
                    {!hideDisponivel && (
                        <span className="text-sm font-medium text-brand-secondary">
                            {disp} {disp === 1 ? "disponível" : "disponíveis"}
                        </span>
                    )}
                </div>
            </div>
            {connector && (
                <div className="flex justify-center">
                    <span className="flex size-11 items-center justify-center rounded-full bg-primary text-fg-secondary ring-1 ring-border-secondary">
                        <ArrowDown className="size-5" aria-hidden="true" />
                    </span>
                </div>
            )}
        </>
    );
};

/**
 * ItemResumo + card compacto fixo no topo que aparece quando o resumo sai da tela.
 */
const ItemResumoSticky = (props: { evento: EventoCortesia; item: ItemCortesia; disponivel?: number; connector?: boolean; hideDisponivel?: boolean }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [stuck, setStuck] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        // Dispara quando o resumo passa por baixo do header fixo (~80px).
        const io = new IntersectionObserver(([entry]) => setStuck(!entry.isIntersecting), { rootMargin: "-80px 0px 0px 0px", threshold: 0 });
        io.observe(el);
        return () => io.disconnect();
    }, []);

    return (
        <>
            <AnimatePresence>
                {stuck && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="fixed inset-x-0 top-16 z-20 border-b border-secondary bg-primary shadow-xs md:top-18"
                    >
                        <div className="mx-auto flex w-full max-w-[768px] flex-col gap-0.5 px-4 py-2.5 md:px-6">
                            <span className="truncate text-sm font-bold text-primary">{props.item.nome}</span>
                            <span className="truncate text-sm text-tertiary">Data do evento: {props.evento.data}</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            <div ref={ref} className="flex flex-col gap-5">
                <ItemResumo {...props} />
            </div>
        </>
    );
};

const Sucesso = ({ dests, onIr }: { dests: Destinatario[]; onIr: () => void }) => (
    <div className="flex flex-col gap-4 pt-6">
        <div className="flex flex-col items-center gap-6 rounded-2xl bg-primary p-6 text-center ring-1 ring-border-secondary md:p-8">
            <FeaturedIcon icon={CheckCircle} color="success" theme="light" size="xl" />
            <div className="flex flex-col gap-1">
                <h1 className="text-display-xs font-semibold text-primary">Cortesias enviadas</h1>
                <p className="max-w-md text-sm text-tertiary">As cortesias foram enviadas. Os destinatários receberão um e-mail para resgatar.</p>
            </div>
        </div>
        {dests.length > 0 && (
            <div className="w-full rounded-2xl bg-primary p-5 text-left ring-1 ring-border-secondary">
                <span className="text-sm font-semibold text-secondary">Enviado para</span>
                <div className="mt-2 flex flex-col divide-y divide-secondary">
                    {dests.map((d) => (
                        <div key={d.id} className="flex items-center justify-between gap-3 py-3 first:pt-1">
                            <span className="min-w-0 truncate text-sm text-secondary">{d.email}</span>
                            <span className="shrink-0 text-sm text-tertiary tabular-nums">{d.qtd}x</span>
                        </div>
                    ))}
                </div>
            </div>
        )}
        <Button size="lg" color="primary" onClick={onIr} className="w-full">
            Conferir status do envio
        </Button>
    </div>
);

/* Tela de sucesso do envio — rota própria (`.../enviar/sucesso`) para o teste de usabilidade. */
export function ReenviarSucesso() {
    const { eventoId = "", itemId = "" } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const dests = (location.state as { dests?: Destinatario[] } | null)?.dests ?? [];
    const voltarDetalhe = () => navigate(`/freepass/distribuicao-cortesias/${eventoId}/${itemId}`);

    return (
        <div className="flex min-h-screen flex-col bg-secondary">
            <FreepassHeader />
            <main className="mx-auto flex w-full max-w-[768px] flex-1 flex-col gap-5 px-4 py-6 md:px-6">
                <Sucesso dests={dests} onIr={voltarDetalhe} />
            </main>
        </div>
    );
}

const Stepper = ({ value, onChange, min = 0, max = 99 }: { value: number; onChange: (v: number) => void; min?: number; max?: number }) => (
    <div className="flex shrink-0 items-center gap-1 rounded-lg ring-1 ring-border-primary">
        <button
            type="button"
            onClick={() => onChange(Math.max(min, value - 1))}
            aria-label="Diminuir"
            disabled={value <= min}
            className="flex size-9 items-center justify-center rounded-l-lg text-fg-secondary transition duration-100 ease-linear hover:bg-secondary disabled:opacity-50"
        >
            <Minus className="size-4" aria-hidden="true" />
        </button>
        <span className="w-6 text-center text-sm font-medium text-primary tabular-nums">{value}</span>
        <button
            type="button"
            onClick={() => onChange(Math.min(max, value + 1))}
            aria-label="Aumentar"
            disabled={value >= max}
            className="flex size-9 items-center justify-center rounded-r-lg text-fg-secondary transition duration-100 ease-linear hover:bg-secondary disabled:opacity-50"
        >
            <Plus className="size-4" aria-hidden="true" />
        </button>
    </div>
);

export { Stepper, ItemResumo, ItemResumoSticky, stepVariants };
