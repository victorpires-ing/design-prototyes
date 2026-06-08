import { useState } from "react";
import { ChevronLeft, InfoCircle, Trash01 } from "@untitledui/icons";
import { useNavigate, useParams } from "react-router";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Label } from "@/components/base/input/label";
import { Select } from "@/components/base/select/select";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { BackstageLayout } from "../../components/Backstage";
import { TIPO_RESPOSTA, type TipoResposta } from "../data/perguntas";
import { usePerguntas } from "../data/perguntas-store";

const TIPO_ITEMS = (Object.keys(TIPO_RESPOSTA) as TipoResposta[]).map((id) => ({
    id,
    label: TIPO_RESPOSTA[id].label,
    icon: TIPO_RESPOSTA[id].icon,
}));

export function PerguntaForm() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { getPergunta, addPergunta, updatePergunta, removePergunta } = usePerguntas();

    const existing = id ? getPergunta(id) : undefined;
    const isEditing = Boolean(existing);
    const emUso = Boolean(existing?.emUso);

    const [titulo, setTitulo] = useState(existing?.titulo ?? "");
    const [tipo, setTipo] = useState<TipoResposta | null>(existing?.tipo ?? null);

    const canSave = titulo.trim().length > 0 && tipo !== null;

    const handleSave = () => {
        if (!canSave) return;
        if (isEditing && existing) {
            updatePergunta(existing.id, { titulo: titulo.trim(), tipo: tipo! });
        } else {
            addPergunta({ titulo: titulo.trim(), tipo: tipo! });
        }
        navigate("/backstage/perguntas");
    };

    const handleDelete = () => {
        if (!isEditing || !existing || emUso) return;
        removePergunta(existing.id);
        navigate("/backstage/perguntas");
    };

    return (
        <BackstageLayout activeProducer="perguntas" showEventContext={false}>
        <div className="flex min-w-0 flex-1 flex-col">
            <header className="flex items-center gap-3 py-2 md:px-6 md:py-4">
                <button
                    type="button"
                    onClick={() => navigate("/backstage/perguntas")}
                    aria-label="Voltar"
                    className="flex size-9 shrink-0 items-center justify-center rounded-lg text-fg-secondary ring-1 ring-border-secondary transition duration-100 ease-linear hover:bg-secondary"
                >
                    <ChevronLeft className="size-5" />
                </button>
                <h1 className="text-xl font-semibold text-primary">
                    {isEditing ? "Editar pergunta" : "Nova pergunta"}
                </h1>

                <Button
                    size="md"
                    color="primary"
                    className="ml-auto"
                    isDisabled={!canSave}
                    onClick={handleSave}
                >
                    Salvar
                </Button>
            </header>

            <main className="flex flex-1 flex-col items-center gap-6 py-4 pb-10 md:px-6">
                {emUso && (
                    <div className="flex w-full max-w-2xl items-center gap-3.5 rounded-2xl bg-secondary p-4 ring-1 ring-border-secondary">
                        <FeaturedIcon icon={InfoCircle} color="warning" theme="light" size="md" />
                        <div className="flex flex-col">
                            <p className="text-sm font-semibold text-primary">Esta pergunta está em uso</p>
                            <p className="text-sm text-tertiary">
                                Não será possível deletar, apenas editar a pergunta.
                            </p>
                        </div>
                    </div>
                )}

                <section className="flex w-full max-w-2xl flex-col rounded-2xl bg-secondary ring-1 ring-border-secondary">
                    <div className="flex flex-col gap-5 p-5">
                        <div className="flex flex-col gap-1.5">
                            <Label isRequired>Título da pergunta</Label>
                            <Input
                                aria-label="Título da pergunta"
                                placeholder="Digite"
                                value={titulo}
                                onChange={setTitulo}
                            />
                        </div>

                        <Select
                            label="Tipo da resposta"
                            isRequired
                            placeholder="Selecione"
                            items={TIPO_ITEMS}
                            selectedKey={tipo}
                            onSelectionChange={(key) => setTipo(key as TipoResposta)}
                        >
                            {(item) => (
                                <Select.Item id={item.id} icon={item.icon}>
                                    {item.label}
                                </Select.Item>
                            )}
                        </Select>
                    </div>

                    {isEditing && (
                        <div className="flex justify-end border-t border-secondary p-4">
                            <Button
                                size="md"
                                color="secondary"
                                iconLeading={Trash01}
                                isDisabled={emUso}
                                onClick={handleDelete}
                            >
                                Excluir pergunta
                            </Button>
                        </div>
                    )}
                </section>
            </main>
        </div>
        </BackstageLayout>
    );
}
