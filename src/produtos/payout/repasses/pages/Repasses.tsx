import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { SearchLg } from "@untitledui/icons";
import { BadgeWithDot } from "@/components/base/badges/badges";
import { Input } from "@/components/base/input/input";
import { cx } from "@/utils/cx";
import { PayOutLayout } from "../../components/PayOutLayout";
import {
    REPASSES,
    STATUS_META,
    formatarData,
    formatarValor,
    liquido,
    type StatusRepasse,
} from "../data/repasses";

const TABS: { id: StatusRepasse | "todos"; label: string }[] = [
    { id: "todos", label: "Tudo" },
    { id: "bloqueado", label: "Bloqueados" },
    { id: "processando", label: "Em processamento" },
    { id: "agendado", label: "Agendados" },
    { id: "pago", label: "Pagos" },
];

/**
 * PayOut → Repasses: fila de repasses aos organizadores, com filtro por status,
 * busca por evento/organizador e totais do período no topo.
 */
export function Repasses() {
    const navigate = useNavigate();
    const [tab, setTab] = useState<StatusRepasse | "todos">("todos");
    const [busca, setBusca] = useState("");

    const query = busca.trim().toLowerCase();

    const lista = useMemo(
        () =>
            REPASSES.filter((r) => {
                const matchTab = tab === "todos" || r.status === tab;
                const matchTexto =
                    !query || r.evento.toLowerCase().includes(query) || r.organizador.toLowerCase().includes(query);
                return matchTab && matchTexto;
            }),
        [tab, query],
    );

    const totalAPagar = useMemo(
        () => REPASSES.filter((r) => r.status !== "pago").reduce((soma, r) => soma + liquido(r), 0),
        [],
    );
    const bloqueados = useMemo(() => REPASSES.filter((r) => r.status === "bloqueado").length, []);

    return (
        <PayOutLayout titulo="Repasses">
            <div className="mx-auto flex w-full max-w-container flex-col gap-8 px-4 py-8 md:px-8">
                {/* Cabeçalho */}
                <div className="flex flex-col gap-1">
                    <h1 className="text-display-xs font-semibold text-primary">Repasses</h1>
                    <p className="text-sm text-tertiary">
                        Acompanhe e libere os valores devidos aos organizadores após a venda de ingressos.
                    </p>
                </div>

                {/* Totais */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <Metrica titulo="A repassar" valor={formatarValor(totalAPagar)} apoio="Líquido, não pago" />
                    <Metrica titulo="Bloqueados" valor={String(bloqueados)} apoio="Precisam de revisão" />
                    <Metrica titulo="Na fila" valor={String(REPASSES.length)} apoio="Últimos 30 dias" />
                </div>

                {/* Filtros */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-wrap gap-1">
                        {TABS.map((t) => (
                            <button
                                key={t.id}
                                type="button"
                                onClick={() => setTab(t.id)}
                                className={cx(
                                    "rounded-md px-3 py-1.5 text-sm font-semibold transition duration-100 ease-linear",
                                    tab === t.id ? "bg-active text-secondary_hover" : "text-quaternary hover:text-secondary",
                                )}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    <div className="w-full md:max-w-xs">
                        <Input
                            aria-label="Buscar por evento ou organizador"
                            icon={SearchLg}
                            placeholder="Buscar evento ou organizador"
                            value={busca}
                            onChange={setBusca}
                        />
                    </div>
                </div>

                {/* Lista */}
                <div className="overflow-hidden rounded-xl ring-1 ring-secondary">
                    <table className="w-full">
                        <thead className="bg-secondary">
                            <tr>
                                <Th>Evento</Th>
                                <Th>Organizador</Th>
                                <Th>Data</Th>
                                <Th align="right">Líquido</Th>
                                <Th>Status</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {lista.map((r) => (
                                <tr
                                    key={r.id}
                                    onClick={() => navigate(`/payout/repasses/${r.id}`)}
                                    className="cursor-pointer border-t border-secondary bg-primary transition duration-100 ease-linear hover:bg-secondary"
                                >
                                    <Td>
                                        <span className="font-medium text-primary">{r.evento}</span>
                                    </Td>
                                    <Td>{r.organizador}</Td>
                                    <Td>{formatarData(r.data)}</Td>
                                    <Td align="right">
                                        <span className="font-medium text-primary">{formatarValor(liquido(r))}</span>
                                    </Td>
                                    <Td>
                                        <BadgeWithDot size="sm" color={STATUS_META[r.status].cor}>
                                            {STATUS_META[r.status].label}
                                        </BadgeWithDot>
                                    </Td>
                                </tr>
                            ))}
                            {lista.length === 0 && (
                                <tr className="border-t border-secondary bg-primary">
                                    <td colSpan={5} className="px-6 py-10 text-center text-sm text-tertiary">
                                        Nenhum repasse encontrado para este filtro.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </PayOutLayout>
    );
}

const Metrica = ({ titulo, valor, apoio }: { titulo: string; valor: string; apoio: string }) => (
    <div className="flex flex-col gap-1 rounded-xl bg-primary px-5 py-4 ring-1 ring-secondary">
        <span className="text-sm font-medium text-tertiary">{titulo}</span>
        <span className="text-display-xs font-semibold text-primary">{valor}</span>
        <span className="text-xs text-quaternary">{apoio}</span>
    </div>
);

const Th = ({ children, align = "left" }: { children: React.ReactNode; align?: "left" | "right" }) => (
    <th
        scope="col"
        className={cx("px-6 py-3 text-xs font-semibold text-tertiary", align === "right" ? "text-right" : "text-left")}
    >
        {children}
    </th>
);

const Td = ({ children, align = "left" }: { children: React.ReactNode; align?: "left" | "right" }) => (
    <td className={cx("px-6 py-4 text-sm text-tertiary", align === "right" ? "text-right" : "text-left")}>{children}</td>
);
