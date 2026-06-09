import type { FC } from "react";
import { CheckCircle, Copy01, File02, FileCheck02 } from "@untitledui/icons";

export type TipoResposta = "texto-aberto" | "selecao-unica" | "multipla-selecao" | "anexar-arquivo";

export const TIPO_RESPOSTA: Record<TipoResposta, { label: string; icon: FC<{ className?: string }> }> = {
    "texto-aberto": { label: "Texto aberto", icon: File02 },
    "selecao-unica": { label: "Seleção única", icon: Copy01 },
    "multipla-selecao": { label: "Multipla seleção", icon: CheckCircle },
    "anexar-arquivo": { label: "Anexar arquivo", icon: FileCheck02 },
};

export interface Pergunta {
    id: string;
    titulo: string;
    tipo: TipoResposta;
    ativo: boolean;
    /** Pergunta vinculada a algo em uso — não pode ser deletada, apenas editada. */
    emUso?: boolean;
}

export const PERGUNTAS_MOCK: Pergunta[] = [
    { id: "1", titulo: "Check-in do Atleta", tipo: "texto-aberto", ativo: true, emUso: true },
    { id: "2", titulo: "Pré-Prova: Perfil do Participante", tipo: "selecao-unica", ativo: false },
    { id: "3", titulo: "Questionário Oficial do Evento", tipo: "multipla-selecao", ativo: false, emUso: true },
    { id: "4", titulo: "Avaliação e Cadastro Esportivo", tipo: "anexar-arquivo", ativo: false },
    { id: "5", titulo: "Formulário de Participação Competitiva", tipo: "texto-aberto", ativo: false },
    { id: "6", titulo: "Raio-X do Competidor", tipo: "selecao-unica", ativo: false },
];
