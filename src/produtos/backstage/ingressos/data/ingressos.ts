export interface Lote {
    id: string;
    name: string;
    virada: string;
    preco: string;
    emissoes: string;
}

export interface Ingresso {
    id: string;
    name: string;
    active: boolean;
    /** Ex.: "1 de 1 lotes à venda" */
    lotesLabel: string;
    virada: string;
    preco: string;
    emissoes: string;
    pendente: string;
    lotes: Lote[];
}

export interface Grupo {
    id: string;
    name: string;
    emissoes: string;
    pendentes: string;
    acesso: string;
    ingressos: Ingresso[];
}

export const GRUPOS: Grupo[] = [
    {
        id: "camarote",
        name: "Camarote",
        emissoes: "0 de 1.000",
        pendentes: "0",
        acesso: "Acesso não definido",
        ingressos: [
            {
                id: "camarote-ing",
                name: "Camarote",
                active: true,
                lotesLabel: "1 de 1 lotes à venda",
                virada: "Ao atingir estoque",
                preco: "R$ 60,00",
                emissoes: "0 de 1.000",
                pendente: "0 pendente",
                lotes: [{ id: "camarote-l1", name: "Lote 1", virada: "Ao atingir estoque", preco: "R$ 60,00", emissoes: "0 de 1.000" }],
            },
        ],
    },
    {
        id: "pista",
        name: "Pista",
        emissoes: "3 de 1.000",
        pendentes: "0",
        acesso: "Acesso não definido",
        ingressos: [
            {
                id: "pista-ing",
                name: "Pista",
                active: true,
                lotesLabel: "1 de 1 lotes à venda",
                virada: "Ao atingir estoque",
                preco: "R$ 1,00",
                emissoes: "2 de 1.000",
                pendente: "0 pendente",
                lotes: [{ id: "pista-l1", name: "Lote 1", virada: "Ao atingir estoque", preco: "R$ 1,00", emissoes: "2 de 1.000" }],
            },
            {
                id: "teste-ing",
                name: "Teste",
                active: true,
                lotesLabel: "1 de 1 lotes à venda",
                virada: "Ao atingir estoque",
                preco: "R$ 0,00",
                emissoes: "1 de 1.000",
                pendente: "0 pendente",
                lotes: [{ id: "teste-l1", name: "Lote 1", virada: "Ao atingir estoque", preco: "R$ 0,00", emissoes: "1 de 1.000" }],
            },
        ],
    },
];
