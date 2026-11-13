import type { FC } from "react";
import festivalAurora from "../assets/festival-aurora.svg";
import showPalco from "../assets/show-palco.svg";
import uberLogo from "../assets/uber-logo.svg";
import { IconlyCarro, IconlyCarteira, IconlyCartao, IconlyComida, IconlyDesconto, IconlyRaio } from "../components/icones-iconly";

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

export type ServicoId = "uber" | "meep";

export interface Beneficio {
    icone: FC<{ className?: string }>;
    texto: string;
}

export interface Servico {
    id: ServicoId;
    parceiro: string;
    /** Logo oficial do parceiro; sem ela, a página usa o selo provisório com o nome. */
    logo?: string;
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
    /** Fração de desconto sobre o valor (0.05 = 5%). 0 = sem desconto. */
    desconto: number;
    /** Mostra a opção "Outro valor" (desligada por enquanto nas duas ofertas). */
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
        outroValor: false,
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
        outroValor: false,
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
};

export const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/** Valor a pagar depois do desconto, arredondado em centavos. */
export const valorFinal = (servico: Servico, valor: number) => Math.round(valor * (1 - servico.desconto) * 100) / 100;
