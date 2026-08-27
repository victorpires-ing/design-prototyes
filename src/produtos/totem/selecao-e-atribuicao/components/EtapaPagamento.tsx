import { CreditCard02, CurrencyDollarCircle, QrCode01 } from "@untitledui/icons";
import { RadioButton, RadioGroup } from "@/components/base/radio-buttons/radio-buttons";
import { Select } from "@/components/base/select/select";
import { cx } from "@/utils/cx";

export type Pagamento = "credito" | "debito" | "pix";

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/** Taxa de conveniência do canal do totem. */
export const TAXA = 0.1;

const OPCOES: Array<{ id: Pagamento; icon: typeof CreditCard02; titulo: string; descricao: string }> = [
    { id: "credito", icon: CreditCard02, titulo: "Cartão de crédito", descricao: "Passe o cartão na maquininha ao lado do totem." },
    { id: "debito", icon: CurrencyDollarCircle, titulo: "Cartão de débito", descricao: "À vista, na maquininha ao lado do totem." },
    { id: "pix", icon: QrCode01, titulo: "Pix", descricao: "O QR Code aparece aqui na tela. A confirmação é na hora." },
];

interface Props {
    valor: Pagamento | null;
    onChange: (v: Pagamento) => void;
    parcelas: number;
    onParcelas: (n: number) => void;
    /** Linhas do pedido, já com quantidade e preço unitário. */
    itens: Array<{ nome: string; sub?: string; qtd: number; preco: number }>;
    subtotal: number;
}

/** Últimas duas perguntas do totem: como pagar e, no crédito, em quantas vezes. */
export function EtapaPagamento({ valor, onChange, parcelas, onParcelas, itens, subtotal }: Props) {
    const taxa = subtotal * TAXA;
    const total = subtotal + taxa;
    /* Parcelamento simples: sem juros até 6x, com o mínimo de R$ 20 por parcela. */
    const maxParcelas = Math.max(1, Math.min(6, Math.floor(total / 20)));
    const opcoesParcelas = Array.from({ length: maxParcelas }, (_, i) => {
        const n = i + 1;
        return { id: String(n), label: `${n}x de ${brl(total / n)}${n === 1 ? " à vista" : " sem juros"}` };
    });

    return (
        <div className="flex w-full flex-col gap-5">
            <section className="flex flex-col gap-4 bg-primary p-4 md:rounded-2xl md:p-5 md:ring-1 md:ring-border-secondary">
                <h2 className="text-xl font-bold text-primary">Resumo do pedido</h2>
                <ul className="flex flex-col gap-3">
                    {itens.map((item, i) => (
                        <li key={i} className="flex items-start justify-between gap-3">
                            <span className="flex min-w-0 flex-col">
                                <span className="text-sm font-medium text-primary">
                                    {item.qtd}× {item.nome}
                                </span>
                                {item.sub && <span className="text-sm text-tertiary">{item.sub}</span>}
                            </span>
                            <span className="shrink-0 text-sm text-secondary tabular-nums">{brl(item.qtd * item.preco)}</span>
                        </li>
                    ))}
                </ul>
                <div className="flex flex-col gap-2 border-t border-secondary pt-3">
                    <Linha rotulo="Subtotal" valor={brl(subtotal)} />
                    <Linha rotulo="Taxa de conveniência" valor={brl(taxa)} />
                    <div className="flex items-baseline justify-between gap-3 border-t border-secondary pt-2">
                        <span className="text-md font-semibold text-primary">Total</span>
                        <span className="text-xl font-bold text-primary tabular-nums">{brl(total)}</span>
                    </div>
                </div>
            </section>

            <section className="flex flex-col gap-4 bg-primary p-4 md:rounded-2xl md:p-5 md:ring-1 md:ring-border-secondary">
                <h2 className="text-xl font-bold text-primary">Como você quer pagar?</h2>

                <RadioGroup aria-label="Forma de pagamento" value={valor ?? ""} onChange={(v) => onChange(v as Pagamento)} className="gap-3">
                    {OPCOES.map((opcao) => {
                        const Icon = opcao.icon;
                        const marcada = valor === opcao.id;

                        return (
                            <label
                                key={opcao.id}
                                className={cx(
                                    "flex cursor-pointer flex-col gap-3 rounded-xl bg-primary p-4 ring-1 transition duration-100 ease-linear",
                                    marcada ? "ring-2 ring-brand" : "ring-border-secondary",
                                )}
                            >
                                <span className="flex items-start gap-3">
                                    <RadioButton value={opcao.id} slot={null} aria-label={opcao.titulo} className="mt-0.5" />
                                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                                        <span className="flex items-center gap-2">
                                            <Icon
                                                className={cx("size-5 shrink-0", marcada ? "text-fg-brand-primary" : "text-fg-quaternary")}
                                                aria-hidden="true"
                                            />
                                            <span className="text-md font-semibold text-primary">{opcao.titulo}</span>
                                        </span>
                                        <span className="text-sm text-tertiary">{opcao.descricao}</span>
                                    </span>
                                </span>

                                {/* Parcelas só existem no crédito: aparecem quando ele é o escolhido. */}
                                {opcao.id === "credito" && marcada && (
                                    <div className="pl-8">
                                        <Select
                                            size="sm"
                                            label="Parcelas"
                                            selectedKey={String(Math.min(parcelas, maxParcelas))}
                                            onSelectionChange={(k) => onParcelas(Number(k))}
                                            items={opcoesParcelas}
                                        >
                                            {(item) => <Select.Item id={item.id}>{item.label}</Select.Item>}
                                        </Select>
                                    </div>
                                )}
                            </label>
                        );
                    })}
                </RadioGroup>
            </section>
        </div>
    );
}

const Linha = ({ rotulo, valor }: { rotulo: string; valor: string }) => (
    <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm text-tertiary">{rotulo}</span>
        <span className="text-sm text-secondary tabular-nums">{valor}</span>
    </div>
);
