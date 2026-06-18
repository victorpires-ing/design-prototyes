import { cx } from "@/utils/cx";

/**
 * Caixinha de presente roxa com laço dourado (flat 3D, sem fundo).
 * Tamanho via className (ex: size-10, size-14, size-40).
 */
export function GiftBox({ className, animar }: { className?: string; animar?: boolean }) {
    return (
        <svg
            viewBox="0 0 48 48"
            className={cx("origin-bottom", className)}
            style={animar ? { animation: "giftShake 0.6s ease-in-out infinite" } : undefined}
            fill="none"
            aria-hidden="true"
        >
            <style>{`@keyframes giftShake{0%,100%{transform:rotate(0)}20%{transform:rotate(-8deg)}40%{transform:rotate(8deg)}60%{transform:rotate(-5deg)}80%{transform:rotate(5deg)}}@media (prefers-reduced-motion:reduce){svg[style*="giftShake"]{animation:none!important}}`}</style>
            <defs>
                <linearGradient id="gbBody" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#8B5CF6" />
                    <stop offset="1" stopColor="#6D28D9" />
                </linearGradient>
                <linearGradient id="gbLid" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#A78BFA" />
                    <stop offset="1" stopColor="#7C3AED" />
                </linearGradient>
                <linearGradient id="gbGold" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#FDE68A" />
                    <stop offset="1" stopColor="#E0A81C" />
                </linearGradient>
            </defs>

            {/* corpo da caixa */}
            <rect x="9" y="20" width="30" height="21" rx="2.5" fill="url(#gbBody)" />
            {/* sombra lateral (volume 3D) */}
            <path d="M33 20h6v21h-6z" fill="#000" opacity="0.12" />
            {/* brilho frontal */}
            <rect x="11" y="22" width="4" height="17" rx="2" fill="#fff" opacity="0.12" />
            {/* fita vertical no corpo */}
            <rect x="21" y="20" width="6" height="21" fill="url(#gbGold)" />

            {/* tampa */}
            <rect x="6" y="13" width="36" height="9" rx="2.5" fill="url(#gbLid)" />
            {/* sombrinha sob a tampa */}
            <rect x="6.5" y="20.4" width="35" height="1.6" rx="0.8" fill="#000" opacity="0.14" />
            {/* fita vertical na tampa */}
            <rect x="21" y="13" width="6" height="9" fill="url(#gbGold)" />

            {/* laço dourado */}
            <ellipse cx="19.5" cy="9.5" rx="3.6" ry="2.6" transform="rotate(-28 19.5 9.5)" fill="url(#gbGold)" />
            <ellipse cx="28.5" cy="9.5" rx="3.6" ry="2.6" transform="rotate(28 28.5 9.5)" fill="url(#gbGold)" />
            <path d="M24 12c-2-1.5-3.5-2.5-5-3.5 2 .3 3.7.8 5 2 1.3-1.2 3-1.7 5-2-1.5 1-3 2-5 3.5z" fill="#E0A81C" opacity="0.7" />
            <circle cx="24" cy="12" r="2.4" fill="url(#gbGold)" />
        </svg>
    );
}
