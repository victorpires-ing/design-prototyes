import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { CheckCircle, ChevronLeft, Expand01, SearchLg, Settings01, XCircle } from "@untitledui/icons";
import { toast } from "sonner";
import { Badge, BadgeWithDot } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import documentoImg from "../components/assets/documento-identificacao.png";
import grafismo from "../components/assets/grafismo.svg";
import { Input } from "@/components/base/input/input";
import { cx } from "@/utils/cx";
import { BackstageLayout } from "../../components/Backstage";
import { DecisaoModal, SEGMENTACOES, JUSTIFICATIVAS } from "../components/DecisaoModal";
import { AnexoViewerModal } from "../components/AnexoViewerModal";
import { LaudoView } from "../components/LaudoView";
import { FormularioParticipacaoModal, type LimiteSolicitacoes } from "../components/FormularioParticipacaoModal";
import { FORMULARIOS, atualizarFormulario } from "../data/formularios";
import { showSuccessToast, showNeutralToast } from "../utils/toast";
import {
    SOLICITACOES,
    STATUS_META,
    formatarData,
    type Anexo,
    type Solicitacao,
    type StatusSolicitacao,
} from "../data/solicitacoes";

const USUARIO_ATUAL_EMAIL = "thais.silva@vegasports.com.br";

const TABS: { id: StatusSolicitacao; label: string }[] = [
    { id: "pendente", label: "Pendente" },
    { id: "aprovada", label: "Aprovado" },
    { id: "rejeitada", label: "Reprovado" },
];

const MENSAGEM_LISTA_VAZIA: Record<StatusSolicitacao, string> = {
    pendente: "Não há pedidos pendentes",
    aprovada: "Não há pedidos aprovados",
    rejeitada: "Não há pedidos reprovados",
};

/** Mostra a scrollbar (classe is-scrolling) enquanto a área rola; esconde após parar. */
function useScrolling() {
    const [scrolling, setScrolling] = useState(false);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const onScroll = () => {
        setScrolling(true);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => setScrolling(false), 700);
    };
    return { scrolling, onScroll };
}

const rotuloDecisao = (s: StatusSolicitacao) =>
    s === "pendente" ? "Solicitado em" : s === "aprovada" ? "Aprovado em" : "Reprovado em";

/** Backstage → Público → Pedidos de participação. */
export function SolicitacoesParticipacao() {
    const navigate = useNavigate();
    const location = useLocation();
    const formularioId = (location.state as { formularioId?: string } | null)?.formularioId ?? null;
    const [formulario, setFormulario] = useState(() => FORMULARIOS.find((f) => f.id === formularioId) ?? null);
    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
    const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>(SOLICITACOES);
    const [tab, setTab] = useState<StatusSolicitacao>("pendente");
    const [busca, setBusca] = useState("");
    const [selecionadaId, setSelecionadaId] = useState<string | null>(SOLICITACOES[0]?.id ?? null);
    const [decisao, setDecisao] = useState<"aprovar" | "rejeitar" | null>(null);
    const [visualizando, setVisualizando] = useState<Anexo | null>(null);
    const [carregando, setCarregando] = useState(false);
    const [carregandoFormulario, setCarregandoFormulario] = useState(true);
    const listaScroll = useScrolling();
    const detalheScroll = useScrolling();

    // Ao entrar/trocar de formulário, exibe um loading de pelo menos 2s antes do conteúdo.
    useEffect(() => {
        setCarregandoFormulario(true);
        const timer = setTimeout(() => setCarregandoFormulario(false), 1500);
        return () => clearTimeout(timer);
    }, [formularioId]);

    const query = busca.trim().toLowerCase();

    const lista = useMemo(
        () =>
            solicitacoes.filter((s) => {
                const matchTab = s.status === tab;
                const matchBusca =
                    !query || s.nome.toLowerCase().includes(query) || s.email.toLowerCase().includes(query);
                return matchTab && matchBusca;
            }),
        [solicitacoes, tab, query],
    );

    const contagem = useMemo(
        () => ({
            pendente: solicitacoes.filter((s) => s.status === "pendente").length,
            aprovada: solicitacoes.filter((s) => s.status === "aprovada").length,
            rejeitada: solicitacoes.filter((s) => s.status === "rejeitada").length,
        }),
        [solicitacoes],
    );

    const selecionada = solicitacoes.find((s) => s.id === selecionadaId) ?? null;

    const selecionar = (id: string) => {
        if (id === selecionadaId) return;
        setSelecionadaId(id);
        setCarregando(true);
        setTimeout(() => setCarregando(false), 1500);
    };

    const decidir = (id: string, status: StatusSolicitacao, segmento?: string, justificativa?: string) => {
        setSolicitacoes((prev) => prev.map((s) => (s.id === id ? { ...s, status, segmento, justificativa } : s)));
    };

    /** Confirma a decisão do modal (aprovar/rejeitar) e dispara o toast de feedback. */
    const confirmarDecisao = (opcaoId: string, textoLivre?: string) => {
        if (!selecionada || !decisao) return;
        const nome = selecionada.nome;
        setCarregando(true);
        setTimeout(() => setCarregando(false), 1500);
        if (decisao === "aprovar") {
            const seg = SEGMENTACOES.find((o) => o.id === opcaoId)?.label;
            decidir(selecionada.id, "aprovada", seg);
            setTab("aprovada");
            showSuccessToast("Pedido aprovado", `${nome} foi adicionado(a) ao segmento ${seg}.`);
        } else {
            const just = textoLivre || JUSTIFICATIVAS.find((o) => o.id === opcaoId)?.label || "";
            decidir(selecionada.id, "rejeitada", undefined, just);
            setTab("rejeitada");
            const motivo = just.charAt(0).toLowerCase() + just.slice(1);
            showNeutralToast("Pedido reprovado", `${nome} foi reprovado com o motivo: ${motivo}.`);
        }
        setDecisao(null);
    };

    /** Salva as configurações (recebimento/limite) do formulário no store compartilhado. */
    const handleSalvarConfiguracao = ({ ativo, limite, quantidade }: { ativo: boolean; limite: LimiteSolicitacoes; quantidade?: number }) => {
        if (!formulario) return;
        atualizarFormulario(formulario.id, { ativo, limite, quantidadeLimite: quantidade });
        setFormulario({ ...formulario, ativo, limite, quantidadeLimite: quantidade });
        toast.success("Tudo certo!", {
            description: "As mudanças no formulário já estão disponíveis para o público.",
            duration: 2000,
        });
    };

    if (carregandoFormulario) {
        return (
            <BackstageLayout showEventContext={false} showLayoutSwitcher={false} activeProducer="publico">
                <div className="flex min-w-0 flex-1 items-center justify-center overflow-hidden rounded-xl ring-1 ring-border-secondary md:mx-3 md:h-[calc(100dvh-3rem)]">
                    <div
                        className="size-8 animate-spin rounded-full border-2 border-secondary border-t-fg-brand-primary"
                        role="status"
                        aria-label="Carregando"
                    />
                </div>
            </BackstageLayout>
        );
    }

    return (
        <BackstageLayout showEventContext={false} showLayoutSwitcher={false} activeProducer="publico">
            <div className="flex min-w-0 flex-1 overflow-hidden rounded-xl ring-1 ring-border-secondary md:mx-3 md:h-[calc(100dvh-3rem)]">
                {/* Lista */}
                <aside className="flex h-full w-full max-w-[420px] shrink-0 flex-col border-r border-secondary bg-primary">
                    <div className="flex flex-col gap-6 border-b border-secondary px-6 pt-6">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    aria-label="Voltar"
                                    onClick={() => navigate("/backstage/publico/formularios")}
                                    className="flex size-11 shrink-0 items-center justify-center rounded-[8px] text-fg-secondary ring-1 ring-secondary transition duration-100 ease-linear hover:bg-secondary"
                                >
                                    <ChevronLeft className="size-5" aria-hidden="true" />
                                </button>
                                <div className="flex flex-col">
                                    <h1 className="text-lg font-bold text-primary">Formulário de participação</h1>
                                    {formulario && <span className="text-sm text-tertiary">{formulario.titulo}</span>}
                                </div>
                            </div>
                            <button
                                type="button"
                                aria-label="Configurar formulário"
                                onClick={() => setIsConfigModalOpen(true)}
                                className="flex size-11 shrink-0 items-center justify-center rounded-[8px] text-fg-secondary transition duration-100 ease-linear hover:bg-secondary"
                            >
                                <Settings01 className="size-5" aria-hidden="true" />
                            </button>
                        </div>
                        <Input
                            size="md"
                            icon={SearchLg}
                            aria-label="Buscar pedidos"
                            placeholder="Buscar por nome ou e-mail"
                            value={busca}
                            onChange={setBusca}
                        />
                        <div className="flex items-stretch border-b border-secondary">
                            {TABS.map((t) => {
                                const ativo = tab === t.id;
                                const count = contagem[t.id];
                                return (
                                    <button
                                        key={t.id}
                                        type="button"
                                        onClick={() => setTab(t.id)}
                                        className={cx(
                                            "-mb-px flex flex-1 items-center justify-center gap-1.5 border-b-2 pb-2.5 text-sm font-semibold whitespace-nowrap outline-none transition duration-100 ease-linear",
                                            ativo
                                                ? "border-fg-primary text-primary"
                                                : "border-transparent text-tertiary hover:text-secondary",
                                        )}
                                    >
                                        {t.label}
                                        {count > 0 && (
                                            <Badge size="sm" type="pill-color" color={t.id === "pendente" ? STATUS_META[t.id].color : "gray"}>
                                                {count > 999 ? "999+" : count}
                                            </Badge>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div
                        className={cx("scroll-suave min-h-0 flex-1 overflow-y-auto p-4", listaScroll.scrolling && "is-scrolling")}
                        onScroll={listaScroll.onScroll}
                    >
                        {lista.length === 0 ? (
                            query ? (
                                <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
                                    <div className="flex size-16 shrink-0 items-center justify-center rounded-xl ring-1 ring-secondary">
                                        <SearchLg className="size-6 text-fg-secondary" aria-hidden="true" />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-md font-bold text-primary">Pessoa não encontrada</span>
                                        <span className="text-sm text-tertiary">
                                            Verifique o nome ou e-mail inserido e tente novamente.
                                        </span>
                                    </div>
                                    <Button size="sm" color="secondary" onClick={() => setBusca("")}>
                                        Limpar busca
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex h-full items-center justify-center px-6 text-center">
                                    <span className="text-sm text-tertiary">{MENSAGEM_LISTA_VAZIA[tab]}</span>
                                </div>
                            )
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
                                                "flex w-full items-start justify-between gap-3 px-4 py-4 text-left outline-none transition duration-100 ease-linear",
                                                ativo
                                                    ? "rounded-xl bg-secondary"
                                                    : "border-b border-secondary hover:rounded-xl hover:border-transparent hover:bg-secondary/40",
                                            )}
                                        >
                                            <div className="flex min-w-px flex-1 flex-col gap-1">
                                                <span className="truncate text-md font-bold text-primary">{s.nome}</span>
                                                <span className="truncate text-sm text-tertiary">{s.email}</span>
                                            </div>
                                            <span className="shrink-0 text-sm font-medium text-tertiary">
                                                {formatarData(s.data)}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </aside>

                {/* Detalhe */}
                <section className="relative flex h-full min-w-px flex-1 flex-col overflow-hidden bg-secondary dark:bg-[#0a0a0a]">
                    {/* Grafismo de fundo (decorativo) */}
                    <img
                        src={grafismo}
                        alt=""
                        aria-hidden="true"
                        className="pointer-events-none absolute left-1/2 top-1/2 z-0 size-[1238px] max-w-none -translate-x-1/2 -translate-y-1/2 select-none"
                    />
                    {!selecionada ? (
                        <div className="flex flex-1 items-center justify-center">
                            <p className="text-sm text-tertiary">Selecione um pedido.</p>
                        </div>
                    ) : carregando ? (
                        <div className="flex flex-1 items-center justify-center">
                            <div
                                className="size-8 animate-spin rounded-full border-2 border-secondary border-t-fg-brand-primary"
                                role="status"
                                aria-label="Carregando"
                            />
                        </div>
                    ) : (
                        <>
                            {/* Conteúdo rolável */}
                            <div
                                className={cx("scroll-suave relative z-10 min-h-0 flex-1 overflow-y-auto", detalheScroll.scrolling && "is-scrolling")}
                                onScroll={detalheScroll.onScroll}
                            >
                                <div className="w-full px-6">
                                    <div className="mx-auto flex w-[600px] flex-col gap-5 py-6">
                                        {/* Cabeçalho */}
                                        <div className="flex flex-col rounded-xl bg-primary ring-1 ring-secondary">
                                            <div className="flex items-center justify-between gap-4 p-5">
                                                <div className="flex min-w-px flex-col gap-1">
                                                    <div className="flex items-center gap-2">
                                                        <h2 className="truncate text-lg font-semibold text-primary">
                                                            {selecionada.nome}
                                                        </h2>
                                                        <BadgeWithDot
                                                            size="md"
                                                            type="pill-color"
                                                            color={STATUS_META[selecionada.status].color}
                                                        >
                                                            {STATUS_META[selecionada.status].label}
                                                        </BadgeWithDot>
                                                    </div>
                                                    <span className="truncate text-sm text-tertiary">{selecionada.email}</span>
                                                </div>
                                                <span className="shrink-0 text-sm text-tertiary">
                                                    {rotuloDecisao(selecionada.status)} {formatarData(selecionada.data)} às 12:00
                                                </span>
                                            </div>
                                            {selecionada.status === "aprovada" && selecionada.segmento && (
                                                <div className="rounded-b-xl border-t border-secondary bg-[#0A0A0A] px-5 py-4">
                                                    <span className="text-md text-primary">
                                                        Adicionado em: {selecionada.segmento}
                                                    </span>
                                                </div>
                                            )}
                                            {selecionada.status === "rejeitada" && selecionada.justificativa && (
                                                <div className="rounded-b-xl border-t border-secondary bg-[#0A0A0A] px-5 py-4">
                                                    <span className="text-md text-primary">
                                                        Justificativa: {selecionada.justificativa}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Informações do participante */}
                                        <div className="flex flex-col rounded-xl bg-[#0A0A0A] ring-1 ring-secondary">
                                            <div className="border-b border-secondary p-5">
                                                <h3 className="text-md font-semibold text-primary">Informações do participante</h3>
                                            </div>
                                            <div className="grid grid-cols-1 gap-x-8 gap-y-4 p-5 sm:grid-cols-2">
                                                <Campo label="Nome" valor={selecionada.nome} />
                                                <Campo label="CPF ou passaporte" valor={selecionada.documento} />
                                                <Campo label="E-mail" valor={selecionada.email} />
                                                <Campo label="Data de nascimento" valor={selecionada.nascimento} />
                                                <Campo label="Telefone" valor={selecionada.telefone} />
                                                <Campo label="Data do laudo" valor={selecionada.dataLaudo} />
                                            </div>
                                        </div>

                                        {/* Anexos */}
                                        <div className="flex flex-col rounded-xl bg-[#0A0A0A] ring-1 ring-secondary">
                                            <div className="flex items-center justify-between gap-4 border-b border-secondary p-5">
                                                <h3 className="text-md font-semibold text-primary">Anexos ({selecionada.anexos.length})</h3>
                                                <span className="shrink-0 text-sm text-tertiary">
                                                    Os anexos serão excluídos 15 dias após a validação.
                                                </span>
                                            </div>
                                            <div className="flex flex-col">
                                                {selecionada.anexos.map((a, i) => (
                                                    <div
                                                        key={a.nome}
                                                        className={cx("flex flex-col gap-3 px-5 py-6", i > 0 && "border-t border-secondary")}
                                                    >
                                                        <div className="flex items-center justify-between gap-4">
                                                            <h4 className="text-md font-semibold text-primary">{a.nome}</h4>
                                                            <button
                                                                type="button"
                                                                aria-label="Expandir"
                                                                onClick={() => setVisualizando(a)}
                                                                className="flex size-8 shrink-0 items-center justify-center rounded-[8px] text-fg-secondary ring-1 ring-secondary transition duration-100 ease-linear hover:bg-secondary"
                                                            >
                                                                <Expand01 className="size-4" aria-hidden="true" />
                                                            </button>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => setVisualizando(a)}
                                                            className="block overflow-hidden rounded-xl text-left outline-none focus-visible:ring-2 focus-visible:ring-brand"
                                                        >
                                                            {a.tipo === "identificacao" ? (
                                                                <img
                                                                    src={documentoImg}
                                                                    alt={a.nome}
                                                                    className="h-[420px] w-full object-cover"
                                                                />
                                                            ) : (
                                                                <div className="w-full bg-white">
                                                                    <LaudoView />
                                                                </div>
                                                            )}
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Rodapé */}
                            <div
                                className={cx(
                                    "relative z-10 flex h-[73px] shrink-0 items-center gap-4 border-t border-secondary bg-[#0A0A0A] px-6",
                                    selecionada.status === "pendente" ? "justify-end" : "justify-center",
                                )}
                            >
                                {selecionada.status === "pendente" ? (
                                    <div className="flex shrink-0 items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setDecisao("rejeitar")}
                                            className="flex items-center gap-1.5 rounded-lg bg-[#0A0A0A] px-4 py-2.5 text-sm font-semibold text-primary ring-1 ring-border-primary outline-none transition duration-100 ease-linear hover:bg-secondary"
                                        >
                                            <XCircle className="size-5 text-fg-error-primary" aria-hidden="true" />
                                            Rejeitar
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setDecisao("aprovar")}
                                            className="flex items-center gap-1.5 rounded-lg bg-[#0A0A0A] px-4 py-2.5 text-sm font-semibold text-primary ring-1 ring-border-primary outline-none transition duration-100 ease-linear hover:bg-secondary"
                                        >
                                            Aprovar
                                            <CheckCircle className="size-5 text-fg-success-primary" aria-hidden="true" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-1 text-center">
                                        <span className="text-md font-semibold text-primary">
                                            {selecionada.status === "aprovada" ? "Aprovado por" : "Reprovado por"} {USUARIO_ATUAL_EMAIL}
                                        </span>
                                        <span className="text-sm text-tertiary">{formatarData(selecionada.data)} às 12:00</span>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </section>
            </div>

            <DecisaoModal
                isOpen={decisao !== null}
                variant={decisao ?? "aprovar"}
                onClose={() => setDecisao(null)}
                onConfirmar={confirmarDecisao}
            />
            <AnexoViewerModal anexo={visualizando} onClose={() => setVisualizando(null)} />

            {formulario && (
                <FormularioParticipacaoModal
                    isOpen={isConfigModalOpen}
                    onClose={() => setIsConfigModalOpen(false)}
                    onSalvar={handleSalvarConfiguracao}
                    ativoInicial={formulario.ativo}
                    limiteInicial={formulario.limite}
                    quantidadeInicial={formulario.quantidadeLimite}
                    solicitacoesRecebidas={formulario.solicitacoesRecebidas}
                />
            )}
        </BackstageLayout>
    );
}

/** Campo de leitura (label + valor). */
function Campo({ label, valor }: { label: string; valor: string }) {
    return (
        <div className="flex flex-col gap-1">
            <span className="text-sm text-tertiary">{label}</span>
            <span className="text-md text-primary">{valor}</span>
        </div>
    );
}
