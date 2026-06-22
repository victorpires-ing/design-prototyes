import { cx } from "@/utils/cx";
import { INGRESSE_RED } from "../../components/gradient-families";
import type { Confronto } from "../data/events";

/*
 *  Capa de CONFRONTO — para o jogo principal (não camarote): escudos dos times
 *  com um "X" entre eles e o campeonato em cima. Diferencia visualmente o jogo
 *  oficial do evento de camarote, evitando compra errada na pressa.
 */
export function MatchupCover({ confronto, className }: { confronto: Confronto; className?: string }) {
    const { campeonato, fase, casa, fora } = confronto;
    return (
        <div className={cx("absolute inset-0 flex flex-col items-center justify-center gap-4 overflow-hidden bg-[#0d0d12] px-4 text-center", className)}>
            {/* Brilho dos times + traço de vermelho Ingresse */}
            <div aria-hidden className="absolute inset-0 opacity-70" style={{ background: `radial-gradient(80% 60% at 20% 30%, ${casa.cor}, transparent 70%)` }} />
            <div aria-hidden className="absolute inset-0 opacity-70" style={{ background: `radial-gradient(80% 60% at 80% 70%, ${fora.cor}, transparent 70%)` }} />
            <div aria-hidden className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: INGRESSE_RED }} />
            <div aria-hidden className="absolute inset-0 bg-black/35" />

            <span className="relative text-[11px] font-bold tracking-[0.18em] text-white/80 uppercase">{campeonato}</span>

            <div className="relative flex items-center gap-3">
                <Escudo time={casa} />
                <span className="text-2xl font-black text-white/85 lg:text-3xl">×</span>
                <Escudo time={fora} />
            </div>

            {fase && <span className="relative text-sm font-extrabold tracking-wide text-white uppercase">{fase}</span>}
        </div>
    );
}

function Escudo({ time }: { time: Confronto["casa"] }) {
    return (
        <span className="flex flex-col items-center gap-2">
            {time.escudo ? (
                <img
                    src={time.escudo}
                    alt={time.nome}
                    loading="lazy"
                    className="size-20 object-contain drop-shadow-[0_4px_16px_rgba(0,0,0,0.6)] lg:size-24"
                />
            ) : (
                <span className="grid size-20 place-items-center rounded-2xl text-lg font-extrabold text-white shadow-lg lg:size-24" style={{ backgroundColor: time.cor }}>
                    {time.abbr}
                </span>
            )}
            <span className="text-[11px] font-semibold text-white/85">{time.nome}</span>
        </span>
    );
}
