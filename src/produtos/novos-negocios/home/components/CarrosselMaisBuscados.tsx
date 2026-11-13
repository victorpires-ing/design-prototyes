import { useRef } from "react";
import { ChevronRight } from "@untitledui/icons";
import type { EventoRevenda } from "../../data/eventos";
import { CardIngresso } from "./CardIngresso";

const LARGURA_CARD = 292;
const GAP = 16;

/**
 * Carrossel "Os mais buscados hoje".
 * Mobile: 1 card visível e a bolinha de 56px sobreposta na borda direita.
 * Desktop: trilha de 600px (2 cards) e a bolinha de 32px ao lado — medidas do Figma.
 */
export function CarrosselMaisBuscados({ eventos, aoSelecionar }: { eventos: EventoRevenda[]; aoSelecionar?: (evento: EventoRevenda) => void }) {
    const trilha = useRef<HTMLDivElement>(null);

    const avancar = () => {
        const el = trilha.current;
        if (!el) return;
        const fim = el.scrollWidth - el.clientWidth - 4;
        const destino = el.scrollLeft >= fim ? 0 : el.scrollLeft + LARGURA_CARD + GAP;
        el.scrollTo({ left: destino, behavior: "smooth" });
    };

    return (
        <div className="relative flex w-full items-center gap-5">
            <div
                ref={trilha}
                className="scrollbar-hide flex min-w-0 flex-1 snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth lg:w-[600px] lg:flex-none"
            >
                {eventos.map((e) => (
                    <div key={e.id} className="w-[292px] shrink-0 snap-start">
                        <CardIngresso evento={e} onClick={() => aoSelecionar?.(e)} />
                    </div>
                ))}
            </div>

            <button
                type="button"
                onClick={avancar}
                aria-label="Ver próximos eventos"
                className="absolute top-1/2 right-0 flex size-14 -translate-y-1/2 items-center justify-center rounded-full bg-[#ffdfdd] text-[#ff271a] transition duration-100 ease-linear hover:bg-[#ffc9c6] lg:static lg:size-8 lg:translate-y-0"
            >
                <ChevronRight className="size-7 lg:size-4" aria-hidden="true" />
            </button>
        </div>
    );
}
