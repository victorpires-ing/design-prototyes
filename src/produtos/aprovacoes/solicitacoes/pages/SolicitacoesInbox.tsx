import { useMemo, useState } from "react";
import { CheckCircle, ChevronLeft, ChevronRight, SearchLg, XCircle } from "@untitledui/icons";
import { BadgeWithDot } from "@/components/base/badges/badges";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Input } from "@/components/base/input/input";
import { cx } from "@/utils/cx";
import { AprovacoesLayout } from "../../components/AprovacoesLayout";
import { AnexoPreview } from "../components/AnexoPreview";
import {
    SOLICITACOES,
    STATUS_META,
    formatarData,
    type Solicitacao,
    type StatusSolicitacao,
} from "../data/solicitacoes";

const USUARIO_ATUAL = "Ana Soares";

const TABS: { id: StatusSolicitacao | "todos"; label: string }[] = [
    { id: "todos", label: "Tudo" },
    { id: "pendente", label: "Pendentes" },
    { id: "aprovada", label: "Aprovadas" },
    { id: "rejeitada", label: "Rejeitadas" },
];

/** Cor do dot de status na lista. */
const DOT: Record<StatusSolicitacao, string> = {
    pendente: "bg-fg-warning-secondary",
    aprovada: "bg-fg-success-secondary",
    rejeitada: "bg-fg-error-secondary",
};

/**
 * Sistema de aprovações → Solicitações (caixa de entrada / master-detail).
 * Esquerda: lista com tabs por status. Direita: visualização dos anexos + aprovar/rejeitar.
 */
export function SolicitacoesInbox() {
    const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>(SOLICITACOES);
    const [tab, setTab] = useState<StatusSolicitacao | "todos">("todos");
    const [busca, setBusca] = useState("");
    const [selecionadaId, setSelecionadaId] = useState<string | null>(SOLICITACOES[0]?.id ?? null);
    const [indiceAnexo, setIndiceAnexo] = useState(0);

    const query = busca.trim().toLowerCase();
    const queryDigitos = query.replace(/\D/g, "");

    const lista = useMemo(
        () =>
            solicitacoes.filter((s) => {
                const matchTab = tab === "todos" || s.status === tab;
                const matchNome = s.solicitante.nome.toLowerCase().includes(query);
                const matchDoc =
                    queryDigitos.length > 0 && s.solicitante.documento.replace(/\D/g, "").includes(queryDigitos);
                return matchTab && (!query || matchNome || matchDoc);
            }),
        [solicitacoes, tab, query, queryDigitos],
    );

    const pendentes = useMemo(() => solicitacoes.filter((s) => s.status === "pendente").length, [solicitacoes]);

    const selecionada = solicitacoes.find((s) => s.id === selecionadaId) ?? null;
    const anexos = selecionada?.anexos ?? [];
    const total = anexos.length;
    const indice = Math.min(indiceAnexo, Math.max(0, total - 1));
    const anexo = anexos[indice];

    const selecionar = (id: string) => {
        setSelecionadaId(id);
        setIndiceAnexo(0);
    };

    const irPara = (delta: number) => setIndiceAnexo((i) => (i + delta + total) % total);

    const decidir = (id: string, status: StatusSolicitacao) => {
        const hoje = new Date().toISOString().split("T")[0];
        setSolicitacoes((prev) =>
            prev.map((s) => (s.id === id ? { ...s, status, decisao: { por: USUARIO_ATUAL, em: hoje } } : s)),
        );
    };

    return (
        <AprovacoesLayout>
            <div className="flex h-[calc(100vh-4rem)]">
                {/* Lista (caixa de entrada) */}
                <aside className="flex w-full max-w-[460px] shrink-0 flex-col border-r border-secondary">
                    {/* Topo: título + busca + tabs */}
                    <div className="flex flex-col gap-3 border-b border-secondary px-6 pt-5 pb-3">
                        <h1 className="text-lg font-bold text-primary">Solicitações</h1>
                        <Input
                            size="sm"
                            icon={SearchLg}
                            aria-label="Buscar solicitações"
                            placeholder="Buscar por nome ou documento"
                            value={busca}
                            onChange={setBusca}
                        />
                        <div className="flex items-center gap-2">
                            {TABS.map((t) => {
                                const ativo = tab === t.id;
                                return (
                                    <button
                                        key={t.id}
                                        type="button"
                                        onClick={() => setTab(t.id)}
                                        className={cx(
                                            "rounded-lg border border-primary px-2.5 py-1 text-sm font-medium whitespace-nowrap outline-none transition duration-100 ease-linear",
                                            ativo
                                                ? "bg-white text-[#171717]"
                                                : "bg-primary text-secondary hover:bg-primary_hover",
                                        )}
                                    >
                                        {t.label}
                                        {t.id === "pendente" && (
                                            <span className={cx("ml-1", ativo ? "text-[#737373]" : "text-tertiary")}>
                                                ({pendentes})
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Itens */}
                    <div className="flex-1 overflow-y-auto p-4">
                        {lista.length === 0 ? (
                            <p className="px-2 py-10 text-center text-sm text-tertiary">Nenhuma solicitação.</p>
                        ) : (
                            <div className="flex flex-col gap-1">
                                {lista.map((s) => {
                                    const ativo = s.id === selecionadaId;
                                    return (
                                        <button
                                            key={s.id}
                                            type="button"
                                            onClick={() => selecionar(s.id)}
                                            className={cx(
                                                "flex w-full items-start gap-1.5 rounded-lg p-4 text-left outline-none transition duration-100 ease-linear",
                                                ativo ? "bg-secondary" : "hover:bg-primary_hover",
                                            )}
                                        >
                                            <div className="flex min-w-px flex-1 flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className={cx("size-2.5 shrink-0 rounded-full", DOT[s.status])}
                                                        aria-hidden="true"
                                                    />
                                                    <span className="truncate text-md font-bold text-secondary">
                                                        {s.solicitante.nome}
                                                    </span>
                                                </div>
                                                <span className="text-xs text-tertiary">{s.solicitante.documento}</span>
                                            </div>
                                            <span className="shrink-0 text-xs font-medium text-tertiary">
                                                {formatarData(s.data)}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </aside>

                {/* Detalhe: anexos + decisão */}
                <section className="flex min-w-px flex-1 flex-col">
                    {!selecionada ? (
                        <div className="flex flex-1 items-center justify-center">
                            <p className="text-sm text-tertiary">Selecione uma solicitação para analisar.</p>
                        </div>
                    ) : (
                        <>
                            {/* Cabeçalho: solicitante + status + ações */}
                            <div className="flex items-center justify-between gap-4 border-b border-secondary px-6 pt-4 pb-[17px]">
                                <div className="flex min-w-px flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                        <h2 className="truncate text-md font-semibold text-primary">
                                            {selecionada.solicitante.nome}
                                        </h2>
                                        <BadgeWithDot
                                            size="md"
                                            type="pill-color"
                                            color={STATUS_META[selecionada.status].color}
                                        >
                                            {STATUS_META[selecionada.status].label}
                                        </BadgeWithDot>
                                    </div>
                                    <p className="text-sm text-tertiary">
                                        {selecionada.solicitante.documento} • Solicitado em{" "}
                                        {formatarData(selecionada.data)}
                                    </p>
                                </div>
                                <div className="flex shrink-0 items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => decidir(selecionada.id, "rejeitada")}
                                        className="flex items-center gap-1.5 rounded-lg px-3.5 py-2.5 text-sm font-semibold text-primary outline-none transition duration-100 ease-linear hover:bg-primary_hover"
                                    >
                                        <XCircle className="size-5 text-fg-error-primary" aria-hidden="true" />
                                        Rejeitar
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => decidir(selecionada.id, "aprovada")}
                                        className="flex items-center gap-1.5 rounded-lg px-3.5 py-2.5 text-sm font-semibold text-primary outline-none transition duration-100 ease-linear hover:bg-primary_hover"
                                    >
                                        <CheckCircle className="size-5 text-fg-success-primary" aria-hidden="true" />
                                        Aprovar
                                    </button>
                                </div>
                            </div>

                            {/* Navegação entre anexos */}
                            <div className="flex items-center justify-center gap-8 border-b border-secondary px-6 pt-3 pb-[13px]">
                                <ButtonUtility
                                    size="sm"
                                    color="tertiary"
                                    icon={ChevronLeft}
                                    tooltip="Anterior"
                                    isDisabled={total <= 1}
                                    onClick={() => irPara(-1)}
                                />
                                <div className="flex flex-col items-center text-center">
                                    <span className="text-sm font-medium text-secondary">
                                        {anexo?.nome ?? "Sem anexos"}
                                    </span>
                                    <span className="text-xs text-tertiary">
                                        {total > 0 ? `Anexo ${indice + 1} de ${total}` : "Nenhum anexo"}
                                    </span>
                                </div>
                                <ButtonUtility
                                    size="sm"
                                    color="tertiary"
                                    icon={ChevronRight}
                                    tooltip="Próximo"
                                    isDisabled={total <= 1}
                                    onClick={() => irPara(1)}
                                />
                            </div>

                            {/* Preview */}
                            <div className="flex flex-1 items-center justify-center overflow-auto bg-secondary p-6">
                                <AnexoPreview anexo={anexo} />
                            </div>
                        </>
                    )}
                </section>
            </div>
        </AprovacoesLayout>
    );
}
