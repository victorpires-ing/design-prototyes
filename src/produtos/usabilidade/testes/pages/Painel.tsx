import { useEffect, useState } from "react";
import { BarChartSquare02, Copy01, Edit01, Beaker02, Link03, Plus, Trash02 } from "@untitledui/icons";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { EmptyState } from "@/components/application/empty-state/empty-state";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { usabilityStore } from "@/lib/usability";
import type { Teste, TesteStatus } from "@/lib/usability";

const STATUS_BADGE: Record<TesteStatus, { label: string; color: "gray" | "success" | "warning" }> = {
    rascunho: { label: "Rascunho", color: "gray" },
    ativo: { label: "Ativo", color: "success" },
    encerrado: { label: "Encerrado", color: "warning" },
};

export function Painel() {
    const navigate = useNavigate();
    const [testes, setTestes] = useState<Teste[] | null>(null);

    const carregar = () => usabilityStore.listTestes().then((t) => setTestes(t.sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))));

    useEffect(() => {
        carregar();
    }, []);

    const copiarLink = (id: string) => {
        const url = `${window.location.origin}/t/${id}`;
        navigator.clipboard.writeText(url);
        toast.success("Link copiado", { description: url });
    };

    const excluir = async (teste: Teste) => {
        if (!window.confirm(`Excluir o teste "${teste.nome}"? As respostas também serão removidas.`)) return;
        await usabilityStore.removeTeste(teste.id);
        toast.success("Teste excluído");
        carregar();
    };

    return (
        <div className="min-h-screen bg-quaternary text-primary">
            <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-10 sm:px-6">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-2xl font-semibold text-primary">Painel de testes</h1>
                        <p className="text-sm text-tertiary">Crie testes de usabilidade sobre os protótipos e acompanhe os resultados.</p>
                    </div>
                    <Button size="md" color="primary" iconLeading={Plus} onClick={() => navigate("/testes/novo")}>
                        Novo teste
                    </Button>
                </div>

                {testes === null ? (
                    <p className="py-12 text-center text-sm text-tertiary">Carregando…</p>
                ) : testes.length === 0 ? (
                    <div className="flex flex-1 items-center justify-center py-16">
                        <EmptyState size="md">
                            <EmptyState.FeaturedIcon icon={Beaker02} color="brand" theme="modern-neue" />
                            <EmptyState.Content>
                                <EmptyState.Title>Nenhum teste ainda</EmptyState.Title>
                                <EmptyState.Description>Crie seu primeiro teste de usabilidade para começar a coletar respostas.</EmptyState.Description>
                            </EmptyState.Content>
                            <EmptyState.Footer>
                                <Button size="md" color="primary" iconLeading={Plus} onClick={() => navigate("/testes/novo")}>
                                    Novo teste
                                </Button>
                            </EmptyState.Footer>
                        </EmptyState>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {testes.map((teste) => (
                            <div
                                key={teste.id}
                                className="flex items-center gap-4 rounded-xl bg-primary p-4 ring-1 ring-border-secondary transition-colors duration-100 ease-linear hover:bg-primary_hover"
                            >
                                <FeaturedIcon icon={Beaker02} color="gray" theme="modern" size="md" />
                                <button type="button" onClick={() => navigate(`/testes/${teste.id}/resultados`)} className="flex min-w-0 flex-1 flex-col items-start gap-1 text-left">
                                    <div className="flex items-center gap-2">
                                        <span className="truncate text-sm font-semibold text-primary">{teste.nome}</span>
                                        <Badge size="sm" type="pill-color" color={STATUS_BADGE[teste.status].color}>
                                            {STATUS_BADGE[teste.status].label}
                                        </Badge>
                                    </div>
                                    <span className="text-xs text-tertiary">
                                        {teste.atividades.length} {teste.atividades.length === 1 ? "atividade" : "atividades"}
                                        {teste.umaVezPorDispositivo ? " · 1× por dispositivo" : " · repetível"}
                                    </span>
                                </button>
                                <div className="flex shrink-0 items-center gap-1">
                                    <ButtonUtility size="sm" color="tertiary" icon={Link03} tooltip="Abrir link do teste" onClick={() => window.open(`/t/${teste.id}`, "_blank")} />
                                    <ButtonUtility size="sm" color="tertiary" icon={Copy01} tooltip="Copiar link" onClick={() => copiarLink(teste.id)} />
                                    <ButtonUtility size="sm" color="tertiary" icon={BarChartSquare02} tooltip="Resultados" onClick={() => navigate(`/testes/${teste.id}/resultados`)} />
                                    <ButtonUtility size="sm" color="tertiary" icon={Edit01} tooltip="Editar" onClick={() => navigate(`/testes/${teste.id}/editar`)} />
                                    <ButtonUtility size="sm" color="tertiary" icon={Trash02} tooltip="Excluir" onClick={() => excluir(teste)} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
