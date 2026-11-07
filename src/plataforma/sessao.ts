import { useSyncExternalStore } from "react";
import type { Usuario } from "./modelo";
import { slugificar } from "./regras";

/* ------------------------------------------------------------------ */
/*  Quem está "logado" como comprador neste navegador                  */
/*                                                                     */
/*  O login é de mentira (qualquer código passa), mas o e-mail é a     */
/*  chave: a carteira mostra os ingressos cujo titular tem este        */
/*  e-mail. Fica no localStorage, então vale para o site, o link de    */
/*  compra, o checkout e as carteiras ao mesmo tempo.                  */
/* ------------------------------------------------------------------ */

const KEY = "plataforma:sessao:v1";
const ouvintes = new Set<() => void>();

const ler = (): Usuario | null => {
    try {
        const raw = localStorage.getItem(KEY);
        return raw ? (JSON.parse(raw) as Usuario) : null;
    } catch {
        return null;
    }
};

let atual: Usuario | null = typeof window === "undefined" ? null : ler();

function emitir() {
    ouvintes.forEach((l) => l());
}

if (typeof window !== "undefined") {
    window.addEventListener("storage", (e) => {
        if (e.key === KEY) {
            atual = ler();
            emitir();
        }
    });
}

export function entrar(dados: { nome: string; email: string }): Usuario {
    const email = dados.email.trim().toLowerCase();
    const u: Usuario = { id: `u_${slugificar(email)}`, nome: dados.nome.trim() || email.split("@")[0], email };
    atual = u;
    try {
        localStorage.setItem(KEY, JSON.stringify(u));
    } catch {
        /* só em memória */
    }
    emitir();
    return u;
}

export function sair() {
    atual = null;
    try {
        localStorage.removeItem(KEY);
    } catch {
        /* nada */
    }
    emitir();
}

export const lerSessao = () => atual;

export function useSessao(): Usuario | null {
    return useSyncExternalStore(
        (l) => {
            ouvintes.add(l);
            return () => ouvintes.delete(l);
        },
        () => atual,
        () => null,
    );
}
