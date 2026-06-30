import type { ReactNode } from "react";
import { GraduationHat01, SearchLg } from "@untitledui/icons";
import { useNavigate } from "react-router";
import { cx } from "@/utils/cx";
import { useDarkTheme } from "./use-dark-theme";

export type AcademySection = "inicio" | "cursos" | "tutoriais" | "presencial" | "sports-week" | "favoritos";

const NAV: { id: AcademySection; label: string; href: string }[] = [
    { id: "inicio", label: "Início", href: "/ticket/ts-academy" },
    { id: "cursos", label: "Cursos", href: "/ticket/ts-academy" },
    { id: "tutoriais", label: "Tutoriais", href: "/ticket/ts-academy" },
    { id: "presencial", label: "Presencial", href: "/ticket/ts-academy/presencial" },
    { id: "sports-week", label: "Sports Week", href: "/ticket/ts-academy/sports-week" },
    { id: "favoritos", label: "Favoritos", href: "/ticket/ts-academy" },
];

interface AcademyLayoutProps {
    children: ReactNode;
    active?: AcademySection;
    /** Campo/área de busca controlada pela página, exibida no header (desktop). */
    search?: ReactNode;
    /** Handler do ícone de busca (mobile). */
    onSearch?: () => void;
}

/**
 * Shell estilo streaming (Netflix/Max/Disney+) do produto Ticket (TS Academy).
 * Toda a navegação fica no header; sem menu lateral e sem tab bar inferior.
 * Visão noturna forçada e fundo cinematográfico edge-to-edge.
 */
export function AcademyLayout({ children, active = "inicio", search, onSearch }: AcademyLayoutProps) {
    useDarkTheme();
    const navigate = useNavigate();

    return (
        <div className="min-h-dvh bg-[#0b0b0f] text-white">
            {/* ===== Header (toda a navegação) ===== */}
            <header className="fixed inset-x-0 top-0 z-50 bg-gradient-to-b from-black/95 via-black/80 to-transparent">
                <div className="mx-auto flex max-w-[1600px] items-center gap-4 px-4 py-3 md:gap-8 md:px-10 md:py-4">
                    {/* Logo */}
                    <button type="button" onClick={() => navigate("/ticket/ts-academy")} className="flex shrink-0 items-center gap-2">
                        <span className="flex size-8 items-center justify-center rounded-lg bg-[#E50914] text-white">
                            <GraduationHat01 className="size-5" />
                        </span>
                        <span className="text-lg font-extrabold tracking-tight">
                            TS <span className="text-[#E50914]">Academy</span>
                        </span>
                    </button>

                    {/* Navegação */}
                    <nav className="flex min-w-0 flex-1 items-center gap-4 overflow-x-auto md:gap-6 [&::-webkit-scrollbar]:hidden">
                        {NAV.map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => navigate(item.href)}
                                className={cx(
                                    "shrink-0 text-sm font-semibold transition duration-100",
                                    item.id === active ? "text-white" : "text-white/60 hover:text-white",
                                )}
                            >
                                {item.label}
                            </button>
                        ))}
                    </nav>

                    {/* Busca + avatar */}
                    <div className="flex shrink-0 items-center gap-3">
                        {search && <div className="hidden w-64 md:block">{search}</div>}
                        <button
                            type="button"
                            onClick={onSearch}
                            aria-label="Buscar"
                            className="flex size-9 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10 md:hidden"
                        >
                            <SearchLg className="size-5" />
                        </button>
                        <span className="flex size-9 items-center justify-center rounded-md bg-[#E50914] text-sm font-bold text-white">W</span>
                    </div>
                </div>
            </header>

            {children}
        </div>
    );
}
