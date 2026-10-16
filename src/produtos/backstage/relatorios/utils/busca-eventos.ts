/**
 * Busca da comparação. Vive fora da página porque é a parte que precisa
 * aguentar escala: o catálogo de uma organização grande tem centenas de
 * eventos, e a lista nunca pode despejar tudo.
 *
 * O modelo é o do Google Trends: nada de navegar o catálogo inteiro. Sem
 * busca, mostra um punhado de eventos recentes; com busca, ordena por
 * relevância e corta num teto, sempre dizendo quanto ficou de fora.
 */

export interface EventoBuscavel {
  id: string;
  nome: string;
  curto: string;
  /** DD/MM/AAAA */
  dataEvento: string;
}

/** Sem busca: quantos recentes sugerir de partida. */
export const RECENTES = 6;

/** Com busca: teto do que é renderizado, por mais que o catálogo cresça. */
export const MAX_RESULTADOS = 50;

export const normalizar = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

const emDias = (data: string) => {
  const [d, m, a] = data.split("/").map(Number);
  return new Date(a, (m ?? 1) - 1, d ?? 1).getTime();
};

const escaparRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Quanto um evento responde à busca. Zero significa que não entra na lista.
 * A ordem das faixas é o que faz "Mochakk" subir acima de um evento que só
 * tem "mocha" no meio do nome.
 */
export function pontuarEvento(ev: EventoBuscavel, q: string): number {
  const nome = normalizar(ev.nome);
  const curto = normalizar(ev.curto);

  if (curto === q || nome === q) return 100;
  if (curto.startsWith(q) || nome.startsWith(q)) return 80;
  // Começo de palavra vale mais que trecho perdido no meio.
  if (new RegExp(`\\b${escaparRegex(q)}`).test(nome)) return 60;
  if (nome.includes(q) || curto.includes(q)) return 40;
  // Buscar por data resolve o caso de edições com o mesmo nome.
  if (ev.dataEvento.includes(q)) return 20;
  return 0;
}

export interface ResultadoBusca<T> {
  itens: T[];
  /** Quantos casaram ao todo, antes do corte. */
  total: number;
  modo: "recentes" | "busca";
}

export function buscarEventos<T extends EventoBuscavel>(
  catalogo: T[],
  indisponiveis: string[],
  busca: string,
): ResultadoBusca<T> {
  const fora = new Set(indisponiveis);
  const base = catalogo.filter((ev) => !fora.has(ev.id));
  const q = normalizar(busca.trim());

  if (!q) {
    const recentes = [...base].sort(
      (a, b) => emDias(b.dataEvento) - emDias(a.dataEvento),
    );
    return {
      itens: recentes.slice(0, RECENTES),
      total: base.length,
      modo: "recentes",
    };
  }

  const pontuados = base
    .map((ev) => ({ ev, p: pontuarEvento(ev, q) }))
    .filter((x) => x.p > 0)
    .sort(
      (a, b) => b.p - a.p || emDias(b.ev.dataEvento) - emDias(a.ev.dataEvento),
    );

  return {
    itens: pontuados.slice(0, MAX_RESULTADOS).map((x) => x.ev),
    total: pontuados.length,
    modo: "busca",
  };
}
