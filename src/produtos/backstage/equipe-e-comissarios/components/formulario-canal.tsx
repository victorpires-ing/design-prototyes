import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Ticket02 } from "@untitledui/icons";
import { EmptyState } from "@/components/application/empty-state/empty-state";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { RadioButton, RadioGroup } from "@/components/base/radio-buttons/radio-buttons";
import { Select } from "@/components/base/select/select";
import { Toggle } from "@/components/base/toggle/toggle";
import { Surgir } from "@/components/foundations/transicao";
import { useDoc } from "@/plataforma";
import { SeletorDeIngressos, useResumoDeIngressos } from "../../aberturas-de-vendas/components/SeletorDeIngressos";
import { useEventoAtual } from "../../eventos/data/eventos";
import { EditorDeCondicoes, validarCondicoes } from "../../comissarios/components/condicoes";
import { EscolhaEmLista, ListaDeEscolhas, irParaPrimeiroErro } from "../../itens/components/comuns";
import { SeletorDeLista } from "../../itens/components/SeletorDeLista";
import { COMBOS, INGRESSOS, ITEM_POR_ID, PRODUTOS } from "../data/catalogo-evento";
import {
    CANAIS_GRUPO,
    canalNovo,
    codigoSugerido,
    normalizarCodigo,
    pessoasDoGrupo,
    ROTULO_CANAL,
    salvarCanal,
    tornarComissario,
    type CanalGrupo,
    type Comissario,
    type Condicoes,
    type GrupoEquipe,
    type TipoCota,
} from "../data/equipe";
import { ModalDesativar } from "./modal-desativar";
import { CotasPorItem, soNumero } from "./cotas-por-item";

type TipoItem = "ingresso" | "produto" | "combo";

/** Caminho de Itens, para o evento sem nada à venda (ECO-37). */
export const CAMINHO_CRIAR_INGRESSOS = "/backstage/catalogo/ingressos";

/** O evento ainda não tem ingresso, produto nem combo: canal nenhum tem o que vender (ECO-37). */
export const eventoSemItens = () => INGRESSOS.length + PRODUTOS.length + COMBOS.length === 0;

/**
 * Configurar um canal do grupo, em página (ECO-14): itens, cota e, em PDV e Bilheteria de grupo com
 * comissário, se a venda gera comissão. Ligar o canal Comissário transforma o próprio grupo em
 * comissário: código, responsável e condições (ECO-09, ECO-20). Salvar grava direto e volta ao grupo.
 */
export function FormularioCanal({
    grupo,
    canal,
    comissario,
    codigosDoEvento = [],
    temVendas = false,
    onSair,
    onCriarItens,
    cabecalho,
}: {
    grupo: GrupoEquipe;
    canal: CanalGrupo;
    comissario?: Comissario;
    /** Códigos dos outros grupos-comissário do evento (o código é único no evento). */
    codigosDoEvento?: string[];
    /** O grupo já vendeu como comissário neste evento: não deixa de ser comissário. */
    temVendas?: boolean;
    onSair: () => void;
    onCriarItens: () => void;
    /** Cabeçalho da página; recebe o sair que confere alterações (ECO-46). */
    cabecalho: (sair: () => void) => ReactNode;
}) {
    const atual = canal === "link" && !comissario ? undefined : grupo.canais[canal];
    const base = atual ?? canalNovo(canal);
    const ehLink = canal === "link";
    const semIngressos = INGRESSOS.length === 0;
    const [itens, setItens] = useState<string[]>(base.itens.filter((id) => ITEM_POR_ID[id]));
    // Sem ingresso no evento, o link só pode valer para todos (os criados depois entram) (ECO-15).
    const [todos, setTodos] = useState(!!base.todos || (ehLink && semIngressos));
    // Cortesia não nasce sem limite: a pessoa escolhe como limitar (ECO-38).
    const [tipoCota, setTipoCota] = useState<TipoCota | null>(!atual && canal === "cortesia" ? null : base.cota.tipo);
    const [total, setTotal] = useState(base.cota.total);
    const [porItem, setPorItem] = useState<Record<string, number>>(base.cota.porItem);
    const [comissao, setComissao] = useState(!!base.comissao);
    const [tentou, setTentou] = useState(false);
    // Canal Comissário: o próprio grupo é o comissário (código, responsável e condições).
    const pessoas = pessoasDoGrupo(grupo);
    const [codigo, setCodigo] = useState(grupo.codigo ?? codigoSugerido(grupo.nome));
    const [responsavel, setResponsavel] = useState<string | null>(pessoas[0]?.email ?? null);
    const [condicoes, setCondicoes] = useState<Condicoes>(grupo.condicoes ?? { tipo: "percentual", comissao: 5, desconto: null });
    const [removendo, setRemovendo] = useState(false);
    const [descartando, setDescartando] = useState(false);
    const errosCond = validarCondicoes(condicoes);
    const codigoRepetido = codigosDoEvento.includes(codigo);
    const [seletor, setSeletor] = useState<TipoItem | null>(null);
    const evento = useEventoAtual();
    const doBanco = useDoc("eventos", evento.id);
    const resumir = useResumoDeIngressos();

    // Sair com algo mudado pede confirmação, como o "Descartar o evento?" do Criar evento (ECO-46).
    const retrato = () => JSON.stringify({ itens: [...itens].sort(), todos, tipoCota, total, porItem, comissao, codigo, responsavel, condicoes });
    const [inicial] = useState(retrato);
    const alterado = retrato() !== inicial;
    const sair = () => (alterado ? setDescartando(true) : onSair());

    const doTipo = (tipo: TipoItem) => itens.filter((id) => ITEM_POR_ID[id]?.tipo === tipo);
    const trocarDoTipo = (tipo: TipoItem, ids: string[]) => setItens([...itens.filter((id) => ITEM_POR_ID[id]?.tipo !== tipo), ...ids]);
    const ingressos = doTipo("ingresso");
    const setores = new Set(
        ingressos.map((id) => {
            const i = ITEM_POR_ID[id];
            return i?.tipo === "ingresso" ? `${i.sessaoId}:${i.grupo}` : "";
        }),
    ).size;
    // No link com "Todos os ingressos" a cota por item vale para os ingressos de hoje.
    const itensDaCota = ehLink && todos ? INGRESSOS.map((i) => i.id) : itens;
    const semCota = tipoCota === "por-item" ? itensDaCota.filter((id) => !((porItem[id] ?? 0) > 0)).length : 0;

    // Outro canal do grupo já tem itens escolhidos: dá para reaproveitar em vez de escolher de novo (ECO-39).
    const reaproveitaveis = CANAIS_GRUPO.filter((c) => c !== canal && grupo.canais[c] && !grupo.canais[c]?.todos)
        .map((c) => ({ canal: c, itens: (grupo.canais[c]?.itens ?? []).filter((id) => ITEM_POR_ID[id] && (!ehLink || ITEM_POR_ID[id].tipo === "ingresso")) }))
        .filter((r) => r.itens.length > 0 && !(r.itens.length === itens.length && r.itens.every((id) => itens.includes(id))));

    const erros = {
        codigo: !ehLink ? undefined : codigo.length < 3 ? "Use de 3 a 20 letras ou números." : codigoRepetido ? `${codigo} já é usado neste evento. Escolha outro código.` : undefined,
        responsavel: ehLink && !responsavel ? "Escolha quem responde pelo comissário." : undefined,
        condicoes: ehLink && (errosCond.comissao || errosCond.desconto) ? "Revise as condições." : undefined,
        itens: !(ehLink && todos) && itens.length === 0 ? (ehLink ? "Escolha ao menos um ingresso." : "Escolha ao menos um ingresso, produto ou combo.") : undefined,
        cota: !tipoCota
            ? "Escolha como limitar as cortesias."
            : tipoCota === "compartilhada" && !(total > 0)
              ? "Informe a cota total do canal."
              : semCota > 0
                ? `Informe a cota de ${semCota === 1 ? "1 item" : `${semCota} itens`}. Use "Mesma cota para vários itens" para preencher de uma vez.`
                : undefined,
    };

    // Erro no salvar: o campo marcado e a rolagem até ele bastam, sem toast (ECO-33).
    const salvar = () => {
        if (!tipoCota || erros.itens || erros.cota || erros.codigo || erros.responsavel || erros.condicoes) {
            setTentou(true);
            irParaPrimeiroErro();
            return;
        }
        if (ehLink && responsavel) tornarComissario(grupo.id, { codigo, responsavel, condicoes });
        salvarCanal(grupo.id, canal, {
            ...base,
            ligado: atual?.ligado ?? true,
            itens: ehLink && todos ? [] : itens,
            todos: ehLink ? todos : undefined,
            cota: {
                tipo: tipoCota,
                total: tipoCota === "compartilhada" ? total : 0,
                porItem: tipoCota === "por-item" ? Object.fromEntries(itensDaCota.map((id) => [id, porItem[id] ?? 0])) : {},
            },
            comissao: canal === "pdv" || canal === "bilheteria" ? comissao : undefined,
        });
        toast.success(atual ? `${ROTULO_CANAL[canal]} atualizado.` : `${ROTULO_CANAL[canal]} configurado e ligado.`);
        onSair();
    };

    // Sem nada à venda no evento, só o link (com "Todos os ingressos") pode ser configurado (ECO-37).
    if (!ehLink && eventoSemItens())
        return (
            <>
            {cabecalho(onSair)}
            <section className="flex flex-1 items-center justify-center rounded-2xl bg-primary px-6 py-16 ring-1 ring-border-secondary ring-inset">
                <EmptyState size="sm">
                    <EmptyState.Header>
                        <EmptyState.FeaturedIcon icon={Ticket02} color="gray" theme="modern" />
                    </EmptyState.Header>
                    <EmptyState.Content>
                        <EmptyState.Title>O evento ainda não tem o que vender</EmptyState.Title>
                        <EmptyState.Description>
                            {ROTULO_CANAL[canal]} precisa de ao menos um ingresso, produto ou combo. Crie os ingressos em Itens e volte aqui para configurar o canal.
                        </EmptyState.Description>
                    </EmptyState.Content>
                    <EmptyState.Footer>
                        <Button size="md" color="secondary" onClick={onSair}>
                            Voltar para o grupo
                        </Button>
                        <Button size="md" color="primary" onClick={onCriarItens}>
                            Criar ingressos
                        </Button>
                    </EmptyState.Footer>
                </EmptyState>
            </section>
            </>
        );

    return (
        <>
            {cabecalho(sair)}
            <div className="flex flex-col gap-6">
                {ehLink && (
                    <Secao titulo="Código e responsável" data-alerta={tentou && (erros.codigo || erros.responsavel) ? true : undefined}>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Input
                                label="Código do link e do cupom"
                                isRequired
                                value={codigo}
                                onChange={(v) => setCodigo(normalizarCodigo(v))}
                                isInvalid={(tentou && !!erros.codigo) || codigoRepetido}
                                hint={(tentou || codigoRepetido) && erros.codigo ? erros.codigo : "Só letras e números. Vira o link e o cupom no checkout."}
                            />
                            <Select
                                label="Responsável"
                                isRequired
                                placeholder="Escolha uma pessoa do grupo"
                                hint={tentou && erros.responsavel ? erros.responsavel : "Vê tudo do comissário e recebe os repasses. As outras pessoas veem só o que venderam."}
                                isInvalid={tentou && !!erros.responsavel}
                                selectedKey={responsavel}
                                onSelectionChange={(k) => k && setResponsavel(String(k))}
                                items={pessoas.map((p) => ({ id: p.email, label: p.nome === p.email ? p.email : p.nome, supportingText: p.nome === p.email ? undefined : p.email }))}
                            >
                                {(item) => (
                                    <Select.Item id={item.id} supportingText={item.supportingText}>
                                        {item.label}
                                    </Select.Item>
                                )}
                            </Select>
                        </div>
                    </Secao>
                )}
                {ehLink && (
                    <Secao titulo="Condições" descricao="Mudar depois vale para as próximas vendas; as feitas mantêm a condição da hora da venda." data-alerta={tentou && erros.condicoes ? true : undefined}>
                        <EditorDeCondicoes valor={condicoes} onChange={setCondicoes} erros={errosCond} mostrarErros={tentou} />
                    </Secao>
                )}

                <Secao
                    titulo={ehLink ? "Ingressos do link" : "Itens"}
                    descricao={ehLink ? undefined : "Ingressos, produtos e combos criados depois não entram sozinhos neste canal: volte aqui para incluir."}
                    data-alerta={tentou && erros.itens ? true : undefined}
                >
                    {ehLink && (
                        <RadioGroup aria-label="Ingressos do link" value={todos ? "todos" : "escolhidos"} onChange={(v) => setTodos(v === "todos")} className="gap-3">
                            <RadioButton value="todos" label="Todos os ingressos" hint="Inclui os que forem criados depois." />
                            <RadioButton
                                value="escolhidos"
                                isDisabled={semIngressos}
                                label="Só os escolhidos"
                                hint={semIngressos ? "O evento ainda não tem ingressos para escolher." : "Os outros continuam à venda, sem contar para o comissário."}
                            />
                        </RadioGroup>
                    )}
                    <Surgir visivel={!(ehLink && todos)}>
                        <div className="flex flex-col gap-3">
                            <ListaDeEscolhas>
                                <EscolhaEmLista rotulo="Ingressos" escolhidos={ingressos.length ? [resumir(ingressos.length, setores)] : []} vazio="Nenhum ingresso" onEscolher={() => setSeletor("ingresso")} />
                                {!ehLink && PRODUTOS.length > 0 && (
                                    <EscolhaEmLista rotulo="Produtos" escolhidos={doTipo("produto").map((id) => ITEM_POR_ID[id].nome)} vazio="Nenhum produto" onEscolher={() => setSeletor("produto")} />
                                )}
                                {!ehLink && COMBOS.length > 0 && (
                                    <EscolhaEmLista rotulo="Combos" escolhidos={doTipo("combo").map((id) => ITEM_POR_ID[id].nome)} vazio="Nenhum combo" onEscolher={() => setSeletor("combo")} />
                                )}
                            </ListaDeEscolhas>
                            {reaproveitaveis.length > 0 && (
                                <div className="flex flex-wrap gap-x-4 gap-y-2">
                                    {reaproveitaveis.map((r) => (
                                        <Button key={r.canal} size="sm" color="link-color" onClick={() => setItens(r.itens)}>
                                            Usar os itens de {ROTULO_CANAL[r.canal]}
                                        </Button>
                                    ))}
                                </div>
                            )}
                            {tentou && erros.itens && <p className="text-sm text-error-primary">{erros.itens}</p>}
                        </div>
                    </Surgir>
                </Secao>

                <Secao
                    titulo="Cota"
                    descricao={canal === "cortesia" ? "Cortesia não gera receita: defina até quantas o grupo pode emitir." : undefined}
                    data-alerta={tentou && erros.cota ? true : undefined}
                >
                    <RadioGroup aria-label="Tipo de cota" value={tipoCota} onChange={(v) => setTipoCota(v as TipoCota)} isInvalid={tentou && !tipoCota} className="gap-3">
                        <RadioButton value="compartilhada" label="Cota compartilhada" hint="Um total para o canal, somando todos os itens." />
                        <RadioButton
                            value="por-item"
                            isDisabled={ehLink && todos && semIngressos}
                            label="Cota por item"
                            hint={ehLink && todos && semIngressos ? "O evento ainda não tem ingressos para limitar." : "Um limite para cada item."}
                        />
                        <RadioButton value="sem-limite" label="Sem limite definido" hint="Até acabar o estoque dos itens." />
                    </RadioGroup>
                    {tentou && !tipoCota && <p className="text-sm text-error-primary">{erros.cota}</p>}
                    <Surgir visivel={tipoCota === "compartilhada"}>
                        <div className="max-w-60 pt-2">
                            <Input
                                label="Cota total do canal"
                                isRequired
                                inputMode="numeric"
                                placeholder="0"
                                value={total ? String(total) : ""}
                                onChange={(v) => setTotal(soNumero(v))}
                                isInvalid={tentou && !!erros.cota}
                                hint={tentou ? erros.cota : undefined}
                            />
                        </div>
                    </Surgir>
                    <Surgir visivel={tipoCota === "por-item"}>
                        <div className="flex flex-col gap-3 pt-2">
                            <CotasPorItem itens={itensDaCota} valores={porItem} onValores={(v) => setPorItem((p) => ({ ...p, ...v }))} mostrarErros={tentou} />
                            {tentou && erros.cota && <p className="text-sm text-error-primary">{erros.cota}</p>}
                        </div>
                    </Surgir>
                </Secao>

                {(canal === "pdv" || canal === "bilheteria") && grupo.comissarioId && (
                    <Secao titulo="Comissão">
                        <Toggle
                            className="w-full"
                            label="Gera comissão"
                            hint="A venda feita pelas pessoas do grupo neste canal conta para o comissário, com a condição dele."
                            isSelected={comissao}
                            onChange={setComissao}
                        />
                    </Secao>
                )}

                {ehLink && comissario && (
                    <Secao titulo="Deixar de ser comissário">
                        <div className="flex flex-col items-start gap-1">
                            <Button color="link-destructive" size="sm" isDisabled={temVendas} onClick={() => setRemovendo(true)}>
                                Deixar de ser comissário
                            </Button>
                            {temVendas && <p className="text-sm text-tertiary">Com vendas neste evento, ele fica: o histórico e o saldo continuam.</p>}
                        </div>
                    </Secao>
                )}
            </div>

            {/* Mesmo padrão do Criar evento; não fica sob o Guia de configuração (GDC-43). */}
            <footer className="sticky bottom-(--guia-rodape-baixo,0px) z-20 mt-6 border-t border-secondary bg-primary_alt pr-(--guia-rodape-direita,0px)">
                <div className="flex flex-wrap items-center justify-end gap-3 py-3">
                    <Button size="md" color="secondary" onClick={sair}>
                        Cancelar
                    </Button>
                    <Button size="md" color="primary" onClick={salvar}>
                        {atual ? "Salvar alterações" : "Salvar e ligar"}
                    </Button>
                </div>
            </footer>

            <ModalDesativar
                aberto={descartando}
                titulo="Descartar as alterações?"
                descricao={`O que você mudou em ${ROTULO_CANAL[canal]} será perdido. O canal continua como estava.`}
                acao="Descartar"
                onCancelar={() => setDescartando(false)}
                onConfirmar={() => {
                    setDescartando(false);
                    onSair();
                }}
            />
            <ModalDesativar
                aberto={removendo}
                titulo={`${grupo.nome} deixa de ser comissário?`}
                descricao="O canal Comissário volta para não configurado, o link e o cupom param de funcionar, PDV e Bilheteria deixam de gerar comissão e as pessoas perdem o cargo Comissário. As pessoas continuam no grupo."
                acao="Deixar de ser comissário"
                onCancelar={() => setRemovendo(false)}
                onConfirmar={() => {
                    tornarComissario(grupo.id, null);
                    toast.success(`${grupo.nome} não é mais comissário.`);
                    onSair();
                }}
            />
            {seletor === "ingresso" && doBanco && (
                <SeletorDeIngressos
                    titulo={`Ingressos: ${ROTULO_CANAL[canal]}`}
                    evento={doBanco}
                    itens={ingressos.map((id) => ({ tipo: "ingresso" as const, id }))}
                    onFechar={() => setSeletor(null)}
                    onConfirmar={(escolhidos) => {
                        trocarDoTipo("ingresso", escolhidos.filter((i) => i.tipo === "ingresso").map((i) => i.id));
                        setSeletor(null);
                    }}
                />
            )}
            {(seletor === "produto" || seletor === "combo") && (
                <SeletorDeLista
                    titulo={seletor === "produto" ? "Produtos do canal" : "Combos do canal"}
                    opcoes={(seletor === "produto" ? PRODUTOS : COMBOS).map((i) => ({ id: i.id, rotulo: i.nome }))}
                    selecionados={doTipo(seletor)}
                    vazio={seletor === "produto" ? "Este evento não tem produtos." : "Este evento não tem combos."}
                    onFechar={() => setSeletor(null)}
                    onConfirmar={(ids) => {
                        trocarDoTipo(seletor, ids);
                        setSeletor(null);
                    }}
                />
            )}
        </>
    );
}

/** Seção do formulário: um cartão, o único contêiner, com título Text lg (régua do Criar evento, UI-VIS-018, UI-VIS-019). */
function Secao({ titulo, descricao, children, ...resto }: { titulo: string; descricao?: string; children: React.ReactNode; "data-alerta"?: true }) {
    return (
        <section className="flex flex-col gap-5 rounded-2xl bg-primary p-5 ring-1 ring-secondary md:p-6" {...resto}>
            <div className="flex flex-col gap-0.5">
                <h2 className="text-lg font-semibold text-primary">{titulo}</h2>
                {descricao && <p className="max-w-[65ch] text-sm text-tertiary">{descricao}</p>}
            </div>
            <div className="flex min-w-0 flex-col gap-3">{children}</div>
        </section>
    );
}
