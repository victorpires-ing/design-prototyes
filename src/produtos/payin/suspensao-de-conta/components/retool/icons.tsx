import type { SVGProps } from "react";

/**
 * Ícones locais do kit Retool (traço 1.6, grid 16) — evitam a dependência
 * do @untitledui/icons nas telas de antifraude.
 */
type IconProps = SVGProps<SVGSVGElement> & { size?: number };

const Base = ({ size = 16, children, ...props }: IconProps) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        {...props}
    >
        {children}
    </svg>
);

export const IconSearch = (props: IconProps) => (
    <Base {...props}>
        <circle cx="7" cy="7" r="4.5" />
        <path d="M10.5 10.5 14 14" />
    </Base>
);

export const IconCalendar = (props: IconProps) => (
    <Base {...props}>
        <rect x="2" y="3.5" width="12" height="10.5" rx="2" />
        <path d="M2 6.5h12M5.5 2v2.5M10.5 2v2.5" />
    </Base>
);

export const IconChevronDown = (props: IconProps) => (
    <Base {...props}>
        <path d="M4 6.5 8 10.5l4-4" />
    </Base>
);

export const IconCheck = (props: IconProps) => (
    <Base {...props}>
        <path d="M3 8.5 6.2 11.7 13 5" />
    </Base>
);

export const IconBan = (props: IconProps) => (
    <Base {...props}>
        <circle cx="8" cy="8" r="6" />
        <path d="M4 12 12 4" />
    </Base>
);

export const IconExternal = (props: IconProps) => (
    <Base {...props}>
        <path d="M9 2.5h4.5V7M13 3 8 8" />
        <path d="M12 9.5v3a1 1 0 0 1-1 1H3.5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3" />
    </Base>
);

export const IconClose = (props: IconProps) => (
    <Base {...props}>
        <path d="M4 4l8 8M12 4l-8 8" />
    </Base>
);

export const IconAlert = (props: IconProps) => (
    <Base {...props}>
        <path d="M8 2.8 14.2 13.2H1.8L8 2.8Z" />
        <path d="M8 6.6v3M8 11.6h.01" />
    </Base>
);

export const IconArrowLeft = (props: IconProps) => (
    <Base {...props}>
        <path d="M13 8H3M6.5 4.5 3 8l3.5 3.5" />
    </Base>
);

export const IconMenu = (props: IconProps) => (
    <Base {...props}>
        <path d="M2.5 4.5h11M2.5 8h11M2.5 11.5h11" />
    </Base>
);

export const IconGrid = (props: IconProps) => (
    <Base {...props}>
        <rect x="2.5" y="2.5" width="4.5" height="4.5" rx="1" />
        <rect x="9" y="2.5" width="4.5" height="4.5" rx="1" />
        <rect x="2.5" y="9" width="4.5" height="4.5" rx="1" />
        <rect x="9" y="9" width="4.5" height="4.5" rx="1" />
    </Base>
);

export const IconShield = (props: IconProps) => (
    <Base {...props}>
        <path d="M8 2 13 4v4c0 3.1-2.1 5.4-5 6.4C5.1 13.4 3 11.1 3 8V4l5-2Z" />
    </Base>
);

export const IconUser = (props: IconProps) => (
    <Base {...props}>
        <circle cx="8" cy="5.5" r="2.6" />
        <path d="M3 13.5a5 5 0 0 1 10 0" />
    </Base>
);

export const IconRefund = (props: IconProps) => (
    <Base {...props}>
        <path d="M3 7.5a5 5 0 1 1 1.6 3.7" />
        <path d="M2.5 4v3.5H6" />
    </Base>
);
