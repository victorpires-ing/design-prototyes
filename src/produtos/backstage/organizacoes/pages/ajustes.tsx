import type { ReactNode } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/base/badges/badges";
import { ButtonGroup, ButtonGroupItem } from "@/components/base/button-group/button-group";
import { Toggle } from "@/components/base/toggle/toggle";
import { lerDoc, salvar } from "@/plataforma";
import { TITULO_PAGINA } from "@/produtos/backstage/components/titulo-pagina";
import { useTheme } from "@/providers/theme-provider";
import { BackstageLayout } from "../../components/Backstage";
import { useOrganizacaoAtual } from "../data/organizacao-atual";

/*
 * Ajustes da organização (ORG-43 a ORG-45). Os mesmos do Backstage em produção (regras de compra e
 * personalização), mais o tema da interface. Cada seção é um cartão; dentro, uma linha por ajuste.
 */

type Tema = "light" | "dark" | "system";

const Secao = ({ titulo, children }: { titulo: string; children: ReactNode }) => (
    <section className="flex flex-col gap-5 rounded-2xl bg-primary p-5 ring-1 ring-secondary md:p-6">
        <h2 className="text-lg font-semibold text-primary">{titulo}</h2>
        <div className="flex flex-col divide-y divide-secondary">{children}</div>
    </section>
);

/** Título e descrição à esquerda, controle à direita; empilha no celular. */
const Linha = ({ titulo, descricao, children }: { titulo: string; descricao: string; children: ReactNode }) => (
    <div className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 md:flex-row md:items-center md:justify-between md:gap-8">
        <div className="flex min-w-0 flex-col gap-0.5 md:max-w-xl">
            <span className="text-sm font-semibold text-primary">{titulo}</span>
            <span className="text-sm text-tertiary">{descricao}</span>
        </div>
        <div className="shrink-0">{children}</div>
    </div>
);

/** Ajuste que ainda não tem tela no protótipo: diz isso em vez de levar a lugar nenhum. */
const EmBreve = () => (
    <Badge size="sm" type="pill-color" color="gray">
        Ainda não está no protótipo
    </Badge>
);

export function Ajustes() {
    const organizacao = useOrganizacaoAtual();
    const { theme, setTheme } = useTheme();
    const atribuicao = !!organizacao?.atribuicaoADocumentos;

    const mudarAtribuicao = async (ligar: boolean) => {
        if (!organizacao) return;
        // Organização que só existe pelos eventos (banco antigo) ganha o documento na primeira gravação.
        const { eventos: _eventos, ativos: _ativos, ...base } = organizacao;
        const doc = lerDoc("organizacoes", organizacao.id) ?? base;
        await salvar("organizacoes", { ...doc, atribuicaoADocumentos: ligar });
        toast.success(ligar ? "Atribuição de ingressos a documentos ligada." : "Atribuição de ingressos a documentos desligada.");
    };

    return (
        <BackstageLayout activeProducer="ajustes" showEventContext={false} showLayoutSwitcher={false}>
            <div className="flex w-full min-w-0 flex-1 flex-col gap-6">
                <h1 className={TITULO_PAGINA}>Ajustes</h1>

                <Secao titulo="Regras de compra">
                    <Linha titulo="Termos de uso" descricao="Crie termos de uso para seus eventos, esclareça as regras e garanta o consentimento dos compradores.">
                        <EmBreve />
                    </Linha>
                    <Linha
                        titulo="Atribuição de ingressos a documentos"
                        descricao="Quando ativada, permite que os ingressos dos seus eventos sejam atribuídos diretamente a um CPF ou passaporte, sem necessidade de conta ou cadastro de convidado."
                    >
                        <Toggle aria-label="Atribuição de ingressos a documentos" isSelected={atribuicao} isDisabled={!organizacao} onChange={mudarAtribuicao} />
                    </Linha>
                </Secao>

                <Secao titulo="Personalização">
                    <Linha titulo="Mapas interativos" descricao="Crie mapas interativos para seus eventos e gerencie a disponibilidade dos assentos.">
                        <EmBreve />
                    </Linha>
                    {/* Tema da interface: vale para esta pessoa neste navegador, não para a organização (ORG-45). */}
                    <Linha titulo="Tema da interface" descricao="Claro, escuro ou o mesmo do seu sistema. Vale só para você, neste navegador.">
                        <ButtonGroup
                            size="sm"
                            aria-label="Tema da interface"
                            selectedKeys={new Set([theme])}
                            onSelectionChange={(keys) => {
                                const v = [...keys][0];
                                if (v) setTheme(v as Tema);
                            }}
                            disallowEmptySelection
                        >
                            <ButtonGroupItem id="light">Claro</ButtonGroupItem>
                            <ButtonGroupItem id="dark">Escuro</ButtonGroupItem>
                            <ButtonGroupItem id="system">Sistema</ButtonGroupItem>
                        </ButtonGroup>
                    </Linha>
                </Secao>
            </div>
        </BackstageLayout>
    );
}
