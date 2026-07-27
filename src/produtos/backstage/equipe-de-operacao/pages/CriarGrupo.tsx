import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { User01, Users01 } from "@untitledui/icons";
import { Progress } from "@/components/application/progress-steps/progress-steps";
import type { ProgressIconType } from "@/components/application/progress-steps/progress-types";
import { Input } from "@/components/base/input/input";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { BackstageLayout } from "../../components/Backstage";
import { WizardHeader } from "../components/WizardHeader";
import { ItensCotasSelector } from "../components/ItensCotasSelector";
import { OperadoresEditor, OperadoresList } from "../components/OperadoresEditor";
import { COTA_MAXIMA, ITENS_POR_ID, SESSAO_DO_ITEM } from "../data/equipe-data";
import { useEquipe, type CotaModo, type ItemCota } from "../data/equipe-store";
import { toastSucesso } from "../utils/toast";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NOME_MAX = 20;

const TITULOS = ["Itens e cotas", "Operadores", "Revisão"];

export function CriarGrupo() {
    const navigate = useNavigate();
    const { criarGrupo, nomeDisponivel } = useEquipe();

    // Fase 0 = seleção do modo de cota; depois entra no stepper (0..2).
    const [emWizard, setEmWizard] = useState(false);
    const [modo, setModo] = useState<CotaModo | null>(null);

    const [step, setStep] = useState(0);
    const [itens, setItens] = useState<ItemCota[]>([]);
    const [operadores, setOperadores] = useState<string[]>([]);
    const [nome, setNome] = useState("");

    const itensValidos = itens.length > 0 && itens.every((i) => i.cota >= 1 && i.cota <= COTA_MAXIMA);
    const operadoresValidos = operadores.length > 0 && operadores.every((e) => EMAIL_RE.test(e));
    const nomeUnico = nomeDisponivel(nome);
    const nomeValido = nome.trim().length > 0 && nome.trim().length <= NOME_MAX && nomeUnico;

    const podeAvancar = step === 0 ? itensValidos : step === 1 ? operadoresValidos : nomeValido;

    // Escolher o modo já avança para o stepper (sem confirmação).
    const escolherModo = (m: CotaModo) => {
        setModo(m);
        setEmWizard(true);
    };

    const steps: ProgressIconType[] = useMemo(
        () =>
            TITULOS.map((title, i) => ({
                title,
                description: "",
                status: i < step ? "complete" : i === step ? "current" : "incomplete",
            })),
        [step],
    );

    const voltar = () => {
        if (!emWizard) return navigate("/backstage/equipe-de-operacao");
        if (step === 0) return setEmWizard(false); // volta para a seleção de modo
        setStep((s) => s - 1);
    };

    const avancar = () => {
        if (!podeAvancar) return;
        if (step < 2) return setStep((s) => s + 1);
        criarGrupo({ nome: nome.trim(), modo: modo!, operadores, itens });
        toastSucesso("Grupo de operação criado", `“${nome.trim()}” já pode emitir itens dentro da cota definida.`);
        navigate("/backstage/equipe-de-operacao");
    };

    return (
        <BackstageLayout activeSection="equipe-de-operacao" activeItem="grupos-operacao">
            <div className="flex min-w-0 flex-1 flex-col">
                <WizardHeader
                    title="Criar grupo"
                    onBack={voltar}
                    actionLabel={emWizard ? (step === 2 ? "Criar grupo" : "Avançar") : undefined}
                    onAction={emWizard ? avancar : undefined}
                    actionDisabled={!podeAvancar}
                />
                <main className="flex flex-1 flex-col items-center gap-8 px-6 pb-10">
                    {!emWizard ? (
                        <ModoSelector onSelect={escolherModo} />
                    ) : (
                        <>
                            <Progress.IconsWithText items={steps} type="number" size="sm" orientation="horizontal" className="max-w-[640px] max-md:hidden" />
                            <Progress.IconsWithText items={steps} type="number" size="sm" orientation="vertical" className="w-full md:hidden" />

                            <section className="w-full max-w-[1000px]">
                                {step === 0 && <ItensCotasSelector value={itens} onChange={setItens} />}
                                {step === 1 && (
                                    <div className="mx-auto max-w-[720px]">
                                        <OperadoresEditor value={operadores} onChange={setOperadores} />
                                    </div>
                                )}
                                {step === 2 && <Revisao nome={nome} onNome={setNome} nomeUnico={nomeUnico} operadores={operadores} onOperadores={setOperadores} itens={itens} />}
                            </section>
                        </>
                    )}
                </main>
            </div>
        </BackstageLayout>
    );
}

/* ----------------------- Seleção do modo de cota ------------------ */

const MODOS: { id: CotaModo; icon: typeof Users01; titulo: string; descricao: string }[] = [
    { id: "compartilhada", icon: Users01, titulo: "Compartilhada", descricao: "A cota de cada item selecionado é usada em conjunto." },
    { id: "individual", icon: User01, titulo: "Individual", descricao: "Cada operador do grupo recebe a própria cota para cada item selecionado." },
];

function ModoSelector({ onSelect }: { onSelect: (m: CotaModo) => void }) {
    return (
        <div className="mt-20 flex w-full max-w-[860px] flex-col gap-8">
            <h2 className="text-center text-lg font-semibold text-primary">Como as cotas do grupo serão gerenciadas?</h2>
            <div className="flex flex-wrap justify-center gap-6">
                {MODOS.map((m) => (
                    <button
                        key={m.id}
                        type="button"
                        onClick={() => onSelect(m.id)}
                        className="flex h-[280px] w-[260px] flex-col items-center justify-center gap-4 rounded-2xl bg-secondary p-6 text-center ring-1 ring-border-secondary transition duration-100 ease-linear hover:bg-secondary_hover hover:ring-brand"
                    >
                        <FeaturedIcon icon={m.icon} color="gray" theme="modern" size="lg" />
                        <div className="flex flex-col gap-1.5">
                            <span className="text-md font-semibold text-primary">{m.titulo}</span>
                            <span className="text-sm text-tertiary">{m.descricao}</span>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}

interface RevisaoProps {
    nome: string;
    onNome: (v: string) => void;
    nomeUnico: boolean;
    operadores: string[];
    onOperadores: (emails: string[]) => void;
    itens: ItemCota[];
}

function Revisao({ nome, onNome, nomeUnico, operadores, onOperadores, itens }: RevisaoProps) {
    const excedeu = nome.trim().length > NOME_MAX;
    const erro = !nomeUnico ? "O nome do grupo deve ser único." : excedeu ? `O nome do grupo deve ter ${NOME_MAX} ou menos caracteres.` : undefined;

    return (
        <div className="mx-auto flex max-w-[860px] flex-col gap-5">
            {/* Container 1: nome + operadores */}
            <div className="flex flex-col gap-5 rounded-2xl bg-secondary p-5 ring-1 ring-border-secondary">
                <div className="flex flex-col gap-1.5">
                    <Input
                        label="Nome do grupo"
                        isRequired
                        isInvalid={!!erro}
                        placeholder="Ex.: Patrocinador"
                        value={nome}
                        onChange={onNome}
                        hint={erro}
                        aria-label="Nome do grupo"
                    />
                    <span className="self-end text-xs text-tertiary tabular-nums">{nome.trim().length}/{NOME_MAX}</span>
                </div>

                <div className="-mx-5 border-t border-primary" />

                <div className="flex flex-col gap-2">
                    <span className="text-sm font-semibold text-secondary">Operadores</span>
                    <OperadoresList value={operadores} onChange={onOperadores} />
                </div>
            </div>

            {/* Container 2: externo (claro/elevado) + container interno mais escuro com os itens */}
            <div className="flex flex-col gap-4 rounded-2xl bg-secondary p-5 ring-1 ring-border-secondary">
                <span className="text-sm font-semibold text-primary">Itens e cotas</span>
                <div className="rounded-xl bg-primary p-4 ring-1 ring-border-secondary dark:bg-[#0a0a0a]">
                    <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
                        {itens.map((v) => {
                            const item = ITENS_POR_ID[v.itemId];
                            return (
                                <div key={v.itemId} className="flex min-w-0 items-start gap-2.5">
                                    <span className="shrink-0 text-sm font-bold text-primary tabular-nums">{v.cota}x</span>
                                    <div className="flex min-w-0 flex-col">
                                        <span className="text-sm font-medium text-primary">
                                            {item?.nome}
                                            {item?.tipo ? <span className="text-tertiary"> · {item.tipo}</span> : null}
                                        </span>
                                        <span className="truncate text-xs text-tertiary">{item?.grupo} • {SESSAO_DO_ITEM[v.itemId]}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
