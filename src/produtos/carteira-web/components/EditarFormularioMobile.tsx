import { useState } from "react";
import { ArrowLeft } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { CampoFormulario, respostaVazia } from "./CampoFormulario";
import { mostrarToast } from "./WebToast";
import { SAO_SILVESTRE, tituloFormulario } from "../data/sao-silvestre";
import { getFormulario, mesmaResposta, salvarFormulario } from "../data/formulario-store";

/** Edição do formulário no viewport mobile: tela cheia dentro do frame, como no app. */
export function EditarFormularioMobile({ comboId, onBack }: { comboId: string; onBack: () => void }) {
    const perguntas = getFormulario(comboId, SAO_SILVESTRE.questionario);
    const [respostas, setRespostas] = useState<Record<string, string>>(() =>
        Object.fromEntries(perguntas.map((q) => [q.pergunta, q.resposta])),
    );

    const faltando = perguntas.filter((q) => respostaVazia(q, respostas[q.pergunta] ?? ""));
    const alteradas = perguntas.filter((q) => !mesmaResposta(q, respostas[q.pergunta] ?? q.resposta, q.resposta));
    const podeSalvar = faltando.length === 0 && alteradas.length > 0;

    const salvar = () => {
        const { salvas, conflitos } = salvarFormulario(comboId, perguntas, respostas);

        if (conflitos.length > 0) {
            // A opção acabou enquanto a pessoa preenchia: a tela volta a refletir o que o store aceitou.
            setRespostas(Object.fromEntries(getFormulario(comboId, SAO_SILVESTRE.questionario).map((q) => [q.pergunta, q.resposta])));

            const primeiro = conflitos[0];
            const motivo =
                conflitos.length === 1
                    ? `Alguém levou a última unidade em "${primeiro.pergunta}". Escolha outra opção.`
                    : "Outras pessoas levaram as últimas unidades. Escolha outras opções.";
            mostrarToast(
                conflitos.length === 1 ? `"${primeiro.valor}" acabou de esgotar` : `${conflitos.length} opções acabaram de esgotar`,
                salvas.length > 0 ? `${motivo} As outras alterações foram salvas.` : motivo,
                "aviso",
            );
            return;
        }

        if (salvas.length === 0) {
            mostrarToast("Nada para salvar", "As respostas continuam iguais às que você enviou.", "aviso");
            return;
        }

        mostrarToast("Formulário atualizado", salvas.length === 1 ? `"${salvas[0]}" foi alterada.` : `${salvas.length} respostas foram alteradas.`);
        onBack();
    };

    return (
        <div className="scrollbar-hide flex-1 overflow-y-auto bg-secondary">
            <div className="mx-auto w-full max-w-md px-5 pt-6">
                <button
                    type="button"
                    aria-label="Voltar"
                    onClick={onBack}
                    className="flex size-10 items-center justify-center rounded-lg bg-primary text-fg-secondary ring-1 ring-border-secondary transition duration-100 ease-linear active:bg-secondary"
                >
                    <ArrowLeft className="size-5" />
                </button>
                <h1 className="pt-4 text-xl font-bold text-primary">Editar {tituloFormulario(SAO_SILVESTRE.tipo)}</h1>
                <p className="pt-1 text-sm text-tertiary">Altere as respostas que você enviou na inscrição.</p>
            </div>

            <div className="mx-auto w-full max-w-md px-5 pt-5 pb-8">
                <div className="flex flex-col gap-5">
                    {perguntas.map((q) => (
                        <CampoFormulario
                            key={q.pergunta}
                            pergunta={q}
                            valor={respostas[q.pergunta] ?? ""}
                            valorOriginal={q.resposta}
                            isInvalid={faltando.includes(q)}
                            onChange={(v) => setRespostas((r) => ({ ...r, [q.pergunta]: v }))}
                        />
                    ))}
                </div>

                {faltando.length > 0 && (
                    <p className="mt-5 text-sm text-error-primary">
                        {faltando.length === 1 ? "Falta responder 1 pergunta obrigatória." : `Falta responder ${faltando.length} perguntas obrigatórias.`}
                    </p>
                )}

                <Button size="lg" color="primary" className="mt-6 w-full rounded-lg" isDisabled={!podeSalvar} onClick={salvar}>
                    Salvar alterações
                </Button>
                <Button size="lg" color="secondary" className="mt-3 w-full rounded-lg" onClick={onBack}>
                    Cancelar
                </Button>
            </div>
        </div>
    );
}
