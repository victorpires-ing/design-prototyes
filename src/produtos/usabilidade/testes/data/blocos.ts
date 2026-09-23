/** Fábricas de blocos e catálogo do "Adicionar bloco" do editor. */

import { Announcement02, Beaker02, ClockStopwatch, MessageTextSquare02, Speedometer03, Star06, Trophy01 } from "@untitledui/icons";
import { gerarId } from "@/lib/usability";
import type { Bloco, BlocoAtividade, BlocoComunicacao, BlocoExposicao, BlocoObrigado, BlocoPergunta, BlocoSus, BlocoWelcome, PerguntaFormato, Teste } from "@/lib/usability";

export function blocoWelcome(): BlocoWelcome {
    return {
        id: gerarId(),
        tipo: "welcome",
        titulo: "Bem-vindo",
        texto: "Você foi convidado para uma atividade de pesquisa. Não há respostas certas ou erradas — responda do jeito que for natural para você. Sua participação ajuda a construir experiências melhores.",
    };
}

export function blocoObrigado(): BlocoObrigado {
    return {
        id: gerarId(),
        tipo: "obrigado",
        titulo: "Obrigado!",
        texto: "Suas interações foram registradas e ajudam a melhorar o produto. Você já pode fechar esta janela.",
    };
}

export function blocoAtividade(): BlocoAtividade {
    return {
        id: gerarId(),
        tipo: "atividade",
        titulo: "Nova atividade",
        enunciado: "",
        descricao: "",
        rotaInicial: "/",
        criterios: [{ id: gerarId(), tipo: "auto" }],
        mensagemSucesso: "",
        declaracaoApos: 0,
        pedirJustificativaDesistencia: false,
    };
}

export function blocoSus(): BlocoSus {
    return {
        id: gerarId(),
        tipo: "sus",
        titulo: "Escala de usabilidade (SUS)",
        enunciado: "Para cada afirmação, indique o quanto você concorda.",
    };
}

export function blocoExposicao(): BlocoExposicao {
    return {
        id: gerarId(),
        tipo: "exposicao",
        titulo: "Teste de 5 segundos",
        origem: "rota",
        rotaInicial: "/",
        duracaoSegundos: 5,
    };
}

export function blocoComunicacao(): BlocoComunicacao {
    return {
        id: gerarId(),
        tipo: "comunicacao",
        titulo: "Aviso",
        texto: "",
        textoBotao: "Continuar",
    };
}

export function blocoPergunta(formato: PerguntaFormato = "aberta"): BlocoPergunta {
    return {
        id: gerarId(),
        tipo: "pergunta",
        titulo: "Nova pergunta",
        enunciado: "",
        formato,
        opcoes: formato === "aberta" ? [] : ["Opção 1", "Opção 2"],
        obrigatoria: true,
    };
}

export function novoTeste(): Teste {
    return {
        id: gerarId(),
        nome: "Teste sem título",
        status: "rascunho",
        blocos: [blocoWelcome(), blocoObrigado()],
        umaVezPorDispositivo: true,
        criadoEm: new Date().toISOString(),
    };
}

export interface ItemCatalogo {
    id: string;
    label: string;
    descricao: string;
    icon: typeof Beaker02;
    criar: () => Bloco;
}

export const CATALOGO: { grupo: string; itens: ItemCatalogo[] }[] = [
    {
        grupo: "Missão",
        itens: [
            {
                id: "atividade",
                label: "Teste de site",
                descricao: "Crie uma tarefa de usabilidade no protótipo.",
                icon: Beaker02,
                criar: () => blocoAtividade(),
            },
        ],
    },
    {
        grupo: "Pergunta",
        itens: [
            {
                id: "pergunta-aberta",
                label: "Pergunta aberta",
                descricao: "Resposta escrita livre.",
                icon: MessageTextSquare02,
                criar: () => blocoPergunta("aberta"),
            },
            {
                id: "pergunta-unica",
                label: "Escolha única",
                descricao: "Selecionar uma opção.",
                icon: Star06,
                criar: () => blocoPergunta("unica"),
            },
            {
                id: "pergunta-multipla",
                label: "Múltipla escolha",
                descricao: "Selecionar várias opções.",
                icon: Star06,
                criar: () => blocoPergunta("multipla"),
            },
        ],
    },
    {
        grupo: "Métrica",
        itens: [
            {
                id: "sus",
                label: "Escala SUS",
                descricao: "10 perguntas que geram um score único de usabilidade (0–100).",
                icon: Speedometer03,
                criar: () => blocoSus(),
            },
        ],
    },
    {
        grupo: "Primeira impressão",
        itens: [
            {
                id: "exposicao",
                label: "Teste de X segundos",
                descricao: "Mostra uma tela do protótipo ou uma imagem por alguns segundos.",
                icon: ClockStopwatch,
                criar: () => blocoExposicao(),
            },
        ],
    },
    {
        grupo: "Comunicação",
        itens: [
            {
                id: "comunicacao",
                label: "Comunicação",
                descricao: "Título, descrição e um botão para avançar.",
                icon: Announcement02,
                criar: () => blocoComunicacao(),
            },
        ],
    },
];

export const ICONE_BLOCO: Record<Bloco["tipo"], typeof Beaker02> = {
    welcome: Star06,
    atividade: Beaker02,
    pergunta: MessageTextSquare02,
    sus: Speedometer03,
    exposicao: ClockStopwatch,
    comunicacao: Announcement02,
    obrigado: Trophy01,
};

export function rotuloTipo(bloco: Bloco): string {
    switch (bloco.tipo) {
        case "welcome":
            return "Tela de boas-vindas";
        case "obrigado":
            return "Tela de agradecimento";
        case "atividade":
            return "Teste de site";
        case "sus":
            return "Escala SUS";
        case "exposicao":
            return `Teste de ${bloco.duracaoSegundos} segundos`;
        case "comunicacao":
            return "Comunicação";
        case "pergunta":
            return bloco.formato === "aberta" ? "Pergunta aberta" : bloco.formato === "unica" ? "Escolha única" : "Múltipla escolha";
    }
}
