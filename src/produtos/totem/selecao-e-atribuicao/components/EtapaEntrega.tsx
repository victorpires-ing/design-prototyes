import { Mail01, Printer } from "@untitledui/icons";
import { RadioButton, RadioGroup } from "@/components/base/radio-buttons/radio-buttons";
import { cx } from "@/utils/cx";

export type Entrega = "digital" | "impresso";

interface Props {
    valor: Entrega;
    onChange: (v: Entrega) => void;
    /** E-mail para onde o ingresso digital vai — o da identificação. */
    email?: string;
}

const OPCOES: Array<{ id: Entrega; icon: typeof Mail01; titulo: string; descricao: string }> = [
    {
        id: "digital",
        icon: Mail01,
        titulo: "Ingresso digital",
        descricao: "Chega por e-mail e fica na carteira Ingresse. É o que vale na entrada.",
    },
    {
        id: "impresso",
        icon: Printer,
        titulo: "Imprimir agora",
        descricao: "Sai na impressora do totem em alguns segundos. O digital continua valendo.",
    },
];

/** Escolha de entrega: o ingresso é digital por padrão, o impresso é o extra. */
export function EtapaEntrega({ valor, onChange, email }: Props) {
    return (
        <div className="flex w-full flex-col gap-5 bg-primary p-4 md:rounded-2xl md:p-5 md:ring-1 md:ring-border-secondary">
            <div className="flex flex-col gap-1">
                <h2 className="text-2xl font-bold text-primary">Como você quer receber?</h2>
                <p className="text-md text-tertiary">Dá para mudar depois pela carteira Ingresse.</p>
            </div>

            <RadioGroup aria-label="Forma de entrega" value={valor} onChange={(v) => onChange(v as Entrega)} className="gap-3">
                {OPCOES.map((opcao) => {
                    const Icon = opcao.icon;
                    const marcada = valor === opcao.id;

                    return (
                        <label
                            key={opcao.id}
                            className={cx(
                                "flex cursor-pointer items-start gap-3 rounded-xl bg-primary p-4 ring-1 transition duration-100 ease-linear",
                                marcada ? "ring-2 ring-brand" : "ring-border-secondary",
                            )}
                        >
                            <RadioButton value={opcao.id} slot={null} aria-label={opcao.titulo} className="mt-0.5" />
                            <span className="flex min-w-0 flex-1 flex-col gap-1">
                                <span className="flex items-center gap-2">
                                    <Icon className={cx("size-5 shrink-0", marcada ? "text-fg-brand-primary" : "text-fg-quaternary")} aria-hidden="true" />
                                    <span className="text-lg font-semibold text-primary">{opcao.titulo}</span>
                                </span>
                                <span className="text-md text-tertiary">{opcao.descricao}</span>
                                {opcao.id === "digital" && email && (
                                    <span className="mt-1 truncate rounded-md bg-secondary px-2 py-1 text-md text-secondary">{email}</span>
                                )}
                            </span>
                        </label>
                    );
                })}
            </RadioGroup>
        </div>
    );
}
