import { cx } from "@/utils/cx";
import { ITENS_POR_ID, SESSAO_DO_ITEM } from "../data/equipe-data";
import { cotaTotal, PERMISSAO_META, usoDaCota, type CotaPermissao, type Permissao } from "../data/equipe-v2-store";

interface Props {
    permissoes: Partial<Record<Permissao, CotaPermissao>>;
    concedidas: Permissao[];
    /** Mostra as barras de consumo — só faz sentido em grupos já criados. */
    showUso?: boolean;
}

/** Cartão único com as cotas de cada permissão e os itens liberados no grupo. */
export function ResumoPermissoes({ permissoes, concedidas, showUso }: Props) {
    return (
        <section className="flex flex-col gap-4 rounded-2xl bg-secondary p-5 ring-1 ring-border-secondary">
            <span className="text-md font-semibold text-primary">Permissões e cotas</span>

            <div className="flex flex-col gap-4">
                {concedidas.map((id) => {
                    const meta = PERMISSAO_META[id];
                    const config = permissoes[id]!;
                    const total = cotaTotal(config);
                    const pct = usoDaCota(config);

                    return (
                        <div key={id} className="flex flex-col gap-3 rounded-xl bg-primary p-4 ring-1 ring-border-secondary">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="flex items-center gap-2">
                                    <meta.icon className="size-5 shrink-0 text-fg-brand-primary" aria-hidden="true" />
                                    <span className="text-sm font-semibold text-primary">{meta.label}</span>
                                </span>
                                <span className="text-sm text-tertiary">{config.modo === "item" ? "Cota por item" : "Cota por grupo"}</span>
                            </div>

                            <div className="flex flex-col gap-2">
                                <div className="flex items-baseline justify-between gap-2">
                                    <span className="text-sm text-tertiary">{meta.unidade}</span>
                                    <span className="text-lg font-bold text-primary tabular-nums">
                                        {showUso
                                            ? `${config.usadas.toLocaleString("pt-BR")} de ${total.toLocaleString("pt-BR")}`
                                            : total.toLocaleString("pt-BR")}
                                    </span>
                                </div>
                                {showUso && (
                                    <div className="h-2 overflow-hidden rounded-full bg-quaternary">
                                        <div
                                            className={cx("h-full rounded-full", pct >= 100 ? "bg-error-solid" : "bg-brand-solid")}
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 gap-x-6 gap-y-2 border-t border-secondary pt-3 sm:grid-cols-2 lg:grid-cols-3">
                                {config.itens.map((itemId) => {
                                    const item = ITENS_POR_ID[itemId];
                                    return (
                                        <div key={itemId} className="flex min-w-0 items-start gap-2">
                                            {/* Na cota por item o número vem colado no item a que pertence. */}
                                            {config.modo === "item" && (
                                                <span className="shrink-0 text-sm font-bold text-primary tabular-nums">
                                                    {config.porItem[itemId] ?? 0}x
                                                </span>
                                            )}
                                            <div className="flex min-w-0 flex-col">
                                                <span className="text-sm font-medium text-primary">
                                                    {item?.nome}
                                                    {item?.tipo ? <span className="text-tertiary"> · {item.tipo}</span> : null}
                                                </span>
                                                <span className="truncate text-sm text-tertiary">{SESSAO_DO_ITEM[itemId]}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
