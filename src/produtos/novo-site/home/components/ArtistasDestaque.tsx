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

// Quanto de scroll cada artista "segura" (em vh). Maior = scroll mais pesado.
const STEP_VH = 85;

// Adjetivos da marca — tags sólidas que surgem no hover (cores isoladas das famílias).
const ADJETIVOS = [
    { label: "Ao vivo", color: "#FF271A" },
    { label: "Arrepiante", color: "#7F56D9" },
    { label: "Eletrizante", color: "#0095FF" },
    { label: "Inesquecível", color: "#EFB926" },
    { label: "Impressionante", color: "#EA3B7A" },
];

/**
 * Artistas em destaque — a seção FIXA (sticky) e o scroll fica "pesado": cada
 * artista ocupa um trecho de scroll (STEP_VH), avançando o artista ativo de
 * forma deliberada. Layout em lista: o ativo ganha avatar + banners; os demais
 * ficam só com o nome.
 */
export function ArtistasDestaque() {
    const reduce = useReducedMotion();
    const N = ARTISTAS.length;
    const wrapRef = useRef<HTMLDivElement>(null);
    const [ativo, setAtivo] = useState(0);

    useEffect(() => {
        let raf = 0;
        const onScroll = () => {
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(() => {
                const el = wrapRef.current;
                if (!el) return;
                const rect = el.getBoundingClientRect();
                const total = el.offsetHeight - window.innerHeight; // distância rolável dentro do pin
                const scrolled = Math.min(Math.max(-rect.top, 0), Math.max(total, 1));
                const p = total > 0 ? scrolled / total : 0;
                setAtivo(Math.min(N - 1, Math.max(0, Math.round(p * (N - 1)))));
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
    }, [N]);

    // Clique = pula direto para a âncora daquele artista (scroll instantâneo, não
    // "anda de um em um"). Marca o ativo na hora pra feedback imediato.
    const irPara = (idx: number) => {
        const el = wrapRef.current;
        if (!el || N < 2) return;
        const total = Math.max(el.offsetHeight - window.innerHeight, 0);
        const top = el.getBoundingClientRect().top + window.scrollY + (idx / (N - 1)) * total;
        setAtivo(idx);
        window.scrollTo({ top, behavior: "auto" });
    };

    return (
        <section ref={wrapRef} className="relative" style={{ height: `${N * STEP_VH}vh` }}>
            <div className="sticky top-0 flex h-screen flex-col justify-center">
                {ARTISTAS.map((artista, idx) => {
                    const selecionado = idx === ativo;
                    const eventos = artista.eventos.map(getEvento).filter(Boolean).slice(0, 3) as EventoMock[];
                    return (
                        <div key={artista.nome} className="border-b border-secondary py-5 lg:py-6">
                            {/* Nome + avatar — clique vai até a âncora; hover revela adjetivos */}
                            <button type="button" onClick={() => irPara(idx)} className="group flex w-full items-center gap-4 text-left lg:gap-6">
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
                                            {artista.avatars && artista.avatars.length > 1 ? (
                                                <div className="flex -space-x-6">
                                                    {artista.avatars.map((src, i) => (
                                                        <span key={i} className="rounded-full bg-primary p-0.5">
                                                            <Avatar size="2xl" src={src} alt={artista.nome} />
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <Avatar size="2xl" src={artista.avatar} alt={artista.nome} initials={initials(artista.nome)} />
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                <span className="relative">
                                    <h3
                                        className={cx(
                                            "text-3xl leading-[1] font-extrabold tracking-tight uppercase transition-colors duration-300 lg:text-display-lg",
                                            selecionado ? "text-primary" : "text-quaternary",
                                        )}
                                    >
                                        {artista.nome}
                                    </h3>
                                    {/* Tag de adjetivo — uma só, sólida, sobreposta ao nome, surge no hover */}
                                    <span
                                        className="pointer-events-none absolute -bottom-2 left-[18%] -rotate-3 rounded-md px-2.5 py-1 text-xs font-extrabold tracking-wide text-white uppercase opacity-0 shadow-lg transition-all duration-200 group-hover:rotate-0 group-hover:opacity-100"
                                        style={{ backgroundColor: ADJETIVOS[idx % ADJETIVOS.length].color }}
                                    >
                                        {ADJETIVOS[idx % ADJETIVOS.length].label}
                                    </span>
                                </span>
                            </button>

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
                                                        <span className="text-xs font-semibold text-tertiary uppercase">
                                                            {e.dataLabel} · {e.cidade}
                                                        </span>
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
