import { useEffect, useSyncExternalStore } from "react";
import { CommandDialog } from "@/components/application/command-menus/command-menu";
import { BuscaOrganizacaoEvento } from "./BuscaOrganizacaoEvento";

/* Modal de troca de organização (ORG-20 a ORG-23). Aberto pelo avatar do rail, pelo chip do topo,
   pela gaveta mobile ou por ⌘K / Ctrl+K em qualquer tela do Backstage. */

let aberto = false;
const ouvintes = new Set<() => void>();
const definir = (v: boolean) => {
    aberto = v;
    ouvintes.forEach((o) => o());
};

export const abrirSeletorDeOrganizacao = () => definir(true);

export function SeletorOrganizacaoModal() {
    const isOpen = useSyncExternalStore(
        (fn) => {
            ouvintes.add(fn);
            return () => ouvintes.delete(fn);
        },
        () => aberto,
        () => false,
    );

    useEffect(() => {
        const aoTeclar = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === "k") {
                e.preventDefault();
                definir(!aberto);
            }
        };
        window.addEventListener("keydown", aoTeclar);
        return () => window.removeEventListener("keydown", aoTeclar);
    }, []);

    return (
        <CommandDialog isOpen={isOpen} onOpenChange={definir} dialogClassName="w-full max-w-160">
            {/* Remonta a cada abertura: busca vazia e recentes atualizados. */}
            {isOpen && <BuscaOrganizacaoEvento variante="modal" aoEscolher={() => definir(false)} />}
        </CommandDialog>
    );
}
