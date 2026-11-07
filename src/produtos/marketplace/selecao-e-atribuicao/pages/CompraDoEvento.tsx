import { useParams } from "react-router";
import { CalendarCheck01, SearchLg } from "@untitledui/icons";
import { EmptyState } from "@/components/application/empty-state/empty-state";
import { LoadingIndicator } from "@/components/application/loading-indicator/loading-indicator";
import { Button } from "@/components/base/buttons/button";
import { useBanco, useColecao, vendeNoLink } from "@/plataforma";
import { SelecaoEAtribuicao } from "./SelecaoEAtribuicao";

/**
 * Link de compra de um evento do banco unificado.
 * /comprar/:eventoId (botão do site) e /e/:slug (link copiado no Backstage).
 */
export function CompraDoEvento() {
    const { eventoId, slug } = useParams();
    const { modo } = useBanco();
    const eventos = useColecao("eventos");
    const evento = eventos.find((e) => (eventoId ? e.id === eventoId : e.slug === slug));

    if (modo === "carregando") {
        return (
            <div className="flex min-h-screen items-center justify-center bg-primary">
                <LoadingIndicator type="line-spinner" size="md" label="Carregando evento" />
            </div>
        );
    }

    if (!evento) return <Aviso icone={SearchLg} titulo="Não encontramos este evento" texto="Confira o link com quem enviou. Ele pode ter sido digitado errado ou o evento foi removido." />;

    if (!vendeNoLink(evento.status)) {
        const encerrado = evento.status === "encerrado";
        return (
            <Aviso
                icone={CalendarCheck01}
                titulo={encerrado ? "As vendas deste evento terminaram" : "As vendas ainda não começaram"}
                texto={encerrado ? `${evento.nome} não vende mais ingressos.` : `Volte mais tarde: ${evento.nome} ainda está sendo preparado pela produção.`}
            />
        );
    }

    return <SelecaoEAtribuicao evento={evento} />;
}

function Aviso({ icone, titulo, texto }: { icone: typeof SearchLg; titulo: string; texto: string }) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-primary px-4">
            <EmptyState size="md">
                <EmptyState.Header>
                    <EmptyState.FeaturedIcon icon={icone} color="gray" />
                </EmptyState.Header>
                <EmptyState.Content>
                    <EmptyState.Title>{titulo}</EmptyState.Title>
                    <EmptyState.Description>{texto}</EmptyState.Description>
                </EmptyState.Content>
                <EmptyState.Footer>
                    <Button size="md" color="secondary" href="/novo-site/home">
                        Ver outros eventos
                    </Button>
                </EmptyState.Footer>
            </EmptyState>
        </div>
    );
}
