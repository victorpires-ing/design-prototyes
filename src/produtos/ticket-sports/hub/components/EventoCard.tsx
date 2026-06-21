import { Calendar, MarkerPin01 } from "@untitledui/icons";
import type { Evento } from "../data/eventos";

export function EventoCard({ e, onClick }: { e: Evento; onClick?: () => void }) {
    return (
        <button type="button" onClick={onClick} className="flex gap-3 rounded-2xl border border-secondary bg-primary p-3 text-left">
            <img src={e.imagem} alt="" className="size-24 shrink-0 rounded-xl object-cover" />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="flex w-max items-center gap-1 rounded-full bg-[#7C3AED]/10 px-2 py-0.5 text-[11px] font-semibold text-[#7C3AED]">
                    {e.emoji} {e.atividade}
                </span>
                <h3 className="line-clamp-2 text-sm font-bold text-primary">{e.titulo}</h3>
                <span className="flex items-center gap-1.5 text-xs text-tertiary">
                    <Calendar className="size-3.5 text-fg-quaternary" /> {e.data}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-tertiary">
                    <MarkerPin01 className="size-3.5 text-fg-quaternary" /> {e.local} · {e.distancia}
                </span>
            </div>
        </button>
    );
}
