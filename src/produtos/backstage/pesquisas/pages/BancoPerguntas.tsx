import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Download01, Edit01, MessageQuestionCircle, Plus, Trash01 } from "@untitledui/icons";
import { toast } from "sonner";
import { EmptyState } from "@/components/application/empty-state/empty-state";
import { TabList, Tabs } from "@/components/application/tabs/tabs";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Select } from "@/components/base/select/select";
import { Toggle } from "@/components/base/toggle/toggle";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { cx } from "@/utils/cx";
import { BackstageLayout } from "../../components/Backstage";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { PerguntaEditorSlideout } from "../components/PerguntaEditorSlideout";
import { SimuladorEstados } from "../components/SimuladorEstados";
import { TIPO_PERGUNTA, usePesquisas, type Pergunta } from "../data/pesquisas-store";

type Aba = "perguntas" | "respostas" | "resumo";

const numberFormatter = new Intl.NumberFormat("pt-BR");

/* ------------------------------------------------------------------ */
/*  Respondentes (mock)                                               */
/* ------------------------------------------------------------------ */

const RESPONDENTES = [
    { nome: "João Silva", email: "joao.silva@gmail.com", data: "10/08 · 21:58", evento: "Bahia x Vitória", sessao: "08/08 · 16h", grupo: "Entrada Geral", ingresso: "Inteira" },
    { nome: "Mariana Lopes", email: "mari.lopes@gmail.com", data: "10/08 · 21:40", evento: "Bahia x Vitória", sessao: "08/08 · 16h", grupo: "Camarote", ingresso: "Inteira" },
    { nome: "Rafael Souza", email: "rafa.souza@hotmail.com", data: "10/08 · 21:12", evento: "Bahia x Vitória", sessao: "08/08 · 16h", grupo: "Pista Premium", ingresso: "Inteira" },
    { nome: "Camila Dias", email: "camila.dias@gmail.com", data: "09/08 · 19:05", evento: "Semana Santa dos Milagres", sessao: "27/12 · 20h", grupo: "Área VIP", ingresso: "Inteira" },
    { nome: "Pedro Henrique", email: "pedro.h@outlook.com", data: "09/08 · 18:30", evento: "Semana Santa dos Milagres", sessao: "27/12 · 20h", grupo: "Entrada Geral", ingresso: "Meia" },
    { nome: "Beatriz Ramos", email: "bia.ramos@gmail.com", data: "09/08 · 18:02", evento: "Semana Santa dos Milagres", sessao: "28/12 · 20h", grupo: "Camarote", ingresso: "Solidária" },
    { nome: "Lucas Andrade", email: "lucas.andrade@gmail.com", data: "08/08 · 23:10", evento: "Bahia x Vitória", sessao: "08/08 · 16h", grupo: "Pista Premium", ingresso: "Meia" },
    { nome: "Fernanda Costa", email: "fer.costa@gmail.com", data: "08/08 · 22:47", evento: "Festival de Verão", sessao: "15/01 · 18h", grupo: "Entrada Geral", ingresso: "Inteira" },
];

/** Distribuição de notas 0–10 (mock proporcional ao total) + média. */
function distribuirNota(total: number) {
    const pesos = [1, 1, 2, 3, 4, 6, 9, 13, 16, 20, 9];
    const soma = pesos.reduce((a, b) => a + b, 0);
    let acc = 0;
    const bars = pesos.map((w, v) => {
        const count = v === 10 ? total - acc : Math.round((w / soma) * total);
        acc += count;
        return { label: String(v), count, pct: total ? Math.round((count / total) * 100) : 0 };
    });
    const somaNotas = bars.reduce((a, b) => a + Number(b.label) * b.count, 0);
    return { bars, media: total ? somaNotas / total : 0 };
}

function cpfMock(i: number) {
    return String(10_000_000_000 + i * 73_939_133)
        .slice(0, 11)
        .replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

/** Resposta de um respondente (índice i) a uma pergunta. `null` = não respondeu. */
function respostaDe(p: Pergunta, r: (typeof RESPONDENTES)[number], i: number, j: number): string | null {
    if (p.respostas === 0) return null;
    if (p.tipo === "multipla-escolha" && (i + j) % 3 === 0) return null;
    if (p.tipo === "selecao-unica") return p.opcoes[(i + j) % p.opcoes.length] ?? "—";
    if (p.tipo === "multipla-escolha") {
        const a = p.opcoes[i % p.opcoes.length];
        const b = p.opcoes[(i + 2) % p.opcoes.length];
        return i % 2 === 0 && b && b !== a ? `${a}, ${b}` : (a ?? "—");
    }
    if (p.tipo === "numero") return String((i * 3 + j * 7) % 11);
    if (p.tipo === "data") return `${String((i % 28) + 1).padStart(2, "0")}/0${(i % 9) + 1}/199${i % 9}`;
    if (p.tipo === "anexo") return "documento.pdf";
    const t = p.titulo.toLowerCase();
    if (t.includes("cpf")) return cpfMock(i);
    if (t.includes("nome")) return r.nome;
    return `Resposta ${i + 1}`;
}

/** Distribuição de respostas por opção (mock proporcional ao total). */
function distribuir(opcoes: string[], total: number) {
    const pesos = opcoes.map((_, idx) => opcoes.length - idx);
    const soma = pesos.reduce((a, b) => a + b, 0) || 1;
    let acc = 0;
    return opcoes.map((opcao, idx) => {
        const count = idx === opcoes.length - 1 ? total - acc : Math.round((pesos[idx] / soma) * total);
        acc += count;
        return { opcao, count, pct: total ? Math.round((count / total) * 100) : 0 };
    });
}

/* ------------------------------------------------------------------ */
/*  Página                                                            */
/* ------------------------------------------------------------------ */

export function BancoPerguntas() {
    const { perguntas, togglePergunta, removePergunta } = usePesquisas();
    const [aba, setAba] = useState<Aba>("perguntas");
    const [editorOpen, setEditorOpen] = useState(false);
    const [editorPergunta, setEditorPergunta] = useState<Pergunta | null>(null);
    const [confirmExcluir, setConfirmExcluir] = useState<Pergunta | null>(null);

    // Simulação de empty states (só protótipo).
    const [sim, setSim] = useState<"normal" | "sem-perguntas" | "sem-respostas">("normal");
    const perguntasSim = sim === "sem-perguntas" ? [] : sim === "sem-respostas" ? perguntas.map((p) => ({ ...p, respostas: 0 })) : perguntas;

    const novaPergunta = () => {
        setEditorPergunta(null);
        setEditorOpen(true);
    };

    const editarPergunta = (p: Pergunta) => {
        setEditorPergunta(p);
        setEditorOpen(true);
    };

    const handleToggle = (p: Pergunta) => {
        togglePergunta(p.id);
        if (p.ativa) {
            toast.success("Pergunta desativada", { description: "Não aparece mais para adicionar aos ingressos." });
        } else {
            toast.success("Pergunta ativada", { description: "Agora pode ser usada nos ingressos." });
        }
    };

    const handleExcluir = (p: Pergunta) => {
        removePergunta(p.id);
        toast.success("Pergunta excluída", { description: `“${p.titulo}” foi removida.` });
    };

    return (
        <BackstageLayout activeProducer="perguntas" showEventContext={false}>
            <div className="flex min-w-0 flex-1 flex-col">
                <main className="flex flex-1 flex-col gap-6 py-6 pb-10 md:px-6">
                    {/* Header */}
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex flex-col gap-1">
                            <h1 className="text-xl font-semibold text-primary">Coleta de dados</h1>
                            <p className="text-sm text-tertiary">Crie perguntas uma vez, reutilize em qualquer evento e acompanhe as respostas.</p>
                        </div>
                        {aba === "perguntas" && perguntasSim.length > 0 && (
                            <Button size="md" color="primary" iconLeading={Plus} onClick={novaPergunta}>
                                Nova pergunta
                            </Button>
                        )}
                    </div>

                    <Tabs selectedKey={aba} onSelectionChange={(v: React.Key) => setAba(v as Aba)}>
                        <TabList
                            type="underline"
                            items={[
                                { id: "perguntas", label: "Perguntas" },
                                { id: "respostas", label: "Respostas" },
                                { id: "resumo", label: "Resumo" },
                            ]}
                        />
                    </Tabs>

                    {aba === "perguntas" && (
                        <AbaPerguntas perguntas={perguntasSim} onNova={novaPergunta} onEditar={editarPergunta} onExcluir={setConfirmExcluir} onToggle={handleToggle} />
                    )}
                    {aba === "respostas" && <AbaRespostas perguntas={perguntasSim} />}
                    {aba === "resumo" && <AbaResumo perguntas={perguntasSim} />}
                </main>
            </div>

            <SimuladorEstados
                value={sim}
                onChange={setSim}
                options={[
                    { id: "normal", label: "Normal (com dados)" },
                    { id: "sem-perguntas", label: "Sem perguntas" },
                    { id: "sem-respostas", label: "Sem respostas" },
                ]}
            />

            <PerguntaEditorSlideout isOpen={editorOpen} onClose={() => setEditorOpen(false)} pergunta={editorPergunta} />

            <ConfirmDialog
                isOpen={confirmExcluir !== null}
                onClose={() => setConfirmExcluir(null)}
                onConfirm={() => confirmExcluir && handleExcluir(confirmExcluir)}
                title="Excluir pergunta?"
                description={<>“{confirmExcluir?.titulo}” será removida do banco e de todos os ingressos. Esta ação não pode ser desfeita.</>}
                confirmLabel="Excluir pergunta"
            />
        </BackstageLayout>
    );
}

/* ------------------------------------------------------------------ */
/*  Aba: Perguntas (gestão)                                           */
/* ------------------------------------------------------------------ */

function AbaPerguntas({
    perguntas,
    onNova,
    onEditar,
    onExcluir,
    onToggle,
}: {
    perguntas: Pergunta[];
    onNova: () => void;
    onEditar: (p: Pergunta) => void;
    onExcluir: (p: Pergunta) => void;
    onToggle: (p: Pergunta) => void;
}) {
    const { countIngressosDaPergunta } = usePesquisas();

    if (perguntas.length === 0) {
        return (
            <div className="flex flex-col items-center gap-4 rounded-xl bg-primary px-6 py-16 text-center ring-1 ring-border-secondary">
                <FeaturedIcon icon={MessageQuestionCircle} color="brand" theme="light" size="lg" />
                <div className="flex flex-col gap-1">
                    <h3 className="text-md font-semibold text-primary">Comece criando uma pergunta</h3>
                    <p className="max-w-xs text-sm text-tertiary">Ela fica salva aqui e você reutiliza em qualquer evento.</p>
                </div>
                <Button size="md" color="primary" iconLeading={Plus} onClick={onNova}>
                    Criar pergunta
                </Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3">
            {perguntas.map((p) => {
                const meta = TIPO_PERGUNTA[p.tipo];
                const emUso = countIngressosDaPergunta(p.id);
                const podeExcluir = p.respostas === 0;
                const detalhe = [
                    meta.label,
                    emUso > 0 ? `em ${emUso} ${emUso === 1 ? "ingresso" : "ingressos"}` : null,
                    p.respostas > 0 ? `${numberFormatter.format(p.respostas)} ${p.respostas === 1 ? "resposta" : "respostas"}` : "sem respostas",
                ]
                    .filter(Boolean)
                    .join(" · ");
                return (
                    <div
                        key={p.id}
                        className="flex items-center gap-4 rounded-xl bg-primary px-4 py-5 ring-1 ring-border-secondary transition duration-100 ease-linear hover:bg-primary_hover"
                    >
                        <FeaturedIcon icon={meta.icon} color="gray" theme="modern" size="md" className="shrink-0" />
                        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                            <span className="truncate text-sm font-medium text-primary">{p.titulo}</span>
                            <span className="truncate text-xs text-tertiary">{detalhe}</span>
                        </div>
                        <div className="flex shrink-0 items-center gap-2.5">
                            <span className="hidden text-sm text-tertiary sm:inline">{p.ativa ? "Ativa" : "Inativa"}</span>
                            <Toggle size="sm" isSelected={p.ativa} onChange={() => onToggle(p)} aria-label={p.ativa ? "Desativar pergunta" : "Ativar pergunta"} />
                            <div className="flex items-center gap-1 sm:pl-1.5">
                                <ButtonUtility size="sm" color="tertiary" icon={Edit01} tooltip="Editar" onClick={() => onEditar(p)} />
                                <ButtonUtility
                                    size="sm"
                                    color="tertiary"
                                    icon={Trash01}
                                    tooltip={podeExcluir ? "Excluir" : "Tem respostas — não dá para excluir"}
                                    isDisabled={!podeExcluir}
                                    onClick={() => onExcluir(p)}
                                />
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Aba: Respostas (grade respondente × pergunta)                     */
/* ------------------------------------------------------------------ */

function FiltroSelect({ label, value, onChange, options }: { label: string; value: string | null; onChange: (v: string | null) => void; options: string[] }) {
    const items = [{ id: "__all", label: `${label}: todos` }, ...options.map((o) => ({ id: o, label: o }))];
    return (
        <Select
            aria-label={label}
            size="sm"
            selectedKey={value ?? "__all"}
            onSelectionChange={(k: React.Key) => onChange(k === "__all" ? null : String(k))}
            items={items}
            className="min-w-[160px]"
        >
            {(item: { id: string; label: string }) => <Select.Item id={item.id}>{item.label}</Select.Item>}
        </Select>
    );
}

function AbaRespostas({ perguntas }: { perguntas: Pergunta[] }) {
    const comResposta = perguntas.filter((p) => p.respostas > 0);

    const [fEvento, setFEvento] = useState<string | null>(null);
    const [perPage, setPerPage] = useState(100);
    const [page, setPage] = useState(1);

    const eventos = useMemo(() => Array.from(new Set(RESPONDENTES.map((r) => r.evento))), []);

    const filtrados = RESPONDENTES.filter((r) => !fEvento || r.evento === fEvento);
    const totalPages = Math.max(1, Math.ceil(filtrados.length / perPage));
    const pagina = Math.min(page, totalPages);
    const pageRows = filtrados.slice((pagina - 1) * perPage, pagina * perPage);

    if (comResposta.length === 0) {
        return (
            <div className="py-12">
                <EmptyState size="sm">
                    <EmptyState.Header>
                        <EmptyState.FeaturedIcon icon={MessageQuestionCircle} color="gray" theme="modern" />
                    </EmptyState.Header>
                    <EmptyState.Content>
                        <EmptyState.Title>Ainda sem respostas</EmptyState.Title>
                        <EmptyState.Description>As respostas aparecem aqui assim que os compradores preencherem os formulários.</EmptyState.Description>
                    </EmptyState.Content>
                </EmptyState>
            </div>
        );
    }

    const exportar = () =>
        toast.success("Exportando .xlsx", {
            description: `${filtrados.length} ${filtrados.length === 1 ? "resposta" : "respostas"} no arquivo.`,
        });

    return (
        <div className="flex flex-col gap-4">
            {/* Filtros + exportar */}
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap gap-2">
                    <FiltroSelect
                        label="Evento"
                        value={fEvento}
                        onChange={(v) => {
                            setFEvento(v);
                            setPage(1);
                        }}
                        options={eventos}
                    />
                </div>
                <Button size="md" color="secondary" iconLeading={Download01} onClick={exportar}>
                    Exportar .xlsx
                </Button>
            </div>

            <section className="overflow-clip rounded-xl bg-primary ring-1 ring-border-secondary">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead className="bg-secondary">
                            <tr className="border-b border-secondary text-left">
                                <th className="sticky left-0 z-10 bg-secondary px-4 py-3 text-xs font-semibold text-tertiary">Respondente</th>
                                <th className="px-4 py-3 text-xs font-semibold whitespace-nowrap text-tertiary">Evento</th>
                                <th className="px-4 py-3 text-xs font-semibold whitespace-nowrap text-tertiary">Sessão</th>
                                <th className="px-4 py-3 text-xs font-semibold whitespace-nowrap text-tertiary">Grupo</th>
                                <th className="px-4 py-3 text-xs font-semibold whitespace-nowrap text-tertiary">Ingresso</th>
                                <th className="px-4 py-3 text-xs font-semibold whitespace-nowrap text-tertiary">Data</th>
                                {comResposta.map((p) => {
                                    const meta = TIPO_PERGUNTA[p.tipo];
                                    return (
                                        <th key={p.id} className="px-4 py-3 text-xs font-semibold text-tertiary">
                                            <span className="flex items-center gap-1.5">
                                                <meta.icon className="size-3.5 shrink-0 text-fg-quaternary" />
                                                <span className="line-clamp-1 max-w-[160px]">{p.titulo}</span>
                                            </span>
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>
                        <tbody>
                            {pageRows.length === 0 ? (
                                <tr>
                                    <td colSpan={6 + comResposta.length} className="px-4 py-12 text-center text-sm text-tertiary">
                                        Nenhuma resposta para este evento.
                                    </td>
                                </tr>
                            ) : (
                                pageRows.map((r, i) => (
                                    <tr
                                        key={r.email}
                                        className={cx("transition duration-100 ease-linear hover:bg-primary_hover", i !== pageRows.length - 1 && "border-b border-secondary")}
                                    >
                                        <td className="sticky left-0 z-10 bg-primary px-4 py-3.5">
                                            <div className="flex min-w-0 flex-col">
                                                <span className="truncate text-sm font-medium text-primary">{r.nome}</span>
                                                <span className="truncate text-xs text-tertiary">{r.email}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5 text-sm whitespace-nowrap text-secondary">{r.evento}</td>
                                        <td className="px-4 py-3.5 text-sm whitespace-nowrap text-tertiary tabular-nums">{r.sessao}</td>
                                        <td className="px-4 py-3.5 text-sm whitespace-nowrap text-secondary">{r.grupo}</td>
                                        <td className="px-4 py-3.5 text-sm whitespace-nowrap text-secondary">{r.ingresso}</td>
                                        <td className="px-4 py-3.5 text-sm whitespace-nowrap text-tertiary tabular-nums">{r.data}</td>
                                        {comResposta.map((p, j) => {
                                            const valor = respostaDe(p, r, i, j);
                                            return (
                                                <td key={p.id} className="px-4 py-3.5 text-sm whitespace-nowrap">
                                                    {valor === null ? <span className="text-quaternary">—</span> : <span className="text-secondary">{valor}</span>}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Paginação */}
                <div className="flex flex-col gap-3 border-t border-secondary px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2 text-sm text-tertiary">
                        <span>Linhas por página</span>
                        <Select
                            aria-label="Linhas por página"
                            size="sm"
                            selectedKey={String(perPage)}
                            onSelectionChange={(k: React.Key) => {
                                setPerPage(Number(k));
                                setPage(1);
                            }}
                            items={[
                                { id: "25", label: "25" },
                                { id: "50", label: "50" },
                                { id: "100", label: "100" },
                            ]}
                            className="w-24"
                        >
                            {(item: { id: string; label: string }) => <Select.Item id={item.id}>{item.label}</Select.Item>}
                        </Select>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-tertiary">
                        <span className="tabular-nums">
                            Página {pagina} de {totalPages}
                        </span>
                        <div className="flex gap-1">
                            <ButtonUtility size="sm" color="secondary" icon={ChevronLeft} tooltip="Anterior" isDisabled={pagina <= 1} onClick={() => setPage(pagina - 1)} />
                            <ButtonUtility size="sm" color="secondary" icon={ChevronRight} tooltip="Próxima" isDisabled={pagina >= totalPages} onClick={() => setPage(pagina + 1)} />
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Aba: Resumo (gráfico)                                             */
/* ------------------------------------------------------------------ */

function BarChartVert({ bars }: { bars: { label: string; count: number; pct: number }[] }) {
    const max = Math.max(1, ...bars.map((b) => b.count));
    return (
        <div className="flex items-end gap-1.5 sm:gap-2.5">
            {bars.map((b) => (
                <div key={b.label} className="flex flex-1 flex-col items-center gap-2">
                    <div className="flex flex-col items-center leading-tight">
                        <span className="text-xs font-semibold text-primary tabular-nums">{b.pct}%</span>
                        <span className="text-[11px] text-tertiary tabular-nums">{b.count}</span>
                    </div>
                    <div className="flex h-32 w-full items-end overflow-hidden rounded-md bg-secondary">
                        <div className="w-full rounded-md bg-brand-solid transition-[height] duration-500" style={{ height: `${(b.count / max) * 100}%` }} />
                    </div>
                    <span className="truncate text-xs text-tertiary tabular-nums">{b.label}</span>
                </div>
            ))}
        </div>
    );
}

function AbaResumo({ perguntas }: { perguntas: Pergunta[] }) {
    const comResposta = perguntas.filter((p) => p.respostas > 0);

    const [fEvento, setFEvento] = useState<string | null>(null);
    const eventos = useMemo(() => Array.from(new Set(RESPONDENTES.map((r) => r.evento))), []);
    const ratio = fEvento ? RESPONDENTES.filter((r) => r.evento === fEvento).length / RESPONDENTES.length : 1;
    const respDe = (p: Pergunta) => Math.round(p.respostas * ratio);
    const amostras = (fEvento ? RESPONDENTES.filter((r) => r.evento === fEvento) : RESPONDENTES).slice(0, 3);

    if (comResposta.length === 0) {
        return (
            <div className="rounded-xl bg-secondary px-6 py-16">
                <EmptyState size="sm">
                    <EmptyState.Header>
                        <EmptyState.FeaturedIcon icon={MessageQuestionCircle} color="gray" theme="modern" />
                    </EmptyState.Header>
                    <EmptyState.Content>
                        <EmptyState.Title>Sem dados para resumir</EmptyState.Title>
                        <EmptyState.Description>O resumo aparece quando as primeiras respostas chegarem.</EmptyState.Description>
                    </EmptyState.Content>
                </EmptyState>
            </div>
        );
    }

    const totalRespostas = Math.max(0, ...comResposta.map((p) => respDe(p)));

    return (
        <div className="rounded-xl px-0 py-0 sm:px-0 sm:py-0">
            <div className="mx-auto flex max-w-3xl flex-col gap-4">
                <div className="flex items-center justify-between gap-3">
                    <FiltroSelect label="Evento" value={fEvento} onChange={setFEvento} options={eventos} />
                    <Button
                        size="md"
                        color="secondary"
                        iconLeading={Download01}
                        onClick={() => toast.success("Exportando relatório em PDF", { description: "O resumo será salvo como imagem." })}
                    >
                        Exportar PDF
                    </Button>
                </div>

                <div className="overflow-clip rounded-2xl bg-primary ring-1 ring-border-secondary">
                    <div className="px-6 pt-8 pb-6 sm:px-10">
                        <h2 className="text-xl font-semibold text-primary">Resumo das respostas</h2>
                        <p className="mt-1 text-sm text-tertiary">{numberFormatter.format(totalRespostas)} respostas no total</p>
                    </div>

                    {comResposta.map((p) => {
                        const meta = TIPO_PERGUNTA[p.tipo];
                        const respostas = respDe(p);
                        const isNota = p.tipo === "numero";
                        const isEscolha = TIPO_PERGUNTA[p.tipo].temOpcoes;
                        const nota = isNota ? distribuirNota(respostas) : null;
                        const escolha = isEscolha ? distribuir(p.opcoes, respostas).map((r) => ({ label: r.opcao, count: r.count, pct: r.pct })) : null;
                        return (
                            <div key={p.id} className="border-t border-secondary px-6 py-8 sm:px-10">
                                <div className="flex items-start gap-3">
                                    <FeaturedIcon icon={meta.icon} color="gray" theme="modern" size="sm" className="mt-0.5 shrink-0" />
                                    <div className="flex flex-col gap-1">
                                        <h3 className="text-lg font-semibold text-primary">{p.titulo}</h3>
                                        <p className="text-sm text-tertiary">
                                            <span className="font-medium text-secondary tabular-nums">{respostas}</span> de {totalRespostas} responderam
                                        </p>
                                    </div>
                                </div>

                                {isNota && nota && (
                                    <div className="mt-6 flex flex-col gap-5">
                                        <p className="text-md font-semibold text-primary tabular-nums">
                                            {nota.media.toFixed(1).replace(".", ",")} <span className="font-normal text-tertiary">de nota média</span>
                                        </p>
                                        <BarChartVert bars={nota.bars} />
                                    </div>
                                )}

                                {isEscolha && escolha && (
                                    <div className="mt-6">
                                        <BarChartVert bars={escolha} />
                                    </div>
                                )}

                                {!isNota && !isEscolha && (
                                    <div className="mt-5 flex flex-col">
                                        {amostras.map((r, i) => {
                                            const valor = respostaDe(p, r, i, 0);
                                            return (
                                                <div key={r.email} className="flex items-baseline justify-between gap-4 border-b border-secondary py-3">
                                                    <span className="truncate text-sm text-primary">{valor ?? "—"}</span>
                                                    <span className="shrink-0 text-xs text-tertiary tabular-nums">{r.data}</span>
                                                </div>
                                            );
                                        })}
                                        <Button size="sm" color="link-color" className="mt-3 self-start">
                                            Ver todas na aba Respostas
                                        </Button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
