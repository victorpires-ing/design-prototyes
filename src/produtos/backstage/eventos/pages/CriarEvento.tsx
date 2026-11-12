import { useEffect, useMemo, useState, type FC, type ReactNode } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { parseDateTime } from "@internationalized/date";
import { AnimatePresence, motion } from "motion/react";
import { AlignLeft, ArrowLeft, Calendar, MarkerPin01, Plus, Shield01, Trash01, Trophy01, UserCheck01, XClose } from "@untitledui/icons";
import { FileUploadDropZone } from "@/components/application/file-upload/file-upload-base";
import { DateTimePicker } from "@/components/application/date-picker/date-time-picker";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
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
    nome: "",
    nomeEditado: false,
    local: null,
    inicio: "",
    fim: "",
    fimSugerido: false,
    sessoesExtras: [],
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

/** Imagens são gravadas no banco como data URL: acima disso o envio é recusado (EVT-63). */
const MAX_IMAGEM = 400 * 1024;

const lerComoDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result));
        r.onerror = reject;
        r.readAsDataURL(file);
    });

type Erros = Partial<Record<"mandante" | "visitante" | "modalidade" | "nome" | "local" | "inicio" | "fim" | "descricao" | "sessoes" | "mapa", string>>;

/** Índices das sessões extras com problema (vazia ou fora do período). */
const sessoesInvalidas = (f: Formulario) =>
    new Set(f.sessoesExtras.flatMap(({ valor: s }, i) => (!s || (f.inicio && s < f.inicio) || (f.fim && s > f.fim) ? [i] : [])));

function validar(f: Formulario): Erros {
    const e: Erros = {};
    if (f.tipo === "futebol") {
        if (!f.mandanteId) e.mandante = "Escolha o time mandante.";
        if (!f.visitanteId) e.visitante = "Escolha o time visitante.";
        else if (f.visitanteId === f.mandanteId) e.visitante = "Escolha outro time: o visitante não pode ser o mandante.";
    }
    if (f.tipo === "esportivo" && !f.modalidade) e.modalidade = "Escolha a modalidade.";
    if (!f.nome.trim()) e.nome = "Dê um nome ao evento.";
    if (!f.local) e.local = "Busque e escolha o local do evento.";
    if (!paragrafosDoHtml(f.descricao).length) e.descricao = "Conte o que vai acontecer no evento.";
    if (!f.inicio) e.inicio = "Escolha os dias do evento.";
    if (!f.fim) e.fim = "Informe quando o evento termina.";
    else if (f.inicio && f.fim <= f.inicio) e.fim = "Escolha um fim depois do início.";
    const ruins = sessoesInvalidas(f);
    if (ruins.size > 0) {
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
    const ORDEM: (keyof Erros)[] = ["nome", "mandante", "visitante", "modalidade", "inicio", "fim", "local", "descricao", "sessoes", "mapa"];
    const campoPendente = ORDEM.find((k) => pendencias[k]);
    const proximaPendencia = campoPendente ? { campo: campoPendente, texto: pendencias[campoPendente]! } : null;
    const irParaCampo = (campo: keyof Erros) => {
        const alvo: Partial<Record<keyof Erros, string>> = { nome: "nome-do-evento", inicio: "campo-quando", fim: "campo-quando", local: "campo-local", descricao: "campo-sobre", sessoes: "campo-quando" };
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
            toast.error("Revise os campos destacados para criar o evento.");
            requestAnimationFrame(() => document.querySelector<HTMLElement>("[data-erro]")?.scrollIntoView({ behavior: "smooth", block: "center" }));
            return;
        }
        const novo = criarEvento({
            nome: f.nome.trim(),
            data: new Date(f.inicio).toISOString(),
            // Com sessões criadas, elas são as sessões do evento (o fim de cada uma ainda não é gravado); sem nenhuma, uma só, no início (EVT-89).
            sessoes: (temCronograma(f.inicio, f.fim) && f.sessoesExtras.length ? [...f.sessoesExtras].sort((a, b) => a.valor.localeCompare(b.valor)).map((s) => s.valor) : [f.inicio]).map((v) => new Date(v).toISOString()),
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
                fim: f.fim,
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

                {/* A página do evento, editável no lugar: banner à esquerda, informações à direita, descrição abaixo (EVT-85). */}
                <article aria-label="Página do evento" className="grid items-start gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-10">
                    {bannerNaColuna && (
                        <div className="lg:sticky lg:top-6">
                            <CampoBanner {...propsDoBanner} />
                        </div>
                    )}

                    <div className="flex min-w-0 flex-col gap-8">
                        {/* Nome como título da página: escreve-se onde ele vai aparecer. */}
                        <div className="flex flex-col gap-1.5" data-erro={erros.nome ? "" : undefined}>
                            <label htmlFor="nome-do-evento" className="sr-only">
                                Nome do evento
                            </label>
                            <textarea
                                id="nome-do-evento"
                                // Ao abrir a tela, o cursor já está no nome (EVT-87).
                                autoFocus
                                rows={1}
                                required
                                value={f.nome}
                                onChange={(e) => {
                                    const v = e.target.value.replace(/\n/g, " ");
                                    setF((a) => ({ ...a, nome: v, nomeEditado: v.length > 0 }));
                                }}
                                onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
                                placeholder={f.tipo === "futebol" ? "Mandante x Visitante" : f.tipo === "esportivo" ? "Ex.: Corrida Noturna 10K" : "Nome do evento"}
                                aria-invalid={!!erros.nome}
                                aria-describedby={erros.nome || (f.tipo === "futebol" && !f.nomeEditado) ? "nome-do-evento-dica" : undefined}
                                className={cx(
                                    "-mx-3 field-sizing-content resize-none rounded-lg bg-transparent px-3 py-1 text-display-sm font-semibold text-primary transition duration-100 ease-linear placeholder:text-placeholder",
                                    "hover:bg-primary_hover focus:bg-primary focus:ring-2 focus:ring-brand focus:outline-hidden",
                                    erros.nome && "ring-2 ring-error_subtle",
                                )}
                            />
                            {(erros.nome || (f.tipo === "futebol" && !f.nomeEditado)) && (
                                <p id="nome-do-evento-dica" className={cx("text-sm", erros.nome ? "text-error-primary" : "text-tertiary")}>
                                    {erros.nome ?? "Preenchido com os times; dá para editar."}
                                </p>
                            )}
                        </div>

                        {/* Futebol: a partida vem depois do nome, uma linha por campo com o ícone ao lado; mandante e visitante lado a lado. */}
                        {f.tipo === "futebol" && (
                            <>
                                <div className="flex gap-4">
                                    <FeaturedIcon icon={Shield01} color="gray" theme="modern" size="md" className="mt-7 shrink-0" />
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
                                    <FeaturedIcon icon={Trophy01} color="gray" theme="modern" size="md" className="mt-7 shrink-0" />
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
                                    <FeaturedIcon icon={UserCheck01} color="gray" theme="modern" size="md" className="mt-7 shrink-0" />
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

                        {/* Esportivo: modalidade logo depois do nome, como as outras linhas (ícone ao lado). */}
                        {f.tipo === "esportivo" && (
                            <div className="flex gap-4">
                                <FeaturedIcon icon={Trophy01} color="gray" theme="modern" size="md" className="mt-7 shrink-0" />
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

                        {/* Quando e onde, como na página: ícone e informação. */}
                        <dl className="flex flex-col gap-5">
                            <LinhaDaPagina icone={Calendar} titulo="Quando">
                                {/* Dias como passagem de ida e volta, depois os horários (EVT-88). */}
                                <div id="campo-quando" data-erro={erros.inicio || erros.fim ? "" : undefined}>
                                    <PeriodoDoEvento
                                        inicio={f.inicio}
                                        fim={f.fim}
                                        onChange={(inicio, fim) =>
                                            // Sessões fora do novo período saem junto.
                                            setF((a) => ({ ...a, inicio, fim, fimSugerido: false, sessoesExtras: a.sessoesExtras.filter((x) => x.valor.slice(0, 10) >= inicio.slice(0, 10) && x.valor.slice(0, 10) <= fim.slice(0, 10)) }))
                                        }
                                        erroInicio={erros.inicio}
                                        erroFim={erros.fim}
                                    />
                                </div>
                            </LinhaDaPagina>
                            <LinhaDaPagina icone={MarkerPin01} titulo="Onde">
                                <div id="campo-local" data-erro={erros.local ? "" : undefined}>
                                    <CampoLocal valor={f.local} onChange={(v) => set("local", v)} erro={erros.local} />
                                </div>
                            </LinhaDaPagina>
                        </dl>

                        {/* Abaixo do desktop, o banner fica aqui no formato horizontal de antes (EVT-80). */}
                        {!bannerNaColuna && <CampoBannerCompacto {...propsDoBanner} />}

                        {/* Sobre o evento como as outras linhas: ícone ao lado, rótulo do mesmo tamanho e a formatação dentro da caixa (EVT-86). */}
                        <div id="campo-sobre" className="flex gap-4" data-erro={erros.descricao ? "" : undefined}>
                            <FeaturedIcon icon={AlignLeft} color="gray" theme="modern" size="md" className="mt-7 shrink-0" />
                            <TextEditor.Root
                                content={f.descricao}
                                onUpdate={({ editor }) => {
                                    const html = editor.getHTML();
                                    set("descricao", html === "<p></p>" ? "" : html);
                                }}
                                placeholder="Conte o que vai acontecer, a programação e o que está incluso."
                                className="flex min-w-0 flex-1 flex-col gap-1.5"
                                inputClassName="min-h-40 resize-y rounded-none rounded-b-lg bg-transparent px-3.5 pt-2 pb-3 shadow-none ring-0 focus:ring-0"
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
                </article>

                {/* O que não aparece na página, mas define como o evento vende (EVT-85). */}
                <section aria-labelledby="detalhes-do-evento" className="flex flex-col gap-6 border-t border-secondary pt-8 pb-6">
                    <div className="flex flex-col gap-1">
                        <h2 id="detalhes-do-evento" className="text-lg font-semibold text-primary">
                            Detalhes do evento
                        </h2>
                        <p className="max-w-[65ch] text-md text-tertiary">Não aparecem na página do evento, mas definem como ele vende.</p>
                    </div>

                    {/* Empilhados, um embaixo do outro. */}
                    <div className="flex flex-col gap-6">
                        {/* Só com o evento em mais de um dia (EVT-88): um cartão por dia, horário embaixo da data (EVT-89). */}
                        {temCronograma(f.inicio, f.fim) && (
                            <Secao
                                titulo={voc.cronograma}
                                descricao={`Opcional. Cada ${itemDoCronograma} tem dia, horário de início e de fim; um dia pode ter mais de uma. Sem nenhuma, o evento tem uma ${itemDoCronograma} só, no início.`}
                            >
                                <div data-erro={erros.sessoes ? "" : undefined} className="flex flex-col gap-3">
                                    <CronogramaDeSessoes
                                        inicio={f.inicio}
                                        fim={f.fim}
                                        sessoes={f.sessoesExtras}
                                        onChange={(sessoesExtras) => set("sessoesExtras", sessoesExtras)}
                                        item={itemDoCronograma}
                                    />
                                    {erros.sessoes && <p className="text-sm text-error-primary">{erros.sessoes}</p>}
                                </div>
                            </Secao>
                        )}

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
                                            hint="PNG ou JPG até 400 KB, com setores e acessos."
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

                {/* Mesmo fundo da página (UI-VIS-013); a borda separa do conteúdo que rola por baixo. */}
                <footer className="sticky bottom-0 z-20 mt-auto border-t border-secondary bg-primary_alt">
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
    </div>
);

/** Linha de informação da página do evento: ícone, título curto e o campo que edita a informação. */
/* O título fica só para leitor de tela: o rótulo do campo já diz o que é, e o ícone desce até a altura do campo (abaixo do rótulo). */
const LinhaDaPagina = ({ icone, titulo, children }: { icone: FC<{ className?: string }>; titulo: string; children: ReactNode }) => (
    <div className="flex gap-4">
        <FeaturedIcon icon={icone} color="gray" theme="modern" size="md" className="mt-7 shrink-0" />
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
    className?: string;
}

const CampoSelect = ({ label, opcoes, valor, onChange, placeholder, hint, erro, isRequired, isDisabled, ocultarLabel, limpavel, className }: CampoSelectProps) => {
    const { t } = useTextos();
    return (
    <div data-erro={erro ? "" : undefined} className={cx("relative", className)}>
        <Select
            label={ocultarLabel ? undefined : label}
            aria-label={ocultarLabel ? label : undefined}
            placeholder={placeholder}
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

/** Envio de imagem com prévia. Recusa acima de MAX_IMAGEM, com o motivo (EVT-63). */
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
    const escolher = async (file: File) => {
        if (file.size > MAX_IMAGEM) {
            toast.error(formatar(t.imagemGrande, { maximo: Math.round(MAX_IMAGEM / 1024), campo: nome, tamanho: Math.round(file.size / 1024) }));
            return;
        }
        onEscolher({ nome: file.name, url: URL.createObjectURL(file), dataUrl: await lerComoDataUrl(file) });
    };
    return (
        <div className="flex flex-col gap-1.5">
            {label && <span className="text-sm font-medium text-secondary">{label}</span>}
            <Surgir visivel={!!arquivo}>
                <div className="flex items-center gap-3 rounded-xl p-3 ring-1 ring-secondary">
                    <img src={arquivo?.url} alt="" className="size-16 shrink-0 rounded-lg object-cover" />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-primary">{arquivo?.nome}</span>
                    <ButtonUtility icon={Trash01} color="tertiary" tooltip={formatar(t.removerCampo, { campo: nome })} onClick={onRemover} className="size-11" />
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
