import { useMemo } from "react";
import type { AberturaDeVendas, Combo, EdicaoNaCarteira, Pergunta, Evento, Grupo, Lote, Organizacao, ProdutoDaOrganizacao, ProdutoNoEvento, Sessao, TipoIngresso } from "@/plataforma";
import { atualizarEvento, loteAtual, novoId, organizacaoDoEvento, salvar, somarPorLote, useBanco, useDoc, usePendentes, useVendidos } from "@/plataforma";
import { useEventoAtual } from "../../eventos/data/eventos";
import { CHAVES_DE_EXEMPLO } from "./exemplos";
import camisa from "@/assets/products/camisa_oficial/1.webp";
import copo from "@/assets/products/copo_oficial/1.png";
import sacochila from "@/assets/products/sacochila/1.webp";
import tirante from "@/assets/products/tirante/1.png";

/* ------------------------------------------------------------------ */
/*  Catálogo do evento: ingressos, produtos e combos (ITM)             */
/*                                                                     */
/*  O item é o centro: tudo o que define o que é vendido (preço,       */
/*  lotes, estoque e regras de venda) vive                             */
/*  nele. Ingressos ficam no documento do evento (sessão > setor >     */
/*  ingresso > lote); produtos vêm da biblioteca da organização e o    */
/*  evento escolhe quais vende; combos são pacotes de itens do evento. */
/* ------------------------------------------------------------------ */

/* ---------------- leitura ---------------- */

export interface Catalogo {
    carregando: boolean;
    /** Catálogo simulado com N ingressos (`?escala=N`), só na memória; `null` no catálogo real. */
    simulado: number | null;
    evento?: Evento;
    organizacao?: Organizacao;
    /** Biblioteca de produtos da organização (a inicial, se ela ainda não salvou a sua). */
    biblioteca: ProdutoDaOrganizacao[];
    /**
     * O que já saiu do estoque, por lote: vendidos (pagos) + pendentes (em pagamento ou reservados,
     * dentro do prazo). A compra pendente segura o ingresso, então esgotado, saldo e lote à venda
     * usam este mapa. Para mostrar só os pagos, use `pagosDoLote`.
     */
    vendidos: Map<string, number>;
    /** Compras pendentes por lote (já somadas em `vendidos`). */
    pendentes: Map<string, number>;
}

export function useCatalogo(): Catalogo {
    const { modo } = useBanco();
    const contexto = useEventoAtual();
    const evento = useDoc("eventos", contexto.id);
    const organizacao = useDoc("organizacoes", evento ? organizacaoDoEvento(evento) : null);
    const pagos = useVendidos();
    const pendentes = usePendentes();
    const vendidos = useMemo(() => somarPorLote(pagos, pendentes), [pagos, pendentes]);
    const biblioteca = useMemo(() => bibliotecaDe(organizacao, evento ? organizacaoDoEvento(evento) : ""), [organizacao, evento]);
    const escala = escalaSimulada();
    const simulado = useMemo(() => (escala && evento ? catalogoSimulado(evento, escala) : null), [escala, evento?.id]);
    if (simulado) return { carregando: false, simulado: escala, evento: simulado.evento, organizacao, biblioteca: simulado.biblioteca, vendidos: simulado.vendidos, pendentes: simulado.pendentes };
    return { carregando: modo === "carregando" || !evento, simulado: null, evento, organizacao, biblioteca, vendidos, pendentes };
}

/* ---------------- simulação de escala (UI-LST-001) ---------------- */

const CHAVE_ESCALA = "itens-escala";

/**
 * Tamanho do catálogo simulado: `?escala=N` liga para a sessão do navegador, `?escala=0` desliga.
 * Serve para testar a interface com milhares de itens sem tocar no banco.
 */
export function escalaSimulada(): number | null {
    if (typeof window === "undefined") return null;
    const param = new URLSearchParams(window.location.search).get("escala");
    try {
        if (param !== null) {
            if (Number(param) > 0) window.sessionStorage.setItem(CHAVE_ESCALA, String(Math.min(5000, Math.round(Number(param)))));
            else window.sessionStorage.removeItem(CHAVE_ESCALA);
        }
        const v = Number(window.sessionStorage.getItem(CHAVE_ESCALA));
        return v > 0 ? v : null;
    } catch {
        return null;
    }
}

export function sairDaSimulacao() {
    try {
        window.sessionStorage.removeItem(CHAVE_ESCALA);
    } catch {
        /* sem armazenamento: a simulação já some ao recarregar sem o parâmetro */
    }
    window.location.href = window.location.pathname.replace(/\/(ingressos|produtos|combos)\/[^/]+$/, "/$1");
}

const NOMES_SETOR = ["Pista", "Pista Premium", "Camarote", "Arquibancada Norte", "Arquibancada Sul", "Frontstage", "Mezanino", "Cadeira Inferior"];
const NOMES_TIPO = ["Inteira", "Meia-entrada", "Inteira promocional", "Social", "Acompanhante PCD", "Sócio", "Grupo de 4", "Estudante", "Professor", "Doador de sangue"];

/** Gera um catálogo grande e determinístico a partir do evento real, só na memória. */
function catalogoSimulado(base: Evento, total: number) {
    let semente = 7;
    const rand = () => ((semente = (semente * 16807) % 2147483647) - 1) / 2147483646;
    const vendidos = new Map<string, number>();
    const pendentes = new Map<string, number>();
    const porSessao = 40;
    const nSessoes = Math.max(1, Math.ceil(total / porSessao));
    const inicio = new Date(base.data);
    let criados = 0;
    const sessoes: Sessao[] = [];
    for (let s = 0; s < nSessoes && criados < total; s++) {
        const dia = new Date(inicio.getTime() + s * 86400000);
        const iso = `${dia.getFullYear()}-${String(dia.getMonth() + 1).padStart(2, "0")}-${String(dia.getDate()).padStart(2, "0")}T${base.data.slice(11, 16) || "20:00"}`;
        const grupos: Grupo[] = NOMES_SETOR.slice(0, 5).map((nome, g) => ({ id: `sim-s${s}-g${g}`, nome, acesso: `Portão ${String.fromCharCode(65 + g)}`, tipoAcesso: g === 1 ? "facial" : "qr", capacidade: 500 + g * 250, ingressos: [] }));
        for (let i = 0; i < porSessao && criados < total; i++, criados++) {
            const g = grupos[i % grupos.length];
            const id = `sim-s${s}-t${i}`;
            const precoBase = 80 + Math.round(rand() * 40) * 10;
            const lotes: Lote[] = [0, 1, 2].slice(0, 1 + Math.floor(rand() * 3)).map((k) => ({ id: `${id}-l${k}`, nome: `${k + 1}º lote`, preco: precoBase + k * 20, quantidade: 50 + Math.round(rand() * 15) * 10 }));
            lotes.forEach((l, k) => vendidos.set(l.id, k === 0 ? Math.round(l.quantidade * rand()) : 0));
            // Alguns ingressos com compras em pagamento no 1º lote (já contadas em vendidos, que segura o estoque).
            const pend = i % 3 === 0 ? Math.min(1 + Math.floor(rand() * 8), lotes[0].quantidade - (vendidos.get(lotes[0].id) ?? 0)) : 0;
            if (pend > 0) {
                pendentes.set(lotes[0].id, pend);
                vendidos.set(lotes[0].id, (vendidos.get(lotes[0].id) ?? 0) + pend);
            }
            const ativo = rand() > 0.1;
            // Chaves de acesso de exemplo: algumas no ingresso inteiro (de 3 a 120), outras só no 1º lote.
            const chaves = i % 6 === 0 ? CHAVES_DE_EXEMPLO.slice(i % 50, (i % 50) + [3, 12, 120][s % 3]) : undefined;
            if (i % 9 === 4) lotes[0] = { ...lotes[0], chaves: CHAVES_DE_EXEMPLO.slice(200 + i, 205 + i) };
            g.ingressos.push({ id, nome: NOMES_TIPO[Math.floor(i / grupos.length) % NOMES_TIPO.length], beneficio: i % 2 ? "meia-entrada" : "inteira", ativo, lotes, ...(chaves ? { chaves } : {}) });
        }
        sessoes.push({ id: `sim-s${s}`, inicio: iso, grupos });
    }
    const nProdutos = Math.max(2, Math.round(total / 10));
    const biblioteca: ProdutoDaOrganizacao[] = Array.from({ length: nProdutos }, (_, i) => ({
        id: `sim-p${i}`,
        nome: `${["Camiseta", "Copo", "Boné", "Pôster", "Estacionamento"][i % 5]} ${Math.floor(i / 5) + 1}`,
        precoBase: 20 + (i % 8) * 15,
        criadoEm: base.criadoEm,
    }));
    const produtos: ProdutoNoEvento[] = biblioteca.map((p, i) => ({ produtoId: p.id, estoque: 100 + i * 3, ativo: i % 7 !== 0 }));
    const tipos = sessoes.flatMap((s) => s.grupos.flatMap((g) => g.ingressos));
    const combos: Combo[] = Array.from({ length: Math.max(1, Math.round(total / 20)) }, (_, i) => ({
        id: `sim-c${i}`,
        nome: `Combo ${i + 1}`,
        preco: 150 + (i % 6) * 25,
        itens: [
            { tipo: "ingresso", id: tipos[i % tipos.length].id, quantidade: 1 + (i % 2) },
            { tipo: "produto", id: biblioteca[i % biblioteca.length].id, quantidade: 1 },
        ],
        ativo: i % 9 !== 0,
    }));
    // Uma abertura com setores completos e ingressos avulsos, para testar o seletor em escala (ABV-04).
    const hoje = new Date();
    const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T10:00`;
    const aberturas: AberturaDeVendas[] = [
        {
            id: "sim-abv",
            nome: "Venda geral",
            inicio: iso(new Date(hoje.getTime() - 86400000)),
            fim: iso(new Date(hoje.getTime() + 30 * 86400000)),
            itens: [
                ...sessoes.slice(0, 3).flatMap((s) => s.grupos.slice(0, 2).flatMap((g) => g.ingressos.map((t) => ({ tipo: "ingresso" as const, id: t.id })))),
                ...tipos.slice(200, 212).map((t) => ({ tipo: "ingresso" as const, id: t.id })),
                { tipo: "produto" as const, id: biblioteca[0].id },
            ],
        },
    ];
    // Questionário de atleta com cerca de 50 perguntas, para testar a lista e os vínculos em escala (QST).
    const BASE_PERGUNTAS: Array<Pick<Pergunta, "titulo" | "tipo"> & { opcoes?: string[] }> = [
        { titulo: "Nome completo do atleta", tipo: "texto-curto" },
        { titulo: "Tamanho da camiseta", tipo: "opcao-unica", opcoes: ["PP", "P", "M", "G", "GG", "XG"] },
        { titulo: "Equipe ou assessoria", tipo: "texto-curto" },
        { titulo: "Tipo sanguíneo", tipo: "opcao-unica", opcoes: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] },
        { titulo: "Telefone de emergência", tipo: "telefone" },
        { titulo: "Contato de emergência", tipo: "texto-curto" },
        { titulo: "Pace em minutos por km", tipo: "numero" },
        { titulo: "Atestado médico", tipo: "anexo" },
        { titulo: "Serviços extras", tipo: "multipla", opcoes: ["Guarda-volumes", "Massagem", "Fotos"] },
        { titulo: "Observações de saúde", tipo: "texto-longo" },
    ];
    const perguntas: Pergunta[] = Array.from({ length: 48 }, (_, i) => {
        const b = BASE_PERGUNTAS[i % BASE_PERGUNTAS.length];
        const volta = Math.floor(i / BASE_PERGUNTAS.length);
        return {
            id: `sim-prg${i}`,
            titulo: volta ? `${b.titulo} (modalidade ${volta + 1})` : b.titulo,
            tipo: b.tipo,
            obrigatoria: i % 4 !== 3,
            opcoes: b.opcoes?.map((r, k) => ({ id: `sim-prg${i}-o${k}`, rotulo: r, ...(b.tipo === "opcao-unica" && k === 1 ? { estoque: 0 } : k === 2 ? { estoque: 40 } : {}) })),
            itens:
                i % 7 === 6
                    ? []
                    : [
                          ...(volta === 0 ? tipos : tipos.slice(volta * 400, volta * 400 + 300)).map((t) => ({ tipo: "ingresso" as const, id: t.id })),
                          ...(i % 2 ? combos.slice(0, 2).map((c) => ({ tipo: "combo" as const, id: c.id })) : []),
                      ],
        };
    });
    const edicaoNaCarteira: EdicaoNaCarteira = {
        inicio: iso(new Date(hoje.getTime() - 86400000)),
        fim: iso(new Date(hoje.getTime() + 20 * 86400000)),
        perguntas: perguntas.filter((_, i) => i % 3 === 1).map((p) => p.id),
    };
    return { evento: { ...base, sessoes, produtos, combos, aberturas, perguntas, edicaoNaCarteira }, biblioteca, vendidos, pendentes };
}

/** Produtos iniciais de exemplo, para a organização que ainda não montou a biblioteca. Fictícios. */
const produtosIniciais = (orgId: string): ProdutoDaOrganizacao[] => [
    { id: `${orgId}-camiseta`, nome: "Camiseta oficial", descricao: "Algodão, estampa do evento. Tamanhos P a GG.", imagem: camisa, precoBase: 120, criadoEm: "2026-01-01T00:00:00.000Z" },
    { id: `${orgId}-copo`, nome: "Copo oficial", descricao: "Copo reutilizável com a arte do evento.", imagem: copo, precoBase: 30, criadoEm: "2026-01-01T00:00:00.000Z" },
    { id: `${orgId}-sacochila`, nome: "Sacochila", descricao: "Leve, para carregar o essencial.", imagem: sacochila, precoBase: 45, criadoEm: "2026-01-01T00:00:00.000Z" },
    { id: `${orgId}-tirante`, nome: "Tirante para copo", descricao: "Leva o copo pendurado, com as mãos livres.", imagem: tirante, precoBase: 15, criadoEm: "2026-01-01T00:00:00.000Z" },
];

export const bibliotecaDe = (org: Organizacao | undefined, orgId: string) => org?.produtos ?? (orgId ? produtosIniciais(orgId) : []);

/* ---------------- ingressos ---------------- */

export type EstadoItem = "a-venda" | "esgotado" | "pausado" | "agendado" | "encerrado" | "sem-estoque";
export type EstadoLote = "a-venda" | "esgotado" | "pausado" | "aguardando" | "encerrado";

export interface IngressoNoCatalogo {
    tipo: TipoIngresso;
    setor: Grupo;
    sessao: Sessao;
}

/** Todos os ingressos do evento, com setor e sessão. */
export const ingressosDo = (ev: Evento | undefined): IngressoNoCatalogo[] =>
    ev ? ev.sessoes.flatMap((sessao) => sessao.grupos.flatMap((setor) => setor.ingressos.map((tipo) => ({ tipo, setor, sessao })))) : [];

export const acharIngresso = (ev: Evento | undefined, id: string) => ingressosDo(ev).find((i) => i.tipo.id === id);

/** Saiu do estoque: vendidos + pendentes (o mapa `vendidos` do catálogo). */
export const vendidosDoLote = (l: Lote, vendidos: Map<string, number>) => vendidos.get(l.id) ?? 0;
export const pendentesDoLote = (l: Lote, pendentes: Map<string, number>) => pendentes.get(l.id) ?? 0;
/** Só os pagos, para mostrar "vendidos" ao produtor. */
export const pagosDoLote = (l: Lote, vendidos: Map<string, number>, pendentes: Map<string, number>) =>
    Math.max(0, vendidosDoLote(l, vendidos) - pendentesDoLote(l, pendentes));
export const pendentesDoIngresso = (t: TipoIngresso, pendentes: Map<string, number>) => t.lotes.reduce((s, l) => s + pendentesDoLote(l, pendentes), 0);
export const vendidosDoIngresso = (t: TipoIngresso, vendidos: Map<string, number>) => t.lotes.reduce((s, l) => s + vendidosDoLote(l, vendidos), 0);
export const quantidadeDoIngresso = (t: TipoIngresso) => t.lotes.reduce((s, l) => s + l.quantidade, 0);
/** Ainda disponível para venda: saldo dos lotes não pausados. */
export const disponivelDoIngresso = (t: TipoIngresso, vendidos: Map<string, number>) =>
    t.lotes.filter((l) => !l.pausado).reduce((s, l) => s + Math.max(0, l.quantidade - vendidosDoLote(l, vendidos)), 0);

export function estadoDoLote(l: Lote, t: TipoIngresso, vendidos: Map<string, number>): EstadoLote {
    if (vendidosDoLote(l, vendidos) >= l.quantidade) return "esgotado";
    if (l.pausado) return "pausado";
    return loteAtual(t, vendidos)?.id === l.id ? "a-venda" : "aguardando";
}

export function estadoDoIngresso(t: TipoIngresso, vendidos: Map<string, number>): EstadoItem {
    if (!t.ativo) return "pausado";
    if (t.lotes.length === 0) return "sem-estoque";
    // Quando vende é decidido pelo lote ligado (só um por vez) e pela abertura de vendas.
    if (loteAtual(t, vendidos)) return "a-venda";
    const restantes = t.lotes.filter((l) => vendidosDoLote(l, vendidos) < l.quantidade);
    return restantes.length === 0 ? "esgotado" : "pausado";
}

/** Faixa de preço do ingresso (menor e maior entre os lotes). */
export const faixaDePreco = (t: TipoIngresso) => {
    const precos = t.lotes.map((l) => l.preco);
    return { min: precos.length ? Math.min(...precos) : 0, max: precos.length ? Math.max(...precos) : 0 };
};

/** Soma dos lotes de todos os ingressos do setor: conferida contra a capacidade (ITM-12). */
export const ofertaDoSetor = (s: Grupo) => s.ingressos.reduce((soma, t) => soma + quantidadeDoIngresso(t), 0);
export const vendidosDoSetor = (s: Grupo, vendidos: Map<string, number>) => s.ingressos.reduce((soma, t) => soma + vendidosDoIngresso(t, vendidos), 0);

/* ---------------- produtos ---------------- */

export interface ProdutoNoCatalogo {
    produto: ProdutoDaOrganizacao;
    noEvento: ProdutoNoEvento;
}

export const produtosDo = (ev: Evento | undefined, biblioteca: ProdutoDaOrganizacao[]): ProdutoNoCatalogo[] =>
    (ev?.produtos ?? []).flatMap((noEvento) => {
        const produto = biblioteca.find((p) => p.id === noEvento.produtoId);
        return produto ? [{ produto, noEvento }] : [];
    });

export const precoDoProduto = (p: ProdutoNoCatalogo) => p.noEvento.preco ?? p.produto.precoBase;

/** Produtos ainda não têm venda no checkout: tudo o estoque está disponível (ver rules.md, Em aberto). */
export function estadoDoProduto(p: ProdutoNoEvento): EstadoItem {
    if (!p.ativo) return "pausado";
    if (p.estoque <= 0) return "sem-estoque";
    return "a-venda";
}

/* ---------------- combos ---------------- */

/** Quantos combos dá para vender com o estoque dos itens e o limite do combo. */
export function disponivelDoCombo(c: Combo, ev: Evento | undefined, vendidos: Map<string, number>): number {
    const porItem = c.itens.map((i) => {
        const disponivel =
            i.tipo === "ingresso"
                ? (() => {
                      const t = acharIngresso(ev, i.id)?.tipo;
                      return t && t.ativo ? disponivelDoIngresso(t, vendidos) : 0;
                  })()
                : (() => {
                      const p = ev?.produtos?.find((x) => x.produtoId === i.id);
                      return p && p.ativo ? p.estoque : 0;
                  })();
        return Math.floor(disponivel / Math.max(1, i.quantidade));
    });
    const peloEstoque = porItem.length ? Math.min(...porItem) : 0;
    return c.limite != null ? Math.min(c.limite, peloEstoque) : peloEstoque;
}

/** Preço de um item do combo comprado avulso (lote atual do ingresso, preço do produto no evento). */
export function precoAvulso(i: Combo["itens"][number], ev: Evento | undefined, biblioteca: ProdutoDaOrganizacao[], vendidos: Map<string, number>) {
    if (i.tipo === "ingresso") {
        const t = acharIngresso(ev, i.id)?.tipo;
        return t ? (loteAtual(t, vendidos)?.preco ?? faixaDePreco(t).max) : 0;
    }
    const noEvento = ev?.produtos?.find((p) => p.produtoId === i.id);
    return noEvento?.preco ?? biblioteca.find((p) => p.id === i.id)?.precoBase ?? 0;
}

export const somaAvulsa = (c: Combo, ev: Evento | undefined, biblioteca: ProdutoDaOrganizacao[], vendidos: Map<string, number>) =>
    c.itens.reduce((s, i) => s + precoAvulso(i, ev, biblioteca, vendidos) * i.quantidade, 0);

/** Nome de um item do combo, para listas e resumos. */
export function nomeDoItem(i: Combo["itens"][number], ev: Evento | undefined, biblioteca: ProdutoDaOrganizacao[]) {
    if (i.tipo === "ingresso") {
        const achado = acharIngresso(ev, i.id);
        return achado ? { nome: achado.tipo.nome, detalhe: achado.setor.nome } : { nome: "Ingresso removido", detalhe: "" };
    }
    const p = biblioteca.find((x) => x.id === i.id);
    return { nome: p?.nome ?? "Produto removido", detalhe: "" };
}

export function estadoDoCombo(c: Combo, ev: Evento | undefined, vendidos: Map<string, number>): EstadoItem {
    if (!c.ativo) return "pausado";
    if (c.itens.length === 0) return "sem-estoque";
    return disponivelDoCombo(c, ev, vendidos) > 0 ? "a-venda" : "esgotado";
}

/* ---------------- gravação ---------------- */

/** Troca um ingresso (por id) em qualquer setor; `paraSetorId` move de setor. */
export function comIngresso(ev: Evento, tipo: TipoIngresso, paraSetorId?: string): Sessao[] {
    const destino = paraSetorId ?? acharIngresso(ev, tipo.id)?.setor.id;
    return ev.sessoes.map((s) => ({
        ...s,
        grupos: s.grupos.map((g) => {
            const semEle = g.ingressos.filter((t) => t.id !== tipo.id);
            if (g.id !== destino) return { ...g, ingressos: semEle };
            const idx = g.ingressos.findIndex((t) => t.id === tipo.id);
            if (idx >= 0) return { ...g, ingressos: g.ingressos.map((t) => (t.id === tipo.id ? tipo : t)) };
            return { ...g, ingressos: [...semEle, tipo] };
        }),
    }));
}

export const semIngresso = (ev: Evento, id: string): Sessao[] => ev.sessoes.map((s) => ({ ...s, grupos: s.grupos.map((g) => ({ ...g, ingressos: g.ingressos.filter((t) => t.id !== id) })) }));

export const comSetor = (ev: Evento, sessaoId: string, setor: Grupo): Sessao[] =>
    ev.sessoes.map((s) =>
        s.id !== sessaoId ? s : { ...s, grupos: s.grupos.some((g) => g.id === setor.id) ? s.grupos.map((g) => (g.id === setor.id ? setor : g)) : [...s.grupos, setor] },
    );

export const semSetor = (ev: Evento, setorId: string): Sessao[] => ev.sessoes.map((s) => ({ ...s, grupos: s.grupos.filter((g) => g.id !== setorId) }));

/** Na simulação de escala nada é gravado: o catálogo simulado vive só na memória. */
const gravar = <A extends unknown[]>(fn: (...a: A) => Promise<unknown>) => (...a: A) => (escalaSimulada() ? Promise.resolve(undefined) : fn(...a));

export const salvarSessoes = gravar((ev: Evento, sessoes: Sessao[]) => atualizarEvento(ev.id, { sessoes }));
export const salvarProdutosDoEvento = gravar((ev: Evento, produtos: ProdutoNoEvento[]) => atualizarEvento(ev.id, { produtos }));
export const salvarCombos = gravar((ev: Evento, combos: Combo[]) => atualizarEvento(ev.id, { combos }));
export const salvarAberturas = gravar((ev: Evento, aberturas: AberturaDeVendas[]) => atualizarEvento(ev.id, { aberturas }));
export const salvarPerguntas = gravar((ev: Evento, perguntas: Pergunta[]) => atualizarEvento(ev.id, { perguntas }));
export const salvarEdicaoNaCarteira = gravar((ev: Evento, edicaoNaCarteira: EdicaoNaCarteira | null) => atualizarEvento(ev.id, { edicaoNaCarteira }));

/** Grava a biblioteca na organização (a primeira gravação materializa a inicial). */
export function salvarBiblioteca(org: Organizacao | undefined, orgId: string, produtos: ProdutoDaOrganizacao[]) {
    if (escalaSimulada()) return Promise.resolve(undefined);
    const base: Organizacao = org ?? { id: orgId, nome: orgId, sigla: "", criadoEm: new Date().toISOString() };
    return salvar("organizacoes", { ...base, produtos });
}

/** Ingresso novo, com um lote e as regras padrão (vende enquanto estiver à venda). */
export const ingressoNovo = (): TipoIngresso => {
    const id = novoId("tip");
    return { id, nome: "", ativo: true, beneficio: "inteira", lotes: [{ id: `${id}-l1`, nome: "1º lote", preco: 0, quantidade: 0 }] };
};

export const setorNovo = (nome: string): Grupo => ({ id: novoId("grp"), nome: nome.trim(), ingressos: [] });

export const comboNovo = (): Combo => ({ id: novoId("cmb"), nome: "", preco: 0, itens: [], ativo: true });

export { novoId };
