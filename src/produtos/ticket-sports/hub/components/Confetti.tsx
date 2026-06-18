import { useMemo } from "react";

const CORES = ["#7C3AED", "#D946EF", "#F59E0B", "#22C55E", "#3B82F6", "#EF4444", "#FCE07A"];

/**
 * Chuva de confete festiva (overlay de tela cheia). Renderize quando quiser
 * disparar e remova após ~2s. Respeita prefers-reduced-motion.
 */
export function Confetti({ count = 90 }: { count?: number }) {
    const pieces = useMemo(
        () =>
            Array.from({ length: count }, (_, idx) => ({
                id: idx,
                left: Math.random() * 100,
                delay: Math.random() * 0.4,
                dur: 1.3 + Math.random() * 1,
                color: CORES[Math.floor(Math.random() * CORES.length)],
                rot: Math.random() * 720 - 360,
                drift: (Math.random() - 0.5) * 160,
                w: 6 + Math.random() * 5,
                h: 8 + Math.random() * 8,
                radius: Math.random() > 0.6 ? "50%" : "2px",
            })),
        [count],
    );

    return (
        <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden motion-reduce:hidden">
            <style>{`@keyframes confettiFall{0%{transform:translateY(-12vh) translateX(0) rotate(0deg);opacity:1}100%{transform:translateY(112vh) translateX(var(--drift)) rotate(var(--rot));opacity:.9}}`}</style>
            {pieces.map((p) => (
                <span
                    key={p.id}
                    style={{
                        position: "absolute",
                        top: 0,
                        left: `${p.left}%`,
                        width: p.w,
                        height: p.h,
                        background: p.color,
                        borderRadius: p.radius,
                        ["--drift" as string]: `${p.drift}px`,
                        ["--rot" as string]: `${p.rot}deg`,
                        animation: `confettiFall ${p.dur}s ${p.delay}s ease-in forwards`,
                    }}
                />
            ))}
        </div>
    );
}
