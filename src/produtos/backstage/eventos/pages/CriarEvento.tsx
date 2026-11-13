import { useEffect, useMemo, useRef, useState, type FC, type ReactNode } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { parseDateTime } from "@internationalized/date";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, Image01, Plus, RefreshCw01, Tag01, Trash01, XClose } from "@untitledui/icons";
import { FileUploadDropZone } from "@/components/application/file-upload/file-upload-base";
import { DateTimePicker } from "@/components/application/date-picker/date-time-picker";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { ButtonGroup, ButtonGroupItem } from "@/components/base/button-group/button-group";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Input } from "@/components/base/input/input";
import { ComboBox } from "@/components/base/select/combobox";
import { Select } from "@/components/base/select/select";
import { TextEditor } from "@/components/base/text-editor/text-editor";
import {
    TextEditorAlignCenter,
    TextEditorAlignLeft,
    TextEditorBold,
    TextEditorBulletList,
    TextEditorItalic,
    TextEditorUnderline,
} from "@/components/base/text-editor/text-editor-extensions";
import { EditorButton } from "@/components/base/text-editor/text-editor-button";
import { useEditorContext } from "@/components/base/text-editor/text-editor";
import { Tooltip } from "@/components/base/tooltip/tooltip";
import { Toggle } from "@/components/base/toggle/toggle";
import { Surgir, useTransicao } from "@/components/foundations/transicao";
import type { ConfiguracoesAvancadas, Modalidade, TipoEvento } from "@/plataforma";
import { cx } from "@/utils/cx";
import { BackstageLayout, prepararGuiaDoEventoNovo } from "../../components/Backstage";
import { useOrganizacaoAtual } from "../../organizacoes/data/organizacao-atual";
import { AVANCADO_PADRAO } from "../data/configuracoes-avancadas";
import { CronogramaDeSessoes, temCronograma, type SessaoExtra } from "../components/cronograma-de-sessoes";
import { PeriodoDoEvento } from "../components/periodo-do-evento";
import { IDADES_COM_CLASSIFICACAO } from "../components/classificacao-indicativa";
import { criarEvento } from "../data/eventos";
import { CampoBanner, CampoBannerCompacto, exportarRecorte, useBannerNaColuna, type ImagemDoBanner, type Recorte } from "../components/campo-banner";
import { buscarLocais, useOpcoesEvento, type LocalEncontrado, type Opcao } from "../data/opcoes-evento";
import { tipoDeEvento } from "../data/tipos-evento";
import { formatar, useTextos, vocabularioDe } from "../data/textos-criar-evento";
import { TITULO_PAGINA } from "@/produtos/backstage/components/titulo-pagina";

/* ------------------------------------------------------------------ */
/*  Criar evento por tipo (EVT-50 a EVT-66)                            */
/*                                                                     */
/*  O tipo vem do menu "Criar evento" em Eventos (`?tipo=`). Tela      */
/*  cheia: são ~20 campos. Só Partida (futebol) e Modalidade           */
/*  (esportivo) mudam os campos, e o esportivo troca o vocabulário     */
/*  (inscrição, participante, largada).                                */
/*  Descrições na tela só dizem o que a especificação diz: regra de    */
/*  negócio não confirmada não aparece como texto de ajuda.            */
/* ------------------------------------------------------------------ */

const MODALIDADES: Opcao[] = [
    { id: "corrida", label: "Corrida" },
    { id: "natacao", label: "Natação" },
    { id: "trilha", label: "Trilha" },
    { id: "ciclismo", label: "Ciclismo" },
];

/** Idade mínima com as caixas da classificação indicativa (EVT-94). */
const IDADES: Opcao[] = IDADES_COM_CLASSIFICACAO;



interface Imagem {
    nome: string;
    url: string;
    dataUrl: string;
}

interface Formulario {
    tipo: TipoEvento;
    campeonatoId: string;
    mandanteId: string;
    visitanteId: string;
    programaMembrosId: string;
    modalidade: Modalidade | "";
    /** Categoria do show ou festa (EVT-97). */
    categoriaId: string;
    nome: string;
    /** O nome foi digitado: para de seguir a sugestão "Mandante x Visitante". */
    nomeEditado: boolean;
    /** Local escolhido na busca de endereço (nome e cidade vêm da API). */
    local: LocalEncontrado | null;
    /** ISO local `AAAA-MM-DDTHH:mm`. */
    inicio: string;
    fim: string;
    /** O fim foi preenchido pela sugestão (início + 4 h) e ainda segue o início. */
    fimSugerido: boolean;
    /** Sessões além da primeira (a primeira é o início). O id dá a cada linha uma chave estável para animar a saída. */
    /** Sessões criadas pela pessoa (dia, início e fim); vazio = uma sessão só, no início do evento (EVT-89). */
    sessoesExtras: SessaoExtra[];
    /** Com mais de um dia: direto, com início e fim gerais, ou em sessões, só com os horários delas (EVT-98). */
    formato: "continuo" | "sessoes";
    moeda: string;
    idadeMinima: string;
    descricao: string;
    banner: ImagemDoBanner | null;
    /** Parte da imagem que vira o banner (EVT-81). */
    recorteBanner: Recorte | null;
    mapaTipo: "imagem" | "assentos";
    mapaImagem: Imagem | null;
    mapaId: string;
    avancado: ConfiguracoesAvancadas;
}

const INICIAL: Omit<Formulario, "tipo"> = {
    campeonatoId: "",
    mandanteId: "",
    visitanteId: "",
    programaMembrosId: "",
    modalidade: "",
    categoriaId: "",
    nome: "",
    nomeEditado: false,
    local: null,
    inicio: "",
    fim: "",
    fimSugerido: false,
    sessoesExtras: [],
    formato: "continuo",
    moeda: "BRL",
    idadeMinima: "0",
    descricao: "",
    banner: null,
    recorteBanner: null,
    mapaTipo: "imagem",
    mapaImagem: null,
    mapaId: "",
    avancado: AVANCADO_PADRAO,
};


const lerComoDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result));
        r.onerror = reject;
        r.readAsDataURL(file);
    });

type Erros = Partial<Record<"mandante" | "visitante" | "modalidade" | "categoria" | "nome" | "local" | "inicio" | "fim" | "descricao" | "sessoes" | "mapa", string>>;

/** Evento em sessões (num dia só ou em vários): vale o horário das sessões, não o geral (EVT-98). */
const emSessoes = (f: Formulario) => !!f.inicio && !!f.fim && f.formato === "sessoes";

/** Índices das sessões com problema (vazia ou fora dos dias do evento). */
const sessoesInvalidas = (f: Formulario) =>
    new Set(
        emSessoes(f)
            ? f.sessoesExtras.flatMap(({ valor: s }, i) => (!s || s.slice(0, 10) < f.inicio.slice(0, 10) || s.slice(0, 10) > f.fim.slice(0, 10) ? [i] : []))
            : [],
    );

/** Fim de uma sessão em ISO local: no mesmo dia, ou no seguinte se o horário de fim é antes do início. */
const fimDaSessao = (s: SessaoExtra) => {
    if (!s.fim) return s.valor;
    if (s.fim > s.valor.slice(11, 16)) return `${s.valor.slice(0, 10)}T${s.fim}`;
    const d = new Date(`${s.valor.slice(0, 10)}T12:00`);
    d.setDate(d.getDate() + 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T${s.fim}`;
};

function validar(f: Formulario): Erros {
    const e: Erros = {};
    if (f.tipo === "futebol") {
        if (!f.mandanteId) e.mandante = "Escolha o time mandante.";
        if (!f.visitanteId) e.visitante = "Escolha o time visitante.";
        else if (f.visitanteId === f.mandanteId) e.visitante = "Escolha outro time: o visitante não pode ser o mandante.";
    }
    if (f.tipo === "esportivo" && !f.modalidade) e.modalidade = "Escolha a modalidade.";
    if (f.tipo === "show" && !f.categoriaId) e.categoria = "Escolha a categoria do evento.";
    if (!f.nome.trim()) e.nome = "Dê um nome ao evento.";
    if (!f.local) e.local = "Busque e escolha o local do evento.";
    if (!paragrafosDoHtml(f.descricao).length) e.descricao = "Conte o que vai acontecer no evento.";
    if (!f.inicio) e.inicio = "Escolha quando o evento acontece.";
    // Em sessões não há horário geral: o que vale é ter ao menos uma sessão (EVT-98).
    if (!emSessoes(f)) {
        if (!f.fim) e.fim = "Informe quando o evento termina.";
        else if (f.inicio && f.fim <= f.inicio) e.fim = "Escolha um fim depois do início.";
    }
    const ruins = sessoesInvalidas(f);
    if (emSessoes(f) && f.sessoesExtras.length === 0) e.sessoes = f.tipo === "esportivo" ? "Adicione ao menos uma largada." : "Adicione ao menos uma sessão.";
    else if (ruins.size > 0) {
        e.sessoes = f.sessoesExtras.some((s) => !s.valor)
            ? "Preencha a data das sessões destacadas ou remova as vazias."
            : "Mova as sessões destacadas para dentro do período do evento.";
    }
    if (f.mapaTipo === "assentos" && !f.mapaId) e.mapa = "Escolha o mapa de assentos ou envie uma imagem.";
    return e;
}

const paraData = (s: string) => {
    try {
        return s ? parseDateTime(s) : null;
    } catch {
        return null;
    }
};

export function CriarEvento() {
    const [params] = useSearchParams();
    const tipo = tipoDeEvento(params.get("tipo"));
    // EVT-51: sem tipo válido não há o que criar; volta para Eventos, onde o menu escolhe o tipo.
    if (!tipo) return <Navigate to="/backstage/eventos" replace />;
    // Trocar de tipo pela URL remonta o formulário do zero.
    return <FormularioDeEvento key={tipo.id} tipo={tipo.id} titulo={tipo.titulo} />;
}

function FormularioDeEvento({ tipo, titulo }: { tipo: TipoEvento; titulo: string }) {
    const navigate = useNavigate();
    const organizacao = useOrganizacaoAtual();
    const opcoes = useOpcoesEvento();
    const inicial = useMemo<Formulario>(() => ({ ...INICIAL, tipo }), [tipo]);
    const [f, setF] = useState<Formulario>(inicial);
    const [tentou, setTentou] = useState(false);
    const [confirmarSaida, setConfirmarSaida] = useState(false);
    // Cronograma fechado até a pessoa pedir; com sessões já marcadas, fica aberto (EVT-89).
    const set = <K extends keyof Formulario>(k: K, v: Formulario[K]) => setF((atual) => ({ ...atual, [k]: v }));
    const setAvancado = <K extends keyof ConfiguracoesAvancadas>(k: K, v: ConfiguracoesAvancadas[K]) => setF((a) => ({ ...a, avancado: { ...a.avancado, [k]: v } }));

    const { t, locale } = useTextos();
    // Vocabulário por tipo (Ingresse Sports: "largada" e "participante"; ver domain-context).
    const voc = vocabularioDe(t, f.tipo);
    const itemDoCronograma = f.tipo === "esportivo" ? "largada" : "sessão";
    const erros = useMemo(() => (tentou ? validar(f) : {}), [f, tentou]);
    const ruins = useMemo(() => (tentou ? sessoesInvalidas(f) : new Set<number>()), [f, tentou]);
    const times = opcoes.dados?.times ?? [];
    const nomeDoTime = (id: string) => times.find((t) => t.id === id)?.label;
    const preenchido = JSON.stringify(f) !== JSON.stringify(inicial);

    // Próximo obrigatório que falta, na ordem em que aparece na tela (EVT-93). Calculado sempre, sem esperar o clique em Criar.
    const pendencias = validar(f);
    const ORDEM: (keyof Erros)[] = ["nome", "mandante", "visitante", "modalidade", "categoria", "inicio", "fim", "sessoes", "local", "descricao", "mapa"];
    const campoPendente = ORDEM.find((k) => pendencias[k]);
    const proximaPendencia = campoPendente ? { campo: campoPendente, texto: pendencias[campoPendente]! } : null;
    const irParaCampo = (campo: keyof Erros) => {
        const alvo: Partial<Record<keyof Erros, string>> = { nome: "nome-do-evento", categoria: "campo-categoria", inicio: "campo-quando", fim: "campo-quando", local: "campo-local", descricao: "campo-sobre", sessoes: "campo-quando" };
        const el = alvo[campo] ? document.getElementById(alvo[campo]!) : null;
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
        (el?.matches("input, textarea, button") ? el : el?.querySelector<HTMLElement>("input, button"))?.focus({ preventScroll: true });
    };
    const transicao = useTransicao();

    // EVT-54: no futebol, o nome segue "Mandante x Visitante" até a pessoa digitar outro.
    useEffect(() => {
        if (f.tipo !== "futebol" || f.nomeEditado) return;
        const m = nomeDoTime(f.mandanteId);
        const v = nomeDoTime(f.visitanteId);
        const sugestao = m && v ? formatar(t.sugestaoDeNome, { mandante: m, visitante: v }) : "";
        if (sugestao !== f.nome) set("nome", sugestao);
    }, [f.tipo, f.mandanteId, f.visitanteId, f.nomeEditado, times.length]);

    // EVT-64: com algo preenchido, sair pede confirmação.
    const sair = () => (preenchido ? setConfirmarSaida(true) : navigate("/backstage/eventos"));

    // Banner: sem limite de tamanho (o que vai para o evento é o recorte em 1080 × 1350, EVT-81). O recorte se faz no modal do DS.
    const bannerNaColuna = useBannerNaColuna();
    const propsDoBanner = {
        imagem: f.banner,
        recorte: f.recorteBanner,
        validar: (file: File) => {
            const ok = ["image/png", "image/jpeg"].includes(file.type);
            if (!ok) toast.error("Escolha uma imagem PNG ou JPG para o banner.");
            return ok;
        },
        onAplicar: (banner: ImagemDoBanner, recorteBanner: Recorte) => setF((a) => ({ ...a, banner, recorteBanner })),
        onRemover: () => setF((a) => ({ ...a, banner: null, recorteBanner: null })),
    };

    const criar = async () => {
        setTentou(true);
        const e = validar(f);
        if (Object.keys(e).length > 0) {
            // Sem toast: os campos marcados e a instrução da barra já dizem o que falta (EVT-60, EVT-93).
            requestAnimationFrame(() => document.querySelector<HTMLElement>("[data-erro]")?.scrollIntoView({ behavior: "smooth", block: "center" }));
            return;
        }
        // Em sessões, o evento começa na primeira e termina no fim da última; direto, uma sessão só, no início (EVT-89, EVT-98).
        const ordenadas = emSessoes(f) ? [...f.sessoesExtras].sort((a, b) => a.valor.localeCompare(b.valor)) : [];
        const inicioDoEvento = ordenadas[0]?.valor ?? f.inicio;
        const fimDoEvento = ordenadas.length ? ordenadas.map(fimDaSessao).sort().at(-1)! : f.fim;
        const novo = criarEvento({
            nome: f.nome.trim(),
            data: new Date(inicioDoEvento).toISOString(),
            sessoes: (ordenadas.length ? ordenadas.map((s) => s.valor) : [f.inicio]).map((v) => new Date(v).toISOString()),
            local: f.local!.nome,
            cidade: f.local!.cidade,
            produtor: organizacao?.nome ?? "",
            // Texto puro em parágrafos para quem só lê `vitrine.descricao`; o rich text vai junto (EVT-86).
            descricao: paragrafosDoHtml(f.descricao).join("\n\n") || undefined,
            // A capa é o recorte, não a imagem enviada (EVT-81).
            capa: f.banner && f.recorteBanner ? await exportarRecorte(f.banner, f.recorteBanner) : undefined,
            extras: {
                tipo: f.tipo,
                modalidade: f.tipo === "esportivo" ? (f.modalidade as Modalidade) : undefined,
                categoria: f.tipo === "show" ? f.categoriaId : undefined,
                fim: fimDoEvento,
                moeda: f.moeda,
                // Limites não se definem na criação: nasce ilimitado e se ajusta em Itens › Configurações de ingressos (EVT-57).
                limites: { geral: null, porCategoria: {} },
                idadeMinima: Number(f.idadeMinima),
                mapa: f.mapaTipo === "assentos" ? { tipo: "assentos", mapaId: f.mapaId } : { tipo: "imagem", url: f.mapaImagem?.dataUrl },
                partida:
                    f.tipo === "futebol"
                        ? { campeonatoId: f.campeonatoId || undefined, mandanteId: f.mandanteId, visitanteId: f.visitanteId, programaMembrosId: f.programaMembrosId || undefined }
                        : undefined,
                avancado: f.avancado,
                ...(f.descricao ? { vitrine: { descricao: paragrafosDoHtml(f.descricao), descricaoHtml: f.descricao } } : {}),
            },
        });
        // Sem toast: quem anuncia o evento criado é o holofote do guia de configuração, que só toca aqui (EVT-10, GDC-14).
        prepararGuiaDoEventoNovo(novo.id);
        navigate("/backstage/catalogo/ingressos");
    };

    const carregando = opcoes.status === "carregando";
    const listaVazia = carregando ? "Carregando…" : "Selecione";

    return (
        <BackstageLayout activeProducer="eventos" showEventContext={false}>
            <div className="flex w-full min-w-0 flex-1 flex-col gap-8">
                {/* Voltar e, embaixo, o título da tela; sem selo nem descrição (EVT-85). */}
                <header className="flex flex-col items-start gap-4">
                    <Button color="tertiary" size="md" iconLeading={ArrowLeft} onClick={sair} className="-ml-3">
                        Eventos
                    </Button>
                    <h1 className={TITULO_PAGINA}>{titulo}</h1>
                </header>

                <Surgir visivel={opcoes.status === "erro"} gap={24}>
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-error-primary px-4 py-3 ring-1 ring-error_subtle">
                        <p className="text-sm text-error-primary">Tente de novo: não foi possível carregar as listas (times, moedas, políticas).</p>
                        <Button size="sm" color="secondary" onClick={opcoes.recarregar}>
                            Tentar de novo
                        </Button>
                    </div>
                </Surgir>

                {/* Banner à esquerda, fixo ao rolar; à direita, os blocos do formulário empilhados em cartões (EVT-85). */}
                <div className="grid items-start gap-8 lg:max-w-[1736px] lg:grid-cols-[auto_minmax(0,1fr)] lg:gap-9">
                    {bannerNaColuna && (
                        <div className="lg:sticky lg:top-6 lg:w-[min(34vw,calc((100dvh-19rem)*0.8))]">
                            {/* A largura sai da altura: banner e as opções embaixo dele cabem na tela, acima da barra de Criar evento.
                                O formulário estica até 1920 px de tela e fica à mesma distância do banner que a margem da direita. */}
                            <CampoBanner {...propsDoBanner} />
                        </div>
                    )}

                    <div className="flex min-w-0 flex-col gap-6">
                    {/* Abaixo do desktop, o banner vem antes, como no desktop, numa caixa enxuta (EVT-80). */}
                    {!bannerNaColuna && <CampoBannerCompacto {...propsDoBanner} />}

                    {/* O que aparece na página do evento, num cartão só (EVT-85). */}
                    <Secao titulo="Informações do evento">
                    <div className="flex min-w-0 flex-col gap-8">
                        {/* Nome num campo do DS. */}
                        <div className="flex gap-4" data-erro={erros.nome ? "" : undefined}>
                            <div className="min-w-0 flex-1">
                                <Input
                                    id="nome-do-evento"
                                    label="Nome do evento"
                                    isRequired
                                    // Ao abrir a tela, o cursor já está no nome (EVT-87).
                                    autoFocus
                                    value={f.nome}
                                    onChange={(v) => setF((a) => ({ ...a, nome: v, nomeEditado: v.length > 0 }))}
                                    placeholder={f.tipo === "futebol" ? "Mandante x Visitante" : f.tipo === "esportivo" ? "Ex.: Corrida Noturna 10K" : "Ex.: Festa de Réveillon"}
                                    isInvalid={!!erros.nome}
                                    hint={erros.nome ?? (f.tipo === "futebol" && !f.nomeEditado ? "Preenchido com os times; dá para editar." : undefined)}
                                />
                            </div>
                        </div>

                        {/* Futebol: a partida vem depois do nome, uma linha por campo; mandante e visitante lado a lado. */}
                        {f.tipo === "futebol" && (
                            <>
                                <div className="flex gap-4">
                                    <div className="min-w-0 flex-1">
                                        <Grade>
                                            <CampoSelect
                                                label="Time mandante"
                                                isRequired
                                                opcoes={times}
                                                valor={f.mandanteId}
                                                onChange={(v) => set("mandanteId", v)}
                                                placeholder={listaVazia}
                                                isDisabled={carregando}
                                                erro={erros.mandante}
                                            />
                                            <CampoSelect
                                                label="Time visitante"
                                                isRequired
                                                opcoes={times.filter((t) => t.id !== f.mandanteId)}
                                                valor={f.visitanteId}
                                                onChange={(v) => set("visitanteId", v)}
                                                placeholder={listaVazia}
                                                isDisabled={carregando}
                                                erro={erros.visitante}
                                            />
                                        </Grade>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="min-w-0 flex-1 sm:max-w-xs">
                                        <CampoSelect
                                            label="Campeonato"
                                            limpavel
                                            hint="Opcional"
                                            opcoes={opcoes.dados?.campeonatos ?? []}
                                            valor={f.campeonatoId}
                                            onChange={(v) => set("campeonatoId", v)}
                                            placeholder={listaVazia}
                                            isDisabled={carregando}
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="min-w-0 flex-1 sm:max-w-xs">
                                        <CampoSelect
                                            label="Programa de membros"
                                            limpavel
                                            hint="Opcional"
                                            opcoes={opcoes.dados?.programasMembros ?? []}
                                            valor={f.programaMembrosId}
                                            onChange={(v) => set("programaMembrosId", v)}
                                            placeholder={listaVazia}
                                            isDisabled={carregando}
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Esportivo: modalidade logo depois do nome, como as outras linhas. */}
                        {f.tipo === "esportivo" && (
                            <div className="flex gap-4">
                                <div className="min-w-0 flex-1 sm:max-w-xs">
                                    <CampoSelect
                                        label="Modalidade"
                                        isRequired
                                        opcoes={MODALIDADES}
                                        valor={f.modalidade}
                                        onChange={(v) => set("modalidade", v as Modalidade)}
                                        placeholder="Selecione"
                                        erro={erros.modalidade}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Show ou festa: categoria logo depois do nome, como a modalidade do esportivo (EVT-97). */}
                        {f.tipo === "show" && (
                            <div className="flex gap-4">
                                <div id="campo-categoria" className="min-w-0 flex-1 sm:max-w-xs">
                                    <CampoSelect
                                        label="Categoria"
                                        icone={Tag01}
                                        isRequired
                                        opcoes={opcoes.dados?.categorias ?? []}
                                        valor={f.categoriaId}
                                        onChange={(v) => set("categoriaId", v)}
                                        placeholder={listaVazia}
                                        isDisabled={carregando}
                                        erro={erros.categoria}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Quando e onde, como na página: ícone e informação. */}
                        <dl className="flex flex-col gap-5">
                            <LinhaDaPagina titulo="Quando">
                                {/* Dias como passagem de ida e volta, depois os horários (EVT-88). */}
                                <div id="campo-quando" data-erro={erros.inicio || erros.fim || erros.sessoes ? "" : undefined}>
                                    <PeriodoDoEvento
                                        inicio={f.inicio}
                                        fim={f.fim}
                                        onChange={(inicio, fim) =>
                                            // Sessões fora do novo período saem junto.
                                            setF((a) => ({ ...a, inicio, fim, fimSugerido: false, sessoesExtras: a.sessoesExtras.filter((x) => x.valor.slice(0, 10) >= inicio.slice(0, 10) && x.valor.slice(0, 10) <= fim.slice(0, 10)) }))
                                        }
                                        erroInicio={erros.inicio}
                                        erroFim={erros.fim}
                                        semHorarios={emSessoes(f)}
                                        avisoAoAplicar={(d1, d2) => {
                                            // Encurtar os dias tira as sessões que ficam fora: avisa antes do Aplicar.
                                            if (f.formato !== "sessoes") return null;
                                            const fora = f.sessoesExtras.filter((x) => x.valor.slice(0, 10) < d1 || x.valor.slice(0, 10) > d2).length;
                                            if (!fora) return null;
                                            const nome = f.tipo === "esportivo" ? (fora === 1 ? "largada fica" : "largadas ficam") : fora === 1 ? "sessão fica" : "sessões ficam";
                                            return `${fora} ${nome} fora destes dias e ${fora === 1 ? "sai" : "saem"} ao aplicar.`;
                                        }}
                                        escolhaDeFormato={
                                            // Com os dias escolhidos (um ou vários): um horário geral ou sessões, cada um com os horários que fazem sentido (EVT-98).
                                            !!f.inicio && (
                                                <div className="flex flex-col gap-1.5">
                                                    <span className="text-sm font-medium text-secondary">Como o evento acontece</span>
                                                    <Escolha
                                                        rotulo="Como o evento acontece"
                                                        valor={f.formato}
                                                        opcoes={[
                                                            { id: "continuo", label: temCronograma(f.inicio, f.fim) ? "Direto, do início ao fim" : "Um horário" },
                                                            { id: "sessoes", label: f.tipo === "esportivo" ? "Em largadas" : "Em sessões" },
                                                        ]}
                                                        onChange={(v) => set("formato", v as Formulario["formato"])}
                                                    />
                                                </div>
                                            )
                                        }
                                        complemento={
                                        <Surgir visivel={emSessoes(f)} gap={16}>
                                            <div className="flex flex-col gap-3">
                                                <CronogramaDeSessoes
                                                    inicio={f.inicio}
                                                    fim={f.fim}
                                                    sessoes={f.sessoesExtras}
                                                    onChange={(sessoesExtras) => set("sessoesExtras", sessoesExtras)}
                                                    item={itemDoCronograma}
                                                />
                                                {erros.sessoes && <p className="text-sm text-error-primary">{erros.sessoes}</p>}
                                            </div>
                                        </Surgir>
                                        }
                                    />
                                </div>
                            </LinhaDaPagina>
                            <LinhaDaPagina titulo="Onde">
                                <div id="campo-local" data-erro={erros.local ? "" : undefined}>
                                    <CampoLocal valor={f.local} onChange={(v) => set("local", v)} erro={erros.local} />
                                </div>
                            </LinhaDaPagina>
                        </dl>


                        {/* Sobre o evento: rótulo do mesmo tamanho e a formatação dentro da caixa (EVT-86). */}
                        <div id="campo-sobre" className="flex gap-4" data-erro={erros.descricao ? "" : undefined}>
                            <TextEditor.Root
                                content={f.descricao}
                                onUpdate={({ editor }) => {
                                    const html = editor.getHTML();
                                    set("descricao", html === "<p></p>" ? "" : html);
                                }}
                                // Imagem redimensionável pelos cantos, mantendo a proporção (EVT-86). O editor do DS não expõe a
                                // opção; ela é ligada antes de o editor montar, quando as visualizações dos nós ainda não existem.
                                onBeforeCreate={({ editor }) => {
                                    // As opções são recalculadas a cada leitura (addOptions): troca a função, não o objeto.
                                    const imagem = editor.extensionManager.extensions.find((e) => e.name === "image");
                                    if (!imagem) return;
                                    const anteriores = imagem.options;
                                    imagem.config.addOptions = () => ({
                                        ...anteriores,
                                        resize: { enabled: true, alwaysPreserveAspectRatio: true, minWidth: 80, minHeight: 40, directions: ["top-left", "top-right", "bottom-left", "bottom-right"] },
                                    });
                                }}
                                placeholder="Conte o que vai acontecer, a programação e o que está incluso."
                                className="flex min-w-0 flex-1 flex-col gap-1.5"
                                inputClassName={cx(
                                    "min-h-40 resize-y rounded-none rounded-b-lg bg-transparent px-3.5 pt-2 pb-3 shadow-none ring-0 focus:ring-0",
                                    // Mesmo visual do recorte do banner (Cropper do DS): contorno de 2 px em utility-brand-600 e alças
                                    // quadradas brancas de 12 px com borda de 2 px. Aparecem ao passar o mouse ou com a imagem selecionada.
                                    "[&_[data-resize-container]]:my-3 [&_[data-resize-wrapper]]:max-w-full [&_[data-resize-wrapper]_img]:h-auto! [&_[data-resize-wrapper]_img]:max-w-full",
                                    "[&_[data-resize-wrapper]]:outline-2 [&_[data-resize-wrapper]]:-outline-offset-2 [&_[data-resize-wrapper]]:outline-transparent [&_[data-resize-wrapper]]:transition-[outline-color] [&_[data-resize-wrapper]]:duration-100",
                                    "[&_[data-resize-container]:hover_[data-resize-wrapper]]:outline-utility-brand-600 [&_.ProseMirror-selectednode_[data-resize-wrapper]]:outline-utility-brand-600 [&_[data-resize-state=true]_[data-resize-wrapper]]:outline-utility-brand-600",
                                    "[&_[data-resize-handle]]:z-10 [&_[data-resize-handle]]:size-3 [&_[data-resize-handle]]:border-2 [&_[data-resize-handle]]:border-utility-brand-600 [&_[data-resize-handle]]:bg-white [&_[data-resize-handle]]:opacity-0 [&_[data-resize-handle]]:transition-opacity [&_[data-resize-handle]]:duration-100",
                                    "[&_[data-resize-container]:hover_[data-resize-handle]]:opacity-100 [&_.ProseMirror-selectednode_[data-resize-handle]]:opacity-100 [&_[data-resize-state=true]_[data-resize-handle]]:opacity-100",
                                    "[&_[data-resize-handle=top-left]]:-translate-1/2 [&_[data-resize-handle=top-left]]:cursor-nwse-resize [&_[data-resize-handle=bottom-right]]:translate-1/2 [&_[data-resize-handle=bottom-right]]:cursor-nwse-resize",
                                    "[&_[data-resize-handle=top-right]]:translate-x-1/2 [&_[data-resize-handle=top-right]]:-translate-y-1/2 [&_[data-resize-handle=top-right]]:cursor-nesw-resize [&_[data-resize-handle=bottom-left]]:-translate-x-1/2 [&_[data-resize-handle=bottom-left]]:translate-y-1/2 [&_[data-resize-handle=bottom-left]]:cursor-nesw-resize",
                                )}
                            >
                                <TextEditor.Label isRequired>Sobre o evento</TextEditor.Label>
                                <div className={cx("flex flex-col overflow-hidden rounded-lg bg-primary shadow-xs ring-1 ring-primary transition duration-100 ease-linear ring-inset focus-within:ring-2 focus-within:ring-brand", erros.descricao && "ring-error_subtle focus-within:ring-error")}>
                                    <div className="border-b border-secondary px-2 py-1.5">
                                        <BarraDaDescricao />
                                    </div>
                                    <TextEditor.Content />
                                </div>
                                {erros.descricao && <p className="text-sm text-error-primary">{erros.descricao}</p>}
                            </TextEditor.Root>
                        </div>
                    </div>
                    </Secao>

                {/* O que não aparece na página, mas define como o evento vende (EVT-85). */}
                <section aria-labelledby="detalhes-do-evento" className="flex flex-col gap-6 pt-4 pb-6">
                    <div className="flex flex-col gap-1">
                        <h2 id="detalhes-do-evento" className="text-lg font-semibold text-primary">
                            Detalhes do evento
                        </h2>
                    </div>

                    {/* Empilhados, um embaixo do outro. */}
                    <div className="flex flex-col gap-6">
                        <Secao titulo="Venda">
                            <Grade>
                                <CampoSelect
                                    label="Moeda"
                                    isRequired
                                    opcoes={opcoes.dados?.moedas ?? []}
                                    valor={f.moeda}
                                    onChange={(v) => set("moeda", v)}
                                    placeholder={listaVazia}
                                    isDisabled={carregando}
                                />
                                <CampoSelect label="Idade mínima" opcoes={IDADES} valor={f.idadeMinima} onChange={(v) => set("idadeMinima", v)} />
                            </Grade>
                            {/* Das configurações avançadas, só a política fica na criação; o resto está em Itens › Configurações de ingressos (EVT-84). */}
                            <CampoSelect
                                label="Política"
                                opcoes={opcoes.dados?.politicas ?? []}
                                valor={f.avancado.politicaId ?? ""}
                                onChange={(v) => setAvancado("politicaId", v)}
                                placeholder={listaVazia}
                                isDisabled={carregando}
                            />
                        </Secao>

                        <Secao titulo="Mapa">
                            <div className="flex flex-col gap-3" data-erro={erros.mapa ? "" : undefined}>
                                <Escolha
                                    rotulo="Origem do mapa"
                                    valor={f.mapaTipo}
                                    opcoes={[
                                        { id: "imagem", label: "Enviar imagem" },
                                        { id: "assentos", label: "Mapa de assentos" },
                                    ]}
                                    onChange={(v) => set("mapaTipo", v as Formulario["mapaTipo"])}
                                />
                                {/* Troca deslizando: um encolhe enquanto o outro cresce (UI-VIS-008). */}
                                <div className="flex flex-col">
                                    <Surgir visivel={f.mapaTipo === "imagem"}>
                                        <CampoImagem
                                            rotulo="Mapa"
                                            hint="PNG ou JPG, com setores e acessos."
                                            arquivo={f.mapaImagem}
                                            onEscolher={(img) => set("mapaImagem", img)}
                                            onRemover={() => set("mapaImagem", null)}
                                        />
                                    </Surgir>
                                    <Surgir visivel={f.mapaTipo === "assentos"}>
                                        <CampoSelect
                                            label="Mapa de assentos"
                                            isRequired
                                            hint="Mapas cadastrados para a organização."
                                            opcoes={opcoes.dados?.mapasDeAssentos ?? []}
                                            valor={f.mapaId}
                                            onChange={(v) => set("mapaId", v)}
                                            placeholder={listaVazia}
                                            isDisabled={carregando}
                                            erro={erros.mapa}
                                        />
                                    </Surgir>
                                </div>
                            </div>
                        </Secao>
                    </div>
                </section>
                    </div>
                </div>

                {/* Mesmo fundo da página (UI-VIS-013); a borda separa do conteúdo que rola por baixo. */}
                <footer data-barra-fixa className="sticky bottom-0 z-20 mt-auto border-t border-secondary bg-primary_alt">
                    <div className="flex flex-wrap items-center justify-end gap-3 py-3">
                        {/* Uma instrução por vez: o próximo campo obrigatório que falta, na ordem da tela (EVT-93). */}
                        <p aria-live="polite" className="mr-auto min-w-0 text-sm text-tertiary">
                            {proximaPendencia ? (
                                <button
                                    type="button"
                                    onClick={() => irParaCampo(proximaPendencia.campo)}
                                    className="cursor-pointer text-left font-medium text-secondary underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                                >
                                    {proximaPendencia.texto}
                                </button>
                            ) : (
                                "Tudo pronto para criar o evento."
                            )}
                        </p>
                        <Button color="secondary" size="md" onClick={sair}>
                            Cancelar
                        </Button>
                        <Button color="primary" size="md" onClick={criar}>
                            Criar evento
                        </Button>
                    </div>
                </footer>
            </div>

            <ModalOverlay isOpen={confirmarSaida} onOpenChange={setConfirmarSaida} isDismissable>
                <Modal className="sm:max-w-[400px]">
                    <Dialog>
                        <div className="flex w-full flex-col gap-5 rounded-2xl bg-primary p-6 shadow-xl ring-1 ring-border-secondary">
                            <div className="flex flex-col gap-1">
                                <h2 className="text-lg font-semibold text-primary">Descartar o evento?</h2>
                                <p className="text-sm text-tertiary">O que você preencheu será perdido. O evento ainda não foi criado.</p>
                            </div>
                            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                <Button color="secondary" size="md" onClick={() => setConfirmarSaida(false)}>
                                    Continuar editando
                                </Button>
                                <Button color="primary-destructive" size="md" onClick={() => navigate("/backstage/eventos")}>
                                    Descartar
                                </Button>
                            </div>
                        </div>
                    </Dialog>
                </Modal>
            </ModalOverlay>
        </BackstageLayout>
    );
}

/* ---------------- peças ---------------- */

/** Parágrafos em texto puro de um HTML do editor (blocos e itens de lista viram um parágrafo cada). */
function paragrafosDoHtml(html: string): string[] {
    if (!html) return [];
    const doc = new DOMParser().parseFromString(html, "text/html");
    const blocos = doc.body.querySelectorAll("p, li, h1, h2, h3, h4, blockquote");
    const textos = blocos.length ? [...blocos].map((b) => b.textContent ?? "") : [doc.body.textContent ?? ""];
    return textos.map((t) => t.trim()).filter(Boolean);
}

/**
 * Barra do "Sobre o evento" montada com as peças do editor do DS, sem escolha de cor nem fonte:
 * a página do evento usa as cores e a tipografia da Ingresse (EVT-86). Sem link, porque o editor
 * pede a URL num prompt em inglês.
 */
const Separador = () => (
    <div className="p-1.5" aria-hidden="true">
        <div className="h-full w-px rounded-full bg-border-primary" />
    </div>
);
const BarraDaDescricao = () => (
    <div role="toolbar" aria-label="Formatação da descrição" className="flex w-max flex-wrap gap-0.5">
        <Tooltip title="Negrito ⌘B">
            <TextEditorBold />
        </Tooltip>
        <Tooltip title="Itálico ⌘I">
            <TextEditorItalic />
        </Tooltip>
        <Tooltip title="Sublinhado ⌘U">
            <TextEditorUnderline />
        </Tooltip>
        <Separador />
        <Tooltip title="Alinhar à esquerda">
            <TextEditorAlignLeft />
        </Tooltip>
        <Tooltip title="Centralizar">
            <TextEditorAlignCenter />
        </Tooltip>
        <Separador />
        <Tooltip title="Lista">
            <TextEditorBulletList />
        </Tooltip>
        <Separador />
        <Tooltip title="Inserir imagem">
            <InserirImagem />
        </Tooltip>
    </div>
);

/**
 * Imagem no meio da descrição. O botão do DS grava um endereço temporário do navegador, que some ao
 * recarregar; aqui a imagem entra como data URL, como as outras imagens do evento, sem limite de
 * tamanho (EVT-86).
 */
const InserirImagem = () => {
    const { editor, isDisabled } = useEditorContext();
    const arquivo = useRef<HTMLInputElement>(null);
    return (
        <>
            <input
                ref={arquivo}
                type="file"
                accept="image/png,image/jpeg"
                className="hidden"
                onChange={async (e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (!file) return;
                    // Sem limite de tamanho na imagem da descrição (EVT-86).
                    editor.chain().focus().setImage({ src: await lerComoDataUrl(file), alt: "" }).run();
                }}
            />
            <EditorButton aria-label="Inserir imagem" isDisabled={isDisabled} onClick={() => arquivo.current?.click()}>
                <Image01 className="size-5" />
            </EditorButton>
        </>
    );
};

/** Linha de informação da página do evento: ícone, título curto e o campo que edita a informação. */
/* O título fica só para leitor de tela: o rótulo do campo já diz o que é, e o ícone desce até a altura do campo (abaixo do rótulo). */
const LinhaDaPagina = ({ icone, titulo, children }: { icone: FC<{ className?: string }>; titulo: string; children: ReactNode }) => (
    <div className="flex gap-4">
        <div className="min-w-0 flex-1">
            <dt className="sr-only">{titulo}</dt>
            <dd className="min-w-0">{children}</dd>
        </div>
    </div>
);

/** Data e hora por extenso no idioma da pessoa. */
const formatarDataHora = (v: string, locale: string) => {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? v : new Intl.DateTimeFormat(locale, { dateStyle: "long", timeStyle: "short" }).format(d);
};

/** Seção do formulário: título e, se precisar, subtítulo (UI-VIS-014). */
const Secao = ({ titulo, descricao, children }: { titulo: string; descricao?: string; children: ReactNode }) => (
    <section className="flex flex-col gap-5 rounded-2xl bg-primary p-5 ring-1 ring-secondary md:p-6">
        <div className="flex flex-col gap-0.5">
            <h2 className="text-lg font-semibold text-primary">{titulo}</h2>
            {descricao && <p className="max-w-[65ch] text-sm text-tertiary">{descricao}</p>}
        </div>
        {children}
    </section>
);

const Grade = ({ children }: { children: ReactNode }) => <div className="grid gap-4 md:grid-cols-2">{children}</div>;

/** Data e hora de agenda: calendário do DS e segmentos digitáveis (UI-FRM-001), pt-BR, 24 h. Valor em ISO local `AAAA-MM-DDTHH:mm`. */
const CampoDataHora = ({
    label,
    valor,
    onChange,
    erro,
    dica,
    isRequired,
    className,
}: {
    label: string;
    valor: string;
    onChange: (v: string) => void;
    erro?: string;
    dica?: string;
    isRequired?: boolean;
    className?: string;
}) => (
    <DateTimePicker
        label={label}
        granularity="minute"
        hourCycle={24}
        value={paraData(valor)}
        onChange={(v) => onChange(v ? v.toString().slice(0, 16) : "")}
        isRequired={isRequired}
        isInvalid={!!erro}
        hint={erro ?? dica}
        className={className}
    />
);

/** Soma horas a um ISO local `AAAA-MM-DDTHH:mm`. */
const somarHoras = (v: string, horas: number) => {
    const d = paraData(v);
    return d ? d.add({ hours: horas }).toString().slice(0, 16) : "";
};

/**
 * Local com a busca de endereço (API; no protótipo, simulada). Um campo só: o resultado já traz o
 * nome do local e a cidade (EVT-65). Busca com resultados dinâmicos (UI-FRM-004): a lista abre só
 * com resultados; "Buscando…" e "Nenhum local encontrado" ficam dentro do campo; escolher um local
 * leva a linha inteira para o campo ("Allianz Parque, São Paulo, SP"), sem nada no hint.
 */
const CampoLocal = ({ valor, onChange, erro }: { valor: LocalEncontrado | null; onChange: (v: LocalEncontrado | null) => void; erro?: string }) => {
    const { t } = useTextos();
    const textoDe = (l: LocalEncontrado) => formatar(t.localECidade, { local: l.nome, cidade: l.cidade });
    const [texto, setTexto] = useState(valor ? textoDe(valor) : "");
    const [resultados, setResultados] = useState<LocalEncontrado[]>(valor ? [valor] : []);
    const [buscando, setBuscando] = useState(false);
    const escolhido = valor && texto === textoDe(valor);

    useEffect(() => {
        if (escolhido) return;
        let ativo = true;
        if (texto.trim().length < 2) {
            setResultados([]);
            setBuscando(false);
            return;
        }
        setBuscando(true);
        const tempo = setTimeout(() => {
            buscarLocais(texto).then((r) => {
                if (!ativo) return;
                setResultados(r);
                setBuscando(false);
            });
        }, 200);
        return () => {
            ativo = false;
            clearTimeout(tempo);
        };
    }, [texto]);

    const vazio = !escolhido && texto.trim().length >= 2 && !buscando && resultados.length === 0;
    return (
        <ComboBox
            label="Local"
            isRequired
            placeholder="Busque pelo nome do local ou endereço"
            shortcut={false}
            // Com resultados vindos da API, o ComboBox abre quando a lista chega; sem resultado, não abre.
            allowsEmptyCollection
            // Quem filtra é a API: o ComboBox mostra os resultados como vieram.
            defaultFilter={() => true}
            inputValue={texto}
            onInputChange={(v) => {
                // Ao escolher, o ComboBox escreve o nome do item no campo: isso não desfaz a escolha (EVT-83).
                if (valor && (v === valor.nome || v === textoDe(valor))) return setTexto(textoDe(valor));
                setTexto(v);
                if (valor) onChange(null);
            }}
            selectedKey={valor?.id ?? null}
            onSelectionChange={(k) => {
                // `null` vem do próprio ComboBox quando a lista muda; limpar é só apagando o texto.
                if (k == null) return;
                const l = resultados.find((r) => r.id === k) ?? (valor?.id === k ? valor : null);
                if (!l) return;
                onChange(l);
                setTexto(textoDe(l));
            }}
            // O local escolhido continua na lista: tirar o item selecionado da coleção fazia o ComboBox apagar a escolha (EVT-83).
            items={(escolhido && valor ? [valor] : resultados).map((r) => ({ id: r.id, label: r.nome, supportingText: r.cidade }))}
            status={
                buscando ? (
                    <>
                        <span aria-hidden="true" className="size-4 animate-spin rounded-full border-2 border-secondary border-t-fg-brand-primary motion-reduce:animate-none" />
                        {t.buscando}
                    </>
                ) : vazio ? (
                    t.nenhumLocal
                ) : undefined
            }
            isInvalid={!!erro}
            hint={erro}
        >
            {(item) => (
                <Select.Item id={item.id} supportingText={item.supportingText} icon={item.icon}>
                    {item.label}
                </Select.Item>
            )}
        </ComboBox>
    );
};

interface CampoSelectProps {
    label: string;
    opcoes: Opcao[];
    valor: string;
    onChange: (v: string) => void;
    placeholder?: string;
    hint?: string;
    erro?: string;
    isRequired?: boolean;
    isDisabled?: boolean;
    ocultarLabel?: boolean;
    /** Campo opcional: mostra o × para voltar ao vazio (UI-FRM-003). */
    limpavel?: boolean;
    /** Ícone dentro do campo, à esquerda (o do Select do DS). */
    icone?: FC;
    className?: string;
}

const CampoSelect = ({ label, opcoes, valor, onChange, placeholder, hint, erro, isRequired, isDisabled, ocultarLabel, limpavel, icone, className }: CampoSelectProps) => {
    const { t } = useTextos();
    return (
    <div data-erro={erro ? "" : undefined} className={cx("relative", className)}>
        <Select
            label={ocultarLabel ? undefined : label}
            aria-label={ocultarLabel ? label : undefined}
            placeholder={placeholder}
            icon={icone}
            items={opcoes}
            selectedKey={valor || null}
            onSelectionChange={(k) => k != null && onChange(String(k))}
            isRequired={isRequired}
            isDisabled={isDisabled}
            isInvalid={!!erro}
            hint={erro ?? hint}
        >
            {(item) => (
                <Select.Item id={item.id} supportingText={item.supportingText} icon={item.icon}>
                    {item.label}
                </Select.Item>
            )}
        </Select>
        {/* × dentro do campo, antes da seta: aparece só com algo escolhido (UI-FRM-003). */}
        {limpavel && valor && !isDisabled && (
            <button
                type="button"
                aria-label={formatar(t.limparCampo, { campo: label })}
                onClick={() => onChange("")}
                className={cx(
                    "absolute right-9 flex size-7 items-center justify-center rounded-md text-fg-quaternary outline-focus-ring transition duration-100 ease-linear hover:bg-primary_hover hover:text-fg-quaternary_hover focus-visible:outline-2",
                    // Centro do gatilho (40 px): rótulo 20 px + 6 px de espaço + 6 px.
                    ocultarLabel ? "top-1.5" : "top-8",
                )}
            >
                <XClose className="size-4" />
            </button>
        )}
    </div>
    );
};

/** Escolha entre poucas opções (ButtonGroup do DS). */
const Escolha = ({ rotulo, valor, opcoes, onChange }: { rotulo: string; valor: string; opcoes: Opcao[]; onChange: (v: string) => void }) => (
    <ButtonGroup
        size="sm"
        aria-label={rotulo}
        selectedKeys={new Set([valor])}
        onSelectionChange={(keys) => {
            const v = [...keys][0];
            if (v) onChange(String(v));
        }}
        disallowEmptySelection
    >
        {opcoes.map((o) => (
            <ButtonGroupItem key={o.id} id={o.id}>
                {o.label}
            </ButtonGroupItem>
        ))}
    </ButtonGroup>
);

/**
 * Envio de imagem com pré-visualização, como o banner: a imagem inteira, sem corte, e embaixo o nome,
 * trocar e remover. Sem limite de tamanho (EVT-63).
 */
const CampoImagem = ({
    label,
    rotulo,
    hint,
    arquivo,
    onEscolher,
    onRemover,
}: {
    label?: string;
    /** Nome usado nos avisos quando não há label visível. */
    rotulo?: string;
    hint: string;
    arquivo: Imagem | null;
    onEscolher: (img: Imagem) => void;
    onRemover: () => void;
}) => {
    const { t } = useTextos();
    const nome = label ?? rotulo ?? "";
    const entrada = useRef<HTMLInputElement>(null);
    const escolher = async (file: File) => {
        onEscolher({ nome: file.name, url: URL.createObjectURL(file), dataUrl: await lerComoDataUrl(file) });
    };
    return (
        <div className="flex flex-col gap-1.5">
            {label && <span className="text-sm font-medium text-secondary">{label}</span>}
            <input
                ref={entrada}
                type="file"
                accept="image/png,image/jpeg"
                className="sr-only"
                tabIndex={-1}
                aria-hidden="true"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (file) void escolher(file);
                }}
            />
            <Surgir visivel={!!arquivo}>
                <div className="flex flex-col gap-3">
                    {/* A imagem inteira, sem corte: o mapa precisa mostrar todos os setores. */}
                    <div className="flex justify-center overflow-hidden rounded-2xl bg-primary_alt ring-1 ring-secondary ring-inset">
                        <img src={arquivo?.url} alt={nome ? `Pré-visualização: ${nome}` : ""} className="max-h-96 w-auto max-w-full object-contain" />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                        <span className="min-w-0 truncate text-sm text-tertiary">{arquivo?.nome}</span>
                        <div className="flex shrink-0 items-center gap-1">
                            <ButtonUtility icon={RefreshCw01} color="tertiary" size="sm" tooltip="Trocar imagem" onClick={() => entrada.current?.click()} />
                            <ButtonUtility icon={Trash01} color="tertiary" size="sm" tooltip={formatar(t.removerCampo, { campo: nome })} onClick={onRemover} />
                        </div>
                    </div>
                </div>
            </Surgir>
            <Surgir visivel={!arquivo}>
                <FileUploadDropZone
                    // "ou arraste o arquivo" alinhado ao meio do botão de 44 px.
                    className="[&_label+span]:self-center"
                    accept="image/png,image/jpeg"
                    allowsMultiple={false}
                    hint={hint}
                    onDropFiles={(files) => {
                        const file = files[0];
                        if (file) void escolher(file);
                    }}
                />
            </Surgir>
        </div>
    );
};
