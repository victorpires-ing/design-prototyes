import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { CheckCircle, DotsGrid, Edit01, MessageQuestionCircle, Plus, Ticket01, Trash01 } from "@untitledui/icons";
import { Reorder, useDragControls } from "motion/react";
import { Dialog as AriaDialog, Modal as AriaModal, ModalOverlay as AriaModalOverlay } from "react-aria-components";
import { toast } from "sonner";
import { EmptyState } from "@/components/application/empty-state/empty-state";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Toggle } from "@/components/base/toggle/toggle";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { cx } from "@/utils/cx";
import { BackstageLayout } from "../../components/Backstage";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { PerguntaEditorModal } from "../components/PerguntaEditorModal";
import { TIPO_PERGUNTA, usePesquisas, type Pergunta } from "../data/pesquisas-store";

export function Pesquisas() {
    const navigate = useNavigate();
    const { perguntas, ingressos, itensVinculaveis, countItensDaPergunta, reorderPerguntas, togglePergunta, removePergunta } = usePesquisas();

    const [editorOpen, setEditorOpen] = useState(false);
    const [editorPergunta, setEditorPergunta] = useState<Pergunta | null>(null);
    const [excluir, setExcluir] = useState<Pergunta | null>(null);
    const [vincularCTA, setVincularCTA] = useState<Pergunta | null>(null);

    const ordemIds = useMemo(() => perguntas.map((p) => p.id), [perguntas]);
    const totalItens = itensVinculaveis.length;

    const abrirCriar = () => {
        setEditorPergunta(null);
        setEditorOpen(true);
    };
    const abrirEditar = (pergunta: Pergunta) => {
        setEditorPergunta(pergunta);
        setEditorOpen(true);
    };
    const abrirVinculos = (pergunta: Pergunta) => navigate(`/backstage/pesquisas/${pergunta.id}/vinculos`);

    return (
        <BackstageLayout activeSection="pesquisas" activeItem="formularios-compra">
            <div className="flex min-w-0 flex-1 flex-col motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-left-4 motion-safe:duration-300 motion-safe:ease-out">
                <main className="flex flex-1 flex-col gap-6 py-6 pb-10 md:px-6">
                    {/* Header */}
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex flex-col gap-1">
                            <h1 className="text-xl font-semibold text-primary">Perguntas por ingresso</h1>
                            <p className="text-sm text-tertiary">
                                Escolha quais perguntas estarão na compra de cada item. O formulário do comprador seguirá exatamente a mesma ordem abaixo.
                            </p>
                        </div>
                        <Button size="md" color="primary" iconLeading={Plus} onClick={abrirCriar}>
                            Criar pergunta
                        </Button>
                    </div>

                    {ingressos.length === 0 ? (
                        <EmptyStateWrap
                            icon={Ticket01}
                            title="Nenhum ingresso no evento"
                            description="Cadastre os ingressos para escolher o que perguntar em cada um."
                            actionLabel="Cadastrar ingressos"
                            onAction={() => toast.success("Abrindo cadastro de ingressos…")}
                        />
                    ) : perguntas.length === 0 ? (
                        <EmptyStateWrap
                            icon={MessageQuestionCircle}
                            title="Crie sua primeira pergunta"
                            description="Você ainda não tem perguntas. Crie uma para escolher o que perguntar nos itens."
                            actionLabel="Criar pergunta"
                            onAction={abrirCriar}
                        />
                    ) : (
                        <Reorder.Group axis="y" values={ordemIds} onReorder={reorderPerguntas} className="flex flex-col gap-2">
                            {perguntas.map((pergunta) => (
                                <PerguntaRow
                                    key={pergunta.id}
                                    pergunta={pergunta}
                                    emItens={countItensDaPergunta(pergunta.id)}
                                    totalItens={totalItens}
                                    onAbrir={() => abrirVinculos(pergunta)}
                                    onToggle={() => togglePergunta(pergunta.id)}
                                    onEditar={() => abrirEditar(pergunta)}
                                    onExcluir={() => setExcluir(pergunta)}
                                />
                            ))}
                        </Reorder.Group>
                    )}
                </main>
            </div>

            <PerguntaEditorModal
                isOpen={editorOpen}
                onClose={() => setEditorOpen(false)}
                pergunta={editorPergunta}
                onSaved={(p) => {
                    // Só ao CRIAR (não ao editar): oferece vincular em seguida.
                    if (editorPergunta === null) setVincularCTA(p);
                }}
                onExcluir={(p) => {
                    setEditorOpen(false);
                    setExcluir(p);
                }}
            />

            <ConfirmDialog
                isOpen={excluir !== null}
                onClose={() => setExcluir(null)}
                onConfirm={() => {
                    if (!excluir) return;
                    removePergunta(excluir.id);
                    toast.success("Pergunta excluída", { description: `"${excluir.titulo}" foi removida.` });
                }}
                title="Excluir pergunta?"
                description={excluir ? `"${excluir.titulo}" será removida do banco e desvinculada de todos os itens.` : ""}
            />

            <VincularCTAModal
                pergunta={vincularCTA}
                onClose={() => setVincularCTA(null)}
                onVincular={() => {
                    const p = vincularCTA;
                    setVincularCTA(null);
                    if (p) abrirVinculos(p);
                }}
            />
        </BackstageLayout>
    );
}

/* ------------------------------------------------------------------ */
/*  Linha de pergunta — arrastável (alça) + ações                      */
/* ------------------------------------------------------------------ */

function PerguntaRow({
    pergunta,
    emItens,
    totalItens,
    onAbrir,
    onToggle,
    onEditar,
    onExcluir,
}: {
    pergunta: Pergunta;
    emItens: number;
    totalItens: number;
    onAbrir: () => void;
    onToggle: () => void;
    onEditar: () => void;
    onExcluir: () => void;
}) {
    const controls = useDragControls();
    const meta = TIPO_PERGUNTA[pergunta.tipo];
    const podeExcluir = pergunta.respostas === 0;

    const vinculoLabel =
        emItens === 0 ? "Sem itens vinculados" : emItens >= totalItens ? "Vinculado a todos os itens" : `Vinculado a ${emItens} ${emItens === 1 ? "item" : "itens"}`;

    return (
        <Reorder.Item value={pergunta.id} dragListener={false} dragControls={controls} whileDrag={{ scale: 1.01 }} className="flex items-center gap-1">
            {/* Alça de arraste — fora do card, à esquerda */}
            <button
                type="button"
                aria-label="Arrastar para reordenar"
                onPointerDown={(e) => controls.start(e)}
                className="flex size-8 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-fg-quaternary transition duration-100 ease-linear hover:bg-primary_hover active:cursor-grabbing"
            >
                <DotsGrid className="size-4" />
            </button>

            {/* Card da pergunta */}
            <div className={cx("flex min-w-0 flex-1 items-center gap-3 rounded-xl bg-primary px-4 py-3 ring-1 ring-border-secondary", !pergunta.ativa && "opacity-60")}>
                {/* Liga/desliga a pergunta no formulário */}
                <Toggle
                    size="sm"
                    isSelected={pergunta.ativa}
                    onChange={onToggle}
                    aria-label={pergunta.ativa ? "Desativar pergunta para o comprador" : "Ativar pergunta para o comprador"}
                    className="shrink-0"
                />

                {/* Conteúdo: título e, abaixo, tipo · status de vinculação */}
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate text-sm font-medium text-primary">
                        {pergunta.titulo}
                        {pergunta.obrigatoria && <span className="text-error-primary"> *</span>}
                    </span>
                    <span className="flex items-center gap-1.5 truncate text-xs text-tertiary">
                        <meta.icon className="size-3.5 shrink-0 text-fg-quaternary" />
                        {meta.label} <span className="text-quaternary">•</span> {vinculoLabel}
                    </span>
                </div>

                {/* Ações: editar vínculos · editar · excluir */}
                <div className="flex shrink-0 items-center gap-1">
                    <Button size="sm" color="secondary" onClick={onAbrir} className="mr-1">
                        Editar vínculos
                    </Button>
                    <ButtonUtility size="sm" color="tertiary" icon={Edit01} tooltip="Editar pergunta" onClick={onEditar} />
                    <ButtonUtility
                        size="sm"
                        color="tertiary"
                        icon={Trash01}
                        tooltip={podeExcluir ? "Excluir" : "Tem respostas — não dá para excluir"}
                        isDisabled={!podeExcluir}
                        onClick={onExcluir}
                    />
                </div>
            </div>
        </Reorder.Item>
    );
}

/* ------------------------------------------------------------------ */
/*  CTA pós-criação — oferece vincular a pergunta recém-criada         */
/* ------------------------------------------------------------------ */

function VincularCTAModal({ pergunta, onClose, onVincular }: { pergunta: Pergunta | null; onClose: () => void; onVincular: () => void }) {
    return (
        <AriaModalOverlay
            isOpen={pergunta !== null}
            onOpenChange={(open) => !open && onClose()}
            isDismissable
            className={({ isEntering, isExiting }) =>
                cx(
                    "fixed inset-0 z-50 flex items-center justify-center bg-overlay/70 p-4 backdrop-blur-[2px] outline-hidden",
                    isEntering && "duration-200 ease-out animate-in fade-in",
                    isExiting && "duration-150 ease-in animate-out fade-out",
                )
            }
        >
            <AriaModal
                className={({ isEntering, isExiting }) =>
                    cx(
                        "w-full max-w-[440px] rounded-2xl bg-primary shadow-xl outline-hidden",
                        isEntering && "duration-200 ease-out animate-in zoom-in-95 fade-in",
                        isExiting && "duration-150 ease-in animate-out zoom-out-95 fade-out",
                    )
                }
            >
                <AriaDialog className="flex flex-col gap-5 p-6 outline-hidden">
                    <FeaturedIcon icon={CheckCircle} color="success" theme="light" size="lg" />
                    <div className="flex flex-col gap-1">
                        <h2 className="text-lg font-semibold text-primary">Pergunta criada!</h2>
                        <p className="text-sm text-tertiary">
                            Quer escolher agora em quais ingressos e produtos {pergunta ? `“${pergunta.titulo}”` : "ela"} será feita?
                        </p>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button size="md" color="secondary" onClick={onClose}>
                            Agora não
                        </Button>
                        <Button size="md" color="primary" iconLeading={Plus} onClick={onVincular}>
                            Vincular itens
                        </Button>
                    </div>
                </AriaDialog>
            </AriaModal>
        </AriaModalOverlay>
    );
}

/* ------------------------------------------------------------------ */
/*  Empty state                                                        */
/* ------------------------------------------------------------------ */

function EmptyStateWrap({
    icon,
    title,
    description,
    actionLabel,
    onAction,
}: {
    icon: typeof Ticket01;
    title: string;
    description: string;
    actionLabel: string;
    onAction: () => void;
}) {
    return (
        <div className="flex flex-1 items-center justify-center py-12">
            <EmptyState size="sm">
                <EmptyState.Header>
                    <EmptyState.FeaturedIcon icon={icon} color="gray" theme="modern" />
                </EmptyState.Header>
                <EmptyState.Content>
                    <EmptyState.Title>{title}</EmptyState.Title>
                    <EmptyState.Description>{description}</EmptyState.Description>
                </EmptyState.Content>
                <EmptyState.Footer>
                    <Button size="md" color="primary" iconLeading={Plus} onClick={onAction}>
                        {actionLabel}
                    </Button>
                </EmptyState.Footer>
            </EmptyState>
        </div>
    );
}
