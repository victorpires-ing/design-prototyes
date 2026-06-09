import { useRef, useState } from "react";
import { ArrowDown, ArrowUp, CheckCircle, Eye, Paperclip, Plus, Trash01 } from "@untitledui/icons";
import { FileIcon } from "@untitledui/file-icons";
import { toast } from "sonner";
import { ContentDivider } from "@/components/application/content-divider/content-divider";
import { EmptyState } from "@/components/application/empty-state/empty-state";
import { Button } from "@/components/base/buttons/button";
import { CheckboxBase } from "@/components/base/checkbox/checkbox";
import { Input } from "@/components/base/input/input";
import { TextArea } from "@/components/base/textarea/textarea";
import { Toggle } from "@/components/base/toggle/toggle";
import { BackstageLayout } from "../../components/Backstage";
import { AdicionarPerguntaModal } from "../components/AdicionarPerguntaModal";
import { PreviewFormularioModal } from "../components/PreviewFormularioModal";
import { type PerguntaCadastrada } from "../data/formularios";

interface PerguntaForm extends PerguntaCadastrada {
    /** Identificador único da instância no formulário. */
    key: string;
    obrigatorio: boolean;
}

export function Formulario() {
    const [hasForm, setHasForm] = useState(false);
    const [nome, setNome] = useState("");
    const [descricao, setDescricao] = useState("");
    const [perguntas, setPerguntas] = useState<PerguntaForm[]>([]);
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const counter = useRef(0);

    const addPerguntas = (novas: PerguntaCadastrada[]) => {
        setPerguntas((prev) => [
            ...prev,
            ...novas.map((p) => ({ ...p, key: `${p.id}-${counter.current++}`, obrigatorio: false })),
        ]);
        setIsPickerOpen(false);
    };

    const removerPergunta = (key: string) => setPerguntas((prev) => prev.filter((p) => p.key !== key));

    const toggleObrigatorio = (key: string) =>
        setPerguntas((prev) => prev.map((p) => (p.key === key ? { ...p, obrigatorio: !p.obrigatorio } : p)));

    const mover = (index: number, dir: -1 | 1) =>
        setPerguntas((prev) => {
            const target = index + dir;
            if (target < 0 || target >= prev.length) return prev;
            const next = [...prev];
            [next[index], next[target]] = [next[target], next[index]];
            return next;
        });

    const salvar = () =>
        toast.success("Formulário salvo com sucesso.", {
            icon: <CheckCircle className="size-5 text-fg-success-primary" />,
        });

    return (
        <BackstageLayout activeSection="itens" activeItem="catalogo-ingressos">
            <div className="flex min-w-0 flex-1 flex-col px-4 py-6 md:px-6">
                {!hasForm ? (
                    <FormularioEmptyState
                        onCreate={() => {
                            setHasForm(true);
                            setIsPickerOpen(true);
                        }}
                    />
                ) : (
                    <>
                        {/* Header */}
                        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <h1 className="text-display-xs font-bold text-primary">Criar formulário</h1>
                            <div className="flex items-center gap-3">
                                <Button size="md" color="secondary" iconLeading={Eye} onClick={() => setIsPreviewOpen(true)}>
                                    Pré-visualizar
                                </Button>
                                <Button size="md" color="secondary" onClick={salvar}>
                                    Salvar
                                </Button>
                                <Button size="md" color="primary" onClick={salvar}>
                                    Salvar formulário
                                </Button>
                            </div>
                        </header>

                        <div className="mx-auto mt-6 flex w-full max-w-2xl flex-col gap-5">
                            {/* Nome e descrição do formulário */}
                            <div className="flex flex-col gap-4 rounded-xl p-5 ring-1 ring-border-secondary">
                                <Input
                                    label="Nome do formulário"
                                    placeholder="Ex.: Dados do participante"
                                    value={nome}
                                    onChange={setNome}
                                    isRequired
                                />
                                <TextArea
                                    label="Descrição"
                                    placeholder="Explique para o comprador por que essas informações são necessárias."
                                    value={descricao}
                                    onChange={setDescricao}
                                    rows={3}
                                />
                            </div>

                            {/* Perguntas */}
                            {perguntas.length === 0 ? (
                                <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-secondary px-6 py-10 text-center">
                                    <p className="text-sm font-medium text-secondary">Nenhuma pergunta adicionada</p>
                                    <p className="text-sm text-tertiary">
                                        Adicione perguntas já cadastradas para montar o formulário.
                                    </p>
                                </div>
                            ) : (
                                perguntas.map((pergunta, index) => (
                                    <PerguntaCard
                                        key={pergunta.key}
                                        pergunta={pergunta}
                                        isFirst={index === 0}
                                        isLast={index === perguntas.length - 1}
                                        onToggleObrigatorio={() => toggleObrigatorio(pergunta.key)}
                                        onMoveUp={() => mover(index, -1)}
                                        onMoveDown={() => mover(index, 1)}
                                        onDelete={() => removerPergunta(pergunta.key)}
                                    />
                                ))
                            )}

                            {/* Adicionar pergunta */}
                            <ContentDivider type="single-line" className="my-1">
                                <Button size="md" color="secondary" iconLeading={Plus} onClick={() => setIsPickerOpen(true)}>
                                    Adicionar pergunta
                                </Button>
                            </ContentDivider>
                        </div>
                    </>
                )}
            </div>

            <AdicionarPerguntaModal
                isOpen={isPickerOpen}
                onClose={() => setIsPickerOpen(false)}
                jaAdicionadas={perguntas.map((p) => p.id)}
                onAdd={addPerguntas}
            />

            <PreviewFormularioModal
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                nome={nome}
                descricao={descricao}
                perguntas={perguntas}
            />
        </BackstageLayout>
    );
}

function FormularioEmptyState({ onCreate }: { onCreate: () => void }) {
    return (
        <div className="flex flex-1 items-center justify-center py-16">
            <EmptyState size="lg">
                <EmptyState.Header pattern="grid">
                    <FileIcon type="folder" variant="gray" size={152} className="relative z-10" />
                </EmptyState.Header>
                <EmptyState.Content>
                    <EmptyState.Title>Nenhum formulário criado</EmptyState.Title>
                    <EmptyState.Description>
                        Crie um formulário com perguntas que o seu cliente vai responder no final da compra.
                    </EmptyState.Description>
                </EmptyState.Content>
                <EmptyState.Footer>
                    <Button size="md" color="primary" iconLeading={Plus} onClick={onCreate}>
                        Criar formulário
                    </Button>
                </EmptyState.Footer>
            </EmptyState>
        </div>
    );
}

interface PerguntaCardProps {
    pergunta: PerguntaForm;
    isFirst: boolean;
    isLast: boolean;
    onToggleObrigatorio: () => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
    onDelete: () => void;
}

function PerguntaCard({ pergunta, isFirst, isLast, onToggleObrigatorio, onMoveUp, onMoveDown, onDelete }: PerguntaCardProps) {
    return (
        <div className="flex flex-col rounded-xl ring-1 ring-border-secondary">
            <div className="flex flex-col gap-4 p-5">
                <div className="flex flex-col gap-1">
                    <h3 className="text-md font-semibold text-primary">{pergunta.titulo}</h3>
                    {pergunta.descricao && <p className="text-sm text-tertiary">{pergunta.descricao}</p>}
                </div>

                {/* Preview da resposta */}
                {pergunta.tipo === "texto" && (
                    <div className="rounded-lg bg-secondary px-3.5 py-2.5 text-sm text-placeholder ring-1 ring-border-secondary">
                        Resposta de texto
                    </div>
                )}
                {pergunta.tipo === "anexo" && (
                    <div className="flex items-center gap-2 rounded-lg border border-dashed border-secondary px-3.5 py-3 text-sm text-tertiary">
                        <Paperclip className="size-4 shrink-0" />
                        Anexar arquivos
                    </div>
                )}
                {(pergunta.tipo === "selecao" || pergunta.tipo === "multipla") && (
                    <div className="flex flex-col gap-2.5">
                        {(pergunta.opcoes ?? []).map((opcao, i) => (
                            <div key={i} className="flex items-center gap-2.5">
                                <CheckboxBase size="sm" isSelected={false} />
                                <span className="text-sm text-secondary">{opcao}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer: obrigatório + ações */}
            <div className="flex flex-col gap-3 border-t border-secondary px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                <Toggle
                    size="sm"
                    label="Obrigatório"
                    isSelected={pergunta.obrigatorio}
                    onChange={onToggleObrigatorio}
                />
                <div className="flex items-center gap-2">
                    <Button size="sm" color="secondary" iconLeading={ArrowUp} isDisabled={isFirst} onClick={onMoveUp}>
                        Para cima
                    </Button>
                    <Button size="sm" color="secondary" iconLeading={ArrowDown} isDisabled={isLast} onClick={onMoveDown}>
                        Para baixo
                    </Button>
                    <Button size="sm" color="secondary-destructive" iconLeading={Trash01} onClick={onDelete}>
                        Deletar
                    </Button>
                </div>
            </div>
        </div>
    );
}
