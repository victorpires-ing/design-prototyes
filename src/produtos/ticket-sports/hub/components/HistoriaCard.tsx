import { Heart } from "@untitledui/icons";
import type { Historia } from "../data/home";

export function HistoriaCard({ historia }: { historia: Historia }) {
    return (
        <article className="flex flex-col gap-3 rounded-2xl border border-secondary bg-primary p-4">
            <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-full bg-[#7C3AED] font-bold text-white">
                    {historia.inicial}
                </span>
                <div className="flex flex-col">
                    <span className="text-sm font-semibold text-primary">{historia.nome}</span>
                    <span className="text-xs text-tertiary">
                        {historia.atividade} · há {historia.tempo}
                    </span>
                </div>
            </div>
            <p className="text-md leading-snug text-secondary">"{historia.texto}"</p>
            <div className="flex items-center gap-1.5 text-sm text-tertiary">
                <Heart className="size-4 text-[#7C3AED]" /> {historia.curtidas} curtidas
            </div>
        </article>
    );
}
