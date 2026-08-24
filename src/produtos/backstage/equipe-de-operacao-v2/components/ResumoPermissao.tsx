import { cx } from "@/utils/cx";
import { ITENS_POR_ID, SESSAO_DO_ITEM } from "../data/equipe-data";
import { PERMISSAO_META, usoDaCota, type CotaModo, type CotaPermissao, type Permissao } from "../data/equipe-v2-store";

interface Props {
    permissoes: Partial<Record<Permissao, CotaPermissao>>;
    concedidas: Permissao[];
    modo: CotaModo;
    itens: string[];
    /** Mostra as barras de consumo — só faz sentido em grupos já criados. */
    showUso?: boolean;
}

/** Cartão único com as cotas de cada permissão e os itens liberados no grupo. */
export function ResumoPermissoes({ permissoes, concedidas, modo, itens, showUso }: Props) {
    return (
        <section className="flex flex-col gap-4 rounded-2xl bg-secondary p-5 ring-1 ring-border-secondary">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-md font-semibold text-primary">Permissões e cotas</span>
                <span className="text-sm text-tertiary">
                    {modo === "individual" ? "Cota para cada operador" : "Cota compartilhada pelo grupo"}
                </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {concedidas.map((id) => {
                    const meta = PERMISSAO_META[id];
                    const config = permissoes[id]!;
                    const pct = usoDaCota(config);

                    return (
                        <div key={id} className="flex flex-col gap-2 rounded-xl bg-primary p-4 ring-1 ring-border-secondary">
                            <span className="flex items-center gap-2">
                                <meta.icon className="size-5 shrink-0 text-fg-brand-primary" aria-hidden="true" />
                                <span className="text-sm font-semibold text-primary">{meta.label}</span>
                            </span>
                            <span className="text-lg font-bold text-primary tabular-nums">
                                {showUso
                                    ? `${config.usadas.toLocaleString("pt-BR")} de ${config.cota.toLocaleString("pt-BR")}`
                                    : config.cota.toLocaleString("pt-BR")}
                            </span>
                            {showUso && (
                                <div className="h-2 overflow-hidden rounded-full bg-quaternary">
                                    <div
                                        className={cx("h-full rounded-full", pct >= 100 ? "bg-error-solid" : "bg-brand-solid")}
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                            )}
                            <span className="text-sm text-tertiary">{meta.unidade}</span>
                        </div>
                    );
                })}
            </div>

            <div className="flex flex-col gap-3 border-t border-secondary pt-4">
                <span className="text-sm font-medium text-secondary">
                    {itens.length} {itens.length === 1 ? "item liberado" : "itens liberados"}
                </span>
                <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
                    {itens.map((id) => {
                        const item = ITENS_POR_ID[id];
                        return (
                            <div key={id} className="flex min-w-0 flex-col">
                                <span className="text-sm font-medium text-primary">
                                    {item?.nome}
                                    {item?.tipo ? <span className="text-tertiary"> · {item.tipo}</span> : null}
                                </span>
                                <span className="truncate text-sm text-tertiary">
                                    {item?.grupo} • {SESSAO_DO_ITEM[id]}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
