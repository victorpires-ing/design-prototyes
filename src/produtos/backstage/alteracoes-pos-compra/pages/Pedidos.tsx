import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { ArrowLeft, ArrowRight, SearchLg } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Select } from "@/components/base/select/select";
import { EmptyState } from "@/components/application/empty-state/empty-state";
import { cx } from "@/utils/cx";
import { BackstageLayout } from "../../components/Backstage";
import { FOCO, FOCO_ESCOPO, StatusBadge } from "../components/pos-compra-ui";
import {
    EVENTOS,
    formatarMoeda,
    getConta,
    getEvento,
    usePedidos,
    type Pedido,
} from "../data/pos-compra-store";

const totalPago = (pedido: Pedido) => pedido.itens.reduce((soma, linha) => soma + linha.valorPago, 0);

const TODOS = "todos";

/* A lista traz todo mundo, inclusive quem nunca pediu alteração: o filtro separa quem precisa de atenção. */
const SITUACOES = [
    { id: TODOS, label: "Todas as situações" },
    { id: "ativo", label: "Sem alterações" },
    { id: "em-andamento", label: "Alteração em andamento" },
    { id: "alteracao-concluida", label: "Já alterados" },
    { id: "problema", label: "Expirados e falhas" },
];

const combinaSituacao = (status: string, situacao: string) => {
    if (situacao === TODOS) return true;
    if (situacao === "em-andamento") return status === "aguardando-pagamento" || status === "pago-processando";
    if (situacao === "problema") return status === "expirado" || status === "falha";
    return status === situacao;
};

export function Pedidos() {
    const navigate = useNavigate();
    const pedidos = usePedidos();
    const [busca, setBusca] = useState("");
    const [eventoId, setEventoId] = useState<string>(TODOS);
    const [situacao, setSituacao] = useState<string>(TODOS);
    const [porPagina, setPorPagina] = useState(25);
    const [pagina, setPagina] = useState(1);

    const termo = busca.trim().toLowerCase();
    const filtrados = useMemo(
        () =>
            pedidos.filter((pedido) => {
                if (eventoId !== TODOS && pedido.eventoId !== eventoId) return false;
                if (!combinaSituacao(pedido.status, situacao)) return false;
                if (!termo) return true;
                const comprador = getConta(pedido.compradorId)?.nome.toLowerCase() ?? "";
                const evento = getEvento(pedido.eventoId)?.nome.toLowerCase() ?? "";
                return (
                    pedido.id.toLowerCase().includes(termo) || comprador.includes(termo) || evento.includes(termo)
                );
            }),
        [pedidos, termo, eventoId, situacao],
    );

    const eventosFiltro = [{ id: TODOS, label: "Todos os eventos" }, ...EVENTOS.map((e) => ({ id: e.id, label: e.nome }))];

    /* Qualquer mudança de filtro recomeça a leitura: manter a página 7 depois de filtrar confunde. */
    const totalPaginas = Math.max(1, Math.ceil(filtrados.length / porPagina));
    const paginaAtual = Math.min(pagina, totalPaginas);
    const inicio = (paginaAtual - 1) * porPagina;
    const visiveis = filtrados.slice(inicio, inicio + porPagina);
    const aoFiltrar = <T,>(setter: (valor: T) => void) => (valor: T) => {
        setter(valor);
        setPagina(1);
    };

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

                <section className="rounded-2xl bg-primary ring-1 ring-border-secondary">
                    <div className="flex flex-col gap-3 border-b border-secondary p-4 md:flex-row md:items-end">
                        <div className="md:max-w-sm md:flex-1">
                            <Input
                                icon={SearchLg}
                                label="Buscar"
                                placeholder="ID do pedido, participante ou evento"
                                value={busca}
                                onChange={aoFiltrar(setBusca)}
                            />
                        </div>
                        <div className="md:w-64">
                            <Select
                                label="Evento"
                                selectedKey={eventoId}
                                onSelectionChange={(key) => aoFiltrar(setEventoId)(String(key))}
                                items={eventosFiltro}
                            >
                                {(evento) => <Select.Item id={evento.id}>{evento.label}</Select.Item>}
                            </Select>
                        </div>
                        <div className="md:w-56">
                            <Select
                                label="Situação"
                                selectedKey={situacao}
                                onSelectionChange={(key) => aoFiltrar(setSituacao)(String(key))}
                                items={SITUACOES}
                            >
                                {(opcao) => <Select.Item id={opcao.id}>{opcao.label}</Select.Item>}
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
                                    <EmptyState.Description>Revise a busca ou volte os filtros para todas as situações.</EmptyState.Description>
                                </EmptyState.Content>
                            </EmptyState>
                        </div>
                    ) : (
                        <>
                        {/* No celular, tabela vira lista: sem rolagem lateral para ler valor e situação. */}
                        <ul className="flex flex-col divide-y divide-border-secondary md:hidden">
                            {visiveis.map((pedido) => {
                                const comprador = getConta(pedido.compradorId);
                                return (
                                    <li key={pedido.id}>
                                        <button
                                            type="button"
                                            onClick={() => navigate(`/backstage/pedidos/${pedido.id}`)}
                                            className={cx(
                                                "flex w-full flex-col gap-2 p-4 text-left transition duration-100 ease-linear hover:bg-secondary",
                                                FOCO,
                                            )}
                                        >
                                            <span className="flex flex-wrap items-center justify-between gap-2">
                                                <span className="font-mono text-sm font-semibold break-all text-primary">{pedido.id}</span>
                                                <StatusBadge status={pedido.status} />
                                            </span>
                                            <span className="block text-sm font-medium text-primary">{comprador?.nome}</span>
                                            <span className="block text-sm text-tertiary">{comprador?.email}</span>
                                            <span className="block text-sm text-tertiary">{getEvento(pedido.eventoId)?.nome}</span>
                                            <span className="flex flex-wrap items-center justify-between gap-2">
                                                <span className="text-sm text-quaternary">
                                                    {pedido.itens.length} {pedido.itens.length === 1 ? "item" : "itens"}
                                                </span>
                                                <span className="text-sm font-medium text-primary tabular-nums">
                                                    {formatarMoeda(totalPago(pedido))}
                                                </span>
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
                                        <Th>Itens</Th>
                                        <Th>Total pago</Th>
                                        <Th>Situação</Th>
                                        <th className="w-24 px-4 py-3" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-secondary">
                                    {visiveis.map((pedido) => {
                                        const comprador = getConta(pedido.compradorId);
                                        return (
                                            <tr
                                                key={pedido.id}
                                                onClick={() => navigate(`/backstage/pedidos/${pedido.id}`)}
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
                                                <td className="px-4 py-4 text-sm text-tertiary tabular-nums">{pedido.itens.length}</td>
                                                <td className="px-4 py-4 text-sm whitespace-nowrap text-primary tabular-nums">
                                                    {formatarMoeda(totalPago(pedido))}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <StatusBadge status={pedido.status} />
                                                </td>
                                                <td className="px-4 py-4 text-right">
                                                    <Button
                                                        size="sm"
                                                        color="link-color"
                                                        iconTrailing={ArrowRight}
                                                        onClick={() => navigate(`/backstage/pedidos/${pedido.id}`)}
                                                    >
                                                        Abrir
                                                    </Button>
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
                                setPorPagina(valor);
                                setPagina(1);
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
            <span className="text-sm whitespace-nowrap text-tertiary">Itens por página</span>
            <div className="w-20">
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
            <Button size="sm" color="secondary" iconLeading={ArrowLeft} isDisabled={pagina <= 1} onClick={() => onPagina(pagina - 1)}>
                Anterior
            </Button>

            <div className="flex items-center gap-0.5">
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
            >
                Próxima
            </Button>
        </nav>
    </div>
);

const Th = ({ children }: { children: React.ReactNode }) => (
    <th className="px-4 py-3 text-sm font-medium whitespace-nowrap text-tertiary">{children}</th>
);
