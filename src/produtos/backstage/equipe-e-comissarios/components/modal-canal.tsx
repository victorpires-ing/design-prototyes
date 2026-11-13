import { useState } from "react";
import { toast } from "sonner";
import { XClose } from "@untitledui/icons";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
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
    canalNovo,
    codigoSugerido,
    DICA_CANAL,
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

/**
 * Configurar um canal do grupo (ECO-13 a ECO-17): itens, cota e, em PDV e Bilheteria de grupo com
 * comissário, se a venda gera comissão. Ligar o canal Comissário transforma o próprio grupo em
 * comissário: código, responsável e condições (ECO-09, ECO-20). Cada canal salva direto.
 */
export function ModalCanal({
    grupo,
    canal,
    comissario,
    codigosDoEvento = [],
    temVendas = false,
    onFechar,
}: {
    grupo: GrupoEquipe;
    canal: CanalGrupo;
    comissario?: Comissario;
    /** Códigos dos outros grupos-comissário do evento (o código é único no evento). */
    codigosDoEvento?: string[];
    /** O grupo já vendeu como comissário neste evento: não deixa de ser comissário. */
    temVendas?: boolean;
    onFechar: () => void;
}) {
    const atual = canal === "link" && !comissario ? undefined : grupo.canais[canal];
    const base = atual ?? canalNovo(canal);
    const ehLink = canal === "link";
    const [itens, setItens] = useState<string[]>(base.itens.filter((id) => ITEM_POR_ID[id]));
    const [todos, setTodos] = useState(!!base.todos);
    const [tipoCota, setTipoCota] = useState<TipoCota>(base.cota.tipo);
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
    const errosCond = validarCondicoes(condicoes);
    const codigoRepetido = codigosDoEvento.includes(codigo);
    const [seletor, setSeletor] = useState<TipoItem | null>(null);
    const evento = useEventoAtual();
    const doBanco = useDoc("eventos", evento.id);
    const resumir = useResumoDeIngressos();

    const doTipo = (tipo: TipoItem) => itens.filter((id) => ITEM_POR_ID[id]?.tipo === tipo);
    const trocarDoTipo = (tipo: TipoItem, ids: string[]) => setItens([...itens.filter((id) => ITEM_POR_ID[id]?.tipo !== tipo), ...ids]);
    const ingressos = doTipo("ingresso");
    const setores = new Set(ingressos.map((id) => {
        const i = ITEM_POR_ID[id];
        return i?.tipo === "ingresso" ? `${i.sessaoId}:${i.grupo}` : "";
    })).size;
    // No link com "Todos os ingressos" a cota por item vale para os ingressos de hoje.
    const itensDaCota = ehLink && todos ? INGRESSOS.map((i) => i.id) : itens;
    const semCota = tipoCota === "por-item" ? itensDaCota.filter((id) => !((porItem[id] ?? 0) > 0)).length : 0;
    const erros = {
        codigo: !ehLink
            ? undefined
            : codigo.length < 3
              ? "Use de 3 a 20 letras ou números."
              : codigoRepetido
                ? `${codigo} já é usado neste evento. Escolha outro código.`
                : undefined,
        responsavel: ehLink && !responsavel ? "Escolha quem responde pelo comissário." : undefined,
        condicoes: ehLink && (errosCond.comissao || errosCond.desconto) ? "Revise as condições." : undefined,
        itens: !(ehLink && todos) && itens.length === 0 ? (ehLink ? "Escolha ao menos um ingresso." : "Escolha ao menos um ingresso, produto ou combo.") : undefined,
        cota:
            tipoCota === "compartilhada" && !(total > 0)
                ? "Informe a cota total do canal."
                : semCota > 0
                  ? `Informe a cota de ${semCota === 1 ? "1 item" : `${semCota} itens`}. Use "Mesma cota para vários itens" para preencher de uma vez.`
                  : undefined,
    };

    const salvar = () => {
        if (erros.itens || erros.cota || erros.codigo || erros.responsavel || erros.condicoes) {
            setTentou(true);
            toast.error("Revise o que falta para salvar.");
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
        onFechar();
    };

    return (
        <>
        <ModalOverlay isOpen onOpenChange={(abrir) => !abrir && onFechar()} isDismissable className="bg-black/40 backdrop-blur-[16px]">
            <Modal className="max-w-[720px]">
                <Dialog aria-label={`Configurar ${ROTULO_CANAL[canal]}`}>
                    <div className="relative flex max-h-[calc(100dvh-96px)] w-full flex-col overflow-hidden rounded-2xl bg-primary shadow-xl ring-1 ring-border-secondary ring-inset">
                        <button
                            type="button"
                            onClick={onFechar}
                            aria-label="Fechar"
                            className="absolute top-4 right-4 flex size-9 items-center justify-center rounded-lg text-fg-quaternary transition duration-100 ease-linear hover:bg-primary_hover hover:text-fg-quaternary_hover"
                        >
                            <XClose className="size-5" aria-hidden="true" />
                        </button>
                        <div className="flex shrink-0 flex-col gap-0.5 px-6 pt-6 pr-14">
                            <h2 className="text-md font-semibold text-primary">{ROTULO_CANAL[canal]}</h2>
                            <p className="text-sm text-tertiary">{DICA_CANAL[canal]}</p>
                        </div>

                        <div className="flex min-h-0 flex-col gap-6 overflow-y-auto px-6 pt-5">
                            {ehLink && (
                                <section className="flex flex-col gap-4" data-alerta={tentou && (erros.codigo || erros.responsavel || erros.condicoes) ? true : undefined}>
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
                                    <div className="flex flex-col gap-3 border-t border-secondary pt-5">
                                        <h3 className="text-sm font-semibold text-primary">Condições</h3>
                                        <EditorDeCondicoes valor={condicoes} onChange={setCondicoes} erros={errosCond} mostrarErros={tentou} />
                                        <p className="text-sm text-tertiary">Mudar depois vale para as próximas vendas; as feitas mantêm a condição da hora da venda.</p>
                                    </div>
                                </section>
                            )}
                            <section className={ehLink ? "flex flex-col gap-3 border-t border-secondary pt-5" : "flex flex-col gap-3"} data-alerta={tentou && erros.itens ? true : undefined}>
                                <h3 className="text-sm font-semibold text-primary">{ehLink ? "Ingressos do link" : "Itens"}</h3>
                                {ehLink && (
                                    <RadioGroup aria-label="Ingressos do link" value={todos ? "todos" : "escolhidos"} onChange={(v) => setTodos(v === "todos")} className="gap-3">
                                        <RadioButton value="todos" label="Todos os ingressos" hint="Inclui os que forem criados depois." />
                                        <RadioButton value="escolhidos" label="Só os escolhidos" hint="Os outros continuam à venda, sem contar para o comissário." />
                                    </RadioGroup>
                                )}
                                {!(ehLink && todos) &&
                                    (INGRESSOS.length + PRODUTOS.length + COMBOS.length === 0 ? (
                                        <p className="text-sm text-tertiary">Este evento ainda não tem ingressos, produtos nem combos. Crie em Itens e volte aqui.</p>
                                    ) : (
                                        <ListaDeEscolhas>
                                            <EscolhaEmLista
                                                rotulo="Ingressos"
                                                escolhidos={ingressos.length ? [resumir(ingressos.length, setores)] : []}
                                                vazio="Nenhum ingresso"
                                                onEscolher={() => setSeletor("ingresso")}
                                            />
                                            {!ehLink && PRODUTOS.length > 0 && (
                                                <EscolhaEmLista rotulo="Produtos" escolhidos={doTipo("produto").map((id) => ITEM_POR_ID[id].nome)} vazio="Nenhum produto" onEscolher={() => setSeletor("produto")} />
                                            )}
                                            {!ehLink && COMBOS.length > 0 && (
                                                <EscolhaEmLista rotulo="Combos" escolhidos={doTipo("combo").map((id) => ITEM_POR_ID[id].nome)} vazio="Nenhum combo" onEscolher={() => setSeletor("combo")} />
                                            )}
                                        </ListaDeEscolhas>
                                    ))}
                                {tentou && erros.itens && <p className="text-sm text-error-primary">{erros.itens}</p>}
                            </section>

                            <section className="flex flex-col gap-3 border-t border-secondary pt-5">
                                <h3 className="text-sm font-semibold text-primary">Cota</h3>
                                <RadioGroup aria-label="Tipo de cota" value={tipoCota} onChange={(v) => setTipoCota(v as TipoCota)} className="gap-3">
                                    <RadioButton value="sem-limite" label="Sem limite definido" hint="Até acabar o estoque dos itens." />
                                    <RadioButton value="compartilhada" label="Cota compartilhada" hint="Um total para o canal, somando todos os itens." />
                                    <RadioButton value="por-item" label="Cota por item" hint="Um limite para cada item." />
                                </RadioGroup>
                                <Surgir visivel={tipoCota === "compartilhada"}>
                                    <div className="max-w-60 pt-2" data-alerta={tentou && erros.cota ? true : undefined}>
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
                                    <div className="flex flex-col gap-3 pt-2" data-alerta={tentou && erros.cota ? true : undefined}>
                                        <CotasPorItem itens={itensDaCota} valores={porItem} onValores={(v) => setPorItem((p) => ({ ...p, ...v }))} mostrarErros={tentou} />
                                        {tentou && erros.cota && <p className="text-sm text-error-primary">{erros.cota}</p>}
                                    </div>
                                </Surgir>
                            </section>

                            {(canal === "pdv" || canal === "bilheteria") && grupo.comissarioId && (
                                <section className="flex flex-col gap-3 border-t border-secondary pt-5">
                                    <Toggle
                                        className="w-full"
                                        label="Gera comissão"
                                        hint="A venda feita pelas pessoas do grupo neste canal conta para o comissário, com a condição dele."
                                        isSelected={comissao}
                                        onChange={setComissao}
                                    />
                                </section>
                            )}
                            {canal === "cortesia" && grupo.comissarioId && <p className="border-t border-secondary pt-5 text-sm text-tertiary">Cortesia não gera comissão.</p>}
                        </div>

                        {ehLink && comissario && (
                            <div className="flex shrink-0 flex-col items-start gap-1 border-t border-secondary px-6 pt-4">
                                <Button color="link-destructive" size="sm" isDisabled={temVendas} onClick={() => setRemovendo(true)}>
                                    Deixar de ser comissário
                                </Button>
                                {temVendas && <p className="text-sm text-tertiary">Com vendas neste evento, ele fica: o histórico e o saldo continuam.</p>}
                            </div>
                        )}
                        <div className="mt-6 flex shrink-0 gap-3 border-t border-secondary p-6">
                            <Button size="md" color="secondary" className="flex-1" onClick={onFechar}>
                                Cancelar
                            </Button>
                            <Button size="md" color="primary" className="flex-1" onClick={salvar}>
                                {atual ? "Salvar alterações" : "Salvar e ligar"}
                            </Button>
                        </div>
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>

            <ModalDesativar
                aberto={removendo}
                titulo={`${grupo.nome} deixa de ser comissário?`}
                descricao="O canal Comissário volta para não configurado, o link e o cupom param de funcionar, PDV e Bilheteria deixam de gerar comissão e as pessoas perdem o cargo Comissário. As pessoas continuam no grupo."
                acao="Deixar de ser comissário"
                onCancelar={() => setRemovendo(false)}
                onConfirmar={() => {
                    tornarComissario(grupo.id, null);
                    toast.success(`${grupo.nome} não é mais comissário.`);
                    onFechar();
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
