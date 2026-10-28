/* ------------------------------------------------------------------ */
/*  Store do Gerenciamento de cotas (escopo do protótipo).             */
/*                                                                      */
/*  Um grupo guarda tudo o que foi configurado no fluxo de criação:     */
/*  nome, onde atua (PDV, Cortesia ou Bilheteria — um canal por grupo), */
/*  os grupos de Membros e os e-mails avulsos (de onde vêm os           */
/*  operadores), os itens                                               */
/*  que pode operar e como a cota é controlada. Listagem e detalhe      */
/*  leem só daqui — o que aparece adiante é exatamente o que foi        */
/*  configurado.                                                        */
/* ------------------------------------------------------------------ */

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router";
import { ITEM_POR_ID } from "./catalogo-evento";
import { gruposDeExemplo } from "./grupos-exemplo";
import { GRUPO_MEMBROS_POR_ID } from "./membros";

export type Atuacao = "pdv" | "cortesia" | "bilheteria";

export type TipoCota = "sem-limite" | "compartilhada" | "por-item";

export interface CotaGrupo {
    tipo: TipoCota;
    /** Cota compartilhada: um saldo único para o grupo, somando todos os itens. */
    total: number;
    /** Cota por item: limite de cada item — chave é o id do item. */
    porItem: Record<string, number>;
}

export interface GrupoCotas {
    id: string;
    nome: string;
    ativo: boolean;
    criadoEm: string;
    /** Canal em que o grupo atua: um só por grupo. */
    atuacao: Atuacao;
    /** Grupos de Membros vinculados: os membros deles viram operadores. */
    gruposMembrosIds: string[];
    /** Pessoas incluídas uma a uma, por e-mail, além dos grupos. */
    emailsAvulsos: string[];
    /** Todos os operadores: membros dos grupos vinculados + e-mails avulsos, sem repetição. */
    operadores: string[];
    /** E-mails desligados individualmente no detalhe. */
    operadoresInativos: string[];
    /** Grupos de Membros desligados por inteiro no detalhe (os membros deles ficam sem acesso). */
    gruposInativos: string[];
    itens: string[];
    cota: CotaGrupo;
    /** Quanto já foi operado de cada item. Grupo novo nasce zerado. */
    usoPorItem: Record<string, number>;
    /** Quanto cada operador já emitiu. Grupo novo nasce zerado. */
    emitidosPorOperador: Record<string, number>;
}

export type DadosGrupo = Pick<GrupoCotas, "nome" | "atuacao" | "gruposMembrosIds" | "emailsAvulsos" | "operadores" | "itens" | "cota">;

export const ATUACOES: Array<{ id: Atuacao; label: string }> = [
    { id: "pdv", label: "PDV" },
    { id: "cortesia", label: "Cortesia" },
    { id: "bilheteria", label: "Bilheteria Online" },
];

/** "PDV", "Cortesia" ou "Bilheteria Online". */
export const ROTULO_ATUACAO = Object.fromEntries(ATUACOES.map((a) => [a.id, a.label])) as Record<Atuacao, string>;

export const ROTULO_COTA: Record<TipoCota, string> = {
    "sem-limite": "Sem limite de cotas",
    compartilhada: "Cota compartilhada",
    "por-item": "Cota por item",
};

export const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;

/** Itens do grupo que ainda existem no catálogo, na ordem em que foram escolhidos. */
export const itensValidos = (g: Pick<GrupoCotas, "itens">) => g.itens.filter((id) => ITEM_POR_ID[id]);

export const usadasDoGrupo = (g: GrupoCotas) => itensValidos(g).reduce((soma, id) => soma + (g.usoPorItem[id] ?? 0), 0);

/** Limite total do grupo: o saldo compartilhado, a soma das cotas por item, ou nenhum. */
export function limiteDoGrupo(g: GrupoCotas): number | null {
    if (g.cota.tipo === "sem-limite") return null;
    if (g.cota.tipo === "compartilhada") return g.cota.total;
    return itensValidos(g).reduce((soma, id) => soma + (g.cota.porItem[id] ?? 0), 0);
}

export const porcentagem = (usadas: number, total: number) => (total > 0 ? Math.min(100, Math.round((usadas / total) * 100)) : 0);

/*
 * Cada teste começa do zero: os grupos vivem só em memória, então atualizar a
 * página volta ao estado vazio. Navegar dentro do protótipo mantém tudo.
 */
const LISTAGEM = "/backstage/equipe-de-operacao/v3";

// Versões anteriores do protótipo salvavam aqui; limpa para não sobrar lixo no navegador.
const CHAVES_ANTIGAS = ["gerenciamento-cotas:grupos:v2", "equipe-v3:grupos"];

interface EquipeV3ContextValue {
    grupos: GrupoCotas[];
    getGrupo: (id: string) => GrupoCotas | undefined;
    criarGrupo: (dados: DadosGrupo) => GrupoCotas;
    /** Salva a edição sem perder o histórico de uso dos itens e operadores que continuam. */
    atualizarGrupo: (id: string, dados: DadosGrupo) => void;
    setAtivo: (id: string, ativo: boolean) => void;
    /** Troca a cota de um item num grupo de cota por item. */
    setCotaItem: (id: string, itemId: string, cota: number) => void;
    /** Troca a cota total de um grupo de cota compartilhada. */
    setCotaTotal: (id: string, total: number) => void;
    /** Liga/desliga um operador dentro do grupo, sem removê-lo. */
    toggleOperador: (id: string, email: string) => void;
    /** "Editar operadores" no detalhe: troca os grupos de Membros e os e-mails avulsos. */
    setOperadores: (id: string, gruposMembrosIds: string[], emailsAvulsos: string[]) => void;
    /** Liga/desliga um grupo de Membros inteiro dentro do grupo de cotas. */
    toggleGrupoMembros: (id: string, grupoMembrosId: string) => void;
    grupoMembrosAtivo: (grupo: GrupoCotas, grupoMembrosId: string) => boolean;
    operadorAtivo: (grupo: GrupoCotas, email: string) => boolean;
}

const EquipeV3Context = createContext<EquipeV3ContextValue | null>(null);

export function EquipeV3Provider({ children }: { children: ReactNode }) {
    const [grupos, setGrupos] = useState<GrupoCotas[]>([]);
    const navigate = useNavigate();
    const { pathname } = useLocation();

    // Refresh numa tela interna do fluxo (criar, detalhe, edição) volta para o início:
    // o grupo que ela mostraria não existe mais na memória. Roda só ao carregar a página.
    useEffect(() => {
        CHAVES_ANTIGAS.forEach((chave) => {
            try {
                window.localStorage.removeItem(chave);
            } catch {
                /* storage indisponível */
            }
        });
        if (pathname.startsWith(`${LISTAGEM}/`)) navigate(LISTAGEM, { replace: true });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const getGrupo = useCallback((id: string) => grupos.find((g) => g.id === id), [grupos]);

    const criarGrupo = useCallback((dados: DadosGrupo) => {
        const novo: GrupoCotas = {
            ...dados,
            id: `g${Date.now()}`,
            nome: dados.nome.trim(),
            ativo: true,
            criadoEm: new Date().toISOString(),
            operadoresInativos: [],
            gruposInativos: [],
            usoPorItem: {},
            emitidosPorOperador: {},
        };
        // O primeiro grupo do participante chega acompanhado dos exemplos: a listagem
        // passa a mostrar as combinações de atuação e cota, com o dele no topo.
        // Um exemplo com o mesmo nome fica de fora, para a listagem não ter dois iguais.
        const mesmoNome = (g: GrupoCotas) => g.nome.toLowerCase() === novo.nome.toLowerCase();
        const exemplos = () => gruposDeExemplo().filter((g) => !mesmoNome(g));
        setGrupos((prev) => (prev.length === 0 ? [novo, ...exemplos()] : [novo, ...prev]));
        return novo;
    }, []);

    const atualizarGrupo = useCallback((id: string, dados: DadosGrupo) => {
        setGrupos((prev) =>
            prev.map((g) =>
                g.id === id
                    ? {
                          ...g,
                          ...dados,
                          nome: dados.nome.trim(),
                          operadoresInativos: g.operadoresInativos.filter((e) => dados.operadores.includes(e)),
                          gruposInativos: g.gruposInativos.filter((m) => dados.gruposMembrosIds.includes(m)),
                      }
                    : g,
            ),
        );
    }, []);

    const setCotaItem = useCallback((id: string, itemId: string, cota: number) => {
        setGrupos((prev) => prev.map((g) => (g.id === id ? { ...g, cota: { ...g.cota, porItem: { ...g.cota.porItem, [itemId]: cota } } } : g)));
    }, []);

    const setCotaTotal = useCallback((id: string, total: number) => {
        setGrupos((prev) => prev.map((g) => (g.id === id ? { ...g, cota: { ...g.cota, total } } : g)));
    }, []);

    const setAtivo = useCallback((id: string, ativo: boolean) => {
        setGrupos((prev) => prev.map((g) => (g.id === id ? { ...g, ativo } : g)));
    }, []);

    const toggleOperador = useCallback((id: string, email: string) => {
        setGrupos((prev) =>
            prev.map((g) => {
                if (g.id !== id) return g;
                const inativos = g.operadoresInativos;
                return {
                    ...g,
                    operadoresInativos: inativos.includes(email) ? inativos.filter((e) => e !== email) : [...inativos, email],
                };
            }),
        );
    }, []);

    const setOperadores = useCallback((id: string, gruposMembrosIds: string[], emailsAvulsos: string[]) => {
        const operadores = [...new Set([...gruposMembrosIds.flatMap((m) => GRUPO_MEMBROS_POR_ID[m]?.emails ?? []), ...emailsAvulsos])];
        setGrupos((prev) =>
            prev.map((g) =>
                g.id === id
                    ? {
                          ...g,
                          gruposMembrosIds,
                          emailsAvulsos,
                          operadores,
                          // Quem saiu leva junto o "desligado"; quem continua mantém o estado.
                          operadoresInativos: g.operadoresInativos.filter((e) => operadores.includes(e)),
                          gruposInativos: g.gruposInativos.filter((m) => gruposMembrosIds.includes(m)),
                      }
                    : g,
            ),
        );
    }, []);

    const toggleGrupoMembros = useCallback((id: string, grupoMembrosId: string) => {
        setGrupos((prev) =>
            prev.map((g) => {
                if (g.id !== id) return g;
                const inativos = g.gruposInativos;
                return {
                    ...g,
                    gruposInativos: inativos.includes(grupoMembrosId) ? inativos.filter((m) => m !== grupoMembrosId) : [...inativos, grupoMembrosId],
                };
            }),
        );
    }, []);

    const grupoMembrosAtivo = useCallback((grupo: GrupoCotas, grupoMembrosId: string) => !grupo.gruposInativos.includes(grupoMembrosId), []);

    // Ativo = não foi desligado sozinho e entra por algum caminho ligado: e-mail avulso ou um grupo de Membros ativo.
    const operadorAtivo = useCallback((grupo: GrupoCotas, email: string) => {
        if (grupo.operadoresInativos.includes(email)) return false;
        if (grupo.emailsAvulsos.includes(email)) return true;
        return grupo.gruposMembrosIds.some((m) => !grupo.gruposInativos.includes(m) && GRUPO_MEMBROS_POR_ID[m]?.emails.includes(email));
    }, []);

    const value = useMemo<EquipeV3ContextValue>(
        () => ({
            grupos,
            getGrupo,
            criarGrupo,
            atualizarGrupo,
            setAtivo,
            setCotaItem,
            setCotaTotal,
            toggleOperador,
            setOperadores,
            toggleGrupoMembros,
            grupoMembrosAtivo,
            operadorAtivo,
        }),
        [
            grupos,
            getGrupo,
            criarGrupo,
            atualizarGrupo,
            setAtivo,
            setCotaItem,
            setCotaTotal,
            toggleOperador,
            setOperadores,
            toggleGrupoMembros,
            grupoMembrosAtivo,
            operadorAtivo,
        ],
    );

    return <EquipeV3Context.Provider value={value}>{children}</EquipeV3Context.Provider>;
}

export function useEquipeV3() {
    const ctx = useContext(EquipeV3Context);
    if (!ctx) throw new Error("useEquipeV3 deve ser usado dentro de <EquipeV3Provider>.");
    return ctx;
}
