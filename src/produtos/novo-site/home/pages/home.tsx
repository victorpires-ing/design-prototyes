import { useMemo, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";
import { getFamily, meshCss } from "../../components/gradient-families";
import { ArtistasDestaque } from "../components/ArtistasDestaque";
import { EventCard } from "../components/EventCard";
import { FeaturedStage } from "../components/FeaturedStage";
import { Reveal } from "../components/Reveal";
import { Footer, HeaderNav } from "../components/SiteChrome";
import { CATEGORIAS, DESTAQUES, EVENTOS, VIBE_IMAGES } from "../data/events";
import { openSearch } from "../data/search-store";

// Atalhos de experiência (abrem a conversa já nessa vibe).
// Foco em identificação/momento de vida — não no "hoje".
const OPCOES = [
    { id: "bombando", label: "Algo imperdível" },
    { id: "dois", label: "Um momento a dois" },
    { id: "galera", label: "Uma noite com a galera" },
    { id: "cultural", label: "Uma imersão cultural" },
    { id: "esporte", label: "Esporte ao vivo" },
    { id: "futebol", label: "Futebol no estádio" },
    { id: "gratis", label: "Algo de graça" },
];

export function Home() {
    const reduce = useReducedMotion();
    const emAlta = useMemo(
        () => [...EVENTOS].sort((a, b) => Number(b.patrocinado) - Number(a.patrocinado) || b.popularidade - a.popularidade).slice(0, 8),
        [],
    );



    return (
        <div className="min-h-screen bg-primary text-primary">
            <HeaderNav />

            {/* Banner — headline "viva" à esquerda + palco (carrossel) à direita */}
            <section className="relative overflow-hidden border-b border-secondary bg-primary">
                <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-16">
                    {/* Esquerda: voz + atalhos */}
                    <div className="order-2 flex flex-col gap-8 lg:order-1">
                        <h1 className="text-[clamp(2.75rem,8vw,5.75rem)] leading-[0.82] font-extrabold tracking-tight text-primary uppercase">
                            <span className="block overflow-hidden pb-[0.06em]">
                                <motion.span
                                    className="block"
                                    initial={reduce ? false : { y: "115%" }}
                                    animate={{ y: 0 }}
                                    transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
                                >
                                    O que você
                                </motion.span>
                            </span>
                            <span className="block overflow-hidden pb-[0.06em] text-brand-secondary">
                                <motion.span
                                    className="block"
                                    initial={reduce ? false : { y: "115%" }}
                                    animate={{ y: 0 }}
                                    transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                                >
                                    quer viver?
                                </motion.span>
                            </span>
                        </h1>

                        {/* Atalhos de descoberta — abrem a conversa já na vibe */}
                        <div className="flex flex-wrap gap-2">
                            {OPCOES.map((o) => (
                                <button
                                    key={o.id}
                                    type="button"
                                    onClick={() => openSearch(o.id)}
                                    className="rounded-full border border-secondary bg-secondary px-3.5 py-1.5 text-sm font-semibold text-secondary transition hover:border-brand hover:bg-secondary_hover"
                                >
                                    {o.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Direita: palco */}
                    <div className="order-1 lg:order-2">
                        <FeaturedStage eventos={DESTAQUES} />
                    </div>
                </div>
            </section>

            <main className="mx-auto flex w-full max-w-7xl flex-col gap-16 px-4 py-14 lg:gap-24 lg:px-8 lg:py-20">
                {/* Nossas recomendações — grade, sem scroll horizontal */}
                <Reveal>
                    <Secao titulo="Nossas recomendações" sub="Escolhidos pra você" onMais={openSearch}>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
                            {emAlta.map((e) => (
                                <EventCard key={e.id} evento={e} />
                            ))}
                        </div>
                    </Secao>
                </Reveal>

                {/* Artistas em destaque — seleção por scroll (sticky, sem Reveal: transform quebra sticky) */}
                <ArtistasDestaque />

                {/* Explore por vibe — imagery + textura, sem gradiente chapado */}
                <Reveal>
                    <Secao titulo="Explore por vibe" sub="Cada energia, um universo">
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                            {CATEGORIAS.map((c, i) => (
                                <CategoriaTile key={c.id} categoria={c} index={i} />
                            ))}
                        </div>
                    </Secao>
                </Reveal>

            </main>

            <Footer />
        </div>
    );
}

/* ------------------------------------------------------------------ */

function Secao({ titulo, sub, onMais, children }: { titulo: string; sub?: string; onMais?: () => void; children: ReactNode }) {
    return (
        <section className="flex flex-col gap-5">
            <div className="flex items-end justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <h2 className="text-display-xs font-extrabold tracking-tight text-primary uppercase lg:text-display-sm">{titulo}</h2>
                    {sub && <p className="text-sm text-tertiary">{sub}</p>}
                </div>
                {onMais && (
                    <Button onClick={onMais} size="sm" color="link-color" iconTrailing={ArrowRight} className="shrink-0">
                        Ver tudo
                    </Button>
                )}
            </div>
            {children}
        </section>
    );
}

function CategoriaTile({ categoria, index = 0 }: { categoria: (typeof CATEGORIAS)[number]; index?: number }) {
    const family = getFamily(categoria.vibe);
    return (
        <a
            href="/novo-site/home/categorias"
            className="group relative flex flex-col gap-6 justify-between overflow-hidden rounded-2xl p-4 ring-1 ring-border-secondary"
            style={{ background: meshCss(family, index) }}
        >
            {/* Topo: ícone à esquerda, tag à direita */}
            <div className="relative flex items-start justify-between">
                <categoria.icon className="size-6 text-white" />
                <span className="text-xs font-extrabold tracking-[0.18em] text-white/80 uppercase">Vibe</span>
            </div>
            {/* fotos circulares de artistas (ou escudos) que casam com a vibe */}
            <div className="relative flex flex-1 items-center justify-center">
                <div className="flex -space-x-5">
                    {VIBE_IMAGES[categoria.id].map((src, i) => (
                        <img
                            key={i}
                            src={src}
                            alt=""
                            aria-hidden
                            loading="lazy"
                            className={cx(
                                "size-16 rounded-full shadow-lg ring-2 ring-white/30 transition group-hover:-translate-y-0.5 lg:size-20",
                                categoria.id === "esportes" ? "bg-white object-contain p-2" : "object-cover",
                            )}
                        />
                    ))}
                </div>
            </div>
            {/* Nome dentro do tile */}
            <span className="relative text-xl font-extrabold tracking-tight text-white lg:text-2xl">{categoria.label}</span>
        </a>
    );
}
