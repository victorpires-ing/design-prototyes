import { useEffect, useState } from "react";
import { Eye, Moon01, Sun } from "@untitledui/icons";
import { Link } from "react-router";
import { cx } from "@/utils/cx";

export type Versao = "noturno" | "claro" | "pcd";

const OPCOES: { id: Versao; label: string; icon: typeof Moon01; to: string }[] = [
    { id: "noturno", label: "Noturno", icon: Moon01, to: "/lp-ss/home" },
    { id: "claro", label: "Claro", icon: Sun, to: "/lp-ss/home/claro" },
    { id: "pcd", label: "PcD", icon: Eye, to: "/lp-ss/home/acessivel" },
];

/** Barra discreta acima do header para trocar entre as versões (Noturno / Claro / PcD). */
export function VersaoSwitch({ atual }: { atual: Versao }) {
    const escuro = atual === "noturno";
    const [oculto, setOculto] = useState(false);
    useEffect(() => {
        const onScroll = () => setOculto(window.scrollY > 40);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);
    return (
        <div
            className={cx(
                "fixed inset-x-0 top-0 z-[60] h-9 transition-transform duration-300",
                oculto && "-translate-y-full",
                escuro ? "border-b border-white/10 bg-black text-white/60" : "border-b border-neutral-200 bg-neutral-100 text-neutral-500",
            )}
        >
            <div className="mx-auto flex h-full max-w-6xl items-center justify-end gap-1.5 px-5 md:px-8">
                <span className="mr-1 hidden text-xs font-medium sm:inline">Versão:</span>
                {OPCOES.map((o) => {
                    const ativo = o.id === atual;
                    const Icon = o.icon;
                    return (
                        <Link
                            key={o.id}
                            to={o.to}
                            aria-current={ativo ? "page" : undefined}
                            className={cx(
                                "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition",
                                ativo
                                    ? escuro
                                        ? "bg-white text-black"
                                        : "bg-neutral-900 text-white"
                                    : escuro
                                      ? "hover:bg-white/10 hover:text-white"
                                      : "hover:bg-neutral-200 hover:text-neutral-900",
                            )}
                        >
                            <Icon className="size-3.5" aria-hidden="true" />
                            {o.label}
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
