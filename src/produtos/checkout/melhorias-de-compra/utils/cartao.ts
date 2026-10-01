import type { Bandeira } from "../data/checkout-store";

/* Máscaras e validações do formulário de cartão. */

export const soDigitos = (v: string) => v.replace(/\D/g, "");

export function detectarBandeira(numero: string): Bandeira | null {
    const d = soDigitos(numero);
    if (/^3[47]/.test(d)) return "amex";
    if (/^3(0[0-5]|[68])/.test(d)) return "diners";
    if (/^(4011|4312|4389|4514|4576|5041|5066|5067|509|6277|6362|6363|650|6516|6550)/.test(d)) return "elo";
    if (/^4/.test(d)) return "visa";
    if (/^(5[1-5]|2[2-7])/.test(d)) return "mastercard";
    return null;
}

export function mascararNumero(v: string) {
    const d = soDigitos(v).slice(0, 16);
    if (detectarBandeira(d) === "amex") return d.slice(0, 15).replace(/^(\d{0,4})(\d{0,6})(\d{0,5}).*/, (_, a, b, c) => [a, b, c].filter(Boolean).join(" "));
    return d.replace(/(\d{4})(?=\d)/g, "$1 ");
}

export function mascararValidade(v: string) {
    const d = soDigitos(v).slice(0, 4);
    return d.length > 2 ? `${d.slice(0, 2)} / ${d.slice(2)}` : d;
}

/** Algoritmo de Luhn. */
function luhn(d: string) {
    let soma = 0;
    for (let i = 0; i < d.length; i++) {
        let n = Number(d[d.length - 1 - i]);
        if (i % 2 === 1) {
            n *= 2;
            if (n > 9) n -= 9;
        }
        soma += n;
    }
    return soma % 10 === 0;
}

export interface CamposCartao {
    numero: string;
    nome: string;
    validade: string;
    cvv: string;
}

export type ErrosCartao = Partial<Record<keyof CamposCartao, string>>;

export function validarCartao(c: CamposCartao, hoje = new Date()): ErrosCartao {
    const erros: ErrosCartao = {};

    const numero = soDigitos(c.numero);
    const tamanho = detectarBandeira(numero) === "amex" ? 15 : 16;
    // Luhn sozinho aceita "0000…"; exigir uma bandeira reconhecida fecha esse caso.
    if (!detectarBandeira(numero) || numero.length !== tamanho || !luhn(numero)) erros.numero = "Cartão inválido";

    const palavras = c.nome.trim().split(/\s+/).filter((p) => p.length >= 2);
    if (palavras.length < 2 || /(.)\1{3,}/i.test(c.nome)) erros.nome = "Insira o nome conforme impresso no cartão";

    const v = soDigitos(c.validade);
    const mes = Number(v.slice(0, 2));
    const ano = 2000 + Number(v.slice(2, 4));
    const vencida = ano < hoje.getFullYear() || (ano === hoje.getFullYear() && mes < hoje.getMonth() + 1);
    if (v.length !== 4 || mes < 1 || mes > 12 || vencida || ano > hoje.getFullYear() + 20) erros.validade = "Data inválida";

    const tamanhoCvv = detectarBandeira(numero) === "amex" ? 4 : 3;
    if (soDigitos(c.cvv).length !== tamanhoCvv) erros.cvv = `Digite os ${tamanhoCvv} dígitos do verso do cartão`;

    return erros;
}
