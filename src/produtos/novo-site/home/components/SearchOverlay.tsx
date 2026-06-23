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

// Perguntas de refino — feitas após a intenção, pra estreitar os resultados.
type Opt = { id: string; label: string; fn: (e: EventoMock) => boolean };

const PERIODOS: Opt[] = [
    {
        id: "mes",
        label: "Neste mês",
        fn: (e) => {
            const d = new Date(e.data);
            const n = new Date();
            return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth();
        },
    },
    {
        id: "proximos",
        label: "Nos próximos meses",
        fn: (e) => {
            const d = new Date(e.data);
            const n = new Date();
            return d >= new Date(n.getFullYear(), n.getMonth() + 1, 1);
        },
    },
    { id: "qualquer", label: "Tanto faz", fn: () => true },
];

const PRECOS: Opt[] = [
    { id: "economizar", label: "Quero economizar", fn: (e) => e.preco <= 100 },
    { id: "investir", label: "Posso investir numa experiência", fn: (e) => e.preco >= 150 },
    { id: "qualquer", label: "Tanto faz", fn: () => true },
];

export function SearchOverlay() {
    const open = useSearchOpen();
    const reduce = useReducedMotion();
    const cidade = useCidade();
    const [log, setLog] = useState<Msg[]>([{ role: "bot", texto: "Oi! Bora achar seu próximo rolê. O que você quer viver?" }]);
    const [resultados, setResultados] = useState<EventoMock[] | null>(null);
    const [texto, setTexto] = useState("");
    const fimRef = useRef<HTMLDivElement>(null);
    const resRef = useRef<HTMLDivElement>(null);
    // Etapa de refino atual e filtros acumulados (base = intenção).
    const [pergunta, setPergunta] = useState<null | "periodo" | "preco">(null);
    const filtroRef = useRef<{ match: (e: EventoMock) => boolean; resposta: string; periodo: (e: EventoMock) => boolean; preco: (e: EventoMock) => boolean }>({
        match: () => true,
        resposta: "",
        periodo: () => true,
        preco: () => true,
    });

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
            { id: "esporte", label: "Esporte ao vivo", resposta: "Esporte pra viver na arquibancada:", match: (e) => e.categoria === "esportes" },
            { id: "futebol", label: "Futebol no estádio", resposta: "Futebol pra você não perder:", match: (e) => !!e.futebol || e.tags.includes("futebol") },
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

    // Com resultados, alinha o TOPO deles (não rola até o final das recomendações);
    // sem resultados, acompanha o fim da conversa.
    useEffect(() => {
        if (resultados && resultados.length > 0) {
            resRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
        } else {
            fimRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "end" });
        }
    }, [log, resultados, reduce]);

    const ordenar = (list: EventoMock[]) =>
        [...list].sort((a, b) => Number(b.patrocinado) - Number(a.patrocinado) || b.popularidade - a.popularidade);

    // Inicia o refino: guarda a intenção (base) e faz a 1ª pergunta (quando).
    const iniciar = (match: (e: EventoMock) => boolean, resposta: string, userLabel: string) => {
        filtroRef.current = { match, resposta, periodo: () => true, preco: () => true };
        setResultados(null);
        setLog((l) => [...l, { role: "user", texto: userLabel }, { role: "bot", texto: "Boa! E pra quando você quer?" }]);
        setPergunta("periodo");
    };

    const escolher = (exp: Experiencia) => iniciar(exp.match, exp.resposta, exp.label);

    const enviarTexto = () => {
        const q = texto.trim();
        if (!q) return;
        iniciar((e) => matchTexto(e, q), `Achei isso pra “${q}”:`, q);
        setTexto("");
    };

    const responderPeriodo = (opt: Opt) => {
        filtroRef.current.periodo = opt.fn;
        setLog((l) => [...l, { role: "user", texto: opt.label }, { role: "bot", texto: "E como tá o orçamento?" }]);
        setPergunta("preco");
    };

    const responderPreco = (opt: Opt) => {
        const f = filtroRef.current;
        f.preco = opt.fn;
        const achados = ordenar(EVENTOS.filter((e) => f.match(e) && f.periodo(e) && f.preco(e))).slice(0, 5);
        setLog((l) => [...l, { role: "user", texto: opt.label }, { role: "bot", texto: achados.length ? f.resposta : "Hmm, nada com esses filtros. Bora afrouxar e tentar de novo?" }]);
        setResultados(achados);
        setPergunta(null);
    };

    const recomeçar = () => {
        setResultados(null);
        setPergunta(null);
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
                    className="fixed inset-0 z-[70]"
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.01, delay: 0.48 } }}
                >
                    {/* 1) A página some: fundo liso na cor de fundo (entra primeiro, sai por último) */}
                    <motion.div
                        className="absolute inset-0 bg-primary"
                        onClick={closeSearch}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1, transition: { duration: 0.3, ease: "easeOut" } }}
                        exit={{ opacity: 0, transition: { duration: 0.3, ease: "easeIn", delay: 0.18 } }}
                    />

                    {/* 2) Painel da busca: ocupa a página inteira, abrindo de baixo */}
                    <div className="absolute inset-0">
                    <motion.div
                        className="relative flex h-full w-full flex-col overflow-hidden bg-primary text-primary"
                        style={{ transformOrigin: "50% 100%" }}
                        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 64, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1, transition: reduce ? { duration: 0.25 } : { duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: 0.08 } }}
                        exit={{ opacity: 0, y: reduce ? 0 : 56, scale: reduce ? 1 : 0.98, transition: { duration: 0.42, ease: [0.7, 0, 0.84, 0] } }}
                    >
                        {/* Faixa de marca sutil no topo (textura, sem fundo preto) */}
                        <BgTexture background={gradientCss(HERO_VIBE, 150)} className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-40 opacity-15" />

                    {/* 3) Conteúdo do chat */}
                    <motion.div
                        className="flex h-full min-h-0 flex-col"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1, transition: reduce ? { duration: 0.2 } : { duration: 0.3, delay: 0.34 } }}
                        exit={{ opacity: 0, transition: { duration: 0.15 } }}
                    >
                    {/* Topo */}
                    <div className="relative mx-auto flex w-full max-w-6xl items-center justify-between px-5 pt-6 lg:px-8">
                        <span className="flex items-center gap-2 text-sm font-semibold tracking-[0.14em] text-tertiary uppercase">
                            <Zap className="size-4 text-brand-secondary" /> Descobrir
                        </span>
                        <button
                            type="button"
                            onClick={closeSearch}
                            aria-label="Fechar busca"
                            className="flex size-10 items-center justify-center rounded-full bg-secondary text-secondary transition hover:bg-secondary_hover"
                        >
                            <XClose className="size-5" />
                        </button>
                    </div>

                    {/* Conversa */}
                    <div className="relative mx-auto flex w-full max-w-6xl min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 py-8 [scrollbar-width:none] lg:px-8 [&::-webkit-scrollbar]:hidden">
                        {log.map((m, i) => (
                            <Bolha key={i} role={m.role} reduce={reduce}>
                                {m.texto}
                            </Bolha>
                        ))}

                        {/* Menu de experiências (intenção inicial) */}
                        {resultados === null && pergunta === null && (
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
                                        className="rounded-full border border-secondary bg-secondary px-4 py-2 text-sm font-medium text-secondary transition hover:bg-secondary_hover"
                                    >
                                        {exp.label}
                                    </button>
                                ))}
                            </motion.div>
                        )}

                        {/* Refino 1 — quando */}
                        {pergunta === "periodo" && (
                            <Chips reduce={reduce} opts={PERIODOS} onPick={responderPeriodo} />
                        )}

                        {/* Refino 2 — orçamento */}
                        {pergunta === "preco" && (
                            <Chips reduce={reduce} opts={PRECOS} onPick={responderPreco} />
                        )}

                        {/* Resultados */}
                        {resultados && resultados.length > 0 && (
                            <motion.div
                                ref={resRef}
                                initial={reduce ? false : { opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                                className="flex scroll-mt-24 flex-col gap-5 pl-11"
                            >
                                <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                                    {resultados.map((e) => (
                                        <EventCard key={e.id} evento={e} />
                                    ))}
                                </div>
                                <button
                                    type="button"
                                    onClick={recomeçar}
                                    className="flex w-fit items-center gap-2 rounded-full border border-secondary bg-secondary px-4 py-2 text-sm font-semibold text-secondary transition hover:bg-secondary_hover"
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
                                        className="rounded-full border border-secondary bg-secondary px-4 py-2 text-sm font-medium text-secondary transition hover:bg-secondary_hover"
                                    >
                                        {exp.label}
                                    </button>
                                ))}
                            </div>
                        )}

                        <div ref={fimRef} />
                    </div>

                    {/* Composer */}
                    <div className="relative mx-auto w-full max-w-3xl px-5 pb-7 lg:px-8">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                enviarTexto();
                            }}
                            className="flex items-center gap-3 rounded-2xl border border-secondary bg-secondary px-4 py-3 focus-within:border-brand"
                        >
                            <input
                                value={texto}
                                onChange={(e) => setTexto(e.target.value)}
                                placeholder="Ou diga o que procura: artista, local, vibe…"
                                aria-label="Buscar"
                                className="w-full bg-transparent text-md font-medium text-primary outline-none placeholder:text-placeholder"
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
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

function Chips({ opts, onPick, reduce }: { opts: Opt[]; onPick: (o: Opt) => void; reduce: boolean | null }) {
    return (
        <motion.div
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="flex flex-wrap gap-2 pl-11"
        >
            {opts.map((o) => (
                <button
                    key={o.id}
                    type="button"
                    onClick={() => onPick(o)}
                    className="rounded-full border border-secondary bg-secondary px-4 py-2 text-sm font-medium text-secondary transition hover:border-brand hover:bg-secondary_hover"
                >
                    {o.label}
                </button>
            ))}
        </motion.div>
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
                    bot ? "rounded-bl-sm bg-secondary text-primary" : "rounded-br-sm bg-brand-solid text-white",
                )}
            >
                {children}
            </span>
        </motion.div>
    );
}
