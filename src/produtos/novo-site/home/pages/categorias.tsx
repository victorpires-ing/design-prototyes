import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { FilterLines, XClose } from "@untitledui/icons";
import { cx } from "@/utils/cx";
import { getFamily, gradientCss } from "../../components/gradient-families";
import { BgTexture } from "../components/BgTexture";
import { EventCard } from "../components/EventCard";
import { Footer, HeaderNav } from "../components/SiteChrome";
import { CATEGORIAS, EVENTOS, categoriaCover, getCategoria, type CategoriaId } from "../data/events";
import { CIDADES, useCidade } from "../data/cidade-store";

type Ordenacao = "popular" | "data" | "preco";
const ORDENS: { id: Ordenacao; label: string }[] = [
    { id: "popular", label: "Mais populares" },
    { id: "data", label: "Mais próximos" },
    { id: "preco", label: "Menor preço" },
];

export function Categorias() {
    const cidadeAtual = useCidade();
    const reduce = useReducedMotion();
    const [categoria, setCategoria] = useState<CategoriaId | "todas">("todas");
    const [tags, setTags] = useState<string[]>([]);
    const [soNaCidade, setSoNaCidade] = useState(false);
    const [ordem, setOrdem] = useState<Ordenacao>("popular");
    const [showTags, setShowTags] = useState(false);

    const familyAtual = getFamily(categoria === "todas" ? "communal" : getCategoria(categoria).vibe);

    // Folksonomia: tags disponíveis conforme a categoria selecionada.
    const tagsDisponiveis = useMemo(() => {
        const base = categoria === "todas" ? EVENTOS : EVENTOS.filter((e) => e.categoria === categoria);
        return [...new Set(base.flatMap((e) => e.tags))].sort();
    }, [categoria]);

    const eventos = useMemo(() => {
        let list = EVENTOS;
        if (categoria !== "todas") list = list.filter((e) => e.categoria === categoria);
        if (soNaCidade) list = list.filter((e) => e.cidade === cidadeAtual);
        if (tags.length) list = list.filter((e) => tags.every((t) => e.tags.includes(t))); // E lógico
        const sorted = [...list];
        if (ordem === "popular") sorted.sort((a, b) => b.popularidade - a.popularidade);
        if (ordem === "data") sorted.sort((a, b) => +new Date(a.data) - +new Date(b.data));
        if (ordem === "preco") sorted.sort((a, b) => a.preco - b.preco);
        return sorted;
    }, [categoria, tags, soNaCidade, cidadeAtual, ordem]);

    const toggleTag = (t: string) => setTags((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));

    return (
        <div className="min-h-screen bg-primary text-primary">
            <HeaderNav />

            {/* Hero da categoria — imagem real vestida pela vibe */}
            <section className="relative isolate overflow-hidden bg-[#101016]">
                <img
                    src={categoria === "todas" ? categoriaCover("eletronica") : categoriaCover(categoria)}
                    alt=""
                    aria-hidden
                    className="absolute inset-0 -z-20 size-full object-cover"
                />
                <BgTexture background={gradientCss(familyAtual, 150)} className="absolute inset-0 -z-10 opacity-45 mix-blend-soft-light" />
                <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-[#101016] via-black/70 to-black/50" />
                <div aria-hidden className="absolute inset-x-0 top-0 -z-10 h-1.5" style={{ background: gradientCss(familyAtual, 90) }} />
                <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 pt-16 pb-10 text-white lg:px-8 lg:pt-24">
                    <span className="text-sm font-semibold tracking-[0.2em] text-white/70 uppercase">Explorar</span>
                    <h1 className="text-display-sm font-extrabold tracking-tight uppercase lg:text-display-lg">
                        {categoria === "todas" ? "Todos os eventos" : getCategoria(categoria).label}
                    </h1>
                    <p className="text-sm text-white/75">Combine categorias e tags para achar exatamente a sua vibe.</p>
                </div>
            </section>

            <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 lg:px-8">
                {/* Categorias (tabs) */}
                <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <Chip ativo={categoria === "todas"} onClick={() => { setCategoria("todas"); setTags([]); }}>
                        Todas
                    </Chip>
                    {CATEGORIAS.map((c) => (
                        <Chip key={c.id} ativo={categoria === c.id} onClick={() => { setCategoria(c.id); setTags([]); }}>
                            <c.icon className="size-4" />
                            {c.label}
                        </Chip>
                    ))}
                </div>

                {/* Barra de filtros enxuta — descoberta primeiro, tags sob demanda */}
                <div className="flex flex-col gap-3 border-y border-secondary py-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setShowTags((v) => !v)}
                                className={cx(
                                    "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition",
                                    showTags || tags.length ? "bg-primary-solid text-white" : "bg-secondary text-secondary hover:bg-secondary_hover",
                                )}
                            >
                                <FilterLines className="size-4" />
                                Filtrar por tag{tags.length > 0 && ` · ${tags.length}`}
                            </button>
                            <button
                                type="button"
                                onClick={() => setSoNaCidade((v) => !v)}
                                className={cx(
                                    "rounded-full px-4 py-2 text-sm font-semibold transition",
                                    soNaCidade ? "bg-primary-solid text-white" : "bg-secondary text-secondary hover:bg-secondary_hover",
                                )}
                            >
                                {soNaCidade && CIDADES.includes(cidadeAtual) ? `Só em ${cidadeAtual}` : "Todas as cidades"}
                            </button>
                            {/* Tags ativas como chips removíveis (sempre visíveis) */}
                            {tags.map((t) => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => toggleTag(t)}
                                    className="flex items-center gap-1 rounded-full bg-brand-solid px-3 py-1.5 text-sm font-medium text-white"
                                >
                                    #{t}
                                    <XClose className="size-3.5" />
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-tertiary">{eventos.length} eventos</span>
                            <select
                                value={ordem}
                                onChange={(e) => setOrdem(e.target.value as Ordenacao)}
                                className="rounded-lg border border-secondary bg-primary px-3 py-2 text-sm font-medium text-secondary outline-none"
                            >
                                {ORDENS.map((o) => (
                                    <option key={o.id} value={o.id}>
                                        {o.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Painel de tags — só quando aberto */}
                    <AnimatePresence initial={false}>
                        {showTags && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                                className="overflow-hidden"
                            >
                                <div className="flex flex-wrap gap-2 pt-1">
                                    {tagsDisponiveis.map((t) => {
                                        const ativo = tags.includes(t);
                                        return (
                                            <button
                                                key={t}
                                                type="button"
                                                onClick={() => toggleTag(t)}
                                                className={cx(
                                                    "rounded-full px-3 py-1.5 text-sm font-medium transition",
                                                    ativo ? "bg-brand-solid text-white" : "bg-secondary text-secondary hover:bg-secondary_hover",
                                                )}
                                            >
                                                #{t}
                                            </button>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Grid */}
                {eventos.length > 0 ? (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                        {eventos.map((e, i) => (
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
                    <div className="flex flex-col items-center gap-4 py-20 text-center">
                        <p className="max-w-md text-lg font-semibold text-primary">Nenhum evento com esses filtros.</p>
                        <button
                            type="button"
                            onClick={() => { setTags([]); setSoNaCidade(false); }}
                            className="rounded-full bg-secondary px-5 py-2.5 text-sm font-semibold text-secondary transition hover:bg-secondary_hover"
                        >
                            Limpar filtros
                        </button>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}

function Chip({ ativo, onClick, children }: { ativo: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cx(
                "flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap transition",
                ativo ? "bg-primary-solid text-white" : "bg-secondary text-secondary hover:bg-secondary_hover",
            )}
        >
            {children}
        </button>
    );
}
