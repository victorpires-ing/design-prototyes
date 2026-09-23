/* Store dos dependentes vinculados à conta (mock em memória por sessão).
   Compartilhado entre a lista (perfil) e a tela de cadastro. */

export type Dependente = {
    id: string;
    nome: string;
    nascimento: string;
    cpf: string;
    parentesco: string;
    iniciais: string;
};

const dependentes: Dependente[] = [
    { id: "d1", nome: "Mariana Costa Lima", nascimento: "12/03/1998", cpf: "943.039.930-00", parentesco: "Filha", iniciais: "ML" },
    { id: "d2", nome: "Eduardo Carlos Souza", nascimento: "25/07/2005", cpf: "821.554.310-22", parentesco: "Filho", iniciais: "ES" },
    { id: "d3", nome: "Regina Nascimento de Souza", nascimento: "08/11/1962", cpf: "304.118.765-09", parentesco: "Mãe", iniciais: "RS" },
];

let seq = 0;
let ultimoAdicionado: string | null = null;

export const getDependentes = () => dependentes;

export const addDependente = (d: Omit<Dependente, "id">) => {
    const dep: Dependente = { ...d, id: `dep-novo-${(seq += 1)}` };
    dependentes.unshift(dep);
    ultimoAdicionado = dep.id;
    return dep;
};

/** Retorna (e limpa) o id do último dependente cadastrado — para animar sua entrada na lista. */
export const consumirUltimoAdicionado = () => {
    const v = ultimoAdicionado;
    ultimoAdicionado = null;
    return v;
};

export const removeDependente = (id: string) => {
    const i = dependentes.findIndex((d) => d.id === id);
    if (i >= 0) dependentes.splice(i, 1);
};
