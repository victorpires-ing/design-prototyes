import { useSyncExternalStore } from "react";

/* Estado compartilhado entre as telas do fluxo (vive enquanto a aba estiver aberta). */

export type Bandeira = "visa" | "mastercard" | "amex" | "diners" | "elo";

export interface CartaoSalvo {
    id: string;
    bandeira: Bandeira;
    final: string;
}

interface CheckoutState {
    protecao: "com" | "sem";
    cartoesSalvos: CartaoSalvo[];
    /** Parcelamento escolhido no cartão — entra no resumo como juros. */
    parcelas: number;
}

let state: CheckoutState = { protecao: "com", cartoesSalvos: [], parcelas: 1 };
const listeners = new Set<() => void>();

function set(patch: Partial<CheckoutState>) {
    state = { ...state, ...patch };
    listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
}

export function useCheckout() {
    const snapshot = useSyncExternalStore(subscribe, () => state);
    return {
        ...snapshot,
        setProtecao: (protecao: CheckoutState["protecao"]) => set({ protecao }),
        setParcelas: (parcelas: number) => set({ parcelas }),
        salvarCartao: (cartao: Omit<CartaoSalvo, "id">) => {
            if (state.cartoesSalvos.some((c) => c.final === cartao.final && c.bandeira === cartao.bandeira)) return;
            set({ cartoesSalvos: [...state.cartoesSalvos, { ...cartao, id: `${cartao.bandeira}-${cartao.final}` }] });
        },
        excluirCartao: (id: string) => set({ cartoesSalvos: state.cartoesSalvos.filter((c) => c.id !== id) }),
    };
}
