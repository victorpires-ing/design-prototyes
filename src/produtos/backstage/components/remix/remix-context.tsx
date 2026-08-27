import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useLocation } from "react-router";
import { eventos, useEventoAtual } from "../../eventos/data/eventos";
import type { Escopo } from "./remix-respostas";

/**
 * Estado do Remix.
 *
 * O agente vive na shell, não numa página: qualquer tela pode abri-lo já com
 * uma pergunta, e ele sabe sozinho se o contexto é a organização ou um evento.
 */

interface RemixContextValue {
    aberto: boolean;
    abrir: (perguntaInicial?: string, escopoForcado?: Escopo) => void;
    fechar: () => void;
    alternar: () => void;
    /** Pergunta enviada por outra tela, consumida uma única vez pelo painel. */
    perguntaPendente: string | null;
    limparPergunta: () => void;
    escopo: Escopo;
    /** Rótulo do contexto atual, mostrado no cabeçalho do painel. */
    escopoLabel: string;
}

const RemixContext = createContext<RemixContextValue | null>(null);

const nomeDoEvento = (id: string) => eventos.find((e) => e.id === id)?.nome;

/** Rotas da organização — fora delas, o contexto é o evento aberto. */
const ROTAS_ORGANIZACAO = ["/backstage/eventos", "/backstage/home", "/backstage/membros", "/backstage/publico"];

export function RemixProvider({ children }: { children: ReactNode }) {
    const { pathname } = useLocation();
    const evento = useEventoAtual();
    const [aberto, setAberto] = useState(false);
    const [perguntaPendente, setPerguntaPendente] = useState<string | null>(null);
    /** Escopo pedido por quem abriu o agente — vence o escopo da rota. */
    const [escopoForcado, setEscopoForcado] = useState<Escopo | null>(null);

    const naOrganizacao = pathname === "/backstage" || ROTAS_ORGANIZACAO.some((rota) => pathname.startsWith(rota));

    const abrir = useCallback((pergunta?: string, escopo?: Escopo) => {
        if (pergunta) setPerguntaPendente(pergunta);
        if (escopo) setEscopoForcado(escopo);
        setAberto(true);
    }, []);

    const value = useMemo<RemixContextValue>(
        () => ({
            aberto,
            abrir,
            fechar: () => {
                setAberto(false);
                setEscopoForcado(null);
            },
            alternar: () => setAberto((atual) => !atual),
            perguntaPendente,
            limparPergunta: () => setPerguntaPendente(null),
            escopo: escopoForcado ?? (naOrganizacao ? { tipo: "organizacao" } : { tipo: "evento", eventoId: evento.id }),
            escopoLabel:
                escopoForcado?.tipo === "evento"
                    ? (nomeDoEvento(escopoForcado.eventoId) ?? evento.nome)
                    : naOrganizacao
                      ? "Todos os eventos"
                      : evento.nome,
        }),
        [aberto, abrir, perguntaPendente, naOrganizacao, evento, escopoForcado],
    );

    return <RemixContext.Provider value={value}>{children}</RemixContext.Provider>;
}

export function useRemix() {
    const context = useContext(RemixContext);
    if (!context) throw new Error("useRemix precisa estar dentro de RemixProvider");
    return context;
}

/** Versão tolerante, para telas que podem existir fora do Backstage. */
export const useRemixOpcional = () => useContext(RemixContext);
