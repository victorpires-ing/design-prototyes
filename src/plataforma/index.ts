/* Ponto de entrada da plataforma: importe daqui nos produtos. Ver README.md. */
export * from "./modelo";
export * from "./regras";
export * from "./acoes";
export * from "./sessao";
export { lerBanco, lerColecao, lerDoc, remover, resetarBanco, salvar, useBanco, useColecao, useDoc, type ModoBanco } from "./db";
export * from "./carteira";
