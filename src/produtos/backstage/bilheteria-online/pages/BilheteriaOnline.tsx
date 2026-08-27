import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import type { Key } from "react-aria-components";
import { Eye, Plus, SearchLg, ShoppingCart01, SlashCircle01, Tag01, XClose } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Input } from "@/components/base/input/input";
import { Select } from "@/components/base/select/select";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { BadgeWithDot } from "@/components/base/badges/badges";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { PaginationCardAdvanced } from "@/components/application/pagination/pagination";
import { cx } from "@/utils/cx";
import { BackstageLayout } from "../../components/Backstage";
import { PedidoDetailsSlideOut } from "../components/PedidoDetailsSlideOut";
import { currency } from "../data/bilheteria-data";
import { STATUS_META, TIPO_LABEL, useBilheteria, type Pedido } from "../data/bilheteria-store";

export function BilheteriaOnline() {
    const navigate = useNavigate();
    const { pedidos, temItens } = useBilheteria();

    return (
        <BackstageLayout activeSection="cortesias" activeItem="bilheteria-online">
            <div className="flex min-w-0 flex-1 flex-col">
                <header className="flex items-center gap-3 px-0 py-6 md:px-6">
                    <h1 className="text-display-xs font-bold text-primary">Bilheteria online</h1>
                    {temItens && pedidos.length > 0 && (
                        <Button size="md" color="primary" iconLeading={Plus} className="ml-auto" onClick={() => navigate("/backstage/bilheteria-online/nova")}>
                            Nova venda
                        </Button>
                    )}
                </header>

                <main className="flex flex-1 flex-col gap-5 px-0 pb-10 md:px-6">
                    {!temItens ? (
                        <EstadoSemItens onConfigurar={() => navigate("/backstage/catalogo/ingressos")} />
                    ) : pedidos.length === 0 ? (
                        <EstadoInicial onComecar={() => navigate("/backstage/bilheteria-online/nova")} />
                    ) : (
                        <Listagem pedidos={pedidos} />
                    )}
                </main>
            </div>
        </BackstageLayout>
    );
}

/* --------------------------- Estados vazios ---------------------- */

const EstadoInicial = ({ onComecar }: { onComecar: () => void }) => (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-16 text-center">
        <FeaturedIcon icon={Tag01} color="gray" theme="modern" size="lg" />
        <div className="flex max-w-md flex-col gap-1">
            <h2 className="text-lg font-semibold text-primary">Venda ingressos online para seu evento</h2>
            <p className="text-sm text-tertiary">Crie convites exclusivos, compartilhe o link com seus convidados e acompanhe as vendas em tempo real.</p>
        </div>
        <Button size="md" color="primary" onClick={onComecar}>Comece a vender</Button>
    </div>
);

const EstadoSemItens = ({ onConfigurar }: { onConfigurar: () => void }) => (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-16 text-center">
        <FeaturedIcon icon={SlashCircle01} color="gray" theme="modern" size="lg" />
        <div className="flex max-w-md flex-col gap-1">
            <h2 className="text-lg font-semibold text-primary">Configure algum item antes de vender</h2>
            <p className="text-sm text-tertiary">É necessário ter itens cadastrados no evento para vender online.</p>
        </div>
        <Button size="md" color="primary" iconLeading={ShoppingCart01} onClick={onConfigurar}>Configurar itens</Button>
    </div>
);

/* ----------------------------- Listagem -------------------------- */

const STATUS_OPTS = [
    { id: "todos", label: "Todos" },
    { id: "pendente", label: "Pendente" },
    { id: "aprovado", label: "Aprovado" },
    { id: "cancelado", label: "Cancelado" },
];

function Listagem({ pedidos }: { pedidos: Pedido[] }) {
    const { cancelarPedido } = useBilheteria();
    const [busca, setBusca] = useState("");
    const [status, setStatus] = useState<Key>("todos");
    const [sel, setSel] = useState<Set<string>>(new Set());
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [detalheId, setDetalheId] = useState<string | null>(null);

    const filtrados = useMemo(() => {
        const t = busca.trim().toLowerCase();
        return pedidos.filter((p) => (status === "todos" || p.status === status) && (!t || p.id.toLowerCase().includes(t) || (p.comprador?.nome.toLowerCase().includes(t) ?? false) || p.emissor.toLowerCase().includes(t)));
    }, [pedidos, busca, status]);

    const totalPages = Math.max(1, Math.ceil(filtrados.length / pageSize));
    const safePage = Math.min(page, totalPages - 1);
    const visiveis = filtrados.slice(safePage * pageSize, (safePage + 1) * pageSize);
    const canceláveis = [...sel].filter((id) => pedidos.find((p) => p.id === id)?.status !== "cancelado");
    const detalhe = detalheId ? pedidos.find((p) => p.id === detalheId) ?? null : null;

    const toggle = (id: string) => setSel((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
    const selecionaveisVisiveis = visiveis.filter((p) => p.status !== "cancelado");
    const todosSelecionados = selecionaveisVisiveis.length > 0 && selecionaveisVisiveis.every((p) => sel.has(p.id));
    const algunsSelecionados = selecionaveisVisiveis.some((p) => sel.has(p.id)) && !todosSelecionados;
    const toggleTodos = (on: boolean) => setSel((prev) => { const n = new Set(prev); selecionaveisVisiveis.forEach((p) => (on ? n.add(p.id) : n.delete(p.id))); return n; });
    const cancelarSelecionados = () => { canceláveis.forEach(cancelarPedido); setSel(new Set()); };

    return (
        <>
            <div className="flex flex-col overflow-hidden rounded-xl bg-primary_alt ring-1 ring-border-secondary">
                {/* Filtros */}
                <div className="grid grid-cols-1 gap-3 border-b border-secondary px-4 py-4 md:grid-cols-[minmax(0,350px)_220px] md:px-6">
                    <Input label="Busca" size="sm" icon={SearchLg} placeholder="Buscar por pedido" value={busca} onChange={(v) => { setBusca(v); setPage(0); }} />
                    <div className="flex flex-col gap-1.5">
                        <span className="text-sm font-medium text-secondary">Status</span>
                        <Select size="sm" selectedKey={status} onSelectionChange={(k) => { setStatus(k); setPage(0); }} items={STATUS_OPTS} aria-label="Status">
                            {(item: { id: string; label: string }) => <Select.Item id={item.id}>{item.label}</Select.Item>}
                        </Select>
                    </div>
                </div>

                {/* Barra de seleção */}
                <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-secondary bg-secondary px-4 py-3 md:px-6">
                    <p className="text-sm text-tertiary">{sel.size === 0 ? "Nenhum pedido selecionado" : `${sel.size} ${sel.size === 1 ? "pedido selecionado" : "pedidos selecionados"}`}</p>
                    <div className="flex items-center gap-2">
                        <Button size="sm" color="secondary" iconLeading={XClose} isDisabled={sel.size === 0} onClick={() => setSel(new Set())}>Limpar seleção</Button>
                        <Button size="sm" color="primary-destructive" iconLeading={SlashCircle01} isDisabled={canceláveis.length === 0} onClick={cancelarSelecionados}>Cancelar itens selecionados</Button>
                    </div>
                </div>

                {/* Tabela */}
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b border-secondary bg-secondary_subtle text-left">
                                <th className="w-10 px-4 py-3 md:px-6">
                                    <Checkbox aria-label="Selecionar todos da página" isSelected={todosSelecionados} isIndeterminate={algunsSelecionados} onChange={toggleTodos} />
                                </th>
                                <th className="px-4 py-3 text-xs font-semibold text-tertiary">Pagamento</th>
                                <th className="px-4 py-3 text-xs font-semibold text-tertiary">Tipo</th>
                                <th className="px-4 py-3 text-xs font-semibold text-tertiary">Pedido</th>
                                <th className="px-4 py-3 text-xs font-semibold text-tertiary">Emissor responsável</th>
                                <th className="px-4 py-3 text-xs font-semibold text-tertiary">Data de venda</th>
                                <th className="px-4 py-3 text-xs font-semibold text-tertiary">Valor</th>
                                <th className="w-24 px-4 py-3" aria-label="Ações" />
                            </tr>
                        </thead>
                        <tbody>
                            {visiveis.map((p, i) => {
                                const meta = STATUS_META[p.status];
                                return (
                                    <tr key={p.id} className={cx("transition duration-100 ease-linear hover:bg-primary_hover", i !== visiveis.length - 1 && "border-b border-secondary")}>
                                        <td className="px-4 py-3 md:px-6">
                                            <Checkbox aria-label={`Selecionar pedido ${p.id}`} isSelected={sel.has(p.id)} isDisabled={p.status === "cancelado"} onChange={() => toggle(p.id)} />
                                        </td>
                                        <td className="px-4 py-3"><BadgeWithDot size="sm" type="modern" color={meta.color}>{meta.label}</BadgeWithDot></td>
                                        <td className="px-4 py-3 text-sm text-secondary">{TIPO_LABEL[p.tipo]}</td>
                                        <td className="px-4 py-3 text-sm text-tertiary tabular-nums"><span className="block max-w-[180px] truncate" title={p.id}>{p.id}</span></td>
                                        <td className="px-4 py-3 text-sm text-secondary">{p.emissor}</td>
                                        <td className="px-4 py-3 text-sm whitespace-nowrap text-tertiary tabular-nums">{p.data}</td>
                                        <td className="px-4 py-3 text-sm font-medium whitespace-nowrap text-primary tabular-nums">{currency.format(p.valor)}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-end gap-1">
                                                <ButtonUtility size="xs" color="tertiary" icon={SlashCircle01} tooltip="Cancelar" isDisabled={p.status === "cancelado"} onClick={() => cancelarPedido(p.id)} />
                                                <ButtonUtility size="xs" color="tertiary" icon={Eye} tooltip="Detalhes" onClick={() => setDetalheId(p.id)} />
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {visiveis.length === 0 && (
                                <tr><td colSpan={8} className="px-4 py-16 text-center text-sm text-tertiary">Nenhum pedido encontrado.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <PaginationCardAdvanced page={safePage + 1} total={totalPages} pageSize={pageSize} onPageChange={(p) => setPage(p - 1)} onPageSizeChange={(s) => { setPageSize(s); setPage(0); }} />
            </div>

            <PedidoDetailsSlideOut pedido={detalhe} onClose={() => setDetalheId(null)} onCancelar={(id) => { cancelarPedido(id); }} />
        </>
    );
}
