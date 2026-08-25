import { InfoCircle, Ticket02, Trash01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { cx } from "@/utils/cx";
import { cartLinesByKind, cartTotal, type Cart, type CartKind, type CartLine } from "../data/carrinho";
import { formatBRL } from "../data/catalogo";
import { ComboComposition } from "./ItemsStep";

const GROUPS: Array<{ kind: CartKind; label: string }> = [
    { kind: "ingresso", label: "Ingressos" },
    { kind: "produto", label: "Produtos" },
    { kind: "combo", label: "Combos" },
];

interface ResumoPanelProps {
    cart: Cart;
    onRemove: (id: string) => void;
    onRemoveAll: () => void;
    /** Mostra o rodapé com o total a pagar. Default: true. */
    showTotal?: boolean;
    /** Ação primária do passo — fecha o resumo no desktop. */
    advanceButton?: React.ReactNode;
    className?: string;
}

/** Coluna de resumo do passo 2 (desktop) e conteúdo da gaveta de resumo (mobile). */
export function ResumoPanel({ cart, onRemove, onRemoveAll, showTotal = true, advanceButton, className }: ResumoPanelProps) {
    const groups = GROUPS.map((group) => ({ ...group, lines: cartLinesByKind(cart, group.kind) })).filter(
        (group) => group.lines.length > 0,
    );

    if (groups.length === 0) {
        return (
            <div
                className={cx(
                    "flex min-h-[408px] flex-col items-center justify-center gap-4 rounded-xl bg-primary p-6 ring-1 ring-border-secondary",
                    className,
                )}
            >
                <FeaturedIcon icon={Ticket02} color="brand" theme="outline" size="lg" />
                <p className="max-w-40 text-center text-sm text-tertiary">Você ainda não selecionou itens</p>
            </div>
        );
    }

    return (
        <div className={cx("flex min-h-[408px] flex-col rounded-xl bg-primary ring-1 ring-border-secondary", className)}>
            <div className="flex items-center justify-between gap-3 px-4 py-3">
                <h2 className="text-sm font-semibold text-primary">Resumo</h2>
                <Button size="sm" color="link-gray" onClick={onRemoveAll}>
                    Remover todos
                </Button>
            </div>

            <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 pb-4">
                {groups.map((group) => (
                    <div key={group.kind} className="flex flex-col gap-2">
                        <p className="text-sm text-tertiary">{group.label}</p>
                        {group.lines.map((line) => (
                            <ResumoLine key={line.id} line={line} onRemove={() => onRemove(line.id)} />
                        ))}
                    </div>
                ))}
            </div>

            {showTotal && (
                <div className="flex flex-col gap-3 border-t border-secondary px-4 py-4">
                    <div className="flex items-center gap-1.5">
                        <p className="text-md font-semibold text-primary">{formatBRL(cartTotal(cart))}</p>
                        <span className="text-sm text-tertiary">+ taxas</span>
                        <InfoCircle className="size-4 text-fg-quaternary" aria-hidden="true" />
                    </div>
                    {/* A ação fica junto do total, onde a decisão de seguir é tomada. */}
                    {advanceButton && <div className="flex flex-col [&>*]:w-full">{advanceButton}</div>}
                </div>
            )}
        </div>
    );
}

const ResumoLine = ({ line, onRemove }: { line: CartLine; onRemove: () => void }) => (
    <div className="flex items-start gap-2 rounded-lg bg-secondary p-3">
        <span className="text-sm font-semibold tabular-nums text-primary">{line.quantity}</span>
        <div className="flex min-w-0 flex-1 flex-col">
            <p className="text-sm font-semibold text-primary">{line.name}</p>
            {line.meta && <p className="text-sm text-tertiary">{line.meta}</p>}
            {line.date && <p className="text-sm text-quaternary">{line.date}</p>}
            {line.composicao && <ComboComposition entries={line.composicao} />}
        </div>
        <button
            type="button"
            onClick={onRemove}
            aria-label={`Remover ${line.name} do resumo`}
            className="shrink-0 rounded-md p-1 text-fg-quaternary transition duration-100 ease-linear hover:text-fg-error-secondary"
        >
            <Trash01 className="size-4" aria-hidden="true" />
        </button>
    </div>
);
