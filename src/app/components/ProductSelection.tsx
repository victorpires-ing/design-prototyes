import type { FC } from "react";
import { useNavigate } from "react-router";
import { Ticket01 } from "@untitledui/icons";
import { cx } from "@/utils/cx";

/* ------------------------------------------------------------------ */
/*  Products                                                          */
/* ------------------------------------------------------------------ */

type IllustrationKind = "backstage" | "futebol";

interface ProductCardData {
    id: string;
    name: string;
    description: string;
    to: string;
    illustration: IllustrationKind;
}

const PRODUCTS: ProductCardData[] = [
    {
        id: "backstage",
        name: "Backstage",
        description: "Gestão de eventos e relatórios",
        to: "/backstage",
        illustration: "backstage",
    },
    {
        id: "futebol",
        name: "Futebol",
        description: "Landing pages de jogos e ingressos",
        to: "/futebol/landing-pages",
        illustration: "futebol",
    },
];

const ILLUSTRATIONS: Record<IllustrationKind, FC> = {
    backstage: BackstageIllustration,
    futebol: FutebolIllustration,
};

/* Neutral base + brand highlight palette (theme-aware via tokens). */
const N50 = "var(--color-utility-neutral-50)";
const N100 = "var(--color-utility-neutral-100)";
const N200 = "var(--color-utility-neutral-200)";
const N300 = "var(--color-utility-neutral-300)";
const N400 = "var(--color-utility-neutral-400)";
const BORDER = "var(--color-border-secondary)";
const BRAND = "var(--color-utility-brand-600)";
const BRAND_SOFT = "var(--color-utility-brand-200)";

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

export function ProductSelection() {
    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-primary px-4 py-16">
            <Backdrop />

            <div className="relative z-10 flex w-full max-w-3xl flex-col items-center gap-12">
                <div className="flex items-center gap-2.5">
                    <span className="flex size-8 items-center justify-center rounded-lg bg-brand-solid text-white">
                        <Ticket01 className="size-5" aria-hidden="true" />
                    </span>
                    <span className="text-xl font-bold text-primary">Ingresse Prototypes</span>
                </div>

                <h1 className="text-center text-4xl font-bold tracking-tight text-primary md:text-6xl">
                    <span className="font-light italic text-quaternary">Selecione um </span>
                    Produto
                </h1>

                <div className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2">
                    {PRODUCTS.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Card                                                              */
/* ------------------------------------------------------------------ */

const ProductCard = ({ product }: { product: ProductCardData }) => {
    const navigate = useNavigate();
    const Illustration = ILLUSTRATIONS[product.illustration];

    return (
        <button
            type="button"
            onClick={() => navigate(product.to)}
            className="group flex flex-col overflow-hidden rounded-2xl bg-secondary/60 text-left ring-1 ring-border-secondary backdrop-blur-sm transition duration-150 ease-linear hover:-translate-y-1 hover:bg-secondary hover:ring-brand"
        >
            <div className="relative h-40 overflow-hidden">
                <div className="size-full transition-transform duration-300 ease-out group-hover:scale-105">
                    <Illustration />
                </div>
            </div>

            <div className="flex flex-col gap-1 border-t border-secondary px-4 py-4">
                <span className="text-md font-semibold text-primary">{product.name}</span>
                <span className="text-sm text-tertiary">{product.description}</span>
            </div>
        </button>
    );
};

/* ------------------------------------------------------------------ */
/*  Illustrations — neutral tones with brand-colored highlights       */
/* ------------------------------------------------------------------ */

function FutebolIllustration() {
    return (
        <svg
            viewBox="0 0 320 160"
            preserveAspectRatio="xMidYMid slice"
            className="size-full"
            aria-hidden="true"
        >
            <defs>
                <linearGradient id="futebol-field" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="160">
                    <stop offset="0%" stopColor={N100} />
                    <stop offset="100%" stopColor={N200} />
                </linearGradient>
            </defs>

            <rect width="320" height="160" fill="url(#futebol-field)" />

            {/* mowing stripes (subtle neutral) */}
            <g fill={N300} opacity="0.4">
                <rect x="0" width="53" height="160" />
                <rect x="107" width="53" height="160" />
                <rect x="213" width="53" height="160" />
            </g>

            {/* pitch markings (neutral) */}
            <g stroke={N400} strokeWidth="2" fill="none">
                <line x1="160" y1="0" x2="160" y2="160" />
                <circle cx="160" cy="80" r="30" />
                <rect x="-2" y="46" width="40" height="68" rx="2" />
                <rect x="282" y="46" width="40" height="68" rx="2" />
            </g>

            {/* soccer ball — small, white with red panels */}
            <g transform="translate(160 80) scale(0.62)">
                <circle r="20" fill="#ffffff" stroke={BORDER} strokeWidth="1.6" />
                <polygon points="0,-9 8.5,-3 5,7 -5,7 -8.5,-3" fill={BRAND} />
                <g stroke={BRAND} strokeWidth="2.2">
                    <line x1="0" y1="-9" x2="0" y2="-18" />
                    <line x1="8.5" y1="-3" x2="17" y2="-6" />
                    <line x1="5" y1="7" x2="10" y2="16" />
                    <line x1="-5" y1="7" x2="-10" y2="16" />
                    <line x1="-8.5" y1="-3" x2="-17" y2="-6" />
                </g>
            </g>
        </svg>
    );
}

function BackstageIllustration() {
    return (
        <svg
            viewBox="0 0 320 160"
            preserveAspectRatio="xMidYMid slice"
            className="size-full"
            aria-hidden="true"
        >
            <defs>
                <linearGradient id="bs-bg" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="160">
                    <stop offset="0%" stopColor={N100} />
                    <stop offset="100%" stopColor={N200} />
                </linearGradient>
                <linearGradient id="bs-ticket" gradientUnits="userSpaceOnUse" x1="0" y1="40" x2="0" y2="120">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="100%" stopColor="#f3f4f6" />
                </linearGradient>
            </defs>

            <rect width="320" height="160" fill="url(#bs-bg)" />

            {/* confetti — mostly neutral, a couple brand accents */}
            <g>
                <circle cx="40" cy="30" r="3" fill={N300} />
                <circle cx="280" cy="40" r="4" fill={BRAND} opacity="0.7" />
                <circle cx="250" cy="122" r="3" fill={N300} />
                <circle cx="60" cy="122" r="2.5" fill={BRAND} opacity="0.7" />
                <circle cx="300" cy="92" r="2.5" fill={N300} />
                <circle cx="28" cy="84" r="2" fill={N300} />
            </g>

            {/* back ticket (depth) */}
            <g transform="rotate(-9 160 80)">
                <rect x="86" y="44" width="148" height="64" rx="12" fill={N200} />
            </g>

            {/* front ticket */}
            <g transform="rotate(-9 160 80)">
                <rect x="96" y="52" width="148" height="64" rx="12" fill="url(#bs-ticket)" stroke={BORDER} strokeWidth="1" />
                {/* perforation notches + dashed line */}
                <circle cx="196" cy="52" r="8" fill={N100} />
                <circle cx="196" cy="116" r="8" fill={N100} />
                <line x1="196" y1="64" x2="196" y2="104" stroke={N300} strokeWidth="2" strokeDasharray="4 5" />
                {/* star — brand highlight */}
                <polygon
                    points="140,73 142.65,80.36 150.46,80.6 144.28,85.39 146.47,92.9 140,88.5 133.53,92.9 135.72,85.39 129.54,80.6 137.35,80.36"
                    fill={BRAND}
                />
                {/* code lines on the tear-off stub */}
                <g fill={BRAND_SOFT}>
                    <rect x="208" y="74" width="26" height="5" rx="2.5" />
                    <rect x="208" y="86" width="18" height="5" rx="2.5" />
                </g>
            </g>
        </svg>
    );
}

/* ------------------------------------------------------------------ */
/*  Decorative backdrop (grid + glow)                                 */
/* ------------------------------------------------------------------ */

const Backdrop = () => (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* dashed grid */}
        <div
            className="absolute inset-0 opacity-60"
            style={{
                backgroundImage:
                    "linear-gradient(to right, color-mix(in srgb, var(--color-border-secondary) 50%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in srgb, var(--color-border-secondary) 50%, transparent) 1px, transparent 1px)",
                backgroundSize: "240px 240px",
            }}
        />
        {/* brand glow */}
        <div
            className={cx(
                "absolute -top-24 left-1/4 size-[480px] -translate-x-1/2 rounded-full blur-3xl",
            )}
            style={{
                background:
                    "radial-gradient(circle, color-mix(in srgb, var(--color-bg-brand-solid) 22%, transparent) 0%, transparent 70%)",
            }}
        />
    </div>
);
