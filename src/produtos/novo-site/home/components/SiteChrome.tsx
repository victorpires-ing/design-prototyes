import { useLocation } from "react-router";
import { Bell01, ChevronDown, MarkerPin01, SearchLg, Settings01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { cx } from "@/utils/cx";
import { CIDADES, setCidade, useCidade } from "../data/cidade-store";
import logoBlack from "../../../../assets/Company logo_black.svg";
import logoWhite from "../../../../assets/Company logo_white.svg";

// Links provisórios para navegar entre as páginas criadas (header real vem depois).
const NAV_LINKS = [
    { label: "Categorias", href: "/novo-site/home/categorias" },
    { label: "Evento", href: "/novo-site/home/event-details" },
];
const FOOTER_LINKS = ["Overview", "Features", "Pricing", "Careers", "Help", "Privacy"];

/* ------------------------------------------------------------------ */
/*  Header                                                            */
/* ------------------------------------------------------------------ */

export function HeaderNav({ onOpenConfig }: { onOpenConfig?: () => void }) {
    const { pathname } = useLocation();
    const cidade = useCidade();
    return (
        <header className="sticky top-0 z-40 border-b border-secondary bg-primary">
            <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 lg:gap-5 lg:px-8">
                <img src={logoBlack} alt="Ingresse" className="h-6 shrink-0 dark:invert" />

                {/* Seletor de cidade */}
                <Dropdown.Root>
                    <Button color="link-gray" size="sm" iconLeading={MarkerPin01} iconTrailing={ChevronDown} className="shrink-0 max-sm:px-1">
                        {cidade}
                    </Button>
                    <Dropdown.Popover className="w-56">
                        <Dropdown.Menu>
                            {CIDADES.map((c) => (
                                <Dropdown.Item key={c} label={c} icon={MarkerPin01} onAction={() => setCidade(c)} />
                            ))}
                        </Dropdown.Menu>
                    </Dropdown.Popover>
                </Dropdown.Root>

                <nav className="flex items-center gap-1">
                    {NAV_LINKS.map((link) => {
                        const ativo = pathname === link.href;
                        return (
                            <a
                                key={link.href}
                                href={link.href}
                                aria-current={ativo ? "page" : undefined}
                                className={cx(
                                    "rounded-md px-3 py-2 text-sm font-semibold transition duration-100 ease-linear hover:bg-secondary",
                                    ativo ? "text-primary" : "text-tertiary",
                                )}
                            >
                                {link.label}
                            </a>
                        );
                    })}
                </nav>

                <div className="flex flex-1 items-center justify-end gap-1">
                    <IconButton icon={SearchLg} label="Buscar" />
                    {onOpenConfig && <IconButton icon={Settings01} label="Configurar evento" onClick={onOpenConfig} />}
                    <div className="relative">
                        <IconButton icon={Bell01} label="Notificações" />
                        <span className="absolute top-1 right-1 grid size-4 place-items-center rounded-full bg-brand-solid text-[10px] font-semibold text-white">
                            2
                        </span>
                    </div>
                    <Button size="sm" color="secondary" iconTrailing={ChevronDown} className="ml-2 max-md:hidden">
                        Account
                    </Button>
                </div>
            </div>
        </header>
    );
}

function IconButton({ icon: Icon, label, onClick }: { icon: typeof Bell01; label: string; onClick?: () => void }) {
    return (
        <button
            type="button"
            aria-label={label}
            onClick={onClick}
            className="flex size-9 items-center justify-center rounded-lg text-fg-secondary transition duration-100 ease-linear hover:bg-secondary"
        >
            <Icon className="size-5" />
        </button>
    );
}

/* ------------------------------------------------------------------ */
/*  Footer                                                            */
/* ------------------------------------------------------------------ */

export function Footer() {
    return (
        <footer className="bg-[#0a0a0a] text-white">
            <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8 lg:py-16">
                <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex flex-col gap-8">
                        <img src={logoWhite} alt="Ingresse" className="h-6 self-start" />
                        <h2 className="text-display-sm font-semibold lg:text-display-md">
                            Ao vivo,
                            <br />
                            ao máximo.
                        </h2>
                    </div>

                    <div className="flex flex-col gap-3">
                        <span className="text-sm font-semibold text-white/70">Baixe o app Ingresse</span>
                        <div className="flex flex-col gap-2.5">
                            <StoreBadge store="apple" />
                            <StoreBadge store="google" />
                        </div>
                    </div>
                </div>

                <nav className="mt-10 flex flex-wrap gap-x-6 gap-y-3">
                    {FOOTER_LINKS.map((link) => (
                        <a key={link} href="#" className="text-sm font-semibold text-white/70 transition duration-100 ease-linear hover:text-white">
                            {link}
                        </a>
                    ))}
                </nav>

                <div className="mt-10 flex flex-col gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-white/50">© 2026 Todos os direitos reservados</p>
                    <div className="flex items-center gap-4 text-white/50">
                        <SocialIcon network="instagram" />
                        <SocialIcon network="tiktok" />
                        <SocialIcon network="linkedin" />
                    </div>
                </div>
            </div>
        </footer>
    );
}

function StoreBadge({ store }: { store: "apple" | "google" }) {
    return (
        <a
            href="#"
            className="flex w-40 items-center gap-2.5 rounded-lg border border-white/20 bg-black px-3 py-2 transition duration-100 ease-linear hover:bg-white/5"
        >
            {store === "apple" ? (
                <svg viewBox="0 0 24 24" className="size-6 shrink-0 fill-white" aria-hidden="true">
                    <path d="M17.05 12.54c-.02-2.07 1.69-3.06 1.77-3.11-0.96-1.41-2.46-1.6-3-1.62-1.27-.13-2.49.75-3.14.75-.65 0-1.65-.73-2.71-.71-1.39.02-2.68.81-3.4 2.06-1.45 2.52-.37 6.25 1.04 8.29.69 1 1.51 2.12 2.58 2.08 1.04-.04 1.43-.67 2.68-.67 1.25 0 1.6.67 2.7.65 1.11-.02 1.82-1.02 2.5-2.02.79-1.16 1.11-2.28 1.13-2.34-.02-.01-2.17-.83-2.19-3.29zM15.1 5.82c.57-.69.96-1.65.85-2.61-.82.03-1.82.55-2.41 1.24-.53.61-1 1.59-.87 2.53.92.07 1.86-.47 2.43-1.16z" />
                </svg>
            ) : (
                <svg viewBox="0 0 24 24" className="size-6 shrink-0" aria-hidden="true">
                    <path d="M3.6 2.3 13 11.7l2.6-2.6L5.1 2.1c-.5-.3-1.1-.2-1.5.2z" fill="#34a853" />
                    <path d="M3 2.6C2.9 2.8 2.8 3 2.8 3.3v17.4c0 .3.1.5.2.7L12.4 12 3 2.6z" fill="#4285f4" />
                    <path d="M16.8 8.9 13 11.7l3.8 3.8 3.6-2.1c.7-.4.7-1.4 0-1.8l-3.6-2.7z" fill="#fbbc04" />
                    <path d="M3 21.4c.4.4 1 .5 1.5.2l11.3-6.1-2.8-3.8L3 21.4z" fill="#ea4335" />
                </svg>
            )}
            <span className="flex flex-col leading-tight">
                <span className="text-[9px] text-white/70">{store === "apple" ? "Download on the" : "GET IT ON"}</span>
                <span className="text-sm font-semibold text-white">{store === "apple" ? "App Store" : "Google Play"}</span>
            </span>
        </a>
    );
}

function SocialIcon({ network }: { network: "instagram" | "tiktok" | "linkedin" }) {
    const paths: Record<typeof network, string> = {
        instagram:
            "M12 2c2.7 0 3 0 4.1.06 1.1.05 1.8.24 2.4.5.7.27 1.2.63 1.8 1.2.6.6.95 1.1 1.2 1.8.26.6.45 1.3.5 2.4.06 1.1.06 1.4.06 4.1s0 3-.06 4.1c-.05 1.1-.24 1.8-.5 2.4-.27.7-.63 1.2-1.2 1.8-.6.6-1.1.95-1.8 1.2-.6.26-1.3.45-2.4.5-1.1.06-1.4.06-4.1.06s-3 0-4.1-.06c-1.1-.05-1.8-.24-2.4-.5-.7-.27-1.2-.63-1.8-1.2-.6-.6-.95-1.1-1.2-1.8-.26-.6-.45-1.3-.5-2.4C2 15 2 14.7 2 12s0-3 .06-4.1c.05-1.1.24-1.8.5-2.4.27-.7.63-1.2 1.2-1.8.6-.6 1.1-.95 1.8-1.2.6-.26 1.3-.45 2.4-.5C9 2 9.3 2 12 2zm0 1.8c-2.7 0-3 0-4 .06-1 .04-1.5.22-1.9.36-.5.18-.8.4-1.2.8-.4.4-.62.7-.8 1.2-.14.4-.32.9-.36 1.9-.05 1-.06 1.3-.06 4s0 3 .06 4c.04 1 .22 1.5.36 1.9.18.5.4.8.8 1.2.4.4.7.62 1.2.8.4.14.9.32 1.9.36 1 .05 1.3.06 4 .06s3 0 4-.06c1-.04 1.5-.22 1.9-.36.5-.18.8-.4 1.2-.8.4-.4.62-.7.8-1.2.14-.4.32-.9.36-1.9.05-1 .06-1.3.06-4s0-3-.06-4c-.04-1-.22-1.5-.36-1.9-.18-.5-.4-.8-.8-1.2-.4-.4-.7-.62-1.2-.8-.4-.14-.9-.32-1.9-.36-1-.05-1.3-.06-4-.06zm0 3.1a5.1 5.1 0 110 10.2 5.1 5.1 0 010-10.2zm0 1.8a3.3 3.3 0 100 6.6 3.3 3.3 0 000-6.6zm5.3-3.2a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z",
        tiktok: "M16.6 5.8c-.9-.6-1.5-1.5-1.7-2.6h-2.5v10.4a2.3 2.3 0 11-1.7-2.2v-2.6a4.9 4.9 0 103.6 4.7V8.9c.9.6 2 1 3.1 1V7.4c-.3 0-.6 0-.8-.1z",
        linkedin:
            "M6.94 5a1.94 1.94 0 11-3.88 0 1.94 1.94 0 013.88 0zM3.3 8.4h3.3V21H3.3V8.4zm5.4 0h3.16v1.7h.05c.44-.83 1.5-1.7 3.1-1.7 3.3 0 3.9 2.18 3.9 5v6.6h-3.3v-5.85c0-1.4-.02-3.2-1.95-3.2-1.95 0-2.25 1.52-2.25 3.1V21H8.7V8.4z",
    };
    return (
        <a href="#" aria-label={network} className="transition duration-100 ease-linear hover:text-white">
            <svg viewBox="0 0 24 24" className="size-5 fill-current" aria-hidden="true">
                <path d={paths[network]} />
            </svg>
        </a>
    );
}
