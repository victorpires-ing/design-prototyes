import { useMemo, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, Stars01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { getFamily, gradientCss } from "../../components/gradient-families";
import { ArtistasDestaque } from "../components/ArtistasDestaque";
import { EventCard } from "../components/EventCard";
import { FeaturedStage } from "../components/FeaturedStage";
import { Reveal } from "../components/Reveal";
import { Footer, HeaderNav } from "../components/SiteChrome";
import { CATEGORIAS, DESTAQUES, EVENTOS } from "../data/events";
import { openSearch } from "../data/search-store";

// Atalhos de experiência (abrem a conversa já nessa vibe).
const OPCOES = [
    { id: "noite", label: "Hoje à noite" },
    { id: "dois", label: "A dois" },
    { id: "galera", label: "Com a galera" },
    { id: "cultural", label: "Algo cultural" },
    { id: "gratis", label: "De graça" },
];

export function Home() {
    const emAlta = useMemo(
        () => [...EVENTOS].sort((a, b) => Number(b.patrocinado) - Number(a.patrocinado) || b.popularidade - a.popularidade).slice(0, 8),
        [],
    );

    return (
        <div className="min-h-screen bg-primary text-primary">
            <HeaderNav />

            {/* Hero — descoberta à esquerda, palco à direita */}
            <section className="border-b border-secondary">
                <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-16">
                    {/* Esquerda: descoberta */}
                    <div className="order-2 flex flex-col gap-7 lg:order-1">
                        <div className="flex flex-col gap-3">
                            <span className="text-sm font-semibold tracking-[0.22em] text-tertiary uppercase">Experiências de outro nível</span>
                            <h1 className="text-display-md leading-[0.95] font-extrabold tracking-tight text-primary uppercase lg:text-display-xl">
                                O que você
                                <br />
                                vai viver hoje?
                            </h1>
                        </div>
                        {/* Caixa de busca → conversa de descoberta */}
                        <div className="flex flex-col gap-3">
                            <button
                                type="button"
                                onClick={() => openSearch()}
                                className="group flex w-full items-center gap-4 rounded-2xl border border-secondary bg-secondary/60 px-5 py-4 text-left transition hover:border-brand hover:bg-secondary"
                            >
                                <Stars01 className="size-6 shrink-0 text-brand-secondary" />
                                <span className="flex-1 text-md font-medium text-tertiary">O que você quer viver? Busque ou escolha uma vibe…</span>
                                <span className="hidden rounded-lg bg-brand-solid px-4 py-2 text-sm font-bold text-white sm:block">Descobrir</span>
                            </button>
                            <div className="flex flex-wrap gap-2">
                                {OPCOES.map((o) => (
                                    <button
                                        key={o.id}
                                        type="button"
                                        onClick={() => openSearch(o.id)}
                                        className="rounded-full border border-secondary bg-secondary px-4 py-2 text-sm font-semibold text-secondary transition hover:bg-secondary_hover"
                                    >
                                        {o.label}
                                    </button>
                                ))}
                            </div>
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
                            {CATEGORIAS.map((c) => (
                                <CategoriaTile key={c.id} categoria={c} />
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

function CategoriaTile({ categoria }: { categoria: (typeof CATEGORIAS)[number] }) {
    const family = getFamily(categoria.vibe);
    return (
        <a
            href="/novo-site/home/categorias"
            className="group relative flex flex-col gap-6 justify-between overflow-hidden rounded-2xl p-4 ring-1 ring-border-secondary"
            style={{ background: gradientCss(family, 150) }}
        >
            {/* Topo: ícone à esquerda, tag à direita */}
            <div className="relative flex items-start justify-between">
                <categoria.icon className="size-6 text-white" />
                <span className="text-xs font-extrabold tracking-[0.18em] text-white/80 uppercase">Vibe</span>
            </div>
            {/* 3 fotos circulares dos artistas, sobrepostas */}
            <div className="relative flex flex-1 items-center justify-center">
                <div className="flex -space-x-5">
                    {[0, 1, 2].map((i) => (
                        <img
                            key={i}
                            src={`https://picsum.photos/seed/${categoria.id}-art${i}/160/160`}
                            alt=""
                            aria-hidden
                            loading="lazy"
                            className="size-16 rounded-full object-cover shadow-lg ring-2 ring-white/30 transition group-hover:-translate-y-0.5 lg:size-20"
                        />
                    ))}
                </div>
            </div>
            {/* Nome dentro do tile */}
            <span className="relative text-xl font-extrabold tracking-tight text-white lg:text-2xl">{categoria.label}</span>
        </a>
    );
}
