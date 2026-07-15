import saoSilvestrinhaThumb from "../components/assets/sao-silvestrinha.jpg";
import saoSilvestrePetsThumb from "../components/assets/sao-silvestre-pets.png";
import { SOLICITACOES } from "./solicitacoes";

/** Total de solicitações recebidas — mesmo valor para todos os eventos, já que os pedidos mock não são segmentados por evento. */
const TOTAL_SOLICITACOES_RECEBIDAS = SOLICITACOES.length;

export type LimiteSolicitacoes = "ilimitado" | "limitado";

export interface FormularioParticipacao {
    id: string;
    titulo: string;
    /** Data de exibição já formatada (ex: "Quinta, 31 Dez 2026"). */
    data: string;
    imagem: string;
    rascunho: boolean;
    ativo: boolean;
    limite: LimiteSolicitacoes;
    quantidadeLimite?: number;
    solicitacoesRecebidas: number;
}

/** Array mutável compartilhado — mantém os formulários entre navegações (sem backend real). */
export const FORMULARIOS: FormularioParticipacao[] = [
    {
        id: "sao-silvestrinha",
        titulo: "São Silvestrinha",
        data: "Quinta, 31 Dez 2026",
        imagem: saoSilvestrinhaThumb,
        rascunho: true,
        ativo: false,
        limite: "limitado",
        quantidadeLimite: 100,
        solicitacoesRecebidas: TOTAL_SOLICITACOES_RECEBIDAS,
    },
    {
        id: "sao-silvestre-pets",
        titulo: "São Silvestre pets",
        data: "Quinta, 31 Dez 2026",
        imagem: saoSilvestrePetsThumb,
        rascunho: true,
        ativo: true,
        limite: "limitado",
        quantidadeLimite: TOTAL_SOLICITACOES_RECEBIDAS,
        solicitacoesRecebidas: TOTAL_SOLICITACOES_RECEBIDAS,
    },
];

/** Adiciona um novo formulário ao array compartilhado. */
export function adicionarFormulario(novo: FormularioParticipacao) {
    FORMULARIOS.push(novo);
}

/** Atualiza (in-place) um formulário existente pelo id. */
export function atualizarFormulario(id: string, patch: Partial<FormularioParticipacao>) {
    const formulario = FORMULARIOS.find((f) => f.id === id);
    if (formulario) Object.assign(formulario, patch);
}
