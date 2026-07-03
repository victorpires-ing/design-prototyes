import type { FC } from "react";
import { CheckCircle, Copy01, File02, FileCheck02 } from "@untitledui/icons";

/* ------------------------------------------------------------------ */
/*  Tipos de pergunta (alinhado ao módulo de Perguntas)                */
/* ------------------------------------------------------------------ */

export type TipoResposta = "texto-aberto" | "selecao-unica" | "multipla-selecao" | "anexar-arquivo";

export const TIPO_RESPOSTA: Record<TipoResposta, { label: string; icon: FC<{ className?: string }> }> = {
    "texto-aberto": { label: "Texto aberto", icon: File02 },
    "selecao-unica": { label: "Seleção única", icon: Copy01 },
    "multipla-selecao": { label: "Múltipla seleção", icon: CheckCircle },
    "anexar-arquivo": { label: "Anexar arquivo", icon: FileCheck02 },
};

/* ------------------------------------------------------------------ */
/*  Estruturas                                                         */
/* ------------------------------------------------------------------ */

export interface Respondente {
    id: string;
    nome: string;
    email: string;
    nascimento: string;
    documento: string;
}

export interface OpcaoResposta {
    label: string;
    respostas: number;
}

/** Uma linha do relatório: quem respondeu + a resposta (varia por tipo). */
export interface RespostaLinha {
    respondente: Respondente;
    data: string;
    /** seleção única */
    opcao?: string;
    /** múltipla seleção */
    opcoesMultiplas?: string[];
    /** texto aberto */
    texto?: string;
    /** anexar arquivo */
    anexo?: { arquivo: string; tamanho: string };
}

export interface QuestionarioPergunta {
    id: string;
    titulo: string;
    tipo: TipoResposta;
    /** Participantes que viram a pergunta. */
    total: number;
    /** Quantos responderam (linhas na tabela). */
    respondidas: number;
    /** Obrigatória no formulário? */
    obrigatoria: boolean;
    /** Distribuição das opções (seleção única/múltipla), derivada das respostas. */
    opcoes?: OpcaoResposta[];
    /** Linhas individuais (pesquisáveis). */
    respostas: RespostaLinha[];
}

/* ------------------------------------------------------------------ */
/*  Geração determinística de mock (100 participantes)                 */
/* ------------------------------------------------------------------ */

function makeRng(seed: number) {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

const PRIMEIROS = [
    "Marina", "Rodrigo", "Camila", "Diego", "Beatriz", "Paulo", "Fernanda", "Lucas", "Ana", "Bruno",
    "Carla", "Felipe", "Juliana", "Rafael", "Patrícia", "Gustavo", "Larissa", "Thiago", "Mariana", "André",
    "Renata", "Vinícius", "Aline", "Marcelo", "Bianca", "Leonardo", "Tatiane", "Sabrina", "Eduardo", "Priscila",
    "Fábio", "Vanessa", "Ricardo", "Débora", "Márcio", "Letícia", "Gabriel", "Natália", "Henrique", "Isabela",
];

const ULTIMOS = [
    "Alves", "Nunes", "Torres", "Ferreira", "Lima", "Reis", "Martins", "Souza", "Oliveira", "Costa",
    "Rodrigues", "Almeida", "Barbosa", "Gomes", "Ribeiro", "Carvalho", "Araújo", "Cardoso", "Teixeira", "Moraes",
    "Pinto", "Cavalcanti", "Dias", "Freitas", "Monteiro", "Rocha", "Mendes", "Ramos", "Correia", "Batista",
];

const DOMINIOS = ["gmail.com", "hotmail.com", "outlook.com", "yahoo.com.br", "icloud.com"];

const semAcento = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");
const pad = (n: number, len: number) => String(n).padStart(len, "0");

function gerarRespondentes(n: number): Respondente[] {
    const r = makeRng(20260618);
    const usados = new Set<string>();
    const list: Respondente[] = [];
    for (let i = 0; i < n; i++) {
        const pn = PRIMEIROS[Math.floor(r() * PRIMEIROS.length)];
        const un = ULTIMOS[Math.floor(r() * ULTIMOS.length)];
        const nome = `${pn} ${un}`;
        const dom = DOMINIOS[Math.floor(r() * DOMINIOS.length)];
        const base = `${semAcento(pn).toLowerCase()}.${semAcento(un).toLowerCase()}`;
        let email = `${base}@${dom}`;
        if (usados.has(email)) email = `${base}${i}@${dom}`;
        usados.add(email);
        const nascimento = `${pad(1 + Math.floor(r() * 28), 2)}/${pad(1 + Math.floor(r() * 12), 2)}/${1965 + Math.floor(r() * 41)}`;
        const documento = `${pad(Math.floor(r() * 1000), 3)}.${pad(Math.floor(r() * 1000), 3)}.${pad(Math.floor(r() * 1000), 3)}-${pad(Math.floor(r() * 100), 2)}`;
        list.push({ id: `r${i}`, nome, email, nascimento, documento });
    }
    return list;
}

const RESPONDENTES = gerarRespondentes(100);

function selecionarRespondentes(qtd: number, seed: number): Respondente[] {
    const idxs = Array.from({ length: RESPONDENTES.length }, (_, i) => i);
    const r = makeRng(seed);
    for (let i = idxs.length - 1; i > 0; i--) {
        const j = Math.floor(r() * (i + 1));
        [idxs[i], idxs[j]] = [idxs[j], idxs[i]];
    }
    return idxs.slice(0, qtd).map((i) => RESPONDENTES[i]);
}

function dataResposta(r: () => number): string {
    const dia = ["16", "17", "18"][Math.floor(r() * 3)];
    return `${dia}/06/2026 · ${pad(9 + Math.floor(r() * 13), 2)}:${pad(Math.floor(r() * 60), 2)}`;
}

/* ---- builders por tipo ---- */

function buildSelecaoUnica(
    id: string,
    titulo: string,
    obrigatoria: boolean,
    respondidas: number,
    opts: { label: string; peso: number }[],
    seed: number,
): QuestionarioPergunta {
    const r = makeRng(seed);
    const resps = selecionarRespondentes(respondidas, seed);
    const counts = new Map<string, number>();
    const totalPeso = opts.reduce((a, o) => a + o.peso, 0);
    const respostas: RespostaLinha[] = resps.map((rep) => {
        let x = r() * totalPeso;
        let escolha = opts[opts.length - 1].label;
        for (const o of opts) {
            if (x < o.peso) {
                escolha = o.label;
                break;
            }
            x -= o.peso;
        }
        counts.set(escolha, (counts.get(escolha) ?? 0) + 1);
        return { respondente: rep, data: dataResposta(r), opcao: escolha };
    });
    const opcoes = opts.map((o) => ({ label: o.label, respostas: counts.get(o.label) ?? 0 }));
    return { id, titulo, tipo: "selecao-unica", total: 100, respondidas, obrigatoria, opcoes, respostas };
}

function buildMultipla(
    id: string,
    titulo: string,
    obrigatoria: boolean,
    respondidas: number,
    opts: { label: string; prob: number; exclusivo?: boolean }[],
    seed: number,
): QuestionarioPergunta {
    const r = makeRng(seed);
    const resps = selecionarRespondentes(respondidas, seed);
    const counts = new Map<string, number>();
    const exclusivo = opts.find((o) => o.exclusivo);
    const respostas: RespostaLinha[] = resps.map((rep) => {
        let escolhidas: string[] = [];
        if (exclusivo && r() < exclusivo.prob) {
            escolhidas = [exclusivo.label];
        } else {
            escolhidas = opts.filter((o) => !o.exclusivo && r() < o.prob).map((o) => o.label);
            if (escolhidas.length === 0) {
                const naoExcl = opts.filter((o) => !o.exclusivo);
                escolhidas = [naoExcl.reduce((a, b) => (b.prob > a.prob ? b : a)).label];
            }
        }
        for (const l of escolhidas) counts.set(l, (counts.get(l) ?? 0) + 1);
        return { respondente: rep, data: dataResposta(r), opcoesMultiplas: escolhidas };
    });
    const opcoes = opts.map((o) => ({ label: o.label, respostas: counts.get(o.label) ?? 0 }));
    return { id, titulo, tipo: "multipla-selecao", total: 100, respondidas, obrigatoria, opcoes, respostas };
}

const TEXTOS = [
    "Vamos com tudo, Fogão! O Nilton Santos vai tremer hoje. 🔥",
    "Confio demais nesse time. Raça e coração até o apito final!",
    "Primeira vez levando meu filho ao estádio, que seja inesquecível.",
    "Glorioso, hoje é dia de classificação. Bora pra cima!",
    "Independente do resultado, seguimos juntos. Amo esse clube.",
    "Que a torcida faça a diferença do primeiro ao último minuto!",
    "Estádio lotado, energia lá em cima. Vamos, Botafogo!",
    "Fé no elenco e no trabalho da comissão. Copa do Brasil é nossa!",
    "Sempre alvinegro, na alegria e na dificuldade. Vamos vencer!",
    "Preparado pra empurrar o time até o fim. É hoje!",
    "Que jogo especial, mal posso esperar pelo apito inicial.",
    "Time guerreiro, torcida gigante. Rumo à próxima fase!",
];

function buildTexto(id: string, titulo: string, obrigatoria: boolean, respondidas: number, seed: number): QuestionarioPergunta {
    const r = makeRng(seed);
    const resps = selecionarRespondentes(respondidas, seed);
    const respostas: RespostaLinha[] = resps.map((rep, i) => ({
        respondente: rep,
        data: dataResposta(r),
        texto: TEXTOS[(i + Math.floor(r() * TEXTOS.length)) % TEXTOS.length],
    }));
    return { id, titulo, tipo: "texto-aberto", total: 100, respondidas, obrigatoria, respostas };
}

const ARQUIVOS = ["documento-frente", "rg-digital", "cnh-digital", "identidade", "documento-foto", "carteira"];
const EXTENSOES = ["jpg", "pdf", "png", "pdf", "jpg", "pdf"];

function buildAnexo(id: string, titulo: string, obrigatoria: boolean, respondidas: number, seed: number): QuestionarioPergunta {
    const r = makeRng(seed);
    const resps = selecionarRespondentes(respondidas, seed);
    const respostas: RespostaLinha[] = resps.map((rep, i) => {
        const nome = ARQUIVOS[i % ARQUIVOS.length];
        const ext = EXTENSOES[i % EXTENSOES.length];
        const primeiro = semAcento(rep.nome.split(" ")[0]).toLowerCase();
        const kb = 300 + Math.floor(r() * 2400);
        const tamanho = kb > 1024 ? `${(kb / 1024).toFixed(1).replace(".", ",")} MB` : `${kb} KB`;
        return { respondente: rep, data: dataResposta(r), anexo: { arquivo: `${nome}-${primeiro}.${ext}`, tamanho } };
    });
    return { id, titulo, tipo: "anexar-arquivo", total: 100, respondidas, obrigatoria, respostas };
}

/* ------------------------------------------------------------------ */
/*  Questionário — todos os tipos, 100 participantes                   */
/*  Evento: Botafogo x Chapecoense — Copa do Brasil.                   */
/* ------------------------------------------------------------------ */

export const QUESTIONARIO: QuestionarioPergunta[] = [
    buildSelecaoUnica(
        "q-chegada",
        "Como você vai chegar ao estádio?",
        true,
        100,
        [
            { label: "Carro próprio", peso: 38 },
            { label: "Transporte por app", peso: 27 },
            { label: "Ônibus / Metrô", peso: 22 },
            { label: "A pé", peso: 8 },
            { label: "Bicicleta", peso: 5 },
        ],
        101,
    ),
    buildSelecaoUnica(
        "q-primeira-vez",
        "É a sua primeira vez no Nilton Santos?",
        false,
        96,
        [
            { label: "Não, já fui outras vezes", peso: 59 },
            { label: "Sim, é a primeira vez", peso: 41 },
        ],
        102,
    ),
    buildMultipla(
        "q-produtos",
        "Quais produtos oficiais você pretende comprar?",
        false,
        100,
        [
            { label: "Camisa oficial", prob: 0.61 },
            { label: "Cachecol", prob: 0.34 },
            { label: "Boné", prob: 0.29 },
            { label: "Bandeira", prob: 0.23 },
            { label: "Caneca", prob: 0.18 },
            { label: "Nenhum por enquanto", prob: 0.12, exclusivo: true },
        ],
        103,
    ),
    buildMultipla(
        "q-servicos",
        "Quais serviços você usaria no dia do jogo?",
        false,
        88,
        [
            { label: "Bar / Alimentação", prob: 0.82 },
            { label: "Estacionamento", prob: 0.5 },
            { label: "Loja oficial", prob: 0.43 },
            { label: "Guarda-volumes", prob: 0.17 },
        ],
        104,
    ),
    buildTexto("q-mensagem", "Deixe uma mensagem de incentivo para o time", false, 84, 105),
    buildAnexo("q-documento", "Anexe um documento com foto para retirada", true, 92, 106),
];
