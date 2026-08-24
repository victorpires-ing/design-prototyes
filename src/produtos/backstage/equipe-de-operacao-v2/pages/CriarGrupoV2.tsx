import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Progress } from "@/components/application/progress-steps/progress-steps";
import type { ProgressIconType } from "@/components/application/progress-steps/progress-types";
import { Input } from "@/components/base/input/input";
import { BackstageLayout } from "../../components/Backstage";
import { ConfiguracaoGrupo } from "../components/ConfiguracaoGrupo";
import { OperadoresEditor, OperadoresList } from "../components/OperadoresEditor";
import { PermissoesSelector } from "../components/PermissoesSelector";
import { ResumoPermissoes } from "../components/ResumoPermissao";
import { WizardHeader } from "../components/WizardHeader";
import { COTA_MAXIMA } from "../data/equipe-data";
import { PERMISSOES, useEquipeV2, type CotaModo, type CotaPermissao, type Permissao } from "../data/equipe-v2-store";
import { toastSucesso } from "../utils/toast";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NOME_MAX = 20;

const TITULOS = ["Permissões", "Cotas e itens", "Operadores", "Revisão"];

export function CriarGrupoV2() {
    const navigate = useNavigate();
    const { criarGrupo, nomeDisponivel } = useEquipeV2();

    const [step, setStep] = useState(0);
    const [concedidasSet, setConcedidas] = useState<Set<Permissao>>(new Set());
    const [modo, setModo] = useState<CotaModo>("compartilhada");
    const [cotas, setCotas] = useState<Partial<Record<Permissao, number>>>({});
    const [itens, setItens] = useState<string[]>([]);
    const [operadores, setOperadores] = useState<string[]>([]);
    const [nome, setNome] = useState("");

    const concedidas = PERMISSOES.map((p) => p.id).filter((id) => concedidasSet.has(id));

    const permissoesValidas = concedidas.length > 0;
    const cotasValidas = concedidas.every((id) => (cotas[id] ?? 0) > 0 && (cotas[id] ?? 0) <= COTA_MAXIMA);
    const configValida = cotasValidas && itens.length > 0;
    const operadoresValidos = operadores.length > 0 && operadores.every((e) => EMAIL_RE.test(e));
    const nomeUnico = nomeDisponivel(nome);
    const nomeValido = nome.trim().length > 0 && nome.trim().length <= NOME_MAX && nomeUnico;

    const podeAvancar = step === 0 ? permissoesValidas : step === 1 ? configValida : step === 2 ? operadoresValidos : nomeValido;

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
        setConcedidas((atual) => {
            const proximo = new Set(atual);
            if (ligada) proximo.add(permissao);
            else proximo.delete(permissao);
            return proximo;
        });

    const voltar = () => {
        if (step === 0) return navigate("/backstage/equipe-de-operacao/v2");
        setStep((s) => s - 1);
    };

    const avancar = () => {
        if (!podeAvancar) return;
        if (step < 3) return setStep((s) => s + 1);
        criarGrupo({
            nome: nome.trim(),
            operadores,
            modo,
            itens,
            cotas: Object.fromEntries(concedidas.map((id) => [id, cotas[id] ?? 0])),
        });
        toastSucesso("Grupo de operação criado", `“${nome.trim()}” já pode operar dentro das cotas definidas.`);
        navigate("/backstage/equipe-de-operacao/v2");
    };

    /** Cotas concedidas no formato do resumo (ainda sem consumo). */
    const resumoPermissoes: Partial<Record<Permissao, CotaPermissao>> = Object.fromEntries(
        concedidas.map((id) => [id, { cota: cotas[id] ?? 0, usadas: 0 }]),
    );

    return (
        <BackstageLayout activeSection="equipe-de-operacao" activeItem="grupos-operacao">
            <div className="flex min-w-0 flex-1 flex-col">
                <WizardHeader
                    title="Criar grupo"
                    onBack={voltar}
                    actionLabel={step === 3 ? "Criar grupo" : "Avançar"}
                    onAction={avancar}
                    actionDisabled={!podeAvancar}
                />

                <main className="flex flex-1 flex-col items-center gap-8 px-6 pb-10">
                    <Progress.IconsWithText
                        items={steps}
                        type="number"
                        size="sm"
                        orientation="horizontal"
                        className="max-w-[760px] max-md:hidden"
                    />
                    <Progress.IconsWithText items={steps} type="number" size="sm" orientation="vertical" className="w-full md:hidden" />

                    <section className="w-full max-w-[1000px]">
                        {step === 0 && <PermissoesSelector concedidas={concedidasSet} onToggle={togglePermissao} />}

                        {step === 1 && (
                            <ConfiguracaoGrupo
                                concedidas={concedidas}
                                modo={modo}
                                onModo={setModo}
                                cotas={cotas}
                                onCota={(permissao, cota) => setCotas((atual) => ({ ...atual, [permissao]: cota }))}
                                itens={itens}
                                onItens={setItens}
                            />
                        )}

                        {step === 2 && (
                            <div className="mx-auto max-w-[720px]">
                                <OperadoresEditor value={operadores} onChange={setOperadores} />
                            </div>
                        )}

                        {step === 3 && (
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

                                <ResumoPermissoes permissoes={resumoPermissoes} concedidas={concedidas} modo={modo} itens={itens} />
                            </div>
                        )}
                    </section>
                </main>
            </div>
        </BackstageLayout>
    );
}
