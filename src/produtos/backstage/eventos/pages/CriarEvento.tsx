import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { parseDateTime } from "@internationalized/date";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, Plus, Trash01, XClose } from "@untitledui/icons";
import { AccordionComponent as Accordion } from "@/components/application/accordion/accordion";
import { FileUploadDropZone } from "@/components/application/file-upload/file-upload-base";
import { DateTimePicker } from "@/components/application/date-picker/date-time-picker";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { ButtonGroup, ButtonGroupItem } from "@/components/base/button-group/button-group";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Input } from "@/components/base/input/input";
import { ComboBox } from "@/components/base/select/combobox";
import { Select } from "@/components/base/select/select";
import { TextArea } from "@/components/base/textarea/textarea";
import { Toggle } from "@/components/base/toggle/toggle";
import { Surgir, useTransicao } from "@/components/foundations/transicao";
import type { CategoriaLimite, ConfiguracoesAvancadas, Modalidade, TipoEvento } from "@/plataforma";
import { cx } from "@/utils/cx";
import { BackstageLayout } from "../../components/Backstage";
import { useOrganizacaoAtual } from "../../organizacoes/data/organizacao-atual";
import { criarEvento } from "../data/eventos";
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

const IDADES: Opcao[] = [
    { id: "0", label: "Livre" },
    { id: "10", label: "10 anos" },
    { id: "12", label: "12 anos" },
    { id: "14", label: "14 anos" },
    { id: "16", label: "16 anos" },
    { id: "18", label: "18 anos" },
];

const CATEGORIAS: { id: CategoriaLimite; label: string; esportivo?: string }[] = [
    { id: "inteira", label: "Inteira" },
    { id: "meia-entrada", label: "Meia-entrada" },
    { id: "gratuidade", label: "Gratuidade" },
    { id: "convidado", label: "Convidado" },
    { id: "socio-torcedor", label: "Sócio torcedor" },
    { id: "ingresso", label: "Ingresso", esportivo: "Inscrição" },
    { id: "combo", label: "Combo" },
    { id: "produto", label: "Produto" },
];

const AVANCADO_PADRAO: ConfiguracoesAvancadas = {
    comprasEntreGrupos: true,
    estoqueDevolvido: "lote-origem",
    trocaDeSetor: false,
    reservaNaCompra: false,
    limiteBilheteriaOnline: "sem-limite",
    politicaId: "politica-padrao",
    acessoFacialId: "nenhum",
    qrCodeNoEmail: true,
};

/** `null` = ilimitado; `0` = limitado, quantidade ainda não informada. */
type Limite = number | null;

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
    sessoesExtras: { id: number; valor: string }[];
    moeda: string;
    idadeMinima: string;
    limiteGeral: Limite;
    limites: Partial<Record<CategoriaLimite, Limite>>;
    descricao: string;
    banner: Imagem | null;
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
    limiteGeral: null,
    limites: {},
    descricao: "",
    banner: null,
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

type Erros = Partial<Record<"mandante" | "visitante" | "modalidade" | "nome" | "local" | "inicio" | "fim" | "sessoes" | "limites" | "mapa", string>>;

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
    if (!f.inicio) e.inicio = "Informe quando o evento começa.";
    if (!f.fim) e.fim = "Informe quando o evento termina.";
    else if (f.inicio && f.fim <= f.inicio) e.fim = "Escolha um fim depois do início.";
    const ruins = sessoesInvalidas(f);
    if (ruins.size > 0) {
        e.sessoes = f.sessoesExtras.some((s) => !s.valor)
            ? "Preencha a data das sessões destacadas ou remova as vazias."
            : "Mova as sessões destacadas para dentro do período do evento.";
    }
    if (f.limiteGeral === 0 || Object.values(f.limites).some((v) => v === 0)) e.limites = "Informe a quantidade máxima ou volte para Ilimitado.";
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
    const set = <K extends keyof Formulario>(k: K, v: Formulario[K]) => setF((atual) => ({ ...atual, [k]: v }));
    const setAvancado = <K extends keyof ConfiguracoesAvancadas>(k: K, v: ConfiguracoesAvancadas[K]) => setF((a) => ({ ...a, avancado: { ...a.avancado, [k]: v } }));

    const { t, locale } = useTextos();
    // Vocabulário por tipo (Ingresse Sports: "largada" e "participante"; ver domain-context).
    const voc = vocabularioDe(t, f.tipo);
    const erros = useMemo(() => (tentou ? validar(f) : {}), [f, tentou]);
    const ruins = useMemo(() => (tentou ? sessoesInvalidas(f) : new Set<number>()), [f, tentou]);
    const times = opcoes.dados?.times ?? [];
    const nomeDoTime = (id: string) => times.find((t) => t.id === id)?.label;
    const preenchido = JSON.stringify(f) !== JSON.stringify(inicial);
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

    const criar = () => {
        setTentou(true);
        const e = validar(f);
        if (Object.keys(e).length > 0) {
            toast.error("Revise os campos destacados para criar o evento.");
            requestAnimationFrame(() => document.querySelector<HTMLElement>("[data-erro]")?.scrollIntoView({ behavior: "smooth", block: "center" }));
            return;
        }
        criarEvento({
            nome: f.nome.trim(),
            data: new Date(f.inicio).toISOString(),
            sessoes: [f.inicio, ...f.sessoesExtras.map((s) => s.valor)].map((s) => new Date(s).toISOString()),
            local: f.local!.nome,
            cidade: f.local!.cidade,
            produtor: organizacao?.nome ?? "",
            descricao: f.descricao.trim() || undefined,
            capa: f.banner?.dataUrl,
            extras: {
                tipo: f.tipo,
                modalidade: f.tipo === "esportivo" ? (f.modalidade as Modalidade) : undefined,
                fim: f.fim,
                moeda: f.moeda,
                limites: { geral: f.limiteGeral, porCategoria: f.limites },
                idadeMinima: Number(f.idadeMinima),
                mapa: f.mapaTipo === "assentos" ? { tipo: "assentos", mapaId: f.mapaId } : { tipo: "imagem", url: f.mapaImagem?.dataUrl },
                partida:
                    f.tipo === "futebol"
                        ? { campeonatoId: f.campeonatoId || undefined, mandanteId: f.mandanteId, visitanteId: f.visitanteId, programaMembrosId: f.programaMembrosId || undefined }
                        : undefined,
                avancado: f.avancado,
            },
        });
        toast.success(f.tipo === "esportivo" ? "Evento criado como rascunho. Agora crie as inscrições em Ingressos." : "Evento criado como rascunho. Agora crie os ingressos.");
        navigate("/backstage/catalogo/ingressos");
    };

    const carregando = opcoes.status === "carregando";
    const listaVazia = carregando ? "Carregando…" : "Selecione";

    return (
        <BackstageLayout activeProducer="eventos" showEventContext={false}>
            <div className="flex min-w-0 flex-1 flex-col gap-6">
                {/* Cabeçalho da página: peça padrão, fora do limite do formulário (UI-VIS-009). */}
                <header className="flex flex-col gap-4">
                    <div className="flex min-w-0 flex-col gap-4">
                        <Button color="tertiary" size="md" iconLeading={ArrowLeft} onClick={sair} className="-ml-3 self-start">
                            Eventos
                        </Button>
                        <div className="flex flex-col gap-3">
                            <h1 className={TITULO_PAGINA}>{titulo}</h1>
                            <p className="max-w-[60ch] text-md text-tertiary">
                                {organizacao ? formatar(t.subtituloComOrganizacao, { organizacao: organizacao.nome }) : t.subtituloSemOrganizacao}
                            </p>
                        </div>
                    </div>
                </header>
                {/* Formulário centralizado, até 732 px, com a barra de ações (UI-VIS-009). */}
                <div className="mx-auto flex w-full max-w-[732px] min-w-0 flex-1 flex-col">
                <div className="flex w-full flex-col gap-6 px-1 pb-6 md:px-0">

                    <Surgir visivel={opcoes.status === "erro"} gap={24}>
                        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-error-primary px-4 py-3 ring-1 ring-error_subtle">
                            <p className="text-sm text-error-primary">Tente de novo: não foi possível carregar as listas (times, moedas, políticas).</p>
                            <Button size="sm" color="secondary" onClick={opcoes.recarregar}>
                                Tentar de novo
                            </Button>
                        </div>
                    </Surgir>

                    <>
                            {f.tipo === "futebol" && (
                                <Secao titulo="Partida">
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
                                    </Grade>
                                </Secao>
                            )}

                            <Secao titulo="Informações">
                                <Grade>
                                    {f.tipo === "esportivo" && (
                                        <CampoSelect
                                            label="Modalidade"
                                            isRequired
                                            opcoes={MODALIDADES}
                                            valor={f.modalidade}
                                            onChange={(v) => set("modalidade", v as Modalidade)}
                                            placeholder="Selecione"
                                            erro={erros.modalidade}
                                        />
                                    )}
                                    <div className={f.tipo === "esportivo" ? "" : "md:col-span-2"} data-erro={erros.nome ? "" : undefined}>
                                        <Input
                                            label="Nome do evento"
                                            isRequired
                                            placeholder={f.tipo === "futebol" ? "Escolha os times ou digite" : f.tipo === "esportivo" ? "Ex.: Corrida Noturna 10K" : "Ex.: Réveillon Carneiros 2027"}
                                            value={f.nome}
                                            onChange={(v) => setF((a) => ({ ...a, nome: v, nomeEditado: v.length > 0 }))}
                                            isInvalid={!!erros.nome}
                                            hint={erros.nome ?? (f.tipo === "futebol" && !f.nomeEditado ? "Preenchido com os times; dá para editar." : undefined)}
                                        />
                                    </div>
                                    <div className="md:col-span-2" data-erro={erros.local ? "" : undefined}>
                                        <CampoLocal valor={f.local} onChange={(v) => set("local", v)} erro={erros.local} />
                                    </div>
                                </Grade>
                            </Secao>

                            <Secao titulo="Datas">
                                <Grade>
                                    <div data-erro={erros.inicio ? "" : undefined}>
                                        <CampoDataHora
                                            label="Data e hora inicial"
                                            isRequired
                                            valor={f.inicio}
                                            onChange={(v) =>
                                                // Fim vazio ou ainda sugerido acompanha o início (+4 h); editado, fica como a pessoa deixou.
                                                setF((a) => (!a.fim || a.fimSugerido ? { ...a, inicio: v, fim: somarHoras(v, 4), fimSugerido: !!v } : { ...a, inicio: v }))
                                            }
                                            erro={erros.inicio}
                                        />
                                    </div>
                                    <div data-erro={erros.fim ? "" : undefined}>
                                        <CampoDataHora
                                            label="Data e hora final"
                                            isRequired
                                            valor={f.fim}
                                            onChange={(v) => setF((a) => ({ ...a, fim: v, fimSugerido: false }))}
                                            erro={erros.fim}
                                            dica={f.fimSugerido ? "Sugerida 4 h depois do início. Ajuste se precisar." : undefined}
                                        />
                                    </div>
                                </Grade>
                                <div className="flex flex-col gap-3 border-t border-secondary pt-5">
                                    <div className="flex flex-col gap-0.5">
                                        <h3 className="text-sm font-semibold text-primary">{voc.cronograma}</h3>
                                        <p className="max-w-[65ch] text-sm text-tertiary">
                                            {voc.explicacao}
                                        </p>
                                    </div>
                                    {/* Sem gap: cada sessão extra traz o próprio espaço, que entra e sai junto com ela. */}
                                    <ol className="flex flex-col [&>li+li]:mt-2">
                                        <li className="flex items-center gap-3 rounded-lg bg-secondary px-3 py-2.5 text-sm">
                                            <span className="w-20 shrink-0 font-medium text-secondary">{formatar(voc.itemN, { n: 1 })}</span>
                                            <span className="text-tertiary">{f.inicio ? formatarDataHora(f.inicio, locale) : t.semDataInicial}</span>
                                        </li>
                                        <AnimatePresence initial={false}>
                                            {f.sessoesExtras.map((s, i) => (
                                                <motion.li
                                                    key={s.id}
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={transicao}
                                                    className="overflow-hidden"
                                                    data-erro={ruins.has(i) ? "" : undefined}
                                                >
                                                    <div className="flex items-start gap-3 pt-0.5">
                                                        <CampoDataHora
                                                            label={formatar(voc.itemN, { n: i + 2 })}
                                                            valor={s.valor}
                                                            onChange={(v) => set("sessoesExtras", f.sessoesExtras.map((x) => (x.id === s.id ? { ...x, valor: v } : x)))}
                                                            erro={ruins.has(i) ? erros.sessoes : undefined}
                                                            className="flex-1"
                                                        />
                                                        <ButtonUtility
                                                            icon={Trash01}
                                                            color="tertiary"
                                                            tooltip={formatar(voc.removerN, { n: i + 2 })}
                                                            onClick={() => set("sessoesExtras", f.sessoesExtras.filter((x) => x.id !== s.id))}
                                                            className="mt-6 size-11"
                                                        />
                                                    </div>
                                                </motion.li>
                                            ))}
                                        </AnimatePresence>
                                    </ol>
                                    <Button color="secondary" size="sm" iconLeading={Plus} onClick={() => set("sessoesExtras", [...f.sessoesExtras, { id: Date.now(), valor: "" }])} className="self-start">
                                        {voc.adicionar}
                                    </Button>
                                </div>
                            </Secao>

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
                                <div className="flex flex-col gap-4 border-t border-secondary pt-5" data-erro={erros.limites ? "" : undefined}>
                                    <CampoLimite titulo={voc.limiteGeral} valor={f.limiteGeral} onChange={(v) => set("limiteGeral", v)} invalido={!!erros.limites && f.limiteGeral === 0} />
                                    <Accordion>
                                        <Accordion.Item value="categorias" trigger={<span className="text-sm font-semibold text-primary">Limites por categoria</span>}>
                                            <div className="flex flex-col divide-y divide-secondary">
                                                {CATEGORIAS.map((c) => (
                                                    <div key={c.id} className="py-3 first:pt-0 last:pb-0">
                                                        <CampoLimite
                                                            titulo={f.tipo === "esportivo" && c.esportivo ? c.esportivo : c.label}
                                                            valor={f.limites[c.id] ?? null}
                                                            onChange={(v) => set("limites", { ...f.limites, [c.id]: v })}
                                                            invalido={!!erros.limites && f.limites[c.id] === 0}
                                                            compacto
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </Accordion.Item>
                                    </Accordion>
                                    <Surgir visivel={!!erros.limites} gap={16}>
                                        <p className="text-sm text-error-primary">{erros.limites}</p>
                                    </Surgir>
                                </div>
                            </Secao>

                            <Secao titulo="Divulgação">
                                <TextArea
                                    label="Descrição"
                                    placeholder="Conte o que vai acontecer, a programação e o que está incluso."
                                    rows={5}
                                    value={f.descricao}
                                    onChange={(v) => set("descricao", v)}
                                />
                                <CampoImagem label="Banner" hint="PNG ou JPG até 400 KB, de preferência 1080 × 1350 px." arquivo={f.banner} onEscolher={(img) => set("banner", img)} onRemover={() => set("banner", null)} />
                                <div className="flex flex-col gap-3" data-erro={erros.mapa ? "" : undefined}>
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <span className="text-sm font-medium text-secondary">Mapa</span>
                                        <Escolha
                                            rotulo="Origem do mapa"
                                            valor={f.mapaTipo}
                                            opcoes={[
                                                { id: "imagem", label: "Enviar imagem" },
                                                { id: "assentos", label: "Mapa de assentos" },
                                            ]}
                                            onChange={(v) => set("mapaTipo", v as Formulario["mapaTipo"])}
                                        />
                                    </div>
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

                            <Accordion>
                                <Accordion.Item
                                    value="avancado"
                                    className="rounded-2xl bg-primary"
                                    trigger={
                                        <span className="flex flex-col gap-0.5 py-1">
                                            <span className="text-lg font-semibold text-primary">Configurações avançadas</span>
                                            <span className="text-sm text-tertiary">Já vêm preenchidas. Mude só se precisar.</span>
                                        </span>
                                    }
                                >
                                    <div className="flex flex-col divide-y divide-secondary">
                                        <LinhaAvancada titulo="Compras em diferentes grupos de ingressos">
                                            <Escolha
                                                rotulo="Compras em diferentes grupos de ingressos"
                                                valor={f.avancado.comprasEntreGrupos ? "sim" : "nao"}
                                                opcoes={[
                                                    { id: "sim", label: "Permitir" },
                                                    { id: "nao", label: "Proibir" },
                                                ]}
                                                onChange={(v) => setAvancado("comprasEntreGrupos", v === "sim")}
                                            />
                                        </LinhaAvancada>
                                        <LinhaAvancada
                                            titulo="Estoque devolvido de lotes esgotados"
                                            descricao="Quando um pedido não pago libera estoque de um lote já esgotado. Realocar soma a quantidade ao lote ativo, vendida pelo preço atual; o lote de origem continua esgotado."
                                        >
                                            <Escolha
                                                rotulo="Estoque devolvido de lotes esgotados"
                                                valor={f.avancado.estoqueDevolvido}
                                                opcoes={[
                                                    { id: "lote-origem", label: "Manter no lote de origem" },
                                                    { id: "lote-ativo", label: "Realocar para o lote ativo" },
                                                ]}
                                                onChange={(v) => setAvancado("estoqueDevolvido", v as ConfiguracoesAvancadas["estoqueDevolvido"])}
                                            />
                                        </LinhaAvancada>
                                        <LinhaAvancada titulo="Permitir troca de setor">
                                            <Toggle aria-label="Permitir troca de setor" isSelected={f.avancado.trocaDeSetor} onChange={(v) => setAvancado("trocaDeSetor", v)} />
                                        </LinhaAvancada>
                                        <LinhaAvancada titulo="Reserva de ingressos na compra">
                                            <Toggle aria-label="Reserva de ingressos na compra" isSelected={f.avancado.reservaNaCompra} onChange={(v) => setAvancado("reservaNaCompra", v)} />
                                        </LinhaAvancada>
                                        <LinhaAvancada titulo="Limite por comprador na Bilheteria online">
                                            <Escolha
                                                rotulo="Limite por comprador na Bilheteria online"
                                                valor={f.avancado.limiteBilheteriaOnline}
                                                opcoes={[
                                                    { id: "sem-limite", label: "Sem limite" },
                                                    { id: "aplicar", label: "Aplicar limites" },
                                                ]}
                                                onChange={(v) => setAvancado("limiteBilheteriaOnline", v as ConfiguracoesAvancadas["limiteBilheteriaOnline"])}
                                            />
                                        </LinhaAvancada>
                                        <LinhaAvancada titulo="Políticas">
                                            <CampoSelect
                                                label="Políticas"
                                                ocultarLabel
                                                opcoes={opcoes.dados?.politicas ?? []}
                                                valor={f.avancado.politicaId ?? ""}
                                                onChange={(v) => setAvancado("politicaId", v)}
                                                placeholder={listaVazia}
                                                isDisabled={carregando}
                                                className="w-full md:w-72"
                                            />
                                        </LinhaAvancada>
                                        <LinhaAvancada titulo="Acesso por face" descricao="Serviço de gestão facial.">
                                            <CampoSelect
                                                label="Acesso por face"
                                                ocultarLabel
                                                opcoes={opcoes.dados?.acessoFacial ?? []}
                                                valor={f.avancado.acessoFacialId ?? ""}
                                                onChange={(v) => setAvancado("acessoFacialId", v)}
                                                placeholder={listaVazia}
                                                isDisabled={carregando}
                                                className="w-full md:w-72"
                                            />
                                        </LinhaAvancada>
                                        <LinhaAvancada titulo="QR code no e-mail de confirmação">
                                            <Escolha
                                                rotulo="QR code no e-mail de confirmação"
                                                valor={f.avancado.qrCodeNoEmail ? "sim" : "nao"}
                                                opcoes={[
                                                    { id: "sim", label: "Incluir" },
                                                    { id: "nao", label: "Não incluir" },
                                                ]}
                                                onChange={(v) => setAvancado("qrCodeNoEmail", v === "sim")}
                                            />
                                        </LinhaAvancada>
                                    </div>
                                </Accordion.Item>
                            </Accordion>
                    </>
                </div>

                </div>
                {/* Presa ao fim da coluna de conteúdo, fora do limite de 732 px do formulário (UI-VIS-009): ocupa a largura da página, sem cobrir o rail nem o Remix. */}
                {/* Mesmo fundo da página (UI-VIS-013); a borda separa do conteúdo que rola por baixo. */}
                <footer className="sticky bottom-0 z-20 mt-auto border-t border-secondary bg-primary_alt">
                    <div className="flex items-center justify-end gap-3 py-3">
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
                setTexto(v);
                if (valor && v !== textoDe(valor)) onChange(null);
            }}
            selectedKey={valor?.id ?? null}
            onSelectionChange={(k) => {
                const l = resultados.find((r) => r.id === k) ?? null;
                onChange(l);
                if (l) setTexto(textoDe(l));
            }}
            items={escolhido ? [] : resultados.map((r) => ({ id: r.id, label: r.nome, supportingText: r.cidade }))}
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
                <Select.Item id={item.id} supportingText={item.supportingText}>
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
                <Select.Item id={item.id} supportingText={item.supportingText}>
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

/** Limite com "Ilimitado" ligado por padrão. Desligar pede a quantidade, sem valor sugerido (EVT-57). */
const CampoLimite = ({ titulo, valor, onChange, invalido, compacto }: { titulo: string; valor: Limite; onChange: (v: Limite) => void; invalido?: boolean; compacto?: boolean }) => {
    const ilimitado = valor === null;
    const transicao = useTransicao();
    const { t } = useTextos();
    return (
        <div className={cx("flex flex-col gap-3 md:flex-row md:items-center md:justify-between", compacto && "md:gap-6")}>
            <span className={cx("text-sm", compacto ? "font-medium text-secondary" : "font-semibold text-primary")}>{titulo}</span>
            <div className="flex items-center gap-4">
                <Toggle label="Ilimitado" isSelected={ilimitado} onChange={(v) => onChange(v ? null : 0)} />
                {/* Espaço reservado: o campo aparece sem empurrar o toggle (UI-VIS-008). */}
                <div className="w-24">
                    <AnimatePresence initial={false}>
                        {!ilimitado && (
                            <motion.div key="qtd" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} transition={transicao}>
                    <Input
                        aria-label={formatar(t.quantidadeMaxima, { limite: titulo })}
                        type="number"
                        inputMode="numeric"
                        placeholder="Qtd."
                        value={valor ? String(valor) : ""}
                        onChange={(v) => onChange(Math.max(0, Math.floor(Number(v) || 0)))}
                        isInvalid={invalido}
                        className="w-24"
                    />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

const LinhaAvancada = ({ titulo, descricao, children }: { titulo: string; descricao?: string; children: ReactNode }) => (
    <div className="flex flex-col gap-3 py-4 first:pt-1 last:pb-1 md:flex-row md:items-center md:justify-between md:gap-8">
        <div className="flex min-w-0 flex-col gap-0.5 md:max-w-md">
            <span className="text-sm font-semibold text-primary">{titulo}</span>
            {descricao && <span className="text-sm text-tertiary">{descricao}</span>}
        </div>
        <div className="shrink-0">{children}</div>
    </div>
);

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
