/**
 * SUS — System Usability Scale (Escala de Usabilidade do Sistema).
 *
 * Questionário padrão de 10 afirmações respondidas numa escala Likert de 5
 * pontos (1 = Discordo totalmente … 5 = Concordo totalmente). Produz uma única
 * métrica de 0 a 100.
 *
 * Pontuação: itens ímpares contam `valor - 1`; itens pares contam `5 - valor`.
 * A soma (0–40) é multiplicada por 2,5 → score 0–100.
 */

/** As 10 afirmações padrão (alternando positiva/negativa). */
export const PERGUNTAS_SUS: string[] = [
    "Eu gostaria de usar este sistema com frequência.",
    "Achei o sistema desnecessariamente complexo.",
    "Achei o sistema fácil de usar.",
    "Acho que precisaria do apoio de um técnico para conseguir usar este sistema.",
    "Achei que as várias funções do sistema estavam bem integradas.",
    "Achei que havia muita inconsistência neste sistema.",
    "Imagino que a maioria das pessoas aprenderia a usar este sistema rapidamente.",
    "Achei o sistema muito complicado de usar.",
    "Senti-me muito confiante ao usar o sistema.",
    "Precisei aprender muitas coisas antes de conseguir usar este sistema.",
];

/** Rótulos da escala Likert (1 → 5). */
export const ESCALA_SUS: string[] = ["Discordo totalmente", "Discordo", "Neutro", "Concordo", "Concordo totalmente"];

/** Calcula o score SUS (0–100) a partir das 10 respostas (valores 1–5). */
export function calcularSus(respostas: number[]): number | null {
    if (respostas.length !== 10 || respostas.some((r) => !r || r < 1 || r > 5)) return null;
    let soma = 0;
    respostas.forEach((valor, i) => {
        const impar = i % 2 === 0; // índice 0 = item 1 (ímpar)
        soma += impar ? valor - 1 : 5 - valor;
    });
    return Math.round(soma * 2.5 * 10) / 10;
}

/** Classificação qualitativa do score SUS (referência de Bangor/Sauro). */
export function classificarSus(score: number): { nota: string; adjetivo: string } {
    if (score >= 85) return { nota: "A", adjetivo: "Excelente" };
    if (score >= 72) return { nota: "B", adjetivo: "Bom" };
    if (score >= 68) return { nota: "C", adjetivo: "OK" };
    if (score >= 51) return { nota: "D", adjetivo: "Ruim" };
    return { nota: "F", adjetivo: "Péssimo" };
}
