/* ------------------------------------------------------------------ */
/*  Lista de espera — pessoas que clicaram em "Tenho interesse" no     */
/*  evento. Mock determinístico (mesma lista a cada render).           */
/* ------------------------------------------------------------------ */

export interface InteressadoListaEspera {
    id: string;
    nome: string;
    email: string;
    /** Data/hora do clique em "Tenho interesse". */
    dataInteresse: Date;
}

const NOMES = [
    "Ana", "Bruno", "Camila", "Diego", "Eduarda", "Felipe", "Gabriela", "Henrique", "Isabela", "João",
    "Karina", "Lucas", "Mariana", "Nicolas", "Olívia", "Pedro", "Rafaela", "Samuel", "Thaís", "Vinícius",
    "Beatriz", "Caio", "Letícia", "Matheus", "Juliana", "Gustavo", "Larissa", "Rodrigo", "Fernanda", "Thiago",
];

const SOBRENOMES = [
    "Silva", "Souza", "Oliveira", "Santos", "Pereira", "Lima", "Carvalho", "Ferreira", "Almeida", "Ribeiro",
    "Gomes", "Martins", "Rocha", "Barbosa", "Mendes", "Nunes", "Cardoso", "Teixeira", "Moreira", "Araújo",
];

const PROVEDORES = ["gmail.com", "hotmail.com", "outlook.com", "yahoo.com.br", "icloud.com"];

const semAcento = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// PRNG simples (mulberry32) para manter a lista estável entre renders.
const rng = (seed: number) => () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const TOTAL = 184;

// Janela de interesse: 01/06/2026 até a abertura das vendas + alguns dias (20/06/2026).
const INICIO = new Date(2026, 5, 1, 0, 0).getTime();
const FIM = new Date(2026, 5, 20, 23, 59).getTime();

const build = (): InteressadoListaEspera[] => {
    const rand = rng(42);
    const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)];
    const lista: InteressadoListaEspera[] = [];
    for (let i = 0; i < TOTAL; i++) {
        const nome = pick(NOMES);
        const sobre1 = pick(SOBRENOMES);
        const sobre2 = pick(SOBRENOMES);
        const nomeCompleto = sobre1 === sobre2 ? `${nome} ${sobre1}` : `${nome} ${sobre1} ${sobre2}`;
        const usuario = `${semAcento(nome)}.${semAcento(sobre2)}${rand() < 0.4 ? Math.floor(rand() * 99) : ""}`;
        // Mais interesse concentrado perto da abertura das vendas (curva quadrática).
        const t = INICIO + (FIM - INICIO) * Math.sqrt(rand());
        lista.push({
            id: `le-${String(i + 1).padStart(4, "0")}`,
            nome: nomeCompleto,
            email: `${usuario}@${pick(PROVEDORES)}`,
            dataInteresse: new Date(Math.round(t / 60_000) * 60_000),
        });
    }
    return lista.sort((a, b) => b.dataInteresse.getTime() - a.dataInteresse.getTime());
};

export const LISTA_DE_ESPERA: InteressadoListaEspera[] = build();
