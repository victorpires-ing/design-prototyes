import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, MessageTextSquare02, Paperclip, SearchLg } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { cx } from "@/utils/cx";
import { BackstageLayout } from "../../components/Backstage";
import { ExportMenu, RelatorioPageHeader } from "../components/RelatorioPageHeader";
import { RelatorioFiltersProvider } from "../components/relatorio-filters";
import { EVENT, numberFormatter, percentFormatter } from "../data/event";
import { QUESTIONARIO, TIPO_RESPOSTA, type QuestionarioPergunta, type RespostaLinha } from "../data/questionarios";

const pct = (n: number) => percentFormatter.format(n);
const num = (n: number) => numberFormatter.format(n);
const POR_PAGINA = 8;

export function Questionarios() {
    return (
        <BackstageLayout activeSection="relatorios" activeItem="relatorio-questionarios">
            <RelatorioFiltersProvider sessoes={EVENT.sessoes}>
                <div className="flex min-w-0 flex-1 flex-col">
                    <main className="flex flex-1 flex-col gap-6 py-6 pb-10 md:px-6">
                        <RelatorioPageHeader title="Questionários" actions={<ExportMenu />} />
                        <QuestionariosBody />
                    </main>
                </div>
            </RelatorioFiltersProvider>
        </BackstageLayout>
    );
}

const QuestionariosBody = () => {
    const resumo = useMemo(() => {
        const totalPerguntas = QUESTIONARIO.length;
        const totalRespostas = QUESTIONARIO.reduce((acc, q) => acc + q.respondidas, 0);
        return { totalPerguntas, totalRespostas, participantes: 100 };
    }, []);

    return (
        <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <MetricCard label="Perguntas no questionário" valor={num(resumo.totalPerguntas)} />
                <MetricCard label="Participantes" valor={num(resumo.participantes)} />
                <MetricCard label="Respostas coletadas" valor={num(resumo.totalRespostas)} />
            </div>

            <div className="flex flex-col gap-4">
                {QUESTIONARIO.map((q) => (
                    <PerguntaCard key={q.id} pergunta={q} />
                ))}
            </div>
        </div>
    );
};

/* ------------------------------------------------------------------ */
/*  Card de pergunta                                                   */
/* ------------------------------------------------------------------ */

function PerguntaCard({ pergunta }: { pergunta: QuestionarioPergunta }) {
    const meta = TIPO_RESPOSTA[pergunta.tipo];

    return (
        <section className="flex flex-col gap-5 rounded-2xl bg-primary p-5 ring-1 ring-border-secondary md:p-6">
            <header className="flex min-w-0 items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-secondary text-fg-brand-primary">
                    <meta.icon className="size-5" aria-hidden="true" />
                </span>
                <div className="flex min-w-0 flex-col gap-1">
                    <h2 className="text-md font-semibold text-primary">{pergunta.titulo}</h2>
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge size="sm" type="pill-color" color="gray">
                            {meta.label}
                        </Badge>
                        <Badge size="sm" type="pill-color" color={pergunta.obrigatoria ? "brand" : "gray"}>
                            {pergunta.obrigatoria ? "Obrigatória" : "Opcional"}
                        </Badge>
                        <span className="text-sm text-tertiary">{num(pergunta.respondidas)} respostas</span>
                    </div>
                </div>
            </header>

            {(pergunta.tipo === "selecao-unica" || pergunta.tipo === "multipla-selecao") && <OpcoesDistribuicao pergunta={pergunta} />}

            <RespostasTabela pergunta={pergunta} />
        </section>
    );
}

/* ------------------------------------------------------------------ */
/*  Distribuição das opções (seleção única / múltipla)                 */
/* ------------------------------------------------------------------ */

function OpcoesDistribuicao({ pergunta }: { pergunta: QuestionarioPergunta }) {
    const opcoes = pergunta.opcoes ?? [];
    const maxRespostas = Math.max(...opcoes.map((o) => o.respostas), 1);
    const multipla = pergunta.tipo === "multipla-selecao";

    return (
        <div className="flex flex-col gap-3">
            {multipla && (
                <p className="flex items-center gap-1.5 text-sm text-tertiary">
                    <MessageTextSquare02 className="size-4 text-fg-quaternary" aria-hidden="true" />
                    Cada participante pode escolher mais de uma opção.
                </p>
            )}
            {opcoes.map((op) => {
                const fracao = op.respostas / pergunta.respondidas;
                const larguraBarra = (op.respostas / maxRespostas) * 100;
                const destaque = op.respostas === maxRespostas;
                return (
                    <div key={op.label} className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between gap-4">
                            <span className="min-w-0 truncate text-sm font-medium text-secondary">{op.label}</span>
                            <span className="shrink-0 text-sm text-tertiary">
                                <span className="font-semibold text-primary">{num(op.respostas)}</span> · {pct(fracao)}
                            </span>
                        </div>
                        <div className="h-2.5 w-full overflow-hidden rounded-full bg-quaternary">
                            <div
                                className={cx("h-full rounded-full transition-all duration-300 ease-linear", destaque ? "bg-brand-solid" : "bg-brand-secondary")}
                                style={{ width: `${larguraBarra}%` }}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Tabela de respostas — busca (nome/e-mail/documento) + paginação    */
/* ------------------------------------------------------------------ */

function RespostasTabela({ pergunta }: { pergunta: QuestionarioPergunta }) {
    const [busca, setBusca] = useState("");
    const [pagina, setPagina] = useState(1);

    const filtradas = useMemo(() => {
        const termo = busca.trim().toLowerCase();
        if (!termo) return pergunta.respostas;
        return pergunta.respostas.filter((l) => {
            const r = l.respondente;
            return r.nome.toLowerCase().includes(termo) || r.email.toLowerCase().includes(termo) || r.documento.toLowerCase().includes(termo);
        });
    }, [busca, pergunta.respostas]);

    const totalPaginas = Math.max(1, Math.ceil(filtradas.length / POR_PAGINA));
    useEffect(() => {
        if (pagina > totalPaginas) setPagina(1);
    }, [pagina, totalPaginas]);

    const inicio = (pagina - 1) * POR_PAGINA;
    const visiveis = filtradas.slice(inicio, inicio + POR_PAGINA);
    const respostaHeader = pergunta.tipo === "anexar-arquivo" ? "Arquivo" : pergunta.tipo === "texto-aberto" ? "Resposta" : "Escolha";

    return (
        <div className="flex flex-col gap-3">
            <div className="w-full sm:max-w-xs">
                <Input
                    icon={SearchLg}
                    size="sm"
                    aria-label="Buscar respondente"
                    placeholder="Buscar por nome, e-mail ou documento"
                    value={busca}
                    onChange={(v) => {
                        setBusca(v);
                        setPagina(1);
                    }}
                />
            </div>

            <div className="overflow-hidden rounded-xl ring-1 ring-border-secondary">
                {/* Cabeçalho (desktop) */}
                <div className="hidden grid-cols-[minmax(0,1.6fr)_128px_160px_minmax(0,1.4fr)] gap-4 border-b border-secondary bg-secondary px-4 py-2.5 md:grid">
                    <ColHead>Respondente</ColHead>
                    <ColHead>Nascimento</ColHead>
                    <ColHead>Documento</ColHead>
                    <ColHead>{respostaHeader}</ColHead>
                </div>

                {visiveis.length === 0 ? (
                    <div className="px-4 py-10 text-center text-sm text-tertiary">Nenhum respondente encontrado para essa busca.</div>
                ) : (
                    visiveis.map((linha, i) => (
                        <div
                            key={linha.respondente.id + i}
                            className="flex flex-col gap-2 border-b border-secondary px-4 py-3 last:border-b-0 md:grid md:grid-cols-[minmax(0,1.6fr)_128px_160px_minmax(0,1.4fr)] md:items-center md:gap-4"
                        >
                            <div className="flex min-w-0 flex-col">
                                <span className="truncate text-sm font-medium text-primary">{linha.respondente.nome}</span>
                                <span className="truncate text-sm text-tertiary">{linha.respondente.email}</span>
                            </div>
                            <div className="text-sm text-secondary">
                                <span className="text-tertiary md:hidden">Nascimento: </span>
                                {linha.respondente.nascimento}
                            </div>
                            <div className="text-sm text-secondary">
                                <span className="text-tertiary md:hidden">Documento: </span>
                                {linha.respondente.documento}
                            </div>
                            <div className="min-w-0">
                                <span className="text-tertiary md:hidden">{respostaHeader}: </span>
                                <RespostaCelula linha={linha} tipo={pergunta.tipo} />
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Paginação */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm text-tertiary">
                    {filtradas.length === 0
                        ? "0 resultados"
                        : `Mostrando ${num(inicio + 1)}–${num(Math.min(inicio + POR_PAGINA, filtradas.length))} de ${num(filtradas.length)}`}
                </span>
                <div className="flex items-center gap-2">
                    <Button size="sm" color="secondary" iconLeading={ArrowLeft} isDisabled={pagina <= 1} onClick={() => setPagina((p) => Math.max(1, p - 1))}>
                        Anterior
                    </Button>
                    <span className="px-1 text-sm text-tertiary">
                        Página {num(pagina)} de {num(totalPaginas)}
                    </span>
                    <Button size="sm" color="secondary" iconTrailing={ArrowRight} isDisabled={pagina >= totalPaginas} onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}>
                        Próxima
                    </Button>
                </div>
            </div>
        </div>
    );
}

function RespostaCelula({ linha, tipo }: { linha: RespostaLinha; tipo: QuestionarioPergunta["tipo"] }) {
    if (tipo === "selecao-unica") {
        return <span className="text-sm font-medium text-secondary">{linha.opcao}</span>;
    }
    if (tipo === "multipla-selecao") {
        return (
            <div className="flex flex-wrap gap-1">
                {(linha.opcoesMultiplas ?? []).map((o) => (
                    <span key={o} className="rounded-md bg-secondary px-2 py-0.5 text-sm text-secondary">
                        {o}
                    </span>
                ))}
            </div>
        );
    }
    if (tipo === "texto-aberto") {
        return <span className="line-clamp-2 text-sm text-secondary">“{linha.texto}”</span>;
    }
    return (
        <span className="inline-flex items-center gap-2 text-sm">
            <Paperclip className="size-4 shrink-0 text-fg-quaternary" aria-hidden="true" />
            <span className="min-w-0 truncate font-medium text-brand-secondary">{linha.anexo?.arquivo}</span>
            <span className="shrink-0 text-tertiary">{linha.anexo?.tamanho}</span>
        </span>
    );
}

/* ------------------------------------------------------------------ */
/*  Subcomponentes                                                     */
/* ------------------------------------------------------------------ */

function ColHead({ children }: { children: React.ReactNode }) {
    return <span className="text-sm font-medium text-tertiary">{children}</span>;
}

function MetricCard({ label, valor }: { label: string; valor: string }) {
    return (
        <div className="flex flex-col gap-1.5 rounded-2xl bg-primary p-5 ring-1 ring-border-secondary">
            <span className="text-sm text-tertiary">{label}</span>
            <span className="text-display-sm font-bold text-primary">{valor}</span>
        </div>
    );
}
