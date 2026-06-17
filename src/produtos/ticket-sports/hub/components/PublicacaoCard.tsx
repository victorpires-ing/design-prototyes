import { Heart, MessageCircle01 } from "@untitledui/icons";
import type { FeedItem } from "../data/comunidade";

export function PublicacaoCard({ item, onAbrirComunidade }: { item: FeedItem; onAbrirComunidade: (id: string) => void }) {
    return (
        <article className="flex flex-col gap-3 rounded-2xl border border-secondary bg-primary p-4">
            <button type="button" onClick={() => onAbrirComunidade(item.comunidadeId)} className="flex items-center gap-2.5 text-left">
                <img src={item.comunidadeLogo} alt="" className="size-9 rounded-lg object-cover" />
                <div className="flex flex-col">
                    <span className="text-sm font-bold text-primary">{item.comunidadeNome}</span>
                    <span className="text-xs text-tertiary">
                        {item.autor} · {item.tempo}
                    </span>
                </div>
            </button>

            <p className="text-md leading-snug text-secondary">{item.texto}</p>
            {item.foto && <img src={item.foto} alt="" className="aspect-[3/2] w-full rounded-xl object-cover" />}
            <div className="flex items-center gap-4 text-sm text-tertiary">
                <span className="flex items-center gap-1.5">
                    <Heart className="size-4 text-[#7C3AED]" /> {item.curtidas}
                </span>
                <span className="flex items-center gap-1.5">
                    <MessageCircle01 className="size-4 text-fg-quaternary" /> {item.comentarios}
                </span>
            </div>
        </article>
    );
}
