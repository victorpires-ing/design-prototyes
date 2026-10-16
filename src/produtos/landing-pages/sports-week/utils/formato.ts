/* Formatação da campanha Sports Week.
   Não há função de moeda: a API não devolve preço, então nada em tela mostra
   valor em reais. O que a campanha anuncia é percentual de desconto. */

export const numero = (valor: number) => valor.toLocaleString("pt-BR");

/* Boldonse tem cap height de 1.19em: as maiúsculas são mais altas que o próprio
   em. Com entrelinha apertada, o acento de uma linha bate na linha de cima.
   Por isso o título acentuado respira mais. */
const ACENTUADAS = /[ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ]/;

export const alturaDeLinha = (texto: string) => (ACENTUADAS.test(texto.toUpperCase()) ? 1.5 : 1.22);
