/*
 * Guia de configuração do evento (porte de feat/event-setup-journey, MKT-1051).
 *
 * Função pura: recebe o estado do evento e devolve o que a tela mostra. Cada passo lê o estado
 * REAL do evento, nunca um contador guardado à parte: se o produtor desfaz o que fez, o passo
 * reabre sozinho.
 */

/** `desconhecido` = ainda carregando. Na dúvida o guia cala (GDC-04). */
export type Presenca = "desconhecido" | "nenhum" | "algum";
export type Publicacao = "desconhecido" | "fora-do-ar" | "no-ar";

export type PassoId = "setores" | "ingressos" | "abertura" | "publicar";

export interface EstadoDoEvento {
    setores: Presenca;
    ingressos: Presenca;
    /** Existe abertura de vendas com ao menos um ingresso do evento dentro. */
    abertura: Presenca;
    publicacao: Publicacao;
}

export interface AlertaDoPasso {
    titulo: string;
    descricao: string;
    acao: string;
}

interface DefinicaoDoPasso {
    id: PassoId;
    /** Uma frase imperativa. */
    rotulo: string;
    /** Verbo da ação, que diz o que acontece ao clicar. */
    acao: string;
    /** Por que o passo ainda não pode ser feito (só com `bloqueado`). */
    motivo?: string;
    feito: (e: EstadoDoEvento) => boolean;
    bloqueado?: (e: EstadoDoEvento) => boolean;
    /** Só passos que travam a venda continuam cobrando depois que o guia é fechado. */
    alerta?: AlertaDoPasso;
}

export const PASSOS: readonly DefinicaoDoPasso[] = [
    {
        id: "setores",
        rotulo: "Crie os setores do evento",
        acao: "Criar",
        feito: (e) => e.setores === "algum",
    },
    {
        id: "ingressos",
        rotulo: "Crie ingressos com preço e lote",
        acao: "Criar",
        motivo: "Precisa de um setor antes",
        feito: (e) => e.ingressos === "algum",
        bloqueado: (e) => e.setores === "nenhum",
    },
    {
        id: "abertura",
        rotulo: "Programe o início das vendas",
        acao: "Programar",
        motivo: "Precisa de setor e ingresso criados antes",
        feito: (e) => e.ingressos === "algum" && e.abertura === "algum",
        bloqueado: (e) => e.setores === "nenhum" || e.ingressos === "nenhum",
        alerta: {
            titulo: "Nada programado para entrar à venda",
            descricao: "Os ingressos existem, mas só entram à venda quando você programa a abertura.",
            acao: "Programar abertura de vendas",
        },
    },
    {
        id: "publicar",
        rotulo: "Publique o evento",
        acao: "Publicar",
        motivo: "Precisa de ingressos criados antes",
        feito: (e) => e.publicacao === "no-ar",
        bloqueado: (e) => e.setores === "nenhum" || e.ingressos === "nenhum",
    },
];

export interface PassoResolvido {
    id: PassoId;
    rotulo: string;
    acao: string;
    motivo?: string;
    alerta?: AlertaDoPasso;
    status: "complete" | "current" | "incomplete";
    bloqueado: boolean;
}

export type Superficie = "nenhuma" | "painel" | "alerta";

export interface GuiaResolvido {
    superficie: Superficie;
    passos: PassoResolvido[];
    atual?: PassoResolvido;
    /** Passo atual que trava a venda: o que o alerta anuncia depois de fechar o guia. */
    passoDoAlerta?: PassoResolvido;
    feitos: number;
    total: number;
}

/** Atual = primeiro pendente e desbloqueado. Passo feito nunca é bloqueado. */
export function resolverPassos(e: EstadoDoEvento): PassoResolvido[] {
    const resolvidos = PASSOS.map((p) => {
        const feito = p.feito(e);
        return { p, feito, bloqueado: !feito && (p.bloqueado?.(e) ?? false) };
    });
    const pendentes = resolvidos.filter((r) => !r.feito);
    const atual = pendentes.find((r) => !r.bloqueado) ?? pendentes[0];
    return resolvidos.map(({ p, feito, bloqueado }) => ({
        id: p.id,
        rotulo: p.rotulo,
        acao: p.acao,
        motivo: p.motivo,
        alerta: p.alerta,
        bloqueado,
        status: feito ? "complete" : p.id === atual?.p.id ? "current" : "incomplete",
    }));
}

export function resolverGuia(e: EstadoDoEvento, fechado: boolean): GuiaResolvido {
    const passos = resolverPassos(e);
    const atual = passos.find((p) => p.status === "current");
    const passoDoAlerta = atual?.alerta ? atual : undefined;
    const respondendo = e.setores !== "desconhecido" && e.ingressos !== "desconhecido" && e.abertura !== "desconhecido" && e.publicacao !== "desconhecido";

    let superficie: Superficie = "nenhuma";
    if (respondendo && atual) superficie = !fechado ? "painel" : passoDoAlerta ? "alerta" : "nenhuma";

    return { superficie, passos, atual, passoDoAlerta, feitos: passos.filter((p) => p.status === "complete").length, total: passos.length };
}
