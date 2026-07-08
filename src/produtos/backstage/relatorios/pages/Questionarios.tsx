import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronRight, Download01, Paperclip, SearchLg, XClose } from "@untitledui/icons";
import { Dialog as AriaDialog, Modal as AriaModal, ModalOverlay as AriaModalOverlay, type Selection } from "react-aria-components";
import { Avatar } from "@/components/base/avatar/avatar";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Input } from "@/components/base/input/input";
import { Select } from "@/components/base/select/select";
import { MultiSelect } from "@/components/base/select/multi-select";
import { Tabs } from "@/components/application/tabs/tabs";
import { PaginationCardAdvanced } from "@/components/application/pagination/pagination";
import { cx } from "@/utils/cx";
import { BackstageLayout } from "../../components/Backstage";
import { ExportMenu, RelatorioPageHeader } from "../components/RelatorioPageHeader";
import { RelatorioFiltersProvider } from "../components/relatorio-filters";
import { EVENT, numberFormatter, percentFormatter } from "../data/event";
import { COMBOS, comboIngressos, grupoById, type Combo, type Ingresso } from "../data/produtos";
import { PARTICIPANTES, QUESTIONARIO, TIPO_RESPOSTA, type ParticipanteRespostas, type QuestionarioPergunta, type RespostaDoParticipante } from "../data/questionarios";

const num = (n: number) => numberFormatter.format(n);
const PAGE_SIZE_INICIAL = 10;

/** Deriva de forma estável a partir do documento. */
const hashStr = (s: string) => {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return Math.abs(h);
};

/** Combo (bundle) comprado pelo participante. */
const comboDoParticipante = (p: ParticipanteRespostas): Combo => COMBOS[hashStr(p.respondente.documento) % COMBOS.length];

interface IngressoParticipante {
    ingresso: Ingresso;
    grupoNome: string;
    loteNome: string;
    respostas: RespostaDoParticipante[];
}

/**
 * Ingressos que o participante recebeu — os ingressos reais do combo (bundle).
 * O questionário é respondido por ingresso, então cada um carrega as respostas.
 */
const ingressosDoParticipante = (p: ParticipanteRespostas): IngressoParticipante[] =>
    comboIngressos(comboDoParticipante(p)).map((ingresso) => ({
        ingresso,
        grupoNome: grupoById(ingresso.grupoId)?.nome ?? "",
        loteNome: ingresso.lotes[0]?.nome ?? "Lote único",
        respostas: p.respostas,
    }));

/** Perguntas de opção fechada (têm distribuição por opção). */
const PERGUNTAS_FECHADAS = QUESTIONARIO.filter((q) => (q.tipo === "selecao-unica" || q.tipo === "multipla-selecao") && (q.opcoes?.length ?? 0) > 0);

/** Um participante respondeu `opcao` na pergunta `perguntaId`? */
const respostaInclui = (p: ParticipanteRespostas, perguntaId: string, opcao: string) => {
    const r = p.respostas.find((x) => x.perguntaId === perguntaId);
    if (!r) return false;
    return r.linha.opcao === opcao || (r.linha.opcoesMultiplas?.includes(opcao) ?? false);
};

const getInitials = (nome: string) =>
    nome
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0])
        .join("")
        .toUpperCase();

export function Questionarios() {
    return (
        <BackstageLayout activeSection="relatorios" activeItem="relatorio-questionarios">
            <RelatorioFiltersProvider sessoes={EVENT.sessoes}>
                <div className="flex min-w-0 flex-1 flex-col">
                    <main className="flex flex-1 flex-col gap-6 py-6 pb-10 md:px-6">
                        <RelatorioPageHeader title="Questionários" withFilters={false} actions={<ExportMenu />} />
                        <QuestionariosBody />
                    </main>
                </div>
            </RelatorioFiltersProvider>
        </BackstageLayout>
    );
}

const QuestionariosBody = () => {
    const [busca, setBusca] = useState("");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(PAGE_SIZE_INICIAL);
    const [selecionado, setSelecionado] = useState<ParticipanteRespostas | null>(null);
    const [abrirIngresso, setAbrirIngresso] = useState<number | undefined>(undefined);
    const [aba, setAba] = useState<"participantes" | "resumo">("resumo");
    const [filtroPergunta, setFiltroPergunta] = useState<string | null>(null);
    const [filtroOpcao, setFiltroOpcao] = useState<string | null>(null);
    const topRef = useRef<HTMLDivElement>(null);

    const filtrados = useMemo(() => {
        const termo = busca.trim().toLowerCase();
        return PARTICIPANTES.filter((p) => {
            const r = p.respondente;
            const okTexto = !termo || r.nome.toLowerCase().includes(termo) || r.email.toLowerCase().includes(termo) || r.documento.toLowerCase().includes(termo);
            const okResposta = !filtroPergunta || !filtroOpcao || respostaInclui(p, filtroPergunta, filtroOpcao);
            return okTexto && okResposta;
        });
    }, [busca, filtroPergunta, filtroOpcao]);

    const totalPages = Math.max(1, Math.ceil(filtrados.length / pageSize));
    const safePage = Math.min(page, totalPages);
    const visiveis = useMemo(() => filtrados.slice((safePage - 1) * pageSize, safePage * pageSize), [filtrados, safePage, pageSize]);

    useEffect(() => setPage(1), [busca, filtroPergunta, filtroOpcao]);

    const irParaTopo = () => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

    const perguntaFiltro = PERGUNTAS_FECHADAS.find((q) => q.id === filtroPergunta);

    return (
        <div ref={topRef} className="flex scroll-mt-6 flex-col gap-6">
            <Tabs selectedKey={aba} onSelectionChange={(k) => setAba(k as "participantes" | "resumo")}>
                <Tabs.List type="underline" items={[{ id: "resumo", label: "Resumo das respostas" }, { id: "participantes", label: "Participantes" }]}>
                    {(tab) => <Tabs.Item {...tab} />}
                </Tabs.List>

                <Tabs.Panel id="participantes" className="flex flex-col gap-4 pt-5">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:max-w-xl">
                            <Select
                                label="Filtrar por pergunta"
                                selectedKey={filtroPergunta ?? "__all__"}
                                onSelectionChange={(k) => {
                                    const v = String(k);
                                    setFiltroPergunta(v === "__all__" ? null : v);
                                    setFiltroOpcao(null);
                                }}
                                items={[{ id: "__all__", label: "Todas as perguntas" }, ...PERGUNTAS_FECHADAS.map((q) => ({ id: q.id, label: q.titulo }))]}
                            >
                                {(item) => <Select.Item id={item.id}>{item.label}</Select.Item>}
                            </Select>
                            <Select
                                label="Resposta"
                                placeholder={perguntaFiltro ? undefined : "Escolha a pergunta"}
                                isDisabled={!perguntaFiltro}
                                selectedKey={filtroOpcao ?? "__all__"}
                                onSelectionChange={(k) => {
                                    const v = String(k);
                                    setFiltroOpcao(v === "__all__" ? null : v);
                                }}
                                items={[{ id: "__all__", label: "Todas as respostas", qtd: "" }, ...(perguntaFiltro?.opcoes ?? []).map((o) => ({ id: o.label, label: o.label, qtd: `${num(o.respostas)}` }))]}
                            >
                                {(item) => (
                                    <Select.Item id={item.id} supportingText={item.qtd || undefined}>
                                        {item.label}
                                    </Select.Item>
                                )}
                            </Select>
                        </div>
                        <div className="w-full lg:w-80">
                            <Input icon={SearchLg} size="sm" aria-label="Buscar participante" placeholder="Buscar por nome, e-mail ou documento" value={busca} onChange={setBusca} />
                        </div>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-tertiary">
                            <span className="font-semibold text-primary">{num(filtrados.length)}</span> {filtrados.length === 1 ? "participante" : "participantes"}
                            {filtroPergunta && filtroOpcao ? " no filtro" : ""}
                        </span>
                        {(filtroPergunta || busca) && (
                            <Button
                                size="sm"
                                color="link-gray"
                                onClick={() => {
                                    setFiltroPergunta(null);
                                    setFiltroOpcao(null);
                                    setBusca("");
                                }}
                            >
                                Limpar filtros
                            </Button>
                        )}
                    </div>

                    {visiveis.length === 0 ? (
                        <div className="rounded-xl bg-primary px-4 py-12 text-center text-sm text-tertiary ring-1 ring-border-secondary">Nenhum participante encontrado.</div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {visiveis.map((p) => (
                                <ParticipanteCard
                                    key={p.respondente.id}
                                    participante={p}
                                    isSelected={selecionado?.respondente.id === p.respondente.id}
                                    onClick={() => {
                                        setAbrirIngresso(undefined);
                                        setSelecionado(p);
                                    }}
                                />
                            ))}
                        </div>
                    )}

                    <div className="overflow-clip rounded-xl bg-primary ring-1 ring-border-secondary">
                        <PaginationCardAdvanced
                            className="[&]:border-t-0"
                            page={safePage}
                            total={totalPages}
                            pageSize={pageSize}
                            onPageChange={(p: number) => {
                                setPage(p);
                                irParaTopo();
                            }}
                            onPageSizeChange={(s: number) => {
                                setPageSize(s);
                                setPage(1);
                            }}
                        />
                    </div>
                </Tabs.Panel>

                <Tabs.Panel id="resumo" className="pt-5">
                    <ResumoRespostasView
                        onSelect={(p) => {
                            setAbrirIngresso(0);
                            setSelecionado(p);
                        }}
                    />
                </Tabs.Panel>
            </Tabs>

            <RespostasSlideOut isOpen={selecionado !== null} participante={selecionado} abrirIngresso={abrirIngresso} onClose={() => setSelecionado(null)} />
        </div>
    );
};

/* ------------------------------------------------------------------ */
/*  Visão "Respostas por opção" (distribuição de perguntas fechadas)   */
/* ------------------------------------------------------------------ */

const RESUMIVEIS = QUESTIONARIO.filter((q) => q.tipo !== "anexar-arquivo");
const TODAS_IDS = RESUMIVEIS.map((q) => q.id);
const PARTICIPANTE_POR_ID = new Map(PARTICIPANTES.map((p) => [p.respondente.id, p]));

function ResumoRespostasView({ onSelect }: { onSelect: (p: ParticipanteRespostas) => void }) {
    const [busca, setBusca] = useState("");
    const [visiveis, setVisiveis] = useState<Selection>(new Set(TODAS_IDS));

    const idsVisiveis = visiveis === "all" ? new Set(TODAS_IDS) : visiveis;
    const termo = busca.trim().toLowerCase();
    const perguntas = RESUMIVEIS.filter((q) => idsVisiveis.has(q.id));

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="w-full sm:max-w-xs">
                    <MultiSelect
                        label="Perguntas exibidas"
                        placeholder="Escolha as perguntas"
                        showSearch={false}
                        selectedKeys={visiveis}
                        onSelectionChange={setVisiveis}
                        onReset={() => setVisiveis(new Set())}
                        onSelectAll={() => setVisiveis(new Set(TODAS_IDS))}
                        selectedCountFormatter={(n) => (n === TODAS_IDS.length ? "Todas as perguntas" : `${n} de ${TODAS_IDS.length} perguntas`)}
                        items={RESUMIVEIS.map((q) => ({ id: q.id, label: q.titulo }))}
                    >
                        {(item) => (
                            <MultiSelect.Item id={item.id} selectionIndicator="checkbox" selectionIndicatorAlign="left">
                                {item.label}
                            </MultiSelect.Item>
                        )}
                    </MultiSelect>
                </div>
                <div className="w-full sm:w-72">
                    <Input icon={SearchLg} size="sm" aria-label="Buscar nas respostas" placeholder="Buscar nas respostas" value={busca} onChange={setBusca} />
                </div>
            </div>

            {perguntas.length === 0 ? (
                <div className="rounded-xl bg-primary px-4 py-12 text-center text-sm text-tertiary ring-1 ring-border-secondary">Selecione ao menos uma pergunta para exibir.</div>
            ) : (
                perguntas.map((pergunta) =>
                    pergunta.tipo === "texto-aberto" ? (
                        <ResumoTextoCard key={pergunta.id} pergunta={pergunta} termo={termo} onSelect={onSelect} />
                    ) : (
                        <ResumoPerguntaCard key={pergunta.id} pergunta={pergunta} termo={termo} />
                    ),
                )
            )}
        </div>
    );
}

/** Cabeçalho comum dos cards do resumo. */
function ResumoHeader({ pergunta, extra }: { pergunta: QuestionarioPergunta; extra?: string }) {
    return (
        <div className="flex flex-col gap-1 border-b border-secondary px-5 py-3.5">
            <h4 className="text-sm font-semibold text-primary">{pergunta.titulo}</h4>
            <span className="text-sm text-tertiary">
                {TIPO_RESPOSTA[pergunta.tipo].label}
                {extra ? ` · ${extra}` : ""} · <span className="font-medium text-secondary">{num(pergunta.respondidas)}</span> de {num(pergunta.total)} responderam
            </span>
        </div>
    );
}

/** Card de pergunta de texto aberto (estilo Typeform): lista rolável de respostas. */
function ResumoTextoCard({ pergunta, termo, onSelect }: { pergunta: QuestionarioPergunta; termo: string; onSelect: (p: ParticipanteRespostas) => void }) {
    const respostas = pergunta.respostas.filter((r) => {
        if (!termo) return true;
        return (r.texto ?? "").toLowerCase().includes(termo) || r.respondente.nome.toLowerCase().includes(termo);
    });

    if (termo && respostas.length === 0) return null;

    return (
        <div className="overflow-clip rounded-xl bg-primary ring-1 ring-border-secondary">
            <ResumoHeader pergunta={pergunta} extra={`${num(respostas.length)} respostas`} />
            <div className="max-h-80 divide-y divide-secondary overflow-y-auto">
                {respostas.map((r, i) => {
                    const participante = PARTICIPANTE_POR_ID.get(r.respondente.id);
                    return (
                        <button
                            key={i}
                            type="button"
                            disabled={!participante}
                            onClick={() => participante && onSelect(participante)}
                            className="flex w-full items-start justify-between gap-3 px-5 py-3.5 text-left transition duration-100 ease-linear hover:bg-primary_hover"
                        >
                            <span className="flex min-w-0 flex-col gap-1.5">
                                <span className="text-sm text-secondary">“{r.texto}”</span>
                                <span className="text-sm font-medium text-brand-secondary">{r.respondente.nome}</span>
                            </span>
                            <ChevronRight aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-fg-quaternary" />
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

function ResumoPerguntaCard({ pergunta, termo }: { pergunta: QuestionarioPergunta; termo: string }) {
    const base = pergunta.respondidas || 1;
    const maxResp = Math.max(...(pergunta.opcoes ?? []).map((o) => o.respostas), 1);
    const opcoes = (pergunta.opcoes ?? []).filter((o) => !termo || o.label.toLowerCase().includes(termo)).sort((a, b) => b.respostas - a.respostas);

    if (termo && opcoes.length === 0) return null;

    return (
        <div className="overflow-clip rounded-xl bg-primary ring-1 ring-border-secondary">
            <ResumoHeader pergunta={pergunta} extra={`${num(pergunta.opcoes?.length ?? 0)} opções`} />
            <ul className="flex flex-col divide-y divide-secondary">
                {opcoes.map((o) => (
                    <li key={o.label} className="flex flex-col gap-2 px-5 py-3.5">
                        <div className="flex items-center justify-between gap-4">
                            <span className="min-w-0 truncate text-sm font-medium text-secondary">{o.label}</span>
                            <span className="shrink-0 text-sm text-tertiary">
                                <span className="font-semibold text-primary">{num(o.respostas)}</span> · {percentFormatter.format(o.respostas / base)}
                            </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-quaternary">
                            <div className="h-full rounded-full bg-brand-solid transition-all duration-300 ease-linear" style={{ width: `${(o.respostas / maxResp) * 100}%` }} />
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Card do participante                                               */
/* ------------------------------------------------------------------ */

function ParticipanteCard({ participante, isSelected, onClick }: { participante: ParticipanteRespostas; isSelected: boolean; onClick: () => void }) {
    const { respondente: r } = participante;
    return (
        <button
            type="button"
            onClick={onClick}
            aria-current={isSelected || undefined}
            className={cx(
                "group flex w-full items-center gap-4 rounded-xl px-4 py-4 text-left transition duration-100 ease-linear hover:bg-primary_hover sm:px-5",
                isSelected ? "bg-primary_hover ring-2 ring-brand" : "bg-primary ring-1 ring-border-secondary",
            )}
        >
            <Avatar size="md" initials={getInitials(r.nome)} />
            <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-semibold text-primary">{r.nome}</span>
                <span className="truncate text-sm text-tertiary">{r.email}</span>
            </div>
            <div className="hidden w-40 shrink-0 flex-col md:flex">
                <span className="text-sm text-secondary">{r.documento}</span>
                <span className="text-sm text-tertiary">Nasc. {r.nascimento}</span>
            </div>
            <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-fg-quaternary transition-transform duration-100 ease-linear group-hover:translate-x-0.5" />
        </button>
    );
}

/* ------------------------------------------------------------------ */
/*  Slideout — respostas do participante                               */
/* ------------------------------------------------------------------ */

function RespostasSlideOut({ isOpen, participante, abrirIngresso, onClose }: { isOpen: boolean; participante: ParticipanteRespostas | null; abrirIngresso?: number; onClose: () => void }) {
    const r = participante?.respondente;
    return (
        <AriaModalOverlay isOpen={isOpen} onOpenChange={(open) => !open && onClose()} isDismissable className="fixed inset-0 z-50 flex justify-end outline-hidden">
            <AriaModal
                className={({ isEntering, isExiting }) =>
                    cx(
                        "h-full w-full max-w-[480px] bg-primary shadow-xl outline-hidden",
                        isEntering && "duration-300 ease-out animate-in slide-in-from-right",
                        isExiting && "duration-200 ease-in animate-out slide-out-to-right",
                    )
                }
            >
                <AriaDialog className="flex h-full flex-col outline-hidden">
                    <div className="flex items-center justify-between gap-4 border-b border-secondary px-6 py-5">
                        <h2 className="text-lg font-semibold text-primary">Respostas do participante</h2>
                        <ButtonUtility size="sm" color="tertiary" icon={XClose} tooltip="Fechar" onClick={onClose} />
                    </div>

                    <div className="flex flex-1 flex-col overflow-y-auto">
                        {participante && r && (
                            <>
                                <div className="flex items-center gap-3 px-6 pt-6 pb-5">
                                    <Avatar size="lg" initials={getInitials(r.nome)} />
                                    <div className="flex min-w-0 flex-col">
                                        <span className="truncate text-md font-semibold text-primary">{r.nome}</span>
                                        <span className="truncate text-sm text-tertiary">{r.email}</span>
                                    </div>
                                </div>

                                <div className="mx-6 border-t border-secondary" />

                                <div className="flex flex-col gap-3 px-6 pt-5 pb-4">
                                    <h3 className="text-md font-semibold text-primary">Identificação</h3>
                                    <dl className="flex flex-col gap-3">
                                        <DetailStacked label="Documento" value={r.documento} />
                                        <DetailStacked label="Data de nascimento" value={r.nascimento} />
                                    </dl>
                                </div>

                                <div className="mx-6 border-t border-secondary" />

                                {(() => {
                                    const combo = comboDoParticipante(participante);
                                    const ingressos = ingressosDoParticipante(participante);
                                    if (ingressos.length === 1) {
                                        const ing = ingressos[0];
                                        return (
                                            <>
                                                <div className="flex flex-col gap-3 px-6 pt-5 pb-4">
                                                    <h3 className="text-md font-semibold text-primary">Ingresso</h3>
                                                    <IngressoDetalhe ing={ing} />
                                                </div>
                                                <div className="mx-6 border-t border-secondary" />
                                                <div className="flex flex-col gap-4 px-6 pt-5 pb-6">
                                                    <h3 className="text-md font-semibold text-primary">Respostas</h3>
                                                    <RespostasLista respostas={ing.respostas} />
                                                </div>
                                            </>
                                        );
                                    }
                                    return (
                                        <>
                                            <div className="flex flex-col gap-3 px-6 pt-5 pb-4">
                                                <h3 className="text-md font-semibold text-primary">Combo</h3>
                                                <dl className="flex flex-col gap-3">
                                                    <DetailStacked label="Nome do combo" value={combo.nome} />
                                                    <DetailStacked label="Tipo" value={combo.tipo === "fixo" ? "Fixo" : "Dinâmico"} />
                                                </dl>
                                            </div>
                                            <div className="mx-6 border-t border-secondary" />
                                            <div className="flex flex-col gap-3 px-6 pt-5 pb-6">
                                                <h3 className="text-md font-semibold text-primary">Ingressos ({num(ingressos.length)})</h3>
                                                {ingressos.map((ing, i) => (
                                                    <IngressoAccordion key={`${r.id}-${i}`} ing={ing} defaultOpen={i === abrirIngresso} />
                                                ))}
                                            </div>
                                        </>
                                    );
                                })()}
                            </>
                        )}
                    </div>

                    <div className="flex items-center justify-end gap-2 border-t border-secondary px-6 py-4">
                        <Button size="sm" color="secondary" onClick={onClose}>
                            Fechar
                        </Button>
                    </div>
                </AriaDialog>
            </AriaModal>
        </AriaModalOverlay>
    );
}

/** Dados do ingresso (grupo > ingresso > lote) empilhados. */
function IngressoDetalhe({ ing }: { ing: IngressoParticipante }) {
    return (
        <dl className="flex flex-col gap-3">
            <DetailStacked label="Grupo do ingresso" value={ing.grupoNome} />
            <DetailStacked label="Nome do ingresso" value={ing.ingresso.nome} />
            <DetailStacked label="Lote" value={ing.loteNome} />
        </dl>
    );
}

/** Lista de respostas do questionário para um conjunto de respostas. */
function RespostasLista({ respostas }: { respostas: RespostaDoParticipante[] }) {
    return (
        <div className="flex flex-col gap-4">
            {QUESTIONARIO.map((q) => {
                const resp = respostas.find((x) => x.perguntaId === q.id);
                const meta = TIPO_RESPOSTA[q.tipo];
                return (
                    <div key={q.id} className="flex flex-col gap-2 rounded-xl bg-secondary/50 p-4 ring-1 ring-border-secondary">
                        <div className="flex items-start gap-2">
                            <meta.icon className="mt-0.5 size-4 shrink-0 text-fg-quaternary" aria-hidden="true" />
                            <span className="text-sm font-medium text-primary">{q.titulo}</span>
                        </div>
                        {resp ? <RespostaValor resp={resp} /> : <span className="text-sm text-tertiary italic">Não respondeu</span>}
                    </div>
                );
            })}
        </div>
    );
}

/** Ingresso como accordion: cabeçalho com grupo/ingresso/lote, corpo com as respostas. */
function IngressoAccordion({ ing, defaultOpen }: { ing: IngressoParticipante; defaultOpen?: boolean }) {
    const [open, setOpen] = useState(!!defaultOpen);
    return (
        <div className="overflow-hidden rounded-xl ring-1 ring-border-secondary">
            <button
                type="button"
                aria-expanded={open}
                onClick={() => setOpen((v) => !v)}
                className={cx("flex w-full items-center gap-3 px-4 py-3 text-left transition duration-100 ease-linear hover:bg-primary_hover", open && "border-b border-secondary")}
            >
                <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-semibold text-primary">{ing.grupoNome}</span>
                    <span className="truncate text-sm text-tertiary">{ing.ingresso.nome} · {ing.loteNome}</span>
                </span>
                <ChevronDown className={cx("size-4 shrink-0 text-fg-quaternary transition-transform duration-150", open && "rotate-180")} aria-hidden="true" />
            </button>
            {open && (
                <div className="flex flex-col gap-4 p-4">
                    <IngressoDetalhe ing={ing} />
                    <RespostasLista respostas={ing.respostas} />
                </div>
            )}
        </div>
    );
}

function RespostaValor({ resp }: { resp: RespostaDoParticipante }) {
    const { tipo, linha } = resp;
    if (tipo === "selecao-unica") {
        return <span className="text-sm text-secondary">{linha.opcao}</span>;
    }
    if (tipo === "multipla-selecao") {
        return (
            <div className="flex flex-wrap gap-1.5">
                {(linha.opcoesMultiplas ?? []).map((o) => (
                    <span key={o} className="rounded-md bg-secondary px-2 py-0.5 text-sm text-secondary ring-1 ring-border-secondary">
                        {o}
                    </span>
                ))}
            </div>
        );
    }
    if (tipo === "texto-aberto") {
        return <span className="text-sm text-secondary">“{linha.texto}”</span>;
    }
    return (
        <div className="flex items-center gap-2 rounded-lg bg-secondary/50 py-2 pr-2 pl-3 ring-1 ring-border-secondary">
            <Paperclip className="size-4 shrink-0 text-fg-quaternary" aria-hidden="true" />
            <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium text-primary">{linha.anexo?.arquivo}</span>
                <span className="text-sm text-tertiary">{linha.anexo?.tamanho}</span>
            </div>
            <ButtonUtility size="sm" color="tertiary" icon={Download01} tooltip="Baixar anexo" aria-label="Baixar anexo" />
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Subcomponentes                                                     */
/* ------------------------------------------------------------------ */

/** Label acima, valor abaixo alinhado à esquerda (para textos longos, ex.: nome do ingresso). */
function DetailStacked({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex flex-col gap-1">
            <dt className="text-sm text-tertiary">{label}</dt>
            <dd className="text-sm font-medium break-words text-primary">{value}</dd>
        </div>
    );
}

