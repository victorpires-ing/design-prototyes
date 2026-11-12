import { useEffect, useMemo } from "react";
import { organizacaoDoEvento, useBanco, useColecao, type Evento } from "@/plataforma";
import {
    condicoesNoEvento,
    semear,
    totais,
    useEstadoComissarios,
    type Comissario,
    type ComissarioNoEvento,
    type Condicoes,
    type PessoaDoComissario,
    type Repasse,
    type Totais,
    type VendaAtribuida,
} from "@/plataforma/comissarios";
import { setEventoAtual } from "../../eventos/data/eventos";
import { setOrganizacaoAtual } from "../../organizacoes/data/organizacao-atual";
import { emissoesDoGrupo, gruposDaPessoa, limiteDoCanal, usadasDoCanal, type GrupoEquipe } from "@/plataforma/equipe";
import { funcoesDoVinculo, pausadoNoEvento, type Funcao } from "./funcoes";
import { USUARIO } from "./usuario";

/* ------------------------------------------------------------------ */
/*  Dados do painel Freepass (o Backstage de quem não é da produtora). */
/*                                                                     */
/*  Quem entra no Freepass não é membro da organização: vê, de todas   */
/*  as organizações que o liberaram, só os eventos e o que é dele. O   */
/*  responsável vê tudo do comissário e o que tem a receber; o         */
/*  vendedor vê só o que vendeu.                                       */
/* ------------------------------------------------------------------ */

export { USUARIO } from "./usuario";

export interface Participacao {
    comissario: Comissario;
    papel: PessoaDoComissario["papel"];
    organizacao: string;
    evento: Evento;
    vinculo: ComissarioNoEvento;
    cond: Condicoes & { herdadas: boolean };
    vendas: VendaAtribuida[];
    repasses: Repasse[];
    t: Totais;
    /** Evento já aconteceu ou foi encerrado: não vende mais. */
    passou: boolean;
    /** Pausado pelo organizador (no evento ou no cadastro). */
    pausado: boolean;
    /** O que a pessoa faz neste evento (FCO-80). */
    funcoes: Funcao[];
}

/** Segue o status do Backstage: as datas da seed estão no passado, mas os eventos continuam vendendo no protótipo. */
const passou = (e: Evento) => e.status === "encerrado";

/** Semeia os comissários de todas as organizações (as que ainda não abriram Comissários no Backstage). */
export function useSemearComissarios(ativo = true) {
    const { modo } = useBanco();
    const eventos = useColecao("eventos");
    useEffect(() => {
        if (!ativo || modo === "carregando") return;
        const porOrg = new Map<string, Evento[]>();
        for (const e of eventos) porOrg.set(organizacaoDoEvento(e), [...(porOrg.get(organizacaoDoEvento(e)) ?? []), e]);
        for (const [orgId, lista] of porOrg) semear(orgId, lista);
    }, [ativo, modo, eventos]);
}

/** Pessoa logada em cada comissário de que faz parte. */
const minhasPessoas = (comissarios: Comissario[]) =>
    comissarios
        .map((c) => ({ c, pessoa: c.pessoas.find((p) => p.email.toLowerCase() === USUARIO.email) }))
        .filter((x): x is { c: Comissario; pessoa: PessoaDoComissario } => !!x.pessoa);

export function useMinhasVendas() {
    const { modo } = useBanco();
    const eventos = useColecao("eventos");
    const organizacoes = useColecao("organizacoes");
    const estado = useEstadoComissarios();
    const grupos = estado.grupos;
    useSemearComissarios();

    const participacoes = useMemo<Participacao[]>(() => {
        const lista: Participacao[] = [];
        for (const { c, pessoa } of minhasPessoas(estado.comissarios))
            for (const v of estado.vinculos.filter((x) => x.comissarioId === c.id)) {
                const evento = eventos.find((e) => e.id === v.eventoId);
                if (!evento) continue;
                const responsavel = pessoa.papel === "responsavel";
                const vendas = estado.vendas.filter((x) => x.comissarioId === c.id && x.eventoId === v.eventoId && (responsavel || x.vendedor === pessoa.nome));
                const dosGrupos = outrosGrupos(grupos, v.grupoId, evento.id).flatMap(emissoesDoGrupo);
                const repasses = responsavel ? estado.repasses.filter((r) => r.comissarioId === c.id && r.eventoId === v.eventoId) : [];
                lista.push({
                    comissario: c,
                    papel: pessoa.papel,
                    organizacao: organizacoes.find((o) => o.id === organizacaoDoEvento(evento))?.nome ?? evento.produtora,
                    evento,
                    vinculo: v,
                    cond: condicoesNoEvento(c, v),
                    vendas,
                    repasses,
                    t: totais(vendas, repasses),
                    passou: passou(evento),
                    pausado: pausadoNoEvento(c, v, dosGrupos),
                    funcoes: funcoesDoVinculo(v, pausadoNoEvento(c, v, dosGrupos), dosGrupos, vendas.length > 0),
                });
            }
        return lista.sort((a, b) => a.evento.data.localeCompare(b.evento.data));
    }, [estado, eventos, organizacoes, grupos]);

    const geral = useMemo(
        () => totais(participacoes.flatMap((p) => p.vendas), participacoes.flatMap((p) => p.repasses)),
        [participacoes],
    );

    const carregando = modo === "carregando" || eventos.length === 0;
    return { carregando, participacoes, geral };
}

export interface AcessoNoEvento {
    comissario: Comissario;
    pessoa: PessoaDoComissario;
    vinculo: ComissarioNoEvento;
    pausado: boolean;
    /** O que a pessoa faz no evento: link do vínculo, cortesia e bilheteria dos grupos de operação. */
    funcoes: Funcao[];
    /** Cortesias que ainda pode emitir; null = sem cota. */
    saldoCortesias: number | null;
}

/**
 * O que a pessoa logada pode fazer no evento: é o que o menu do evento no Freepass libera
 * (FCO-62). Sem vínculo, nada. Lê só o store, sem semear: quem semeia é a shell do painel.
 */
export function useAcessoNoEvento(eventoId: string, ativo = true): AcessoNoEvento | null {
    const estado = useEstadoComissarios();
    const grupos = estado.grupos;
    return useMemo(() => {
        if (!ativo) return null;
        for (const { c, pessoa } of minhasPessoas(estado.comissarios)) {
            const vinculo = estado.vinculos.find((v) => v.comissarioId === c.id && v.eventoId === eventoId);
            if (!vinculo) continue;
            const dosGrupos = outrosGrupos(grupos, vinculo.grupoId, eventoId).flatMap(emissoesDoGrupo);
            const pausado = pausadoNoEvento(c, vinculo, dosGrupos);
            const temVendas = estado.vendas.some((v) => v.comissarioId === c.id && v.eventoId === eventoId);
            // Cota de cortesia: a do canal Cortesia do grupo do comissário e dos outros grupos em que a
            // pessoa está (a cota é do grupo, não da pessoa). Sem canal ligado, não envia.
            const doComissario = grupos.find((g) => g.id === vinculo.grupoId);
            const deCortesia = [...(doComissario ? [doComissario] : []), ...outrosGrupos(grupos, vinculo.grupoId, eventoId)]
                .map((g) => g.canais.cortesia)
                .filter((x): x is NonNullable<GrupoEquipe["canais"]["cortesia"]> => !!x?.ligado);
            const saldoCortesias = deCortesia.some((x) => limiteDoCanal(x) === null)
                ? null
                : deCortesia.reduce((s, x) => s + Math.max(0, (limiteDoCanal(x) ?? 0) - usadasDoCanal(x)), 0);
            return {
                comissario: c,
                pessoa,
                vinculo,
                pausado,
                funcoes: funcoesDoVinculo(vinculo, pausado, dosGrupos, temVendas),
                saldoCortesias,
            };
        }
        return null;
    }, [estado, eventoId, ativo, grupos]);
}

/** Outros grupos do evento (além do do comissário) em que a pessoa logada está ligada. */
const outrosGrupos = (grupos: GrupoEquipe[], grupoDoComissario: string, eventoId: string) =>
    gruposDaPessoa(grupos, USUARIO.email, eventoId).filter((g) => g.id !== grupoDoComissario);

/** Abre o evento no painel: a organização dele vira a de contexto e ele, o evento em contexto. */
export function abrirEventoNoPainel(evento: Evento) {
    setOrganizacaoAtual(organizacaoDoEvento(evento));
    setEventoAtual(evento.id);
}

/** "Ana R.": o comissário vê quem comprou sem o nome completo (dado pessoal de quem compra). */
export const nomeCurto = (nome: string) => {
    const [primeiro, ...resto] = nome.split(" ");
    const ultimo = resto.at(-1);
    return ultimo ? `${primeiro} ${ultimo[0]}.` : primeiro;
};
