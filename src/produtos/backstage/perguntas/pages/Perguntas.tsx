import { ChevronLeft, Plus } from "@untitledui/icons";
import { useNavigate } from "react-router";
import { Button } from "@/components/base/buttons/button";
import { BackstageLayout } from "../../components/Backstage";
import { PerguntasEmptyState } from "../components/PerguntasEmptyState";
import { PerguntasList } from "../components/PerguntasList";
import { usePerguntas } from "../data/perguntas-store";
import { TITULO_PAGINA } from "@/produtos/backstage/components/titulo-pagina";

export function Perguntas() {
    const navigate = useNavigate();
    const { perguntas, togglePergunta, removePergunta } = usePerguntas();

    const isEmpty = perguntas.length === 0;

    return (
        <BackstageLayout activeProducer="perguntas" showEventContext={false}>
            <div className="flex min-w-0 flex-1 flex-col gap-6">
                <header className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        aria-label="Voltar"
                        className="flex size-9 shrink-0 items-center justify-center rounded-lg text-fg-secondary ring-1 ring-border-secondary transition duration-100 ease-linear hover:bg-secondary"
                    >
                        <ChevronLeft className="size-5" />
                    </button>
                    <h1 className={TITULO_PAGINA}>Perguntas</h1>

                    {!isEmpty && (
                        <Button
                            size="md"
                            color="primary"
                            iconLeading={Plus}
                            className="ml-auto"
                            onClick={() => navigate("/backstage/perguntas/nova")}
                        >
                            Nova pergunta
                        </Button>
                    )}
                </header>

                {isEmpty ? (
                    <PerguntasEmptyState onCreate={() => navigate("/backstage/perguntas/nova")} />
                ) : (
                    <main className="flex flex-1 flex-col gap-6">
                        <PerguntasList
                            perguntas={perguntas}
                            onToggle={togglePergunta}
                            onEdit={(id) => navigate(`/backstage/perguntas/${id}/editar`)}
                            onDelete={removePergunta}
                        />
                    </main>
                )}
            </div>
        </BackstageLayout>
    );
}
