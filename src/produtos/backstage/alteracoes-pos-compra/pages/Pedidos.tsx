import { useMemo } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router";
import { motion } from "motion/react";
import { ArrowLeft, ArrowRight, Eye, SearchLg } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Input } from "@/components/base/input/input";
import { Select } from "@/components/base/select/select";
import { EmptyState } from "@/components/application/empty-state/empty-state";
import { cx } from "@/utils/cx";
import { BackstageLayout } from "../../components/Backstage";
import { FaixaAtencaoPedidos } from "../components/FaixaAtencaoPedidos";
import { FOCO, FOCO_ESCOPO } from "../components/pos-compra-ui";
import {
    EVENTOS,
    formatarMoeda,
    getConta,
    getEvento,
    usePedidos,
    uuidCurto,
    type Pedido,
} from "../data/pos-compra-store";

const totalPago = (pedido: Pedido) => pedido.itens.reduce((soma, linha) => soma + linha.valorPago, 0);

const TODOS = "todos";

export function Pedidos() {
    const navigate = useNavigate();
    const pedidos = usePedidos();
    const location = useLocation();
    /* Busca, filtros e página moram na URL: abrir um pedido e voltar devolve a lista como estava,
       e o endereço pode ser colado para um colega ver o mesmo recorte. */
    const [parametros, setParametros] = useSearchParams();
    const busca = parametros.get("busca") ?? "";
    const eventoId = parametros.get("evento") ?? TODOS;
    const porPagina = Number(parametros.get("porPagina") ?? 25) || 25;
    const pagina = Number(parametros.get("pagina") ?? 1) || 1;
    const definir = (mudancas: Record<string, string | number>) =>
        setParametros(
            (atual) => {
                const proximo = new URLSearchParams(atual);
                Object.entries(mudancas).forEach(([chave, valor]) => {
                    const padrao = chave === "pagina" ? "1" : chave === "porPagina" ? "25" : chave === "busca" ? "" : TODOS;
                    if (String(valor) === padrao) proximo.delete(chave);
                    else proximo.set(chave, String(valor));
                });
                return proximo;
            },
            { replace: true },
        );
    const setPagina = (valor: number) => definir({ pagina: valor });
    const abrirPedido = (pedidoId: string) => navigate(`/backstage/pedidos/${pedidoId}`, { state: { de: location.search } });

    const termo = busca.trim().toLowerCase();
    const filtrados = useMemo(
        () =>
            pedidos.filter((pedido) => {
                if (eventoId !== TODOS && pedido.eventoId !== eventoId) return false;
                if (!termo) return true;
                const comprador = getConta(pedido.compradorId)?.nome.toLowerCase() ?? "";
                const evento = getEvento(pedido.eventoId)?.nome.toLowerCase() ?? "";
                return (
                    pedido.id.toLowerCase().includes(termo) || comprador.includes(termo) || evento.includes(termo)
                );
            }),
        [pedidos, termo, eventoId],
    );

    const eventosFiltro = [{ id: TODOS, label: "Todos os eventos" }, ...EVENTOS.map((e) => ({ id: e.id, label: e.nome }))];

    /* Qualquer mudança de filtro recomeça a leitura: manter a página 7 depois de filtrar confunde. */
    const totalPaginas = Math.max(1, Math.ceil(filtrados.length / porPagina));
    const paginaAtual = Math.min(pagina, totalPaginas);
    const inicio = (paginaAtual - 1) * porPagina;
    const visiveis = filtrados.slice(inicio, inicio + porPagina);
    /* Uma escrita só na URL: duas seguidas (filtro e página) fariam a segunda apagar a primeira. */
    const aoFiltrar = (chave: "busca" | "evento") => (valor: string) => definir({ [chave]: valor, pagina: 1 });

    return (
        <BackstageLayout showEventContext={false} activeProducer="pedidos">
            <motion.div
                className={cx("flex min-w-0 flex-1 flex-col gap-5 p-4 md:p-6", FOCO_ESCOPO)}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, ease: "easeOut" }}
            >
                <header className="flex flex-col gap-1">
                    <h1 className="text-xl font-semibold text-primary md:text-2xl">Pedidos</h1>
                    <p className="text-sm text-tertiary">
Troca de item, troca de titularidade e edição de respostas do formulário.
                    </p>
                </header>

                <FaixaAtencaoPedidos pedidos={pedidos} onAbrir={abrirPedido} />

                <section className="rounded-2xl bg-primary ring-1 ring-border-secondary">
                    <div className="flex flex-col gap-3 border-b border-secondary p-4 md:flex-row md:items-end">
                        <div className="md:max-w-sm md:flex-1">
                            <Input
                                icon={SearchLg}
                                label="Buscar"
                                placeholder="ID do pedido, participante ou evento"
                                value={busca}
                                onChange={aoFiltrar("busca")}
                            />
                        </div>
                        <div className="md:w-64">
                            <Select
                                label="Evento"
                                selectedKey={eventoId}
                                onSelectionChange={(key) => aoFiltrar("evento")(String(key))}
                                items={eventosFiltro}
                            >
                                {(evento) => <Select.Item id={evento.id}>{evento.label}</Select.Item>}
                            </Select>
                        </div>
                    </div>

                    {filtrados.length === 0 ? (
                        <div className="p-8">
                            <EmptyState size="sm">
                                <EmptyState.Header>
                                    <EmptyState.FeaturedIcon icon={SearchLg} color="gray" theme="modern" />
                                </EmptyState.Header>
                                <EmptyState.Content>
                                    <EmptyState.Title>Nenhum pedido encontrado</EmptyState.Title>
                                    <EmptyState.Description>Revise a busca ou volte o filtro para todos os eventos.</EmptyState.Description>
                                </EmptyState.Content>
                            </EmptyState>
                        </div>
                    ) : (
                        <>
                        {/* No celular, tabela vira lista: sem rolagem lateral para ler valor e situação.
                            Duas linhas no lugar de cinco: o cartão de 164px fazia 25 pedidos virarem
                            5,5 telas de rolagem, com dois cabendo na primeira. Agora cabem seis. */}
                        <ul className="flex flex-col divide-y divide-border-secondary md:hidden">
                            {visiveis.map((pedido) => {
                                const comprador = getConta(pedido.compradorId);
                                return (
                                    <li key={pedido.id}>
                                        <button
                                            type="button"
                                            onClick={() => abrirPedido(pedido.id)}
                                            className={cx(
                                                "flex w-full flex-col gap-1 px-4 py-4 text-left transition duration-100 ease-linear hover:bg-secondary",
                                                FOCO,
                                            )}
                                        >
                                            {/* O UUID inteiro liderava o cartão, em mono e semibold: 36
                                                caracteres tomavam a largura útil e o leitor de tela soletrava
                                                o hash antes de dizer de quem era o pedido. O atendente tem o
                                                nome na mão, e é por ele que a busca casa. */}
                                            <span className="flex w-full items-baseline justify-between gap-3">
                                                <span className="truncate text-sm font-medium text-primary">{comprador?.nome}</span>
                                                <span className="shrink-0 text-sm font-medium text-primary tabular-nums">
                                                    {formatarMoeda(totalPago(pedido))}
                                                </span>
                                            </span>
                                            <span className="flex w-full items-baseline gap-1 text-sm text-tertiary">
                                                <span className="truncate">{getEvento(pedido.eventoId)?.nome}</span>
                                                <span className="shrink-0 whitespace-nowrap text-quaternary tabular-nums">
                                                    · {pedido.itens.length} {pedido.itens.length === 1 ? "item" : "itens"}
                                                </span>
                                                {/* A forma curta que o resto do produto já usa nos títulos. O ID
                                                    inteiro continua no detalhe, com o botão de copiar. */}
                                                <span className="shrink-0 font-mono text-quaternary">· {uuidCurto(pedido.id)}</span>
                                            </span>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>

                        <div className="hidden overflow-x-auto md:block">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="border-b border-secondary text-left">
                                        <Th>Pedido</Th>
                                        <Th>Comprador</Th>
                                        <Th>Evento</Th>
                                        {/* A contagem de itens saiu: era um número solto que não
                                            respondia nada sozinho — dois itens podem ser dois
                                            ingressos ou um ingresso e uma camiseta. Quem precisa
                                            saber o quê abre o pedido, onde a lista diz. O que
                                            decide a triagem na lista é quanto saiu do bolso. */}
                                        <Th>Total pago</Th>
                                        <th className="w-16 px-4 py-3" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-secondary">
                                    {visiveis.map((pedido) => {
                                        const comprador = getConta(pedido.compradorId);
                                        return (
                                            <tr
                                                key={pedido.id}
                                                onClick={() => abrirPedido(pedido.id)}
                                                className="cursor-pointer transition duration-100 ease-linear hover:bg-secondary"
                                            >
                                                <td className="px-4 py-4">
                                                    <span className="font-mono text-sm font-semibold whitespace-nowrap text-primary">{pedido.id}</span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <p className="text-sm font-medium text-primary">{comprador?.nome}</p>
                                                    <p className="text-sm text-tertiary">{comprador?.email}</p>
                                                </td>
                                                <td className="px-4 py-4 text-sm text-tertiary">{getEvento(pedido.eventoId)?.nome}</td>
                                                <td className="px-4 py-4 text-sm whitespace-nowrap text-primary tabular-nums">
                                                    {formatarMoeda(totalPago(pedido))}
                                                </td>
                                                <td className="px-4 py-4 text-right">
                                                    {/*
                                                      Olho, como nas outras listagens de pedido do Backstage
                                                      (bilheteria e cortesias). `stopPropagation` porque a linha
                                                      inteira também abre o pedido: sem ele o clique no botão
                                                      dispara navegação duas vezes.
                                                    */}
                                                    <ButtonUtility
                                                        size="xs"
                                                        color="tertiary"
                                                        icon={Eye}
                                                        tooltip="Detalhes"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            abrirPedido(pedido.id);
                                                        }}
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <RodapeTabela
                            inicio={inicio + 1}
                            fim={Math.min(inicio + porPagina, filtrados.length)}
                            total={filtrados.length}
                            pagina={paginaAtual}
                            totalPaginas={totalPaginas}
                            porPagina={porPagina}
                            onPorPagina={(valor) => {
                                definir({ porPagina: valor, pagina: 1 });
                            }}
                            onPagina={setPagina}
                        />
                        </>
                    )}
                </section>

            </motion.div>
        </BackstageLayout>
    );
}

/* ------------------------------------------------------------------ */
/*  Rodapé da tabela                                                   */
/* ------------------------------------------------------------------ */

const POR_PAGINA = [10, 25, 50, 100].map((n) => ({ id: String(n), label: String(n) }));

/** Sequência de páginas com elipse, para 110 pedidos não virarem 5 páginas de botões. */
const paginasVisiveis = (atual: number, total: number): Array<number | "..."> => {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const paginas: Array<number | "..."> = [1];
    const de = Math.max(2, atual - 1);
    const ate = Math.min(total - 1, atual + 1);
    if (de > 2) paginas.push("...");
    for (let p = de; p <= ate; p++) paginas.push(p);
    if (ate < total - 1) paginas.push("...");
    paginas.push(total);
    return paginas;
};

interface RodapeTabelaProps {
    inicio: number;
    fim: number;
    total: number;
    pagina: number;
    totalPaginas: number;
    porPagina: number;
    onPorPagina: (valor: number) => void;
    onPagina: (valor: number) => void;
}

const RodapeTabela = ({ inicio, fim, total, pagina, totalPaginas, porPagina, onPorPagina, onPagina }: RodapeTabelaProps) => (
    <div className="flex flex-col gap-3 border-t border-secondary px-4 py-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
            {/* Trocar o tamanho da página não é a tarefa de quem procura um pedido no telefone, e
                o seletor era mais um alvo de 36px numa fileira que já não cabia. A contagem fica. */}
            <span className="hidden text-sm whitespace-nowrap text-tertiary md:inline">Itens por página</span>
            <div className="hidden w-20 md:block">
                <Select
                    aria-label="Itens por página"
                    size="sm"
                    selectedKey={String(porPagina)}
                    onSelectionChange={(key) => onPorPagina(Number(key))}
                    items={POR_PAGINA}
                >
                    {(opcao) => <Select.Item id={opcao.id}>{opcao.label}</Select.Item>}
                </Select>
            </div>
            <span className="text-sm whitespace-nowrap text-tertiary tabular-nums">
                {inicio}–{fim} de {total}
            </span>
        </div>

        <nav className="flex items-center justify-between gap-1 md:justify-end" aria-label="Paginação">
            <Button
                size="sm"
                color="secondary"
                iconLeading={ArrowLeft}
                isDisabled={pagina <= 1}
                onClick={() => onPagina(pagina - 1)}
                className="max-md:py-3"
            >
                Anterior
            </Button>

            {/* Os cinco números somavam 188px e empurravam Próxima 59px para fora da tela: para
                alcançar a página seguinte o atendente arrastava a lista inteira de lado. No
                telefone eles viram a posição atual e a navegação fica nos dois botões. */}
            <span className="text-sm whitespace-nowrap text-tertiary tabular-nums md:hidden">
                Página {pagina} de {totalPaginas}
            </span>

            <div className="hidden items-center gap-0.5 md:flex">
                {paginasVisiveis(pagina, totalPaginas).map((p, indice) =>
                    p === "..." ? (
                        <span key={`elipse-${indice}`} className="px-1 text-sm text-quaternary" aria-hidden="true">
                            …
                        </span>
                    ) : (
                        <button
                            key={p}
                            type="button"
                            aria-current={p === pagina ? "page" : undefined}
                            onClick={() => onPagina(p)}
                            className={cx(
                                "flex size-9 items-center justify-center rounded-lg text-sm font-medium tabular-nums transition duration-100 ease-linear",
                                p === pagina ? "bg-secondary text-primary" : "text-tertiary hover:bg-secondary",
                                FOCO,
                            )}
                        >
                            {p}
                        </button>
                    ),
                )}
            </div>

            <Button
                size="sm"
                color="secondary"
                iconTrailing={ArrowRight}
                isDisabled={pagina >= totalPaginas}
                onClick={() => onPagina(pagina + 1)}
                className="max-md:py-3"
            >
                Próxima
            </Button>
        </nav>
    </div>
);

const Th = ({ children }: { children: React.ReactNode }) => (
    <th className="px-4 py-3 text-sm font-medium whitespace-nowrap text-tertiary">{children}</th>
);
