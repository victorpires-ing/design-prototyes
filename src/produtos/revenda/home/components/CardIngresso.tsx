import type { EventoRevenda } from "../../data/eventos";

/**
 * Card de evento do canal de Revenda.
 * Geometria e tipografia do Figma; raios, espaçamentos e comportamento de hover
 * conferidos no site em produção (revenda.ingresse.com):
 * pôster radius 16 / aspect 3:4, overlay radius 8 com inset 5, hover translateY(-2px)
 * + sombra 0 8px 24px rgba(23,23,23,.12) em 200ms ease.
 */
export function CardIngresso({ evento, onClick }: { evento: EventoRevenda; onClick?: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="group @container flex w-full flex-col rounded-lg bg-[#fafafa] px-2 py-4 text-left shadow-[4px_4px_8px_0_rgba(0,0,0,0.05)] ring-1 ring-white ring-inset lg:px-[15px] transition-[translate,transform,box-shadow] duration-200 ease-[ease] hover:-translate-y-[2px] hover:shadow-[0_8px_24px_0_rgba(23,23,23,0.12)]"
        >
            {/* Pôster 3:4 com a legenda ancorada embaixo */}
            <div className="relative aspect-[164/245] w-full overflow-hidden rounded-lg @min-[220px]:aspect-[3/4] @min-[220px]:rounded-2xl" style={{ backgroundImage: evento.gradient }}>
                <div className="absolute bottom-[9px] left-1/2 flex w-auto -translate-x-1/2 flex-col items-center justify-center rounded-lg bg-black/60 px-4 py-1 text-center backdrop-blur-[19px] @min-[220px]:inset-x-[5px] @min-[220px]:bottom-[5px] @min-[220px]:left-auto @min-[220px]:min-h-[58px] @min-[220px]:translate-x-0 @min-[220px]:items-end @min-[220px]:py-2 @min-[220px]:text-right">
                    <span className="text-xs leading-[18px] font-bold tracking-[-0.011em] text-white @min-[220px]:text-sm @min-[220px]:leading-[21px]">
                        {evento.status}
                    </span>
                    {/* A chamada só cabe quando o card tem largura suficiente */}
                    <span className="hidden text-sm leading-[21px] tracking-[-0.011em] text-white @min-[220px]:block">Ver ingressos de revenda →</span>
                </div>
            </div>

            {/* Nome do evento — 1 linha de 32px */}
            <div className="pt-4 pb-2">
                <h3 className="line-clamp-2 text-2xl leading-8 font-bold tracking-[-0.05em] text-[#212b36] @min-[220px]:line-clamp-1">{evento.nome}</h3>
            </div>

            {/* Local e data, abaixo de uma única divisória */}
            <div className="flex flex-col border-t border-[#d4d4d4] py-1">
                <span className="truncate text-xs leading-5 text-[#454f5b] uppercase">{evento.local}</span>
                <span className="truncate text-xs leading-5 text-[#454f5b] uppercase">{evento.data}</span>
            </div>
        </button>
    );
}
