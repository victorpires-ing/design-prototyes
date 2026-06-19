import { createContext, useCallback, useContext, useMemo, useState, type FC, type ReactNode } from "react";
import { AlignLeft02, Calendar, CalendarCheck01, CheckCircle, CheckSquare, ChevronSelectorVertical, Clock, Hash02, Phone01, Type01, UploadCloud02 } from "@untitledui/icons";

/* ------------------------------------------------------------------ */
/*  Tipos de pergunta                                                 */
/* ------------------------------------------------------------------ */

export type TipoPergunta =
    | "texto-curto"
    | "texto-longo"
    | "numero"
    | "data"
    | "hora"
    | "data-hora"
    | "telefone"
    | "selecao-unica"
    | "multipla-escolha"
    | "dropdown"
    | "anexo";

export const TIPO_PERGUNTA: Record<
    TipoPergunta,
    { label: string; descricao: string; icon: FC<{ className?: string }>; temOpcoes: boolean }
> = {
    "texto-curto": { label: "Texto curto", descricao: "Resposta em uma linha", icon: Type01, temOpcoes: false },
    "texto-longo": { label: "Texto longo", descricao: "Resposta em parágrafo", icon: AlignLeft02, temOpcoes: false },
    numero: { label: "Número", descricao: "Apenas valores numéricos", icon: Hash02, temOpcoes: false },
    data: { label: "Data", descricao: "Seletor de data", icon: Calendar, temOpcoes: false },
    hora: { label: "Hora", descricao: "Seletor de horário", icon: Clock, temOpcoes: false },
    "data-hora": { label: "Data e hora", descricao: "Data e horário juntos", icon: CalendarCheck01, temOpcoes: false },
    telefone: { label: "Telefone", descricao: "Número de telefone", icon: Phone01, temOpcoes: false },
    "selecao-unica": { label: "Seleção única", descricao: "Escolhe uma opção", icon: CheckCircle, temOpcoes: true },
    "multipla-escolha": { label: "Seleção múltipla", descricao: "Escolhe várias opções", icon: CheckSquare, temOpcoes: true },
    dropdown: { label: "Dropdown", descricao: "Lista suspensa (uma opção)", icon: ChevronSelectorVertical, temOpcoes: true },
    anexo: { label: "Upload de arquivo", descricao: "Envio de documento ou imagem", icon: UploadCloud02, temOpcoes: false },
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
    /** Se a resposta é obrigatória no formulário (vale onde a pergunta aparecer). */
    obrigatoria: boolean;
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
    obrigatoria: boolean;
}

/* ------------------------------------------------------------------ */
/*  Mock inicial                                                      */
/* ------------------------------------------------------------------ */

const PERGUNTAS_MOCK: Pergunta[] = [
    { id: "1", titulo: "Nome completo do portador", tipo: "texto-curto", opcoes: [], ativa: true, obrigatoria: true, respostas: 0 },
    { id: "2", titulo: "CPF do portador", ajuda: "Usado para validação na entrada.", tipo: "texto-curto", opcoes: [], ativa: true, obrigatoria: true, respostas: 128 },
    {
        id: "3",
        titulo: "Tamanho da camiseta",
        ajuda: "O kit do evento inclui uma camiseta.",
        tipo: "selecao-unica",
        opcoes: ["P", "M", "G", "GG"],
        ativa: true,
        obrigatoria: true,
        respostas: 42,
    },
    {
        id: "4",
        titulo: "Restrições alimentares",
        tipo: "multipla-escolha",
        opcoes: ["Vegetariano", "Vegano", "Sem glúten", "Sem lactose"],
        ativa: true,
        obrigatoria: false,
        respostas: 0,
    },
    { id: "5", titulo: "Telefone de contato", tipo: "texto-curto", opcoes: [], ativa: false, obrigatoria: false, respostas: 0 },
    { id: "6", titulo: "Documento com foto", ajuda: "Frente e verso de um documento oficial.", tipo: "anexo", opcoes: [], ativa: true, obrigatoria: true, respostas: 0 },
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

/** Item vinculável a uma pergunta — ingresso ou produto. */
export interface ItemVinculavel {
    id: string;
    nome: string;
    grupo: string;
    /** Data/sessão (só ingressos). Produtos não têm. */
    data?: string;
    categoria: "ingresso" | "produto";
    /** Miniatura (só produtos). */
    imagem?: string;
}

const PRODUTOS_MOCK: ItemVinculavel[] = [
    { id: "prod-camiseta", nome: "Camiseta oficial", grupo: "Produtos", categoria: "produto", imagem: "https://picsum.photos/seed/camiseta/96/96" },
    { id: "prod-copo", nome: "Copo colecionável", grupo: "Produtos", categoria: "produto", imagem: "https://picsum.photos/seed/copo/96/96" },
    { id: "prod-estacionamento", nome: "Estacionamento", grupo: "Produtos", categoria: "produto", imagem: "https://picsum.photos/seed/estacionamento/96/96" },
    { id: "prod-kit", nome: "Kit do evento", grupo: "Produtos", categoria: "produto", imagem: "https://picsum.photos/seed/kit/96/96" },
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
    /** Define se a pergunta é obrigatória no formulário (propaga às associações). */
    setObrigatoriaPergunta: (id: string, value: boolean) => void;
    removePergunta: (id: string) => void;
    /** Simulação (protótipo): esvazia o banco de perguntas / restaura o mock. */
    esvaziarBanco: () => void;
    restaurarBanco: () => void;
    /** Quantos tipos de ingresso usam a pergunta. */
    countIngressosDaPergunta: (perguntaId: string) => number;
    /** Tipos de ingresso que usam a pergunta. */
    ingressosDaPergunta: (perguntaId: string) => TipoIngresso[];
    /** Reordena o banco de perguntas pela lista de ids (define a ordem do formulário). */
    reorderPerguntas: (ids: string[]) => void;
    /** Define em quais ingressos a pergunta está presente (adiciona no fim / remove). */
    setIngressosDaPergunta: (perguntaId: string, ingressoIds: string[]) => void;
    /** Todos os itens vinculáveis (ingressos + produtos). */
    itensVinculaveis: ItemVinculavel[];
    /** Itens (ingressos + produtos) que usam a pergunta. */
    itensDaPergunta: (perguntaId: string) => ItemVinculavel[];
    /** Quantos itens (ingressos + produtos) usam a pergunta. */
    countItensDaPergunta: (perguntaId: string) => number;
    /** Define em quais itens (ingressos + produtos) a pergunta está presente. */
    setItensDaPergunta: (perguntaId: string, itemIds: string[]) => void;
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

// Nº de respostas (mock estável por pergunta) — usado só quando a pergunta está associada.
function hashId(s: string): number {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (Math.imul(h, 31) + s.charCodeAt(i)) | 0;
    return Math.abs(h);
}
const mockRespostas = (id: string) => 23 + (hashId(id) % 137);

export function PesquisasProvider({ children }: { children: ReactNode }) {
    // Começa VAZIO — o teste de usabilidade inicia no empty state ("Crie sua primeira pergunta").
    const [perguntas, setPerguntas] = useState<Pergunta[]>([]);
    const [ingressos] = useState<TipoIngresso[]>(INGRESSOS_MOCK);
    const [associacoes, setAssociacoes] = useState<Record<string, AssocItem[]>>({});
    const [titulosFormulario, setTitulosFormulario] = useState<Record<string, string>>(TITULOS_FORMULARIO_MOCK);

    // Respostas só aparecem DEPOIS que a pergunta é associada a algum ingresso.
    const temAssociacao = useCallback(
        (id: string) => Object.values(associacoes).some((itens) => itens.some((it) => it.perguntaId === id)),
        [associacoes],
    );
    const perguntasView = useMemo<Pergunta[]>(
        () => perguntas.map((p) => ({ ...p, respostas: temAssociacao(p.id) ? mockRespostas(p.id) : 0 })),
        [perguntas, temAssociacao],
    );

    const getPergunta = useCallback((id: string) => perguntasView.find((p) => p.id === id), [perguntasView]);

    const addPergunta = useCallback((input: PerguntaInput) => {
        const pergunta: Pergunta = { id: nextId(), respostas: 0, obrigatoria: true, ...input };
        setPerguntas((prev) => [pergunta, ...prev]);
        return pergunta;
    }, []);

    const updatePergunta = useCallback((id: string, input: PerguntaInput) => {
        setPerguntas((prev) => prev.map((p) => (p.id === id ? { ...p, ...input } : p)));
        // Mantém a obrigatoriedade das associações em sincronia com a pergunta.
        setAssociacoes((prev) => {
            const next: Record<string, AssocItem[]> = {};
            for (const [ingressoId, itens] of Object.entries(prev)) {
                next[ingressoId] = itens.map((it) => (it.perguntaId === id ? { ...it, obrigatoria: input.obrigatoria } : it));
            }
            return next;
        });
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

    const esvaziarBanco = useCallback(() => {
        setPerguntas([]);
        setAssociacoes({});
    }, []);
    const restaurarBanco = useCallback(() => {
        setPerguntas(PERGUNTAS_MOCK);
        setAssociacoes(ASSOCIACOES_MOCK);
    }, []);

    const countIngressosDaPergunta = useCallback(
        (perguntaId: string) => Object.values(associacoes).filter((itens) => itens.some((it) => it.perguntaId === perguntaId)).length,
        [associacoes],
    );

    const ingressosDaPergunta = useCallback(
        (perguntaId: string) => ingressos.filter((i) => (associacoes[i.id] ?? []).some((it) => it.perguntaId === perguntaId)),
        [ingressos, associacoes],
    );

    const reorderPerguntas = useCallback((ids: string[]) => {
        setPerguntas((prev) => {
            const byId = new Map(prev.map((p) => [p.id, p]));
            const ordered = ids.map((id) => byId.get(id)).filter((p): p is Pergunta => Boolean(p));
            const missing = prev.filter((p) => !ids.includes(p.id));
            return [...ordered, ...missing];
        });
    }, []);

    const setIngressosDaPergunta = useCallback(
        (perguntaId: string, ingressoIds: string[]) => {
            const alvo = new Set(ingressoIds);
            const obrigatoria = perguntas.find((p) => p.id === perguntaId)?.obrigatoria ?? true;
            setAssociacoes((prev) => {
                const next = { ...prev };
                for (const ing of INGRESSOS_MOCK) {
                    const atuais = next[ing.id] ?? [];
                    const tem = atuais.some((it) => it.perguntaId === perguntaId);
                    if (alvo.has(ing.id) && !tem) next[ing.id] = [...atuais, { perguntaId, obrigatoria }];
                    else if (!alvo.has(ing.id) && tem) next[ing.id] = atuais.filter((it) => it.perguntaId !== perguntaId);
                }
                return next;
            });
        },
        [perguntas],
    );

    const itensVinculaveis = useMemo<ItemVinculavel[]>(
        () => [...ingressos.map((i) => ({ ...i, categoria: "ingresso" as const }))],
        [ingressos],
    );

    const itensDaPergunta = useCallback(
        (perguntaId: string) => itensVinculaveis.filter((it) => (associacoes[it.id] ?? []).some((a) => a.perguntaId === perguntaId)),
        [itensVinculaveis, associacoes],
    );

    const countItensDaPergunta = useCallback((perguntaId: string) => itensDaPergunta(perguntaId).length, [itensDaPergunta]);

    const setItensDaPergunta = useCallback(
        (perguntaId: string, itemIds: string[]) => {
            const alvo = new Set(itemIds);
            const obrigatoria = perguntas.find((p) => p.id === perguntaId)?.obrigatoria ?? true;
            setAssociacoes((prev) => {
                const next = { ...prev };
                for (const it of itensVinculaveis) {
                    const atuais = next[it.id] ?? [];
                    const tem = atuais.some((a) => a.perguntaId === perguntaId);
                    if (alvo.has(it.id) && !tem) next[it.id] = [...atuais, { perguntaId, obrigatoria }];
                    else if (!alvo.has(it.id) && tem) next[it.id] = atuais.filter((a) => a.perguntaId !== perguntaId);
                }
                return next;
            });
        },
        [itensVinculaveis, perguntas],
    );

    // Define obrigatoriedade no nível da pergunta e propaga para todas as associações.
    const setObrigatoriaPergunta = useCallback((id: string, value: boolean) => {
        setPerguntas((prev) => prev.map((p) => (p.id === id ? { ...p, obrigatoria: value } : p)));
        setAssociacoes((prev) => {
            const next: Record<string, AssocItem[]> = {};
            for (const [ingressoId, itens] of Object.entries(prev)) {
                next[ingressoId] = itens.map((it) => (it.perguntaId === id ? { ...it, obrigatoria: value } : it));
            }
            return next;
        });
    }, []);

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
                    const pergunta = perguntasView.find((p) => p.id === it.perguntaId);
                    return pergunta ? { pergunta, obrigatoria: it.obrigatoria } : null;
                })
                .filter((x): x is ItemIngresso => Boolean(x));
        },
        [associacoes, perguntasView],
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
            perguntas: perguntasView,
            ingressos,
            associacoes,
            getPergunta,
            addPergunta,
            updatePergunta,
            togglePergunta,
            setObrigatoriaPergunta,
            removePergunta,
            esvaziarBanco,
            restaurarBanco,
            countIngressosDaPergunta,
            ingressosDaPergunta,
            reorderPerguntas,
            setIngressosDaPergunta,
            itensVinculaveis,
            itensDaPergunta,
            countItensDaPergunta,
            setItensDaPergunta,
            togglePerguntaNoIngresso,
            vincularPerguntasEmIngressos,
            perguntasDoIngresso,
            itensDoIngresso,
            setAssociacao,
            tituloDoIngresso,
            setTituloFormulario,
        }),
        [perguntasView, ingressos, associacoes, getPergunta, addPergunta, updatePergunta, togglePergunta, setObrigatoriaPergunta, removePergunta, esvaziarBanco, restaurarBanco, countIngressosDaPergunta, ingressosDaPergunta, reorderPerguntas, setIngressosDaPergunta, itensVinculaveis, itensDaPergunta, countItensDaPergunta, setItensDaPergunta, togglePerguntaNoIngresso, vincularPerguntasEmIngressos, perguntasDoIngresso, itensDoIngresso, setAssociacao, tituloDoIngresso, setTituloFormulario],
    );

    return <PesquisasContext.Provider value={value}>{children}</PesquisasContext.Provider>;
}

export function usePesquisas() {
    const ctx = useContext(PesquisasContext);
    if (!ctx) throw new Error("usePesquisas must be used within a PesquisasProvider");
    return ctx;
}
