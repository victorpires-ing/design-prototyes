/* Store simples (em memória, por sessão) dos dependentes vinculados à conta.
   Compartilhado entre a tela de seleção e a de cadastro de dependente. */

export type Dependente = {
    id: string;
    nome: string;
    cpf: string;
    email?: string;
    iniciais: string;
    vinculo?: string;
};

const dependentes: Dependente[] = [
    { id: "d1", nome: "Mariana Costa Lima", cpf: "943.039.930-00", email: "maria.costa@gmail.com", iniciais: "MC" },
    { id: "d2", nome: "Camilla Queiroz", cpf: "943.039.930-00", email: "camilla.queiroz@gmail.com", iniciais: "CQ" },
    { id: "d3", nome: "Eduardo Carlos", cpf: "943.039.930-32", email: "eduardo.carlos@gmail.com", iniciais: "EC" },
];

let seq = 0;

export const getDependentes = () => dependentes;

export const addDependente = (d: Omit<Dependente, "id">) => {
    const dep: Dependente = { ...d, id: `dep-novo-${(seq += 1)}` };
    dependentes.unshift(dep);
    return dep;
};
