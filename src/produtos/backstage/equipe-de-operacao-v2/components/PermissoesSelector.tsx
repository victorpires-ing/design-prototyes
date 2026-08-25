import { Checkbox } from "@/components/base/checkbox/checkbox";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { cx } from "@/utils/cx";
import { PERMISSOES, type CotaModo, type Permissao } from "../data/equipe-v2-store";

interface Props {
    /** Permissões concedidas e o tipo de cota escolhido em cada uma. */
    modos: Partial<Record<Permissao, CotaModo>>;
    onToggle: (permissao: Permissao, ligada: boolean) => void;
    onModo: (permissao: Permissao, modo: CotaModo) => void;
    /** Ação primária do passo, abaixo dos cartões. */
    advanceButton?: React.ReactNode;
}

const MODOS: Array<{ id: CotaModo; label: string; descricao: string }> = [
    { id: "grupo", label: "Cota por grupo", descricao: "Um limite só, válido para todos os itens." },
    { id: "item", label: "Cota por item", descricao: "Um limite para cada item liberado." },
];

/** Passo 1 — o que o grupo pode fazer e, em cada permissão, como a cota é dividida. */
export function PermissoesSelector({ modos, onToggle, onModo, advanceButton }: Props) {
    return (
        <div className="flex w-full flex-col gap-6">
            <div className="flex flex-col gap-1">
                <h2 className="text-lg font-semibold text-primary">O que este grupo pode fazer?</h2>
                <p className="text-sm text-tertiary">Para cada permissão, escolha também como a cota será dividida.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                {PERMISSOES.map((permissao) => {
                    const modo = modos[permissao.id];
                    const ligada = Boolean(modo);

                    return (
                        <section
                            key={permissao.id}
                            className={cx(
                                "flex flex-col gap-4 rounded-2xl bg-secondary p-5 ring-1 transition duration-100 ease-linear",
                                ligada ? "ring-brand" : "ring-border-secondary",
                            )}
                        >
                            {/* O cabeçalho é o alvo de clique; o tipo de cota tem os próprios botões. */}
                            <label className="flex cursor-pointer flex-col gap-3">
                                <span className="flex items-start justify-between gap-3">
                                    <FeaturedIcon icon={permissao.icon} color="gray" theme="modern" size="lg" className="shrink-0" />
                                    <Checkbox
                                        size="md"
                                        isSelected={ligada}
                                        onChange={(on) => onToggle(permissao.id, on)}
                                        aria-label={`Permitir ${permissao.label}`}
                                    />
                                </span>
                                <span className="flex flex-col gap-0.5">
                                    <span className="text-md font-semibold text-primary">{permissao.label}</span>
                                    <span className="text-sm text-tertiary">{permissao.descricao}</span>
                                </span>
                            </label>

                            {ligada && (
                                <div className="mt-auto flex flex-col gap-2 border-t border-secondary pt-4">
                                    <span className="text-sm font-medium text-secondary">Tipo de cota</span>
                                    {MODOS.map((opcao) => (
                                        <button
                                            key={opcao.id}
                                            type="button"
                                            aria-pressed={modo === opcao.id}
                                            onClick={() => onModo(permissao.id, opcao.id)}
                                            className={cx(
                                                "flex flex-col gap-0.5 rounded-lg bg-primary p-3 text-left ring-1 transition duration-100 ease-linear hover:bg-primary_hover",
                                                modo === opcao.id ? "ring-brand" : "ring-border-secondary",
                                            )}
                                        >
                                            <span className="text-sm font-medium text-primary">{opcao.label}</span>
                                            <span className="text-sm text-tertiary">{opcao.descricao}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </section>
                    );
                })}
            </div>

            {advanceButton && <div className="flex md:justify-end">{advanceButton}</div>}
        </div>
    );
}
