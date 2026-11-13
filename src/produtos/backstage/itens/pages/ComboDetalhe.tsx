import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { ArrowLeft, Package, Plus, Trash01 } from "@untitledui/icons";
import { EmptyState } from "@/components/application/empty-state/empty-state";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Input } from "@/components/base/input/input";
import { InputNumber } from "@/components/base/input/input-number";
import { TextArea } from "@/components/base/textarea/textarea";
import { Toggle } from "@/components/base/toggle/toggle";
import { DURACAO_TRANSICAO, Surgir } from "@/components/foundations/transicao";
import { loteAtual, type Combo, type ItemDoCombo, type RegrasDeVenda } from "@/plataforma";
import { BackstageLayout } from "../../components/Backstage";
import {
    BarraDeSalvar,
    CampoPreco,
    CamposDeVendas,
    ConfirmarSaida,
    SecaoDoItem,
    irParaPrimeiroErro,
    CabecalhoDoItem,
} from "../components/comuns";
import { BarraDeFiltros, BotaoMostrarMais, LIMIAR_FERRAMENTAS, paraBusca, useMostrarMais, useSelecao } from "../components/escala";
import {
    acharIngresso,
    comboNovo,
    disponivelDoCombo,
    disponivelDoIngresso,
    estadoDoCombo,
    faixaDePreco,
    ingressosDo,
    precoAvulso,
    precoDoProduto,
    produtosDo,
    salvarCombos,
    somaAvulsa,
    useCatalogo,
} from "../data/catalogo";
import { formatar, useTextosItens } from "../data/textos-itens";
import { contextoDosIngressos, useComposicao, usePlural, useRotuloDoItem } from "./Combos";

/* ------------------------------------------------------------------ */
/*  Detalhe do combo: o que vem nele, preço, estoque, vendas e         */
/*  à venda, editados num rascunho e salvos de uma vez.                */
/* ------------------------------------------------------------------ */

/** Textos do detalhe do combo (UI-TXT-009). */
const TEXTOS = {
    ligado: "{nome} à venda.",
    desligado: "{nome} pausado. Ele para de vender na hora.",
    desfazer: "Desfazer",
    avisoLigado: "Ligado, mas sem disponibilidade: confira o estoque e os itens do combo.",
    voltar: "Combos",
    novo: "Novo combo",
    novoDica: "Junte ingressos e produtos num pacote com preço próprio.",
    resumoCabecalho: "{composicao} por {preco}.",
    resumoSemItens: "Nenhum item no combo ainda.",
    naoEncontrado: "Combo não encontrado",
    naoEncontradoDica: "Ele pode ter sido excluído ou o link está incompleto.",
    voltarParaCombos: "Voltar para Combos",
    sobre: {
        titulo: "Nome e descrição",
        nome: "Nome do combo",
        nomePlaceholder: "Ex.: Pista com copo",
        nomeErro: "Dê um nome ao combo.",
        descricao: "Descrição",
        descricaoDica: "Opcional. Conta a quem compra o que vem no pacote.",
    },
    itens: {
        titulo: "O que vem no combo",
        nenhum: "Nenhum item",
        vazio: "Adicione pelo menos um item ao combo.",
        adicionar: "Adicionar itens",
        quantidade: "Quantidade de {nome}",
        cada: "{preco} cada",
        remover: "Remover {nome} do combo",
        comContexto: "{nome} ({contexto})",
    },
    preco: {
        titulo: "Preço",
        campo: "Preço do combo",
        erro: "Use um valor igual ou maior que zero.",
        avulso: "Avulso, os itens custam {valor}.",
        economia: "Quem compra o combo economiza {valor}.",
        maisCaro: "O combo está mais caro que os itens avulsos.",
        resumoEconomia: "{preco}, {economia} a menos que avulso",
        resumoMaisCaro: "{preco}, mais caro que avulso",
    },
    estoque: {
        titulo: "Estoque",
        daParaVender: { zero: "Com o estoque atual dos itens, não dá para vender nenhum combo.", one: "Dá para vender 1 combo com o estoque atual dos itens.", other: "Dá para vender {n} combos com o estoque atual dos itens." },
        limita: "{nome} limita o combo.",
        esgotado: "{nome} está esgotado: o combo não vende enquanto isso.",
        pausado: "{nome} está pausado: o combo não vende enquanto isso.",
        semItens: "Adicione itens ao combo para ver quantos dá para vender.",
        limitar: "Limitar quantidade de combos",
        limitarDica: "Vende até este número, se o estoque dos itens permitir.",
        maximo: "Máximo de combos à venda",
    },
    excluir: {
        botao: "Excluir combo",
        titulo: "Excluir {nome}?",
        dica: "Os itens do combo continuam à venda separadamente.",
        cancelar: "Cancelar",
        confirmar: "Excluir combo",
        feito: "Combo excluído.",
    },
    revise: "Revise os campos destacados para salvar o combo.",
    seletor: {
        titulo: "Adicionar itens",
        buscar: "Buscar por ingresso, grupo ou produto",
        ingressos: "Ingressos",
        produtos: "Produtos",
        sessao: "Sessão",
        todasAsSessoes: "Todas as sessões",
        setor: "Grupo",
        todosOsSetores: "Todos os grupos",
        soIngressos: "Com sessão ou grupo escolhido, a lista mostra só ingressos.",
        dicaIngresso: { zero: "{preco}, esgotado", one: "{preco}, 1 disponível", other: "{preco}, {n} disponíveis" },
        dicaProduto: { zero: "{preco}, sem estoque", one: "{preco}, 1 em estoque", other: "{preco}, {n} em estoque" },
        jaNoCombo: "Já está no combo",
        nenhum: "Nenhum ingresso ou produto com essa busca ou esses filtros.",
        selecionarTodos: "Selecionar todos os {n} do filtro",
        limparSelecao: "Limpar seleção",
        selecionados: { zero: "Nenhum selecionado", one: "1 selecionado", other: "{n} selecionados" },
        cancelar: "Cancelar",
        adicionar: "Adicionar",
    },
};

const LISTA = "/backstage/catalogo/combos";
const chave = (i: Pick<ItemDoCombo, "tipo" | "id">) => `${i.tipo}:${i.id}`;

/** Forma canônica do combo para comparar rascunho e original (campos vazios contam como ausentes). */
const canonico = (c: Combo) => {
    const v: RegrasDeVenda = c.vendas ?? {};
    const vendas = { limitePorPedido: v.limitePorPedido ?? null, minimoPorPedido: v.limitePorPedido != null ? (v.minimoPorPedido ?? 1) : null };
    return JSON.stringify([c.nome, c.descricao || "", c.preco, c.itens, c.limite ?? null, c.ativo, vendas]);
};

export function ComboDetalhe() {
    const { id = "" } = useParams();
    const { carregando, evento } = useCatalogo();
    const navigate = useNavigate();
    const novo = id === "novo";
    const original = novo ? null : evento?.combos?.find((c) => c.id === id);

    return (
        <BackstageLayout activeSection="itens" activeItem="catalogo-combos">
            {carregando ? (
                <Esqueleto />
            ) : !novo && !original ? (
                <div className="flex min-w-0 flex-1 items-center justify-center py-16">
                    <EmptyState size="sm">
                        <EmptyState.Header>
                            <EmptyState.FeaturedIcon icon={Package} color="gray" theme="modern" />
                        </EmptyState.Header>
                        <EmptyState.Content>
                            <EmptyState.Title>{TEXTOS.naoEncontrado}</EmptyState.Title>
                            <EmptyState.Description>{TEXTOS.naoEncontradoDica}</EmptyState.Description>
                        </EmptyState.Content>
                        <EmptyState.Footer>
                            <Button size="md" color="secondary" iconLeading={ArrowLeft} onClick={() => navigate(LISTA)}>
                                {TEXTOS.voltarParaCombos}
                            </Button>
                        </EmptyState.Footer>
                    </EmptyState>
                </div>
            ) : (
                // A chave remonta o editor ao trocar de combo (ou ao virar combo salvo depois de criado).
                <Editor key={id} original={original ?? null} />
            )}
        </BackstageLayout>
    );
}

type SecaoComErro = "sobre" | "itens" | "preco";

function Editor({ original }: { original: Combo | null }) {
    const navigate = useNavigate();
    const { t, preco } = useTextosItens();
    const plural = usePlural();
    const composicao = useComposicao();
    const rotuloDoItem = useRotuloDoItem();
    const { evento, biblioteca, vendidos } = useCatalogo();
    const novo = original === null;

    const [base, setBase] = useState<Combo>(() => original ?? comboNovo());
    const [r, setR] = useState<Combo>(base);
    const set = (patch: Partial<Combo>) => setR((c) => ({ ...c, ...patch }));
    // Remonta os campos com estado próprio (preço, vendas) ao descartar.
    const [versao, setVersao] = useState(0);
    const [tentou, setTentou] = useState(false);
    const [salvando, setSalvando] = useState(false);
    const [seletor, setSeletor] = useState({ aberto: false, vez: 0 });
    const [confirmarSaida, setConfirmarSaida] = useState(false);
    const [excluir, setExcluir] = useState(false);
    const [excluindo, setExcluindo] = useState(false);

    const mudou = canonico(r) !== canonico(base);
    const preenchido = !!r.nome.trim() || r.itens.length > 0 || r.preco > 0;
    const sujo = novo ? preenchido : mudou;

    const erros: Record<SecaoComErro, boolean> = { sobre: !r.nome.trim(), itens: r.itens.length === 0, preco: r.preco < 0 };
    const mostrar = (s: SecaoComErro) => tentou && erros[s];

    /* ---------- números do combo ---------- */
    const avulso = somaAvulsa(r, evento, biblioteca, vendidos);
    const economia = avulso - r.preco;
    const maisCaro = r.itens.length > 0 && r.preco > avulso;
    const semLimite = disponivelDoCombo({ ...r, limite: null }, evento, vendidos);

    // Situação de cada item: quantos combos ele sustenta e se está parado.
    // Ingressos de mesmo nome levam o setor (e a sessão) junto, para saber qual limita o combo.
    const rotulos = rotuloDoItem(r.itens, evento, biblioteca);
    const situacao = r.itens.map((i, idx) => {
        const { nome: base, contexto } = rotulos[idx];
        const nome = contexto && rotulos.filter((x) => x.nome === base).length > 1 ? formatar(TEXTOS.itens.comContexto, { nome: base, contexto }) : base;
        if (i.tipo === "ingresso") {
            const tipo = acharIngresso(evento, i.id)?.tipo;
            const livre = tipo && tipo.ativo ? disponivelDoIngresso(tipo, vendidos) : 0;
            return { nome, sustenta: Math.floor(livre / Math.max(1, i.quantidade)), parado: !tipo ? "esgotado" : !tipo.ativo ? "pausado" : livre <= 0 ? "esgotado" : null };
        }
        const p = evento?.produtos?.find((x) => x.produtoId === i.id);
        const livre = p && p.ativo ? p.estoque : 0;
        return { nome, sustenta: Math.floor(livre / Math.max(1, i.quantidade)), parado: !p ? "esgotado" : !p.ativo ? "pausado" : livre <= 0 ? "esgotado" : null };
    });
    const parados = situacao.filter((s) => s.parado);
    const limitante = situacao.length > 1 ? situacao.reduce((menor, s) => (s.sustenta < menor.sustenta ? s : menor)) : undefined;

    /* ---------- ações ---------- */
    const voltar = () => (sujo ? setConfirmarSaida(true) : navigate(LISTA));

    const descartar = () => {
        if (novo) return navigate(LISTA);
        setR(base);
        setTentou(false);
        setVersao((v) => v + 1);
    };

    const salvar = async () => {
        if (!evento) return;
        if (erros.sobre || erros.itens || erros.preco) {
            setTentou(true);
            irParaPrimeiroErro();
            toast.error(TEXTOS.revise);
            return;
        }
        const final: Combo = { ...r, nome: r.nome.trim(), descricao: r.descricao?.trim() || undefined };
        const lista = evento.combos ?? [];
        const proxima = lista.some((c) => c.id === final.id) ? lista.map((c) => (c.id === final.id ? final : c)) : [...lista, final];
        setSalvando(true);
        try {
            await salvarCombos(evento, proxima);
            toast.success(t.salvo);
            if (novo) {
                navigate(`${LISTA}/${final.id}`, { replace: true });
                return;
            }
            setBase(final);
            setR(final);
            setTentou(false);
        } catch {
            toast.error(t.erroAoSalvar);
        } finally {
            setSalvando(false);
        }
    };

    /** "À venda" do cabeçalho grava na hora, como o toggle da lista (UI-VIS-015); no combo novo, entra no rascunho. */
    const alternarAtivo = async (ativo: boolean, desfazendo = false) => {
        if (novo || !evento) {
            set({ ativo });
            return;
        }
        try {
            await salvarCombos(evento, (evento.combos ?? []).map((c) => (c.id === base.id ? { ...c, ativo } : c)));
            setBase((b) => ({ ...b, ativo }));
            setR((c) => ({ ...c, ativo }));
            toast.success(formatar(ativo ? TEXTOS.ligado : TEXTOS.desligado, { nome: base.nome }), desfazendo ? undefined : { action: { label: TEXTOS.desfazer, onClick: () => void alternarAtivo(!ativo, true) } });
        } catch {
            toast.error(t.erroAoSalvar);
        }
    };

    const confirmarExclusao = async () => {
        if (!evento) return;
        setExcluindo(true);
        try {
            await salvarCombos(
                evento,
                (evento.combos ?? []).filter((c) => c.id !== base.id),
            );
            toast.success(TEXTOS.excluir.feito);
            navigate(LISTA, { replace: true });
        } catch {
            toast.error(t.erroAoSalvar);
            setExcluindo(false);
        }
    };

    const adicionar = (novos: ItemDoCombo[]) => {
        set({ itens: [...r.itens, ...novos] });
        setSeletor((s) => ({ ...s, aberto: false }));
    };

    /* ---------- resumos ---------- */
    const resumoCabecalho = novo
        ? TEXTOS.novoDica
        : base.itens.length
          ? formatar(TEXTOS.resumoCabecalho, { composicao: composicao(base, evento, biblioteca), preco: preco(base.preco) })
          : TEXTOS.resumoSemItens;

    return (
        <div className="flex min-w-0 flex-1 flex-col gap-6">
            <CabecalhoDoItem
                voltar={TEXTOS.voltar}
                onVoltar={voltar}
                titulo={novo ? TEXTOS.novo : base.nome}
                estado={novo ? undefined : estadoDoCombo(base, evento, vendidos)}
                resumo={resumoCabecalho}
                ativo={r.ativo}
                onAtivo={(ativo) => void alternarAtivo(ativo)}
                aviso={!novo && base.ativo && estadoDoCombo(base, evento, vendidos) !== "a-venda" ? TEXTOS.avisoLigado : undefined}
            />

            <div className="mx-auto flex w-full max-w-[732px] min-w-0 flex-col gap-4">
                <SecaoDoItem
                    key={`sobre-${versao}`}
                    titulo={TEXTOS.sobre.titulo}
                    alerta={mostrar("sobre")}
                >
                    <Input
                        label={TEXTOS.sobre.nome}
                        placeholder={TEXTOS.sobre.nomePlaceholder}
                        isRequired
                        isInvalid={mostrar("sobre")}
                        hint={mostrar("sobre") ? TEXTOS.sobre.nomeErro : undefined}
                        value={r.nome}
                        onChange={(nome) => set({ nome })}
                    />
                    <TextArea label={TEXTOS.sobre.descricao} hint={TEXTOS.sobre.descricaoDica} rows={3} value={r.descricao ?? ""} onChange={(descricao) => set({ descricao })} />
                </SecaoDoItem>

                <SecaoDoItem
                    titulo={TEXTOS.itens.titulo}
                    alerta={mostrar("itens")}
                >
                    <ItensDoCombo
                        itens={r.itens}
                        onChange={(itens) => set({ itens })}
                        erro={mostrar("itens")}
                        onAdicionar={() => setSeletor((s) => ({ aberto: true, vez: s.vez + 1 }))}
                    />
                </SecaoDoItem>

                <SecaoDoItem key={`preco-${versao}`} titulo={TEXTOS.preco.titulo} alerta={maisCaro || mostrar("preco")}>
                    <div className="flex flex-col gap-3">
                        <div className="max-w-60">
                            <CampoPreco
                                label={TEXTOS.preco.campo}
                                valor={r.preco}
                                onChange={(v) => set({ preco: v })}
                                isRequired
                                isInvalid={mostrar("preco")}
                                hint={mostrar("preco") ? TEXTOS.preco.erro : undefined}
                            />
                        </div>
                        <Surgir visivel={r.itens.length > 0}>
                            <div className="flex flex-col gap-1 text-sm">
                                <p className="text-tertiary">{formatar(TEXTOS.preco.avulso, { valor: preco(avulso) })}</p>
                                <Surgir visivel={economia > 0}>
                                    <p className="text-success-primary">{formatar(TEXTOS.preco.economia, { valor: preco(Math.max(0, economia)) })}</p>
                                </Surgir>
                                <Surgir visivel={maisCaro}>
                                    <p role="status" className="text-warning-primary">
                                        {TEXTOS.preco.maisCaro}
                                    </p>
                                </Surgir>
                            </div>
                        </Surgir>
                    </div>
                </SecaoDoItem>

                <SecaoDoItem key={`estoque-${versao}`} titulo={TEXTOS.estoque.titulo} alerta={parados.length > 0}>
                    <div className="flex flex-col gap-1 text-sm">
                        {r.itens.length === 0 ? (
                            <p className="text-tertiary">{TEXTOS.estoque.semItens}</p>
                        ) : (
                            <>
                                <p className="text-secondary">{plural(TEXTOS.estoque.daParaVender, semLimite)}</p>
                                {limitante && parados.length === 0 && <p className="text-tertiary">{formatar(TEXTOS.estoque.limita, { nome: limitante.nome })}</p>}
                                {parados.map((s) => (
                                    <p key={s.nome} className="text-warning-primary">
                                        {formatar(s.parado === "pausado" ? TEXTOS.estoque.pausado : TEXTOS.estoque.esgotado, { nome: s.nome })}
                                    </p>
                                ))}
                            </>
                        )}
                    </div>
                    <div className="flex flex-col gap-3">
                        <Toggle
                            label={TEXTOS.estoque.limitar}
                            isSelected={r.limite != null}
                            onChange={(on) => set({ limite: on ? Math.max(1, semLimite) : null })}
                        />
                        <Surgir visivel={r.limite != null}>
                            <Input
                                label={TEXTOS.estoque.maximo}
                                hint={TEXTOS.estoque.limitarDica}
                                type="number"
                                inputMode="numeric"
                                value={r.limite != null ? String(r.limite) : ""}
                                onChange={(x) => set({ limite: Math.max(1, Math.round(Number(x) || 1)) })}
                                className="max-w-60"
                            />
                        </Surgir>
                    </div>
                </SecaoDoItem>

                <SecaoDoItem key={`vendas-${versao}`} titulo={t.vendas.titulo}>
                    <CamposDeVendas valor={r.vendas} onChange={(vendas) => set({ vendas })} />
                </SecaoDoItem>

                {!novo && (
                    <div className="flex pt-2">
                        <Button color="tertiary-destructive" size="md" iconLeading={Trash01} onClick={() => setExcluir(true)} className="-ml-3">
                            {TEXTOS.excluir.botao}
                        </Button>
                    </div>
                )}
            </div>

            <BarraDeSalvar visivel={novo || mudou} salvando={salvando} onSalvar={salvar} onDescartar={descartar} />

            <SeletorDeItens
                key={seletor.vez}
                aberto={seletor.aberto}
                noCombo={new Set(r.itens.map(chave))}
                onFechar={() => setSeletor((s) => ({ ...s, aberto: false }))}
                onAdicionar={adicionar}
            />

            <ConfirmarSaida aberto={confirmarSaida} onFechar={() => setConfirmarSaida(false)} onSair={() => navigate(LISTA)} />

            <ModalOverlay isOpen={excluir} onOpenChange={(v) => !v && !excluindo && setExcluir(false)} isDismissable={!excluindo}>
                <Modal className="sm:max-w-[400px]">
                    <Dialog>
                        <div className="flex w-full flex-col gap-5 rounded-2xl bg-primary p-6 shadow-xl ring-1 ring-border-secondary">
                            <div className="flex flex-col gap-1">
                                <h2 slot="title" className="text-lg font-semibold break-words text-primary">
                                    {formatar(TEXTOS.excluir.titulo, { nome: base.nome })}
                                </h2>
                                <p className="text-sm text-tertiary">{TEXTOS.excluir.dica}</p>
                            </div>
                            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                <Button color="secondary" size="md" onClick={() => setExcluir(false)} isDisabled={excluindo}>
                                    {TEXTOS.excluir.cancelar}
                                </Button>
                                <Button color="primary-destructive" size="md" onClick={confirmarExclusao} isLoading={excluindo}>
                                    {TEXTOS.excluir.confirmar}
                                </Button>
                            </div>
                        </div>
                    </Dialog>
                </Modal>
            </ModalOverlay>
        </div>
    );
}

/* ---------------- itens do combo ---------------- */

function ItensDoCombo({ itens, onChange, erro, onAdicionar }: { itens: ItemDoCombo[]; onChange: (itens: ItemDoCombo[]) => void; erro: boolean; onAdicionar: () => void }) {
    const { evento, biblioteca, vendidos } = useCatalogo();
    const { preco } = useTextosItens();
    const reduzir = useReducedMotion();
    const rotulos = useRotuloDoItem()(itens, evento, biblioteca);
    const mudar = (k: string, patch: Partial<ItemDoCombo>) => onChange(itens.map((i) => (chave(i) === k ? { ...i, ...patch } : i)));

    return (
        <div className="flex flex-col gap-4">
            <Surgir visivel={itens.length === 0}>
                <p className={erro ? "text-sm text-error-primary" : "text-sm text-tertiary"} role={erro ? "alert" : undefined}>
                    {TEXTOS.itens.vazio}
                </p>
            </Surgir>
            <ul className="flex flex-col">
                <AnimatePresence initial={false}>
                    {itens.map((i, idx) => {
                        // Ingressos mostram setor e, com várias sessões, a sessão (UI-LST-001).
                        const { nome, contexto } = rotulos[idx];
                        return (
                            <motion.li
                                key={chave(i)}
                                layout={!reduzir}
                                initial={{ opacity: 0, height: reduzir ? "auto" : 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: reduzir ? "auto" : 0 }}
                                transition={{ duration: reduzir ? 0.12 : DURACAO_TRANSICAO, ease: [0.16, 1, 0.3, 1] }}
                                className="overflow-hidden"
                            >
                                <div className={`flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:gap-4 ${idx > 0 ? "border-t border-secondary" : ""}`}>
                                    <div className="flex min-w-0 flex-1 flex-col">
                                        <span className="text-sm font-medium break-words text-primary">{nome}</span>
                                        {contexto && <span className="text-sm break-words text-tertiary">{contexto}</span>}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <InputNumber
                                            aria-label={formatar(TEXTOS.itens.quantidade, { nome: contexto ? formatar(TEXTOS.itens.comContexto, { nome, contexto }) : nome })}
                                            size="sm"
                                            orientation="horizontal"
                                            minValue={1}
                                            step={1}
                                            value={i.quantidade}
                                            onChange={(v) => mudar(chave(i), { quantidade: Math.max(1, Math.round(Number.isFinite(v) ? v : 1)) })}
                                            className="w-32"
                                            inputClassName="text-center tabular-nums"
                                        />
                                        <span className="flex-1 text-sm text-tertiary tabular-nums sm:w-28 sm:flex-none sm:text-right">
                                            {formatar(TEXTOS.itens.cada, { preco: preco(precoAvulso(i, evento, biblioteca, vendidos)) })}
                                        </span>
                                        <ButtonUtility
                                            size="sm"
                                            color="tertiary"
                                            icon={Trash01}
                                            tooltip={formatar(TEXTOS.itens.remover, { nome: contexto ? formatar(TEXTOS.itens.comContexto, { nome, contexto }) : nome })}
                                            onClick={() => onChange(itens.filter((x) => chave(x) !== chave(i)))}
                                        />
                                    </div>
                                </div>
                            </motion.li>
                        );
                    })}
                </AnimatePresence>
            </ul>
            <Button color="secondary" size="md" iconLeading={Plus} onClick={onAdicionar} className="self-start">
                {TEXTOS.itens.adicionar}
            </Button>
        </div>
    );
}

/* ---------------- seletor de itens (modal) ---------------- */

/**
 * Seletor de itens do evento, com checkbox. O que já está no combo aparece marcado e desabilitado.
 *
 * Escala de 1 a milhares (UI-LST-001): cada ingresso mostra o setor e, com várias sessões, a data
 * da sessão, para diferenciar os de mesmo nome. Acima do limiar aparecem busca, filtros de sessão e
 * setor, contagem, "Selecionar todos do filtro" e "Mostrar mais" por seção.
 */
function SeletorDeItens({ aberto, noCombo, onFechar, onAdicionar }: { aberto: boolean; noCombo: Set<string>; onFechar: () => void; onAdicionar: (itens: ItemDoCombo[]) => void }) {
    const { evento, biblioteca, vendidos } = useCatalogo();
    const { preco, locale, numero } = useTextosItens();
    const plural = usePlural();
    const [busca, setBusca] = useState("");
    const [sessao, setSessao] = useState("todos");
    const [setor, setSetor] = useState("todos");
    const selecao = useSelecao();
    const ctx = useMemo(() => contextoDosIngressos(evento, locale), [evento, locale]);

    /* ---------- todos os itens, com o texto de busca ---------- */
    const todosIngressos = useMemo(
        () =>
            ingressosDo(evento).map(({ tipo, setor, sessao }) => {
                const contexto = ctx.contexto(setor.nome, sessao.id);
                const item: ItemDoCombo = { tipo: "ingresso", id: tipo.id, quantidade: 1 };
                return { item, k: chave(item), tipo, setor: setor.nome, sessao: sessao.id, contexto, busca: paraBusca(`${tipo.nome} ${contexto}`) };
            }),
        [evento, ctx],
    );
    const todosProdutos = useMemo(
        () =>
            produtosDo(evento, biblioteca).map((p) => {
                const item: ItemDoCombo = { tipo: "produto", id: p.produto.id, quantidade: 1 };
                return { item, k: chave(item), p, busca: paraBusca(p.produto.nome) };
            }),
        [evento, biblioteca],
    );
    const total = todosIngressos.length + todosProdutos.length;
    const comFerramentas = total > LIMIAR_FERRAMENTAS;

    /* ---------- filtros ---------- */
    const termo = paraBusca(busca.trim());
    // Sessão e setor são do ingresso: com um deles escolhido, os produtos saem da lista.
    const porIngresso = sessao !== "todos" || setor !== "todos";
    const ingressos = useMemo(
        () => todosIngressos.filter((i) => (!termo || i.busca.includes(termo)) && (sessao === "todos" || i.sessao === sessao) && (setor === "todos" || i.setor === setor)),
        [todosIngressos, termo, sessao, setor],
    );
    const produtos = useMemo(() => (porIngresso ? [] : todosProdutos.filter((p) => !termo || p.busca.includes(termo))), [todosProdutos, termo, porIngresso]);
    const paginaIngressos = useMostrarMais(ingressos);
    const paginaProdutos = useMostrarMais(produtos);
    const reiniciar = () => {
        paginaIngressos.reiniciar();
        paginaProdutos.reiniciar();
    };

    // Setores com o mesmo nome em várias sessões viram uma opção só; a sessão escolhida restringe a lista.
    const nomesDeSetor = useMemo(() => [...new Set(todosIngressos.filter((i) => sessao === "todos" || i.sessao === sessao).map((i) => i.setor))], [todosIngressos, sessao]);
    const filtros = [
        ...(ctx.variasSessoes
            ? [
                  {
                      id: "sessao",
                      rotulo: TEXTOS.seletor.sessao,
                      valor: sessao,
                      opcoes: [{ id: "todos", label: TEXTOS.seletor.todasAsSessoes }, ...(evento?.sessoes ?? []).map((s) => ({ id: s.id, label: ctx.rotuloDaSessao(s.id) }))],
                      onChange: (v: string) => {
                          setSessao(v);
                          // O setor escolhido pode não existir na nova sessão.
                          if (setor !== "todos" && !todosIngressos.some((i) => i.setor === setor && (v === "todos" || i.sessao === v))) setSetor("todos");
                          reiniciar();
                      },
                  },
              ]
            : []),
        ...(nomesDeSetor.length > 1 || setor !== "todos"
            ? [
                  {
                      id: "setor",
                      rotulo: TEXTOS.seletor.setor,
                      valor: setor,
                      opcoes: [{ id: "todos", label: TEXTOS.seletor.todosOsSetores }, ...nomesDeSetor.map((n) => ({ id: n, label: n }))],
                      onChange: (v: string) => {
                          setSetor(v);
                          reiniciar();
                      },
                  },
              ]
            : []),
    ];

    /* ---------- seleção ---------- */
    const porChave = useMemo(() => new Map([...todosIngressos, ...todosProdutos].map((x) => [x.k, x.item])), [todosIngressos, todosProdutos]);
    const selecionaveis = [...ingressos, ...produtos].filter((x) => !noCombo.has(x.k)).map((x) => x.k);
    const todosDoFiltroMarcados = selecionaveis.every((k) => selecao.tem(k));
    const adicionar = () => onAdicionar([...selecao.ids].flatMap((k) => porChave.get(k) ?? []));

    const linha = (k: string, nome: string, contexto: string, dica: string) => {
        const ja = noCombo.has(k);
        return (
            <li key={k} className="py-2">
                <Checkbox
                    label={nome}
                    hint={
                        contexto ? (
                            <>
                                <span className="block">{contexto}</span>
                                <span className="block">{ja ? TEXTOS.seletor.jaNoCombo : dica}</span>
                            </>
                        ) : ja ? (
                            TEXTOS.seletor.jaNoCombo
                        ) : (
                            dica
                        )
                    }
                    isSelected={ja || selecao.tem(k)}
                    isDisabled={ja}
                    onChange={(on) => selecao.alternar(k, on)}
                />
            </li>
        );
    };

    const nada = ingressos.length === 0 && produtos.length === 0;

    return (
        <ModalOverlay isOpen={aberto} onOpenChange={(v) => !v && onFechar()} isDismissable>
            <Modal className="sm:max-w-[640px]">
                <Dialog aria-label={TEXTOS.seletor.titulo}>
                    <div className="flex max-h-[85dvh] w-full flex-col overflow-hidden rounded-2xl bg-primary shadow-xl ring-1 ring-border-secondary">
                        <div className="flex flex-col gap-4 border-b border-secondary px-5 pt-5 pb-4 sm:px-6 sm:pt-6">
                            <h2 className="text-lg font-semibold text-primary">{TEXTOS.seletor.titulo}</h2>
                            <BarraDeFiltros
                                total={total}
                                visiveis={ingressos.length + produtos.length}
                                busca={busca}
                                onBusca={(v) => {
                                    setBusca(v);
                                    reiniciar();
                                }}
                                placeholder={TEXTOS.seletor.buscar}
                                filtros={filtros}
                                onLimpar={() => {
                                    setBusca("");
                                    setSessao("todos");
                                    setSetor("todos");
                                    reiniciar();
                                }}
                            />
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
                            {nada ? (
                                <p className="py-8 text-center text-sm text-tertiary">{TEXTOS.seletor.nenhum}</p>
                            ) : (
                                <div className="flex flex-col gap-6">
                                    {ingressos.length > 0 && (
                                        <section className="flex flex-col gap-1">
                                            <h3 className="text-sm font-semibold text-primary">{TEXTOS.seletor.ingressos}</h3>
                                            <ul className="flex flex-col">
                                                {paginaIngressos.visiveis.map((i) => {
                                                    const atual = loteAtual(i.tipo, vendidos)?.preco ?? faixaDePreco(i.tipo).max;
                                                    const livre = disponivelDoIngresso(i.tipo, vendidos);
                                                    return linha(i.k, i.tipo.nome, i.contexto, plural(TEXTOS.seletor.dicaIngresso, livre, { preco: preco(atual) }));
                                                })}
                                            </ul>
                                            <BotaoMostrarMais restantes={paginaIngressos.restantes} onClick={paginaIngressos.mostrarMais} />
                                        </section>
                                    )}
                                    {produtos.length > 0 && (
                                        <section className="flex flex-col gap-1">
                                            <h3 className="text-sm font-semibold text-primary">{TEXTOS.seletor.produtos}</h3>
                                            <ul className="flex flex-col">
                                                {paginaProdutos.visiveis.map(({ k, p }) =>
                                                    linha(k, p.produto.nome, "", plural(TEXTOS.seletor.dicaProduto, p.noEvento.estoque, { preco: preco(precoDoProduto(p)) })),
                                                )}
                                            </ul>
                                            <BotaoMostrarMais restantes={paginaProdutos.restantes} onClick={paginaProdutos.mostrarMais} />
                                        </section>
                                    )}
                                    {porIngresso && todosProdutos.length > 0 && <p className="text-sm text-tertiary">{TEXTOS.seletor.soIngressos}</p>}
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col gap-3 border-t border-secondary px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                                <span role="status" className="text-sm text-tertiary">
                                    {plural(TEXTOS.seletor.selecionados, selecao.tamanho)}
                                </span>
                                {comFerramentas && selecionaveis.length > 0 && !todosDoFiltroMarcados && (
                                    <Button color="link-color" size="sm" onClick={() => selecao.definir([...new Set([...selecao.ids, ...selecionaveis])])}>
                                        {formatar(TEXTOS.seletor.selecionarTodos, { n: numero(selecionaveis.length) })}
                                    </Button>
                                )}
                                {comFerramentas && selecao.tamanho > 0 && (
                                    <Button color="link-gray" size="sm" onClick={selecao.limpar}>
                                        {TEXTOS.seletor.limparSelecao}
                                    </Button>
                                )}
                            </div>
                            <div className="flex flex-col-reverse gap-3 sm:flex-row">
                                <Button color="secondary" size="md" onClick={onFechar}>
                                    {TEXTOS.seletor.cancelar}
                                </Button>
                                <Button color="primary" size="md" isDisabled={selecao.tamanho === 0} onClick={adicionar}>
                                    {TEXTOS.seletor.adicionar}
                                </Button>
                            </div>
                        </div>
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
}

function Esqueleto() {
    return (
        <div aria-hidden="true" className="flex min-w-0 flex-1 flex-col gap-6">
            <div className="flex flex-col gap-4">
                <div className="h-9 w-24 animate-pulse rounded-lg bg-secondary motion-reduce:animate-none" />
                <div className="h-9 w-64 animate-pulse rounded-lg bg-secondary motion-reduce:animate-none" />
                <div className="h-4 w-80 max-w-full animate-pulse rounded bg-secondary motion-reduce:animate-none" />
            </div>
            <div className="mx-auto flex w-full max-w-[732px] flex-col gap-4">
                {[0, 1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-[76px] animate-pulse rounded-2xl bg-secondary motion-reduce:animate-none" />
                ))}
            </div>
        </div>
    );
}
