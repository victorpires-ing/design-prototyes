import { createContext, useCallback, useContext, useState } from "react";
import type { ReactNode } from "react";
import { getItemDetails } from "./cortesia-items";
import type { CortesiaItem, ItemStatus } from "./item-types";

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
}

const CortesiasContext = createContext<CortesiasStoreValue | null>(null);

const DEFAULT_EMISSOR = "Victor Pires";

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function emailHasCadastro(email: string): boolean {
    let h = 0;
    for (let i = 0; i < email.length; i++) {
        h = (h * 31 + email.charCodeAt(i)) >>> 0;
    }
    return h % 10 < 3;
}

// Demo: random distribution skewed toward "aceito" but with reasonable
// representation of every state so the report screens stay interesting.
const RANDOM_ITEM_STATUSES: ItemStatus[] = [
    "aceito",
    "aceito",
    "aceito",
    "aceito",
    "aceito",
    "pendente",
    "pendente",
    "processando",
    "cancelado",
    "erro",
];

function randomItemStatus(): ItemStatus {
    return RANDOM_ITEM_STATUSES[Math.floor(Math.random() * RANDOM_ITEM_STATUSES.length)];
}

function randomPedidoStatus(): PedidoStatus {
    // ~15% of pedidos start as cancelado for variety
    return Math.random() < 0.15 ? "cancelado" : "emitido";
}

function hashSeed(seed: string): number {
    let h = 0;
    for (let i = 0; i < seed.length; i++) {
        h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    }
    return h;
}

function generateId(): string {
    const rand = () =>
        Math.floor(Math.random() * 0xffffffff)
            .toString(16)
            .padStart(8, "0");
    return `${rand()}-${rand().slice(0, 4)}-${rand().slice(0, 4)}-${rand().slice(0, 4)}-${rand()}${rand().slice(0, 4)}`;
}

function formatNow(): string {
    const d = new Date();
    const p = (n: number) => n.toString().padStart(2, "0");
    return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function generateDoc(seed: string): string {
    const h = hashSeed(seed);
    const base = ((h % 900_000_000) + 100_000_000).toString();
    const dv = ((h % 90) + 10).toString();
    return `${base.slice(0, 3)}.${base.slice(3, 6)}.${base.slice(6, 9)}-${dv}`;
}

function deriveItemNomeSubtitulo(itemId: string): { nome: string; subtitulo: string } | null {
    const details = getItemDetails(itemId);
    if (!details) return null;
    if (details.kind === "ticket") {
        return {
            nome: details.name,
            subtitulo: `${details.groupName} · ${details.sessionDate}`,
        };
    }
    if (details.kind === "product") {
        return { nome: details.name, subtitulo: "" };
    }
    return { nome: details.name, subtitulo: details.subtitle };
}

/* ------------------------------------------------------------------ */
/*  Provider                                                          */
/* ------------------------------------------------------------------ */

export function CortesiasProvider({ children }: { children: ReactNode }) {
    const [pedidos, setPedidos] = useState<Pedido[]>([]);
    const [itens, setItens] = useState<CortesiaItem[]>([]);

    const addPedido = useCallback((input: AddPedidoInput) => {
        const pedidoId = generateId();
        const emissor = input.emissor ?? DEFAULT_EMISSOR;
        const dataEnvio = formatNow();
        const pedidoStatus = randomPedidoStatus();

        const newPedido: Pedido = {
            id: pedidoId,
            nome: input.nome.trim() || "Pedido sem nome",
            emissor,
            status: pedidoStatus,
            dataEnvio,
        };

        const newItens: CortesiaItem[] = [];
        for (const email of input.emails) {
            const hasCad = emailHasCadastro(email);
            for (const itemId of input.itemIds) {
                const details = getItemDetails(itemId);
                if (!details) continue;
                const labels = deriveItemNomeSubtitulo(itemId);
                if (!labels) continue;
                // If the pedido was randomly cancelled, all its items follow.
                const itemStatus =
                    pedidoStatus === "cancelado" ? "cancelado" : randomItemStatus();
                newItens.push({
                    id: generateId(),
                    kind: details.kind,
                    nome: labels.nome,
                    subtitulo: labels.subtitulo,
                    status: itemStatus,
                    emissor,
                    email,
                    documento: hasCad ? generateDoc(email) : "—",
                    transferido: Math.random() < 0.15,
                    pedidoId,
                });
            }
        }

        setPedidos((prev) => [newPedido, ...prev]);
        setItens((prev) => [...newItens, ...prev]);
        return newPedido;
    }, []);

    const cancelPedido = useCallback((id: string) => {
        setPedidos((prev) =>
            prev.map((p) => (p.id === id ? { ...p, status: "cancelado" as const } : p)),
        );
        setItens((prev) =>
            prev.map((it) =>
                it.pedidoId === id ? { ...it, status: "cancelado" as const } : it,
            ),
        );
    }, []);

    const cancelPedidos = useCallback((ids: Set<string>) => {
        setPedidos((prev) =>
            prev.map((p) =>
                ids.has(p.id) ? { ...p, status: "cancelado" as const } : p,
            ),
        );
        setItens((prev) =>
            prev.map((it) =>
                ids.has(it.pedidoId) ? { ...it, status: "cancelado" as const } : it,
            ),
        );
    }, []);

    const cancelItem = useCallback((id: string) => {
        setItens((prev) =>
            prev.map((it) =>
                it.id === id ? { ...it, status: "cancelado" as const } : it,
            ),
        );
    }, []);

    const cancelItens = useCallback((ids: Set<string>) => {
        setItens((prev) =>
            prev.map((it) =>
                ids.has(it.id) ? { ...it, status: "cancelado" as const } : it,
            ),
        );
    }, []);

    return (
        <CortesiasContext.Provider
            value={{
                pedidos,
                itens,
                addPedido,
                cancelPedido,
                cancelPedidos,
                cancelItem,
                cancelItens,
            }}
        >
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
