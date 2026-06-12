import { Fragment, useMemo, useState } from "react";
import { ChevronDown, Edit01, Eye, Link01, MessageQuestionCircle, Ticket01 } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { EmptyState } from "@/components/application/empty-state/empty-state";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { cx } from "@/utils/cx";
import { BackstageLayout } from "../../components/Backstage";
import { AssociacaoSlideout } from "../components/AssociacaoSlideout";
import { FormularioPreviewModal } from "../components/FormularioPreviewModal";
import { PerguntaEditorModal } from "../components/PerguntaEditorModal";
import { SimuladorEstados } from "../components/SimuladorEstados";
import { VincularEmLoteSlideout } from "../components/VincularEmLoteSlideout";
import { TIPO_PERGUNTA, usePesquisas, type TipoIngresso } from "../data/pesquisas-store";

export function Pesquisas() {
    const { ingressos, perguntasDoIngresso, itensDoIngresso, togglePerguntaNoIngresso } = usePesquisas();

    // Simulação de empty state (só protótipo).
    const [sim, setSim] = useState<"normal" | "sem-ingressos">("normal");
    const ingressosSim = sim === "sem-ingressos" ? [] : ingressos;

    const [assocIngresso, setAssocIngresso] = useState<TipoIngresso | null>(null);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewIngressoId, setPreviewIngressoId] = useState<string | null>(null);
    const [colapsados, setColapsados] = useState<Set<string>>(new Set());
    const [expandidos, setExpandidos] = useState<Set<string>>(new Set());
    const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
    const [loteOpen, setLoteOpen] = useState(false);

    // Criar pergunta a partir de um slideout: fecha, abre o editor e reabre depois.
    const [criarOpen, setCriarOpen] = useState(false);
    const [reabrir, setReabrir] = useState<{ tipo: "individual"; ingresso: TipoIngresso } | { tipo: "lote" } | null>(null);

    const abrirPreview = (id: string) => {
        setPreviewIngressoId(id);
        setPreviewOpen(true);
    };

    const handleCriarDeIndividual = () => {
        if (!assocIngresso) return;
        setReabrir({ tipo: "individual", ingresso: assocIngresso });
        setAssocIngresso(null);
        setCriarOpen(true);
    };

    const handleCriarDeLote = () => {
        setReabrir({ tipo: "lote" });
        setLoteOpen(false);
        setCriarOpen(true);
    };

    const fecharEditorCriacao = () => {
        setCriarOpen(false);
        if (reabrir?.tipo === "individual") setAssocIngresso(reabrir.ingresso);
        else if (reabrir?.tipo === "lote") setLoteOpen(true);
        setReabrir(null);
    };

    // Agrupa ingressos por grupo/sessão (nomes de ingresso podem repetir entre grupos).
    const grupos = useMemo(() => {
        const map = new Map<string, TipoIngresso[]>();
        for (const ing of ingressosSim) {
            const arr = map.get(ing.grupo) ?? [];
            arr.push(ing);
            map.set(ing.grupo, arr);
        }
        return Array.from(map, ([nome, items]) => ({ nome, ingressos: items }));
    }, [ingressosSim]);

    const toggleGrupo = (nome: string) =>
        setColapsados((prev) => {
            const next = new Set(prev);
            if (next.has(nome)) next.delete(nome);
            else next.add(nome);
            return next;
        });

    const toggleExpandido = (id: string) =>
        setExpandidos((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });

    const toggleSelecionado = (id: string) =>
        setSelecionados((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });

    const setVarios = (ids: string[], on: boolean) =>
        setSelecionados((prev) => {
            const next = new Set(prev);
            for (const id of ids) (on ? next.add(id) : next.delete(id));
            return next;
        });

    const limparSelecao = () => setSelecionados(new Set());

    const todosIds = ingressosSim.map((i) => i.id);
    const todosSel = todosIds.length > 0 && todosIds.every((id) => selecionados.has(id));
    const algunsSel = selecionados.size > 0 && !todosSel;

    const ingressosSelecionados = useMemo(() => ingressosSim.filter((i) => selecionados.has(i.id)), [ingressosSim, selecionados]);

    return (
        <BackstageLayout activeSection="pesquisas" activeItem="formularios-compra">
            <div className="flex min-w-0 flex-1 flex-col">
                <main className="flex flex-1 flex-col gap-6 py-6 pb-10 md:px-6">
                    {/* Header */}
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex flex-col gap-1">
                            <h1 className="text-xl font-semibold text-primary">Vincular perguntas</h1>
                            <p className="text-sm text-tertiary">Escolha o que perguntar ao comprador em cada ingresso.</p>
                        </div>
                        <Button size="md" color="secondary" iconLeading={MessageQuestionCircle} href="/backstage/pesquisas/banco">
                            Coleta de dados
                        </Button>
                    </div>

                    {ingressosSim.length === 0 ? (
                        <div className="py-12">
                            <EmptyState size="sm">
                                <EmptyState.Header>
                                    <EmptyState.FeaturedIcon icon={Ticket01} color="gray" theme="modern" />
                                </EmptyState.Header>
                                <EmptyState.Content>
                                    <EmptyState.Title>Nenhum ingresso no evento</EmptyState.Title>
                                    <EmptyState.Description>Cadastre os ingressos para escolher o que perguntar em cada um.</EmptyState.Description>
                                </EmptyState.Content>
                            </EmptyState>
                        </div>
                    ) : (
                        <section className="overflow-clip rounded-xl bg-primary ring-1 ring-border-secondary">
                            {/* Barra de ação em massa — sempre visível, habilita ao selecionar */}
                        <header className="flex flex-col gap-3 border-b border-secondary bg-secondary/40 px-4 py-3 sm:h-14 sm:flex-row sm:items-center sm:justify-between">
                            <span className={cx("text-sm", selecionados.size > 0 ? "font-semibold text-primary" : "text-tertiary")}>
                                {selecionados.size > 0
                                    ? `${selecionados.size} ${selecionados.size === 1 ? "ingresso selecionado" : "ingressos selecionados"}`
                                    : "Nenhum ingresso selecionado"}
                            </span>
                            <div className="flex items-center gap-2">
                                <Button size="sm" color="secondary" onClick={limparSelecao} isDisabled={selecionados.size === 0}>
                                    Limpar seleção
                                </Button>
                                <Button size="sm" color="primary" iconLeading={Link01} onClick={() => setLoteOpen(true)} isDisabled={selecionados.size === 0}>
                                    Vincular perguntas
                                </Button>
                            </div>
                        </header>

                        <table className="w-full table-fixed border-collapse">
                            <colgroup>
                                <col className="w-12" />
                                <col className="w-[36%] md:w-72" />
                                <col />
                                <col className="w-28 md:w-40" />
                            </colgroup>
                            <thead className="bg-secondary">
                                <tr className="border-b border-secondary text-left">
                                    <th className="px-4 py-3">
                                        <Checkbox
                                            size="sm"
                                            aria-label="Selecionar todos os ingressos"
                                            isSelected={todosSel}
                                            isIndeterminate={algunsSel}
                                            onChange={(on: boolean) => setVarios(todosIds, on)}
                                        />
                                    </th>
                                    <th className="px-4 py-3 text-xs font-semibold text-tertiary">Grupo · Ingresso</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-tertiary">Perguntas</th>
                                    <th className="px-4 py-3" aria-hidden="true" />
                                </tr>
                            </thead>
                            <tbody>
                                {grupos.map((grupo) => {
                                    const aberto = !colapsados.has(grupo.nome);
                                    const grupoIds = grupo.ingressos.map((i) => i.id);
                                    const grupoTodos = grupoIds.every((id) => selecionados.has(id));
                                    const grupoAlguns = grupoIds.some((id) => selecionados.has(id)) && !grupoTodos;
                                    return (
                                        <Fragment key={grupo.nome}>
                                            <tr className="border-b border-secondary bg-secondary/40">
                                                <td className="px-4 py-3">
                                                    <Checkbox
                                                        size="sm"
                                                        aria-label={`Selecionar todos de ${grupo.nome}`}
                                                        isSelected={grupoTodos}
                                                        isIndeterminate={grupoAlguns}
                                                        onChange={(on: boolean) => setVarios(grupoIds, on)}
                                                    />
                                                </td>
                                                <td colSpan={3} className="py-0">
                                                    <button
                                                        type="button"
                                                        aria-expanded={aberto}
                                                        onClick={() => toggleGrupo(grupo.nome)}
                                                        className="flex w-full items-center gap-2 px-4 py-3 text-left transition duration-100 ease-linear hover:bg-primary_hover"
                                                    >
                                                        <ChevronDown className={cx("size-4 shrink-0 text-fg-quaternary transition-transform duration-150", !aberto && "-rotate-90")} />
                                                        <span className="text-sm font-bold text-primary">{grupo.nome}</span>
                                                        <span className="text-sm text-tertiary">
                                                            · {grupo.ingressos.length} {grupo.ingressos.length === 1 ? "ingresso" : "ingressos"}
                                                        </span>
                                                    </button>
                                                </td>
                                            </tr>
                                            {aberto &&
                                                grupo.ingressos.map((ingresso) => {
                                                    const associadas = perguntasDoIngresso(ingresso.id);
                                                    const aberta = expandidos.has(ingresso.id);
                                                    const marcado = selecionados.has(ingresso.id);
                                                    const editando = assocIngresso?.id === ingresso.id;
                                                    return (
                                                        <Fragment key={ingresso.id}>
                                                            <tr
                                                                className={cx(
                                                                    "group border-b border-secondary transition duration-100 ease-linear",
                                                                    editando
                                                                        ? "bg-brand-primary shadow-[inset_2px_0_0_0_var(--color-bg-brand-solid)] dark:bg-white/10"
                                                                        : marcado
                                                                          ? "bg-brand-primary dark:bg-white/10"
                                                                          : "hover:bg-primary_hover",
                                                                )}
                                                            >
                                                                <td className="px-4 py-3.5">
                                                                    <Checkbox
                                                                        size="sm"
                                                                        aria-label={`Selecionar ${ingresso.grupo} ${ingresso.nome}`}
                                                                        isSelected={marcado}
                                                                        onChange={() => toggleSelecionado(ingresso.id)}
                                                                    />
                                                                </td>
                                                                <td className="py-0 pr-4 pl-8">
                                                                    <button
                                                                        type="button"
                                                                        aria-expanded={aberta}
                                                                        onClick={() => toggleExpandido(ingresso.id)}
                                                                        className="flex w-full items-center gap-2 py-3.5 text-left"
                                                                    >
                                                                        <ChevronDown
                                                                            className={cx("size-4 shrink-0 text-fg-quaternary transition-transform duration-150", !aberta && "-rotate-90")}
                                                                        />
                                                                        <span className="flex flex-col">
                                                                            <span className="text-sm font-medium text-primary">{ingresso.nome}</span>
                                                                            <span className="text-xs text-tertiary">{ingresso.grupo}</span>
                                                                        </span>
                                                                    </button>
                                                                </td>
                                                                <td className="px-4 py-3.5">
                                                                    {associadas.length === 0 ? (
                                                                        <span className="text-sm text-tertiary">Nenhuma pergunta</span>
                                                                    ) : (
                                                                        <span className="text-sm font-medium text-primary">
                                                                            {associadas.length} {associadas.length === 1 ? "pergunta" : "perguntas"}
                                                                        </span>
                                                                    )}
                                                                </td>
                                                                <td className="px-4 py-3.5">
                                                                    <div className="flex items-center justify-end gap-1">
                                                                        {associadas.length > 0 && (
                                                                            <ButtonUtility
                                                                                size="sm"
                                                                                color="tertiary"
                                                                                icon={Eye}
                                                                                tooltip="Ver formulário"
                                                                                onClick={() => abrirPreview(ingresso.id)}
                                                                            />
                                                                        )}
                                                                        <ButtonUtility
                                                                            size="sm"
                                                                            color="tertiary"
                                                                            icon={Edit01}
                                                                            tooltip="Editar formulário"
                                                                            onClick={() => setAssocIngresso(ingresso)}
                                                                        />
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                            {aberta && (
                                                                <tr className="border-b border-secondary bg-secondary/30">
                                                                    <td aria-hidden="true" />
                                                                    <td colSpan={3} className="py-2 pr-4 pl-14">
                                                                        <PerguntasInline ingressoId={ingresso.id} itens={itensDoIngresso(ingresso.id)} onEditar={() => setAssocIngresso(ingresso)} />
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </Fragment>
                                                    );
                                                })}
                                        </Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                        </section>
                    )}
                </main>
            </div>

            <AssociacaoSlideout
                isOpen={assocIngresso !== null}
                onClose={() => setAssocIngresso(null)}
                ingresso={assocIngresso}
                onCriarPergunta={handleCriarDeIndividual}
            />
            <VincularEmLoteSlideout
                isOpen={loteOpen}
                onClose={() => setLoteOpen(false)}
                ingressos={ingressosSelecionados}
                onVinculado={limparSelecao}
                onCriarPergunta={handleCriarDeLote}
            />
            <PerguntaEditorModal
                isOpen={criarOpen}
                onClose={fecharEditorCriacao}
                pergunta={null}
                onSaved={(nova) => {
                    if (reabrir?.tipo === "individual") togglePerguntaNoIngresso(reabrir.ingresso.id, nova.id);
                }}
            />
            <FormularioPreviewModal isOpen={previewOpen} onClose={() => setPreviewOpen(false)} ingressoId={previewIngressoId} />

            <SimuladorEstados
                value={sim}
                onChange={setSim}
                options={[
                    { id: "normal", label: "Normal (com ingressos)" },
                    { id: "sem-ingressos", label: "Sem ingressos" },
                ]}
            />
        </BackstageLayout>
    );
}

/* ------------------------------------------------------------------ */
/*  Lista inline das perguntas vinculadas a um ingresso               */
/* ------------------------------------------------------------------ */

function PerguntasInline({
    itens,
    onEditar,
}: {
    ingressoId: string;
    itens: { pergunta: { id: string; titulo: string; tipo: keyof typeof TIPO_PERGUNTA }; obrigatoria: boolean }[];
    onEditar: () => void;
}) {
    if (itens.length === 0) {
        return (
            <div className="flex flex-wrap items-center gap-2 py-1.5">
                <span className="text-sm text-tertiary">Nenhuma pergunta vinculada ainda.</span>
                <Button size="sm" color="link-color" onClick={onEditar}>
                    Adicionar perguntas
                </Button>
            </div>
        );
    }
    return (
        <ol className="flex flex-col">
            {itens.map((it, i) => {
                const meta = TIPO_PERGUNTA[it.pergunta.tipo];
                return (
                    <li key={it.pergunta.id} className="flex items-center gap-3 py-1.5">
                        <span className="w-4 shrink-0 text-center text-xs font-semibold text-tertiary tabular-nums">{i + 1}</span>
                        <meta.icon className="size-4 shrink-0 text-fg-quaternary" />
                        <span className="min-w-0 flex-1 truncate text-sm text-primary">{it.pergunta.titulo}</span>
                        <Badge size="sm" type="pill-color" color={it.obrigatoria ? "brand" : "gray"}>
                            {it.obrigatoria ? "Obrigatória" : "Opcional"}
                        </Badge>
                    </li>
                );
            })}
        </ol>
    );
}
