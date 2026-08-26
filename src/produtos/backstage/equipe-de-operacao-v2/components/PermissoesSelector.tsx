import { AlertCircle } from "@untitledui/icons";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { RadioButton, RadioGroup } from "@/components/base/radio-buttons/radio-buttons";
import { cx } from "@/utils/cx";
import { PERMISSOES, type CotaModo, type Permissao } from "../data/equipe-v2-store";

interface Props {
    /** Permissões concedidas e o tipo de cota escolhido em cada uma. */
    modos: Partial<Record<Permissao, CotaModo>>;
    onToggle: (permissao: Permissao, ligada: boolean) => void;
    onModo: (permissao: Permissao, modo: CotaModo) => void;
    /** Mensagem exibida quando o usuário tenta avançar sem escolher nada. */
    erro?: string;
    /** Ação primária do passo, abaixo dos cartões. */
    advanceButton?: React.ReactNode;
}

const MODOS: Array<{ id: CotaModo; label: string; descricao: string }> = [
    { id: "grupo", label: "Uma cota para o grupo", descricao: "Ex.: 50 no total, some qualquer item." },
    { id: "item", label: "Uma cota para cada item", descricao: "Ex.: 50 de Pista e 20 de Camarote." },
];

/** Passo 1 — o que o grupo pode fazer e, em cada permissão, como a cota é dividida. */
export function PermissoesSelector({ modos, onToggle, onModo, erro, advanceButton }: Props) {
    return (
        <div className="flex w-full flex-col gap-6">
            <div className="flex flex-col gap-1">
                <h2 className="text-lg font-semibold text-primary">O que este grupo pode fazer?</h2>
                <p className="text-sm text-tertiary">Marque o que o grupo faz e escolha como a cota de cada permissão é contada.</p>
            </div>

            <div className="grid items-start gap-4 md:grid-cols-3">
                {PERMISSOES.map((permissao) => {
                    const modo = modos[permissao.id];
                    const ligada = Boolean(modo);

                    return (
                        <section
                            key={permissao.id}
                            className={cx(
                                "flex flex-col rounded-2xl bg-secondary p-5 ring-1 transition duration-100 ease-linear",
                                ligada ? "ring-brand" : "ring-border-secondary",
                            )}
                        >
                            {/*
                              O `-m-5 p-5` estica o alvo de clique para o cartão inteiro acima do
                              divisor, sem cobrir o radio de tipo de cota, que é controle próprio.
                            */}
                            <label
                                className={cx(
                                    "-mx-5 -mt-5 flex cursor-pointer flex-col gap-2 px-5 pt-5",
                                    // Fechado o alvo cobre o cartão inteiro; aberto, para antes do divisor
                                    // para não comer o respiro do bloco de cota.
                                    ligada ? "pb-1" : "-mb-5 pb-5",
                                )}
                            >
                                <span className="flex items-start justify-between gap-3">
                                    <span className="flex min-w-0 items-center gap-2">
                                        <permissao.icon
                                            className={cx(
                                                "size-5 shrink-0 transition-colors duration-100 ease-linear",
                                                ligada ? "text-fg-brand-primary" : "text-fg-quaternary",
                                            )}
                                            aria-hidden="true"
                                        />
                                        <span className="text-md font-semibold text-primary">{permissao.label}</span>
                                    </span>
                                    <Checkbox
                                        size="md"
                                        isSelected={ligada}
                                        onChange={(on) => onToggle(permissao.id, on)}
                                        aria-label={`Permitir ${permissao.label}`}
                                    />
                                </span>
                                <span className="text-sm text-tertiary">{permissao.descricao}</span>
                            </label>

                            {/*
                              Sem animar altura: `grid-template-rows` não transiciona de forma
                              confiável e o `overflow-hidden` que ela exige cortava o anel do radio
                              selecionado. A entrada é opacidade + deslocamento, que não clipa nada.
                            */}
                            {ligada && (
                                <div className="mt-4 flex flex-col gap-2 border-t border-secondary pt-4 duration-200 ease-out animate-in fade-in slide-in-from-top-1 motion-reduce:animate-none">
                                    <span className="text-sm font-medium text-secondary">Como contar a cota</span>
                                    {/* Escolha exclusiva: radio, não botões que imitam radio. */}
                                    <RadioGroup
                                        aria-label={`Tipo de cota de ${permissao.label}`}
                                        value={modo ?? null}
                                        onChange={(value) => onModo(permissao.id, value as CotaModo)}
                                        className="gap-2"
                                    >
                                        {MODOS.map((opcao) => (
                                            <label
                                                key={opcao.id}
                                                className={cx(
                                                    "flex cursor-pointer items-start gap-3 rounded-lg bg-primary p-3 ring-1 transition duration-100 ease-linear hover:bg-primary_hover",
                                                    modo === opcao.id ? "ring-brand" : "ring-border-secondary",
                                                )}
                                            >
                                                <RadioButton value={opcao.id} slot={null} aria-label={opcao.label} />
                                                <span className="flex min-w-0 flex-col gap-0.5">
                                                    <span className="text-sm font-medium text-primary">{opcao.label}</span>
                                                    <span className="text-sm text-tertiary">{opcao.descricao}</span>
                                                </span>
                                            </label>
                                        ))}
                                    </RadioGroup>
                                </div>
                            )}
                        </section>
                    );
                })}
            </div>

            {/* O botão continua clicável: o erro é que explica o que falta. */}
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-end">
                {erro && (
                    <p role="alert" className="flex items-center gap-2 text-sm text-error-primary md:mr-auto">
                        <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
                        {erro}
                    </p>
                )}
                {advanceButton}
            </div>
        </div>
    );
}
