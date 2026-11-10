import { createContext, useCallback, useContext, useMemo } from "react";
import type { ReactNode } from "react";
import { cancelarIngresso, cancelarPedido, emitirCortesias, novoId, renomearEnvio, useColecao, useDoc } from "@/plataforma";
import { useEventoAtual } from "../../eventos/data/eventos";
import type { CortesiaItem, ItemStatus } from "./item-types";
import { dataDaSessao, lerIdDoItem, useCatalogoDeCortesia } from "./plataforma";

/*
 * Cortesias do evento em contexto, lidas e gravadas no banco unificado (src/plataforma).
 * Um envio vira um pedido por destinatário, no canal cortesia, já emitido: o ingresso vai para a
 * carteira do e-mail. "Pedido" nesta tela é o envio inteiro (todos os destinatários).
 */

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

export type PedidoStatus = "emitido" | "cancelado";

export interface Pedido {
    id: string;
    nome: string;
    emissor: string;
    status: PedidoStatus;
    dataEnvio: string;
}

export interface AddPedidoInput {
    nome: string;
    emails: string[];
    itemIds: string[];
    emissor?: string;
}

interface CortesiasStoreValue {
    pedidos: Pedido[];
    itens: CortesiaItem[];
    addPedido: (input: AddPedidoInput) => Pedido;
    cancelPedido: (id: string) => void;
    cancelPedidos: (ids: Set<string>) => void;
    cancelItem: (id: string) => void;
    cancelItens: (ids: Set<string>) => void;
    renamePedido: (id: string, nome: string) => void;
}

const CortesiasContext = createContext<CortesiasStoreValue | null>(null);

const DEFAULT_EMISSOR = "Victor Pires";

const p2 = (n: number) => n.toString().padStart(2, "0");
const formatar = (iso: string) => {
    const d = new Date(iso);
    return `${p2(d.getDate())}/${p2(d.getMonth() + 1)}/${d.getFullYear()} ${p2(d.getHours())}:${p2(d.getMinutes())}`;
};

/* ------------------------------------------------------------------ */
/*  Provider                                                          */
/* ------------------------------------------------------------------ */

export function CortesiasProvider({ children }: { children: ReactNode }) {
    // Mantém o catálogo de cortesia (SESSIONS) igual ao do evento em contexto.
    useCatalogoDeCortesia();
    const evento = useEventoAtual();
    const pedidosBanco = useColecao("pedidos");
    const ingressosBanco = useColecao("ingressos");
    const usuarios = useColecao("usuarios");
    const eventoDoc = useDoc("eventos", evento.id);

    const doEvento = useMemo(
        () => pedidosBanco.filter((p) => p.canal === "cortesia" && p.eventoId === evento.id && p.envio).sort((a, b) => b.criadoEm.localeCompare(a.criadoEm)),
        [pedidosBanco, evento.id],
    );

    const pedidos = useMemo<Pedido[]>(() => {
        const porEnvio = new Map<string, typeof doEvento>();
        for (const p of doEvento) porEnvio.set(p.envio!.id, [...(porEnvio.get(p.envio!.id) ?? []), p]);
        return [...porEnvio.entries()].map(([id, lista]) => ({
            id,
            nome: lista[0].envio!.nome,
            emissor: lista[0].envio!.emissor,
            status: lista.every((p) => p.status === "cancelado") ? "cancelado" : "emitido",
            dataEnvio: formatar(lista[lista.length - 1].criadoEm),
        }));
    }, [doEvento]);

    const itens = useMemo<CortesiaItem[]>(() => {
        const comConta = new Set(usuarios.map((u) => u.email));
        const envioDoPedido = new Map(doEvento.map((p) => [p.id, p]));
        return ingressosBanco
            .filter((i) => envioDoPedido.has(i.pedidoId))
            .map((i) => {
                const pedido = envioDoPedido.get(i.pedidoId)!;
                const inicio = eventoDoc?.sessoes.find((s) => s.id === i.sessaoId)?.inicio;
                const sessao = inicio ? dataDaSessao(inicio) : "";
                // Sem conta Ingresse o ingresso fica pendente até o cadastro com o mesmo e-mail.
                const status: ItemStatus = i.status === "cancelado" ? "cancelado" : comConta.has(i.titular.email) ? "aceito" : "pendente";
                return {
                    id: i.id,
                    kind: "ticket" as const,
                    nome: i.rotulo.ingresso,
                    subtitulo: [i.rotulo.grupo, sessao].filter(Boolean).join(" · "),
                    status,
                    emissor: pedido.envio!.emissor,
                    email: i.titular.email,
                    documento: "—",
                    transferido: i.status === "transferido",
                    pedidoId: pedido.envio!.id,
                };
            });
    }, [ingressosBanco, doEvento, usuarios, eventoDoc]);

    const addPedido = useCallback(
        (input: AddPedidoInput) => {
            const envio = { id: novoId("env"), nome: input.nome.trim() || "Pedido sem nome", emissor: input.emissor ?? DEFAULT_EMISSOR };
            const refs = input.itemIds.map(lerIdDoItem).filter((r): r is NonNullable<typeof r> => r !== null);
            void emitirCortesias({ eventoId: evento.id, envio, emails: input.emails, itens: refs });
            return { id: envio.id, nome: envio.nome, emissor: envio.emissor, status: "emitido" as const, dataEnvio: formatar(new Date().toISOString()) };
        },
        [evento.id],
    );

    const pedidosDoEnvio = useCallback((ids: Set<string>) => doEvento.filter((p) => ids.has(p.envio!.id)), [doEvento]);

    const cancelPedidos = useCallback((ids: Set<string>) => void Promise.all(pedidosDoEnvio(ids).map((p) => cancelarPedido(p.id))), [pedidosDoEnvio]);
    const cancelPedido = useCallback((id: string) => cancelPedidos(new Set([id])), [cancelPedidos]);
    const cancelItens = useCallback((ids: Set<string>) => void Promise.all([...ids].map((id) => cancelarIngresso(id))), []);
    const cancelItem = useCallback((id: string) => cancelItens(new Set([id])), [cancelItens]);
    const renamePedido = useCallback((id: string, nome: string) => {
        const next = nome.trim();
        if (next) void renomearEnvio(id, next);
    }, []);

    return (
        <CortesiasContext.Provider value={{ pedidos, itens, addPedido, cancelPedido, cancelPedidos, cancelItem, cancelItens, renamePedido }}>
            {children}
        </CortesiasContext.Provider>
    );
}

export function useCortesiasStore() {
    const ctx = useContext(CortesiasContext);
    if (!ctx) {
        throw new Error("useCortesiasStore must be used inside CortesiasProvider");
    }
    return ctx;
}
