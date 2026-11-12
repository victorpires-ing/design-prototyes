import { BackstageLayout } from "../../components/Backstage";
import { ConfiguracoesDeIngressos } from "../components/configuracoes-de-ingressos";
import { useCatalogo } from "../data/catalogo";
import { AbasDeItens } from "../../components/abas-de-itens";

/** Itens › Configurações de ingressos (ITM-66): página própria, aberta pelo botão do topo de Itens (BKS-17). */
export function Configuracoes() {
    const { carregando, evento } = useCatalogo();
    return (
        <BackstageLayout activeSection="itens" activeItem="catalogo-configuracoes">
            <div className="flex min-w-0 flex-1 flex-col gap-6">
                <AbasDeItens ativa="configuracoes" />
                {carregando || !evento ? (
                    <span role="status" aria-label="Carregando configurações" className="h-96 w-full animate-pulse rounded-2xl bg-secondary motion-reduce:animate-none" />
                ) : (
                    <ConfiguracoesDeIngressos evento={evento} />
                )}
            </div>
        </BackstageLayout>
    );
}
