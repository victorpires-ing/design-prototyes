import type { FC } from "react";
import festivalAurora from "../assets/festival-aurora.svg";
import showPalco from "../assets/show-palco.svg";
import uberLogo from "../assets/uber-logo.svg";
import { IconlyCalendario, IconlyCamera, IconlyCarro, IconlyCarteira, IconlyCartao, IconlyComida, IconlyDesconto, IconlyEnviar, IconlyEscudo, IconlyImagem, IconlyRaio } from "../components/icones-iconly";

/**
 * Serviços adicionais — configuração das ofertas.
 *
 * Cada serviço é só dado: a mesma estrutura de página (contexto do evento, apresentação,
 * benefícios, seleção de valor, resumo e condições) monta qualquer oferta. Um serviço novo
 * (seguro, estacionamento, entrada expressa...) entra aqui sem tela nova, e a futura página
 * com vários serviços ("Checklist do Rolê") pode reaproveitar os mesmos blocos.
 *
 * TODOS os valores, descontos e condições são ILUSTRATIVOS — não são condições comerciais
 * confirmadas com os parceiros.
 */

export type ServicoId = "uber" | "meep" | "fotos" | "seguro";

export interface Beneficio {
    icone: FC<{ className?: string }>;
    texto: string;
}

export interface Servico {
    id: ServicoId;
    parceiro: string;
    /** Logo oficial do parceiro; sem ela, a página usa o selo provisório com o nome. */
    logo?: string;
    /** Sem logo de parceiro: ícone no selo, no lugar do nome (ex.: câmera nas fotos). */
    iconeSelo?: FC<{ className?: string }>;
    /** Cor de fundo do selo com ícone (classe de token). */
    corSelo?: string;
    categoria: string;
    /** Título da oferta. `chamada` vem na linha de baixo e termina no `destaque`, em cor de marca. */
    titulo: string;
    chamada?: string;
    destaque?: string;
    descricao: string;
    beneficios: Beneficio[];
    pergunta: string;
    /** Nome do que se compra, usado no resumo ("Crédito Uber", "Saldo Meep"). */
    item: string;
    valores: number[];
    /** Nome de cada opção quando não é crédito, e sim um pacote (ex.: 49 → "15 fotos"). */
    pacotes?: Record<number, string>;
    /** Fração de desconto sobre o valor (0.05 = 5%). 0 = sem desconto. */
    desconto: number;
    /** Mostra a opção "Outro valor" (serviços de crédito ou recarga: Uber e Meep; pacotes não têm). */
    outroValor: boolean;
    minimo: number;
    maximo: number;
    cta: string;
    /** Aviso curto exibido junto da seleção de valor. */
    aviso?: string;
    condicoes: string[];
    /** Conta que recebe o crédito, mostrada no checkout. */
    destino: { rotulo: string; valor: string };
    parcelamento?: string;
    confirmacao: { titulo: string; descricao: string; passos?: string[] };
    /**
     * Resgate por código + link do app do parceiro (Uber). As duas são alternativas, não etapas:
     * usar uma invalida a outra. No protótipo o código é ilustrativo e a ativação é simulada.
     */
    resgate?: { cta: string; link: string; orientacao: string };
}

export const EVENTO = {
    nome: "Festival Aurora 2026",
    dataLabel: "Sáb, 12 dez · 16h",
    local: "Parque Villa-Lobos, São Paulo",
    dataCompleta: "Sábado, 12 de dezembro de 2026 · 16h",
    contagem: "Faltam 3 dias",
    /** Arte larga: fundo desfocado do header. */
    cover: showPalco,
    /** Pôster 3:4 do card do evento. */
    poster: festivalAurora,
};

export const USUARIO = { nome: "Mariana Costa", email: "mariana.costa@email.com", cpf: "***.482.317-**" };

export const SERVICOS: Record<ServicoId, Servico> = {
    uber: {
        id: "uber",
        parceiro: "Uber",
        logo: uberLogo,
        categoria: "Transporte",
        titulo: "Crédito Uber para seus próximos destinos",
        descricao: "Compre créditos para usar em viagens pelo app da Uber.",
        beneficios: [
            { icone: IconlyDesconto, texto: "5% de desconto no valor do crédito" },
            { icone: IconlyCartao, texto: "Parcele em até 2x sem juros" },
            { icone: IconlyCarro, texto: "Use em viagens para shows, festivais e outros destinos" },
        ],
        pergunta: "Escolha o valor do crédito",
        item: "Crédito Uber",
        valores: [50, 100, 150],
        desconto: 0.05,
        outroValor: true,
        minimo: 20,
        maximo: 500,
        cta: "Comprar crédito Uber",
        condicoes: [
            "O crédito vai para a conta Uber ligada ao seu e-mail.",
            "Válido por 30 dias depois da compra, em viagens dentro do Brasil.",
            "Não pode ser trocado por dinheiro nem transferido para outra conta.",
        ],
        destino: { rotulo: "Conta Uber que recebe o crédito", valor: USUARIO.email },
        parcelamento: "em até 2x sem juros no cartão",
        confirmacao: {
            titulo: "Crédito Uber comprado!",
            descricao: "Sua compra foi confirmada. Agora é só ativar seu crédito na Uber.",
        },
        resgate: {
            cta: "Ativar crédito na Uber",
            // Ilustrativo: na integração, vem o link de resgate do crédito comprado
            link: "https://m.uber.com/ul/?action=applyPromo",
            orientacao: "Ative seu crédito pelo botão acima ou copie o código para resgatar no app Uber.",
        },
    },
    meep: {
        id: "meep",
        parceiro: "Meep",
        categoria: "Consumo no evento",
        titulo: "Recarregue antes e aproveite o evento sem filas",
        descricao: "Carregue seu saldo agora e use nos bares, comidas e lojas do evento.",
        beneficios: [
            { icone: IconlyRaio, texto: "Sem fila de recarga no dia" },
            { icone: IconlyComida, texto: "Use em bares, comidas e lojas" },
            { icone: IconlyCarteira, texto: "Saldo pronto para usar ao chegar" },
        ],
        pergunta: "Quanto você quer carregar?",
        item: "Saldo Meep",
        valores: [50, 100, 150],
        desconto: 0,
        outroValor: true,
        minimo: 10,
        maximo: 1000,
        cta: "Recarregar agora",
        aviso: "O saldo que não for usado pode ser devolvido depois do evento, conforme as regras da Meep.",
        condicoes: [
            "O saldo fica no seu cadastro Meep e vale durante todo o evento.",
            "Ao chegar, é só se identificar com o seu CPF nos pontos de venda.",
            "Pedidos de devolução do saldo seguem as regras e prazos da Meep.",
        ],
        destino: { rotulo: "CPF do cadastro Meep", valor: USUARIO.cpf },
        confirmacao: {
            titulo: "Recarga confirmada",
            descricao: "Seu saldo já está no cadastro Meep e fica disponível durante todo o evento.",
            passos: ["No evento, use o seu CPF para pagar nos bares, comidas e lojas.", "Acompanhe o saldo pelo app da Meep."],
        },
    },
    fotos: {
        id: "fotos",
        parceiro: "Fotos do rolê",
        iconeSelo: IconlyCamera,
        corSelo: "bg-utility-purple-600",
        categoria: "Fotografia",
        titulo: "Suas fotos do rolê, feitas por fotógrafos profissionais",
        descricao: "Garanta as fotos que os fotógrafos fizerem de você durante o evento.",
        beneficios: [
            { icone: IconlyCamera, texto: "Fotógrafos profissionais circulando no evento" },
            { icone: IconlyImagem, texto: "Fotos em alta, sem marca d'água" },
            { icone: IconlyEnviar, texto: "Receba por e-mail em até 48 horas" },
        ],
        pergunta: "Escolha o pacote",
        item: "Fotos do rolê",
        valores: [29, 49, 79],
        pacotes: { 29: "5 fotos", 49: "15 fotos", 79: "Todas as suas" },
        desconto: 0,
        outroValor: false,
        minimo: 29,
        maximo: 79,
        cta: "Garantir minhas fotos",
        condicoes: [
            "As fotos são encontradas por reconhecimento facial a partir da selfie enviada depois da compra.",
            "Se nenhuma foto sua for encontrada, o valor é devolvido.",
        ],
        destino: { rotulo: "E-mail que recebe as fotos", valor: USUARIO.email },
        confirmacao: {
            titulo: "Fotos garantidas",
            descricao: "Depois do evento, enviamos suas fotos por e-mail.",
            passos: ["Envie uma selfie pelo link que mandamos por e-mail para encontrarmos suas fotos.", "Em até 48 horas depois do evento, as fotos chegam no seu e-mail."],
        },
    },
    seguro: {
        id: "seguro",
        parceiro: "Seguro de celular",
        iconeSelo: IconlyEscudo,
        corSelo: "bg-utility-blue-600",
        categoria: "Proteção",
        titulo: "Curta o rolê sem medo de perder o celular",
        descricao: "Proteja seu celular contra roubo e quebra durante o evento.",
        beneficios: [
            { icone: IconlyEscudo, texto: "Cobertura contra roubo e furto" },
            { icone: IconlyCalendario, texto: "Proteção do dia do evento até 7 dias depois" },
            { icone: IconlyRaio, texto: "Contratação na hora, sem vistoria" },
        ],
        pergunta: "Escolha a proteção",
        item: "Seguro de celular",
        valores: [19, 29, 39],
        pacotes: { 19: "Roubo", 29: "Roubo e furto", 39: "Completo" },
        desconto: 0,
        outroValor: false,
        minimo: 19,
        maximo: 39,
        cta: "Proteger meu celular",
        condicoes: [
            "O plano Completo também cobre quebra acidental da tela.",
            "Em caso de sinistro, abra o pedido em até 48 horas pelo e-mail que enviamos.",
        ],
        destino: { rotulo: "E-mail da apólice", valor: USUARIO.email },
        confirmacao: {
            titulo: "Celular protegido",
            descricao: "Enviamos a apólice para o seu e-mail.",
            passos: ["Guarde o e-mail com a apólice: ele traz o número do seguro.", "Se algo acontecer, abra o pedido em até 48 horas pelo link do e-mail."],
        },
    },
};

/** Ofertas com página própria (cada uma aberta pelo link de uma comunicação). */
export const INDIVIDUAIS: ServicoId[] = ["uber", "meep"];

/** Momentos do Checklist do rolê: a vitrine organiza os serviços pela hora em que a pessoa precisa deles. */
export const MOMENTOS: { id: string; titulo: string; servicos: ServicoId[] }[] = [
    { id: "antes", titulo: "Antes de sair", servicos: ["seguro"] },
    { id: "caminho", titulo: "Ida e volta", servicos: ["uber"] },
    { id: "evento", titulo: "No evento", servicos: ["meep", "fotos"] },
];

/** Serviços do Checklist do rolê, na ordem dos momentos. Cada um abre a própria página de contratação. */
export const CHECKLIST: ServicoId[] = MOMENTOS.flatMap((m) => m.servicos);

export const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/** Valor a pagar depois do desconto, arredondado em centavos. */
export const valorFinal = (servico: Servico, valor: number) => Math.round(valor * (1 - servico.desconto) * 100) / 100;
