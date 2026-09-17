/* Massa fictícia de sócios para validação por CPF na LP Lounge Premium Bahia.
   A chave é o CPF só com dígitos. */

export interface Socio {
    nome: string;
    plano: string;
    /** Plano ativo no momento (só sócios ativos podem ser cadastrados). */
    ativo: boolean;
}

export const SOCIOS: Record<string, Socio> = {
    "11144477735": { nome: "Rafael Oliveira Sá", plano: "Sócio Esquadrão Ouro", ativo: true },
    "52998224725": { nome: "Beatriz Andrade Costa", plano: "Lounge Premium", ativo: true },
    "16899535009": { nome: "Thiago Mendes Rocha", plano: "Sócio Esquadrão Prata", ativo: true },
    "39877456014": { nome: "Larissa Gomes Pinto", plano: "Sócio Esquadrão Bronze", ativo: true },
    "24681357900": { nome: "Gustavo Nery Alves", plano: "Lounge Premium", ativo: true },
    "70418655007": { nome: "Otávio Barros Lima", plano: "Sócio Esquadrão Ouro", ativo: true },
    // Sócio com plano inativo — não pode ser cadastrado e, se já estiver na lista, não recebe transferências.
    "85274196300": { nome: "Camila Reis Barbosa", plano: "Sócio Esquadrão Bronze", ativo: false },
    // CPF de teste (todos 2): retorna feedback de plano inativo.
    "22222222222": { nome: "Diego Ferreira Lima", plano: "Sócio Esquadrão Prata", ativo: false },
};

/** Sócio logado (dono da lista de beneficiários). */
export const SOCIO_LOGADO = { nome: "Marina Souza Andrade", plano: "Lounge Premium", desde: "2021" };

export const TEMPORADA = "2026";
/** Prazo final para adicionar beneficiários nesta temporada. */
export const DATA_LIMITE = "28 de fevereiro de 2026";
/** A lista de beneficiários só poderá ser alterada de novo no início da próxima temporada. */
export const DATA_LIBERACAO = "15 de janeiro de 2027";

export const MAX_BENEFICIARIOS = 5;

export const soDigitos = (cpf: string) => cpf.replace(/\D/g, "");

/** Formata CPF parcial: 000.000.000-00 */
export const formatarCpf = (valor: string) => {
    const d = soDigitos(valor).slice(0, 11);
    return d
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
};

/* Gera um sócio fictício ativo para CPFs desconhecidos (11 dígitos), de forma
   determinística — permite testar o fluxo com qualquer número no protótipo. */
const NOMES = ["Ana", "Bruno", "Carla", "Daniel", "Eduarda", "Felipe", "Gabriela", "Henrique", "Isabela", "João", "Karina", "Lucas", "Mariana", "Otávio", "Renata", "Sérgio", "Tatiane", "Vinícius", "Yara", "Wagner"];
const SOBRENOMES = ["Almeida", "Barbosa", "Cardoso", "Dias", "Esteves", "Ferreira", "Gomes", "Lima", "Martins", "Nogueira", "Oliveira", "Pereira", "Queiroz", "Ramos", "Santos", "Teixeira", "Vasconcelos", "Xavier", "Azevedo", "Moraes"];
const PLANOS_ATIVOS = ["Sócio Esquadrão Ouro", "Sócio Esquadrão Prata", "Sócio Esquadrão Bronze", "Lounge Premium"];

export function gerarSocio(digitos: string): Socio {
    const n = (i: number) => Number(digitos[i] ?? "0");
    const nome = `${NOMES[(n(0) * 10 + n(1)) % NOMES.length]} ${SOBRENOMES[(n(2) * 10 + n(3)) % SOBRENOMES.length]}`;
    const plano = PLANOS_ATIVOS[(n(9) * 10 + n(10)) % PLANOS_ATIVOS.length];
    return { nome, plano, ativo: true };
}

/** Resolve o sócio de um CPF: base fictícia ou, se desconhecido, um sócio gerado. */
export const resolverSocio = (digitos: string): Socio => SOCIOS[digitos] ?? gerarSocio(digitos);

export type ResultadoCpf =
    | { status: "vazio" }
    | { status: "incompleto" }
    | { status: "invalido" }
    | { status: "nao-encontrado" }
    | { status: "inativo"; socio: Socio }
    | { status: "duplicado"; socio: Socio }
    | { status: "ok"; socio: Socio };

/** Valida um CPF contra a base fictícia, considerando duplicidade com os já usados. */
export function validarCpf(valor: string, cpfsJaUsados: string[] = []): ResultadoCpf {
    const d = soDigitos(valor);
    if (d.length === 0) return { status: "vazio" };
    if (d.length < 11) return { status: "incompleto" };

    const socio = SOCIOS[d];
    // CPFs conhecidos (mesmo os de teste, como 222.222.222-22) são resolvidos antes da regra de dígitos repetidos.
    if (socio) {
        if (cpfsJaUsados.includes(d)) return { status: "duplicado", socio };
        if (!socio.ativo) return { status: "inativo", socio };
        return { status: "ok", socio };
    }

    // Dígitos todos iguais (ex.: 111.111.111-11) → inválido.
    if (/^(\d)\1{10}$/.test(d)) return { status: "invalido" };

    // CPF desconhecido com 11 dígitos válidos → aceito como sócio fictício ativo (protótipo).
    const gerado = gerarSocio(d);
    if (cpfsJaUsados.includes(d)) return { status: "duplicado", socio: gerado };
    return { status: "ok", socio: gerado };
}
