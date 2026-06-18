export const DIAS = [
    { id: "dom", label: "D", nome: "Domingo", curto: "Dom" },
    { id: "seg", label: "S", nome: "Segunda", curto: "Seg" },
    { id: "ter", label: "T", nome: "Terça", curto: "Ter" },
    { id: "qua", label: "Q", nome: "Quarta", curto: "Qua" },
    { id: "qui", label: "Q", nome: "Quinta", curto: "Qui" },
    { id: "sex", label: "S", nome: "Sexta", curto: "Sex" },
    { id: "sab", label: "S", nome: "Sábado", curto: "Sáb" },
];

export interface Rotina {
    nome: string;
    atividade: string;
    dias: string[];
    mesmoHorario: boolean;
    horaGeral: string;
    horaPorDia: Record<string, string>;
    divulgar: boolean;
}

export const MINHA_ROTINA: Rotina = {
    nome: "Treino de força",
    atividade: "academia",
    dias: ["seg", "qua", "sex"],
    mesmoHorario: true,
    horaGeral: "06:30",
    horaPorDia: {},
    divulgar: false,
};
