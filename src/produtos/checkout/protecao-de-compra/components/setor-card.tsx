import { ChevronDown, Minus, Plus, Ticket01 } from "@untitledui/icons";
import { cx } from "@/utils/cx";
import { brl, type SetorEvento } from "../data/evento";

/** Setor (acordeão) com os ingressos e o seletor de quantidade — como no carrinho em produção. */
export function SetorCard({
    setor,
    aberto,
    onAlternar,
    quantidades,
    onQuantidade,
}: {
    setor: SetorEvento;
    aberto: boolean;
    onAlternar: () => void;
    quantidades: Record<string, number>;
    onQuantidade: (id: string, qtd: number) => void;
}) {
    const total = setor.ingressos.reduce((s, i) => s + (quantidades[i.id] ?? 0), 0);

    return (
        <section className="overflow-hidden rounded-2xl border border-[#dcdcdc] bg-white">
            <button type="button" onClick={onAlternar} aria-expanded={aberto} className="flex w-full items-center gap-2 px-4 py-3.5 text-left">
                <Ticket01 className="size-5 text-[#ff4f1f]" aria-hidden="true" />
                <span className="text-base font-bold text-[#1a1a1a]">{setor.nome}</span>
                {total > 0 && (
                    <span className="flex size-5 items-center justify-center rounded-full bg-[#ff4f1f] text-xs font-semibold text-white tabular-nums">{total}</span>
                )}
                <ChevronDown
                    className={cx("ml-auto size-5 text-[#ff4f1f] transition-transform duration-150 ease-out", aberto && "rotate-180")}
                    aria-hidden="true"
                />
            </button>

            {aberto && (
                <ul className="border-t border-[#dcdcdc] px-4">
                    {setor.ingressos.map((ing, i) => {
                        const qtd = quantidades[ing.id] ?? 0;
                        return (
                            <li key={ing.id} className={cx("flex flex-col gap-2 py-4", i > 0 && "border-t border-[#dcdcdc]")}>
                                <p className="text-base font-bold text-[#1a1a1a]">{ing.nome}</p>
                                <span className="w-fit rounded-full bg-[#f2f2f2] px-2.5 py-0.5 text-xs font-medium text-[#1a1a1a]">{ing.data}</span>
                                <span className="text-sm text-[#7a7a7a]">{ing.lote}</span>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-bold text-[#1a1a1a]">{brl(ing.preco)}</span>
                                    <div className="flex items-center gap-3">
                                        <BotaoQtd rotulo={`Remover um ${ing.nome}`} desabilitado={qtd === 0} onClick={() => onQuantidade(ing.id, qtd - 1)}>
                                            <Minus className="size-4" aria-hidden="true" />
                                        </BotaoQtd>
                                        <span className="w-3 text-center text-base text-[#1a1a1a] tabular-nums">{qtd}</span>
                                        <BotaoQtd rotulo={`Adicionar um ${ing.nome}`} desabilitado={qtd >= 6} onClick={() => onQuantidade(ing.id, qtd + 1)}>
                                            <Plus className="size-4" aria-hidden="true" />
                                        </BotaoQtd>
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </section>
    );
}

function BotaoQtd({ rotulo, desabilitado, onClick, children }: { rotulo: string; desabilitado: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
        <button
            type="button"
            aria-label={rotulo}
            disabled={desabilitado}
            onClick={onClick}
            className="flex size-8 items-center justify-center rounded-lg bg-[#ff4f1f] text-white transition duration-100 ease-linear hover:bg-[#e8410f] disabled:cursor-not-allowed disabled:bg-[#ffd3c4]"
        >
            {children}
        </button>
    );
}
