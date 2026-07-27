import { cx } from "@/utils/cx";

const ACCENT = "#0099FF";
const VERMELHO_MARCA = "#FF0000";

/** Ícone: bola/sol vermelho + silhueta de corredor — logomark oficial da 101ª São Silvestre. */
const RunnerIcon = ({ id, className }: { id: string; className?: string }) => (
    <svg viewBox="0 0 120 90" width="46" height="35" className={className} aria-hidden="true">
        <defs>
            <radialGradient id={id} cx="35%" cy="30%" r="75%">
                <stop offset="0" stopColor="#ff7a70" />
                <stop offset="55%" stopColor={VERMELHO_MARCA} />
                <stop offset="100%" stopColor="#c40000" />
            </radialGradient>
        </defs>
        <circle cx="34" cy="20" r="15" fill={`url(#${id})`} />
        <path
            d="M20 82 C 22 46, 30 30, 40 40 C 50 50, 46 58, 40 68 C 36 74, 40 80, 52 74 C 70 65, 92 60, 112 46"
            fill="none"
            stroke="#0A0A0A"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

interface LogomarkProps {
    /** Id único do gradiente SVG — necessário quando o logomark aparece mais de uma vez na página. */
    gradientId: string;
    className?: string;
    wordmarkClassName?: string;
}

/** Logomark completo: ícone do corredor + wordmark "SÃO SILVESTRE 101" (101 no azul de destaque da marca). */
export const Logomark = ({ gradientId, className, wordmarkClassName }: LogomarkProps) => (
    <div className={cx("flex items-center gap-3", className)}>
        <RunnerIcon id={gradientId} />
        <span
            className={cx("text-[19px] leading-none font-extrabold tracking-[-0.4px] text-[#0A0A0A]", wordmarkClassName)}
            style={{ fontFamily: "'Outfit', sans-serif" }}
        >
            SÃO SILVESTRE <span style={{ color: ACCENT }}>101</span>
        </span>
    </div>
);
