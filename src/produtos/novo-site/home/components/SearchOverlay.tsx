import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight, RefreshCw01, XClose, Zap } from "@untitledui/icons";
import { cx } from "@/utils/cx";
import { getFamily, gradientCss } from "../../components/gradient-families";
import { BgTexture } from "./BgTexture";
import { EventCard } from "./EventCard";
import { EVENTOS, type EventoMock } from "../data/events";
import { useCidade } from "../data/cidade-store";
import { closeSearch, takeIntent, useSearchOpen } from "../data/search-store";

const HERO_VIBE = getFamily("high-tempo");

interface Experiencia {
    id: string;
    label: string;
    resposta: string;
    match: (e: EventoMock) => boolean;
}

const matchTexto = (e: EventoMock, q: string) => {
    const hay = [e.titulo, e.artista ?? "", e.local, e.cidade, e.categoria, ...e.tags].join(" ").toLowerCase();
    return q.toLowerCase().split(/\s+/).filter(Boolean).every((t) => hay.includes(t));
};

type Msg = { role: "bot" | "user"; texto: string };

export function SearchOverlay() {
    const open = useSearchOpen();
    const reduce = useReducedMotion();
    const cidade = useCidade();
    const [log, setLog] = useState<Msg[]>([{ role: "bot", texto: "Oi! Bora achar seu próximo rolê. O que você quer viver?" }]);
    const [resultados, setResultados] = useState<EventoMock[] | null>(null);
    const [texto, setTexto] = useState("");
    const fimRef = useRef<HTMLDivElement>(null);

    // Experiências (intenção > filtro): mood-based discovery.
    const experiencias = useMemo<Experiencia[]>(
        () => [
            { id: "noite", label: "O que fazer hoje à noite", resposta: "Pra hoje à noite, a vibe é essa:", match: (e) => ["eletronica", "rap", "sertanejo"].includes(e.categoria) },
            { id: "dois", label: "Programa a dois", resposta: "Pra curtir a dois, dá uma olhada:", match: (e) => e.categoria === "teatro" || e.tags.some((t) => ["intimista", "candlelight", "jazz", "mpb"].includes(t)) },
            { id: "criancas", label: "Com as crianças", resposta: "Pra levar a criançada:", match: (e) => e.tags.includes("ao ar livre") || e.categoria === "festival" },
            { id: "galera", label: "Rolê com a galera", resposta: "Pra ir com a galera:", match: (e) => e.tags.includes("open bar") || ["eletronica", "festival", "sertanejo"].includes(e.categoria) },
            { id: "cultural", label: "Algo cultural", resposta: "No clima cultural:", match: (e) => ["teatro", "standup"].includes(e.categoria) || e.tags.some((t) => ["jazz", "clássico", "mpb"].includes(t)) },
            { id: "perto", label: `Perto de mim (${cidade})`, resposta: `Rolando em ${cidade}:`, match: (e) => e.cidade === cidade },
            { id: "bombando", label: "Bombando agora", resposta: "O que tá em alta:", match: (e) => e.popularidade >= 900 },
            { id: "gratis", label: "De graça", resposta: "Rolês gratuitos:", match: (e) => e.preco === 0 },
        ],
        [cidade],
    );

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeSearch();
        window.addEventListener("keydown", onKey);
        document.body.style.overflow = "hidden";
        return () => {
            window.removeEventListener("keydown", onKey);
            document.body.style.overflow = "";
        };
    }, [open]);

    useEffect(() => {
        fimRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "end" });
    }, [log, resultados, reduce]);

    const ordenar = (list: EventoMock[]) =>
        [...list].sort((a, b) => Number(b.patrocinado) - Number(a.patrocinado) || b.popularidade - a.popularidade);

    const escolher = (exp: Experiencia) => {
        const achados = ordenar(EVENTOS.filter(exp.match)).slice(0, 9);
        setLog((l) => [...l, { role: "user", texto: exp.label }, { role: "bot", texto: achados.length ? exp.resposta : "Hmm, nada nessa vibe agora. Tenta outra?" }]);
        setResultados(achados.length ? achados : []);
    };

    const enviarTexto = () => {
        const q = texto.trim();
        if (!q) return;
        const achados = ordenar(EVENTOS.filter((e) => matchTexto(e, q))).slice(0, 9);
        setLog((l) => [...l, { role: "user", texto: q }, { role: "bot", texto: achados.length ? `Achei isso pra “${q}”:` : `Nada pra “${q}”. Bora tentar uma vibe?` }]);
        setResultados(achados);
        setTexto("");
    };

    const recomeçar = () => {
        setResultados(null);
        setLog((l) => [...l, { role: "bot", texto: "Bora de novo — o que você quer viver?" }]);
    };

    // Ao abrir com uma intenção (chip da Home), já entra na conversa dessa vibe.
    useEffect(() => {
        if (!open) return;
        const it = takeIntent();
        if (!it) return;
        const exp = experiencias.find((e) => e.id === it);
        if (exp) escolher(exp);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    key="search"
                    className="fixed inset-0 z-[70] text-white"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                >
                    {/* Fundo que surge (sem "bola preta": só fade + textura) */}
                    <motion.div
                        aria-hidden
                        className="absolute inset-0 -z-10 bg-[#0c0c10]"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4 }}
                    />
                    <BgTexture background={gradientCss(HERO_VIBE, 150)} className="pointer-events-none absolute inset-0 -z-10 opacity-40" />
                    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-black/40 via-black/65 to-[#0c0c10]" />

                    {/* Conteúdo: o chat cresce e assume a página */}
                    <motion.div
                        className="flex h-full flex-col"
                        style={{ transformOrigin: "50% 78%" }}
                        initial={reduce ? false : { opacity: 0, scale: 0.92, y: 36 }}
                        animate={reduce ? undefined : { opacity: 1, scale: 1, y: 0 }}
                        exit={reduce ? undefined : { opacity: 0, scale: 0.96, y: 20 }}
                        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                    >
                    {/* Topo */}
                    <div className="relative mx-auto flex w-full max-w-2xl items-center justify-between px-5 pt-6 lg:px-8">
                        <span className="flex items-center gap-2 text-sm font-semibold tracking-[0.14em] text-white/60 uppercase">
                            <Zap className="size-4" /> Descobrir
                        </span>
                        <button
                            type="button"
                            onClick={closeSearch}
                            aria-label="Fechar busca"
                            className="flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                        >
                            <XClose className="size-5" />
                        </button>
                    </div>

                    {/* Conversa */}
                    <div className="relative mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 overflow-y-auto px-5 py-8 lg:px-8">
                        {log.map((m, i) => (
                            <Bolha key={i} role={m.role} reduce={reduce}>
                                {m.texto}
                            </Bolha>
                        ))}

                        {/* Menu de experiências (quando ainda não há resultados) */}
                        {resultados === null && (
                            <motion.div
                                initial={reduce ? false : { opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: 0.15 }}
                                className="flex flex-wrap gap-2 pl-11"
                            >
                                {experiencias.map((exp) => (
                                    <button
                                        key={exp.id}
                                        type="button"
                                        onClick={() => escolher(exp)}
                                        className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white/90 transition hover:border-white/40 hover:bg-white/10"
                                    >
                                        {exp.label}
                                    </button>
                                ))}
                            </motion.div>
                        )}

                        {/* Resultados */}
                        {resultados && resultados.length > 0 && (
                            <motion.div
                                initial={reduce ? false : { opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                                className="flex flex-col gap-5 pl-11"
                            >
                                <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3">
                                    {resultados.map((e) => (
                                        <EventCard key={e.id} evento={e} />
                                    ))}
                                </div>
                                <button
                                    type="button"
                                    onClick={recomeçar}
                                    className="flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/90 transition hover:bg-white/10"
                                >
                                    <RefreshCw01 className="size-4" /> Explorar outra vibe
                                </button>
                            </motion.div>
                        )}
                        {resultados && resultados.length === 0 && (
                            <div className="flex flex-wrap gap-2 pl-11">
                                {experiencias.map((exp) => (
                                    <button
                                        key={exp.id}
                                        type="button"
                                        onClick={() => escolher(exp)}
                                        className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white/90 transition hover:border-white/40 hover:bg-white/10"
                                    >
                                        {exp.label}
                                    </button>
                                ))}
                            </div>
                        )}

                        <div ref={fimRef} />
                    </div>

                    {/* Composer */}
                    <div className="relative mx-auto w-full max-w-2xl px-5 pb-8 lg:px-8">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                enviarTexto();
                            }}
                            className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 backdrop-blur focus-within:border-white/40"
                        >
                            <input
                                value={texto}
                                onChange={(e) => setTexto(e.target.value)}
                                placeholder="Ou diga o que procura: artista, local, vibe…"
                                aria-label="Buscar"
                                className="w-full bg-transparent text-md font-medium text-white outline-none placeholder:text-white/40"
                            />
                            <button
                                type="submit"
                                aria-label="Enviar"
                                className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-solid text-white transition hover:bg-brand-solid_hover"
                            >
                                <ArrowRight className="size-5" />
                            </button>
                        </form>
                    </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

function Bolha({ role, reduce, children }: { role: "bot" | "user"; reduce: boolean | null; children: React.ReactNode }) {
    const bot = role === "bot";
    return (
        <motion.div
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className={cx("flex items-end gap-3", bot ? "justify-start" : "justify-end")}
        >
            {bot && (
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-solid text-white">
                    <Zap className="size-4" />
                </span>
            )}
            <span
                className={cx(
                    "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm font-medium",
                    bot ? "rounded-bl-sm bg-white/10 text-white" : "rounded-br-sm bg-white text-black",
                )}
            >
                {children}
            </span>
        </motion.div>
    );
}
