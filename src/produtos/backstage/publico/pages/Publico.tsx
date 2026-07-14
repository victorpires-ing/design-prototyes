import { useNavigate } from "react-router";
import { ChevronRight } from "@untitledui/icons";
import { BackstageLayout } from "../../components/Backstage";

const CARDS = [
    {
        id: "segmentacoes",
        titulo: "Segmentações",
        descricao: "Organize seu público em grupos para personalizar acessos, comunicações e experiências.",
        href: undefined as string | undefined,
    },
    {
        id: "formulario",
        titulo: "Formulário de participação",
        descricao: "Revise os pedidos recebidos e aprove quem pode entrar em uma segmentação.",
        href: "/backstage/publico/formularios",
    },
];

/** Backstage → Público: landing com os acessos de segmentações e formulário de participação. */
export function Publico() {
    const navigate = useNavigate();

    return (
        <BackstageLayout showEventContext={false} activeProducer="publico">
            <div className="flex min-w-0 flex-1 flex-col gap-6 px-4 py-6 md:px-6">
                <h1 className="text-display-xs font-bold text-primary">Público</h1>

                <div className="flex flex-col gap-3">
                    {CARDS.map((card) => (
                        <button
                            key={card.id}
                            type="button"
                            onClick={() => card.href && navigate(card.href)}
                            className="flex w-full items-center gap-4 rounded-xl bg-primary px-5 py-4 text-left ring-1 ring-border-secondary outline-none transition duration-100 ease-linear hover:bg-primary_hover focus-visible:ring-2 focus-visible:ring-brand"
                        >
                            <div className="flex min-w-px flex-1 flex-col gap-1">
                                <span className="text-md font-bold text-primary">{card.titulo}</span>
                                <span className="text-sm text-tertiary">{card.descricao}</span>
                            </div>
                            <ChevronRight className="size-5 shrink-0 text-fg-quaternary" aria-hidden="true" />
                        </button>
                    ))}
                </div>
            </div>
        </BackstageLayout>
    );
}
