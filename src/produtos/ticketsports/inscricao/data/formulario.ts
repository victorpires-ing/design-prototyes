/* Dados mock do formulário de inscrição (TicketSports).
   Campos que dependem de estoque têm opções com id — o esgotamento é
   controlado em runtime pela página (para simular os cenários de erro). */

export interface Opcao {
    id: string;
    label: string;
}

export type TipoCampo = "texto" | "radio" | "select" | "checkbox";

export interface CampoFormulario {
    id: string;
    label: string;
    obrigatorio?: boolean;
    tipo: TipoCampo;
    placeholder?: string;
    opcoes?: Opcao[];
    /** Campo cujas opções dependem de estoque (podem esgotar). */
    estoque?: boolean;
}

export const EVENTO = {
    nome: "101ª CORRIDA INTERNACIONAL DE SÃO SILVESTRE",
    grupo: "{Nome do grupo}",
    ingresso: "{Nome do ingresso}",
};

export const CAMPOS: CampoFormulario[] = [
    { id: "tel-emergencia", label: "Telefone do contato de emergência", obrigatorio: true, tipo: "texto", placeholder: "(00) 00000-0000" },
    { id: "nome-emergencia", label: "Nome do contato de emergência", obrigatorio: true, tipo: "texto", placeholder: "Nome completo" },
    {
        id: "sexo",
        label: "Sexo do atleta",
        obrigatorio: true,
        tipo: "radio",
        opcoes: [
            { id: "masc", label: "Masculino" },
            { id: "fem", label: "Feminino" },
            { id: "outro", label: "Prefiro não informar" },
        ],
    },
    {
        id: "dia-retirada",
        label: "Dia de retirada do kit",
        obrigatorio: true,
        tipo: "select",
        placeholder: "Selecione o dia",
        estoque: true,
        opcoes: [
            { id: "20-12", label: "20/12/2026" },
            { id: "21-12", label: "21/12/2026" },
            { id: "22-12", label: "22/12/2026" },
        ],
    },
    {
        id: "tamanho",
        label: "Tamanho da camiseta",
        obrigatorio: true,
        tipo: "radio",
        estoque: true,
        opcoes: [
            { id: "p", label: "P" },
            { id: "m", label: "M" },
            { id: "g", label: "G" },
            { id: "gg", label: "GG" },
        ],
    },
];

/* --- Resumo da compra --- */

export const RESUMO = {
    ingresso: {
        qtd: 1,
        grupo: "{Nome do grupo}",
        nome: "Nome do ingresso (completo com quebra)",
        valor: "R$ 119,90",
    },
    produto: {
        nome: "Camisa Oficial #BGSilvestre 2026",
        valor: "R$ 119,90",
        qtd: 1,
    },
    desconto: "-R$ 13,30",
    subtotal: "R$ 320,00",
    total: "R$ 269,90",
};
