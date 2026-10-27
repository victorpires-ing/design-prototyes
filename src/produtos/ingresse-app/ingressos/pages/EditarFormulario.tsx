import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { AppShell } from "../../components/AppShell";
import { StatusBar } from "../../components/StatusBar";
import { fecharToast, mostrarToast } from "../../components/AppToast";
import { CampoFormulario, respostaVazia } from "../components/CampoFormulario";
import { getCombo, getEvento, tituloFormulario } from "../data/eventos";
import { getFormulario, mesmaResposta, salvarFormulario } from "../data/formulario-store";

export function EditarFormulario() {
    const navigate = useNavigate();
    const { eventId, comboId } = useParams();
    const evento = getEvento(eventId);
    const combo = getCombo(eventId, comboId);

    const perguntas = getFormulario(comboId, combo?.questionario ?? []);

    const [respostas, setRespostas] = useState<Record<string, string>>(() =>
        Object.fromEntries(perguntas.map((q) => [q.pergunta, q.resposta])),
    );

    const voltar = () => navigate(`/ingresse-app/ingressos/combo/${eventId}/${comboId}`);
    /** Sair sem salvar leva junto qualquer aviso desta tela: ele não pertence à tela de destino. */
    const sair = () => {
        fecharToast();
        voltar();
    };

    if (!combo || perguntas.length === 0) {
        return (
            <AppShell showTabBar={false}>
                <div className="flex min-h-full items-center justify-center bg-secondary p-8 text-center text-sm text-tertiary">Formulário não encontrado.</div>
            </AppShell>
        );
    }

    const faltando = perguntas.filter((q) => respostaVazia(q, respostas[q.pergunta] ?? ""));
    const alteradas = perguntas.filter((q) => !mesmaResposta(q, respostas[q.pergunta] ?? q.resposta, q.resposta));
    const podeSalvar = faltando.length === 0 && alteradas.length > 0;

    const salvar = () => {
        const { salvas, conflitos } = salvarFormulario(comboId, perguntas, respostas);

        if (conflitos.length > 0) {
            // A opção acabou enquanto a pessoa preenchia: a tela volta a refletir o que o store aceitou.
            setRespostas(Object.fromEntries(getFormulario(comboId, combo.questionario ?? []).map((q) => [q.pergunta, q.resposta])));

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
        voltar();
    };

    return (
        <AppShell showTabBar={false}>
            <div className="flex min-h-full flex-col bg-secondary">
                <StatusBar tone="dark" />

                <div className="px-5 pt-2">
                    <button
                        type="button"
                        aria-label="Voltar"
                        onClick={sair}
                        className="flex size-10 items-center justify-center rounded-lg bg-primary text-fg-secondary ring-1 ring-border-secondary transition duration-100 ease-linear active:bg-secondary"
                    >
                        <ArrowLeft className="size-5" />
                    </button>
                    <h1 className="pt-4 text-xl font-bold text-primary">Editar {tituloFormulario(evento.tipo)}</h1>
                </div>

                <div className="flex flex-1 flex-col px-5 pt-4 pb-8">
                    <p className="text-sm text-tertiary">Altere as respostas que você enviou na inscrição. Elas valem para {combo.nome}.</p>

                    {/* Inscrição a que o formulário pertence */}
                    <div className="mt-4 rounded-2xl bg-primary p-4 ring-1 ring-border-secondary">
                        <p className="text-sm font-medium tracking-wide text-tertiary uppercase">{evento.title}</p>
                        <p className="mt-1 text-sm font-bold text-primary">{combo.nome}</p>
                        <p className="mt-0.5 text-sm text-tertiary">{combo.dataEvento}</p>
                    </div>

                    <div className="mt-5 flex flex-col gap-5">
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

                    <Button size="lg" color="primary" className="mt-6 w-full rounded-full" isDisabled={!podeSalvar} onClick={salvar}>
                        Salvar alterações
                    </Button>
                    <Button size="lg" color="secondary" className="mt-3 w-full rounded-full" onClick={sair}>
                        Cancelar
                    </Button>
                </div>
            </div>
        </AppShell>
    );
}