import { Fragment, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Eye, MessageQuestionCircle } from "@untitledui/icons";
import { TabList, Tabs } from "@/components/application/tabs/tabs";
import { BadgeWithIcon } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { cx } from "@/utils/cx";
import { BackstageLayout } from "../../components/Backstage";
import { AssociacaoPorPerguntaSlideout } from "../components/AssociacaoPorPerguntaSlideout";
import { AssociacaoSlideout } from "../components/AssociacaoSlideout";
import { FormularioPreviewModal } from "../components/FormularioPreviewModal";
import { PerguntaEditorSlideout } from "../components/PerguntaEditorSlideout";
import { TIPO_PERGUNTA, usePesquisas, type Pergunta, type TipoIngresso } from "../data/pesquisas-store";

type Vista = "ingresso" | "pergunta";

export function Pesquisas() {
    const { ingressos, perguntas, perguntasDoIngresso, ingressosDaPergunta, togglePerguntaNoIngresso } = usePesquisas();

    const [vista, setVista] = useState<Vista>("ingresso");
    const [assocIngresso, setAssocIngresso] = useState<TipoIngresso | null>(null);
    const [assocPergunta, setAssocPergunta] = useState<Pergunta | null>(null);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewIngressoId, setPreviewIngressoId] = useState<string | null>(null);
    const [colapsados, setColapsados] = useState<Set<string>>(new Set());

    // Criar pergunta a partir da associação: fecha a associação, abre o editor e reabre depois.
    const [criarOpen, setCriarOpen] = useState(false);
    const [reabrirIngresso, setReabrirIngresso] = useState<TipoIngresso | null>(null);

    const abrirPreview = (id: string | null) => {
        setPreviewIngressoId(id);
        setPreviewOpen(true);
    };

    const handleCriarPergunta = () => {
        setReabrirIngresso(assocIngresso);
        setAssocIngresso(null);
        setCriarOpen(true);
    };

    const fecharEditorCriacao = () => {
        setCriarOpen(false);
        if (reabrirIngresso) {
            setAssocIngresso(reabrirIngresso);
            setReabrirIngresso(null);
        }
    };

    // Agrupa ingressos por grupo/sessão (nomes de ingresso podem repetir entre grupos).
    const grupos = useMemo(() => {
        const map = new Map<string, TipoIngresso[]>();
        for (const ing of ingressos) {
            const arr = map.get(ing.grupo) ?? [];
            arr.push(ing);
            map.set(ing.grupo, arr);
        }
        return Array.from(map, ([nome, items]) => ({ nome, ingressos: items }));
    }, [ingressos]);

    const toggleGrupo = (nome: string) =>
        setColapsados((prev) => {
            const next = new Set(prev);
            if (next.has(nome)) next.delete(nome);
            else next.add(nome);
            return next;
        });

    return (
        <BackstageLayout activeSection="pesquisas">
            <div className="flex min-w-0 flex-1 flex-col">
                <main className="flex flex-1 flex-col gap-6 py-6 pb-10 md:px-6">
                    {/* Header */}
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex flex-col gap-1">
                            <h1 className="text-xl font-semibold text-primary">Pesquisas</h1>
                            <p className="text-sm text-tertiary">O que perguntar ao comprador em cada ingresso.</p>
                        </div>
                        <Button size="md" color="secondary" iconLeading={MessageQuestionCircle} href="/backstage/pesquisas/banco">
                            Banco de perguntas
                        </Button>
                    </div>

                    {/* Tabela com 2 visões */}
                    <section className="overflow-clip rounded-xl bg-primary ring-1 ring-border-secondary">
                        <header className="border-b border-secondary px-4 py-3">
                            <Tabs selectedKey={vista} onSelectionChange={(v: React.Key) => setVista(v as Vista)}>
                                <TabList
                                    type="button-minimal"
                                    className="self-start"
                                    items={[
                                        { id: "ingresso", label: "Por ingresso" },
                                        { id: "pergunta", label: "Por pergunta" },
                                    ]}
                                />
                            </Tabs>
                        </header>

                        {vista === "ingresso" ? (
                            <table className="w-full table-fixed border-collapse">
                                <colgroup>
                                    <col className="w-[40%] md:w-72" />
                                    <col />
                                    <col className="w-40 md:w-52" />
                                </colgroup>
                                <thead className="bg-secondary">
                                    <tr className="border-b border-secondary text-left">
                                        <th className="px-4 py-3 text-xs font-semibold text-tertiary">Grupo · Ingresso</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-tertiary">Perguntas</th>
                                        <th className="px-4 py-3" aria-hidden="true" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {grupos.map((grupo) => {
                                        const aberto = !colapsados.has(grupo.nome);
                                        return (
                                            <Fragment key={grupo.nome}>
                                                <tr
                                                    role="button"
                                                    tabIndex={0}
                                                    aria-expanded={aberto}
                                                    onClick={() => toggleGrupo(grupo.nome)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter" || e.key === " ") {
                                                            e.preventDefault();
                                                            toggleGrupo(grupo.nome);
                                                        }
                                                    }}
                                                    className="cursor-pointer border-b border-secondary bg-secondary/40 transition duration-100 ease-linear hover:bg-primary_hover"
                                                >
                                                    <td className="px-4 py-3">
                                                        <span className="flex items-center gap-2">
                                                            <ChevronDown className={cx("size-4 shrink-0 text-fg-quaternary transition-transform duration-150", !aberto && "-rotate-90")} />
                                                            <span className="text-sm font-bold text-primary">{grupo.nome}</span>
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-tertiary">
                                                        {grupo.ingressos.length} {grupo.ingressos.length === 1 ? "ingresso" : "ingressos"}
                                                    </td>
                                                    <td className="px-4 py-3" aria-hidden="true" />
                                                </tr>
                                                {aberto &&
                                                    grupo.ingressos.map((ingresso) => {
                                                        const associadas = perguntasDoIngresso(ingresso.id);
                                                        return (
                                                            <tr
                                                                key={ingresso.id}
                                                                role="button"
                                                                tabIndex={0}
                                                                onClick={() => setAssocIngresso(ingresso)}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === "Enter" || e.key === " ") {
                                                                        e.preventDefault();
                                                                        setAssocIngresso(ingresso);
                                                                    }
                                                                }}
                                                                className={cx(
                                                                    "group cursor-pointer border-b border-secondary transition duration-100 ease-linear",
                                                                    assocIngresso?.id === ingresso.id ? "bg-brand-primary hover:bg-brand-primary" : "hover:bg-primary_hover",
                                                                )}
                                                            >
                                                                <td className="py-3.5 pr-4 pl-12">
                                                                    <div className="flex flex-col">
                                                                        <span className="text-sm font-medium text-primary">{ingresso.nome}</span>
                                                                        <span className="text-xs text-tertiary">{ingresso.grupo}</span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-3.5">
                                                                    {associadas.length === 0 ? (
                                                                        <span className="text-sm text-tertiary">Nenhuma pergunta</span>
                                                                    ) : (
                                                                        <div className="flex flex-col gap-0.5">
                                                                            <span className="text-sm font-medium text-primary">
                                                                                {associadas.length} {associadas.length === 1 ? "pergunta" : "perguntas"}
                                                                            </span>
                                                                            <span className="line-clamp-1 text-xs text-tertiary">{associadas.map((p) => p.titulo).join(" · ")}</span>
                                                                        </div>
                                                                    )}
                                                                </td>
                                                                <td className="px-4 py-3.5">
                                                                    <div className="flex items-center justify-end gap-1">
                                                                        {associadas.length > 0 && (
                                                                            <span onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                                                                                <ButtonUtility
                                                                                    size="sm"
                                                                                    color="tertiary"
                                                                                    icon={Eye}
                                                                                    tooltip="Ver formulário"
                                                                                    onClick={() => abrirPreview(ingresso.id)}
                                                                                />
                                                                            </span>
                                                                        )}
                                                                        <span className="flex items-center gap-1 text-sm font-semibold text-brand-secondary">
                                                                            {associadas.length === 0 ? "Adicionar" : "Editar"}
                                                                            <ChevronRight className="size-4 transition-transform duration-100 ease-linear group-hover:translate-x-0.5" />
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                            </Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        ) : (
                            <table className="w-full table-fixed border-collapse">
                                <colgroup>
                                    <col className="w-[44%] md:w-80" />
                                    <col />
                                    <col className="w-28 md:w-36" />
                                </colgroup>
                                <thead className="bg-secondary">
                                    <tr className="border-b border-secondary text-left">
                                        <th className="px-4 py-3 text-xs font-semibold text-tertiary">Pergunta</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-tertiary">Usada em</th>
                                        <th className="px-4 py-3" aria-hidden="true" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {perguntas.map((p, i) => {
                                        const meta = TIPO_PERGUNTA[p.tipo];
                                        const usada = ingressosDaPergunta(p.id);
                                        const isLast = i === perguntas.length - 1;
                                        return (
                                            <tr
                                                key={p.id}
                                                role="button"
                                                tabIndex={0}
                                                onClick={() => setAssocPergunta(p)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter" || e.key === " ") {
                                                        e.preventDefault();
                                                        setAssocPergunta(p);
                                                    }
                                                }}
                                                className={cx("group cursor-pointer transition duration-100 ease-linear hover:bg-primary_hover", !isLast && "border-b border-secondary")}
                                            >
                                                <td className="px-4 py-3.5">
                                                    <div className="flex flex-col gap-1.5">
                                                        <span className="text-sm font-medium text-primary">{p.titulo}</span>
                                                        <BadgeWithIcon size="sm" color="gray" type="modern" iconLeading={meta.icon} className="w-fit">
                                                            {meta.label}
                                                        </BadgeWithIcon>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    {usada.length === 0 ? (
                                                        <span className="text-sm text-tertiary">Nenhum ingresso</span>
                                                    ) : (
                                                        <div className="flex flex-col gap-0.5">
                                                            <span className="text-sm font-medium text-primary">
                                                                {usada.length} {usada.length === 1 ? "ingresso" : "ingressos"}
                                                            </span>
                                                            <span className="line-clamp-1 text-xs text-tertiary">{usada.map((i2) => `${i2.nome} (${i2.grupo})`).join(" · ")}</span>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <span className="flex items-center justify-end gap-1 text-sm font-semibold text-brand-secondary">
                                                        Onde usar
                                                        <ChevronRight className="size-4 transition-transform duration-100 ease-linear group-hover:translate-x-0.5" />
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </section>
                </main>
            </div>

            <AssociacaoSlideout
                isOpen={assocIngresso !== null}
                onClose={() => setAssocIngresso(null)}
                ingresso={assocIngresso}
                onCriarPergunta={handleCriarPergunta}
            />
            <PerguntaEditorSlideout
                isOpen={criarOpen}
                onClose={fecharEditorCriacao}
                pergunta={null}
                onSaved={(nova) => reabrirIngresso && togglePerguntaNoIngresso(reabrirIngresso.id, nova.id)}
            />
            <AssociacaoPorPerguntaSlideout isOpen={assocPergunta !== null} onClose={() => setAssocPergunta(null)} pergunta={assocPergunta} />
            <FormularioPreviewModal isOpen={previewOpen} onClose={() => setPreviewOpen(false)} ingressoId={previewIngressoId} />
        </BackstageLayout>
    );
}

