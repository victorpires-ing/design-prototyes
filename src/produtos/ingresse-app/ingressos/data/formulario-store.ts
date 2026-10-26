/* Store simples (em memória, por sessão) do formulário da inscrição: respostas
   editadas pelo usuário e estoque atual das opções.

   Regra de estoque (troca direta, sem reserva): só dá para escolher opção com
   estoque. Ao salvar, a opção que o usuário larga volta para o estoque e a nova
   é consumida. A opção que ele já tinha escolhido continua disponível para ele
   mesmo esgotada, senão quem respondeu antes ficaria travado no formulário.

   Leitura: as telas chamam getFormulario durante o render e enxergam o estado
   novo porque remontam ao navegar (ou porque o próprio salvamento muda o estado
   local). Não há assinatura; nenhuma tela fica montada esperando o store mudar. */

import type { OpcaoResposta, Resposta } from "./eventos";

/* Na múltipla a resposta guarda vários valores numa string só. O separador é um
   caractere de controle justamente para nunca colidir com o texto de uma opção. */
const SEPARADOR = "\u0000";

/** Valores de uma resposta. Em "multipla" são vários; nos demais tipos, um só. */
export const valoresDe = (resposta: string): string[] => resposta.split(SEPARADOR).filter((v) => v !== "");

export const juntarValores = (valores: string[]): string => valores.join(SEPARADOR);

/** comboId -> pergunta -> resposta */
const respostas = new Map<string, Record<string, string>>();
/** `comboId|pergunta|opção` -> estoque atual */
const estoques = new Map<string, number>();

const chaveEstoque = (comboId: string, pergunta: string, opcao: string) => `${comboId}|${pergunta}|${opcao}`;

/** Estoque atual da opção: o que já foi movimentado nesta sessão ou o valor da semente. */
const estoqueAtual = (comboId: string, pergunta: string, opcao: OpcaoResposta): number | undefined => {
    if (typeof opcao.estoque !== "number") return undefined;
    const guardado = estoques.get(chaveEstoque(comboId, pergunta, opcao.valor));
    return guardado ?? opcao.estoque;
};

/** Perguntas da inscrição com as respostas editadas e o estoque atual aplicados por cima. */
export const getFormulario = (comboId: string | undefined, perguntas: Resposta[] = []): Resposta[] => {
    if (!comboId) return perguntas;
    const editadas = respostas.get(comboId);
    return perguntas.map((q) => ({
        ...q,
        resposta: editadas?.[q.pergunta] ?? q.resposta,
        opcoes: q.opcoes?.map((o) => {
            const estoque = estoqueAtual(comboId, q.pergunta, o);
            return typeof estoque === "number" ? { ...o, estoque } : o;
        }),
    }));
};

/** Duas respostas da mesma pergunta são equivalentes? Na múltipla a ordem não conta. */
export const mesmaResposta = (pergunta: Resposta, a: string, b: string): boolean => {
    if (pergunta.tipo !== "multipla") return a === b;
    const va = valoresDe(a);
    const vb = valoresDe(b);
    return va.length === vb.length && va.every((v) => vb.includes(v));
};

/** O que aconteceu ao salvar. */
export interface ResultadoSalvar {
    /** Perguntas efetivamente salvas. */
    salvas: string[];
    /** Opções que não entraram porque acabaram durante o salvamento. */
    conflitos: Array<{ pergunta: string; valor: string }>;
}

/** Opções disputadas que já foram tomadas por outra pessoa (uma vez só por sessão). */
const disputasResolvidas = new Set<string>();

/**
 * Salva as respostas e movimenta o estoque: devolve o que foi largado e consome
 * o que foi escolhido.
 *
 * Se uma opção escolhida acabar durante o salvamento, ela não entra: numa
 * pergunta de escolha única a resposta inteira fica como estava; numa múltipla,
 * só aquela opção cai e as demais são salvas. `perguntas` deve ser o formulário
 * como ele estava na tela.
 */
export const salvarFormulario = (comboId: string | undefined, perguntas: Resposta[], novas: Record<string, string>): ResultadoSalvar => {
    const resultado: ResultadoSalvar = { salvas: [], conflitos: [] };
    if (!comboId) return resultado;

    const aplicar: Record<string, string> = {};

    perguntas.forEach((q) => {
        const anterior = q.resposta;
        const nova = novas[q.pergunta] ?? q.resposta;
        if (mesmaResposta(q, anterior, nova)) return;

        const antes = valoresDe(anterior);
        const depois = valoresDe(nova);

        // Confere o estoque de novo, agora: entre abrir a tela e salvar, alguém pode ter levado a vaga.
        const perdidas = (q.opcoes ?? [])
            .filter((o) => depois.includes(o.valor) && !antes.includes(o.valor))
            .filter((o) => {
                if (typeof o.estoque !== "number") return false;
                const chaveDisputa = chaveEstoque(comboId, q.pergunta, o.valor);
                if (o.disputada && !disputasResolvidas.has(chaveDisputa)) {
                    // Outra pessoa acabou de levar a última unidade.
                    disputasResolvidas.add(chaveDisputa);
                    estoques.set(chaveDisputa, 0);
                    return true;
                }
                return (estoqueAtual(comboId, q.pergunta, o) ?? 0) <= 0;
            });

        perdidas.forEach((o) => resultado.conflitos.push({ pergunta: q.pergunta, valor: o.valor }));

        // Escolha única: sem a opção perdida não sobra resposta, então a pergunta fica como estava.
        if (perdidas.length > 0 && q.tipo !== "multipla") return;

        const validos = depois.filter((v) => !perdidas.some((o) => o.valor === v));
        if (perdidas.length > 0 && mesmaResposta(q, anterior, juntarValores(validos))) return;

        (q.opcoes ?? []).forEach((o) => {
            if (typeof o.estoque !== "number") return;
            const tinha = antes.includes(o.valor);
            const tem = validos.includes(o.valor);
            if (tinha === tem) return;
            const atual = estoqueAtual(comboId, q.pergunta, o) ?? o.estoque;
            // Devolveu a vaga: +1. Ocupou: -1 (sem deixar negativo).
            estoques.set(chaveEstoque(comboId, q.pergunta, o.valor), tinha ? atual + 1 : Math.max(0, atual - 1));
        });

        // Só a múltipla é serializada; os outros tipos guardam o texto exatamente como foi digitado.
        aplicar[q.pergunta] = q.tipo === "multipla" ? juntarValores(validos) : nova;
        resultado.salvas.push(q.pergunta);
    });

    if (resultado.salvas.length > 0) {
        respostas.set(comboId, { ...(respostas.get(comboId) ?? {}), ...aplicar });
    }

    return resultado;
};
