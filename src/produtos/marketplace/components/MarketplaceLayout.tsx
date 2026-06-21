import type { CSSProperties, ReactNode } from "react";
import { ArrowLeft, HelpCircle, Share07 } from "@untitledui/icons";

interface MarketplaceLayoutProps {
    /** Título exibido no subheader (nome do evento/teste). */
    title: string;
    /** Selo opcional ao lado do título (ex.: "Rascunho"). */
    badge?: string;
    /** URL da logo exibida no header (substitui o wordmark INGRESSE). */
    logo?: string;
    /** Cor de destaque (hex) — aplica a botões primários e links via variáveis do tema. */
    accent?: string;
    /** Handler do botão voltar. Omitir esconde a seta. */
    onBack?: () => void;
    /** Nome do usuário logado. Ausente = exibe o botão "Acessar conta". */
    usuario?: string;
    /** Handler do botão de conta (abre o login). */
    onAcessar?: () => void;
    children: ReactNode;
}

/** Variáveis de marca sobrescritas pela cor de destaque do evento (botões + links). */
export function accentVars(accent?: string): CSSProperties | undefined {
    if (!accent) return undefined;
    return {
        // tokens base
        "--color-bg-brand-solid": accent,
        "--color-bg-brand-solid_hover": accent,
        "--color-text-brand-secondary": accent,
        "--color-text-brand-secondary_hover": accent,
        "--color-fg-brand-primary": accent,
        "--color-border-brand": accent,
        // namespaces usados pelos utilitários (bg-, text-, border-, ring-)
        "--background-color-brand-solid": accent,
        "--background-color-brand-solid_hover": accent,
        "--text-color-brand-secondary": accent,
        "--text-color-brand-secondary_hover": accent,
        "--border-color-brand": accent,
        "--ring-color-brand": accent,
    } as CSSProperties;
}

/** Logo oficial da Ingresse (versão clara, para a barra escura). */
const INGRESSE_LOGO = "https://auth.prod.ingresse.com/resources/2ibrw/login/custom/img/ingresse-light.svg";

/**
 * Chrome do checkout Ingresse: barra superior escura (marca + usuário + país)
 * e subheader claro (voltar + título + selo, ações Compartilhar / Preciso de ajuda).
 * Reaproveitado por todas as telas do produto Marketplace.
 */
export function MarketplaceLayout({ title, badge, logo, accent, onBack, usuario, onAcessar, children }: MarketplaceLayoutProps) {
    return (
        <div className="flex h-[100dvh] flex-col overflow-hidden bg-secondary text-primary" style={accentVars(accent)}>
            {/* Barra INGRESSE (escura) */}
            <header className="bg-primary-solid h-[56px] shrink-0">
                <div className="mx-auto flex h-[56px] w-full items-center justify-between px-4 md:px-6">
                    {logo ? (
                        <img src={logo} alt="Logo do evento" className="h-7 w-auto object-contain md:h-[38px]" />
                    ) : (
                        <img src={INGRESSE_LOGO} alt="Ingresse" className="h-6 w-auto md:h-8" />
                    )}
                    <div className="flex items-center gap-3 text-sm text-white">
                        {usuario ? (
                            <button type="button" onClick={onAcessar} className="flex items-center gap-1.5 font-semibold transition hover:opacity-80">
                                {usuario}
                                <svg viewBox="0 0 12 8" className="size-2.5" fill="none" aria-hidden="true">
                                    <path d="M1 1.5 6 6.5l5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                        ) : (
                            <button type="button" onClick={onAcessar} className="font-semibold transition hover:opacity-80">
                                Acessar conta
                            </button>
                        )}
                        <span className="text-base leading-none" aria-label="Brasil">
                            🇧🇷
                        </span>
                    </div>
                </div>
            </header>

            {/* Subheader (claro) */}
            <div className="shrink-0 border-b border-secondary bg-primary">
                <div className="mx-auto flex h-16 w-full items-center justify-between gap-4 px-4 md:px-6">
                    <div className="flex min-w-0 items-center gap-3">
                        {onBack && (
                            <button type="button" onClick={onBack} aria-label="Voltar" className="shrink-0 text-fg-secondary transition hover:text-fg-primary">
                                <ArrowLeft className="size-5" />
                            </button>
                        )}
                        <h1 className="truncate text-lg font-semibold text-primary">{title}</h1>
                        {badge && <span className="shrink-0 rounded-md bg-secondary px-2 py-0.5 text-sm font-medium text-tertiary">{badge}</span>}
                    </div>
                    <div className="flex shrink-0 items-center gap-5">
                        <button type="button" className="flex items-center gap-1.5 text-sm text-secondary transition hover:text-primary">
                            <Share07 className="size-4" />
                            <span className="hidden sm:inline">Compartilhar</span>
                        </button>
                        <button type="button" className="flex items-center gap-1.5 text-sm text-secondary transition hover:text-primary">
                            <HelpCircle className="size-4" />
                            <span className="hidden sm:inline">Preciso de ajuda</span>
                        </button>
                    </div>
                </div>
            </div>

            <main className="mx-auto w-full min-h-0 flex-1 overflow-y-auto p-4">{children}</main>
        </div>
    );
}
