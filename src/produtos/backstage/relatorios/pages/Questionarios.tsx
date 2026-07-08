import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronRight, Download01, Paperclip, SearchLg, Users01, XClose } from "@untitledui/icons";
import { Dialog as AriaDialog, Modal as AriaModal, ModalOverlay as AriaModalOverlay } from "react-aria-components";
import { Avatar } from "@/components/base/avatar/avatar";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Input } from "@/components/base/input/input";
import { MetricsIcon03 } from "@/components/application/metrics/metrics";
import { PaginationCardAdvanced } from "@/components/application/pagination/pagination";
import { cx } from "@/utils/cx";
import { BackstageLayout } from "../../components/Backstage";
import { ExportMenu, RelatorioPageHeader } from "../components/RelatorioPageHeader";
import { RelatorioFiltersProvider } from "../components/relatorio-filters";
import { EVENT, numberFormatter } from "../data/event";
import { COMBOS } from "../data/produtos";
import { PARTICIPANTES, QUESTIONARIO, TIPO_RESPOSTA, TOTAL_PERGUNTAS, type ParticipanteRespostas, type RespostaDoParticipante } from "../data/questionarios";

const num = (n: number) => numberFormatter.format(n);
const PAGE_SIZE_INICIAL = 10;

/** Combo do participante (derivado de forma estável do documento). */
const hashStr = (s: string) => {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return Math.abs(h);
};
interface IngressoParticipante {
    combo: (typeof COMBOS)[number];
    respostas: RespostaDoParticipante[];
}

/** Ingressos do participante (1..N). ~1/3 dos participantes têm mais de um. */
const ingressosDoParticipante = (p: ParticipanteRespostas): IngressoParticipante[] => {
    const h = hashStr(p.respondente.documento);
    const qtd = h % 3 === 0 ? 2 : 1;
    return Array.from({ length: qtd }, (_, i) => ({ combo: COMBOS[(h + i) % COMBOS.length], respostas: p.respostas }));
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
    const topRef = useRef<HTMLDivElement>(null);

    const resumo = useMemo(
        () => ({
            perguntas: TOTAL_PERGUNTAS,
            participantes: PARTICIPANTES.length,
            respostas: PARTICIPANTES.reduce((acc, p) => acc + p.respostas.length, 0),
        }),
        [],
    );

    const filtrados = useMemo(() => {
        const termo = busca.trim().toLowerCase();
        if (!termo) return PARTICIPANTES;
        return PARTICIPANTES.filter((p) => {
            const r = p.respondente;
            return r.nome.toLowerCase().includes(termo) || r.email.toLowerCase().includes(termo) || r.documento.toLowerCase().includes(termo);
        });
    }, [busca]);

    const totalPages = Math.max(1, Math.ceil(filtrados.length / pageSize));
    const safePage = Math.min(page, totalPages);
    const visiveis = useMemo(() => filtrados.slice((safePage - 1) * pageSize, safePage * pageSize), [filtrados, safePage, pageSize]);

    useEffect(() => setPage(1), [busca]);

    const irParaTopo = () => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

    return (
        <div ref={topRef} className="flex scroll-mt-6 flex-col gap-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <MetricsIcon03 icon={Users01} title={num(resumo.participantes)} subtitle="Participantes" change={null} changeTrend="positive" actions={false} className="[&_p+div]:hidden" />
            </div>

            <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="text-md font-semibold text-primary">Participantes</h3>
                    <div className="w-full sm:w-80">
                        <Input icon={SearchLg} size="sm" aria-label="Buscar participante" placeholder="Buscar por nome, e-mail ou documento" value={busca} onChange={setBusca} />
                    </div>
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
                                onClick={() => setSelecionado(p)}
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
            </div>

            <RespostasSlideOut isOpen={selecionado !== null} participante={selecionado} onClose={() => setSelecionado(null)} />
        </div>
    );
};

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

function RespostasSlideOut({ isOpen, participante, onClose }: { isOpen: boolean; participante: ParticipanteRespostas | null; onClose: () => void }) {
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
                                    const ingressos = ingressosDoParticipante(participante);
                                    if (ingressos.length === 1) {
                                        const ing = ingressos[0];
                                        return (
                                            <>
                                                <div className="flex flex-col gap-3 px-6 pt-5 pb-4">
                                                    <h3 className="text-md font-semibold text-primary">Ingresso</h3>
                                                    <IngressoCombo combo={ing.combo} />
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
                                        <div className="flex flex-col gap-3 px-6 pt-5 pb-6">
                                            <h3 className="text-md font-semibold text-primary">Ingressos ({num(ingressos.length)})</h3>
                                            {ingressos.map((ing, i) => (
                                                <IngressoAccordion key={i} combo={ing.combo} respostas={ing.respostas} />
                                            ))}
                                        </div>
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

/** Dados do combo (grupo/nome/lote) empilhados. */
function IngressoCombo({ combo }: { combo: (typeof COMBOS)[number] }) {
    return (
        <dl className="flex flex-col gap-3">
            <DetailStacked label="Grupo do ingresso" value={combo.grupo} />
            <DetailStacked label="Nome do ingresso" value={combo.nome} />
            <DetailStacked label="Lote" value="Lote único" />
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

/** Ingresso como accordion: cabeçalho com o combo, corpo com as respostas. */
function IngressoAccordion({ combo, respostas, defaultOpen }: { combo: (typeof COMBOS)[number]; respostas: RespostaDoParticipante[]; defaultOpen?: boolean }) {
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
                    <span className="truncate text-sm font-semibold text-primary">{combo.nome}</span>
                    <span className="truncate text-sm text-tertiary">{combo.grupo} · Lote único</span>
                </span>
                <ChevronDown className={cx("size-4 shrink-0 text-fg-quaternary transition-transform duration-150", open && "rotate-180")} aria-hidden="true" />
            </button>
            {open && (
                <div className="flex flex-col gap-4 p-4">
                    <IngressoCombo combo={combo} />
                    <RespostasLista respostas={respostas} />
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

