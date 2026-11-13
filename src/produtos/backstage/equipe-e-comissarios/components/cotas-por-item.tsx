import { useMemo, useState } from "react";
import { toast } from "sonner";
import { SearchLg } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { BotaoMostrarMais, paraBusca, useMostrarMais } from "../../itens/components/escala";
import { ITEM_POR_ID, legendaDeSessao, type ItemCatalogo } from "../data/catalogo-evento";

export const soNumero = (v: string) => {
    const n = Number(v.replace(/\D/g, "").slice(0, 6));
    return Number.isFinite(n) ? n : 0;
};

/* ---------------------------- Cota por item ---------------------------- */

/**
 * Uma linha por item, com busca, 20 por vez e "Mesma cota para vários itens" (UI-LST-001):
 * com 300 mil ingressos, ninguém digita item por item.
 */
export const CotasPorItem = ({ itens, valores, onValores, mostrarErros }: { itens: string[]; valores: Record<string, number>; onValores: (v: Record<string, number>) => void; mostrarErros: boolean }) => {
    const [busca, setBusca] = useState("");
    const [emLote, setEmLote] = useState(0);
    const lista = useMemo(() => itens.map((id) => ITEM_POR_ID[id]).filter((i): i is ItemCatalogo => Boolean(i)), [itens]);
    const termo = paraBusca(busca.trim());
    const filtrados = useMemo(
        () => (termo ? lista.filter((i) => paraBusca(`${i.nome} ${i.tipo === "produto" ? "" : i.grupo} ${legendaDeSessao(i) ?? ""}`).includes(termo)) : lista),
        [lista, termo],
    );
    const { visiveis, restantes, mostrarMais } = useMostrarMais(filtrados);

    if (lista.length === 0) return <p className="text-sm text-tertiary">Escolha os itens do canal para definir as cotas.</p>;

    return (
        <div className="flex flex-col gap-4">
            {/* Preencher em lote fica separado da busca, numa frase: o que faz e em quantos itens (EO3-13). */}
            <div className="flex flex-col gap-3 rounded-xl bg-secondary p-4">
                <div className="flex flex-col gap-0.5">
                    <p className="text-sm font-semibold text-primary">Mesma cota para vários itens</p>
                    <p className="text-sm text-tertiary">
                        Preenche {filtrados.length === 1 ? "o item" : termo ? `os ${filtrados.length} itens da busca` : `os ${filtrados.length} itens`} de uma vez. Depois, ajuste um a um se precisar.
                    </p>
                </div>
                <div className="flex items-end gap-2">
                    <div className="w-32">
                        <Input aria-label="Cota para preencher" inputMode="numeric" placeholder="Ex.: 20" value={emLote ? String(emLote) : ""} onChange={(v) => setEmLote(soNumero(v))} />
                    </div>
                    <Button
                        color="secondary"
                        size="md"
                        isDisabled={!emLote || filtrados.length === 0}
                        onClick={() => {
                            onValores(Object.fromEntries(filtrados.map((i) => [i.id, emLote])));
                            toast.success(`Cota de ${emLote} em ${filtrados.length === 1 ? "1 item" : `${filtrados.length} itens`}.`);
                        }}
                    >
                        Preencher
                    </Button>
                </div>
            </div>
            <Input aria-label="Buscar item" icon={SearchLg} placeholder="Buscar por nome, grupo ou sessão" value={busca} onChange={setBusca} />
            {filtrados.length === 0 ? (
                <p className="text-sm text-tertiary">Nenhum item com esse nome, grupo ou sessão.</p>
            ) : (
                <ul className="flex flex-col divide-y divide-secondary rounded-xl ring-1 ring-secondary ring-inset">
                    {visiveis.map((item) => (
                        <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-3">
                            <span className="flex min-w-0 flex-col gap-0.5">
                                <span className="truncate text-sm font-medium text-primary">{item.nome}</span>
                                <span className="truncate text-sm text-tertiary">
                                    {item.tipo === "produto" ? "Produto" : [item.grupo, legendaDeSessao(item)].filter(Boolean).join(", ")}
                                </span>
                            </span>
                            <div className="w-24 shrink-0">
                                <Input
                                    inputMode="numeric"
                                    placeholder="0"
                                    aria-label={`Cota de ${item.nome}`}
                                    value={valores[item.id] ? String(valores[item.id]) : ""}
                                    onChange={(v) => onValores({ [item.id]: soNumero(v) })}
                                    isInvalid={mostrarErros && !((valores[item.id] ?? 0) > 0)}
                                />
                            </div>
                        </li>
                    ))}
                </ul>
            )}
            <BotaoMostrarMais restantes={restantes} onClick={mostrarMais} />
        </div>
    );
};
