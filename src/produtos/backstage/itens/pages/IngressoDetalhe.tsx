import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { toast } from "sonner";
import { ArrowLeft, InfoCircle, Plus, Ticket01, Trash01 } from "@untitledui/icons";
import { EmptyState } from "@/components/application/empty-state/empty-state";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Input } from "@/components/base/input/input";
import { ComboBox } from "@/components/base/select/combobox";
import { Select } from "@/components/base/select/select";
import { LIMIAR_FERRAMENTAS } from "../components/escala";
import { TextArea } from "@/components/base/textarea/textarea";
import { Toggle } from "@/components/base/toggle/toggle";
import { Tooltip, TooltipTrigger } from "@/components/base/tooltip/tooltip";
import { DURACAO_TRANSICAO, Surgir } from "@/components/foundations/transicao";
import type { Lote, TipoIngresso } from "@/plataforma";
import { loteAtual, PRAZO_DA_COMPRA_PENDENTE_MIN } from "@/plataforma";
import { BackstageLayout } from "../../components/Backstage";
import { ButtonGroup, ButtonGroupItem } from "@/components/base/button-group/button-group";
import { SeletorDeLista } from "../components/SeletorDeLista";
import { CHAVES_DE_EXEMPLO, SEGMENTACOES } from "../data/exemplos";
import {
    BarraDeSalvar,
    EscolhaEmLista,
    ListaDeEscolhas,
    CampoPreco,
    CamposDeVendas,
    ConfirmarSaida,
    EstadoBadge,
    SecaoDoItem,
    irParaPrimeiroErro,
    CabecalhoDoItem,
} from "../components/comuns";
import {
    acharIngresso,
    comIngresso,
    estadoDoIngresso,
    ingressoNovo,
    novoId,
    ofertaDoSetor,
    pagosDoLote,
    pendentesDoIngresso,
    pendentesDoLote,
    quantidadeDoIngresso,
    salvarSessoes,
    semIngresso,
    useCatalogo,
    vendidosDoIngresso,
    vendidosDoLote,
} from "../data/catalogo";
import { formatar, useTextosItens } from "../data/textos-itens";

/* ------------------------------------------------------------------ */
/*  Detalhe do ingresso (ITM-20 a ITM-45)                              */
/*                                                                     */
/*  Tudo do ingresso numa página: seções que, fechadas, mostram o      */
/*  resumo em uma linha. Edição em rascunho; a barra de salvar aparece */
/*  quando há mudança, e sair com mudança pede confirmação.            */
/* ------------------------------------------------------------------ */

const T = {
    voltar: "Ingressos",
    novo: "Novo ingresso",
    resumoTopo: "{lote} à venda por {preco}",
    disponiveis: "{n} disponíveis",
    pendentes: "{n} pendentes",
    vendidos: "{n} vendidos",
    pendentesDica: "Em pagamento ou reservados. Seguram o ingresso por {min} minutos; sem pagamento, voltam para disponíveis.",
    pendentesAria: "O que são pendentes",
    ligado: "{ingresso} à venda.",
    desligado: "{ingresso} pausado. Ele para de vender na hora.",
    desfazer: "Desfazer",
    avisoLigado: {
        esgotado: "Ligado, mas esgotado: aumente a quantidade ou adicione um lote.",
        semLote: "Ligado, mas nenhum lote está à venda: ligue um lote em Preço e lotes.",
        semLotes: "Ligado, mas sem lotes: adicione um lote em Preço e lotes.",
    },
    info: "Informações",
    nome: "Nome do ingresso",
    nomeErro: "Dê um nome ao ingresso.",
    tipo: "Tipo",
    inteira: "Inteira",
    meia: "Meia-entrada",
    descricao: "Descrição",
    descricaoDica: "Aparece para o comprador. Diga o que está incluso e quem pode usar.",
    setor: "Setor",
    setorErro: "Escolha um setor. Crie setores na página Ingressos.",
    setorSessao: "{setor}, sessão de {data}",
    setorDaSessao: "Sessão de {data}",
    buscarSetor: "Busque pelo nome do setor",
    lotes: "Preço e lotes",
    lotesDica: "Só um lote vende por vez.",
    loteNome: "Nome do lote",
    lotePreco: "Preço",
    loteQtd: "Quantidade",
    loteNumeros: "{disponiveis} disponíveis, {pendentes} pendentes e {vendidos} vendidos.",
    loteNumerosSemPendentes: "{disponiveis} disponíveis e {vendidos} vendidos.",
    loteQtdErro: "Use pelo menos {n}, a quantidade já vendida.",
    loteQtdErroPendentes: "Use pelo menos {n}, entre vendidos e pendentes.",
    /** Começa pelo rótulo visível (WCAG 2.5.3). */
    loteVender: "À venda, {lote}",
    loteTroca: "Ao salvar, {anterior} deixa de vender e {lote} passa a vender. Só um lote vende por vez.",
    loteChaves: { one: "{n} chave de acesso", other: "{n} chaves de acesso" },
    loteSemChaves: "Sem chave de acesso",
    loteVincular: "Chaves do {lote}",
    nomeContador: "{n} de 70 caracteres",
    descricaoContador: "{n} de 1.000 caracteres",
    itemVendido: "Item vendido",
    itemVendidoDica: "Ingresso dá acesso ao evento; check-in confirma presença; pacote reúne o acesso a mais de um dia ou atração.",
    itens: { ingresso: "Ingresso", checkin: "Check-in", pacote: "Pacote" },
    transferencia: "Transferência",
    transferencias: { sempre: "Sempre permitir", nunca: "Nunca permitir", compra: "Somente na compra" },
    transferenciaPorDependentes: "Com dependentes como portadores, a transferência fica em Nunca permitir.",
    transferenciaPorSegmento: "Com segmentação, a transferência fica em Somente na compra.",
    chaves: "Chaves de acesso",
    chavesDica: "Com chave vinculada, só quem tem uma delas compra. As chaves são criadas em Marketing › Chave de acesso.",
    chavesVincular: "Vincular chaves",
    chavesTitulo: "Chaves de acesso de {item}",
    chavesVazio: "Nenhuma chave neste evento. Crie em Marketing › Chave de acesso.",
    avancadoDica: "Já vêm preenchidas. Mude só se precisar.",
    avancado: "Avançado",
    portador: "Tipo de portador",
    portadores: { usuario: "Somente o usuário", dependentes: "Usuário e dependentes" },
    portadorDica: "Com dependentes, quem compra pode emitir o ingresso para dependentes da conta.",
    vinculada: "Venda vinculada",
    vinculadaDica: "Se usada, só compra este ingresso quem adquirir um dos ingressos escolhidos.",
    vinculadaSem: "sem venda vinculada",
    vinculadaEscolher: "Escolher ingressos",
    vinculadaTitulo: "Venda vinculada de {item}",
    segmentacao: "Segmentação",
    segmentacaoDica: "Só compram pessoas das segmentações escolhidas, aprovadas em Público.",
    segmentacaoSem: "Para qualquer pessoa",
    segmentacaoEscolher: "Escolher segmentações",
    segmentacaoTitulo: "Segmentações que podem comprar",
    segmentacaoVazio: "Nenhuma segmentação na organização. Crie em Público.",
    taxas: "Pagamento de taxas",
    taxasDica: "Quem paga as taxas de venda deste ingresso.",
    pagadores: { comprador: "do comprador", organizacao: "da organização" },
    pagadoresBotao: { comprador: "Comprador", organizacao: "Organização" },
    loteRemover: "Remover {lote}",
    loteComVendas: "{lote} tem vendas: pause em vez de remover.",
    loteNovo: "Adicionar lote",
    loteNomePadrao: "{n}º lote",
    semLotes: "Adicione pelo menos um lote para o ingresso vender.",
    capacidadeAviso: "Com estes lotes, o setor {setor} soma {oferta} ingressos, acima da capacidade de {capacidade}.",
    remover: "Remover ingresso",
    removerTitulo: "Remover {ingresso}?",
    removerDica: "O ingresso sai do catálogo. Esta ação não pode ser desfeita.",
    removerComVendas: "Ingresso com vendas não pode ser removido. Para parar de vender, desligue À venda ao lado do nome.",
    removido: "{ingresso} removido.",
    criado: "{ingresso} criado.",
    revise: "Revise os campos destacados para salvar o ingresso.",
    naoEncontrado: "Ingresso não encontrado",
    naoEncontradoDica: "Ele pode ter sido removido. Volte para a lista de ingressos.",
};


export function IngressoDetalhe() {
    const { id = "" } = useParams();
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const reduzir = useReducedMotion();
    const { carregando, evento, vendidos, pendentes } = useCatalogo();
    const { t, preco, numero, plural, dataCurta } = useTextosItens();
    const novo = id === "novo";

    const setores = useMemo(() => (evento?.sessoes ?? []).flatMap((s) => s.grupos.map((g) => ({ setor: g, sessao: s }))), [evento]);
    const achado = novo ? undefined : acharIngresso(evento, id);
    const original = useMemo<{ tipo: TipoIngresso; setorId: string } | null>(() => {
        if (novo) return { tipo: ingressoNovo(), setorId: params.get("setor") ?? setores[0]?.setor.id ?? "" };
        return achado ? { tipo: achado.tipo, setorId: achado.setor.id } : null;
        // O original só muda quando o item do banco muda (ou ao trocar de rota).
    }, [novo, achado?.tipo, achado?.setor.id, setores.length]);

    const [rascunho, setRascunho] = useState(original);
    const [tentou, setTentou] = useState(false);
    const [salvando, setSalvando] = useState(false);
    const [sair, setSair] = useState(false);
    const [remover, setRemover] = useState(false);
    // Seletor aberto: chaves do ingresso, de um lote, venda vinculada ou segmentações.
    const [seletor, setSeletor] = useState<{ tipo: "chaves" | "vinculada" | "segmentos"; loteId?: string } | null>(null);
    // Ao ligar ou desligar pelo cabeçalho (grava na hora), o resto do rascunho continua.
    const soAtivo = useRef(false);
    useEffect(() => {
        if (soAtivo.current && original) {
            soAtivo.current = false;
            setRascunho((r) => (r ? { ...r, tipo: { ...r.tipo, ativo: original.tipo.ativo } } : original));
            return;
        }
        setRascunho(original);
    }, [original]);

    const mudou = !!rascunho && !!original && (novo || JSON.stringify(rascunho) !== JSON.stringify(original));

    if (carregando) {
        return (
            <BackstageLayout activeSection="itens" activeItem="catalogo-ingressos">
                <div role="status" aria-label="Carregando ingresso" className="flex flex-col gap-4">
                    <span aria-hidden="true" className="h-9 w-64 animate-pulse rounded bg-secondary motion-reduce:animate-none" />
                    <span aria-hidden="true" className="mx-auto h-64 w-full max-w-[732px] animate-pulse rounded-2xl bg-secondary motion-reduce:animate-none" />
                </div>
            </BackstageLayout>
        );
    }

    if (!rascunho || !original || !evento) {
        return (
            <BackstageLayout activeSection="itens" activeItem="catalogo-ingressos">
                <div className="flex flex-1 items-center justify-center py-16">
                    <EmptyState size="sm">
                        <EmptyState.Header>
                            <EmptyState.FeaturedIcon icon={Ticket01} color="gray" theme="modern" />
                        </EmptyState.Header>
                        <EmptyState.Content>
                            <EmptyState.Title>{T.naoEncontrado}</EmptyState.Title>
                            <EmptyState.Description>{T.naoEncontradoDica}</EmptyState.Description>
                        </EmptyState.Content>
                        <EmptyState.Footer>
                            <Button color="primary" size="md" iconLeading={ArrowLeft} onClick={() => navigate("/backstage/catalogo/ingressos")}>
                                {T.voltar}
                            </Button>
                        </EmptyState.Footer>
                    </EmptyState>
                </div>
            </BackstageLayout>
        );
    }

    const tipo = rascunho.tipo;
    const set = (patch: Partial<TipoIngresso>) => setRascunho((r) => (r ? { ...r, tipo: { ...r.tipo, ...patch } } : r));
    const setLote = (loteId: string, patch: Partial<Lote>) => set({ lotes: tipo.lotes.map((l) => (l.id === loteId ? { ...l, ...patch } : l)) });
    /** "À venda" do cabeçalho grava na hora, como o toggle da lista (UI-VIS-015); no ingresso novo, entra no rascunho. */
    const alternarAtivo = async (ativo: boolean, desfazendo = false) => {
        if (novo || !evento || !original) {
            set({ ativo });
            return;
        }
        soAtivo.current = true;
        try {
            await salvarSessoes(evento, comIngresso(evento, { ...original.tipo, ativo }, original.setorId));
            toast.success(formatar(ativo ? T.ligado : T.desligado, { ingresso: original.tipo.nome }), desfazendo ? undefined : { action: { label: T.desfazer, onClick: () => void alternarAtivo(!ativo, true) } });
        } catch {
            soAtivo.current = false;
            toast.error(t.erroAoSalvar);
        }
    };

    /** Só um lote vende por vez: ligar um desliga os outros (com aviso); desligar deixa nenhum vendendo. */
    /** Lote escolhido para vender: o primeiro ligado que ainda tem saldo (lote novo, sem quantidade, também conta). */
    const loteLigado = tipo.lotes.find((l) => !l.pausado && !(l.quantidade > 0 && vendidosDoLote(l, vendidos) >= l.quantidade));
    const venderLote = (loteId: string, ligar: boolean) => {
        const anterior = loteLigado;
        set({ lotes: tipo.lotes.map((l) => ({ ...l, pausado: ligar && l.id === loteId ? undefined : true })) });
        const lote = tipo.lotes.find((l) => l.id === loteId);
        if (ligar && anterior && anterior.id !== loteId && lote) toast.info(formatar(T.loteTroca, { anterior: anterior.nome, lote: lote.nome }));
    };

    // Estado e números do rascunho: a tela mostra o efeito do que está sendo editado.
    const estado = estadoDoIngresso(tipo, vendidos);
    const atual = loteAtual(tipo, vendidos);
    // vendidos do catálogo já inclui os pendentes (seguram o estoque); para mostrar, separa os dois.
    const vendidosTotal = vendidosDoIngresso(tipo, vendidos);
    const total = quantidadeDoIngresso(tipo);
    const pendentesTotal = pendentesDoIngresso(tipo, pendentes);
    const numeros = { disponiveis: Math.max(0, total - vendidosTotal), pendentes: pendentesTotal, vendidos: vendidosTotal - pendentesTotal };
    const setorEscolhido = setores.find((s) => s.setor.id === rascunho.setorId);
    const setorComRascunho = setorEscolhido && {
        ...setorEscolhido.setor,
        ingressos: [...setorEscolhido.setor.ingressos.filter((x) => x.id !== tipo.id), tipo],
    };
    const ofertaSetor = setorComRascunho ? ofertaDoSetor(setorComRascunho) : 0;
    const acimaDaCapacidade = !!setorComRascunho && setorComRascunho.capacidade != null && ofertaSetor > setorComRascunho.capacidade;

    const erros = {
        nome: !tipo.nome.trim() ? T.nomeErro : undefined,
        setor: !setorEscolhido ? T.setorErro : undefined,
        lotes: tipo.lotes.length === 0 ? T.semLotes : undefined,
        loteQtd: tipo.lotes.find((l) => l.quantidade < vendidosDoLote(l, vendidos))?.id,
    };
    // Regras entre campos, como no Backstage atual: dependentes travam "Nunca permitir"; segmentação, "Somente na compra".
    const transferenciaForcada = tipo.portador === "dependentes" ? "nunca" : tipo.segmentos?.length ? "compra" : undefined;
    const transferencia = transferenciaForcada ?? tipo.transferencia ?? "sempre";
    const outrosIngressos = setores.flatMap(({ setor, sessao }) =>
        setor.ingressos
            .filter((x) => x.id !== tipo.id)
            .map((x) => ({ id: x.id, rotulo: x.nome, apoio: evento.sessoes.length > 1 ? formatar(T.setorSessao, { setor: setor.nome, data: dataCurta(sessao.inicio) }) : setor.nome })),
    );
    const valido = !erros.nome && !erros.setor && !erros.lotes && !erros.loteQtd;

    const salvar = async () => {
        setTentou(true);
        if (!valido) {
            toast.error(T.revise);
            irParaPrimeiroErro();
            return;
        }
        setSalvando(true);
        try {
            await salvarSessoes(evento, comIngresso(evento, { ...tipo, nome: tipo.nome.trim(), transferencia: transferenciaForcada ?? tipo.transferencia }, rascunho.setorId));
            toast.success(novo ? formatar(T.criado, { ingresso: tipo.nome.trim() }) : t.salvo);
            if (novo) navigate(`/backstage/catalogo/ingressos/${tipo.id}`, { replace: true });
        } catch {
            toast.error(t.erroAoSalvar);
        } finally {
            setSalvando(false);
            setTentou(false);
        }
    };

    const confirmarRemocao = async () => {
        try {
            await salvarSessoes(evento, semIngresso(evento, tipo.id));
            toast.success(formatar(T.removido, { ingresso: original.tipo.nome }));
            navigate("/backstage/catalogo/ingressos", { replace: true });
        } catch {
            toast.error(t.erroAoSalvar);
        }
    };

    const voltar = () => (mudou && !novo ? setSair(true) : navigate("/backstage/catalogo/ingressos"));

    return (
        <BackstageLayout activeSection="itens" activeItem="catalogo-ingressos">
            <div className="flex min-w-0 flex-1 flex-col gap-6">
                <CabecalhoDoItem
                    voltar={T.voltar}
                    onVoltar={voltar}
                    titulo={novo ? tipo.nome.trim() || T.novo : original.tipo.nome}
                    estado={novo ? undefined : estado}
                    resumo={
                        novo ? undefined : (
                            <NumerosDoEstoque antes={atual ? formatar(T.resumoTopo, { lote: atual.nome, preco: preco(atual.preco) }) : undefined} {...numeros} />
                        )
                    }
                    ativo={tipo.ativo}
                    onAtivo={(ativo) => void alternarAtivo(ativo)}
                    aviso={!novo && tipo.ativo && estado !== "a-venda" ? T.avisoLigado[estado === "esgotado" ? "esgotado" : tipo.lotes.length ? "semLote" : "semLotes"] : undefined}
                />

                <div className="mx-auto flex w-full max-w-[732px] flex-col gap-4">
                    <SecaoDoItem
                        titulo={T.info}
                        alerta={tentou && (!!erros.nome || !!erros.setor)}
                    >
                        <Input
                            label={T.nome}
                            isRequired
                            maxLength={70}
                            value={tipo.nome}
                            onChange={(v) => set({ nome: v })}
                            placeholder="Ex.: Inteira"
                            isInvalid={tentou && !!erros.nome}
                            hint={tentou && erros.nome ? erros.nome : formatar(T.nomeContador, { n: tipo.nome.length })}
                        />
                        <div className="grid gap-4 md:grid-cols-3">
                            <Select
                                label={T.itemVendido}
                                tooltip={T.itemVendidoDica}
                                selectedKey={tipo.itemVendido ?? "ingresso"}
                                onSelectionChange={(k) => k && set({ itemVendido: k === "ingresso" ? undefined : (k as TipoIngresso["itemVendido"]) })}
                                items={(["ingresso", "checkin", "pacote"] as const).map((id) => ({ id, label: T.itens[id] }))}
                            >
                                {(i) => <Select.Item id={i.id}>{i.label}</Select.Item>}
                            </Select>
                            <Select
                                label={T.tipo}
                                selectedKey={tipo.beneficio ?? "inteira"}
                                onSelectionChange={(k) => k && set({ beneficio: k as TipoIngresso["beneficio"] })}
                                items={[
                                    { id: "inteira", label: T.inteira },
                                    { id: "meia-entrada", label: T.meia },
                                ]}
                            >
                                {(i) => <Select.Item id={i.id}>{i.label}</Select.Item>}
                            </Select>
                            <Select
                                label={T.transferencia}
                                selectedKey={transferencia}
                                isDisabled={!!transferenciaForcada}
                                hint={transferenciaForcada === "nunca" ? T.transferenciaPorDependentes : transferenciaForcada === "compra" ? T.transferenciaPorSegmento : undefined}
                                onSelectionChange={(k) => k && set({ transferencia: k === "sempre" ? undefined : (k as TipoIngresso["transferencia"]) })}
                                items={(["sempre", "nunca", "compra"] as const).map((id) => ({ id, label: T.transferencias[id] }))}
                            >
                                {(i) => <Select.Item id={i.id}>{i.label}</Select.Item>}
                            </Select>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            {/* Com muitos setores (várias sessões), o campo vira busca (UI-LST-001). */}
                            <CampoSetor
                                label={T.setor}
                                valor={rascunho.setorId}
                                onChange={(id) => setRascunho((r) => (r ? { ...r, setorId: id } : r))}
                                erro={tentou ? erros.setor : undefined}
                                opcoes={setores.map(({ setor, sessao }) => ({
                                    id: setor.id,
                                    nome: setor.nome,
                                    data: evento.sessoes.length > 1 ? dataCurta(sessao.inicio) : undefined,
                                }))}
                            />
                        </div>
                        <TextArea
                            label={T.descricao}
                            hint={formatar("{dica} {contador}", { dica: T.descricaoDica, contador: formatar(T.descricaoContador, { n: (tipo.descricao ?? "").length }) })}
                            rows={3}
                            maxLength={1000}
                            value={tipo.descricao ?? ""}
                            onChange={(v) => set({ descricao: v || undefined })}
                        />
                    </SecaoDoItem>

                    <SecaoDoItem
                        titulo={T.lotes}
                        alerta={acimaDaCapacidade || (tentou && (!!erros.lotes || !!erros.loteQtd))}
                    >
                        <p className="text-sm text-tertiary">
                            {T.lotesDica}
                            {vendidosTotal > 0 && ` ${t.mudancasValem}`}
                        </p>
                        <Surgir visivel={acimaDaCapacidade}>
                            <p role="status" className="rounded-lg bg-warning-primary px-3 py-2 text-sm text-warning-primary">
                                {formatar(T.capacidadeAviso, { setor: setorEscolhido?.setor.nome ?? "", oferta: numero(ofertaSetor), capacidade: numero(setorEscolhido?.setor.capacidade ?? 0) })}
                            </p>
                        </Surgir>
                        <ol className="flex flex-col gap-3">
                            <AnimatePresence initial={false}>
                                {tipo.lotes.map((l, i) => {
                                    const vendidosLote = vendidosDoLote(l, vendidos);
                                    const pendentesLote = pendentesDoLote(l, pendentes);
                                    const numerosLote = {
                                        disponiveis: numero(Math.max(0, l.quantidade - vendidosLote)),
                                        pendentes: numero(pendentesLote),
                                        vendidos: numero(pagosDoLote(l, vendidos, pendentes)),
                                    };
                                    const qtdInvalida = l.quantidade < vendidosLote;
                                    const esgotado = l.quantidade > 0 && vendidosLote >= l.quantidade;
                                    return (
                                        <motion.li
                                            key={l.id}
                                            layout={!reduzir}
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ duration: reduzir ? 0.12 : DURACAO_TRANSICAO }}
                                            className="overflow-hidden"
                                        >
                                            {/* Celular: o lote vira um cartão empilhado, sem rolagem lateral (UI-MOB-004). */}
                                            <div className="flex flex-col gap-3 rounded-xl p-4 ring-1 ring-secondary">
                                                <div className="flex flex-wrap items-center justify-between gap-2">
                                                    <span className="flex items-center gap-2">
                                                        <span className="text-sm font-semibold text-primary">{l.nome || formatar(T.loteNomePadrao, { n: i + 1 })}</span>
                                                        {esgotado && <EstadoBadge lote estado="esgotado" />}
                                                    </span>
                                                    <span className="flex items-center gap-3">
                                                        {/* Rótulo visível "À venda" (UI-FRM-005); esgotado não liga. */}
                                                        <Toggle
                                                            size="sm"
                                                            label={t.visibilidade.ativo}
                                                            aria-label={formatar(T.loteVender, { lote: l.nome })}
                                                            isSelected={loteLigado?.id === l.id}
                                                            isDisabled={esgotado}
                                                            onChange={(on) => venderLote(l.id, on)}
                                                        />
                                                        <ButtonUtility
                                                            size="xs"
                                                            color="tertiary"
                                                            icon={Trash01}
                                                            tooltip={vendidosLote > 0 ? formatar(T.loteComVendas, { lote: l.nome }) : formatar(T.loteRemover, { lote: l.nome })}
                                                            isDisabled={vendidosLote > 0}
                                                            onClick={() => set({ lotes: tipo.lotes.filter((x) => x.id !== l.id) })}
                                                        />
                                                    </span>
                                                </div>
                                                <div className="grid gap-3 sm:grid-cols-3">
                                                    <Input label={T.loteNome} value={l.nome} onChange={(v) => setLote(l.id, { nome: v })} />
                                                    <CampoPreco label={T.lotePreco} valor={l.preco} onChange={(v) => setLote(l.id, { preco: v })} />
                                                    <Input
                                                        label={T.loteQtd}
                                                        type="number"
                                                        inputMode="numeric"
                                                        value={l.quantidade ? String(l.quantidade) : ""}
                                                        onChange={(v) => setLote(l.id, { quantidade: Math.max(0, Math.round(Number(v) || 0)) })}
                                                        isInvalid={qtdInvalida}
                                                        hint={
                                                            qtdInvalida
                                                                ? formatar(pendentesLote ? T.loteQtdErroPendentes : T.loteQtdErro, { n: numero(vendidosLote) })
                                                                : formatar(pendentesLote ? T.loteNumeros : T.loteNumerosSemPendentes, numerosLote)
                                                        }
                                                    />
                                                </div>
                                                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-secondary pt-3">
                                                    <span className="text-sm text-tertiary">{l.chaves?.length ? plural(T.loteChaves, l.chaves.length) : T.loteSemChaves}</span>
                                                    <Button color="secondary" size="sm" onClick={() => setSeletor({ tipo: "chaves", loteId: l.id })}>
                                                        {formatar(T.loteVincular, { lote: l.nome })}
                                                    </Button>
                                                </div>
                                            </div>
                                        </motion.li>
                                    );
                                })}
                            </AnimatePresence>
                        </ol>
                        <Surgir visivel={tentou && !!erros.lotes}>
                            <p className="text-sm text-error-primary">{T.semLotes}</p>
                        </Surgir>
                        <Button
                            color="secondary"
                            size="md"
                            iconLeading={Plus}
                            className="self-start"
                            onClick={() => {
                                const ultimo = tipo.lotes.at(-1);
                                set({ lotes: [...tipo.lotes, { id: novoId("lot"), nome: formatar(T.loteNomePadrao, { n: tipo.lotes.length + 1 }), preco: ultimo?.preco ?? 0, quantidade: 0, ...(tipo.lotes.length ? { pausado: true } : {}) }] });
                            }}
                        >
                            {T.loteNovo}
                        </Button>
                    </SecaoDoItem>

                    <SecaoDoItem titulo={t.vendas.titulo}>
                        <CamposDeVendas valor={tipo.vendas} onChange={(vendas) => set({ vendas })} />
                        <div className="flex flex-col gap-2 border-t border-secondary pt-5">
                            <span className="text-sm font-medium text-secondary">{T.chaves}</span>
                            <p className="text-sm text-tertiary">{T.chavesDica}</p>
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="text-sm text-primary">{tipo.chaves?.length ? plural(T.loteChaves, tipo.chaves.length) : T.loteSemChaves}</span>
                                <Button color="secondary" size="sm" onClick={() => setSeletor({ tipo: "chaves" })}>
                                    {T.chavesVincular}
                                </Button>
                            </div>
                        </div>
                    </SecaoDoItem>

                    {/* Opcional e raro: único bloco recolhido, como "Configurações avançadas" em Criar evento (UI-FRM-006). */}
                    <SecaoDoItem titulo={T.avancado} descricao={T.avancadoDica} recolhida>
                        <Select
                            label={T.portador}
                            hint={T.portadorDica}
                            selectedKey={tipo.portador ?? "usuario"}
                            onSelectionChange={(k) => k && set({ portador: k === "usuario" ? undefined : (k as TipoIngresso["portador"]) })}
                            items={(["usuario", "dependentes"] as const).map((id) => ({ id, label: T.portadores[id] }))}
                        >
                            {(i) => <Select.Item id={i.id}>{i.label}</Select.Item>}
                        </Select>
                        <ListaDeEscolhas>
                            <EscolhaEmLista
                                rotulo={T.vinculada}
                                dica={T.vinculadaDica}
                                escolhidos={(tipo.vendaVinculada ?? []).map((id) => outrosIngressos.find((o) => o.id === id)?.rotulo ?? id)}
                                vazio={T.vinculadaSem}
                                onEscolher={() => setSeletor({ tipo: "vinculada" })}
                            />
                            <EscolhaEmLista
                                rotulo={T.segmentacao}
                                dica={T.segmentacaoDica}
                                escolhidos={(tipo.segmentos ?? []).map((id) => SEGMENTACOES.find((x) => x.id === id)?.label ?? id)}
                                vazio={T.segmentacaoSem}
                                onEscolher={() => setSeletor({ tipo: "segmentos" })}
                            />
                        </ListaDeEscolhas>
                        <div className="flex flex-col gap-2">
                            <span className="text-sm font-medium text-secondary">{T.taxas}</span>
                            <p className="text-sm text-tertiary">{T.taxasDica}</p>
                            <ButtonGroup
                                size="sm"
                                aria-label={T.taxas}
                                selectedKeys={new Set([tipo.taxas ?? "comprador"])}
                                onSelectionChange={(keys) => {
                                    const v = [...keys][0];
                                    if (v) set({ taxas: v === "comprador" ? undefined : "organizacao" });
                                }}
                                disallowEmptySelection
                            >
                                <ButtonGroupItem id="comprador">{T.pagadoresBotao.comprador}</ButtonGroupItem>
                                <ButtonGroupItem id="organizacao">{T.pagadoresBotao.organizacao}</ButtonGroupItem>
                            </ButtonGroup>
                        </div>
                    </SecaoDoItem>

                    {!novo && (
                        <div className="flex flex-col gap-2 pt-2">
                            {vendidosTotal > 0 ? (
                                <p className="text-sm text-tertiary">{T.removerComVendas}</p>
                            ) : (
                                <Button color="secondary-destructive" size="md" iconLeading={Trash01} className="self-start" onClick={() => setRemover(true)}>
                                    {T.remover}
                                </Button>
                            )}
                        </div>
                    )}
                </div>

                <BarraDeSalvar visivel={mudou} salvando={salvando} onSalvar={salvar} onDescartar={() => (novo ? navigate("/backstage/catalogo/ingressos") : setRascunho(original))} />
            </div>

            {seletor?.tipo === "chaves" && (
                <SeletorDeLista
                    titulo={formatar(T.chavesTitulo, { item: seletor.loteId ? (tipo.lotes.find((l) => l.id === seletor.loteId)?.nome ?? "") : tipo.nome || T.novo })}
                    descricao={T.chavesDica}
                    vazio={T.chavesVazio}
                    opcoes={CHAVES_DE_EXEMPLO.map((c) => ({ id: c, rotulo: c }))}
                    selecionados={(seletor.loteId ? tipo.lotes.find((l) => l.id === seletor.loteId)?.chaves : tipo.chaves) ?? []}
                    onFechar={() => setSeletor(null)}
                    onConfirmar={(ids) => {
                        if (seletor.loteId) setLote(seletor.loteId, { chaves: ids.length ? ids : undefined });
                        else set({ chaves: ids.length ? ids : undefined });
                        setSeletor(null);
                    }}
                />
            )}
            {seletor?.tipo === "vinculada" && (
                <SeletorDeLista
                    titulo={formatar(T.vinculadaTitulo, { item: tipo.nome || T.novo })}
                    descricao={T.vinculadaDica}
                    vazio={T.vinculadaSem}
                    opcoes={outrosIngressos}
                    selecionados={tipo.vendaVinculada ?? []}
                    onFechar={() => setSeletor(null)}
                    onConfirmar={(ids) => {
                        set({ vendaVinculada: ids.length ? ids : undefined });
                        setSeletor(null);
                    }}
                />
            )}
            {seletor?.tipo === "segmentos" && (
                <SeletorDeLista
                    titulo={T.segmentacaoTitulo}
                    descricao={T.segmentacaoDica}
                    vazio={T.segmentacaoVazio}
                    opcoes={SEGMENTACOES.map((x) => ({ id: x.id, rotulo: x.label }))}
                    selecionados={tipo.segmentos ?? []}
                    onFechar={() => setSeletor(null)}
                    onConfirmar={(ids) => {
                        set({ segmentos: ids.length ? ids : undefined });
                        setSeletor(null);
                    }}
                />
            )}
            <ConfirmarSaida aberto={sair} onFechar={() => setSair(false)} onSair={() => navigate("/backstage/catalogo/ingressos")} />
            <ModalOverlay isOpen={remover} onOpenChange={setRemover} isDismissable>
                <Modal className="sm:max-w-[400px]">
                    <Dialog>
                        <div className="flex w-full flex-col gap-5 rounded-2xl bg-primary p-6 shadow-xl ring-1 ring-border-secondary">
                            <div className="flex flex-col gap-1">
                                <h2 className="text-lg font-semibold text-primary">{formatar(T.removerTitulo, { ingresso: original.tipo.nome })}</h2>
                                <p className="text-sm text-tertiary">{T.removerDica}</p>
                            </div>
                            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                <Button color="secondary" size="md" onClick={() => setRemover(false)}>
                                    {t.continuarEditando}
                                </Button>
                                <Button color="primary-destructive" size="md" onClick={confirmarRemocao}>
                                    {T.remover}
                                </Button>
                            </div>
                        </div>
                    </Dialog>
                </Modal>
            </ModalOverlay>
        </BackstageLayout>
    );
}

/** Setor do ingresso: lista simples com poucos setores; com muitos, campo com busca e a sessão como apoio. */
function CampoSetor({ label, valor, onChange, erro, opcoes }: { label: string; valor: string; onChange: (id: string) => void; erro?: string; opcoes: { id: string; nome: string; data?: string }[] }) {
    if (opcoes.length <= LIMIAR_FERRAMENTAS) {
        return (
            <Select
                label={label}
                isRequired
                selectedKey={valor || null}
                onSelectionChange={(k) => k && onChange(String(k))}
                isInvalid={!!erro}
                hint={erro}
                items={opcoes.map((o) => ({ id: o.id, label: o.data ? formatar(T.setorSessao, { setor: o.nome, data: o.data }) : o.nome }))}
            >
                {(i) => <Select.Item id={i.id}>{i.label}</Select.Item>}
            </Select>
        );
    }
    return (
        <ComboBox
            label={label}
            isRequired
            shortcut={false}
            placeholder={T.buscarSetor}
            selectedKey={valor || null}
            onSelectionChange={(k) => k && onChange(String(k))}
            isInvalid={!!erro}
            hint={erro}
            items={opcoes.map((o) => ({ id: o.id, label: o.nome, supportingText: o.data ? formatar(T.setorDaSessao, { data: o.data }) : undefined }))}
        >
            {(i) => (
                <Select.Item id={i.id} supportingText={i.supportingText}>
                    {i.label}
                </Select.Item>
            )}
        </ComboBox>
    );
}



/**
 * Disponíveis, pendentes e vendidos do ingresso, numa frase, sem símbolo separador (UI-TXT-010).
 * Pendentes só aparece quando há, com a explicação do prazo num tooltip (ITM-34).
 */
function NumerosDoEstoque({ antes, disponiveis, pendentes, vendidos }: { antes?: string; disponiveis: number; pendentes: number; vendidos: number }) {
    const { numero } = useTextosItens();
    const inicio = antes ? `${antes}. ` : "";
    const disp = formatar(T.disponiveis, { n: numero(disponiveis) });
    const vend = formatar(T.vendidos, { n: numero(vendidos) });
    if (pendentes <= 0) return <>{`${inicio}${disp} e ${vend}.`}</>;
    return (
        <>
            {`${inicio}${disp}, ${formatar(T.pendentes, { n: numero(pendentes) })}`}
            <Tooltip title={formatar(T.pendentesDica, { min: PRAZO_DA_COMPRA_PENDENTE_MIN })}>
                <TooltipTrigger aria-label={T.pendentesAria} className="mx-1 inline-flex align-middle text-fg-quaternary transition duration-100 ease-linear hover:text-fg-secondary">
                    <InfoCircle className="size-4" />
                </TooltipTrigger>
            </Tooltip>
            {`e ${vend}.`}
        </>
    );
}
