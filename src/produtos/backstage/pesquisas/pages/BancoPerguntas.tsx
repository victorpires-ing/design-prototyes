import { useState } from "react";
import { Edit01, MessageQuestionCircle, Plus, Trash01 } from "@untitledui/icons";
import { toast } from "sonner";
import { TabList, Tabs } from "@/components/application/tabs/tabs";
import { BadgeWithIcon } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Toggle } from "@/components/base/toggle/toggle";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { cx } from "@/utils/cx";
import { BackstageLayout } from "../../components/Backstage";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { PerguntaEditorSlideout } from "../components/PerguntaEditorSlideout";
import { TIPO_PERGUNTA, usePesquisas, type Pergunta } from "../data/pesquisas-store";

type Aba = "perguntas" | "respostas" | "resumo";

const numberFormatter = new Intl.NumberFormat("pt-BR");

/* ------------------------------------------------------------------ */
/*  Respondentes (mock)                                               */
/* ------------------------------------------------------------------ */

const RESPONDENTES = [
    { nome: "João Silva", email: "joao.silva@gmail.com", data: "10/08 · 21:58", ingresso: "Pista · Entrada Geral" },
    { nome: "Mariana Lopes", email: "mari.lopes@gmail.com", data: "10/08 · 21:40", ingresso: "Camarote · Inteira" },
    { nome: "Rafael Souza", email: "rafa.souza@hotmail.com", data: "10/08 · 21:12", ingresso: "Pista Premium · Inteira" },
    { nome: "Camila Dias", email: "camila.dias@gmail.com", data: "09/08 · 19:05", ingresso: "Área VIP · Inteira" },
    { nome: "Pedro Henrique", email: "pedro.h@outlook.com", data: "09/08 · 18:30", ingresso: "Entrada Geral · Meia" },
    { nome: "Beatriz Ramos", email: "bia.ramos@gmail.com", data: "09/08 · 18:02", ingresso: "Camarote · Solidária" },
];

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
    if (p.tipo === "numero") return String(18 + ((i * 7) % 47));
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
                            <h1 className="text-xl font-semibold text-primary">Questionários</h1>
                            <p className="text-sm text-tertiary">Perguntas que você reutiliza nos eventos e o que os compradores responderam.</p>
                        </div>
                        {aba === "perguntas" && perguntas.length > 0 && (
                            <Button size="md" color="primary" iconLeading={Plus} onClick={novaPergunta}>
                                Nova pergunta
                            </Button>
                        )}
                    </div>

                    <Tabs selectedKey={aba} onSelectionChange={(v: React.Key) => setAba(v as Aba)}>
                        <TabList
                            type="button-minimal"
                            className="self-start"
                            items={[
                                { id: "perguntas", label: "Perguntas" },
                                { id: "respostas", label: "Respostas" },
                                { id: "resumo", label: "Resumo" },
                            ]}
                        />
                    </Tabs>

                    {aba === "perguntas" && <AbaPerguntas onNova={novaPergunta} onEditar={editarPergunta} onExcluir={setConfirmExcluir} onToggle={handleToggle} />}
                    {aba === "respostas" && <AbaRespostas />}
                    {aba === "resumo" && <AbaResumo />}
                </main>
            </div>

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
    onNova,
    onEditar,
    onExcluir,
    onToggle,
}: {
    onNova: () => void;
    onEditar: (p: Pergunta) => void;
    onExcluir: (p: Pergunta) => void;
    onToggle: (p: Pergunta) => void;
}) {
    const { perguntas, countIngressosDaPergunta } = usePesquisas();

    if (perguntas.length === 0) {
        return (
            <div className="flex flex-col items-center gap-4 rounded-xl bg-primary px-6 py-16 text-center ring-1 ring-border-secondary">
                <FeaturedIcon icon={MessageQuestionCircle} color="brand" theme="light" size="lg" />
                <div className="flex flex-col gap-1">
                    <h3 className="text-md font-semibold text-primary">Nenhuma pergunta ainda</h3>
                    <p className="max-w-xs text-sm text-tertiary">Crie uma pergunta para usar nos seus eventos.</p>
                </div>
                <Button size="md" color="primary" iconLeading={Plus} onClick={onNova}>
                    Criar pergunta
                </Button>
            </div>
        );
    }

    return (
        <section className="overflow-clip rounded-xl bg-primary ring-1 ring-border-secondary">
            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead className="bg-secondary">
                        <tr className="border-b border-secondary text-left">
                            <th className="px-4 py-3 text-xs font-semibold text-tertiary">Pergunta</th>
                            <th className="hidden px-4 py-3 text-right text-xs font-semibold text-tertiary md:table-cell">Em uso</th>
                            <th className="hidden px-4 py-3 text-right text-xs font-semibold text-tertiary md:table-cell">Respostas</th>
                            <th className="px-4 py-3 text-xs font-semibold text-tertiary">Status</th>
                            <th className="px-4 py-3" aria-hidden="true" />
                        </tr>
                    </thead>
                    <tbody>
                        {perguntas.map((p, i) => {
                            const meta = TIPO_PERGUNTA[p.tipo];
                            const emUso = countIngressosDaPergunta(p.id);
                            const podeExcluir = p.respostas === 0;
                            const isLast = i === perguntas.length - 1;
                            return (
                                <tr key={p.id} className={cx("transition duration-100 ease-linear hover:bg-primary_hover", !isLast && "border-b border-secondary")}>
                                    <td className="px-4 py-3.5">
                                        <div className="flex flex-col gap-1.5">
                                            <span className="text-sm font-medium text-primary">{p.titulo}</span>
                                            <BadgeWithIcon size="sm" color="gray" type="modern" iconLeading={meta.icon} className="w-fit">
                                                {meta.label}
                                            </BadgeWithIcon>
                                        </div>
                                    </td>
                                    <td className="hidden px-4 py-3.5 text-right text-sm text-tertiary tabular-nums md:table-cell">
                                        {emUso > 0 ? `${emUso} ${emUso === 1 ? "ingresso" : "ingressos"}` : "—"}
                                    </td>
                                    <td className="hidden px-4 py-3.5 text-right text-sm text-tertiary tabular-nums md:table-cell">
                                        {p.respostas > 0 ? numberFormatter.format(p.respostas) : "—"}
                                    </td>
                                    <td className="px-4 py-3.5">
                                        <Toggle size="sm" isSelected={p.ativa} onChange={() => onToggle(p)} aria-label={p.ativa ? "Desativar pergunta" : "Ativar pergunta"} />
                                    </td>
                                    <td className="px-4 py-3.5">
                                        <div className="flex items-center justify-end gap-1">
                                            <ButtonUtility size="sm" color="tertiary" icon={Edit01} tooltip="Editar" onClick={() => onEditar(p)} />
                                            <ButtonUtility
                                                size="sm"
                                                color="tertiary"
                                                icon={Trash01}
                                                tooltip={podeExcluir ? "Excluir" : "Não dá para excluir: já tem respostas"}
                                                isDisabled={!podeExcluir}
                                                onClick={() => onExcluir(p)}
                                            />
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

/* ------------------------------------------------------------------ */
/*  Aba: Respostas (grade respondente × pergunta)                     */
/* ------------------------------------------------------------------ */

function AbaRespostas() {
    const { perguntas } = usePesquisas();
    const comResposta = perguntas.filter((p) => p.respostas > 0);

    if (comResposta.length === 0) {
        return (
            <div className="rounded-xl bg-primary px-6 py-16 text-center text-sm text-tertiary ring-1 ring-border-secondary">Ainda sem respostas.</div>
        );
    }

    return (
        <section className="overflow-clip rounded-xl bg-primary ring-1 ring-border-secondary">
            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead className="bg-secondary">
                        <tr className="border-b border-secondary text-left">
                            <th className="sticky left-0 z-10 bg-secondary px-4 py-3 text-xs font-semibold text-tertiary">Respondente</th>
                            <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold text-tertiary">Data</th>
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
                        {RESPONDENTES.map((r, i) => (
                            <tr key={r.email} className={cx("transition duration-100 ease-linear hover:bg-primary_hover", i !== RESPONDENTES.length - 1 && "border-b border-secondary")}>
                                <td className="sticky left-0 z-10 bg-primary px-4 py-3.5">
                                    <div className="flex min-w-0 flex-col">
                                        <span className="truncate text-sm font-medium text-primary">{r.nome}</span>
                                        <span className="truncate text-xs text-tertiary">{r.email}</span>
                                    </div>
                                </td>
                                <td className="whitespace-nowrap px-4 py-3.5 text-sm text-tertiary tabular-nums">{r.data}</td>
                                {comResposta.map((p, j) => {
                                    const valor = respostaDe(p, r, i, j);
                                    return (
                                        <td key={p.id} className="px-4 py-3.5 text-sm whitespace-nowrap">
                                            {valor === null ? <span className="text-quaternary">—</span> : <span className="text-secondary">{valor}</span>}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

/* ------------------------------------------------------------------ */
/*  Aba: Resumo (gráfico)                                             */
/* ------------------------------------------------------------------ */

function AbaResumo() {
    const { perguntas } = usePesquisas();
    const comResposta = perguntas.filter((p) => p.respostas > 0);

    if (comResposta.length === 0) {
        return <div className="rounded-xl bg-primary px-6 py-16 text-center text-sm text-tertiary ring-1 ring-border-secondary">Ainda sem respostas para resumir.</div>;
    }

    return (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {comResposta.map((p) => {
                const meta = TIPO_PERGUNTA[p.tipo];
                const temOpcoes = TIPO_PERGUNTA[p.tipo].temOpcoes;
                const resumo = temOpcoes ? distribuir(p.opcoes, p.respostas) : [];
                return (
                    <section key={p.id} className="flex flex-col gap-4 rounded-xl bg-primary p-5 ring-1 ring-border-secondary">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex min-w-0 flex-col gap-1">
                                <span className="text-sm font-semibold text-primary">{p.titulo}</span>
                                <BadgeWithIcon size="sm" color="gray" type="modern" iconLeading={meta.icon} className="w-fit">
                                    {meta.label}
                                </BadgeWithIcon>
                            </div>
                            <span className="shrink-0 text-sm text-tertiary tabular-nums">{numberFormatter.format(p.respostas)} respostas</span>
                        </div>

                        {resumo.length > 0 ? (
                            <ul className="flex flex-col gap-3">
                                {resumo.map((rr) => (
                                    <li key={rr.opcao} className="flex flex-col gap-1.5">
                                        <div className="flex items-baseline justify-between gap-3">
                                            <span className="truncate text-sm text-primary">{rr.opcao}</span>
                                            <span className="shrink-0 text-sm text-tertiary tabular-nums">{rr.pct}%</span>
                                        </div>
                                        <div className="relative h-2 w-full overflow-hidden rounded-full bg-quaternary">
                                            <div className="h-full rounded-full bg-brand-solid transition-[width] duration-500" style={{ width: `${rr.pct}%` }} />
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-tertiary">Respostas abertas — confira na aba Respostas.</p>
                        )}
                    </section>
                );
            })}
        </div>
    );
}
