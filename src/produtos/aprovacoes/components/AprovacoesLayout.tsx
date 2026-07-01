import type { ReactNode } from "react";
import { LogOut01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import logomark from "./assets/ingresse-logomark.svg";
import logotext from "./assets/ingresse-logotext.svg";

interface AprovacoesLayoutProps {
    children: ReactNode;
    /** Texto auxiliar ao lado da logo (ex.: "Triagem de cadastros"). */
    titulo?: string;
    /** Nome do usuário logado exibido à direita. */
    usuario?: string;
}

/**
 * Shell do produto Aprovações: top bar fixa (Figma São Silvestre / Header navigation).
 * Esquerda: logo Ingresse + título auxiliar. Direita: nome do usuário + botão "Sair".
 */
export function AprovacoesLayout({ children, titulo = "Triagem de cadastros", usuario = "Ana Soares" }: AprovacoesLayoutProps) {
    return (
        <div className="min-h-screen bg-primary text-primary">
            {/* Top bar fixa */}
            <header className="fixed inset-x-0 top-0 z-50 flex flex-col items-center border-b border-secondary bg-primary">
                <div className="flex min-h-16 w-full max-w-container items-center justify-between px-4 md:px-8">
                    {/* Esquerda: logo + título */}
                    <div className="flex items-end gap-2">
                        <a href="/" aria-label="Ingresse" className="flex items-start gap-[5px] rounded-xs outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2">
                            <img src={logomark} alt="" aria-hidden="true" className="h-6 w-5 shrink-0" />
                            <img src={logotext} alt="Ingresse" className="h-6 w-[67px] shrink-0" />
                        </a>
                        {titulo && <p className="text-xs text-tertiary whitespace-nowrap">{titulo}</p>}
                    </div>

                    {/* Direita: usuário + sair */}
                    <div className="flex items-center gap-5">
                        <span className="text-sm font-semibold text-secondary whitespace-nowrap">{usuario}</span>
                        <Button size="sm" color="secondary" iconTrailing={LogOut01}>
                            Sair
                        </Button>
                    </div>
                </div>
            </header>

            {/* Conteúdo (offset da top bar) */}
            <main className="pt-16">{children}</main>
        </div>
    );
}
