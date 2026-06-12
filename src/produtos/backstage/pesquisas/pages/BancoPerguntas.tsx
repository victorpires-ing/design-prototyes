import { useState } from "react";
import { Edit01, MessageQuestionCircle, Plus, Trash01 } from "@untitledui/icons";
import { toast } from "sonner";
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

export function BancoPerguntas() {
    const { perguntas, togglePergunta, removePergunta, countIngressosDaPergunta } = usePesquisas();
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
        toast.success("Pergunta excluída", { description: `“${p.titulo}” foi removida do banco.` });
    };

    return (
        <BackstageLayout activeProducer="perguntas" showEventContext={false}>
            <div className="flex min-w-0 flex-1 flex-col">
                <main className="flex flex-1 flex-col gap-6 py-6 pb-10 md:px-6">
                    {/* Header */}
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex flex-col gap-1">
                            <h1 className="text-xl font-semibold text-primary">Banco de perguntas</h1>
                            <p className="text-sm text-tertiary">Perguntas que você usa em vários eventos.</p>
                        </div>
                        {perguntas.length > 0 && (
                            <Button size="md" color="primary" iconLeading={Plus} onClick={novaPergunta}>
                                Nova pergunta
                            </Button>
                        )}
                    </div>

                    {perguntas.length === 0 ? (
                        <div className="flex flex-col items-center gap-4 rounded-xl bg-primary px-6 py-16 text-center ring-1 ring-border-secondary">
                            <FeaturedIcon icon={MessageQuestionCircle} color="brand" theme="light" size="lg" />
                            <div className="flex flex-col gap-1">
                                <h3 className="text-md font-semibold text-primary">Nenhuma pergunta ainda</h3>
                                <p className="max-w-xs text-sm text-tertiary">Crie uma pergunta para usar nos seus eventos.</p>
                            </div>
                            <Button size="md" color="primary" iconLeading={Plus} onClick={novaPergunta}>
                                Criar pergunta
                            </Button>
                        </div>
                    ) : (
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
                                                <tr
                                                    key={p.id}
                                                    className={cx(
                                                        "transition duration-100 ease-linear hover:bg-primary_hover",
                                                        !isLast && "border-b border-secondary",
                                                    )}
                                                >
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
                                                        {p.respostas > 0 ? p.respostas.toLocaleString("pt-BR") : "—"}
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        <Toggle
                                                            size="sm"
                                                            isSelected={p.ativa}
                                                            onChange={() => handleToggle(p)}
                                                            aria-label={p.ativa ? "Desativar pergunta" : "Ativar pergunta"}
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <ButtonUtility size="sm" color="tertiary" icon={Edit01} tooltip="Editar" onClick={() => editarPergunta(p)} />
                                                            <ButtonUtility
                                                                size="sm"
                                                                color="tertiary"
                                                                icon={Trash01}
                                                                tooltip={podeExcluir ? "Excluir" : "Não dá para excluir: já tem respostas"}
                                                                isDisabled={!podeExcluir}
                                                                onClick={() => setConfirmExcluir(p)}
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
                    )}
                </main>
            </div>

            <PerguntaEditorSlideout isOpen={editorOpen} onClose={() => setEditorOpen(false)} pergunta={editorPergunta} />

            <ConfirmDialog
                isOpen={confirmExcluir !== null}
                onClose={() => setConfirmExcluir(null)}
                onConfirm={() => confirmExcluir && handleExcluir(confirmExcluir)}
                title="Excluir pergunta?"
                description={
                    <>
                        “{confirmExcluir?.titulo}” será removida do banco e de todos os ingressos. Esta ação não pode ser desfeita.
                    </>
                }
                confirmLabel="Excluir pergunta"
            />
        </BackstageLayout>
    );
}
