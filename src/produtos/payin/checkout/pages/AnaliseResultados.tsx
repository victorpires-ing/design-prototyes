import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, Monitor01, RefreshCw02, Phone01, Ticket01, Trash01, Users01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { useTheme } from "@/providers/theme-provider";
import { cx } from "@/utils/cx";
import { PERGUNTAS, apagarResposta, listarRespostas, type RespostaFeedback } from "../data/feedback-store";

const fmtData = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

type Filtro = "todos" | "Computador" | "Celular";
const SEM = "Sem identificação";

export function AnaliseResultados() {
    const navigate = useNavigate();
    const { theme, setTheme } = useTheme();
    const temaAnterior = useRef(theme);
    useEffect(() => {
        setTheme("light");
        return () => setTheme(temaAnterior.current);
    }, [setTheme]);

    const [respostas, setRespostas] = useState<RespostaFeedback[] | null>(null);
    const [filtro, setFiltro] = useState<Filtro>("todos");
    const [apagandoId, setApagandoId] = useState<string | null>(null);
    const [confirmar, setConfirmar] = useState<RespostaFeedback | null>(null);

    const carregar = () => {
        setRespostas(null);
        listarRespostas().then((r) => setRespostas([...r].sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))));
    };
    useEffect(carregar, []);

    const apagar = async (r: RespostaFeedback) => {
        setApagandoId(r.id);
        await apagarResposta(r.id);
        setRespostas((atual) => (atual ? atual.filter((x) => x.id !== r.id) : atual));
        setApagandoId(null);
        setConfirmar(null);
    };

    const total = respostas?.length ?? 0;
    const nComputador = respostas?.filter((r) => r.dispositivo === "Computador").length ?? 0;
    const nCelular = respostas?.filter((r) => r.dispositivo === "Celular").length ?? 0;

    const grupoDe = (r: RespostaFeedback): string => (r.dispositivo === "Computador" || r.dispositivo === "Celular" ? r.dispositivo : SEM);

    // Segmentos a renderizar (respeitando o filtro).
    const ordemGrupos: string[] = ["Computador", "Celular", SEM];
    const segmentos = ordemGrupos
        .filter((g) => filtro === "todos" || filtro === g)
        .map((g) => ({ grupo: g, itens: (respostas ?? []).filter((r) => grupoDe(r) === g) }))
        .filter((s) => s.itens.length > 0);

    const tabs: { id: Filtro; label: string; count: number; icon: typeof Monitor01 | null }[] = [
        { id: "todos", label: "Todos", count: total, icon: null },
        { id: "Computador", label: "Computador", count: nComputador, icon: Monitor01 },
        { id: "Celular", label: "Celular", count: nCelular, icon: Phone01 },
    ];

    return (
        <div className="min-h-screen bg-secondary text-primary">
            <header className="bg-black">
                <div className="mx-auto flex h-14 w-full max-w-4xl items-center justify-center px-6">
                    <span className="flex items-center gap-1.5 font-bold tracking-wide text-white">
                        <Ticket01 className="size-5" />
                        INGRESSE
                    </span>
                </div>
            </header>

            <div className="mx-auto w-full max-w-4xl px-6 pt-6 pb-16">
                <button
                    type="button"
                    onClick={() => navigate("/payin/checkout")}
                    className="flex items-center gap-1.5 text-sm font-semibold text-secondary transition duration-100 ease-linear hover:text-primary"
                >
                    <ArrowLeft className="size-4" />
                    Checkout
                </button>

                <div className="mt-5 flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-primary">Respostas — teste do checkout Pix</h1>
                        <p className="mt-1.5 text-sm text-tertiary">
                            {respostas === null ? "Carregando…" : `${total} ${total === 1 ? "resposta recebida" : "respostas recebidas"}`}
                        </p>
                    </div>
                    <Button size="md" color="secondary" iconLeading={RefreshCw02} onClick={carregar}>
                        Atualizar
                    </Button>
                </div>

                {/* Segmentação por dispositivo */}
                {respostas !== null && total > 0 && (
                    <div className="mt-5 flex flex-wrap gap-2">
                        {tabs.map((t) => {
                            const ativo = filtro === t.id;
                            const Icone = t.icon;
                            return (
                                <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => setFiltro(t.id)}
                                    className={cx(
                                        "flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-semibold outline-none transition duration-100 ease-linear focus-visible:outline-none",
                                        ativo ? "bg-brand-solid text-white" : "bg-primary text-secondary ring-1 ring-border-primary hover:ring-border-brand",
                                    )}
                                >
                                    {Icone && <Icone className="size-4" />}
                                    {t.label}
                                    <span
                                        className={cx(
                                            "inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-xs tabular-nums",
                                            ativo ? "bg-white/20 text-white" : "bg-secondary text-tertiary",
                                        )}
                                    >
                                        {t.count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                )}

                {respostas !== null && total === 0 && (
                    <div className="mt-10 flex flex-col items-center rounded-2xl border border-dashed border-secondary bg-primary px-6 py-14 text-center">
                        <span className="flex size-12 items-center justify-center rounded-xl bg-secondary text-fg-quaternary">
                            <Users01 className="size-6" />
                        </span>
                        <p className="mt-4 text-md font-semibold text-primary">Nenhuma resposta ainda</p>
                        <p className="mt-1 text-sm text-tertiary">Assim que os participantes enviarem o formulário, as respostas aparecem aqui.</p>
                    </div>
                )}

                {respostas !== null && total > 0 && (
                    <div className="mt-8 flex flex-col gap-10">
                        {segmentos.map((seg) => (
                            <section key={seg.grupo}>
                                <div className="flex items-center gap-2 border-b border-secondary pb-2">
                                    {seg.grupo === "Computador" && <Monitor01 className="size-5 text-fg-secondary" />}
                                    {seg.grupo === "Celular" && <Phone01 className="size-5 text-fg-secondary" />}
                                    <h2 className="text-md font-bold text-primary">{seg.grupo}</h2>
                                    <span className="text-sm text-tertiary tabular-nums">
                                        · {seg.itens.length} {seg.itens.length === 1 ? "resposta" : "respostas"}
                                    </span>
                                </div>

                                <div className="mt-4 flex flex-col gap-5">
                                    {seg.itens.map((r, idx) => (
                                        <div key={r.id} className="rounded-2xl bg-primary p-5 shadow-sm ring-1 ring-border-secondary">
                                            <div className="flex items-center justify-between gap-3 border-b border-secondary pb-3">
                                                <p className="text-md font-bold text-primary">
                                                    {seg.grupo} · #{seg.itens.length - idx}
                                                </p>
                                                <div className="flex items-center gap-3">
                                                    <p className="text-xs text-tertiary tabular-nums">{fmtData(r.criadoEm)}</p>
                                                    <button
                                                        type="button"
                                                        aria-label="Apagar resposta"
                                                        onClick={() => setConfirmar(r)}
                                                        disabled={apagandoId === r.id}
                                                        className="flex size-8 items-center justify-center rounded-lg text-fg-quaternary outline-none transition duration-100 ease-linear hover:bg-error-primary hover:text-error-primary focus-visible:outline-none disabled:opacity-50"
                                                    >
                                                        <Trash01 className="size-4" />
                                                    </button>
                                                </div>
                                            </div>
                                            <dl className="mt-3 flex flex-col gap-3">
                                                {PERGUNTAS.map((q, i) => (
                                                    <div key={i}>
                                                        <dt className="text-sm font-semibold text-secondary">
                                                            {i + 1}. {q.texto}
                                                        </dt>
                                                        {q.tipo === "escala" ? (
                                                            <dd className="mt-1">
                                                                {r.respostas[i]?.trim() ? (
                                                                    <span className="inline-flex items-center rounded-full bg-brand-primary px-2.5 py-0.5 text-sm font-bold text-brand-primary">
                                                                        {r.respostas[i]} / 10
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-sm text-tertiary">—</span>
                                                                )}
                                                            </dd>
                                                        ) : (
                                                            <dd className="mt-0.5 text-sm whitespace-pre-wrap text-tertiary">
                                                                {r.respostas[i]?.trim() ? r.respostas[i] : "—"}
                                                            </dd>
                                                        )}
                                                    </div>
                                                ))}
                                            </dl>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal de confirmação de exclusão */}
            <AnimatePresence>
                {confirmar && (
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                    >
                        <button
                            type="button"
                            aria-label="Fechar"
                            onClick={() => apagandoId === null && setConfirmar(null)}
                            className="absolute inset-0 bg-overlay/50"
                        />
                        <motion.div
                            role="dialog"
                            aria-modal="true"
                            className="relative w-full max-w-md rounded-2xl bg-primary p-6 shadow-xl ring-1 ring-border-secondary"
                            initial={{ opacity: 0, scale: 0.96, y: 8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: 8 }}
                            transition={{ duration: 0.18, ease: "easeOut" }}
                        >
                            <FeaturedIcon icon={Trash01} color="error" theme="light" size="lg" />
                            <h2 className="mt-4 text-lg font-bold text-primary">Apagar resposta?</h2>
                            <p className="mt-1.5 text-sm text-tertiary">
                                Esta resposta
                                {confirmar.dispositivo ? ` (${confirmar.dispositivo})` : ""} será removida permanentemente. Essa ação não pode ser desfeita.
                            </p>
                            <div className="mt-6 flex justify-end gap-3">
                                <Button size="md" color="secondary" onClick={() => setConfirmar(null)} isDisabled={apagandoId !== null}>
                                    Cancelar
                                </Button>
                                <Button
                                    size="md"
                                    color="primary-destructive"
                                    iconLeading={Trash01}
                                    onClick={() => apagar(confirmar)}
                                    isLoading={apagandoId !== null}
                                    showTextWhileLoading
                                >
                                    Apagar
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
