import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Progress } from "@/components/application/progress-steps/progress-steps";
import type { ProgressIconType } from "@/components/application/progress-steps/progress-types";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { BackstageLayout } from "../../components/Backstage";
import { ConfiguracaoGrupo, type RascunhoPermissao } from "../components/ConfiguracaoGrupo";
import { OperadoresEditor, OperadoresList } from "../components/OperadoresEditor";
import { PermissoesSelector } from "../components/PermissoesSelector";
import { ResumoPermissoes } from "../components/ResumoPermissao";
import { WizardHeader } from "../components/WizardHeader";
import { COTA_MAXIMA } from "../data/equipe-data";
import { PERMISSOES, useEquipeV2, type CotaModo, type CotaPermissao, type Permissao } from "../data/equipe-v2-store";
import { toastSucesso } from "../utils/toast";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NOME_MAX = 20;

/** O stepper só começa depois que o tipo do grupo está definido. */
const TITULOS = ["Cotas e itens", "Operadores", "Revisão"];

export function CriarGrupoV2() {
    const navigate = useNavigate();
    const { criarGrupo, nomeDisponivel } = useEquipeV2();

    /** Fase 0 = escolha das permissões; depois entra no stepper (0..2). */
    const [emWizard, setEmWizard] = useState(false);
    const [step, setStep] = useState(0);
    /** Cada permissão concedida guarda modo, itens e limites próprios. */
    const [configs, setConfigs] = useState<Partial<Record<Permissao, RascunhoPermissao>>>({});
    const [operadores, setOperadores] = useState<string[]>([]);
    const [nome, setNome] = useState("");

    const concedidas = PERMISSOES.map((p) => p.id).filter((id) => Boolean(configs[id]));
    const modos = Object.fromEntries(concedidas.map((id) => [id, configs[id]!.modo])) as Partial<Record<Permissao, CotaModo>>;

    const permissoesValidas = concedidas.length > 0;
    /** Cada permissão precisa de itens e de limite: um número por grupo, ou um por item. */
    const configValida = concedidas.every((id) => {
        const config = configs[id]!;
        if (config.itens.length === 0) return false;
        if (config.modo === "item") {
            return config.itens.every((itemId) => {
                const cota = config.porItem[itemId] ?? 0;
                return cota > 0 && cota <= COTA_MAXIMA;
            });
        }
        return config.cota > 0 && config.cota <= COTA_MAXIMA;
    });
    const operadoresValidos = operadores.length > 0 && operadores.every((e) => EMAIL_RE.test(e));
    const nomeUnico = nomeDisponivel(nome);
    const nomeValido = nome.trim().length > 0 && nome.trim().length <= NOME_MAX && nomeUnico;

    const podeAvancar = !emWizard ? permissoesValidas : step === 0 ? configValida : step === 1 ? operadoresValidos : nomeValido;

    const steps: ProgressIconType[] = useMemo(
        () =>
            TITULOS.map((title, i) => ({
                title,
                description: "",
                status: i < step ? "complete" : i === step ? "current" : "incomplete",
            })),
        [step],
    );

    const togglePermissao = (permissao: Permissao, ligada: boolean) =>
        setConfigs((atual) => {
            const proximo = { ...atual };
            // Ligar já assume a cota por grupo — o caso mais comum.
            if (ligada) proximo[permissao] = { modo: "grupo", itens: [], cota: 0, porItem: {} };
            else delete proximo[permissao];
            return proximo;
        });

    const alterar = (permissao: Permissao, patch: Partial<RascunhoPermissao>) =>
        setConfigs((atual) => ({ ...atual, [permissao]: { ...atual[permissao]!, ...patch } }));

    const voltar = () => {
        if (!emWizard) return navigate("/backstage/equipe-de-operacao/v2");
        if (step === 0) return setEmWizard(false);
        setStep((s) => s - 1);
    };

    const avancar = () => {
        if (!podeAvancar) return;
        if (!emWizard) return setEmWizard(true);
        if (step < 2) return setStep((s) => s + 1);
        criarGrupo({ nome: nome.trim(), operadores, permissoes: Object.fromEntries(concedidas.map((id) => [id, configs[id]!])) });
        toastSucesso("Grupo de operação criado", `“${nome.trim()}” já pode operar dentro das cotas definidas.`);
        navigate("/backstage/equipe-de-operacao/v2");
    };

    /** Cotas concedidas no formato do resumo (ainda sem consumo). */
    const resumoPermissoes: Partial<Record<Permissao, CotaPermissao>> = Object.fromEntries(
        concedidas.map((id) => [id, { ...configs[id]!, usadas: 0 }]),
    );

    return (
        <BackstageLayout activeSection="equipe-de-operacao" activeItem="grupos-operacao">
            <div className="flex min-w-0 flex-1 flex-col">
                <WizardHeader
                    title="Criar grupo"
                    onBack={voltar}
                    actionLabel={!emWizard || step === 0 ? undefined : step === 2 ? "Criar grupo" : "Avançar"}
                    onAction={!emWizard || step === 0 ? undefined : avancar}
                    actionDisabled={!podeAvancar}
                />

                <main className="flex flex-1 flex-col items-center gap-8 px-6 pb-10">
                    {!emWizard ? (
                        <section className="w-full max-w-[1000px]">
                            <PermissoesSelector
                                modos={modos}
                                onToggle={togglePermissao}
                                onModo={(permissao, modo) => alterar(permissao, { modo })}
                                advanceButton={
                                    <Button size="md" color="primary" isDisabled={!podeAvancar} onClick={avancar} className="max-md:w-full">
                                        Avançar
                                    </Button>
                                }
                            />
                        </section>
                    ) : (
                        <>
                            <Progress.IconsWithText
                                items={steps}
                                type="number"
                                size="sm"
                                orientation="horizontal"
                                className="max-w-[640px] max-md:hidden"
                            />
                            <Progress.IconsWithText
                                items={steps}
                                type="number"
                                size="sm"
                                orientation="vertical"
                                className="w-full md:hidden"
                            />

                            <section className="w-full max-w-[1100px]">
                                {step === 0 && (
                                    <ConfiguracaoGrupo
                                        concedidas={concedidas}
                                        configs={configs}
                                        onItem={(permissao, itemId, liberado) => {
                                            const atual = configs[permissao]!;
                                            alterar(permissao, {
                                                itens: liberado ? [...atual.itens, itemId] : atual.itens.filter((i) => i !== itemId),
                                            });
                                        }}
                                        onCota={(permissao, cota) => alterar(permissao, { cota })}
                                        onCotaPorItem={(permissao, itemId, cota) =>
                                            alterar(permissao, { porItem: { ...configs[permissao]!.porItem, [itemId]: cota } })
                                        }
                                        advanceButton={
                                            <Button size="md" color="primary" isDisabled={!podeAvancar} onClick={avancar}>
                                                Avançar
                                            </Button>
                                        }
                                    />
                                )}

                                {step === 1 && (
                                    <div className="mx-auto max-w-[720px]">
                                        <OperadoresEditor value={operadores} onChange={setOperadores} />
                                    </div>
                                )}

                                {step === 2 && (
                                    <div className="mx-auto flex max-w-[860px] flex-col gap-5">
                                        <div className="flex flex-col gap-5 rounded-2xl bg-secondary p-5 ring-1 ring-border-secondary">
                                            <div className="flex flex-col gap-1.5">
                                                <Input
                                                    label="Nome do grupo"
                                                    isRequired
                                                    isInvalid={!nomeUnico || nome.trim().length > NOME_MAX}
                                                    placeholder="Ex.: Patrocinador"
                                                    value={nome}
                                                    onChange={setNome}
                                                    hint={
                                                        !nomeUnico
                                                            ? "O nome do grupo deve ser único."
                                                            : nome.trim().length > NOME_MAX
                                                              ? `O nome do grupo deve ter ${NOME_MAX} ou menos caracteres.`
                                                              : undefined
                                                    }
                                                    aria-label="Nome do grupo"
                                                />
                                                <span className="self-end text-sm text-tertiary tabular-nums">
                                                    {nome.trim().length}/{NOME_MAX}
                                                </span>
                                            </div>

                                            <div className="-mx-5 border-t border-primary" />

                                            <div className="flex flex-col gap-2">
                                                <span className="text-sm font-semibold text-secondary">Operadores</span>
                                                <OperadoresList value={operadores} onChange={setOperadores} />
                                            </div>
                                        </div>

                                        <ResumoPermissoes permissoes={resumoPermissoes} concedidas={concedidas} />
                                    </div>
                                )}
                            </section>
                        </>
                    )}
                </main>
            </div>
        </BackstageLayout>
    );
}
