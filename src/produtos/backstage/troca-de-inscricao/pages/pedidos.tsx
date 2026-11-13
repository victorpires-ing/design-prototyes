import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import type { DateValue } from "react-aria-components";
import { ArrowDown, ArrowUp, ChevronRight, FilterLines, SearchLg } from "@untitledui/icons";
import { toast } from "sonner";
import { DateRangePicker } from "@/components/application/date-picker/date-range-picker";
import { EmptyState } from "@/components/application/empty-state/empty-state";
import { PaginationCardAdvanced } from "@/components/application/pagination/pagination";
import { Badge, BadgeWithDot } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { InputBase } from "@/components/base/input/input";
import { Select } from "@/components/base/select/select";
import { cx } from "@/utils/cx";
import { BackstageLayout } from "../../components/Backstage";
import { ControlesPrototipo } from "../components/controles-prototipo";
import {
    EVENTO,
    PESSOAS_IDS,
    STATUS_PEDIDO,
    brl,
    evDoPed,
    norm,
    perfil,
    pessoa,
    taxaPed,
    tick,
    trocaDoPed,
    useTroca,
    uuid,
    valorPed,
    type Pedido,
    type PedidoStatus,
    type TrocaDoPedido,
} from "../data/troca-store";

const STATUS_OPCOES = [{ id: "todos", label: "Todos" }, ...(Object.keys(STATUS_PEDIDO) as PedidoStatus[]).map((id) => ({ id, label: STATUS_PEDIDO[id].label }))];
const TROCA_OPCOES = [
    { id: "todas", label: "Todas" },
    { id: "aguardando", label: "Aguardando pagamento" },
    { id: "concluida", label: "Com troca concluída" },
    { id: "nao", label: "Não realizada" },
    { id: "sem", label: "Sem troca" },
];
const TROCA_BADGE: Record<Exclude<TrocaDoPedido, "sem">, { label: string; color: "warning" | "gray" | "success" }> = {
    aguardando: { label: "Aguardando pagamento", color: "warning" },
    nao: { label: "Não realizada", color: "gray" },
    concluida: { label: "Concluída", color: "success" },
};

/** Pior caso para avaliar a lista: 2.400 pedidos de várias organizações. */
function volumePedidos(): Pedido[] {
    const sts: PedidoStatus[] = ["pago", "pago", "pago", "pago", "pendente", "cancelado", "reembolsado"];
    return Array.from({ length: 2400 }, (_, k) => ({
        id: String(60000 + k),
        status: sts[k % 7],
        comprador: PESSOAS_IDS[k % PESSOAS_IDS.length],
        data: `${String(1 + (k % 28)).padStart(2, "0")}/${String(1 + (k % 10)).padStart(2, "0")}/2026 ${String(8 + (k % 12)).padStart(2, "0")}:${String(k % 60).padStart(2, "0")}`,
        pagamento: k % 3 ? "Pix" : "Cartão de crédito",
        org: k % 4 ? "pedras" : "outra",
        origem: "site",
        canal: "Site",
        evento: "Pedal Serra Gaúcha 2027",
        eventoId: "5d2a7c41-0b8e-4f3a-9e61-2c7b1f0a9d33",
        itens: [{ id: "v" + k, mod: "m10", lote: "l1", pago: 140, taxa: 14, ps: [PESSOAS_IDS[(k + 3) % PESSOAS_IDS.length]], status: "ativo", resp: [{}] }],
    }));
}

const dnum = (d: string) => +(d.slice(6, 10) + d.slice(3, 5) + d.slice(0, 2) + d.slice(11, 13) + d.slice(14, 16));
const isoNum = (v: DateValue) => +v.toString().replace(/-/g, "");

export function Pedidos() {
    const S = useTroca();
    const navigate = useNavigate();
    const pf = perfil();

    const [q, setQ] = useState("");
    const [ev, setEv] = useState("");
    const [st, setSt] = useState("todos");
    const [tr, setTr] = useState("todas");
    const [periodo, setPeriodo] = useState<{ start: DateValue; end: DateValue } | null>(null);
    const [asc, setAsc] = useState(false);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);
    const [carregando, setCarregando] = useState(true);
    const [filtrosMobile, setFiltrosMobile] = useState(false);

    useEffect(() => {
        tick();
        const t = setTimeout(() => setCarregando(false), 450);
        return () => clearTimeout(t);
    }, []);

    const volume = useMemo(() => (S.volume ? volumePedidos() : []), [S.volume]);
    // O estado é mutável (store do protótipo): recalcula a cada render.
    const visiveis = [...S.pedidos, ...volume].filter((p) => pf.global || p.org === "pedras");

    const filtrados = (() => {
        const nq = norm(q);
        const ne = norm(ev);
        const de = periodo ? isoNum(periodo.start) * 1e4 : 0;
        const at = periodo ? isoNum(periodo.end) * 1e4 + 2359 : 0;
        return visiveis
            .filter((p) => {
                if (st !== "todos" && p.status !== st) return false;
                if (tr !== "todas" && trocaDoPed(p) !== tr) return false;
                const e = evDoPed(p);
                if (ne && !norm(e.nome).includes(ne) && !norm(e.id).includes(ne)) return false;
                if (de && dnum(p.data) < de) return false;
                if (at && dnum(p.data) > at) return false;
                if (!nq) return true;
                const gente = [p.comprador, ...p.itens.flatMap((i) => i.ps)].map(pessoa);
                return [p.id, uuid(p.id), p.cupom, ...gente.flatMap((g) => [g.nome, g.cpf, g.email, g.tel])].some((v) => norm(v).includes(nq));
            })
            .sort((a, b) => (dnum(a.data) - dnum(b.data)) * (asc ? 1 : -1));
    })();

    const totalPages = Math.max(1, Math.ceil(filtrados.length / pageSize));
    const safePage = Math.min(page, totalPages);
    const pagina = filtrados.slice((safePage - 1) * pageSize, safePage * pageSize);
    const temFiltro = q || ev || st !== "todos" || tr !== "todas" || periodo;

    const limpar = () => {
        setQ("");
        setEv("");
        setSt("todos");
        setTr("todas");
        setPeriodo(null);
        setPage(1);
    };
    const abrir = (p: Pedido) => navigate(`/backstage/troca-de-inscricao/${p.id}`);

    return (
        <BackstageLayout showEventContext={false} showLayoutSwitcher={false} activeProducer="pedidos">
            <div className="flex min-w-0 flex-1 flex-col gap-6 px-4 py-6 md:px-6">
                <header className="flex flex-col gap-1">
                    <h1 className="text-display-xs font-bold text-primary">Pedidos</h1>
                    <p className="text-md text-tertiary">{pf.global ? "Pedidos de todas as organizações" : `Pedidos da organização ${EVENTO.org}`}</p>
                </header>

                <section className="flex flex-col rounded-xl bg-primary ring-1 ring-border-secondary" aria-label="Lista de pedidos">
                    <div className="flex flex-col gap-3 p-4 lg:flex-row lg:flex-wrap lg:items-end lg:gap-4" role="search">
                        <div className="flex flex-col gap-1.5 lg:w-[320px]">
                            <label htmlFor="pedidos-busca" className="text-sm font-medium text-secondary">
                                Buscar
                            </label>
                            <InputBase
                                id="pedidos-busca"
                                size="sm"
                                icon={SearchLg}
                                value={q}
                                onChange={(e) => {
                                    setQ(e.target.value);
                                    setPage(1);
                                }}
                                placeholder="ID do pedido, nome, CPF, e-mail ou telefone"
                            />
                        </div>

                        <Button size="sm" color="secondary" iconLeading={FilterLines} onClick={() => setFiltrosMobile((o) => !o)} className="lg:hidden">
                            Filtros
                        </Button>

                        <div className={cx("flex flex-col gap-3 md:flex-row md:flex-wrap md:items-end md:gap-4", !filtrosMobile && "max-lg:hidden")}>
                            <div className="flex flex-col gap-1.5 md:w-[200px]">
                                <label htmlFor="pedidos-evento" className="text-sm font-medium text-secondary">
                                    Evento
                                </label>
                                <InputBase
                                    id="pedidos-evento"
                                    size="sm"
                                    value={ev}
                                    onChange={(e) => {
                                        setEv(e.target.value);
                                        setPage(1);
                                    }}
                                    placeholder="Nome ou ID do evento"
                                />
                            </div>
                            <div className="md:w-[190px]">
                                <Select
                                    label="Status"
                                    size="sm"
                                    selectedKey={st}
                                    onSelectionChange={(k) => {
                                        setSt(String(k));
                                        setPage(1);
                                    }}
                                    items={STATUS_OPCOES}
                                >
                                    {(item) => <Select.Item id={item.id}>{item.label}</Select.Item>}
                                </Select>
                            </div>
                            <div className="md:w-[210px]">
                                <Select
                                    label="Troca"
                                    size="sm"
                                    selectedKey={tr}
                                    onSelectionChange={(k) => {
                                        setTr(String(k));
                                        setPage(1);
                                    }}
                                    items={TROCA_OPCOES}
                                >
                                    {(item) => <Select.Item id={item.id}>{item.label}</Select.Item>}
                                </Select>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <span className="text-sm font-medium text-secondary">Data da compra</span>
                                <DateRangePicker
                                    aria-label="Data da compra"
                                    value={periodo}
                                    onChange={(v) => {
                                        setPeriodo(v);
                                        setPage(1);
                                    }}
                                />
                            </div>
                            {temFiltro && (
                                <Button size="sm" color="link-gray" onClick={limpar} className="md:mb-2">
                                    Limpar filtros
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 border-t border-secondary px-4 py-3">
                        <h2 className="text-md font-semibold text-primary">Lista de pedidos</h2>
                        <Badge size="sm" type="color" color="gray">
                            {filtrados.length.toLocaleString("pt-BR")}
                        </Badge>
                        <Button size="sm" color="secondary" className="ml-auto" onClick={() => toast.success("Exportação iniciada", { description: "Você recebe o arquivo por e-mail." })}>
                            Exportar
                        </Button>
                    </div>

                    {carregando ? (
                        <div className="flex flex-col" aria-busy="true" aria-label="Carregando pedidos">
                            {Array.from({ length: 6 }, (_, i) => (
                                <div key={i} className="flex gap-6 border-t border-secondary px-4 py-4">
                                    <div className="h-4 w-32 animate-pulse rounded bg-tertiary" />
                                    <div className="h-4 w-20 animate-pulse rounded bg-tertiary" />
                                    <div className="h-4 flex-1 animate-pulse rounded bg-tertiary" />
                                    <div className="h-4 w-24 animate-pulse rounded bg-tertiary" />
                                </div>
                            ))}
                        </div>
                    ) : pagina.length === 0 ? (
                        <div className="flex justify-center border-t border-secondary py-12">
                            <EmptyState size="sm">
                                <EmptyState.Header>
                                    <EmptyState.FeaturedIcon icon={SearchLg} color="gray" theme="modern" />
                                </EmptyState.Header>
                                <EmptyState.Content>
                                    <EmptyState.Title>Não encontrei nenhum pedido com essa busca</EmptyState.Title>
                                    <EmptyState.Description>Confira o que foi digitado ou limpe os filtros para ver todos os pedidos.</EmptyState.Description>
                                </EmptyState.Content>
                                <EmptyState.Footer>
                                    <Button size="md" color="secondary" onClick={limpar}>
                                        Limpar filtros
                                    </Button>
                                </EmptyState.Footer>
                            </EmptyState>
                        </div>
                    ) : (
                        <>
                            {/* Tabela — desktop */}
                            <div className="overflow-x-auto max-lg:hidden">
                                <table className="w-full border-collapse whitespace-nowrap">
                                    <thead>
                                        <tr className="border-y border-secondary bg-secondary_subtle text-left">
                                            <Th>ID do pedido</Th>
                                            <th className="px-4 py-3">
                                                <button
                                                    type="button"
                                                    onClick={() => setAsc((a) => !a)}
                                                    aria-label={asc ? "Data, mais antigos primeiro" : "Data, mais recentes primeiro"}
                                                    className="flex items-center gap-1 text-xs font-medium text-tertiary transition duration-100 ease-linear hover:text-secondary_hover"
                                                >
                                                    Data
                                                    {asc ? <ArrowUp className="size-3.5" aria-hidden="true" /> : <ArrowDown className="size-3.5" aria-hidden="true" />}
                                                </button>
                                            </th>
                                            <Th>Comprador</Th>
                                            <Th>Atleta inscrito</Th>
                                            <Th>Evento</Th>
                                            <Th>Taxa</Th>
                                            <Th>Valor</Th>
                                            <Th>Pagamento</Th>
                                            <Th>Status</Th>
                                            <Th>Troca</Th>
                                            <th className="w-12 px-4 py-3">
                                                <span className="sr-only">Abrir</span>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pagina.map((p) => {
                                            const c = pessoa(p.comprador);
                                            const e = evDoPed(p);
                                            const atletas = p.itens.filter((i) => i.status !== "trocado").flatMap((i) => i.ps.map((id) => pessoa(id).nome));
                                            return (
                                                <tr
                                                    key={p.id}
                                                    onClick={() => abrir(p)}
                                                    className="cursor-pointer border-b border-secondary transition duration-100 ease-linear hover:bg-primary_hover"
                                                >
                                                    <td className="max-w-[130px] truncate px-4 py-4 font-mono text-xs text-tertiary" title={uuid(p.id)}>
                                                        {uuid(p.id)}
                                                    </td>
                                                    <td className="px-4 py-4 text-sm whitespace-nowrap text-secondary">
                                                        {p.data.slice(0, 10)}
                                                        <span className="block text-tertiary">{p.data.slice(11)}</span>
                                                    </td>
                                                    <td className="px-4 py-4 text-sm">
                                                        <span className="block font-medium text-primary">{c.nome}</span>
                                                        <span className="text-tertiary">{c.cpf}</span>
                                                    </td>
                                                    <td className="px-4 py-4 text-sm text-secondary">
                                                        {atletas.slice(0, 2).map((n) => (
                                                            <span key={n} className="block">
                                                                {n}
                                                            </span>
                                                        ))}
                                                        {atletas.length > 2 && <span className="text-tertiary">e mais {atletas.length - 2}</span>}
                                                    </td>
                                                    <td className="max-w-[200px] px-4 py-4 text-sm">
                                                        <span className="block truncate text-secondary" title={e.nome}>{e.nome}</span>
                                                        <span className="text-tertiary">ID {e.id.slice(0, 8)}</span>
                                                    </td>
                                                    <td className="px-4 py-4 text-sm whitespace-nowrap text-tertiary">{brl(taxaPed(p))}</td>
                                                    <td className="px-4 py-4 text-sm font-medium whitespace-nowrap text-primary">{brl(valorPed(p))}</td>
                                                    <td className="px-4 py-4 text-sm text-tertiary">{p.pagamento}</td>
                                                    <td className="px-4 py-4">
                                                        <StatusBadge p={p} />
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <TrocaBadge p={p} />
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <ButtonUtility
                                                            size="xs"
                                                            color="tertiary"
                                                            icon={ChevronRight}
                                                            tooltip={p.status === "pago" ? "Ver e editar pedido" : "Ver pedido"}
                                                            onClick={() => abrir(p)}
                                                        />
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Tabela-lista — celular (UI-MOB-005) */}
                            <ul className="flex flex-col border-t border-secondary lg:hidden">
                                {pagina.map((p) => {
                                    const c = pessoa(p.comprador);
                                    return (
                                        <li key={p.id} className="border-b border-secondary">
                                            <button type="button" onClick={() => abrir(p)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-primary_hover">
                                                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                                                    <span className="truncate text-sm font-semibold text-primary">{c.nome}</span>
                                                    <span className="truncate text-sm text-tertiary">{evDoPed(p).nome}</span>
                                                    <span className="text-sm text-tertiary">{p.data}</span>
                                                    <span className="mt-1 flex flex-wrap gap-1.5">
                                                        <StatusBadge p={p} />
                                                        {trocaDoPed(p) !== "sem" && <TrocaBadge p={p} />}
                                                    </span>
                                                </span>
                                                <span className="text-sm font-semibold text-primary">{brl(valorPed(p))}</span>
                                                <ChevronRight className="size-5 shrink-0 text-fg-quaternary" aria-hidden="true" />
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>

                            <PaginationCardAdvanced
                                page={safePage}
                                total={totalPages}
                                pageSize={pageSize}
                                onPageChange={setPage}
                                onPageSizeChange={(size: number) => {
                                    setPageSize(size);
                                    setPage(1);
                                }}
                            />
                        </>
                    )}
                </section>
            </div>
            <ControlesPrototipo />
        </BackstageLayout>
    );
}

const Th = ({ children }: { children: React.ReactNode }) => <th className="px-4 py-3 text-xs font-medium whitespace-nowrap text-tertiary">{children}</th>;

export const StatusBadge = ({ p }: { p: Pedido }) => (
    <BadgeWithDot size="sm" type="pill-color" color={STATUS_PEDIDO[p.status].color}>
        {STATUS_PEDIDO[p.status].label}
    </BadgeWithDot>
);

const TrocaBadge = ({ p }: { p: Pedido }) => {
    const t = trocaDoPed(p);
    if (t === "sem") return <span className="text-sm text-quaternary" aria-label="Sem troca">–</span>;
    return (
        <BadgeWithDot size="sm" type="pill-color" color={TROCA_BADGE[t].color}>
            {TROCA_BADGE[t].label}
        </BadgeWithDot>
    );
};
