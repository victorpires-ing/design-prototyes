import { AlertTriangle, CreditCard01, Link01, QrCode01, UserX01, Wallet01 } from "@untitledui/icons";
import { Avatar } from "@/components/base/avatar/avatar";
import { Badge } from "@/components/base/badges/badges";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { cx } from "@/utils/cx";
import { ITENS_POR_ID, SESSAO_DO_ITEM, currency, type Comprador } from "../data/bilheteria-data";
import type { PedidoItem, PedidoTipo } from "../data/bilheteria-store";
import { AcessoIcon } from "./ItensVendaSelector";

const OPCOES: { id: PedidoTipo; icon: typeof Link01; titulo: string; descricao: string }[] = [
    { id: "pix", icon: QrCode01, titulo: "Pix", descricao: "Gere um QR code ou copia e cola para o comprador pagar na hora." },
    { id: "debito", icon: CreditCard01, titulo: "Cartão de débito", descricao: "Aproxime o cartão ou o celular do comprador (tap to pay)." },
    { id: "link", icon: Link01, titulo: "Link de pagamento", descricao: "Gere um link de pagamento e envie para o comprador." },
    { id: "saldo", icon: Wallet01, titulo: "Saldo do produtor", descricao: "O valor total dos ingressos será debitado da conta. O produtor precisa ter saldo disponível." },
];

/** Pagamento presencial na hora (não gera pendência de pagamento). */
const pagaNaHora = (t: PedidoTipo | null) => t === "pix" || t === "debito" || t === "saldo";

interface Props {
    tipo: PedidoTipo | null;
    onTipo: (t: PedidoTipo) => void;
    comprador: Comprador | null;
    itens: PedidoItem[];
    total: number;
}

export function MeioPagamentoStep({ tipo, onTipo, comprador, itens, total }: Props) {
    const totalItens = itens.reduce((s, i) => s + i.qtd, 0);

    return (
        <div className="mx-auto flex w-full max-w-[720px] flex-col gap-5">
            {/* Meio de pagamento */}
            <div className="flex flex-col gap-4 rounded-2xl bg-primary_alt p-5 ring-1 ring-border-secondary">
                <span className="text-sm font-semibold text-primary">Meio de pagamento</span>
                <div className="flex flex-col gap-3">
                    {OPCOES.map((o) => {
                        const ativo = tipo === o.id;
                        return (
                            <button
                                key={o.id}
                                type="button"
                                onClick={() => onTipo(o.id)}
                                aria-pressed={ativo}
                                className={cx(
                                    "flex items-center gap-3 rounded-xl bg-secondary p-4 text-left ring-1 transition duration-100 ease-linear",
                                    ativo ? "ring-2 ring-brand" : "ring-border-secondary hover:ring-border-primary",
                                )}
                            >
                                <FeaturedIcon icon={o.icon} color="gray" theme="modern" size="md" />
                                <div className="flex min-w-0 flex-1 flex-col">
                                    <span className="text-sm font-semibold text-primary">{o.titulo}</span>
                                    <span className="text-sm text-tertiary">{o.descricao}</span>
                                </div>
                                <span className={cx("flex size-5 shrink-0 items-center justify-center rounded-full transition duration-100 ease-linear", ativo ? "ring-[5px] ring-inset ring-brand-solid" : "ring-1 ring-border-primary")} />
                            </button>
                        );
                    })}
                </div>
                {!pagaNaHora(tipo) && (
                    <div className="flex items-start gap-3 rounded-xl bg-warning-primary p-4">
                        <FeaturedIcon icon={AlertTriangle} color="warning" theme="modern" size="sm" />
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold text-primary">O pedido será criado antes do pagamento.</span>
                            <span className="text-sm text-tertiary">O comprador realizará o pagamento após a emissão do pedido.</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Resumo */}
            <div className="flex flex-col gap-4 rounded-2xl bg-primary_alt p-5 ring-1 ring-border-secondary">
                <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-semibold text-primary">Resumo</span>
                    <span className="text-sm text-secondary">
                        <span className="font-bold text-primary">{currency.format(total)}</span> <span className="text-tertiary">+ taxas</span>
                    </span>
                </div>

                {comprador ? (
                    <div className="flex items-center gap-3">
                        <Avatar size="md" initials={comprador.iniciais} alt={comprador.nome} />
                        <div className="flex min-w-0 flex-col">
                            <span className="truncate text-sm font-semibold text-primary">{comprador.nome}</span>
                            <span className="truncate text-sm text-tertiary">{comprador.emailExibicao}</span>
                            <span className="truncate text-xs text-tertiary">CPF {comprador.cpf}</span>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-3">
                        <Avatar size="md" icon={UserX01} alt="Sem identificação" />
                        <div className="flex min-w-0 flex-col">
                            <span className="truncate text-sm font-semibold text-primary">Venda sem identificação</span>
                            <span className="truncate text-sm text-tertiary">Sem vínculo com conta</span>
                        </div>
                    </div>
                )}

                <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-secondary">Itens</span>
                    <Badge size="sm" color="gray" type="modern">{totalItens} {totalItens === 1 ? "item" : "itens"}</Badge>
                </div>

                <ul className="flex flex-col gap-3">
                    {itens.map((v) => {
                        const item = ITENS_POR_ID[v.itemId];
                        return (
                            <li key={v.itemId} className="flex items-start gap-3 rounded-lg bg-secondary p-3 ring-1 ring-border-secondary">
                                <span className="flex h-7 min-w-9 shrink-0 items-center justify-center rounded-md bg-primary_alt px-1.5 text-xs font-semibold text-secondary tabular-nums ring-1 ring-border-secondary">{v.qtd}</span>
                                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                                    <span className="flex items-center gap-1.5 text-sm font-semibold text-primary">
                                        <AcessoIcon acesso={item?.acesso} className="size-3.5" />
                                        <span className="truncate">{item?.nome}</span>
                                    </span>
                                    <span className="truncate text-xs text-tertiary">{[item?.grupo, item?.tipo].filter(Boolean).join(" - ")}</span>
                                    <span className="truncate text-xs text-tertiary">{SESSAO_DO_ITEM[v.itemId]}</span>
                                </div>
                                <span className="shrink-0 text-sm font-semibold text-primary tabular-nums">{currency.format((item?.preco ?? 0) * v.qtd)}</span>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>
    );
}
