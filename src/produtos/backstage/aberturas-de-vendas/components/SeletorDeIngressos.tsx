import { type ReactNode, useDeferredValue, useEffect, useMemo, useState } from "react";
import { SearchLg } from "@untitledui/icons";
import { type Key, ToggleButton as AriaToggleButton, TreeItemContent as AriaTreeItemContent } from "react-aria-components";
import { SlideoutMenu } from "@/components/application/slideout-menus/slideout-menu";
import { TreeView } from "@/components/application/tree-view/tree-view";
import { ButtonGroup, ButtonGroupItem } from "@/components/base/button-group/button-group";
import { Button } from "@/components/base/buttons/button";
import { CheckboxBase } from "@/components/base/checkbox/checkbox";
import { InputBase } from "@/components/base/input/input";
import type { Evento, Grupo, ItemDaAbertura, Sessao, TipoIngresso } from "@/plataforma";
import { cx } from "@/utils/cx";
import { paraBusca } from "../../itens/components/escala";
import { formatar, useTextosItens } from "../../itens/data/textos-itens";

/* ------------------------------------------------------------------ */
/*  Ingressos da abertura (ABV-04)                                     */
/*                                                                     */
/*  Escala de 1 a milhares de setores com centenas de ingressos        */
/*  (UI-LST-001): sessão › setor › ingresso, setores recolhidos,       */
/*  marcar a sessão ou o setor inteiro de uma vez, busca por setor ou  */
/*  ingresso, filtro "Selecionados" e "Mostrar mais". Slideout, porque */
/*  é uma escolha longa (UI-NAV-001); tela cheia no celular (UI-NAV-003).*/
/*                                                                     */
/*  Marcar o setor marca os ingressos que ele tem agora; a abertura    */
/*  grava só ingressos. Ingresso criado depois não entra sozinho       */
/*  (decisão Victor, 08/11/2026).                                      */
/* ------------------------------------------------------------------ */

const T = {
    descricao: "Marque a sessão ou o grupo para incluir todos os ingressos dele. Ingressos criados depois não entram sozinhos.",
    buscar: "Buscar grupo ou ingresso",
    todos: "Todos",
    selecionados: "Selecionados",
    filtro: "Mostrar",
    sessao: "Sessão de {data}",
    parcial: "{item}, parte marcada",
    sessaoContagem: { one: "{n} grupo", other: "{n} grupos" },
    setorContagem: { one: "{n} ingresso", other: "{n} ingressos" },
    setorParcial: "{n} de {total}",
    mostrarSetores: { one: "Mostrar mais {n} grupo", other: "Mostrar mais {n} grupos" },
    mostrarIngressos: { one: "Mostrar mais {n} ingresso", other: "Mostrar mais {n} ingressos" },
    nada: "Nada encontrado. Tente outro termo.",
    nadaSelecionado: "Nenhum grupo ou ingresso selecionado.",
    semIngressos: "O evento ainda não tem ingressos.",
    resumo: {
        nada: "Nenhum ingresso selecionado",
        ingressos: { one: "{n} ingresso", other: "{n} ingressos" },
        emSetores: { one: "{ingressos} em {n} grupo", other: "{ingressos} em {n} grupos" },
    },
    cancelar: "Cancelar",
    confirmar: "Confirmar",
};

const PASSO_SETORES = 30;
const PASSO_INGRESSOS = 50;
/** Pai das linhas de primeiro nível, para contar o "Mostrar mais". */
const RAIZ = "raiz";

interface SetorDaLista {
    setor: Grupo;
    sessaoId: string;
    /** Ingressos que casam com a busca; todos quando a busca não filtra por ingresso. */
    ingressos: TipoIngresso[];
    /** A busca achou ingressos dentro do setor: abre sozinho. */
    abertoPelaBusca: boolean;
}

/** Resumo da seleção em contagem: "60 ingressos em 7 setores". */
export function useResumoDeIngressos() {
    const { plural } = useTextosItens();
    return (ingressos: number, setores: number) =>
        ingressos === 0 ? T.resumo.nada : plural(T.resumo.emSetores, setores, { ingressos: plural(T.resumo.ingressos, ingressos) });
}

export function SeletorDeIngressos({
    titulo,
    evento,
    itens,
    onConfirmar,
    onFechar,
}: {
    titulo: string;
    evento: Evento;
    /** Ingressos já na abertura. */
    itens: ItemDaAbertura[];
    onConfirmar: (itens: ItemDaAbertura[]) => void;
    onFechar: () => void;
}) {
    const { dataCurta, numero, plural, locale } = useTextosItens();
    const resumir = useResumoDeIngressos();
    const variasSessoes = evento.sessoes.length > 1;
    // Duas sessões no mesmo dia teriam o mesmo rótulo: a hora entra para separar (UI-LST-001).
    const rotuloDaSessao = (sessao: { inicio: string }) => {
        const data = dataCurta(sessao.inicio);
        const mesmoDia = evento.sessoes.filter((s) => dataCurta(s.inicio) === data).length > 1;
        const hora = new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }).format(new Date(sessao.inicio));
        return formatar(T.sessao, { data: mesmoDia ? `${data}, ${hora}` : data });
    };

    // Por dentro, setor com todos os ingressos marcados vira um marcador só (não percorre 300 a cada clique).
    const [inicial] = useState(() => {
        const marcados = new Set(itens.filter((i) => i.tipo === "ingresso").map((i) => i.id));
        const completos = new Set<string>();
        for (const s of evento.sessoes)
            for (const g of s.grupos)
                if (g.ingressos.length > 0 && g.ingressos.every((t) => marcados.has(t.id))) {
                    completos.add(g.id);
                    for (const t of g.ingressos) marcados.delete(t.id);
                }
        return { completos, marcados };
    });
    const [setores, setSetores] = useState(inicial.completos);
    const [ingressos, setIngressos] = useState(inicial.marcados);
    // Chaves da árvore: "s:" sessão, "g:" setor, "t:" ingresso, "mais:" mostrar mais.
    const [abertos, setAbertos] = useState<Set<string>>(() => new Set(evento.sessoes.map((s) => `s:${s.id}`)));
    /** Quantas linhas cada pai mostra (UI-LST-001). */
    const [limites, setLimites] = useState<Map<string, number>>(() => new Map());
    const [busca, setBusca] = useState("");
    const [filtro, setFiltro] = useState<"todos" | "selecionados">("todos");
    const termo = paraBusca(useDeferredValue(busca).trim());

    /** Quantos ingressos do setor estão marcados um a um. */
    const marcadosNoSetor = (s: Grupo) => s.ingressos.reduce((n, t) => n + (ingressos.has(t.id) ? 1 : 0), 0);

    // Lista achatada de setores, com o rótulo da sessão no primeiro setor de cada uma.
    const lista = useMemo<SetorDaLista[]>(() => {
        const out: SetorDaLista[] = [];
        for (const sessao of evento.sessoes) {
            for (const setor of sessao.grupos) {
                if (filtro === "selecionados" && !setores.has(setor.id) && !setor.ingressos.some((t) => ingressos.has(t.id))) continue;
                let doSetor = setor.ingressos;
                let abertoPelaBusca = false;
                if (termo && !paraBusca(setor.nome).includes(termo)) {
                    doSetor = setor.ingressos.filter((t) => paraBusca(t.nome).includes(termo));
                    if (doSetor.length === 0) continue;
                    abertoPelaBusca = true;
                }
                out.push({ setor, sessaoId: sessao.id, ingressos: doSetor, abertoPelaBusca });
            }
        }
        return out;
        // A seleção só entra no filtro "Selecionados"; fora dele, marcar não refaz a lista.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [evento, termo, filtro, filtro === "selecionados" ? setores : null, filtro === "selecionados" ? ingressos : null]);

    const alternarSetor = (s: Grupo, on: boolean) => {
        setSetores((a) => {
            const p = new Set(a);
            if (on) p.add(s.id);
            else p.delete(s.id);
            return p;
        });
        // Setor inteiro substitui os ingressos marcados um a um (e desmarcar limpa os dois).
        setIngressos((a) => {
            const p = new Set(a);
            for (const t of s.ingressos) p.delete(t.id);
            return p;
        });
    };

    const alternarIngresso = (s: Grupo, t: TipoIngresso, on: boolean) => {
        if (setores.has(s.id)) {
            // Desmarcar um ingresso de um setor inteiro: o setor vira seleção de ingressos.
            setSetores((a) => {
                const p = new Set(a);
                p.delete(s.id);
                return p;
            });
            setIngressos((a) => {
                const p = new Set(a);
                for (const x of s.ingressos) if (x.id !== t.id) p.add(x.id);
                return p;
            });
            return;
        }
        const marcados = marcadosNoSetor(s) + (on ? 1 : -1);
        if (on && marcados === s.ingressos.length) return alternarSetor(s, true);
        setIngressos((a) => {
            const p = new Set(a);
            if (on) p.add(t.id);
            else p.delete(t.id);
            return p;
        });
    };

    const alternarSessao = (sessaoId: string, on: boolean) => {
        const sessao = evento.sessoes.find((s) => s.id === sessaoId);
        if (!sessao) return;
        setSetores((a) => {
            const p = new Set(a);
            for (const g of sessao.grupos) {
                if (on) p.add(g.id);
                else p.delete(g.id);
            }
            return p;
        });
        setIngressos((a) => {
            const p = new Set(a);
            for (const g of sessao.grupos) for (const t of g.ingressos) p.delete(t.id);
            return p;
        });
    };

    // Busca ou filtro novo: sessões abertas, setores achados pelo ingresso abertos, listas do começo.
    useEffect(() => {
        setAbertos(new Set([...evento.sessoes.map((s) => `s:${s.id}`), ...lista.filter((i) => i.abertoPelaBusca).map((i) => `g:${i.setor.id}`)]));
        setLimites(new Map());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [termo, filtro]);

    const limite = (pai: string, passo: number) => limites.get(pai) ?? passo;
    const mostrarMais = (pai: string, passo: number) => setLimites((m) => new Map(m).set(pai, (m.get(pai) ?? passo) + passo));

    const porSessao = useMemo(
        () =>
            evento.sessoes.map((sessao: Sessao) => ({ sessao, setores: lista.filter((i) => i.sessaoId === sessao.id) })).filter((g) => g.setores.length > 0),
        [evento, lista],
    );

    const estadoDoSetor = (g: Grupo): "inteiro" | "parcial" | "nenhum" =>
        setores.has(g.id) ? "inteiro" : g.ingressos.some((t) => ingressos.has(t.id)) ? "parcial" : "nenhum";

    const acharIngresso = (id: string) => {
        for (const s of evento.sessoes) for (const g of s.grupos) for (const t of g.ingressos) if (t.id === id) return { g, t };
    };

    // Clique na linha: grupo abre e fecha; ingresso marca; "Mostrar mais" carrega o próximo bloco.
    const aoClicarNaLinha = (k: Key) => {
        const chave = String(k);
        if (chave.startsWith("mais:")) {
            const pai = chave.slice(5);
            return mostrarMais(pai, pai.startsWith("g:") ? PASSO_INGRESSOS : PASSO_SETORES);
        }
        if (chave.startsWith("t:")) {
            const achado = acharIngresso(chave.slice(2));
            if (achado) alternarIngresso(achado.g, achado.t, !(setores.has(achado.g.id) || ingressos.has(achado.t.id)));
            return;
        }
        setAbertos((a) => {
            const p = new Set(a);
            if (p.has(chave)) p.delete(chave);
            else p.add(chave);
            return p;
        });
    };

    const renderSetores = (doPai: SetorDaLista[], pai: string) => {
        const n = limite(pai, PASSO_SETORES);
        const restantes = doPai.length - n;
        return (
            <>
                {doPai.slice(0, n).map((item) => {
                    const { setor } = item;
                    const estado = estadoDoSetor(setor);
                    const marcados = estado === "inteiro" ? setor.ingressos.length : estado === "parcial" ? marcadosNoSetor(setor) : 0;
                    const chave = `g:${setor.id}`;
                    const nIngressos = limite(chave, PASSO_INGRESSOS);
                    return (
                        <TreeView.Item key={setor.id} id={chave} textValue={setor.nome}>
                            <TreeView.ItemContent
                                icon={<Caixa rotulo={setor.nome} marcado={estado === "inteiro"} parcial={estado === "parcial"} onChange={(on) => alternarSetor(setor, on)} />}
                                action={
                                    <Contagem>
                                        {estado === "parcial"
                                            ? formatar(T.setorParcial, { n: numero(marcados), total: numero(setor.ingressos.length) })
                                            : plural(T.setorContagem, setor.ingressos.length)}
                                    </Contagem>
                                }
                            >
                                {setor.nome}
                            </TreeView.ItemContent>
                            {/* Ingressos só existem na árvore com o setor aberto: mil setores fechados não pesam.
                                Fechado, entra só o primeiro (escondido), para a árvore saber que o setor abre. */}
                            {!abertos.has(chave) && item.ingressos[0] && <LinhaIngresso t={item.ingressos[0]} marcado={false} onChange={() => {}} />}
                            {abertos.has(chave) && (
                                <>
                                    {item.ingressos.slice(0, nIngressos).map((t) => (
                                        <LinhaIngresso
                                            key={t.id}
                                            t={t}
                                            marcado={estado === "inteiro" || ingressos.has(t.id)}
                                            onChange={(on) => alternarIngresso(setor, t, on)}
                                        />
                                    ))}
                                    {item.ingressos.length > nIngressos && (
                                        <LinhaMostrarMais
                                            id={`mais:${chave}`}
                                            texto={plural(T.mostrarIngressos, Math.min(PASSO_INGRESSOS, item.ingressos.length - nIngressos))}
                                        />
                                    )}
                                </>
                            )}
                        </TreeView.Item>
                    );
                })}
                {restantes > 0 && <LinhaMostrarMais id={`mais:${pai}`} comSeta texto={plural(T.mostrarSetores, Math.min(PASSO_SETORES, restantes))} />}
            </>
        );
    };

    // Grava só ingressos: o setor marcado vira os ingressos que ele tem agora.
    const confirmar = () => {
        const ids = new Set(ingressos);
        for (const s of evento.sessoes) for (const g of s.grupos) if (setores.has(g.id)) for (const t of g.ingressos) ids.add(t.id);
        onConfirmar([...ids].map((id) => ({ tipo: "ingresso" as const, id })));
    };
    const total = useMemo(() => {
        let n = ingressos.size;
        let m = 0;
        for (const s of evento.sessoes)
            for (const g of s.grupos) {
                if (setores.has(g.id)) {
                    n += g.ingressos.length;
                    m++;
                } else if (g.ingressos.some((t) => ingressos.has(t.id))) m++;
            }
        return { ingressos: n, setores: m };
    }, [evento, setores, ingressos]);
    const temIngressos = evento.sessoes.some((s) => s.grupos.some((g) => g.ingressos.length > 0));

    return (
        <SlideoutMenu
            isOpen
            isDismissable
            onOpenChange={(v) => !v && onFechar()}
            // Celular: tela cheia (UI-NAV-003). A classe vale para o fundo e o painel, então só o recuo muda.
            // z-50: acima do cabeçalho fixo do Backstage no celular (z-30).
            className="z-50 pl-0"
            dialogClassName="gap-0"
        >
            <SlideoutMenu.Header onClose={onFechar} className="flex flex-col gap-1 pb-4">
                <h2 className="pr-8 text-lg font-semibold text-primary">{titulo}</h2>
                <p className="text-sm text-tertiary">{T.descricao}</p>
            </SlideoutMenu.Header>

            {!temIngressos ? (
                <SlideoutMenu.Content>
                    <p className="text-sm text-tertiary">{T.semIngressos}</p>
                </SlideoutMenu.Content>
            ) : (
                <>
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
                            <ButtonGroupItem id="selecionados">{T.selecionados}</ButtonGroupItem>
                        </ButtonGroup>
                    </div>

                    <SlideoutMenu.Content className="gap-1 border-t border-secondary pt-3 pb-4">
                        {lista.length > 0 && (
                            <TreeView
                                aria-label={titulo}
                                size="sm"
                                showConnectors
                                // A árvore não seleciona: a linha inteira abre e fecha o grupo (ou marca o
                                // ingresso) e a caixa à esquerda marca. Com seleção da árvore, o clique na
                                // linha marcaria em vez de abrir.
                                selectionMode="none"
                                expandedKeys={abertos}
                                onExpandedChange={(k) => setAbertos(new Set([...k].map(String)))}
                                onAction={aoClicarNaLinha}
                            >
                                {variasSessoes
                                    ? porSessao.map(({ sessao, setores: doGrupo }) => {
                                          const marcadosNaSessao = doGrupo.filter((i) => estadoDoSetor(i.setor) !== "nenhum").length;
                                          const inteira = doGrupo.length > 0 && sessao.grupos.every((g) => setores.has(g.id));
                                          return (
                                              <TreeView.Item key={sessao.id} id={`s:${sessao.id}`} textValue={rotuloDaSessao(sessao)}>
                                                  <TreeView.ItemContent
                                                      icon={
                                                          <Caixa
                                                              rotulo={rotuloDaSessao(sessao)}
                                                              marcado={inteira}
                                                              parcial={!inteira && marcadosNaSessao > 0}
                                                              onChange={(on) => alternarSessao(sessao.id, on)}
                                                          />
                                                      }
                                                      action={<Contagem>{plural(T.sessaoContagem, sessao.grupos.length)}</Contagem>}
                                                  >
                                                      {rotuloDaSessao(sessao)}
                                                  </TreeView.ItemContent>
                                                  {abertos.has(`s:${sessao.id}`) ? (
                                                      renderSetores(doGrupo, `s:${sessao.id}`)
                                                  ) : (
                                                      // Fechada, entra só um filho escondido: a seta continua visível e a árvore sabe que abre.
                                                      <TreeView.Item id={`g:${doGrupo[0].setor.id}`} textValue={doGrupo[0].setor.nome}>
                                                          <TreeView.ItemContent>{doGrupo[0].setor.nome}</TreeView.ItemContent>
                                                      </TreeView.Item>
                                                  )}
                                              </TreeView.Item>
                                          );
                                      })
                                    : renderSetores(lista, RAIZ)}
                            </TreeView>
                        )}
                        {lista.length === 0 && <p className="px-2 py-2 text-sm text-tertiary">{filtro === "selecionados" && !termo ? T.nadaSelecionado : T.nada}</p>}
                    </SlideoutMenu.Content>
                </>
            )}

            <SlideoutMenu.Footer className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm text-tertiary" role="status">
                    {resumir(total.ingressos, total.setores)}
                </span>
                <div className="flex flex-col-reverse gap-3 sm:flex-row">
                    <Button color="secondary" size="md" onClick={onFechar}>
                        {T.cancelar}
                    </Button>
                    <Button color="primary" size="md" onClick={confirmar}>
                        {T.confirmar}
                    </Button>
                </div>
            </SlideoutMenu.Footer>
        </SlideoutMenu>
    );
}

/**
 * Caixa de marcar dentro da linha. Mesmo padrão da seta do TreeView do DS: um botão do react-aria
 * dentro da linha segura o toque, então marcar não abre nem fecha o grupo. Desenho do CheckboxBase.
 */
function Caixa({ rotulo, marcado, parcial, onChange }: { rotulo: string; marcado: boolean; parcial?: boolean; onChange: (on: boolean) => void }) {
    return (
        // Botão de alternar (aria-pressed): o Button do react-aria não repassa role nem aria-checked.
        <AriaToggleButton
            aria-label={parcial ? formatar(T.parcial, { item: rotulo }) : rotulo}
            isSelected={marcado}
            onChange={() => onChange(!marcado)}
            className="flex shrink-0 items-center justify-center rounded outline-hidden"
        >
            {({ isFocusVisible }) => <CheckboxBase size="sm" isSelected={marcado || !!parcial} isIndeterminate={parcial} isFocusVisible={isFocusVisible} />}
        </AriaToggleButton>
    );
}

function LinhaIngresso({ t, marcado, onChange }: { t: TipoIngresso; marcado: boolean; onChange: (on: boolean) => void }) {
    return (
        <TreeView.Item id={`t:${t.id}`} textValue={t.nome}>
            <TreeView.ItemContent icon={<Caixa rotulo={t.nome} marcado={marcado} onChange={onChange} />}>{t.nome}</TreeView.ItemContent>
        </TreeView.Item>
    );
}

/** Contagem à direita da linha. */
function Contagem({ children }: { children: ReactNode }) {
    return <span className="shrink-0 text-sm text-tertiary tabular-nums">{children}</span>;
}

/** Linha "Mostrar mais" dentro da árvore, no nível dos irmãos e sem caixa de marcar. */
function LinhaMostrarMais({ id, texto, comSeta = false }: { id: string; texto: string; comSeta?: boolean }) {
    return (
        <TreeView.Item id={id} textValue={texto}>
            <AriaTreeItemContent>
                {({ level, isFocusVisible }) => (
                    <div
                        className={cx(
                            "flex w-full cursor-pointer items-center rounded-sm py-1.5 pr-2 text-sm font-semibold text-brand-secondary -outline-offset-2 outline-focus-ring hover:bg-primary_hover hover:text-brand-secondary_hover",
                            isFocusVisible && "outline-2",
                        )}
                        // Alinha com o nome das linhas irmãs: 8 px + 24 px por nível, mais a caixa (e a seta, se houver).
                        style={{ paddingLeft: 8 + (level - 1) * 24 + 24 + (comSeta ? 24 : 0) }}
                    >
                        {texto}
                    </div>
                )}
            </AriaTreeItemContent>
        </TreeView.Item>
    );
}
