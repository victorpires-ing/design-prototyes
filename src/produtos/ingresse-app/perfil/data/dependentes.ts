/* Store dos dependentes vinculados à conta (mock em memória por sessão).
   Compartilhado entre a lista (perfil), o cadastro, a habilitação de acesso e "Pessoas com acesso".
   Reativo: as telas assinam com `useDependentes` e re-renderizam quando algo muda. */

import { useSyncExternalStore } from "react";
import { mostrarToast } from "../../components/AppToast";
import { getPerfilAtivo, sairDoPerfil } from "../../components/perfil-ativo";

/** Condição do acesso ao perfil do dependente, do ponto de vista de quem está logado. */
export type Acesso = "nao-configurado" | "preparando" | "falhou" | "pronto" | "conta-propria";

export type Papel = "administrador" | "acesso";

export type PessoaComAcesso = {
    id: string;
    nome: string;
    iniciais: string;
    papel: Papel;
    /** Data em que habilitou o acesso: define quem herda a administração. */
    desde: string;
    /** A pessoa logada (Janaina). */
    voce?: boolean;
};

/** Ingressos do dependente que quem está logado pode acessar (atribuídos por ela ou do próprio dependente). */
export type IngressoDoDependente = { eventId: string; itens: string[] };

export type Dependente = {
    id: string;
    nome: string;
    nascimento: string;
    cpf: string;
    parentesco: string;
    iniciais: string;
    acesso: Acesso;
    /** Conta própria criada depois que o perfil já era gerenciado (os acessos foram encerrados). */
    contaCriadaDepois?: boolean;
    pessoas: PessoaComAcesso[];
    carteira: IngressoDoDependente[];
};

export const EU = { id: "eu", nome: "Janaina Nascimento de Souza", iniciais: "JS" };

const dependentes: Dependente[] = [
    {
        id: "d1",
        nome: "Mariana Costa Lima",
        nascimento: "12/03/2012",
        cpf: "943.039.930-00",
        parentesco: "Filha",
        iniciais: "ML",
        acesso: "pronto",
        pessoas: [
            { id: "eu", nome: EU.nome, iniciais: EU.iniciais, papel: "administrador", desde: "02/02/2026", voce: true },
            { id: "p-carlos", nome: "Carlos Lima", iniciais: "CL", papel: "acesso", desde: "15/03/2026" },
            { id: "p-helena", nome: "Helena Costa", iniciais: "HC", papel: "acesso", desde: "08/05/2026" },
        ],
        carteira: [
            { eventId: "arena", itens: ["1"] },
            { eventId: "samba-independente", itens: ["samba-04jul"] },
        ],
    },
    {
        id: "d2",
        nome: "Eduardo Carlos Souza",
        nascimento: "25/07/2010",
        cpf: "821.554.310-22",
        parentesco: "Filho",
        iniciais: "ES",
        acesso: "pronto",
        // Aqui a Janaina não é a administradora: só pode remover o próprio acesso.
        pessoas: [
            { id: "p-paulo", nome: "Paulo Souza", iniciais: "PS", papel: "administrador", desde: "10/01/2026" },
            { id: "eu", nome: EU.nome, iniciais: EU.iniciais, papel: "acesso", desde: "20/04/2026", voce: true },
        ],
        // Só os ingressos que a Janaina atribuiu; os que o Paulo atribuiu não aparecem para ela.
        carteira: [{ eventId: "samba-independente", itens: ["samba-18jul"] }],
    },
    {
        id: "d3",
        nome: "Lucas Nascimento",
        nascimento: "30/09/2016",
        cpf: "512.880.467-31",
        parentesco: "Sobrinho",
        iniciais: "LN",
        acesso: "nao-configurado",
        pessoas: [],
        carteira: [{ eventId: "arena", itens: ["uniforme-oficial"] }],
    },
    {
        id: "d4",
        nome: "Regina Nascimento de Souza",
        nascimento: "08/11/1962",
        cpf: "304.118.765-09",
        parentesco: "Mãe",
        iniciais: "RS",
        acesso: "conta-propria",
        pessoas: [],
        carteira: [],
    },
];

/* ------------------------------ Reatividade ------------------------------ */

let versao = 0;
const listeners = new Set<() => void>();
const notify = () => {
    versao += 1;
    listeners.forEach((l) => l());
};
const subscribe = (cb: () => void) => {
    listeners.add(cb);
    return () => listeners.delete(cb);
};

/** Re-renderiza quando a lista ou o acesso de algum dependente muda. */
export const useDependentes = () => {
    useSyncExternalStore(subscribe, () => versao);
    return dependentes;
};

export const getDependentes = () => dependentes;
export const getDependente = (id?: string) => dependentes.find((d) => d.id === id);
export const primeiroNome = (d: Pick<Dependente, "nome">) => d.nome.split(" ")[0];

/* ------------------------------- Cadastro ------------------------------- */

let seq = 0;
let ultimoAdicionado: string | null = null;

/** Cadastro de sempre: o dependente entra na lista com o acesso ainda não configurado. */
export const addDependente = (d: Pick<Dependente, "nome" | "nascimento" | "cpf" | "parentesco" | "iniciais">) => {
    const dep: Dependente = { ...d, id: `dep-novo-${(seq += 1)}`, acesso: "nao-configurado", pessoas: [], carteira: [] };
    dependentes.unshift(dep);
    ultimoAdicionado = dep.id;
    notify();
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
    if (getPerfilAtivo()?.id === id) sairDoPerfil();
    notify();
};

/* ------------------------- Habilitação do acesso ------------------------- */

/** Tempo (simulado) para preparar o perfil depois da confirmação por código. */
export const PREPARO_MS = 5000;

/** Cenário de teste: a próxima habilitação falha (?cenario=falha na lista de dependentes). */
let proximaFalha = false;
export const simularFalhaNaProxima = () => {
    proximaFalha = true;
};

const hoje = () => new Date().toLocaleDateString("pt-BR");

/** Depois do código: o perfil passa a "preparando" e conclui (ou falha) sozinho, mesmo fora da tela. */
export const iniciarHabilitacao = (id: string) => {
    const d = getDependente(id);
    if (!d) return;
    d.acesso = "preparando";
    notify();
    const falhar = proximaFalha;
    proximaFalha = false;
    window.setTimeout(() => {
        const atual = getDependente(id);
        if (!atual || atual.acesso !== "preparando") return;
        if (falhar) {
            atual.acesso = "falhou";
        } else {
            atual.acesso = "pronto";
            // Quem habilita primeiro vira administrador do perfil.
            const papel: Papel = atual.pessoas.some((p) => p.papel === "administrador") ? "acesso" : "administrador";
            atual.pessoas = [...atual.pessoas.filter((p) => !p.voce), { ...EU, papel, desde: hoje(), voce: true }];
        }
        notify();
        // Fora da tela de habilitação, avisa quando terminar.
        if (!window.location.pathname.includes("/habilitar")) {
            if (falhar) mostrarToast("Não foi possível habilitar o acesso", `Tente de novo nas opções de ${primeiroNome(atual)}, em Dependentes.`, "aviso");
            else mostrarToast("Acesso habilitado", `Você já pode entrar como ${primeiroNome(atual)}.`);
        }
    }, PREPARO_MS);
};

/* --------------------------- Remoção de acesso --------------------------- */

/** Quem herda a administração: a pessoa com acesso há mais tempo (fora quem está saindo). */
const maisAntigo = (pessoas: PessoaComAcesso[]) =>
    [...pessoas].sort((a, b) => a.desde.split("/").reverse().join("").localeCompare(b.desde.split("/").reverse().join("")))[0];

/** O que acontece se `pessoaId` sair: quem vira administrador, ou se o perfil gerenciado é desativado. */
export const consequenciaDaSaida = (d: Dependente, pessoaId: string) => {
    const saindo = d.pessoas.find((p) => p.id === pessoaId);
    const restantes = d.pessoas.filter((p) => p.id !== pessoaId);
    if (restantes.length === 0) return { tipo: "desativa" as const };
    if (saindo?.papel === "administrador") return { tipo: "transfere" as const, para: maisAntigo(restantes) };
    return { tipo: "nada" as const };
};

export const removerAcesso = (id: string, pessoaId: string) => {
    const d = getDependente(id);
    if (!d) return;
    const c = consequenciaDaSaida(d, pessoaId);
    const restantes = d.pessoas.filter((p) => p.id !== pessoaId);
    if (c.tipo === "transfere") restantes.forEach((p) => p.id === c.para.id && (p.papel = "administrador"));
    d.pessoas = restantes;
    // Saí eu: o perfil deixa de estar disponível para mim (o dependente continua cadastrado).
    if (pessoaId === "eu") {
        d.acesso = "nao-configurado";
        if (getPerfilAtivo()?.id === id) sairDoPerfil();
    }
    notify();
};

/** Cenário de teste: o dependente criou a própria conta e os acessos gerenciados foram encerrados. */
export const simularContaCriada = (id: string) => {
    const d = getDependente(id);
    if (!d || d.acesso === "conta-propria") return;
    d.acesso = "conta-propria";
    d.contaCriadaDepois = true;
    d.pessoas = [];
    if (getPerfilAtivo()?.id === id) sairDoPerfil();
    notify();
};
