import { cx } from "@/utils/cx";
import { RESUMO } from "../data/desempenho";

export function MetaSemana({ onClick, className }: { onClick?: () => void; className?: string }) {
    const pct = RESUMO.semanaFeitos / RESUMO.semanaMeta;
    const r = 52;
    const circ = 2 * Math.PI * r;
    const faltam = RESUMO.semanaMeta - RESUMO.semanaFeitos;

    const Root = (onClick ? "button" : "div") as "button";

    return (
        <Root
            onClick={onClick}
            type={onClick ? "button" : undefined}
            className={cx(
                "flex items-center gap-5 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#D946EF] p-5 text-left text-white",
                className,
            )}
        >
            <div className="relative shrink-0">
                <svg viewBox="0 0 120 120" className="size-28 -rotate-90">
                    <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="12" />
                    <circle
                        cx="60"
                        cy="60"
                        r={r}
                        fill="none"
                        stroke="white"
                        strokeWidth="12"
                        strokeLinecap="round"
                        strokeDasharray={circ}
                        strokeDashoffset={circ * (1 - pct)}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-black leading-none">
                        {RESUMO.semanaFeitos}/{RESUMO.semanaMeta}
                    </span>
                    <span className="text-[10px] text-white/80">treinos</span>
                </div>
            </div>
            <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-white/80">Meta da semana</span>
                <span className="text-lg font-bold leading-tight">Você está indo bem! 💪</span>
                <span className="text-sm text-white/90">
                    {faltam > 0 ? `Faltam ${faltam} treinos para fechar a semana.` : "Meta da semana concluída! 🎉"}
                </span>
            </div>
        </Root>
    );
}
