import { Sale03, Tag01 } from "@untitledui/icons";
import eventCover from "@/assets/event-cover.png";
import type { CapaEvento } from "../data/cashout";

/**
 * Capa do evento na tabela — reproduz os quatro tratamentos do refinamento.
 *
 * Os gradientes promocionais vêm do design e não têm token equivalente no
 * design system (são arte de capa, não cor semântica), por isso ficam literais.
 */
export function EventThumb({ capa, nome }: { capa: CapaEvento; nome: string }) {
    if (capa === "promo") {
        return (
            <div
                className="flex h-[46px] w-[62px] shrink-0 flex-col items-center justify-center overflow-hidden rounded-lg border border-secondary"
                style={{ backgroundImage: "linear-gradient(143.43deg, rgb(244, 144, 98) 0%, rgb(253, 55, 31) 100%)" }}
            >
                <Sale03 className="h-6 w-3.5 text-white" aria-hidden="true" />
                <span className="text-[9px] font-bold tracking-[0.5px] text-white uppercase">50% OFF</span>
            </div>
        );
    }

    if (capa === "lancamento") {
        return (
            <div
                className="relative flex h-[46px] w-[62px] shrink-0 flex-col items-center justify-center overflow-hidden rounded-lg border border-secondary"
                style={{ backgroundImage: "linear-gradient(143.43deg, rgb(13, 148, 136) 0%, rgb(16, 185, 129) 50%, rgb(52, 211, 153) 100%)" }}
            >
                <Tag01 className="absolute top-0.5 left-px size-3 text-white" aria-hidden="true" />
                <span className="text-[9px] tracking-[0.9px] text-white uppercase">Novo</span>
                <span className="rounded bg-white/20 px-1.5 py-0.5 text-[7px] tracking-[0.35px] text-white uppercase">Release</span>
                <span className="absolute bottom-1.5 h-0.5 w-full bg-white/25" aria-hidden="true" />
            </div>
        );
    }

    if (capa === "live") {
        return (
            <div className="relative h-[46px] w-[62px] shrink-0 overflow-hidden rounded-lg border border-secondary">
                <img src={eventCover} alt="" className="absolute inset-0 size-full object-cover" />
                <span
                    className="absolute inset-0"
                    style={{ backgroundImage: "linear-gradient(to bottom, #1a0a3e 0%, rgba(13,27,78,0.6) 50%, rgba(0,0,0,0.3) 100%)" }}
                    aria-hidden="true"
                />
                <span className="absolute top-[3px] left-[3px] flex items-center gap-0.5 rounded-[3px] bg-[#e8003d] px-[3px] py-px">
                    <span className="size-1 rounded-full bg-white" aria-hidden="true" />
                    <span className="text-[6px] tracking-[0.3px] text-white uppercase">Live</span>
                </span>
                <span
                    className="absolute bottom-0 flex h-3.5 w-full items-center gap-[3px] px-1"
                    style={{ backgroundImage: "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(26,10,62,0.8) 100%)" }}
                >
                    <Tag01 className="size-2 shrink-0 text-[#c4b5fd]" aria-hidden="true" />
                    <span className="text-[6px] tracking-[0.18px] text-[#c4b5fd] uppercase">Event</span>
                </span>
            </div>
        );
    }

    return (
        <div className="h-[46px] w-[62px] shrink-0 overflow-hidden rounded-lg border border-secondary">
            <img src={eventCover} alt={`Capa de ${nome}`} className="size-full object-cover" />
        </div>
    );
}
