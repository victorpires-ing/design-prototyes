import { AnimatePresence, motion } from "motion/react";
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
    { id: "uso", label: "Por uso", descricao: "O grupo poderá emitir qualquer item até atingir o limite de usos." },
    { id: "item", label: "Por item", descricao: "Cada item terá seu próprio limite de emissões." },
];

/**
 * Passo 1 — o que o grupo pode fazer e, em cada permissão, como a cota é dividida.
 *
 * Cartões empilhados, no mesmo padrão da chave de acesso: abrir um deles empurra
 * o de baixo em vez de esticar uma coluna e desalinhar as outras duas.
 */
export function PermissoesSelector({ modos, onToggle, onModo, erro, advanceButton }: Props) {
    return (
        <div className="flex w-full flex-col gap-6">
            <div className="flex flex-col gap-1">
                <h2 className="text-lg font-semibold text-primary">O que este grupo pode fazer?</h2>
                <p className="text-sm text-tertiary">Marque as ações liberadas e escolha como distribuir a cota de cada uma.</p>
            </div>

            <div className="flex flex-col gap-3">
                {PERMISSOES.map((permissao) => {
                    const modo = modos[permissao.id];
                    const ligada = Boolean(modo);

                    return (
                        <div
                            key={permissao.id}
                            className={cx(
                                "w-full rounded-xl bg-primary px-5 py-4 ring-inset transition duration-100 ease-linear",
                                ligada ? "ring-2 ring-brand" : "ring-1 ring-border-primary",
                            )}
                        >
                            <label className="flex cursor-pointer items-start gap-3">
                                <span className="flex h-6 items-center">
                                    <Checkbox
                                        size="md"
                                        isSelected={ligada}
                                        onChange={(on) => onToggle(permissao.id, on)}
                                        aria-label={permissao.acao}
                                    />
                                </span>
                                <span className="flex min-w-0 flex-col gap-0.5">
                                    <span className="flex items-center gap-2">
                                        <permissao.icon
                                            className={cx(
                                                "size-5 shrink-0 transition-colors duration-100 ease-linear",
                                                ligada ? "text-fg-brand-primary" : "text-fg-quaternary",
                                            )}
                                            aria-hidden="true"
                                        />
                                        <span className="text-md font-semibold text-primary">{permissao.acao}</span>
                                    </span>
                                    <span className="text-sm text-tertiary">{permissao.descricao}</span>
                                </span>
                            </label>

                            <AnimatePresence initial={false}>
                                {ligada && (
                                    <motion.div
                                        key="cota"
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.25, ease: "easeOut" }}
                                        className="overflow-hidden"
                                    >
                                        {/* pb-1: o `overflow-hidden` da animação cortaria o anel do radio marcado. */}
                                        <div className="mt-4 flex flex-col gap-2 pb-1 sm:pl-9">
                                            <span className="text-sm font-medium text-secondary">Como distribuir a cota</span>
                                            {/* Escolha exclusiva: radio, não botões que imitam radio. */}
                                            <RadioGroup
                                                aria-label={`Como distribuir a cota de ${permissao.label}`}
                                                value={modo ?? null}
                                                onChange={(value) => onModo(permissao.id, value as CotaModo)}
                                                className="gap-2 sm:flex-row"
                                            >
                                                {MODOS.map((opcao) => (
                                                    <label
                                                        key={opcao.id}
                                                        className={cx(
                                                            "flex flex-1 cursor-pointer items-start gap-3 rounded-lg bg-secondary p-3 ring-1 transition duration-100 ease-linear hover:bg-secondary_hover",
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
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
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
