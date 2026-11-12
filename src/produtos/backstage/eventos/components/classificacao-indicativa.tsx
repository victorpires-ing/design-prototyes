import type { FC } from "react";

/*
 * Caixas da classificação indicativa brasileira (ClassInd), usadas na idade mínima (EVT-94): a cor
 * e a sigla são do padrão oficial, por isso são valores fixos, não tokens. Mostradas na lista e no
 * campo depois de escolher (ícone do item no Select do DS).
 */

const CLASSIFICACOES: Record<string, { sigla: string; fundo: string; texto: string; nome: string }> = {
    "0": { sigla: "L", fundo: "#0C9447", texto: "#FFFFFF", nome: "Livre" },
    "10": { sigla: "10", fundo: "#0F7DC2", texto: "#FFFFFF", nome: "10 anos" },
    "12": { sigla: "12", fundo: "#F8C411", texto: "#1D1815", nome: "12 anos" },
    "14": { sigla: "14", fundo: "#E67824", texto: "#FFFFFF", nome: "14 anos" },
    "16": { sigla: "16", fundo: "#DB2827", texto: "#FFFFFF", nome: "16 anos" },
    "18": { sigla: "18", fundo: "#1D1815", texto: "#FFFFFF", nome: "18 anos" },
};

/**
 * Componente de ícone para o Select (recebe e ignora as props do ícone de propósito: sem o
 * `data-icon`, o Select não força 20 px e a caixa fica com 24 px e número em 14 px).
 */
const caixa = (idade: string): FC => {
    const c = CLASSIFICACOES[idade];
    const Caixa: FC = () => (
        <span
            aria-hidden="true"
            className="flex size-6 shrink-0 items-center justify-center rounded-[5px] text-sm leading-none font-bold tabular-nums"
            style={{ backgroundColor: c.fundo, color: c.texto }}
        >
            {c.sigla}
        </span>
    );
    Caixa.displayName = `Classificacao${c.sigla}`;
    return Caixa;
};

export const IDADES_COM_CLASSIFICACAO = Object.entries(CLASSIFICACOES).map(([id, c]) => ({ id, label: c.nome, icon: caixa(id) }));
