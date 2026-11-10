import { useDeferredValue, useMemo, useState } from "react";
import { SearchLg } from "@untitledui/icons";
import { SlideoutMenu } from "@/components/application/slideout-menus/slideout-menu";
import { ButtonGroup, ButtonGroupItem } from "@/components/base/button-group/button-group";
import { Button } from "@/components/base/buttons/button";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { InputBase } from "@/components/base/input/input";
import { formatar, useTextosItens } from "../data/textos-itens";
import { BotaoMostrarMais, LIMIAR_FERRAMENTAS, paraBusca, useMostrarMais } from "./escala";

/* ------------------------------------------------------------------ */
/*  Seletor de muitos itens (UI-LST-001, UI-LST-002)                   */
/*                                                                     */
/*  Para produtos, combos, chaves de acesso, venda vinculada e         */
/*  segmentações. Mesmo padrão do seletor de ingressos da abertura:    */
/*  slideout (tela cheia no celular, UI-NAV-001 e UI-NAV-003), busca,  */
/*  "N de M", "Selecionar todos do filtro", Todos ou Selecionados,     */
/*  "Mostrar mais" e resumo no rodapé. Com poucos itens, só a lista.   */
/* ------------------------------------------------------------------ */

export interface OpcaoDeLista {
    id: string;
    rotulo: string;
    /** Contexto que diferencia itens parecidos (setor, sessão). */
    apoio?: string;
}

const T = {
    buscar: "Buscar",
    contagem: "{visiveis} de {total}",
    selecionarTodos: "Selecionar todos os {n} do filtro",
    limpar: "Limpar seleção",
    filtro: "Mostrar",
    todos: "Todos",
    soSelecionados: "Selecionados",
    selecionados: { one: "{n} selecionado", other: "{n} selecionados" },
    nada: "Nada encontrado. Tente outro termo.",
    nadaSelecionado: "Nada selecionado.",
    cancelar: "Cancelar",
    confirmar: "Confirmar",
};

export function SeletorDeLista({
    titulo,
    descricao,
    opcoes,
    selecionados: inicial,
    vazio,
    onConfirmar,
    onFechar,
}: {
    titulo: string;
    descricao?: string;
    opcoes: OpcaoDeLista[];
    selecionados: string[];
    /** Texto quando não há nenhuma opção (ex.: "Crie chaves em Marketing › Chave de acesso."). */
    vazio: string;
    onConfirmar: (ids: string[]) => void;
    onFechar: () => void;
}) {
    const { plural, numero } = useTextosItens();
    const [marcados, setMarcados] = useState(() => new Set(inicial));
    const [busca, setBusca] = useState("");
    const [filtro, setFiltro] = useState<"todos" | "selecionados">("todos");
    const termo = paraBusca(useDeferredValue(busca).trim());
    const muitas = opcoes.length > LIMIAR_FERRAMENTAS;
    const filtradas = useMemo(() => {
        let lista = termo ? opcoes.filter((o) => paraBusca(`${o.rotulo} ${o.apoio ?? ""}`).includes(termo)) : opcoes;
        if (filtro === "selecionados") lista = lista.filter((o) => marcados.has(o.id));
        return lista;
        // A seleção só refaz a lista no filtro "Selecionados".
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [opcoes, termo, filtro, filtro === "selecionados" ? marcados : null]);
    const { visiveis, restantes, mostrarMais } = useMostrarMais(filtradas, 50);

    const alternar = (id: string, on: boolean) =>
        setMarcados((atual) => {
            const prox = new Set(atual);
            if (on) prox.add(id);
            else prox.delete(id);
            return prox;
        });

    return (
        <SlideoutMenu
            isOpen
            isDismissable
            onOpenChange={(v) => !v && onFechar()}
            // z-50: acima do cabeçalho fixo do Backstage; pl-0: tela cheia no celular (UI-NAV-003).
            className="z-50 pl-0"
            dialogClassName="gap-0"
        >
            <SlideoutMenu.Header onClose={onFechar} className="flex flex-col gap-1 pb-4">
                <h2 className="pr-8 text-lg font-semibold text-primary">{titulo}</h2>
                {descricao && <p className="text-sm text-tertiary">{descricao}</p>}
            </SlideoutMenu.Header>

            {opcoes.length === 0 ? (
                <SlideoutMenu.Content>
                    <p className="text-sm text-tertiary">{vazio}</p>
                </SlideoutMenu.Content>
            ) : (
                <>
                    {muitas && (
                        <div className="flex w-full flex-col gap-3 px-4 pb-4 md:px-6">
                            <InputBase
                                size="sm"
                                icon={SearchLg}
                                aria-label={T.buscar}
                                placeholder={T.buscar}
                                value={busca}
                                onChange={(v: unknown) => setBusca(typeof v === "string" ? v : ((v as { target?: { value?: string } })?.target?.value ?? ""))}
                            />
                            <ButtonGroup
                                size="sm"
                                aria-label={T.filtro}
                                selectedKeys={new Set([filtro])}
                                onSelectionChange={(keys) => {
                                    const v = [...keys][0];
                                    if (v) setFiltro(v as typeof filtro);
                                }}
                                disallowEmptySelection
                            >
                                <ButtonGroupItem id="todos">{T.todos}</ButtonGroupItem>
                                <ButtonGroupItem id="selecionados">{T.soSelecionados}</ButtonGroupItem>
                            </ButtonGroup>
                            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                                <span className="text-tertiary tabular-nums" role="status">
                                    {formatar(T.contagem, { visiveis: numero(filtradas.length), total: numero(opcoes.length) })}
                                </span>
                                <span className="flex gap-3">
                                    {filtro === "todos" && filtradas.length > 0 && (
                                        <Button color="link-color" size="sm" onClick={() => setMarcados((a) => new Set([...a, ...filtradas.map((o) => o.id)]))}>
                                            {formatar(T.selecionarTodos, { n: numero(filtradas.length) })}
                                        </Button>
                                    )}
                                    {marcados.size > 0 && (
                                        <Button color="link-gray" size="sm" onClick={() => setMarcados(new Set())}>
                                            {T.limpar}
                                        </Button>
                                    )}
                                </span>
                            </div>
                        </div>
                    )}
                    <SlideoutMenu.Content className="gap-1 border-t border-secondary pt-3 pb-4">
                        <ul className="flex flex-col gap-1">
                            {visiveis.map((o) => (
                                <li key={o.id} className="rounded-lg px-2 py-2 hover:bg-primary_hover">
                                    <Checkbox label={o.rotulo} hint={o.apoio} isSelected={marcados.has(o.id)} onChange={(on) => alternar(o.id, on)} />
                                </li>
                            ))}
                        </ul>
                        {filtradas.length === 0 && <p className="px-2 py-2 text-sm text-tertiary">{filtro === "selecionados" && !termo ? T.nadaSelecionado : T.nada}</p>}
                        <BotaoMostrarMais restantes={restantes} onClick={mostrarMais} passo={50} />
                    </SlideoutMenu.Content>
                </>
            )}

            <SlideoutMenu.Footer className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm text-tertiary" role="status">
                    {plural(T.selecionados, marcados.size)}
                </span>
                <div className="flex flex-col-reverse gap-3 sm:flex-row">
                    <Button color="secondary" size="md" onClick={onFechar}>
                        {T.cancelar}
                    </Button>
                    <Button color="primary" size="md" onClick={() => onConfirmar([...marcados])}>
                        {T.confirmar}
                    </Button>
                </div>
            </SlideoutMenu.Footer>
        </SlideoutMenu>
    );
}
