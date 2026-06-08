import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "react-router";
import { PERGUNTAS_MOCK, type Pergunta, type TipoResposta } from "./perguntas";

interface PerguntaInput {
    titulo: string;
    tipo: TipoResposta;
}

interface PerguntasStoreValue {
    perguntas: Pergunta[];
    getPergunta: (id: string) => Pergunta | undefined;
    addPergunta: (input: PerguntaInput) => Pergunta;
    updatePergunta: (id: string, input: PerguntaInput) => void;
    togglePergunta: (id: string) => void;
    removePergunta: (id: string) => void;
}

const PerguntasContext = createContext<PerguntasStoreValue | null>(null);

let idCounter = 1000;
const nextId = () => String(++idCounter);

export function PerguntasProvider({ children }: { children: ReactNode }) {
    const [searchParams] = useSearchParams();
    const [perguntas, setPerguntas] = useState<Pergunta[]>(() =>
        searchParams.get("vazio") === "1" ? [] : PERGUNTAS_MOCK,
    );

    const getPergunta = useCallback((id: string) => perguntas.find((p) => p.id === id), [perguntas]);

    const addPergunta = useCallback((input: PerguntaInput) => {
        const pergunta: Pergunta = { id: nextId(), titulo: input.titulo, tipo: input.tipo, ativo: true };
        setPerguntas((prev) => [pergunta, ...prev]);
        return pergunta;
    }, []);

    const updatePergunta = useCallback((id: string, input: PerguntaInput) => {
        setPerguntas((prev) => prev.map((p) => (p.id === id ? { ...p, ...input } : p)));
    }, []);

    const togglePergunta = useCallback((id: string) => {
        setPerguntas((prev) => prev.map((p) => (p.id === id ? { ...p, ativo: !p.ativo } : p)));
    }, []);

    const removePergunta = useCallback((id: string) => {
        setPerguntas((prev) => prev.filter((p) => p.id !== id));
    }, []);

    const value = useMemo(
        () => ({ perguntas, getPergunta, addPergunta, updatePergunta, togglePergunta, removePergunta }),
        [perguntas, getPergunta, addPergunta, updatePergunta, togglePergunta, removePergunta],
    );

    return <PerguntasContext.Provider value={value}>{children}</PerguntasContext.Provider>;
}

export function usePerguntas() {
    const ctx = useContext(PerguntasContext);
    if (!ctx) throw new Error("usePerguntas must be used within a PerguntasProvider");
    return ctx;
}
