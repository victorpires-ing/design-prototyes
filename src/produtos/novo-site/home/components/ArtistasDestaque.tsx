import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Avatar } from "@/components/base/avatar/avatar";
import { cx } from "@/utils/cx";
import { ARTISTAS, getEvento, type EventoMock } from "../data/events";

const EVENT_HREF = "/novo-site/home/event-details";

const initials = (nome: string) =>
    nome
        .split(/\s+/)
        .slice(0, 2)
        .map((p) => p[0])
        .join("")
        .toUpperCase();

/**
 * Artistas em destaque — seleção por SCROLL: conforme a página rola, o artista
 * cujo nome está mais próximo da linha focal da viewport fica selecionado,
 * exibindo avatar à esquerda e até 3 banners de evento clicáveis. Os demais
 * ficam só com o nome.
 */
export function ArtistasDestaque() {
    const reduce = useReducedMotion();
    const [ativo, setAtivo] = useState(0);
    const rowsRef = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
        let raf = 0;
        const onScroll = () => {
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(() => {
                const focal = window.innerHeight * 0.42;
                let best = 0;
                let bestDist = Infinity;
                rowsRef.current.forEach((el, idx) => {
                    if (!el) return;
                    const r = el.getBoundingClientRect();
                    const center = r.top + r.height / 2;
                    const dist = Math.abs(center - focal);
                    if (dist < bestDist) {
                        bestDist = dist;
                        best = idx;
                    }
                });
                setAtivo(best);
            });
        };
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll);
        return () => {
            window.removeEventListener("scroll", onScroll);
            window.removeEventListener("resize", onScroll);
            cancelAnimationFrame(raf);
        };
    }, []);

    return (
        <section className="flex flex-col gap-6">
            <div className="flex flex-col gap-1">
                <h2 className="text-display-xs font-extrabold tracking-tight text-primary uppercase lg:text-display-sm">Artistas em destaque</h2>
                <p className="text-sm text-tertiary">Role para descobrir quem tá com data marcada</p>
            </div>

            <div className="flex flex-col">
                {ARTISTAS.map((artista, idx) => {
                    const selecionado = idx === ativo;
                    const eventos = artista.eventos.map(getEvento).filter(Boolean).slice(0, 3) as EventoMock[];
                    return (
                        <div
                            key={artista.nome}
                            ref={(el) => {
                                rowsRef.current[idx] = el;
                            }}
                            className="border-b border-secondary py-5 lg:py-7"
                        >
                            {/* Nome + avatar */}
                            <div className="flex items-center gap-4 lg:gap-6">
                                <AnimatePresence initial={false}>
                                    {selecionado && (
                                        <motion.div
                                            key="avatar"
                                            initial={reduce ? { opacity: 0 } : { opacity: 0, width: 0, scale: 0.5 }}
                                            animate={reduce ? { opacity: 1 } : { opacity: 1, width: "auto", scale: 1 }}
                                            exit={reduce ? { opacity: 0 } : { opacity: 0, width: 0, scale: 0.5 }}
                                            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                                            className="shrink-0 overflow-hidden"
                                        >
                                            <Avatar size="2xl" src={artista.avatar} alt={artista.nome} initials={initials(artista.nome)} />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                <h3
                                    className={cx(
                                        "text-3xl leading-[1] font-extrabold tracking-tight uppercase transition-colors duration-300 lg:text-display-lg",
                                        selecionado ? "text-primary" : "text-quaternary",
                                    )}
                                >
                                    {artista.nome}
                                </h3>
                            </div>

                            {/* Banners de eventos (só quando selecionado) */}
                            <AnimatePresence initial={false}>
                                {selecionado && (
                                    <motion.div
                                        key="banners"
                                        initial={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
                                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                                        className="overflow-hidden"
                                    >
                                        <div className="flex flex-wrap gap-3 pt-5 lg:pl-[6.5rem]">
                                            {eventos.map((e, i) => (
                                                <motion.a
                                                    key={e.id}
                                                    href={`${EVENT_HREF}?ev=${e.id}`}
                                                    initial={reduce ? false : { opacity: 0, y: 12 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1], delay: 0.08 + i * 0.06 }}
                                                    className="group flex w-[calc(50%-0.375rem)] flex-col gap-2 sm:w-36 lg:w-40"
                                                >
                                                    <div className="aspect-[3/4] w-full overflow-hidden rounded-xl ring-1 ring-border-secondary">
                                                        <img
                                                            src={e.cover ?? `https://picsum.photos/seed/${e.seed}/400/520`}
                                                            alt={e.titulo}
                                                            loading="lazy"
                                                            className="size-full object-cover transition duration-500 group-hover:scale-105"
                                                        />
                                                    </div>
                                                    {/* Texto sempre fora da imagem */}
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="text-xs font-semibold text-tertiary uppercase">{e.dataLabel} · {e.cidade}</span>
                                                        <span className="line-clamp-1 text-sm font-bold text-primary">{e.titulo}</span>
                                                    </div>
                                                </motion.a>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
