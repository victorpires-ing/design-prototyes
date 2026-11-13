import { useSyncExternalStore } from "react";
import eventCover from "@/assets/event-cover.png";
import { alterarStatusEvento, montarEvento, organizacaoDoEvento, type Evento as EventoBanco, type NovoEvento } from "@/plataforma";
import { assinarBanco, lerBanco, salvar } from "@/plataforma/db";
import { assinarOrganizacao, definirPadrao, ORGANIZACAO_PADRAO, organizacaoAtualId } from "../../organizacoes/data/organizacao-atual";

/**
 * Eventos da organização.
 *
 * A lista e o contexto lateral do Backstage leem daqui, então o nome, a capa e
 * o status mostrados na listagem são os mesmos que aparecem ao entrar no evento.
 */

export type EventoStatus = "rascunho" | "privado" | "publicado" | "encerrado";

export interface Evento {
    id: string;
    nome: string;
    produtor: string;
    cover: string;
    status: EventoStatus;
    /** Data e hora do evento, em ISO. */
    data: string;
    local: string;
    /** Partes da data para o chip sobre a capa — derivadas de `data`. */
    weekday: string;
    day: string;
    month: string;
    dataLabel: string;
}

export const EVENTO_STATUS_LABEL: Record<EventoStatus, string> = {
    rascunho: "Rascunho",
    privado: "Privado",
    publicado: "Publicado",
    encerrado: "Encerrado",
};

/** Explica a diferença entre os status — usado como texto de apoio no seletor. */
export const EVENTO_STATUS_DESCRICAO: Record<EventoStatus, string> = {
    rascunho: "Vendas ainda desligadas",
    privado: "Vendas ligadas, acessíveis só por quem tem o link",
    publicado: "Vendas ligadas, sem restrição de acesso",
    encerrado: "Vendas encerradas",
};

/** Cor de badge por status — reaproveitada na listagem e nos cartões de contexto. */
export const EVENTO_STATUS_BADGE_COLOR: Record<EventoStatus, "warning" | "blue" | "success" | "gray"> = {
    rascunho: "warning",
    privado: "blue",
    publicado: "success",
    encerrado: "gray",
};

/** Privado e publicado ligam a venda — hoje a diferença é só quem acessa o link, não uma
 *  publicação separada em algum site. */
export function vendasHabilitadas(status: EventoStatus): boolean {
    return status === "privado" || status === "publicado";
}

const capitalizar = (valor: string) => valor.charAt(0).toUpperCase() + valor.slice(1).replace(".", "");

/** Deriva as partes da data para o chip e o rótulo longo. */
export function comData<T extends { data: string }>(base: T) {
    const date = new Date(base.data);
    const fmt = (options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("pt-BR", options).format(date);
    return {
        ...base,
        weekday: capitalizar(fmt({ weekday: "short" })),
        day: fmt({ day: "2-digit" }),
        month: capitalizar(fmt({ month: "short" })),
        // Data e hora numa frase do idioma ("20 de novembro de 2026 às 19:30"), sem símbolo separador (UI-TXT-010).
        dataLabel: fmt({ dateStyle: "long", timeStyle: "short" }),
    };
}

export const eventos: Evento[] = (
    [
    {
        id: "6704",
        nome: "MOCHAKK CALLING 2026",
        produtor: "Mochakk Calling",
        cover: "https://kraken.ingresse.com/event/posters/103691/large/1787000382.8580675.jpg",
        status: "publicado",
        data: "2026-10-03T22:00:00",
        local: "Mercado Pago Hall, São Paulo, SP",
    },
    {
        id: "2871",
        nome: "Laroc apresenta: RAVE THE WORLD by Alok",
        produtor: "Laroc",
        cover: "https://kraken.ingresse.com/event/posters/104600/large/1786025742.4637246.jpg",
        status: "publicado",
        data: "2026-10-17T22:00:00",
        local: "Laroc Club, Valinhos, SP",
    },
    {
        id: "3390",
        nome: "D-EDGE RIO apresenta IN DA CLUB W/ JUICCE",
        produtor: "D-EDGE",
        cover: "https://kraken.ingresse.com/event/posters/108467/large/1790120499.9730182.jpg",
        status: "publicado",
        data: "2026-10-02T23:00:00",
        local: "D-EDGE Rio, Rio de Janeiro, RJ",
    },
    {
        id: "5518",
        nome: "FREAK CHIC D-EDGE SP pres.: P1: BACKFOR3. D.MARCO. MISS BELINI (BDAY). SOL",
        produtor: "D-EDGE",
        cover: "https://kraken.ingresse.com/event/posters/108847/large/1790802263.758427.jpg",
        status: "publicado",
        data: "2026-10-02T23:00:00",
        local: "D-EDGE, Barra Funda, São Paulo, SP",
    },
    {
        id: "4102",
        nome: "D-EDGE RIO apresenta INCEPTION",
        produtor: "D-EDGE",
        cover: "https://kraken.ingresse.com/event/posters/108445/large/1790030930.3048496.jpg",
        status: "rascunho",
        data: "2026-10-16T23:00:00",
        local: "D-EDGE Rio, Rio de Janeiro, RJ",
    },
] satisfies Omit<Evento, "weekday" | "day" | "month" | "dataLabel">[]
).map(comData);

/* ------------------------------------------------------------------ */
/*  Espelho do banco unificado (src/plataforma)                        */
/*                                                                     */
/*  `eventos` continua sendo um array mutável, porque várias telas o   */
/*  leem direto. O conteúdo inicial é o mock acima (primeiro render);  */
/*  quando o banco carrega, o array passa a refletir os eventos do     */
/*  banco, e criar evento ou trocar status grava nele.                 */
/* ------------------------------------------------------------------ */

const STORAGE_KEY = "backstage-evento-atual";

const doBanco = (e: EventoBanco): Evento =>
    comData({
        id: e.id,
        nome: e.nome,
        produtor: e.produtora,
        cover: e.capa || eventCover,
        status: e.status,
        data: e.data,
        // Local e cidade separados por vírgula, como numa frase (UI-TXT-010).
        local: e.cidade ? `${e.local}, ${e.cidade}` : e.local,
    });

let currentId: string | null = null;
/** Incrementada a cada mutação para forçar o useSyncExternalStore a reconsultar `eventos`. */
let version = 0;
const listeners = new Set<() => void>();
const avisar = () => {
    version++;
    listeners.forEach((listener) => listener());
};

let espelhado: unknown = null;
/** A organização em contexto não tem evento: a lista fica com o último evento só para o contexto não quebrar, mas a tela de Eventos mostra o vazio (EVT-99). */
let organizacaoSemEventos = false;
export const semEventosNaOrganizacao = () => organizacaoSemEventos;
function espelhar() {
    const { modo, tabelas } = lerBanco();
    if (modo === "carregando" || tabelas.eventos === espelhado) return;
    espelhado = tabelas.eventos;
    // Mais recentes primeiro: o evento recém-criado aparece no topo.
    const todos = Object.values(tabelas.eventos).sort((a, b) => b.criadoEm.localeCompare(a.criadoEm) || a.data.localeCompare(b.data));
    if (todos.length === 0) return;
    // Só os eventos da organização em contexto. Sem escolha (link direto no primeiro acesso), vale a
    // organização do evento salvo ou do mais recente.
    let orgId = organizacaoAtualId();
    if (!orgId) {
        // Sem escolha, vale a Ingresse (ORG-04); sem ela no banco, a do evento salvo ou do mais recente.
        const salvo = ler(STORAGE_KEY);
        orgId = tabelas.organizacoes[ORGANIZACAO_PADRAO] ? ORGANIZACAO_PADRAO : organizacaoDoEvento(todos.find((e) => e.id === salvo) ?? todos[0]);
        definirPadrao(orgId);
    }
    const lista = todos.filter((e) => organizacaoDoEvento(e) === orgId).map(doBanco);
    organizacaoSemEventos = lista.length === 0;
    if (lista.length === 0) {
        avisar();
        return;
    }
    eventos.splice(0, eventos.length, ...lista);
    avisar();
}
const ler = (chave: string) => {
    try {
        return window.localStorage.getItem(chave);
    } catch {
        return null;
    }
};

if (typeof window !== "undefined") {
    assinarBanco(espelhar);
    // Trocar de organização refaz a lista mesmo sem o banco mudar.
    assinarOrganizacao(() => {
        espelhado = null;
        espelhar();
    });
    espelhar();
}

function readId(): string {
    if (currentId && eventos.some((evento) => evento.id === currentId)) return currentId;
    if (typeof window !== "undefined") {
        try {
            const saved = window.localStorage.getItem(STORAGE_KEY);
            if (saved && eventos.some((evento) => evento.id === saved)) currentId = saved;
        } catch {
            /* storage indisponível — usa o primeiro evento */
        }
    }
    return currentId ?? eventos[0].id;
}

function readSnapshot(): string {
    return `${readId()}:${version}`;
}

function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

/** Evento aberto no momento — alimenta o card e a barra mobile do Backstage. */
export function useEventoAtual(): Evento {
    useSyncExternalStore(subscribe, readSnapshot, () => `${eventos[0].id}:0`);
    const id = readId();
    return eventos.find((evento) => evento.id === id) ?? eventos[0];
}

/** Avisa quando o evento em contexto (ou a lista da organização) muda, para espelhos fora do React. */
export const assinarEventoAtual = (fn: () => void) => subscribe(fn);

/** Id do evento em contexto, sem assinar mudanças (para ações). */
export const eventoAtualId = () => readId();

export function setEventoAtual(id: string) {
    currentId = id;
    try {
        window.localStorage.setItem(STORAGE_KEY, id);
    } catch {
        /* storage indisponível — mantém apenas em memória */
    }
    avisar();
}

/** Muda o status de um evento no banco. Encerrado é terminal. Publicado aparece no site;
 *  privado vende só pelo link de compra. */
export function setEventoStatus(id: string, status: EventoStatus) {
    const evento = eventos.find((evento) => evento.id === id);
    if (!evento || evento.status === "encerrado") return;
    evento.status = status;
    avisar();
    void alterarStatusEvento(id, status);
}

/** Sobe a cada mutação (troca de evento ou de status) — quem lista eventos assina isso
 *  para recalcular ao vivo em vez de ficar preso ao snapshot do primeiro render. */
export function useEventosVersao(): number {
    return useSyncExternalStore(subscribe, () => version, () => 0);
}

export interface NovoEventoInput {
    nome: string;
    data: string;
    local: string;
    produtor: string;
    /** Cidade em campo próprio. Sem ela, sai do Local pelo primeiro "·" ou "•" (EVT-12). */
    cidade?: string;
    /** Início de cada sessão (ISO). */
    sessoes?: string[];
    descricao?: string;
    capa?: string;
    extras?: NovoEvento["extras"];
}

/** Cria o evento no banco (em rascunho) e o deixa como evento em contexto. */
export function criarEvento(input: NovoEventoInput): Evento {
    const [local, cidadeDoLocal] = input.cidade ? [input.local] : input.local.split(/\s*[·•]\s*/);
    const cidade = input.cidade ?? cidadeDoLocal;
    const novo = montarEvento({
        nome: input.nome,
        produtora: input.produtor,
        organizacaoId: organizacaoAtualId() ?? undefined,
        local: local || input.local,
        cidade,
        data: toLocalIso(input.data),
        sessoes: input.sessoes?.map(toLocalIso),
        descricao: input.descricao,
        capa: input.capa,
        extras: input.extras,
    });
    void salvar("eventos", novo);
    espelhar();
    setEventoAtual(novo.id);
    return eventos.find((e) => e.id === novo.id) ?? doBanco(novo);
}

/** ISO com fuso → ISO local sem fuso (o banco guarda horário local do evento). */
function toLocalIso(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso.slice(0, 16);
    const p = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
