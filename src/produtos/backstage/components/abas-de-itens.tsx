import { ArrowLeft, CalendarDate, Settings01 } from "@untitledui/icons";
import { Tab, TabList, Tabs } from "@/components/application/tabs/tabs";
import { Button } from "@/components/base/buttons/button";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { TITULO_PAGINA } from "./titulo-pagina";

/*
 * Itens numa página só (BKS-17): título "Itens" e três abas, uma por coisa que o evento vende
 * (Ingressos, Produtos, Combos), cada uma com a própria rota (a aba fica na URL). Três abas cabem
 * numa linha também no celular (390 px), sem rolar nem quebrar.
 * Aberturas de vendas (quando tudo isso vende) e Configurações de ingressos (regras do evento todo)
 * não são listas de itens: viram botões no topo, cada um com página própria e voltar para Itens.
 * Fica nos componentes compartilhados porque as telas vêm de projetos diferentes (itens/,
 * aberturas-de-vendas/), que não importam uns dos outros. Questionário não é aba: tem destino próprio no menu (BKS-18).
 */

export type AbaDeItens = "ingressos" | "produtos" | "combos" | "aberturas" | "configuracoes";

const ABAS: { id: AbaDeItens; label: string; href: string }[] = [
    { id: "ingressos", label: "Ingressos", href: "/backstage/catalogo/ingressos" },
    { id: "produtos", label: "Produtos", href: "/backstage/catalogo/produtos" },
    { id: "combos", label: "Combos", href: "/backstage/catalogo/combos" },
];

/** Páginas abertas pelos botões do topo de Itens: título e subtítulo próprios, com voltar para Itens. */
const PAGINAS: Partial<Record<AbaDeItens, { titulo: string; subtitulo: string }>> = {
    aberturas: { titulo: "Aberturas de vendas", subtitulo: "Quando cada ingresso, produto e combo vende." },
    configuracoes: { titulo: "Configurações de ingressos", subtitulo: "Regras de compra e de acesso que valem para todos os ingressos do evento." },
};

export function AbasDeItens({ ativa }: { ativa: AbaDeItens }) {
    const desktop = useBreakpoint("md");
    const pagina = PAGINAS[ativa];

    if (pagina) {
        return (
            <header className="flex flex-col items-start gap-4">
                <Button color="tertiary" size="md" iconLeading={ArrowLeft} href="/backstage/catalogo/ingressos" className="-ml-3">
                    Itens
                </Button>
                <div className="flex flex-col gap-1">
                    <h1 className={TITULO_PAGINA}>{pagina.titulo}</h1>
                    <p className="text-md text-tertiary">{pagina.subtitulo}</p>
                </div>
            </header>
        );
    }

    return (
        <div className="flex flex-col gap-5">
            <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex min-w-0 flex-col gap-1">
                    <h1 className={TITULO_PAGINA}>Itens</h1>
                    <p className="text-md text-tertiary">O que o evento vende, quando vende e as regras de compra.</p>
                </div>
                <div className="flex shrink-0 gap-3">
                    {/* Os dois com nome visível também no celular: lá, "Aberturas" curto, para caberem lado a lado em 390 px. */}
                    <Button color="secondary" size="md" iconLeading={CalendarDate} href="/backstage/catalogo/aberturas-de-vendas">
                        <span className="md:hidden">Aberturas</span>
                        <span className="max-md:hidden">Aberturas de vendas</span>
                    </Button>
                    <Button color="secondary" size="md" iconLeading={Settings01} href="/backstage/catalogo/configuracoes">
                        Configurações
                    </Button>
                </div>
            </header>
            {/* No celular as três dividem a largura; no desktop, cada aba do tamanho do nome. */}
            <Tabs selectedKey={ativa}>
                <TabList type="underline" size="sm" fullWidth={!desktop} aria-label="Itens do evento">
                    {ABAS.map((a) => (
                        <Tab key={a.id} id={a.id} href={a.href} className={desktop ? undefined : "flex-1 justify-center"}>
                            {a.label}
                        </Tab>
                    ))}
                </TabList>
            </Tabs>
        </div>
    );
}
