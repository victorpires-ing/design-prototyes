import { useNavigate } from "react-router";
import { ArrowLeft, ChevronRight, LayersThree01, SwitchHorizontal01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import type { FC } from "react";

interface Experiencia {
    id: string;
    nome: string;
    descricao: string;
    to: string;
    icone: FC<{ className?: string }>;
    gradiente: string;
}

/**
 * Agrupador do produto Novos negócios: escolhe qual experiência abrir.
 * Para incluir outra, basta adicionar um item aqui e registrar a rota.
 */
const EXPERIENCIAS: Experiencia[] = [
    {
        id: "marketplace",
        nome: "Marketplace de Revenda",
        descricao: "Canal oficial de revenda de ingressos",
        to: "/novos-negocios/marketplace",
        icone: SwitchHorizontal01,
        gradiente: "linear-gradient(135deg,#fff5e4 0%,#ffd7a8 100%)",
    },
    {
        id: "servicos-adicionais",
        nome: "Serviços adicionais",
        descricao: "Uber e recarga antecipada para o evento",
        to: "/novos-negocios/servicos-adicionais",
        icone: LayersThree01,
        gradiente: "linear-gradient(135deg,#1a0a14 0%,#ff271a 100%)",
    },
];

export function Inicio() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-primary px-4 py-12 md:px-6">
            <div className="mx-auto w-full max-w-3xl">
                <Button size="sm" color="link-gray" iconLeading={ArrowLeft} onClick={() => navigate("/")}>
                    Produtos
                </Button>

                <h1 className="mt-5 text-3xl font-bold text-primary">Novos negócios</h1>

                <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
                    {EXPERIENCIAS.map(({ id, nome, descricao, to, icone: Icone, gradiente }) => (
                        <button
                            key={id}
                            type="button"
                            onClick={() => navigate(to)}
                            className="group flex flex-col overflow-hidden rounded-2xl text-left ring-1 ring-border-secondary outline-focus-ring transition duration-150 ease-linear hover:-translate-y-1 hover:ring-brand focus-visible:outline-2 focus-visible:outline-offset-2"
                        >
                            <div className="flex h-36 items-end p-4" style={{ background: gradiente }}>
                                <span className="flex size-10 items-center justify-center rounded-lg bg-white/90 shadow-xs">
                                    <Icone className="size-5 text-gray-900" aria-hidden="true" />
                                </span>
                            </div>
                            <div className="flex items-center justify-between gap-2 border-t border-secondary bg-secondary/60 px-4 py-4">
                                <div className="min-w-0">
                                    <p className="text-md font-semibold text-primary">{nome}</p>
                                    <p className="truncate text-sm text-tertiary">{descricao}</p>
                                </div>
                                <ChevronRight className="size-5 shrink-0 text-fg-quaternary transition group-hover:text-fg-secondary" aria-hidden="true" />
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
