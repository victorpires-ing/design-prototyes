import { createContext, useCallback, useContext, useMemo, useState, type FC, type ReactNode } from "react";
import { AlignLeft02, CheckSquare, Copy01, Paperclip, Type01 } from "@untitledui/icons";

/* ------------------------------------------------------------------ */
/*  Tipos de pergunta                                                 */
/* ------------------------------------------------------------------ */

export type TipoPergunta = "texto-curto" | "texto-longo" | "selecao-unica" | "multipla-escolha" | "anexo";

export const TIPO_PERGUNTA: Record<
    TipoPergunta,
    { label: string; descricao: string; icon: FC<{ className?: string }>; temOpcoes: boolean }
> = {
    "texto-curto": { label: "Texto curto", descricao: "Resposta em uma linha", icon: Type01, temOpcoes: false },
    "texto-longo": { label: "Texto longo", descricao: "Resposta em parágrafo", icon: AlignLeft02, temOpcoes: false },
    "selecao-unica": { label: "Seleção única", descricao: "Escolhe uma opção", icon: Copy01, temOpcoes: true },
    "multipla-escolha": { label: "Múltipla escolha", descricao: "Escolhe várias opções", icon: CheckSquare, temOpcoes: true },
    anexo: { label: "Anexar arquivo", descricao: "Upload de documento ou imagem", icon: Paperclip, temOpcoes: false },
};

export const TIPOS_ORDENADOS = Object.keys(TIPO_PERGUNTA) as TipoPergunta[];

/* ------------------------------------------------------------------ */
/*  Modelos                                                           */
/* ------------------------------------------------------------------ */

export interface Pergunta {
    id: string;
    titulo: string;
    /** Texto de apoio exibido ao comprador. */
    ajuda?: string;
    tipo: TipoPergunta;
    opcoes: string[];
    ativa: boolean;
    /** Nº de respostas já coletadas — trava a exclusão. */
    respostas: number;
}

export interface TipoIngresso {
    id: string;
    nome: string;
    /** Grupo a que o ingresso pertence (nomes de ingresso podem repetir entre grupos). */
    grupo: string;
    /** Data/sessão do evento — nível acima do grupo (data › grupo › ingresso). */
    data: string;
}

/** Pergunta associada a um ingresso — ordem (posição no array) + obrigatoriedade própria. */
export interface AssocItem {
    perguntaId: string;
    obrigatoria: boolean;
}

/** Onde inserir as perguntas no formulário de cada ingresso, no vínculo em massa. */
export interface Insercao {
    modo: "topo" | "fim" | "apos";
    /** Quando modo = "apos": insere após esta posição (1-based) do formulário atual. */
    posicao?: number;
}

/** Pergunta resolvida + obrigatoriedade no contexto do ingresso. */
export interface ItemIngresso {
    pergunta: Pergunta;
    obrigatoria: boolean;
}

export interface PerguntaInput {
    titulo: string;
    ajuda?: string;
    tipo: TipoPergunta;
    opcoes: string[];
    ativa: boolean;
}

/* ------------------------------------------------------------------ */
/*  Mock inicial                                                      */
/* ------------------------------------------------------------------ */

const PERGUNTAS_MOCK: Pergunta[] = [
    { id: "1", titulo: "Nome completo do portador", tipo: "texto-curto", opcoes: [], ativa: true, respostas: 0 },
    { id: "2", titulo: "CPF do portador", ajuda: "Usado para validação na entrada.", tipo: "texto-curto", opcoes: [], ativa: true, respostas: 128 },
    {
        id: "3",
        titulo: "Tamanho da camiseta",
        ajuda: "O kit do evento inclui uma camiseta.",
        tipo: "selecao-unica",
        opcoes: ["P", "M", "G", "GG"],
        ativa: true,
        respostas: 42,
    },
    {
        id: "4",
        titulo: "Restrições alimentares",
        tipo: "multipla-escolha",
        opcoes: ["Vegetariano", "Vegano", "Sem glúten", "Sem lactose"],
        ativa: true,
        respostas: 0,
    },
    { id: "5", titulo: "Telefone de contato", tipo: "texto-curto", opcoes: [], ativa: false, respostas: 0 },
    { id: "6", titulo: "Documento com foto", ajuda: "Frente e verso de um documento oficial.", tipo: "anexo", opcoes: [], ativa: true, respostas: 0 },
];

const TITULO_FORMULARIO_PADRAO = "Informações do portador";

const TITULOS_FORMULARIO_MOCK: Record<string, string> = {
    "camarote-inteira": "Dados para o seu camarote",
};

const DATA_1 = "Sexta, 08/08";
const DATA_2 = "Sábado, 09/08";

const INGRESSOS_MOCK: TipoIngresso[] = [
    // 08/08 — Entrada Geral
    { id: "geral-inteira", nome: "Inteira", grupo: "Entrada Geral", data: DATA_1 },
    { id: "geral-meia", nome: "Meia", grupo: "Entrada Geral", data: DATA_1 },
    { id: "geral-solidaria", nome: "Solidária", grupo: "Entrada Geral", data: DATA_1 },
    // 08/08 — Pista Premium
    { id: "premium-inteira", nome: "Inteira", grupo: "Pista Premium", data: DATA_1 },
    { id: "premium-meia", nome: "Meia", grupo: "Pista Premium", data: DATA_1 },
    // 09/08 — Camarote
    { id: "camarote-inteira", nome: "Inteira", grupo: "Camarote", data: DATA_2 },
    { id: "camarote-meia", nome: "Meia", grupo: "Camarote", data: DATA_2 },
    { id: "camarote-solidaria", nome: "Solidária", grupo: "Camarote", data: DATA_2 },
    // 09/08 — Área VIP
    { id: "vip-inteira", nome: "Inteira", grupo: "Área VIP", data: DATA_2 },
    { id: "vip-meia", nome: "Meia", grupo: "Área VIP", data: DATA_2 },
];

const ASSOCIACOES_MOCK: Record<string, AssocItem[]> = {
    "geral-inteira": [{ perguntaId: "1", obrigatoria: true }],
    "geral-meia": [{ perguntaId: "1", obrigatoria: true }],
    "geral-solidaria": [
        { perguntaId: "1", obrigatoria: true },
        { perguntaId: "6", obrigatoria: true },
    ],
    "premium-inteira": [
        { perguntaId: "1", obrigatoria: true },
        { perguntaId: "3", obrigatoria: true },
    ],
    "camarote-inteira": [
        { perguntaId: "1", obrigatoria: true },
        { perguntaId: "3", obrigatoria: true },
        { perguntaId: "4", obrigatoria: false },
    ],
    "camarote-solidaria": [
        { perguntaId: "1", obrigatoria: true },
        { perguntaId: "6", obrigatoria: true },
    ],
    "vip-inteira": [
        { perguntaId: "1", obrigatoria: true },
        { perguntaId: "2", obrigatoria: true },
        { perguntaId: "6", obrigatoria: true },
    ],
};

/* ------------------------------------------------------------------ */
/*  Store                                                             */
/* ------------------------------------------------------------------ */

interface PesquisasStoreValue {
    perguntas: Pergunta[];
    ingressos: TipoIngresso[];
    associacoes: Record<string, AssocItem[]>;
    getPergunta: (id: string) => Pergunta | undefined;
    addPergunta: (input: PerguntaInput) => Pergunta;
    updatePergunta: (id: string, input: PerguntaInput) => void;
    togglePergunta: (id: string) => void;
    removePergunta: (id: string) => void;
    /** Simulação (protótipo): esvazia o banco de perguntas / restaura o mock. */
    esvaziarBanco: () => void;
    restaurarBanco: () => void;
    /** Quantos tipos de ingresso usam a pergunta. */
    countIngressosDaPergunta: (perguntaId: string) => number;
    /** Tipos de ingresso que usam a pergunta. */
    ingressosDaPergunta: (perguntaId: string) => TipoIngresso[];
    /** Adiciona/remove a pergunta de um ingresso (mantém ordem ao adicionar no fim). */
    togglePerguntaNoIngresso: (ingressoId: string, perguntaId: string) => void;
    /** Vincula um conjunto ordenado de perguntas (com obrigatoriedade) a vários ingressos, na posição indicada. */
    vincularPerguntasEmIngressos: (ingressoIds: string[], itens: AssocItem[], insercao: Insercao) => void;
    /** Perguntas associadas a um ingresso, na ordem definida. */
    perguntasDoIngresso: (ingressoId: string) => Pergunta[];
    /** Itens (pergunta + obrigatoriedade) de um ingresso, na ordem definida. */
    itensDoIngresso: (ingressoId: string) => ItemIngresso[];
    /** Substitui toda a associação de um ingresso (ordem + obrigatoriedade). */
    setAssociacao: (ingressoId: string, itens: AssocItem[]) => void;
    /** Título do formulário exibido ao comprador para um ingresso. */
    tituloDoIngresso: (ingressoId: string) => string;
    setTituloFormulario: (ingressoId: string, titulo: string) => void;
}

const PesquisasContext = createContext<PesquisasStoreValue | null>(null);

let idCounter = 1000;
const nextId = () => String(++idCounter);

export function PesquisasProvider({ children }: { children: ReactNode }) {
    const [perguntas, setPerguntas] = useState<Pergunta[]>(PERGUNTAS_MOCK);
    const [ingressos] = useState<TipoIngresso[]>(INGRESSOS_MOCK);
    const [associacoes, setAssociacoes] = useState<Record<string, AssocItem[]>>(ASSOCIACOES_MOCK);
    const [titulosFormulario, setTitulosFormulario] = useState<Record<string, string>>(TITULOS_FORMULARIO_MOCK);

    const getPergunta = useCallback((id: string) => perguntas.find((p) => p.id === id), [perguntas]);

    const addPergunta = useCallback((input: PerguntaInput) => {
        const pergunta: Pergunta = { id: nextId(), respostas: 0, ...input };
        setPerguntas((prev) => [pergunta, ...prev]);
        return pergunta;
    }, []);

    const updatePergunta = useCallback((id: string, input: PerguntaInput) => {
        setPerguntas((prev) => prev.map((p) => (p.id === id ? { ...p, ...input } : p)));
    }, []);

    const togglePergunta = useCallback((id: string) => {
        setPerguntas((prev) => prev.map((p) => (p.id === id ? { ...p, ativa: !p.ativa } : p)));
    }, []);

    const removePergunta = useCallback((id: string) => {
        setPerguntas((prev) => prev.filter((p) => p.id !== id));
        setAssociacoes((prev) => {
            const next: Record<string, AssocItem[]> = {};
            for (const [ingressoId, itens] of Object.entries(prev)) next[ingressoId] = itens.filter((it) => it.perguntaId !== id);
            return next;
        });
    }, []);

    const esvaziarBanco = useCallback(() => setPerguntas([]), []);
    const restaurarBanco = useCallback(() => setPerguntas(PERGUNTAS_MOCK), []);

    const countIngressosDaPergunta = useCallback(
        (perguntaId: string) => Object.values(associacoes).filter((itens) => itens.some((it) => it.perguntaId === perguntaId)).length,
        [associacoes],
    );

    const ingressosDaPergunta = useCallback(
        (perguntaId: string) => ingressos.filter((i) => (associacoes[i.id] ?? []).some((it) => it.perguntaId === perguntaId)),
        [ingressos, associacoes],
    );

    const togglePerguntaNoIngresso = useCallback((ingressoId: string, perguntaId: string) => {
        setAssociacoes((prev) => {
            const atuais = prev[ingressoId] ?? [];
            const next = atuais.some((it) => it.perguntaId === perguntaId)
                ? atuais.filter((it) => it.perguntaId !== perguntaId)
                : [...atuais, { perguntaId, obrigatoria: true }];
            return { ...prev, [ingressoId]: next };
        });
    }, []);

    const vincularPerguntasEmIngressos = useCallback((ingressoIds: string[], itens: AssocItem[], insercao: Insercao) => {
        setAssociacoes((prev) => {
            const next = { ...prev };
            for (const ingressoId of ingressoIds) {
                const atuais = next[ingressoId] ?? [];
                const existentes = new Set(atuais.map((it) => it.perguntaId));
                const novos = itens.filter((it) => !existentes.has(it.perguntaId)).map((it) => ({ ...it }));
                if (novos.length === 0) continue;
                if (insercao.modo === "topo") {
                    next[ingressoId] = [...novos, ...atuais];
                } else if (insercao.modo === "apos") {
                    const k = Math.min(Math.max(insercao.posicao ?? atuais.length, 0), atuais.length);
                    next[ingressoId] = [...atuais.slice(0, k), ...novos, ...atuais.slice(k)];
                } else {
                    next[ingressoId] = [...atuais, ...novos];
                }
            }
            return next;
        });
    }, []);

    const itensDoIngresso = useCallback(
        (ingressoId: string): ItemIngresso[] => {
            const itens = associacoes[ingressoId] ?? [];
            return itens
                .map((it) => {
                    const pergunta = perguntas.find((p) => p.id === it.perguntaId);
                    return pergunta ? { pergunta, obrigatoria: it.obrigatoria } : null;
                })
                .filter((x): x is ItemIngresso => Boolean(x));
        },
        [associacoes, perguntas],
    );

    const perguntasDoIngresso = useCallback((ingressoId: string) => itensDoIngresso(ingressoId).map((it) => it.pergunta), [itensDoIngresso]);

    const setAssociacao = useCallback((ingressoId: string, itens: AssocItem[]) => {
        setAssociacoes((prev) => ({ ...prev, [ingressoId]: itens }));
    }, []);

    const tituloDoIngresso = useCallback((ingressoId: string) => titulosFormulario[ingressoId] ?? TITULO_FORMULARIO_PADRAO, [titulosFormulario]);

    const setTituloFormulario = useCallback((ingressoId: string, titulo: string) => {
        setTitulosFormulario((prev) => ({ ...prev, [ingressoId]: titulo }));
    }, []);

    const value = useMemo<PesquisasStoreValue>(
        () => ({
            perguntas,
            ingressos,
            associacoes,
            getPergunta,
            addPergunta,
            updatePergunta,
            togglePergunta,
            removePergunta,
            esvaziarBanco,
            restaurarBanco,
            countIngressosDaPergunta,
            ingressosDaPergunta,
            togglePerguntaNoIngresso,
            vincularPerguntasEmIngressos,
            perguntasDoIngresso,
            itensDoIngresso,
            setAssociacao,
            tituloDoIngresso,
            setTituloFormulario,
        }),
        [perguntas, ingressos, associacoes, getPergunta, addPergunta, updatePergunta, togglePergunta, removePergunta, esvaziarBanco, restaurarBanco, countIngressosDaPergunta, ingressosDaPergunta, togglePerguntaNoIngresso, vincularPerguntasEmIngressos, perguntasDoIngresso, itensDoIngresso, setAssociacao, tituloDoIngresso, setTituloFormulario],
    );

    return <PesquisasContext.Provider value={value}>{children}</PesquisasContext.Provider>;
}

export function usePesquisas() {
    const ctx = useContext(PesquisasContext);
    if (!ctx) throw new Error("usePesquisas must be used within a PesquisasProvider");
    return ctx;
}
