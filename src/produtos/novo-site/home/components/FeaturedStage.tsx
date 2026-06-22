import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cx } from "@/utils/cx";
import { getFamily, gradientCss } from "../../components/gradient-families";
import { coverUrl, type EventoMock } from "../data/events";

const DURACAO = 6500; // ms por destaque
const EVENT_HREF = "/novo-site/home/event-details";
const square = (e: EventoMock) => e.cover ?? coverUrl(e.seed, 900, 900);

/**
 * Palco — pôster QUADRADO passando (crossfade) com o indicador de etapa abaixo,
 * envolto por um brilho na cor/vibe do evento. Pensado para a coluna do hero.
 */
export function FeaturedStage({ eventos }: { eventos: EventoMock[] }) {
    const reduce = useReducedMotion();
    const [i, setI] = useState(0);
    const [pausado, setPausado] = useState(false);
    const evento = eventos[i];
    const family = getFamily(evento.vibe);

    useEffect(() => {
        if (pausado || reduce || eventos.length < 2) return;
        const id = setTimeout(() => setI((v) => (v + 1) % eventos.length), DURACAO);
        return () => clearTimeout(id);
    }, [i, pausado, reduce, eventos.length]);

    return (
        <div
            className="relative flex flex-col items-center gap-6"
            onMouseEnter={() => setPausado(true)}
            onMouseLeave={() => setPausado(false)}
        >
            {/* Pôster quadrado passando, com brilho da vibe */}
            <a href={`${EVENT_HREF}?ev=${evento.id}`} className="relative block aspect-square w-full max-w-[460px]">
                <div aria-hidden className="absolute -inset-6 -z-10 rounded-[36px] opacity-70 blur-3xl" style={{ background: gradientCss(family, 140) }} />
                <AnimatePresence>
                    <motion.img
                        key={evento.id}
                        src={square(evento)}
                        alt={evento.titulo}
                        className="absolute inset-0 size-full rounded-3xl object-cover shadow-2xl ring-1 ring-black/10"
                        initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, rotate: -1 }}
                        animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1, rotate: 0 }}
                        exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 1.02, rotate: 1 }}
                        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                    />
                </AnimatePresence>
            </a>

            {/* Indicador de etapa */}
            <div className="flex w-full max-w-[460px] items-center gap-2">
                {eventos.map((e, idx) => (
                    <button
                        key={e.id}
                        type="button"
                        onClick={() => setI(idx)}
                        aria-label={`Ver ${e.titulo}`}
                        className="relative h-1 flex-1 overflow-hidden rounded-full bg-secondary"
                    >
                        {idx === i && !reduce ? (
                            <motion.span
                                key={`${e.id}-${pausado}`}
                                className="absolute inset-y-0 left-0 bg-brand-solid"
                                initial={{ width: "0%" }}
                                animate={{ width: pausado ? "30%" : "100%" }}
                                transition={{ duration: pausado ? 0.3 : DURACAO / 1000, ease: "linear" }}
                            />
                        ) : (
                            <span className={cx("absolute inset-y-0 left-0 bg-brand-solid", idx < i ? "w-full" : "w-0")} />
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}
