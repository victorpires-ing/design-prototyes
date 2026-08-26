import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
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
import { PERMISSAO_META, PERMISSOES, useEquipeV2, type CotaModo, type CotaPermissao, type Permissao } from "../data/equipe-v2-store";
import { toastSucesso } from "../utils/toast";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NOME_MAX = 20;

/** O stepper só começa depois que o tipo do grupo está definido. */
const TITULOS = ["Cotas e itens", "Operadores", "Revisão"];

export function CriarGrupoV2() {
    const navigate = useNavigate();
    const { grupoId } = useParams();
    const { criarGrupo, atualizarGrupo, getGrupo, nomeDisponivel } = useEquipeV2();
    /** Mesma tela serve para criar e para editar um grupo existente. */
    const emEdicao = Boolean(grupoId);
    const grupo = grupoId ? getGrupo(grupoId) : undefined;

    /** Fase 0 = escolha das permissões; depois entra no stepper (0..2). */
    const [emWizard, setEmWizard] = useState(emEdicao);
    const [step, setStep] = useState(0);
    /** Cada permissão concedida guarda modo, itens e limites próprios. */
    const [configs, setConfigs] = useState<Partial<Record<Permissao, RascunhoPermissao>>>(() =>
        grupo
            ? (Object.fromEntries(
                  (Object.entries(grupo.permissoes) as Array<[Permissao, CotaPermissao]>).map(([id, c]) => [
                      id,
                      { modo: c.modo, itens: c.itens, cota: c.cota, porItem: c.porItem },
                  ]),
              ) as Partial<Record<Permissao, RascunhoPermissao>>)
            : {},
    );
    const [operadores, setOperadores] = useState<string[]>(grupo?.operadores ?? []);
    const [nome, setNome] = useState(grupo?.nome ?? "");
    /** Erros só aparecem depois da primeira tentativa de avançar. */
    const [tentou, setTentou] = useState(false);

    const concedidas = PERMISSOES.map((p) => p.id).filter((id) => Boolean(configs[id]));
    const modos = Object.fromEntries(concedidas.map((id) => [id, configs[id]!.modo])) as Partial<Record<Permissao, CotaModo>>;

    const permissoesValidas = concedidas.length > 0;

    /** O que falta em cada permissão — em texto, para o painel mostrar no lugar do número. */
    const problemas: Partial<Record<Permissao, string>> = {};
    for (const id of concedidas) {
        const config = configs[id]!;
        const porItem = config.modo === "item";
        const nome = PERMISSAO_META[id].label;
        // A mensagem nomeia a permissão: no mobile ela aparece longe do campo.
        if (config.itens.length === 0) {
            problemas[id] = porItem ? `Informe a quantidade de ao menos um item para ${nome}.` : `Marque ao menos um item para ${nome}.`;
        } else if (porItem) {
            const acimaDoMaximo = config.itens.some((itemId) => (config.porItem[itemId] ?? 0) > COTA_MAXIMA);
            if (acimaDoMaximo) problemas[id] = `Nenhum item de ${nome} pode passar de ${COTA_MAXIMA.toLocaleString("pt-BR")}.`;
        } else if (config.cota <= 0) problemas[id] = `Informe a cota de ${nome}.`;
        else if (config.cota > COTA_MAXIMA) problemas[id] = `A cota de ${nome} não pode passar de ${COTA_MAXIMA.toLocaleString("pt-BR")}.`;
    }
    const configValida = Object.keys(problemas).length === 0;

    const operadoresValidos = operadores.length > 0 && operadores.every((e) => EMAIL_RE.test(e));
    const nomeUnico = nomeDisponivel(nome, grupoId);
    const nomeValido = nome.trim().length > 0 && nome.trim().length <= NOME_MAX && nomeUnico;

    const etapaValida = !emWizard ? permissoesValidas : step === 0 ? configValida : step === 1 ? operadoresValidos : nomeValido;

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
        setTentou(false);
        if (!emWizard) return navigate("/backstage/equipe-de-operacao/v2");
        // Em edição a primeira tela do stepper é o começo: não há escolha de permissões antes.
        if (step === 0) return emEdicao ? navigate(`/backstage/equipe-de-operacao/v2/${grupoId}`) : setEmWizard(false);
        setStep((s) => s - 1);
    };

    /**
     * O botão nunca fica desabilitado: clicar com algo pendente revela o que
     * falta. Botão morto não diz o motivo e trava quem não achou o campo.
     */
    const avancar = () => {
        if (!etapaValida) return setTentou(true);
        setTentou(false);
        if (!emWizard) return setEmWizard(true);
        if (step < 2) return setStep((s) => s + 1);

        const permissoes = Object.fromEntries(concedidas.map((id) => [id, configs[id]!]));
        if (grupo) {
            atualizarGrupo(grupo.id, {
                nome: nome.trim(),
                operadores,
                permissoes: Object.fromEntries(
                    concedidas.map((id) => [id, { ...configs[id]!, usadas: grupo.permissoes[id]?.usadas ?? 0 }]),
                ),
            });
            toastSucesso("Alterações salvas", `As novas cotas de “${nome.trim()}” já valem para os operadores.`);
            return navigate(`/backstage/equipe-de-operacao/v2/${grupo.id}`);
        }

        criarGrupo({ nome: nome.trim(), operadores, permissoes });
        toastSucesso(
            "Grupo criado",
            `“${nome.trim()}” já está valendo para ${operadores.length} ${operadores.length === 1 ? "operador" : "operadores"}.`,
        );
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
                    title={emEdicao ? "Editar grupo" : "Criar grupo"}
                    onBack={voltar}
                    actionLabel={
                        !emWizard || step === 0 ? undefined : step === 2 ? (emEdicao ? "Salvar alterações" : "Criar grupo") : "Revisar"
                    }
                    onAction={!emWizard || step === 0 ? undefined : avancar}
                />

                <main className="flex flex-1 flex-col items-center gap-8 px-6 pb-10">
                    {!emWizard ? (
                        <section className="w-full max-w-[1000px]">
                            <PermissoesSelector
                                modos={modos}
                                onToggle={togglePermissao}
                                onModo={(permissao, modo) => alterar(permissao, { modo })}
                                erro={tentou && !permissoesValidas ? "Marque ao menos uma permissão para continuar." : undefined}
                                advanceButton={
                                    <Button size="md" color="primary" onClick={avancar} className="max-md:w-full">
                                        Definir cotas e itens
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
                                        onCotaPorItem={(permissao, itemId, cota) => {
                                            // Sem checkbox nessa coluna: quantidade acima de zero é o que libera o item.
                                            const atual = configs[permissao]!;
                                            alterar(permissao, {
                                                porItem: { ...atual.porItem, [itemId]: cota },
                                                itens:
                                                    cota > 0
                                                        ? [...new Set([...atual.itens, itemId])]
                                                        : atual.itens.filter((i) => i !== itemId),
                                            });
                                        }}
                                        erros={tentou ? problemas : undefined}
                                        advanceButton={
                                            <Button size="md" color="primary" onClick={avancar}>
                                                Escolher operadores
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
                                                            ? "Já existe um grupo com esse nome."
                                                            : nome.trim().length > NOME_MAX
                                                              ? `Use até ${NOME_MAX} caracteres.`
                                                              : "É assim que o grupo aparece na lista e nos relatórios."
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
