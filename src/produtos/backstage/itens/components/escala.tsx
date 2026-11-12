import { type ReactNode, useMemo, useState } from "react";
import { SearchLg, XClose } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { InputBase } from "@/components/base/input/input";
import { Select } from "@/components/base/select/select";
import { Surgir } from "@/components/foundations/transicao";
import { sairDaSimulacao, useCatalogo } from "../data/catalogo";
import { formatar, useTextosItens } from "../data/textos-itens";

/* ------------------------------------------------------------------ */
/*  Escala de 1 a milhares de itens (UI-LST-001)                       */
/*                                                                     */
/*  Busca e filtros (só quando a lista passa de uma tela), contagem    */
/*  "N de M", seleção com "selecionar todos do filtro", ações em lote  */
/*  e "Mostrar mais". Com poucos itens, nada disso aparece.            */
/* ------------------------------------------------------------------ */

/** A partir de quantos itens a busca, os filtros e a seleção aparecem. */
export const LIMIAR_FERRAMENTAS = 8;
/** Quantos itens aparecem antes do "Mostrar mais". */
export const PASSO_MOSTRAR = 20;

const T = {
    contagem: "{visiveis} de {total}",
    limparFiltros: "Limpar filtros",
    selecionados: { one: "{n} selecionado", other: "{n} selecionados" },
    selecionarTodos: "Selecionar todos os {n} do filtro",
    limparSelecao: "Limpar seleção",
    mostrarMais: "Mostrar mais {n}",
    restantes: { one: "Falta {n} item", other: "Faltam {n} itens" },
    selecionarItem: "Selecionar {item}",
};


/* ---------------- seleção ---------------- */

export function useSelecao() {
    const [ids, setIds] = useState<Set<string>>(new Set());
    return useMemo(
        () => ({
            ids,
            tamanho: ids.size,
            tem: (id: string) => ids.has(id),
            alternar: (id: string, on: boolean) =>
                setIds((atual) => {
                    const prox = new Set(atual);
                    if (on) prox.add(id);
                    else prox.delete(id);
                    return prox;
                }),
            definir: (lista: string[]) => setIds(new Set(lista)),
            limpar: () => setIds(new Set()),
        }),
        [ids],
    );
}

/** Caixa de seleção da linha: fica por cima do botão que cobre a linha. */
export function CaixaDeSelecao({ rotulo, marcado, onChange }: { rotulo: string; marcado: boolean; onChange: (v: boolean) => void }) {
    return (
        <div className="relative z-10 flex shrink-0 items-center">
            {/* Área de toque maior que a caixa (WCAG 2.5.8), sem mudar o desenho. */}
            <Checkbox
                aria-label={formatar(T.selecionarItem, { item: rotulo })}
                isSelected={marcado}
                onChange={onChange}
                className="relative before:absolute before:-inset-3 before:content-['']"
            />
        </div>
    );
}

/* ---------------- busca e filtros ---------------- */

export interface Filtro {
    id: string;
    rotulo: string;
    valor: string;
    opcoes: { id: string; label: string }[];
    onChange: (v: string) => void;
}

/**
 * Busca, filtros e contagem. Aparece só quando há mais itens que o limiar; quebra linha no celular
 * (sem rolagem horizontal).
 */
export function BarraDeFiltros({
    total,
    visiveis,
    busca,
    onBusca,
    placeholder,
    filtros = [],
    onLimpar,
}: {
    total: number;
    visiveis: number;
    busca: string;
    onBusca: (v: string) => void;
    placeholder: string;
    filtros?: Filtro[];
    onLimpar: () => void;
}) {
    const { numero } = useTextosItens();
    if (total <= LIMIAR_FERRAMENTAS) return null;
    const filtrando = !!busca || filtros.some((f) => f.valor !== "todos");
    return (
        <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center">
            <div className="md:w-72">
                <InputBase size="sm" icon={SearchLg} aria-label={placeholder} placeholder={placeholder} value={busca} // O InputBase entrega o evento; aceita texto também, por segurança.
                    onChange={(v: unknown) => onBusca(typeof v === "string" ? v : ((v as { target?: { value?: string } })?.target?.value ?? ""))} />
            </div>
            <div className="grid grid-cols-2 gap-3 md:flex md:flex-wrap">
                {filtros.map((f) => (
                    <div key={f.id} className="md:w-48">
                        <Select size="sm" aria-label={f.rotulo} selectedKey={f.valor} onSelectionChange={(k) => k && f.onChange(String(k))} items={f.opcoes}>
                            {(o) => <Select.Item id={o.id}>{o.label}</Select.Item>}
                        </Select>
                    </div>
                ))}
            </div>
            <div className="flex items-center gap-3 md:ml-auto">
                <span role="status" className="text-sm text-tertiary tabular-nums">
                    {formatar(T.contagem, { visiveis: numero(visiveis), total: numero(total) })}
                </span>
                {filtrando && (
                    <Button color="link-gray" size="sm" iconLeading={XClose} onClick={onLimpar}>
                        {T.limparFiltros}
                    </Button>
                )}
            </div>
        </div>
    );
}

/** Normaliza texto para busca: sem acento e sem diferença de maiúsculas. */
export const paraBusca = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/* ---------------- ações em lote ---------------- */

/**
 * Barra fixa de ações em lote: aparece ao selecionar, no fundo da página e na largura da área de
 * conteúdo (UI-VIS-013), no mesmo lugar da barra de salvar.
 */
export function AcoesEmLote({
    selecionados,
    totalDoFiltro,
    onSelecionarTodos,
    onLimpar,
    children,
}: {
    selecionados: number;
    totalDoFiltro: number;
    onSelecionarTodos: () => void;
    onLimpar: () => void;
    children: ReactNode;
}) {
    const { plural, numero } = useTextosItens();
    return (
        <div className="sticky bottom-0 z-20 mt-auto">
            <Surgir visivel={selecionados > 0}>
                <div className="flex flex-col gap-3 border-t border-secondary bg-primary_alt py-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                        <span role="status" className="text-sm font-semibold text-primary">
                            {plural(T.selecionados, selecionados)}
                        </span>
                        {selecionados < totalDoFiltro && (
                            <Button color="link-color" size="sm" onClick={onSelecionarTodos}>
                                {formatar(T.selecionarTodos, { n: numero(totalDoFiltro) })}
                            </Button>
                        )}
                        <Button color="link-gray" size="sm" onClick={onLimpar}>
                            {T.limparSelecao}
                        </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">{children}</div>
                </div>
            </Surgir>
        </div>
    );
}

/* ---------------- mostrar mais ---------------- */

/** Mostra os primeiros itens e um "Mostrar mais" com o que falta (sem desenhar milhares de linhas). */
export function useMostrarMais<T>(lista: T[], passo = PASSO_MOSTRAR) {
    const [limite, setLimite] = useState(passo);
    return {
        visiveis: lista.slice(0, limite),
        restantes: Math.max(0, lista.length - limite),
        mostrarMais: () => setLimite((l) => l + passo),
        reiniciar: () => setLimite(passo),
    };
}

export function BotaoMostrarMais({ restantes, onClick, passo = PASSO_MOSTRAR }: { restantes: number; onClick: () => void; passo?: number }) {
    const { plural, numero } = useTextosItens();
    if (restantes <= 0) return null;
    return (
        <div className="flex flex-wrap items-center gap-3">
            <Button color="secondary" size="sm" onClick={onClick}>
                {formatar(T.mostrarMais, { n: numero(Math.min(passo, restantes)) })}
            </Button>
            <span className="text-sm text-tertiary">{plural(T.restantes, restantes)}</span>
        </div>
    );
}

/** Faixa da simulação de escala: diz que nada é gravado e oferece sair. */
export function AvisoDeEscala() {
    const { simulado } = useCatalogo();
    const { numero } = useTextosItens();
    if (!simulado) return null;
    return (
        <div role="status" className="flex flex-col gap-2 rounded-xl bg-warning-primary px-4 py-3 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-warning-primary">
                {formatar("Catálogo simulado com {n} ingressos para testar a escala. Nada do que você mudar aqui é gravado.", { n: numero(simulado) })}
            </p>
            <Button color="secondary" size="sm" onClick={sairDaSimulacao}>
                Sair da simulação
            </Button>
        </div>
    );
}
