import type { Evento as EventoBanco, Sessao as SessaoBanco, TipoIngresso } from "@/plataforma";
import { brl, loteAtual, novoId, saldoDoLote } from "@/plataforma";
import type { Grupo, Ingresso, Sessao } from "./ingressos";

/* ------------------------------------------------------------------ */
/*  Adaptador: catálogo do banco ⇄ tipos de tela da página Ingressos   */
/*                                                                     */
/*  A tela guarda preço e emissões como texto já formatado; o banco    */
/*  guarda número. Por isso a volta (paraBanco) casa por id com o      */
/*  catálogo original em vez de reler os textos.                       */
/* ------------------------------------------------------------------ */

const DIAS = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
const p2 = (n: number) => String(n).padStart(2, "0");
const num = (n: number) => n.toLocaleString("pt-BR");

const rotuloSessao = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return { label: iso, diaSemana: "" };
    return { label: `${p2(d.getDate())}/${p2(d.getMonth() + 1)}/${d.getFullYear()} às ${p2(d.getHours())}:${p2(d.getMinutes())}`, diaSemana: DIAS[d.getDay()] };
};

const ingressoView = (t: TipoIngresso, vendidos: Map<string, number>): Ingresso => {
    const atual = loteAtual(t, vendidos);
    const idxAtual = atual ? t.lotes.indexOf(atual) : -1;
    const totalQ = t.lotes.reduce((a, l) => a + l.quantidade, 0);
    const totalV = t.lotes.reduce((a, l) => a + (vendidos.get(l.id) ?? 0), 0);
    const precos = t.lotes.map((l) => l.preco);
    return {
        id: t.id,
        name: t.nome,
        active: t.ativo,
        lotesLabel: t.lotes.length === 0 ? "Sem lotes" : atual ? `${idxAtual + 1} de ${t.lotes.length} lotes à venda` : "Esgotado",
        virada: t.lotes.length > 1 ? "Por quantidade" : "Individual",
        preco: brl(atual?.preco ?? precos[0] ?? 0),
        precoAte: precos.length > 1 ? `até ${brl(Math.max(...precos))}` : undefined,
        emissoes: `${num(totalV)} de ${num(totalQ)}`,
        pendente: "0 pendente",
        lotes: t.lotes.map((l, i) => ({
            id: l.id,
            name: l.nome,
            auto: i === 0,
            virada: saldoDoLote(l, vendidos) === 0 ? "Esgotado" : l === atual ? "À venda" : "Aguardando",
            preco: brl(l.preco),
            emissoes: `${num(vendidos.get(l.id) ?? 0)} de ${num(l.quantidade)}`,
        })),
    };
};

export function paraView(ev: EventoBanco, vendidos: Map<string, number>): Sessao[] {
    return ev.sessoes.map((s) => ({
        id: s.id,
        ...rotuloSessao(s.inicio),
        grupos: s.grupos.map((g): Grupo => {
            const lotes = g.ingressos.flatMap((t) => t.lotes);
            return {
                id: g.id,
                name: g.nome,
                acesso: g.acesso ?? "",
                emissoes: `${num(lotes.reduce((a, l) => a + (vendidos.get(l.id) ?? 0), 0))} de ${num(lotes.reduce((a, l) => a + l.quantidade, 0))}`,
                pendentes: "0",
                ingressos: g.ingressos.map((t) => ingressoView(t, vendidos)),
            };
        }),
    }));
}

/** Reaplica ordem, ativação e cópias feitas na tela sobre o catálogo do banco. */
export function paraBanco(ev: EventoBanco, view: Sessao[], ativos: Set<string>): SessaoBanco[] {
    const tipos = new Map<string, TipoIngresso>();
    ev.sessoes.forEach((s) => s.grupos.forEach((g) => g.ingressos.forEach((t) => tipos.set(t.id, t))));
    const origemDaCopia = (id: string) => [...tipos.values()].filter((t) => id.startsWith(`${t.id}-g`)).sort((a, b) => b.id.length - a.id.length)[0];

    return view.map((sv) => {
        const sb = ev.sessoes.find((s) => s.id === sv.id);
        return {
            id: sv.id,
            inicio: sb?.inicio ?? ev.data,
            grupos: sv.grupos.map((gv) => {
                const gb = ev.sessoes.flatMap((s) => s.grupos).find((g) => g.id === gv.id);
                return {
                    id: gv.id,
                    nome: gb?.nome ?? gv.name,
                    acesso: gb?.acesso ?? gv.acesso,
                    ingressos: gv.ingressos.flatMap((iv): TipoIngresso[] => {
                        const t = tipos.get(iv.id) ?? origemDaCopia(iv.id);
                        if (!t) return [];
                        const lotes = t.id === iv.id ? t.lotes : t.lotes.map((l, i) => ({ ...l, id: iv.lotes[i]?.id ?? `${l.id}-${iv.id}` }));
                        return [{ ...t, id: iv.id, lotes, ativo: ativos.has(iv.id) }];
                    }),
                };
            }),
        };
    });
}

export interface NovoIngresso {
    sessaoId: string;
    grupo: string;
    acesso?: string;
    nome: string;
    descricao?: string;
    preco: number;
    quantidade: number;
    /** Cria junto a meia-entrada (metade do preço, 40% da quantidade). */
    comMeia: boolean;
}

/** Adiciona um ingresso (com lote único) ao grupo de mesmo nome na sessão, criando o grupo se preciso. */
export function adicionarIngresso(ev: EventoBanco, n: NovoIngresso): SessaoBanco[] {
    const tipo = (nome: string, preco: number, quantidade: number, beneficio: "inteira" | "meia-entrada"): TipoIngresso => {
        const id = novoId("tip");
        return { id, nome, beneficio, descricao: beneficio === "inteira" ? n.descricao : "Com documento que comprove o direito à meia-entrada.", ativo: true, lotes: [{ id: `${id}-l1`, nome: "1º lote", preco, quantidade }] };
    };
    const novos = [tipo(n.nome, n.preco, n.quantidade, "inteira")];
    if (n.comMeia) novos.push(tipo("Meia-entrada", Math.round(n.preco * 50) / 100, Math.max(1, Math.round(n.quantidade * 0.4)), "meia-entrada"));

    return ev.sessoes.map((s) => {
        if (s.id !== n.sessaoId) return s;
        const existe = s.grupos.find((g) => g.nome.trim().toLowerCase() === n.grupo.trim().toLowerCase());
        if (existe) return { ...s, grupos: s.grupos.map((g) => (g === existe ? { ...g, ingressos: [...g.ingressos, ...novos] } : g)) };
        return { ...s, grupos: [...s.grupos, { id: novoId("grp"), nome: n.grupo.trim(), acesso: n.acesso, ingressos: novos }] };
    });
}
