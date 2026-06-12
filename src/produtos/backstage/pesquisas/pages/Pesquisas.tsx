import { useMemo, useState } from "react";
import { BarChartSquare02, Calendar, CheckSquare, ChevronRight, MessageQuestionCircle, Plus, Ticket01, XClose } from "@untitledui/icons";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { EmptyState } from "@/components/application/empty-state/empty-state";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { cx } from "@/utils/cx";
import { BackstageLayout } from "../../components/Backstage";
import { AssociacaoSlideout } from "../components/AssociacaoSlideout";
import { PerguntaEditorModal } from "../components/PerguntaEditorModal";
import { SimuladorEstados } from "../components/SimuladorEstados";
import { VincularEmLoteSlideout } from "../components/VincularEmLoteSlideout";
import { usePesquisas, type TipoIngresso } from "../data/pesquisas-store";

export function Pesquisas() {
    const { ingressos, perguntas, perguntasDoIngresso, togglePerguntaNoIngresso, esvaziarBanco, restaurarBanco } = usePesquisas();

    // Simulação de empty state (só protótipo). "sem-perguntas" esvazia o banco de verdade,
    // pra o fluxo de criar a primeira pergunta acontecer normalmente (teste de usabilidade).
    const [sim, setSim] = useState<"normal" | "sem-ingressos" | "sem-perguntas">("normal");
    const ingressosSim = sim === "sem-ingressos" ? [] : ingressos;
    const bancoVazio = perguntas.length === 0;

    const aoMudarSim = (v: "normal" | "sem-ingressos" | "sem-perguntas") => {
        setSim(v);
        if (v === "sem-perguntas") esvaziarBanco();
        else restaurarBanco();
    };

    const [assocIngresso, setAssocIngresso] = useState<TipoIngresso | null>(null);
    const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
    const [loteOpen, setLoteOpen] = useState(false);
    const [modoSelecao, setModoSelecao] = useState(false);

    // Criar pergunta a partir de um slideout: fecha, abre o editor e reabre depois.
    const [criarOpen, setCriarOpen] = useState(false);
    const [reabrir, setReabrir] = useState<{ tipo: "individual"; ingresso: TipoIngresso } | { tipo: "lote" } | null>(null);

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

    // Criar a primeira pergunta (sem vínculo automático), a partir do empty state.
    const criarPerguntaAvulsa = () => {
        setReabrir(null);
        setCriarOpen(true);
    };

    // Estrutura em 2 níveis visuais: data (seção) › grupo (card) › ingressos (linhas).
    const datas = useMemo(() => {
        const mapData = new Map<string, Map<string, TipoIngresso[]>>();
        for (const ing of ingressosSim) {
            if (!mapData.has(ing.data)) mapData.set(ing.data, new Map());
            const grupos = mapData.get(ing.data)!;
            if (!grupos.has(ing.grupo)) grupos.set(ing.grupo, []);
            grupos.get(ing.grupo)!.push(ing);
        }
        return Array.from(mapData, ([data, grupos]) => ({ data, grupos: Array.from(grupos, ([nome, ingressos]) => ({ nome, ingressos })) }));
    }, [ingressosSim]);

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

    const ingressosSelecionados = useMemo(() => ingressosSim.filter((i) => selecionados.has(i.id)), [ingressosSim, selecionados]);
    const selecionarTodos = () => setSelecionados(new Set(ingressosSim.map((i) => i.id)));
    const limparSelecao = () => setSelecionados(new Set());
    const sairModoSelecao = () => {
        setModoSelecao(false);
        setSelecionados(new Set());
    };

    return (
        <BackstageLayout activeSection="pesquisas" activeItem="formularios-compra">
            <div className="flex min-w-0 flex-1 flex-col">
                <main className="flex flex-1 flex-col gap-6 py-6 pb-10 md:px-6">
                    {/* Header */}
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex flex-col gap-1">
                            <h1 className="text-xl font-semibold text-primary">Perguntas por ingresso</h1>
                            <p className="text-sm text-tertiary">Selecione um ou mais ingressos para associar perguntas.</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button size="md" color="secondary" iconLeading={BarChartSquare02} href="/backstage/pesquisas/banco">
                                Relatório de respostas
                            </Button>
                            <Button size="md" color="secondary" iconLeading={Plus} onClick={criarPerguntaAvulsa}>
                                Criar pergunta
                            </Button>
                        </div>
                    </div>

                    {ingressosSim.length === 0 ? (
                        <div className="flex flex-1 items-center justify-center py-12">
                            <EmptyState size="sm">
                                <EmptyState.Header>
                                    <EmptyState.FeaturedIcon icon={Ticket01} color="gray" theme="modern" />
                                </EmptyState.Header>
                                <EmptyState.Content>
                                    <EmptyState.Title>Nenhum ingresso no evento</EmptyState.Title>
                                    <EmptyState.Description>Cadastre os ingressos para escolher o que perguntar em cada um.</EmptyState.Description>
                                </EmptyState.Content>
                                <EmptyState.Footer>
                                    <Button
                                        size="md"
                                        color="primary"
                                        iconLeading={Plus}
                                        onClick={() => toast.success("Abrindo cadastro de ingressos…")}
                                    >
                                        Cadastrar ingressos
                                    </Button>
                                </EmptyState.Footer>
                            </EmptyState>
                        </div>
                    ) : bancoVazio ? (
                        <div className="flex flex-1 items-center justify-center py-12">
                            <EmptyState size="sm">
                                <EmptyState.Header>
                                    <EmptyState.FeaturedIcon icon={MessageQuestionCircle} color="gray" theme="modern" />
                                </EmptyState.Header>
                                <EmptyState.Content>
                                    <EmptyState.Title>Crie sua primeira pergunta</EmptyState.Title>
                                    <EmptyState.Description>Você ainda não tem perguntas. Crie uma para escolher o que perguntar em cada ingresso.</EmptyState.Description>
                                </EmptyState.Content>
                                <EmptyState.Footer>
                                    <Button size="md" color="primary" iconLeading={Plus} onClick={criarPerguntaAvulsa}>
                                        Criar pergunta
                                    </Button>
                                </EmptyState.Footer>
                            </EmptyState>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-6">
                            {/* Controle de seleção em massa: botão para entrar; barra sticky quando ativo */}
                            {modoSelecao ? (
                                <div className="sticky top-4 z-20 flex flex-col gap-3 rounded-xl bg-secondary px-4 py-3 shadow-sm ring-1 ring-border-secondary sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Button size="sm" color="primary" onClick={() => setLoteOpen(true)} isDisabled={selecionados.size === 0}>
                                            Associar selecionados
                                        </Button>
                                        <Button size="sm" color="secondary" onClick={selecionarTodos}>
                                            Selecionar todos
                                        </Button>
                                        <Button size="sm" color="link-gray" onClick={limparSelecao} isDisabled={selecionados.size === 0}>
                                            Limpar
                                        </Button>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={cx("text-sm", selecionados.size > 0 ? "font-semibold text-primary" : "text-tertiary")}>
                                            {selecionados.size > 0
                                                ? `${selecionados.size} ${selecionados.size === 1 ? "ingresso selecionado" : "ingressos selecionados"}`
                                                : "Nenhum ingresso selecionado"}
                                        </span>
                                        <Button size="sm" color="secondary" iconLeading={XClose} onClick={sairModoSelecao}>
                                            Sair
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex justify-start">
                                    <Button size="sm" color="secondary" iconLeading={CheckSquare} onClick={() => setModoSelecao(true)}>
                                        Associar em massa
                                    </Button>
                                </div>
                            )}

                            {/* Blocos por dia */}
                            {datas.map((d) => {
                                const dataIds = d.grupos.flatMap((g) => g.ingressos.map((i) => i.id));
                                return (
                                    <section key={d.data} className="flex flex-col gap-3">
                                        <div className="flex items-center gap-2 px-1">
                                            <Calendar className="size-4 shrink-0 text-fg-quaternary" />
                                            <h2 className="text-md font-semibold text-primary">{d.data}</h2>
                                            <span className="text-sm text-tertiary">
                                                · {dataIds.length} {dataIds.length === 1 ? "ingresso" : "ingressos"}
                                            </span>
                                        </div>

                                        {d.grupos.map((g) => {
                                            const grupoIds = g.ingressos.map((i) => i.id);
                                            const grupoTodos = grupoIds.every((id) => selecionados.has(id));
                                            const grupoAlguns = grupoIds.some((id) => selecionados.has(id)) && !grupoTodos;
                                            return (
                                                <div key={`${d.data}/${g.nome}`} className="overflow-clip rounded-xl bg-primary ring-1 ring-border-secondary">
                                                    {/* Cabeçalho do setor */}
                                                    <div className="flex items-center gap-3 border-b border-secondary bg-secondary/40 px-4 py-3">
                                                        <CheckSlot show={modoSelecao}>
                                                            <Checkbox
                                                                size="sm"
                                                                aria-label={`Selecionar todos de ${g.nome}`}
                                                                isSelected={grupoTodos}
                                                                isIndeterminate={grupoAlguns}
                                                                onChange={(on: boolean) => setVarios(grupoIds, on)}
                                                            />
                                                        </CheckSlot>
                                                        <div className="flex min-w-0 flex-1 flex-col">
                                                            <span className="text-[11px] font-semibold tracking-wide text-tertiary uppercase">Setor</span>
                                                            <span className="text-sm font-semibold text-primary">{g.nome}</span>
                                                        </div>
                                                        <span className="text-sm text-tertiary">
                                                            {g.ingressos.length} {g.ingressos.length === 1 ? "tipo de ingresso" : "tipos de ingresso"}
                                                        </span>
                                                    </div>

                                                    {/* Ingressos */}
                                                    <div className="flex flex-col">
                                                        {g.ingressos.map((ingresso) => {
                                                            const associadas = perguntasDoIngresso(ingresso.id);
                                                            const marcado = selecionados.has(ingresso.id);
                                                            const editando = assocIngresso?.id === ingresso.id;
                                                            return (
                                                                <div
                                                                    key={ingresso.id}
                                                                    className={cx(
                                                                        "group flex w-full items-center gap-3 border-b border-secondary pr-2 pl-4 transition duration-100 ease-linear last:border-b-0",
                                                                        editando
                                                                            ? "bg-brand-primary shadow-[inset_2px_0_0_0_var(--color-bg-brand-solid)] dark:bg-white/10"
                                                                            : marcado
                                                                              ? "bg-brand-primary dark:bg-white/10"
                                                                              : "hover:bg-primary_hover",
                                                                    )}
                                                                >
                                                                    <CheckSlot show={modoSelecao}>
                                                                        <Checkbox size="sm" isSelected={marcado} isReadOnly aria-hidden="true" />
                                                                    </CheckSlot>
                                                                    <button
                                                                        type="button"
                                                                        onClick={modoSelecao ? () => toggleSelecionado(ingresso.id) : () => setAssocIngresso(ingresso)}
                                                                        className="flex min-w-0 flex-1 items-center gap-3 py-3.5 pr-2 text-left"
                                                                    >
                                                                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-primary">{ingresso.nome}</span>
                                                                        {associadas.length > 0 ? (
                                                                            <Badge size="sm" type="pill-color" color="gray">
                                                                                {associadas.length} {associadas.length === 1 ? "pergunta" : "perguntas"}
                                                                            </Badge>
                                                                        ) : (
                                                                            <span className="text-sm text-tertiary">Sem perguntas vinculadas</span>
                                                                        )}
                                                                        {!modoSelecao && (
                                                                            <ChevronRight className="size-4 shrink-0 text-fg-quaternary transition-transform duration-100 ease-linear group-hover:translate-x-0.5" />
                                                                        )}
                                                                    </button>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </section>
                                );
                            })}
                        </div>
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
                onVinculado={sairModoSelecao}
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

            <SimuladorEstados
                value={sim}
                onChange={aoMudarSim}
                options={[
                    { id: "normal", label: "Normal (com ingressos)" },
                    { id: "sem-ingressos", label: "Sem ingressos" },
                    { id: "sem-perguntas", label: "Sem perguntas no banco" },
                ]}
            />
        </BackstageLayout>
    );
}

/** Slot animado para o checkbox que surge/some ao entrar/sair do modo de seleção. */
function CheckSlot({ show, children }: { show: boolean; children: React.ReactNode }) {
    return (
        <AnimatePresence initial={false}>
            {show && (
                <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: "auto", opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 40, mass: 0.6 }}
                    className="flex shrink-0 items-center overflow-hidden"
                >
                    {children}
                </motion.div>
            )}
        </AnimatePresence>
    );
}
