import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeft, MessageQuestionSquare, Plus, Trash01 } from "@untitledui/icons";
import { EmptyState } from "@/components/application/empty-state/empty-state";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Input } from "@/components/base/input/input";
import { Select } from "@/components/base/select/select";
import { DURACAO_TRANSICAO, Surgir } from "@/components/foundations/transicao";
import type { OpcaoDaPergunta, Pergunta, TipoDePergunta } from "@/plataforma";
import { TITULO_PAGINA } from "@/produtos/backstage/components/titulo-pagina";
import { BackstageLayout } from "../../components/Backstage";
import { SeletorDeIngressos } from "../../aberturas-de-vendas/components/SeletorDeIngressos";
import { BarraDeSalvar, ConfirmarSaida, EscolhaEmLista, ListaDeEscolhas, SecaoDoItem, irParaPrimeiroErro } from "../../itens/components/comuns";
import { SeletorDeLista } from "../../itens/components/SeletorDeLista";
import { novoId, salvarPerguntas, useCatalogo } from "../../itens/data/catalogo";
import { formatar } from "../../itens/data/textos-itens";
import { LIMITE_TITULO, NOME_DO_TIPO, TIPOS_DE_PERGUNTA, perguntaNova, setoresPorIngresso, temOpcoes, validarPergunta } from "../data/questionario";
import { ConfirmarExclusao, useOndeAparece } from "./Questionario";

/* ------------------------------------------------------------------ */
/*  Página da pergunta (QST)                                           */
/*                                                                     */
/*  Página, não modal: tem várias seções e escolher os itens abre um   */
/*  slideout por cima (UI-NAV-001, UI-NAV-002). Rascunho com barra de  */
/*  salvar e confirmação ao sair, como o detalhe do ingresso.          */
/* ------------------------------------------------------------------ */

const LISTA = "/backstage/catalogo/questionario";

const T = {
    voltar: "Questionário",
    nova: "Nova pergunta",
    naoEncontrada: "Pergunta não encontrada",
    naoEncontradaDica: "Ela pode ter sido excluída ou o link está incompleto.",
    pergunta: "Pergunta",
    titulo: "Texto da pergunta",
    tituloPlaceholder: "Ex.: Tamanho da camiseta",
    tituloContador: "{n} de 200 caracteres",
    tituloErro: "Escreva a pergunta.",
    tipo: "Tipo de resposta",
    opcoes: "Opções",
    opcoesDica: "Estoque vazio é sem limite. Opção com estoque 0 aparece como esgotada.",
    opcao: "Opção {n}",
    estoque: "Estoque",
    semLimite: "Sem limite",
    removerOpcao: "Remover {opcao}",
    adicionarOpcao: "Adicionar opção",
    poucasOpcoes: "Crie pelo menos 2 opções.",
    opcaoSemNome: "Dê um nome a cada opção.",
    opcaoRepetida: "Duas opções têm o mesmo nome.",
    esgotada: "Esgotada",
    onde: "Onde aparece",
    ondeDica: "Quem compra responde uma vez por ingresso ou combo, na compra e na transferência.",
    ingressos: "Ingressos",
    nenhumIngresso: "Nenhum ingresso",
    escolherIngressos: "Escolher ingressos",
    combos: "Combos",
    nenhumCombo: "Nenhum combo",
    escolherCombos: "Escolher combos",
    seletorIngressos: "Ingressos com esta pergunta",
    seletorCombos: "Combos com esta pergunta",
    semCombos: "O evento ainda não tem combos.",
    semItens: "Sem ingressos nem combos, a pergunta não aparece para ninguém.",
    regras: "Resposta",
    obrigatoria: "Obrigatória",
    obrigatoriaDica: "Sem resposta, a compra não termina.",
    excluir: "Excluir pergunta",
    criada: "Pergunta criada.",
    salvo: "Alterações salvas.",
    excluida: "Pergunta excluída.",
    erro: "Tente de novo: não foi possível salvar.",
    corrigir: "Corrija os campos destacados para salvar.",
};

export function PerguntaDetalhe() {
    const { id = "" } = useParams();
    const { carregando, evento } = useCatalogo();
    const nova = id === "nova";
    const original = nova ? null : evento?.perguntas?.find((p) => p.id === id);

    return (
        <BackstageLayout activeSection="questionario" activeItem="catalogo-questionario">
            {carregando ? (
                <div role="status" className="flex flex-col gap-3">
                    <span aria-hidden="true" className="h-10 w-64 animate-pulse rounded-lg bg-secondary motion-reduce:animate-none" />
                    <span aria-hidden="true" className="h-48 w-full animate-pulse rounded-2xl bg-secondary motion-reduce:animate-none" />
                </div>
            ) : !nova && !original ? (
                <NaoEncontrada />
            ) : (
                <Editor key={id} original={original ?? null} />
            )}
        </BackstageLayout>
    );
}

function NaoEncontrada() {
    const navigate = useNavigate();
    return (
        <div className="flex items-center justify-center py-16">
            <EmptyState size="sm">
                <EmptyState.Header>
                    <EmptyState.FeaturedIcon icon={MessageQuestionSquare} color="gray" theme="modern" />
                </EmptyState.Header>
                <EmptyState.Content>
                    <EmptyState.Title>{T.naoEncontrada}</EmptyState.Title>
                    <EmptyState.Description>{T.naoEncontradaDica}</EmptyState.Description>
                </EmptyState.Content>
                <EmptyState.Footer>
                    <Button color="secondary" size="md" iconLeading={ArrowLeft} onClick={() => navigate(LISTA)}>
                        {T.voltar}
                    </Button>
                </EmptyState.Footer>
            </EmptyState>
        </div>
    );
}

function Editor({ original }: { original: Pergunta | null }) {
    const navigate = useNavigate();
    const reduzir = useReducedMotion();
    const { evento } = useCatalogo();
    const ondeAparece = useOndeAparece();
    const setorDe = useMemo(() => setoresPorIngresso(evento), [evento?.sessoes]);
    const nova = original === null;

    const [base] = useState<Pergunta>(() => original ?? perguntaNova(novoId("prg")));
    const [p, setP] = useState<Pergunta>(base);
    // Outra aba gravou a pergunta: sem rascunho, acompanha.
    useEffect(() => {
        if (original && JSON.stringify(p) === JSON.stringify(base)) setP(original);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [original]);

    const [tentou, setTentou] = useState(false);
    const [salvando, setSalvando] = useState(false);
    const [sair, setSair] = useState(false);
    const [excluir, setExcluir] = useState(false);
    const [seletor, setSeletor] = useState<"ingressos" | "combos" | null>(null);

    const mudou = nova ? p.titulo.trim() !== "" || p.itens.length > 0 || (p.opcoes?.length ?? 0) > 0 : JSON.stringify(p) !== JSON.stringify(original);
    const erros = validarPergunta(p, T);
    const temErro = !!erros.titulo || !!erros.opcoes;
    const set = (patch: Partial<Pergunta>) => setP((x) => ({ ...x, ...patch }));

    const trocarTipo = (tipo: TipoDePergunta) =>
        setP((x) => ({
            ...x,
            tipo,
            // Ao virar escolha, já começa com duas opções vazias; ao sair, as opções somem.
            opcoes: temOpcoes(tipo) ? (x.opcoes?.length ? x.opcoes : [opcaoNova(), opcaoNova()]) : undefined,
        }));
    const setOpcao = (oid: string, patch: Partial<OpcaoDaPergunta>) => set({ opcoes: (p.opcoes ?? []).map((o) => (o.id === oid ? { ...o, ...patch } : o)) });

    const salvar = async () => {
        setTentou(true);
        if (!evento) return;
        if (temErro) {
            toast.error(T.corrigir);
            irParaPrimeiroErro();
            return;
        }
        const limpa: Pergunta = {
            ...p,
            titulo: p.titulo.trim(),
            opcoes: temOpcoes(p.tipo) ? (p.opcoes ?? []).map((o) => ({ ...o, rotulo: o.rotulo.trim() })) : undefined,
        };
        const lista = evento.perguntas ?? [];
        const prox = nova ? [...lista, limpa] : lista.map((x) => (x.id === limpa.id ? limpa : x));
        setSalvando(true);
        try {
            await salvarPerguntas(evento, prox);
            toast.success(nova ? T.criada : T.salvo);
            if (nova) navigate(`${LISTA}/${limpa.id}`, { replace: true });
            else setTentou(false);
        } catch {
            toast.error(T.erro);
        } finally {
            setSalvando(false);
        }
    };

    const voltar = () => (mudou ? setSair(true) : navigate(LISTA));
    const ingressosEscolhidos = p.itens.filter((i) => i.tipo === "ingresso");
    const combosEscolhidos = p.itens.filter((i) => i.tipo === "combo");
    const combos = evento?.combos ?? [];
    const nomeDoCombo = (cid: string) => combos.find((c) => c.id === cid)?.nome ?? cid;
    const opcoes = p.opcoes ?? [];

    return (
        <div className="flex min-w-0 flex-1 flex-col gap-6">
            <header className="flex flex-col gap-3">
                <Button color="tertiary" size="md" iconLeading={ArrowLeft} onClick={voltar} className="-ml-3 self-start">
                    {T.voltar}
                </Button>
                <h1 className={`${TITULO_PAGINA} break-words`}>{original?.titulo ?? (p.titulo.trim() || T.nova)}</h1>
            </header>

            <div className="mx-auto flex w-full max-w-[732px] flex-col gap-4">
                <SecaoDoItem
                    titulo={T.pergunta}
                    alerta={tentou && temErro}
                >
                    <Input
                        label={T.titulo}
                        isRequired
                        maxLength={LIMITE_TITULO}
                        value={p.titulo}
                        onChange={(v) => set({ titulo: v })}
                        placeholder={T.tituloPlaceholder}
                        isInvalid={tentou && !!erros.titulo}
                        hint={tentou && erros.titulo ? erros.titulo : formatar(T.tituloContador, { n: p.titulo.length })}
                    />
                    <Select
                        label={T.tipo}
                        selectedKey={p.tipo}
                        onSelectionChange={(k) => k && trocarTipo(k as TipoDePergunta)}
                        items={TIPOS_DE_PERGUNTA.map((v) => ({ id: v, label: NOME_DO_TIPO[v] }))}
                    >
                        {(i) => <Select.Item id={i.id}>{i.label}</Select.Item>}
                    </Select>

                    {/* Opções só nos tipos de escolha; entram e saem deslizando (UI-VIS-008). */}
                    <Surgir visivel={temOpcoes(p.tipo)}>
                        <fieldset className="flex flex-col gap-3">
                            <legend className="mb-1 text-sm font-medium text-secondary">{T.opcoes}</legend>
                            <p className={tentou && erros.opcoes ? "text-sm text-error-primary" : "text-sm text-tertiary"}>{tentou && erros.opcoes ? erros.opcoes : T.opcoesDica}</p>
                            <ol className="flex flex-col gap-2">
                                <AnimatePresence initial={false}>
                                    {opcoes.map((o, i) => {
                                        const nome = o.rotulo.trim() || formatar(T.opcao, { n: i + 1 });
                                        return (
                                            <motion.li
                                                key={o.id}
                                                layout={!reduzir}
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                exit={{ opacity: 0, height: 0 }}
                                                transition={{ duration: reduzir ? 0.12 : DURACAO_TRANSICAO }}
                                                className="overflow-hidden"
                                            >
                                                {/* Celular: nome em cima, estoque e remover embaixo, sem rolagem lateral (UI-MOB-004). */}
                                                <div className="grid grid-cols-[1fr_auto] items-start gap-2 sm:grid-cols-[1fr_9rem_auto]">
                                                    <Input
                                                        aria-label={formatar(T.opcao, { n: i + 1 })}
                                                        placeholder={formatar(T.opcao, { n: i + 1 })}
                                                        value={o.rotulo}
                                                        onChange={(v) => setOpcao(o.id, { rotulo: v })}
                                                        isInvalid={tentou && !!erros.opcoesInvalidas?.includes(o.id)}
                                                        className="col-span-2 sm:col-span-1"
                                                    />
                                                    <Input
                                                        aria-label={formatar("{estoque}, {opcao}", { estoque: T.estoque, opcao: nome })}
                                                        type="number"
                                                        inputMode="numeric"
                                                        placeholder={T.semLimite}
                                                        value={o.estoque == null ? "" : String(o.estoque)}
                                                        onChange={(v) => setOpcao(o.id, { estoque: v === "" ? undefined : Math.max(0, Math.round(Number(v) || 0)) })}
                                                        hint={o.estoque === 0 ? T.esgotada : undefined}
                                                    />
                                                    <ButtonUtility
                                                        size="sm"
                                                        color="tertiary"
                                                        icon={Trash01}
                                                        className="mt-1.5"
                                                        tooltip={formatar(T.removerOpcao, { opcao: nome })}
                                                        onClick={() => set({ opcoes: opcoes.filter((x) => x.id !== o.id) })}
                                                    />
                                                </div>
                                            </motion.li>
                                        );
                                    })}
                                </AnimatePresence>
                            </ol>
                            <Button color="secondary" size="sm" iconLeading={Plus} className="self-start" onClick={() => set({ opcoes: [...opcoes, opcaoNova()] })}>
                                {T.adicionarOpcao}
                            </Button>
                        </fieldset>
                    </Surgir>
                </SecaoDoItem>

                <SecaoDoItem titulo={T.onde} alerta={p.itens.length === 0}>
                    <p className="text-sm text-tertiary">{T.ondeDica}</p>
                    <ListaDeEscolhas>
                        <EscolhaEmLista
                            rotulo={T.ingressos}
                            escolhidos={ingressosEscolhidos.length ? [ondeAparece({ ...p, itens: ingressosEscolhidos }, setorDe)] : []}
                            vazio={T.nenhumIngresso}
                            onEscolher={() => setSeletor("ingressos")}
                        />
                        <EscolhaEmLista
                            rotulo={T.combos}
                            escolhidos={combosEscolhidos.map((c) => nomeDoCombo(c.id))}
                            vazio={T.nenhumCombo}
                            onEscolher={() => setSeletor("combos")}
                        />
                    </ListaDeEscolhas>
                    <Surgir visivel={p.itens.length === 0}>
                        <p role="status" className="text-sm text-warning-primary">
                            {T.semItens}
                        </p>
                    </Surgir>
                </SecaoDoItem>

                <SecaoDoItem titulo={T.regras}>
                    <Checkbox label={T.obrigatoria} hint={T.obrigatoriaDica} isSelected={p.obrigatoria} onChange={(v) => set({ obrigatoria: v })} />
                </SecaoDoItem>

                {!nova && (
                    <div className="flex justify-end pt-2">
                        <Button color="tertiary-destructive" size="md" iconLeading={Trash01} onClick={() => setExcluir(true)}>
                            {T.excluir}
                        </Button>
                    </div>
                )}
            </div>

            <BarraDeSalvar visivel={mudou} salvando={salvando} onSalvar={() => void salvar()} onDescartar={() => (original ? setP(original) : navigate(LISTA))} />

            <ConfirmarSaida aberto={sair} onFechar={() => setSair(false)} onSair={() => navigate(LISTA)} />
            <ConfirmarExclusao
                pergunta={excluir ? original : null}
                onFechar={() => setExcluir(false)}
                onExcluir={async () => {
                    if (!evento || !original) return;
                    try {
                        await salvarPerguntas(
                            evento,
                            (evento.perguntas ?? []).filter((x) => x.id !== original.id),
                        );
                        toast.success(T.excluida);
                        navigate(LISTA);
                    } catch {
                        toast.error(T.erro);
                    }
                }}
            />

            {seletor === "ingressos" && evento && (
                <SeletorDeIngressos
                    titulo={T.seletorIngressos}
                    evento={evento}
                    itens={ingressosEscolhidos}
                    onFechar={() => setSeletor(null)}
                    onConfirmar={(escolhidos) => {
                        set({ itens: [...escolhidos.map((i) => ({ tipo: "ingresso" as const, id: i.id })), ...combosEscolhidos] });
                        setSeletor(null);
                    }}
                />
            )}
            {seletor === "combos" && (
                <SeletorDeLista
                    titulo={T.seletorCombos}
                    opcoes={combos.map((c) => ({ id: c.id, rotulo: c.nome }))}
                    selecionados={combosEscolhidos.map((c) => c.id)}
                    vazio={T.semCombos}
                    onFechar={() => setSeletor(null)}
                    onConfirmar={(ids) => {
                        set({ itens: [...ingressosEscolhidos, ...ids.map((cid) => ({ tipo: "combo" as const, id: cid }))] });
                        setSeletor(null);
                    }}
                />
            )}
        </div>
    );
}

const opcaoNova = (): OpcaoDaPergunta => ({ id: novoId("opc"), rotulo: "" });
