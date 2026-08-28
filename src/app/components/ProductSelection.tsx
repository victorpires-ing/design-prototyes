import type { FC } from "react";
import { useNavigate } from "react-router";
import { Ticket01 } from "@untitledui/icons";
import { cx } from "@/utils/cx";

/* ------------------------------------------------------------------ */
/*  Products                                                          */
/* ------------------------------------------------------------------ */

type IllustrationKind = "backstage" | "futebol" | "novo-site" | "ingresse-app" | "landing-pages" | "testes" | "marketplace" | "carteira-web" | "freepass" | "payin" | "payout";

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
    {
        id: "novo-site",
        name: "Novo Site",
        description: "Novo site do evento — acesso restrito",
        to: "/novo-site/home/event-details",
        illustration: "novo-site",
    },
    {
        id: "ingresse-app",
        name: "Ingresse App",
        description: "App de compra e gestão de ingressos",
        to: "/ingresse-app",
        illustration: "ingresse-app",
    },
    {
        id: "landing-pages",
        name: "Landing Pages",
        description: "Páginas de eventos e campanhas",
        to: "/landing-pages",
        illustration: "landing-pages",
    },
    {
        id: "testes",
        name: "Painel de Testes",
        description: "Testes de usabilidade dos protótipos",
        to: "/testes",
        illustration: "testes",
    },
    {
        id: "marketplace",
        name: "Marketplace",
        description: "Configure o evento e gere o link de seleção",
        to: "/marketplace",
        illustration: "marketplace",
    },
    {
        id: "carteira-web",
        name: "Carteira Web",
        description: "Carteira de ingressos na web",
        to: "/carteira-web",
        illustration: "carteira-web",
    },
    {
        id: "freepass",
        name: "Freepass",
        description: "Receba um pack de cortesias, reenvie ou resgate",
        to: "/freepass/distribuicao-cortesias",
        illustration: "freepass",
    },
    {
        id: "payin",
        name: "PayIn",
        description: "Antifraude: fila de análise e suspensão de conta",
        to: "/payin/suspensao-de-conta",
        illustration: "payin",
    },
    {
        id: "payout",
        name: "PayOut",
        description: "Cashout: associação de contratos a eventos e produtoras",
        to: "/payout/contrato-quick-win-finance",
        illustration: "payout",
    },
];

const ILLUSTRATIONS: Record<IllustrationKind, FC> = {
    backstage: BackstageIllustration,
    futebol: FutebolIllustration,
    "novo-site": NovoSiteIllustration,
    "ingresse-app": AppIllustration,
    "landing-pages": LandingPagesIllustration,
    testes: TestesIllustration,
    marketplace: MarketplaceIllustration,
    "carteira-web": CarteiraWebIllustration,
    freepass: FreepassIllustration,
    payin: PayInIllustration,
    payout: PayOutIllustration,
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

function PayInIllustration() {
    return (
        <svg viewBox="0 0 320 160" preserveAspectRatio="xMidYMid slice" className="size-full" aria-hidden="true">
            <defs>
                <linearGradient id="sc-bg" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="160">
                    <stop offset="0%" stopColor={N100} />
                    <stop offset="100%" stopColor={N200} />
                </linearGradient>
            </defs>
            <rect width="320" height="160" fill="url(#sc-bg)" />

            {/* Fila de transações à esquerda */}
            <rect x="24" y="30" width="132" height="100" rx="10" fill={N50} stroke={BORDER} />
            <rect x="24" y="30" width="132" height="16" rx="10" fill={N200} />
            <rect x="34" y="56" width="112" height="14" rx="4" fill={N200} />
            <rect x="34" y="76" width="112" height="14" rx="4" fill={N200} />
            <rect x="34" y="96" width="112" height="14" rx="4" fill={BRAND_SOFT} />
            <rect x="34" y="96" width="4" height="14" rx="2" fill={BRAND} />

            {/* Escudo de antifraude com a compra suspensa */}
            <path
                d="M232 24 l44 16 v34 c0 27 -18 48 -44 58 c-26 -10 -44 -31 -44 -58 v-34 Z"
                fill={N50}
                stroke={BORDER}
            />
            <rect x="208" y="66" width="48" height="30" rx="6" fill={N200} />
            <circle cx="208" cy="66" r="5" fill={N100} />
            <circle cx="256" cy="66" r="5" fill={N100} />
            {/* Traço de suspensão */}
            <g stroke={BRAND} strokeWidth="5" strokeLinecap="round">
                <line x1="214" y1="96" x2="250" y2="66" />
            </g>
            <circle cx="232" cy="118" r="4" fill={N400} />

            {/* Seta da fila para a decisão */}
            <g stroke={N400} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d="M164 80 L186 80" />
                <polyline points="180,74 186,80 180,86" />
            </g>
        </svg>
    );
}

function PayOutIllustration() {
    return (
        <svg viewBox="0 0 320 160" preserveAspectRatio="xMidYMid slice" className="size-full" aria-hidden="true">
            <defs>
                <linearGradient id="po-bg" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="160">
                    <stop offset="0%" stopColor={N100} />
                    <stop offset="100%" stopColor={N200} />
                </linearGradient>
            </defs>
            <rect width="320" height="160" fill="url(#po-bg)" />

            {/* Saldo a repassar */}
            <rect x="24" y="36" width="112" height="88" rx="10" fill={N50} stroke={BORDER} />
            <rect x="24" y="36" width="112" height="16" rx="10" fill={N200} />
            <rect x="34" y="62" width="58" height="9" rx="4.5" fill={N200} />
            <rect x="34" y="78" width="82" height="14" rx="4" fill={N300} />
            <circle cx="116" cy="110" r="10" fill={BRAND_SOFT} />
            <circle cx="116" cy="110" r="4" fill={BRAND} />

            {/* Saída do dinheiro */}
            <g stroke={BRAND} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d="M146 80 L176 80" />
                <polyline points="170,74 176,80 170,86" />
            </g>

            {/* Organizadores recebendo */}
            <rect x="186" y="48" width="110" height="22" rx="6" fill={BRAND_SOFT} />
            <rect x="186" y="48" width="4" height="22" rx="2" fill={BRAND} />
            <circle cx="202" cy="59" r="7" fill={N100} />
            <rect x="215" y="55" width="42" height="8" rx="4" fill={N400} />
            <rect x="266" y="55" width="22" height="8" rx="4" fill={BRAND} />

            <rect x="186" y="74" width="110" height="22" rx="6" fill={N50} stroke={BORDER} />
            <circle cx="202" cy="85" r="7" fill={N100} />
            <rect x="215" y="81" width="42" height="8" rx="4" fill={N200} />
            <rect x="266" y="81" width="22" height="8" rx="4" fill={N200} />

            <rect x="186" y="100" width="110" height="22" rx="6" fill={N50} stroke={BORDER} />
            <circle cx="202" cy="111" r="7" fill={N100} />
            <rect x="215" y="107" width="42" height="8" rx="4" fill={N200} />
            <rect x="266" y="107" width="22" height="8" rx="4" fill={N200} />
        </svg>
    );
}

function AppIllustration() {
    return (
        <svg viewBox="0 0 320 160" preserveAspectRatio="xMidYMid slice" className="size-full" aria-hidden="true">
            <rect width="320" height="160" fill={N100} />
            {/* corpo do celular */}
            <rect x="116" y="8" width="88" height="150" rx="16" fill={N50} stroke={BORDER} />
            <rect x="150" y="15" width="20" height="4" rx="2" fill={N300} />
            {/* header brand */}
            <rect x="126" y="26" width="68" height="14" rx="4" fill={BRAND} />
            {/* busca */}
            <rect x="126" y="46" width="68" height="9" rx="4.5" fill={N200} />
            {/* card 1 */}
            <rect x="126" y="60" width="68" height="26" rx="6" fill={N200} />
            <rect x="131" y="65" width="18" height="16" rx="3" fill={BRAND_SOFT} />
            <rect x="153" y="67" width="36" height="4" rx="2" fill={N400} />
            <rect x="153" y="75" width="24" height="3" rx="1.5" fill={N300} />
            {/* card 2 */}
            <rect x="126" y="90" width="68" height="26" rx="6" fill={N200} />
            <rect x="131" y="95" width="18" height="16" rx="3" fill={N300} />
            <rect x="153" y="97" width="36" height="4" rx="2" fill={N400} />
            <rect x="153" y="105" width="24" height="3" rx="1.5" fill={N300} />
            {/* tab bar */}
            <rect x="117" y="134" width="86" height="23" fill={N50} />
            <line x1="117" y1="134" x2="203" y2="134" stroke={BORDER} />
            <circle cx="138" cy="145" r="3" fill={BRAND} />
            <circle cx="160" cy="145" r="3" fill={N400} />
            <circle cx="182" cy="145" r="3" fill={N400} />
        </svg>
    );
}

function LandingPagesIllustration() {
    return (
        <svg viewBox="0 0 320 160" preserveAspectRatio="xMidYMid slice" className="size-full" aria-hidden="true">
            <rect width="320" height="160" fill={N100} />
            {/* página */}
            <rect x="46" y="16" width="228" height="132" rx="10" fill={N50} stroke={BORDER} />
            {/* hero */}
            <rect x="58" y="28" width="204" height="42" rx="6" fill={N200} />
            <rect x="70" y="40" width="70" height="6" rx="3" fill={N400} />
            <rect x="70" y="52" width="48" height="5" rx="2.5" fill={N300} />
            {/* coluna texto + CTA */}
            <rect x="58" y="82" width="110" height="7" rx="3.5" fill={N300} />
            <rect x="58" y="95" width="84" height="5" rx="2.5" fill={N200} />
            <rect x="58" y="112" width="66" height="16" rx="8" fill={BRAND} />
            {/* coluna lateral */}
            <rect x="186" y="82" width="76" height="5" rx="2.5" fill={N200} />
            <rect x="186" y="93" width="62" height="5" rx="2.5" fill={N200} />
            <rect x="186" y="104" width="70" height="5" rx="2.5" fill={N200} />
            <rect x="186" y="115" width="50" height="5" rx="2.5" fill={N200} />
        </svg>
    );
}

function TestesIllustration() {
    return (
        <svg viewBox="0 0 320 160" preserveAspectRatio="xMidYMid slice" className="size-full" aria-hidden="true">
            <defs>
                <radialGradient id="t-heat" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor={BRAND} stopOpacity="0.55" />
                    <stop offset="100%" stopColor={BRAND} stopOpacity="0" />
                </radialGradient>
            </defs>
            <rect width="320" height="160" fill={N100} />
            {/* janela do protótipo sob teste */}
            <rect x="58" y="22" width="204" height="116" rx="10" fill={N50} stroke={BORDER} />
            <rect x="58" y="22" width="204" height="20" rx="10" fill={N100} />
            <circle cx="72" cy="32" r="3" fill={N300} />
            <circle cx="82" cy="32" r="3" fill={N300} />
            <circle cx="92" cy="32" r="3" fill={N300} />
            {/* conteúdo */}
            <rect x="72" y="54" width="80" height="8" rx="4" fill={N300} />
            <rect x="72" y="68" width="120" height="5" rx="2.5" fill={N200} />
            <rect x="72" y="78" width="100" height="5" rx="2.5" fill={N200} />
            {/* botão alvo */}
            <rect x="72" y="98" width="64" height="20" rx="6" fill={BRAND} />
            {/* mapa de calor sobre o botão */}
            <circle cx="104" cy="108" r="34" fill="url(#t-heat)" />
            {/* cursor */}
            <g transform="translate(116 110)">
                <path d="M0 0 L0 18 L5 13 L9 21 L12 19 L8 12 L15 12 Z" fill="#ffffff" stroke={N400} strokeWidth="1" />
            </g>
            {/* mini-gráfico de resultados */}
            <g>
                <rect x="206" y="96" width="6" height="22" rx="2" fill={N300} />
                <rect x="218" y="86" width="6" height="32" rx="2" fill={N400} />
                <rect x="230" y="76" width="6" height="42" rx="2" fill={BRAND} />
            </g>
        </svg>
    );
}

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

function NovoSiteIllustration() {
    return (
        <svg viewBox="0 0 320 160" preserveAspectRatio="xMidYMid slice" className="size-full" aria-hidden="true">
            <defs>
                <linearGradient id="ns-bg" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="160">
                    <stop offset="0%" stopColor={N100} />
                    <stop offset="100%" stopColor={N200} />
                </linearGradient>
                <clipPath id="ns-window">
                    <rect x="70" y="32" width="180" height="104" rx="12" />
                </clipPath>
            </defs>

            <rect width="320" height="160" fill="url(#ns-bg)" />

            {/* confetti / accents */}
            <g>
                <circle cx="40" cy="34" r="3" fill={N300} />
                <circle cx="284" cy="120" r="3" fill={BRAND} opacity="0.7" />
                <circle cx="40" cy="120" r="2.5" fill={N300} />
                <circle cx="284" cy="40" r="2.5" fill={N300} />
            </g>

            {/* browser window */}
            <g clipPath="url(#ns-window)">
                <rect x="70" y="32" width="180" height="104" fill="#ffffff" />
                {/* top bar */}
                <rect x="70" y="32" width="180" height="22" fill={N100} />
                <circle cx="84" cy="43" r="3" fill={BRAND} opacity="0.75" />
                <circle cx="94" cy="43" r="3" fill={N300} />
                <circle cx="104" cy="43" r="3" fill={N300} />
                <rect x="118" y="39" width="118" height="8" rx="4" fill={N200} />

                {/* content */}
                <rect x="84" y="66" width="58" height="44" rx="6" fill={BRAND_SOFT} />
                <rect x="152" y="66" width="84" height="8" rx="4" fill={N300} />
                <rect x="152" y="80" width="64" height="6" rx="3" fill={N200} />
                <rect x="152" y="92" width="74" height="6" rx="3" fill={N200} />
                <rect x="152" y="104" width="42" height="11" rx="5.5" fill={BRAND} />
                <rect x="84" y="118" width="152" height="6" rx="3" fill={N200} />
            </g>

            {/* window border */}
            <rect x="70" y="32" width="180" height="104" rx="12" fill="none" stroke={BORDER} strokeWidth="1" />
        </svg>
    );
}

function CarteiraWebIllustration() {
    return (
        <svg viewBox="0 0 320 160" preserveAspectRatio="xMidYMid slice" className="size-full" aria-hidden="true">
            <rect width="320" height="160" fill={N100} />
            {/* janela do navegador */}
            <rect x="40" y="20" width="240" height="124" rx="10" fill={N50} stroke={BORDER} />
            <rect x="40" y="20" width="240" height="18" rx="10" fill={N100} />
            <circle cx="52" cy="29" r="2.5" fill={N300} />
            <circle cx="60" cy="29" r="2.5" fill={N300} />
            <circle cx="68" cy="29" r="2.5" fill={N300} />
            {/* título */}
            <rect x="54" y="50" width="70" height="7" rx="3.5" fill={N400} />
            {/* abas */}
            <rect x="54" y="64" width="34" height="4" rx="2" fill={BRAND} />
            <rect x="94" y="64" width="34" height="4" rx="2" fill={N200} />
            {/* cards de ingresso */}
            <g>
                <rect x="54" y="78" width="62" height="52" rx="6" fill={BRAND_SOFT} />
                <rect x="62" y="112" width="46" height="12" rx="3" fill={BRAND} />
                <rect x="129" y="78" width="62" height="52" rx="6" fill={N200} />
                <rect x="137" y="112" width="46" height="12" rx="3" fill={N300} />
                <rect x="204" y="78" width="62" height="52" rx="6" fill={N300} />
                <rect x="212" y="112" width="46" height="12" rx="3" fill={N400} />
            </g>
        </svg>
    );
}

function MarketplaceIllustration() {
    return (
        <svg viewBox="0 0 320 160" preserveAspectRatio="xMidYMid slice" className="size-full" aria-hidden="true">
            <defs>
                <linearGradient id="mk-bg" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="160">
                    <stop offset="0%" stopColor={N100} />
                    <stop offset="100%" stopColor={N200} />
                </linearGradient>
            </defs>

            <rect width="320" height="160" fill="url(#mk-bg)" />

            {/* toldo da vitrine */}
            <rect x="46" y="20" width="228" height="16" rx="4" fill={N300} />
            <g fill={BRAND} opacity="0.85">
                <rect x="46" y="20" width="38" height="16" />
                <rect x="122" y="20" width="38" height="16" />
                <rect x="198" y="20" width="38" height="16" />
            </g>

            {/* grade de cards (itens à venda) */}
            {/* card 1 — destaque de marca (selecionado) */}
            <g>
                <rect x="58" y="48" width="58" height="44" rx="6" fill={N50} stroke={BRAND} strokeWidth="2" />
                <rect x="64" y="54" width="46" height="20" rx="3" fill={BRAND_SOFT} />
                <rect x="64" y="78" width="30" height="4" rx="2" fill={N400} />
                <rect x="64" y="85" width="20" height="3" rx="1.5" fill={N300} />
                {/* check de selecionado */}
                <circle cx="108" cy="54" r="7" fill={BRAND} />
            </g>
            {/* card 2 */}
            <g>
                <rect x="131" y="48" width="58" height="44" rx="6" fill={N50} stroke={BORDER} />
                <rect x="137" y="54" width="46" height="20" rx="3" fill={N200} />
                <rect x="137" y="78" width="30" height="4" rx="2" fill={N400} />
                <rect x="137" y="85" width="20" height="3" rx="1.5" fill={N300} />
            </g>
            {/* card 3 */}
            <g>
                <rect x="204" y="48" width="58" height="44" rx="6" fill={N50} stroke={BORDER} />
                <rect x="210" y="54" width="46" height="20" rx="3" fill={N200} />
                <rect x="210" y="78" width="30" height="4" rx="2" fill={N400} />
                <rect x="210" y="85" width="20" height="3" rx="1.5" fill={N300} />
            </g>

            {/* barra inferior — atribuição (seta para destino) */}
            <rect x="58" y="104" width="120" height="34" rx="8" fill={N50} stroke={BORDER} />
            <circle cx="76" cy="121" r="9" fill={BRAND_SOFT} />
            <rect x="92" y="115" width="60" height="5" rx="2.5" fill={N300} />
            <rect x="92" y="124" width="40" height="4" rx="2" fill={N200} />

            {/* seta de atribuição */}
            <g stroke={BRAND} strokeWidth="3" fill="none">
                <line x1="188" y1="121" x2="214" y2="121" />
                <polyline points="206,114 214,121 206,128" />
            </g>

            {/* destino */}
            <rect x="222" y="104" width="40" height="34" rx="8" fill={BRAND} opacity="0.9" />
            <circle cx="242" cy="121" r="8" fill="#ffffff" opacity="0.85" />
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

function FreepassIllustration() {
    return (
        <svg viewBox="0 0 320 160" preserveAspectRatio="xMidYMid slice" className="size-full" aria-hidden="true">
            <defs>
                <linearGradient id="fp-bg" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="160">
                    <stop offset="0%" stopColor={N100} />
                    <stop offset="100%" stopColor={N200} />
                </linearGradient>
            </defs>
            <rect width="320" height="160" fill="url(#fp-bg)" />

            {/* Pack de cortesias (leque de tickets) à esquerda */}
            <g transform="rotate(-10 96 80)">
                <rect x="44" y="52" width="96" height="60" rx="10" fill={N200} />
            </g>
            <g transform="rotate(-3 96 80)">
                <rect x="48" y="48" width="96" height="60" rx="10" fill={N50} stroke={BORDER} />
                <circle cx="118" cy="48" r="7" fill={N100} />
                <circle cx="118" cy="108" r="7" fill={N100} />
                <line x1="118" y1="58" x2="118" y2="98" stroke={N300} strokeWidth="2" strokeDasharray="4 5" />
                <polygon points="72,66 74.3,72.4 81.1,72.6 75.7,76.8 77.6,83.3 72,79.4 66.4,83.3 68.3,76.8 62.9,72.6 69.7,72.4" fill={BRAND} />
                <rect x="92" y="70" width="20" height="4" rx="2" fill={N400} />
                <rect x="92" y="80" width="14" height="3" rx="1.5" fill={N300} />
            </g>

            {/* Setas de distribuição para destinatários (reenvio) */}
            <g stroke={BRAND} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d="M168 78 L214 50" />
                <polyline points="206,46 214,50 210,58" />
                <path d="M168 96 L214 122" />
                <polyline points="210,114 214,122 206,124" />
            </g>

            {/* Destinatários */}
            <g>
                <circle cx="236" cy="46" r="16" fill={BRAND_SOFT} />
                <circle cx="236" cy="41" r="5" fill={BRAND} />
                <path d="M228 55 a8 7 0 0 1 16 0 Z" fill={BRAND} />
            </g>
            <g>
                <circle cx="236" cy="122" r="16" fill={N50} stroke={BORDER} />
                <circle cx="236" cy="117" r="5" fill={N400} />
                <path d="M228 131 a8 7 0 0 1 16 0 Z" fill={N400} />
            </g>
            {/* Resgate para si (check) */}
            <g>
                <circle cx="284" cy="84" r="15" fill={BRAND} />
                <polyline points="277,84 282,89 291,79" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
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
