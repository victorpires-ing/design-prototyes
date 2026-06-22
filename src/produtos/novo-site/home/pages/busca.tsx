import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { SearchLg, XClose } from "@untitledui/icons";
import { cx } from "@/utils/cx";
import { getFamily, gradientCss } from "../../components/gradient-families";
import { BgTexture } from "../components/BgTexture";
import { EventCard } from "../components/EventCard";
import { CATEGORIAS, EVENTOS, type EventoMock } from "../data/events";
import { CIDADES, useCidade } from "../data/cidade-store";

const HERO_VIBE = getFamily("high-tempo");
const KINETIC_WORDS = ["artistas", "festivais", "seu time", "o rolê de hoje", "shows", "experiências"];
const POPULARES = ["Techno", "Sertanejo", "Maracanã", "Open bar", "Candlelight", "Trap", "Reggae"];

function matches(e: EventoMock, q: string): boolean {
    const hay = [e.titulo, e.artista ?? "", e.local, e.cidade, e.categoria, ...e.tags].join(" ").toLowerCase();
    return q
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean)
        .every((t) => hay.includes(t));
}

export function Busca() {
    const reduce = useReducedMotion();
    const cidade = useCidade();
    const [query, setQuery] = useState("");
    const [soNaCidade, setSoNaCidade] = useState(false);
    const [palavra, setPalavra] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => inputRef.current?.focus(), []);

    // Placeholder cinético (tipografia em movimento).
    useEffect(() => {
        if (reduce) return;
        const id = setInterval(() => setPalavra((p) => (p + 1) % KINETIC_WORDS.length), 2200);
        return () => clearInterval(id);
    }, [reduce]);

    const resultados = useMemo(() => {
        let list = EVENTOS;
        if (soNaCidade) list = list.filter((e) => e.cidade === cidade);
        if (query.trim()) list = list.filter((e) => matches(e, query));
        return [...list].sort((a, b) => Number(b.patrocinado) - Number(a.patrocinado) || b.popularidade - a.popularidade);
    }, [query, soNaCidade, cidade]);

    const buscando = query.trim().length > 0;

    return (
        <div className="relative min-h-screen bg-[#0c0c10] text-white">
            {/* Fundo cimático imersivo */}
            <BgTexture background={gradientCss(HERO_VIBE, 150)} className="pointer-events-none fixed inset-0 opacity-50" />
            <div aria-hidden className="pointer-events-none fixed inset-0 bg-gradient-to-b from-black/40 via-black/60 to-[#0c0c10]" />

            <div className="relative mx-auto flex min-h-screen max-w-5xl flex-col px-5 pt-6 pb-24 lg:px-8">
                {/* Topo: fechar */}
                <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold tracking-[0.18em] text-white/60 uppercase">Buscar</span>
                    <a
                        href="/novo-site/home"
                        aria-label="Fechar busca"
                        className="flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                    >
                        <XClose className="size-5" />
                    </a>
                </div>

                {/* Campo gigante */}
                <div className="mt-10 lg:mt-16">
                    <div className="flex items-center gap-4 border-b-2 border-white/25 pb-4 focus-within:border-white">
                        <SearchLg className="size-7 shrink-0 text-white/70 lg:size-9" />
                        <input
                            ref={inputRef}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="w-full bg-transparent text-2xl font-bold tracking-tight text-white outline-none placeholder:text-white/30 lg:text-display-sm"
                            placeholder="Busque por…"
                            aria-label="Buscar eventos"
                        />
                        {query && (
                            <button type="button" onClick={() => setQuery("")} aria-label="Limpar" className="text-white/50 hover:text-white">
                                <XClose className="size-6" />
                            </button>
                        )}
                    </div>
                    {/* Placeholder cinético quando vazio */}
                    {!buscando && (
                        <div className="mt-4 flex items-center gap-2 text-lg text-white/55 lg:text-xl">
                            <span>Procure por</span>
                            <span className="relative inline-block h-7 overflow-hidden">
                                <AnimatePresence mode="wait">
                                    <motion.span
                                        key={palavra}
                                        initial={reduce ? false : { y: "100%", opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        exit={reduce ? undefined : { y: "-100%", opacity: 0 }}
                                        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                                        className="inline-block font-bold text-white"
                                    >
                                        {KINETIC_WORDS[palavra]}
                                    </motion.span>
                                </AnimatePresence>
                            </span>
                        </div>
                    )}
                </div>

                {/* Filtro de cidade */}
                <div className="mt-6 flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setSoNaCidade((v) => !v)}
                        className={cx(
                            "rounded-full px-4 py-2 text-sm font-semibold transition",
                            soNaCidade ? "bg-white text-black" : "bg-white/10 text-white hover:bg-white/20",
                        )}
                    >
                        {soNaCidade ? `Em ${cidade}` : "Em qualquer cidade"}
                    </button>
                    {CIDADES.includes(cidade) && <span className="text-sm text-white/40">{resultados.length} resultados</span>}
                </div>

                {/* Conteúdo */}
                {!buscando ? (
                    <div className="mt-12 flex flex-col gap-10">
                        <Bloco titulo="Buscas populares">
                            <div className="flex flex-wrap gap-2">
                                {POPULARES.map((p) => (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => setQuery(p)}
                                        className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white/85 transition hover:border-white/40 hover:bg-white/10"
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </Bloco>
                        <Bloco titulo="Explorar por categoria">
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                {CATEGORIAS.map((c) => (
                                    <button
                                        key={c.id}
                                        type="button"
                                        onClick={() => setQuery(c.label.split(" ")[0])}
                                        className="group relative flex h-24 flex-col justify-end overflow-hidden rounded-xl p-3 text-left ring-1 ring-white/10"
                                    >
                                        <div aria-hidden className="absolute inset-0 opacity-80 transition group-hover:opacity-100" style={{ backgroundImage: gradientCss(getFamily(c.vibe), 145) }} />
                                        <div aria-hidden className="absolute inset-0 bg-black/35" />
                                        <c.icon className="relative size-5 text-white" />
                                        <span className="relative mt-1 text-sm font-bold text-white">{c.label}</span>
                                    </button>
                                ))}
                            </div>
                        </Bloco>
                    </div>
                ) : resultados.length > 0 ? (
                    <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
                        {resultados.map((e, i) => (
                            <motion.div
                                key={e.id}
                                initial={reduce ? false : { opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: Math.min(i * 0.03, 0.3) }}
                            >
                                <EventCard evento={e} />
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="mt-16 flex flex-col items-center gap-5 text-center">
                        <span className="grid size-16 place-items-center rounded-full bg-white/10">
                            <SearchLg className="size-7 text-white/60" />
                        </span>
                        <p className="max-w-md text-lg font-semibold text-white">
                            Nada para “{query}”. Mas a vibe não para — tenta uma dessas:
                        </p>
                        <div className="flex flex-wrap justify-center gap-2">
                            {POPULARES.slice(0, 5).map((p) => (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => setQuery(p)}
                                    className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white/85 transition hover:bg-white/10"
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function Bloco({ titulo, children }: { titulo: string; children: React.ReactNode }) {
    return (
        <section className="flex flex-col gap-4">
            <h2 className="text-sm font-bold tracking-[0.14em] text-white/55 uppercase">{titulo}</h2>
            {children}
        </section>
    );
}
