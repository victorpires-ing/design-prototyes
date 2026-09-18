import { useSyncExternalStore } from "react";
import eventCover from "@/assets/event-cover.png";
import gremioBook from "@/assets/gremio-poster-book.jpeg";
import gremioPacotes from "@/assets/gremio-poster-pacotes.jpeg";
import gremioTaca from "@/assets/gremio-poster-taca.jpeg";
import gremioTour from "@/assets/gremio-poster-tour.jpeg";

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
    rascunho: "Vendas ainda não habilitadas",
    privado: "Vendas habilitadas, visível só com o link",
    publicado: "Vendas habilitadas, visível no site",
    encerrado: "Vendas encerradas",
};

/** Cor de badge por status — reaproveitada na listagem e nos cartões de contexto. */
export const EVENTO_STATUS_BADGE_COLOR: Record<EventoStatus, "warning" | "blue" | "success" | "gray"> = {
    rascunho: "warning",
    privado: "blue",
    publicado: "success",
    encerrado: "gray",
};

/** Privado e publicado habilitam vendas — só muda a visibilidade no site. */
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
        dataLabel: `${fmt({ day: "2-digit", month: "long", year: "numeric" })} • ${fmt({ hour: "2-digit", minute: "2-digit" })}`,
    };
}

export const eventos: Evento[] = [
    {
        id: "6704",
        nome: "Réveillon Carneiros 2027",
        produtor: "Ingresse",
        cover: eventCover,
        status: "publicado",
        data: "2026-12-31T20:00:00",
        local: "Praia dos Carneiros • Tamandaré, PE",
    },
    {
        id: "2871",
        nome: "Grêmio x Internacional — Gre-Nal 445",
        produtor: "Grêmio FBPA",
        cover: gremioTaca,
        status: "publicado",
        data: "2026-09-12T18:30:00",
        local: "Arena do Grêmio • Porto Alegre, RS",
    },
    {
        id: "3390",
        nome: "Tour da Arena do Grêmio",
        produtor: "Grêmio FBPA",
        cover: gremioTour,
        status: "publicado",
        data: "2026-09-02T10:00:00",
        local: "Arena do Grêmio • Porto Alegre, RS",
    },
    {
        id: "5518",
        nome: "Book de fotos no gramado",
        produtor: "Grêmio FBPA",
        cover: gremioBook,
        status: "publicado",
        data: "2026-10-16T14:00:00",
        local: "Arena do Grêmio • Porto Alegre, RS",
    },
    {
        id: "4102",
        nome: "Pacote Sócio Torcedor 2027",
        produtor: "Grêmio FBPA",
        cover: gremioPacotes,
        status: "rascunho",
        data: "2026-10-05T09:00:00",
        local: "Online",
    },
    {
        id: "1234",
        nome: "América x Laguna (5 a 0)",
        produtor: "Ingresse",
        cover: "https://casadeapostasarenadasdunas.com.br/wp-content/uploads/2026/05/AMERICAXLAGUNA.png",
        status: "encerrado",
        data: "2026-06-21T16:00:00",
        local: "Arena das Dunas • Natal, RN",
    },
].map(comData);

/* ------------------------------------------------------------------ */
/*  Evento em contexto                                                 */
/* ------------------------------------------------------------------ */

const STORAGE_KEY = "backstage-evento-atual";
const STATUS_STORAGE_PREFIX = "backstage-evento-status:";

/** Aplica por cima do mock qualquer status salvo de uma sessão anterior — sem isso,
 *  um F5 reverte silenciosamente qualquer troca de status feita pelo seletor. */
function aplicarStatusPersistido() {
    if (typeof window === "undefined") return;
    for (const evento of eventos) {
        try {
            const salvo = window.localStorage.getItem(`${STATUS_STORAGE_PREFIX}${evento.id}`);
            if (salvo === "rascunho" || salvo === "privado" || salvo === "publicado" || salvo === "encerrado") {
                evento.status = salvo;
            }
        } catch {
            /* storage indisponível — mantém o status do mock */
        }
    }
}
aplicarStatusPersistido();

let currentId: string | null = null;
/** Incrementada a cada mutação (troca de evento ou de status) para forçar o
 *  useSyncExternalStore a reconsultar `eventos`, já que os objetos são mutados
 *  no lugar em vez de substituídos. */
let version = 0;
const listeners = new Set<() => void>();

function readId(): string {
    if (currentId) return currentId;
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

export function setEventoAtual(id: string) {
    currentId = id;
    try {
        window.localStorage.setItem(STORAGE_KEY, id);
    } catch {
        /* storage indisponível — mantém apenas em memória */
    }
    version++;
    listeners.forEach((listener) => listener());
}

/** Muda o status de um evento (usado pelo seletor de status no card do evento).
 *  Encerrado é terminal: uma vez lá, nenhuma chamada consegue tirar o evento desse status. */
export function setEventoStatus(id: string, status: EventoStatus) {
    const evento = eventos.find((evento) => evento.id === id);
    if (!evento || evento.status === "encerrado") return;
    evento.status = status;
    try {
        window.localStorage.setItem(`${STATUS_STORAGE_PREFIX}${id}`, status);
    } catch {
        /* storage indisponível — mantém apenas em memória */
    }
    version++;
    listeners.forEach((listener) => listener());
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
}

/** Cria um evento de verdade (em rascunho) e o deixa como evento em contexto —
 *  ao contrário de setEventoAtual, que só troca qual evento já existente está ativo. */
export function criarEvento(input: NovoEventoInput): Evento {
    const evento: Evento = comData({
        id: novoEventoId(),
        produtor: input.produtor,
        cover: eventCover,
        status: "rascunho",
        nome: input.nome,
        data: input.data,
        local: input.local,
    });
    eventos.push(evento);
    setEventoAtual(evento.id);
    return evento;
}

function novoEventoId(): string {
    return Math.random().toString(36).slice(2, 8);
}
