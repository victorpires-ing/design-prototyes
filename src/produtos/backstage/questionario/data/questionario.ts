import type { Evento, Pergunta, TipoDePergunta } from "@/plataforma";

/* ------------------------------------------------------------------ */
/*  Questionário do evento (QST): textos e regras comuns às telas.     */
/* ------------------------------------------------------------------ */

export const TIPOS_DE_PERGUNTA: TipoDePergunta[] = ["texto-curto", "texto-longo", "opcao-unica", "multipla", "numero", "telefone", "anexo"];

export const NOME_DO_TIPO: Record<TipoDePergunta, string> = {
    "texto-curto": "Texto curto",
    "texto-longo": "Texto longo",
    "opcao-unica": "Opção única",
    multipla: "Múltipla escolha",
    numero: "Número",
    telefone: "Telefone",
    anexo: "Anexo",
};

export const temOpcoes = (tipo: TipoDePergunta) => tipo === "opcao-unica" || tipo === "multipla";

export const LIMITE_TITULO = 200;

export const perguntaNova = (id: string): Pergunta => ({ id, titulo: "", tipo: "texto-curto", obrigatoria: true, itens: [] });

/** Setor de cada ingresso do evento, para resumir "N ingressos em M setores". */
export const setoresPorIngresso = (evento: Evento | undefined) =>
    new Map((evento?.sessoes ?? []).flatMap((s) => s.grupos.flatMap((g) => g.ingressos.map((t) => [t.id, g.id] as const))));

export interface ErrosDaPergunta {
    titulo?: string;
    opcoes?: string;
    /** Ids das opções sem nome ou repetidas. */
    opcoesInvalidas?: string[];
}

export function validarPergunta(p: Pergunta, t: { tituloErro: string; poucasOpcoes: string; opcaoSemNome: string; opcaoRepetida: string }): ErrosDaPergunta {
    const erros: ErrosDaPergunta = {};
    if (!p.titulo.trim()) erros.titulo = t.tituloErro;
    if (temOpcoes(p.tipo)) {
        const opcoes = p.opcoes ?? [];
        const vistos = new Map<string, string>();
        const invalidas: string[] = [];
        let repetida = false;
        for (const o of opcoes) {
            const chave = o.rotulo.trim().toLocaleLowerCase("pt-BR");
            if (!chave) invalidas.push(o.id);
            else if (vistos.has(chave)) {
                invalidas.push(o.id);
                repetida = true;
            } else vistos.set(chave, o.id);
        }
        if (opcoes.filter((o) => o.rotulo.trim()).length < 2) erros.opcoes = t.poucasOpcoes;
        else if (invalidas.length) erros.opcoes = repetida ? t.opcaoRepetida : t.opcaoSemNome;
        if (invalidas.length) erros.opcoesInvalidas = invalidas;
    }
    return erros;
}
