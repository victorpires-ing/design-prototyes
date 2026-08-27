/**
 * Ilustração do totem de autoatendimento.
 *
 * Desenhada só com `currentColor` e tokens semânticos: o traço herda a cor do
 * container e a tela interna usa a cor de marca, então a peça funciona em light
 * e dark sem duplicar o arquivo.
 */
export const TotemIllustration = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 64 96" fill="none" className={className} aria-hidden="true">
        {/* Corpo */}
        <rect x="8.5" y="2.5" width="47" height="83" rx="6.5" className="stroke-current" strokeWidth="1.5" />
        {/* Tela */}
        <rect x="14" y="8" width="36" height="52" rx="3" className="fill-brand-secondary" />
        {/* Linhas de ingresso na tela */}
        <rect x="18" y="13" width="18" height="3" rx="1.5" className="fill-fg-brand-primary opacity-70" />
        <rect x="18" y="21" width="28" height="8" rx="2" className="fill-fg-brand-primary opacity-25" />
        <rect x="18" y="33" width="28" height="8" rx="2" className="fill-fg-brand-primary opacity-25" />
        <rect x="18" y="45" width="28" height="8" rx="2" className="fill-fg-brand-primary" />
        {/* Leitor / impressora */}
        <rect x="20" y="66" width="24" height="2.5" rx="1.25" className="fill-current opacity-40" />
        <rect x="24" y="74" width="16" height="5" rx="1.5" className="stroke-current" strokeWidth="1.5" />
        {/* Base */}
        <path d="M20 86v5.5h24V86" className="stroke-current" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M14 93.5h36" className="stroke-current" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
);
