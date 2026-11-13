import { lerColecao, lerDoc, salvar, salvarVarios } from "./db";
import type { Atribuicao, Canal, Evento, EventoStatus, IngressoEmitido, ItemPedido, MetodoPagamento, Pedido, Sessao, Usuario } from "./modelo";
import { agora, codigoIngresso, dataDoEvento, idDaOrganizacao, loteAtual, novoId, slugificar, vendidosPorLote } from "./regras";

/* Ações de negócio. As telas chamam estas funções; nenhuma tela monta documento do banco na mão. */

/* ---------------- eventos ---------------- */

export interface NovoEvento {
    nome: string;
    produtora: string;
    /** Organização dona; sem ela, deriva do nome da produtora. */
    organizacaoId?: string;
    local: string;
    cidade?: string;
    /** ISO local da primeira sessão. */
    data: string;
    capa?: string;
    /** Início de cada sessão (ISO local). Sem lista, uma sessão em `data`. */
    sessoes?: string[];
    descricao?: string;
    extras?: Pick<Evento, "tipo" | "modalidade" | "categoria" | "fim" | "moeda" | "limites" | "idadeMinima" | "mapa" | "partida" | "avancado" | "vitrine">;
}

const slugLivre = (base: string, id: string) => {
    const usados = new Set(lerColecao("eventos").filter((e) => e.id !== id).map((e) => e.slug));
    let slug = slugificar(base);
    for (let n = 2; usados.has(slug); n++) slug = `${slugificar(base)}-${n}`;
    return slug;
};

/** Monta o evento em rascunho, com uma sessão e nenhum ingresso (sem gravar). */
export function montarEvento(input: NovoEvento): Evento {
    const id = novoId("ev");
    const inicios = (input.sessoes?.length ? input.sessoes : [input.data]).map((s) => s.slice(0, 16)).sort();
    const data = inicios[0];
    const e: Evento = {
        id,
        slug: slugLivre(input.nome, id),
        nome: input.nome,
        produtora: input.produtora,
        organizacaoId: input.organizacaoId ?? idDaOrganizacao(input.produtora),
        status: "rascunho",
        // Sem upload de imagem no Backstage: capa fotográfica estável pelo id, igual em todas as telas.
        capa: input.capa ?? `https://picsum.photos/seed/${id}/600/800`,
        local: input.local,
        cidade: input.cidade,
        data,
        sessoes: inicios.map((inicio, i) => ({ id: `${id}-s${i + 1}`, inicio, grupos: [] })),
        taxaServico: 0.1,
        ...(input.descricao ? { vitrine: { descricao: input.descricao.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean) } } : {}),
        ...input.extras,
        criadoEm: agora(),
        atualizadoEm: agora(),
    };
    return e;
}

export const criarEvento = (input: NovoEvento) => salvar("eventos", montarEvento(input));

export async function atualizarEvento(id: string, patch: Partial<Omit<Evento, "id">>) {
    const atual = lerDoc("eventos", id);
    if (!atual) return;
    const prox = { ...atual, ...patch };
    if (patch.nome && patch.nome !== atual.nome) prox.slug = slugLivre(patch.nome, id);
    if (patch.sessoes) prox.data = dataDoEvento(patch.sessoes, prox.data);
    return salvar("eventos", prox);
}

export const salvarCatalogo = (id: string, sessoes: Sessao[]) => atualizarEvento(id, { sessoes });

/** Encerrado é terminal. */
export async function alterarStatusEvento(id: string, status: EventoStatus) {
    const atual = lerDoc("eventos", id);
    if (!atual || atual.status === "encerrado") return;
    return salvar("eventos", { ...atual, status });
}

/* ---------------- pedidos ---------------- */

export interface NovoPedido {
    eventoId: string;
    comprador: Usuario;
    canal: Canal;
    itens: ItemPedido[];
    atribuicoes: Atribuicao[];
    envio?: Pedido["envio"];
}

const soma = (ns: number[]) => Math.round(ns.reduce((a, b) => a + b, 0) * 100) / 100;

export async function criarPedido(input: NovoPedido): Promise<Pedido> {
    const subtotal = soma(input.itens.map((i) => i.face * i.quantidade));
    const taxas = soma(input.itens.map((i) => i.taxa * i.quantidade));
    const p: Pedido = {
        id: novoId("ped"),
        ...input,
        subtotal,
        taxas,
        total: soma([subtotal, taxas]),
        status: "aguardando-pagamento",
        criadoEm: agora(),
        atualizadoEm: agora(),
    };
    if (!lerDoc("usuarios", input.comprador.id)) await salvar("usuarios", input.comprador);
    return salvar("pedidos", p);
}

/**
 * Aprova o pagamento e emite um ingresso por unidade comprada. Quem não foi
 * atribuído a outra pessoa fica com o comprador. Idempotente: pedido já pago não emite de novo.
 */
export async function pagarPedido(
    id: string,
    metodo: MetodoPagamento,
    opcoes: { parcelas?: number; protecao?: number; juros?: number } = {},
): Promise<IngressoEmitido[]> {
    const { parcelas, protecao = 0, juros = 0 } = opcoes;
    const p = lerDoc("pedidos", id);
    if (!p) throw new Error("Pedido não encontrado");
    if (p.status === "pago") return lerColecao("ingressos").filter((i) => i.pedidoId === id);
    const ev = lerDoc("eventos", p.eventoId);

    const emitidos: IngressoEmitido[] = [];
    p.itens.forEach((item, idx) => {
        if (item.tipo !== "ingresso" || !item.sessaoId || !item.grupoId || !item.ingressoId || !item.loteId) return;
        const grupo = ev?.sessoes.find((s) => s.id === item.sessaoId)?.grupos.find((g) => g.id === item.grupoId);
        const doItem = p.atribuicoes.filter((a) => a.item === idx);
        for (let n = 0; n < item.quantidade; n++) {
            const titular = doItem[n] ?? { nome: p.comprador.nome, email: p.comprador.email };
            emitidos.push({
                id: novoId("ing"),
                pedidoId: p.id,
                eventoId: p.eventoId,
                sessaoId: item.sessaoId,
                grupoId: item.grupoId,
                ingressoId: item.ingressoId,
                loteId: item.loteId,
                rotulo: { evento: ev?.nome ?? "Evento", grupo: grupo?.nome ?? "", ingresso: item.nome, lote: item.detalhe ?? "", acesso: grupo?.acesso },
                titular: { nome: titular.nome, email: titular.email.toLowerCase() },
                codigo: codigoIngresso(),
                status: "valido",
                emitidoEm: agora(),
                atualizadoEm: agora(),
            });
        }
    });

    await salvarVarios({
        pedidos: [
            {
                ...p,
                status: "pago",
                pagamento: { metodo, parcelas, pagoEm: agora() },
                adicionais: { protecao, juros },
                total: soma([p.subtotal, p.taxas, protecao, juros]),
            },
        ],
        ingressos: emitidos,
    });
    return emitidos;
}

/** Cancela o pedido e os ingressos dele; o estoque volta. Pedido já cancelado não muda. */
export async function cancelarPedido(id: string) {
    const p = lerDoc("pedidos", id);
    if (!p || p.status === "cancelado") return;
    const ingressos = lerColecao("ingressos")
        .filter((i) => i.pedidoId === id && i.status === "valido")
        .map((i) => ({ ...i, status: "cancelado" as const, atualizadoEm: agora() }));
    await salvarVarios({ pedidos: [{ ...p, status: "cancelado", atualizadoEm: agora() }], ingressos });
}

/** Cancela um ingresso só; o pedido continua. */
export async function cancelarIngresso(id: string) {
    const i = lerDoc("ingressos", id);
    if (!i || i.status !== "valido") return;
    await salvar("ingressos", { ...i, status: "cancelado", atualizadoEm: agora() });
}

/**
 * Cortesias: um pedido por destinatário, sem cobrança, já pago no método "cortesia". Cada item
 * sai no lote atual do ingresso e emite na hora, na carteira do e-mail.
 */
export async function emitirCortesias(input: {
    eventoId: string;
    envio: NonNullable<Pedido["envio"]>;
    emails: string[];
    itens: { sessaoId: string; grupoId: string; ingressoId: string }[];
}): Promise<Pedido[]> {
    const ev = lerDoc("eventos", input.eventoId);
    if (!ev) throw new Error("Evento não encontrado");
    const vendidos = vendidosPorLote(lerColecao("ingressos"), lerColecao("historico"));
    const itens: ItemPedido[] = input.itens.flatMap((ref) => {
        const tipo = ev.sessoes.find((s) => s.id === ref.sessaoId)?.grupos.find((g) => g.id === ref.grupoId)?.ingressos.find((t) => t.id === ref.ingressoId);
        const lote = tipo && (loteAtual(tipo, vendidos) ?? tipo.lotes[tipo.lotes.length - 1]);
        return tipo && lote ? [{ tipo: "ingresso" as const, nome: tipo.nome, detalhe: lote.nome, ...ref, loteId: lote.id, quantidade: 1, face: 0, taxa: 0 }] : [];
    });
    const pedidos: Pedido[] = [];
    for (const email of input.emails) {
        const e = email.trim().toLowerCase();
        const comprador = lerColecao("usuarios").find((u) => u.email === e) ?? { id: `u_${slugificar(e)}`, nome: e.split("@")[0], email: e };
        const p = await criarPedido({ eventoId: input.eventoId, comprador, canal: "cortesia", itens, atribuicoes: [], envio: input.envio });
        await pagarPedido(p.id, "cortesia");
        pedidos.push(p);
    }
    return pedidos;
}

/** Renomeia um envio de cortesias em todos os pedidos dele. */
export async function renomearEnvio(envioId: string, nome: string) {
    const docs = lerColecao("pedidos").filter((p) => p.envio?.id === envioId);
    await salvarVarios({ pedidos: docs.map((p) => ({ ...p, envio: { ...p.envio!, nome }, atualizadoEm: agora() })) });
}

/** Transferência simples: muda o titular, mantém o código antigo inválido. */
export async function transferirIngresso(id: string, para: { nome: string; email: string }) {
    const i = lerDoc("ingressos", id);
    if (!i || i.status !== "valido") return;
    const novo: IngressoEmitido = { ...i, id: novoId("ing"), titular: { nome: para.nome, email: para.email.toLowerCase() }, codigo: codigoIngresso(), emitidoEm: agora(), atualizadoEm: agora() };
    await salvarVarios({ ingressos: [{ ...i, status: "transferido" }, novo] });
    return novo;
}
