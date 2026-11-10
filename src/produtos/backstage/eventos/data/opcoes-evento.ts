import { useCallback, useEffect, useState } from "react";

/* ------------------------------------------------------------------ */
/*  Listas da criação de evento                                        */
/*                                                                     */
/*  Em produção vêm do back-end. Aqui, uma chamada simulada com        */
/*  atraso, para a tela tratar carregando e erro como fará de verdade. */
/*  Os itens são de exemplo (ver eventos/rules.md, Em aberto).         */
/* ------------------------------------------------------------------ */

export interface Opcao {
    id: string;
    label: string;
    supportingText?: string;
}

export interface OpcoesEvento {
    campeonatos: Opcao[];
    times: Opcao[];
    programasMembros: Opcao[];
    moedas: Opcao[];
    politicas: Opcao[];
    acessoFacial: Opcao[];
    mapasDeAssentos: Opcao[];
}

const SIMULADO: OpcoesEvento = {
    campeonatos: [
        { id: "brasileirao-2026", label: "Brasileirão 2026" },
        { id: "copa-do-brasil-2026", label: "Copa do Brasil 2026" },
        { id: "copa-do-nordeste-2026", label: "Copa do Nordeste 2026" },
        { id: "estadual-2026", label: "Campeonato Estadual 2026" },
    ],
    times: [
        { id: "bahia", label: "Bahia" },
        { id: "botafogo", label: "Botafogo" },
        { id: "fortaleza", label: "Fortaleza" },
        { id: "gremio", label: "Grêmio" },
        { id: "time-exemplo-a", label: "Time Exemplo A" },
        { id: "time-exemplo-b", label: "Time Exemplo B" },
    ],
    programasMembros: [
        { id: "socio-botafogo", label: "Sócio Botafogo" },
        { id: "socio-bahia", label: "Sócio Bahia" },
        { id: "programa-exemplo", label: "Programa de membros (exemplo)" },
    ],
    moedas: [
        { id: "BRL", label: "Real (R$)", supportingText: "BRL" },
        { id: "USD", label: "Dólar americano (US$)", supportingText: "USD" },
        { id: "EUR", label: "Euro (€)", supportingText: "EUR" },
    ],
    politicas: [
        { id: "politica-padrao", label: "Política padrão da organização" },
        { id: "politica-sem-reembolso", label: "Sem reembolso após a compra (exemplo)" },
        { id: "politica-meia-entrada", label: "Meia-entrada e gratuidades (exemplo)" },
    ],
    acessoFacial: [
        { id: "nenhum", label: "Não usar acesso por face" },
        { id: "servico-facial-a", label: "Serviço de gestão facial A (exemplo)" },
        { id: "servico-facial-b", label: "Serviço de gestão facial B (exemplo)" },
    ],
    mapasDeAssentos: [
        { id: "mapa-arena-exemplo", label: "Arena Exemplo", supportingText: "4 setores" },
        { id: "mapa-teatro-exemplo", label: "Teatro Exemplo", supportingText: "Plateia e balcão" },
        { id: "mapa-estadio-exemplo", label: "Estádio Exemplo", supportingText: "Arquibancadas e cadeiras" },
    ],
};

/** Chamada simulada ao back-end. */
const buscarOpcoes = () => new Promise<OpcoesEvento>((resolve) => setTimeout(() => resolve(SIMULADO), 600));

let cache: OpcoesEvento | null = null;

export function useOpcoesEvento() {
    const [estado, setEstado] = useState<{ status: "carregando" | "pronto" | "erro"; dados: OpcoesEvento | null }>(
        cache ? { status: "pronto", dados: cache } : { status: "carregando", dados: null },
    );
    const carregar = useCallback(() => {
        setEstado((e) => ({ ...e, status: "carregando" }));
        buscarOpcoes()
            .then((dados) => {
                cache = dados;
                setEstado({ status: "pronto", dados });
            })
            .catch(() => setEstado({ status: "erro", dados: null }));
    }, []);
    useEffect(() => {
        if (!cache) carregar();
    }, [carregar]);
    return { ...estado, recarregar: carregar };
}

/* ---------------- busca de endereço ---------------- */

export interface LocalEncontrado {
    id: string;
    nome: string;
    cidade: string;
}

/** Locais de exemplo. Em produção, a API de busca de endereço responde (EVT-65). */
const LOCAIS_SIMULADOS: LocalEncontrado[] = [
    { id: "allianz-parque", nome: "Allianz Parque", cidade: "São Paulo, SP" },
    { id: "mercado-pago-hall", nome: "Mercado Pago Hall", cidade: "São Paulo, SP" },
    { id: "parque-ibirapuera", nome: "Parque Ibirapuera", cidade: "São Paulo, SP" },
    { id: "maracana", nome: "Maracanã", cidade: "Rio de Janeiro, RJ" },
    { id: "nilton-santos", nome: "Estádio Nilton Santos", cidade: "Rio de Janeiro, RJ" },
    { id: "jockey-club-rj", nome: "Jockey Club Brasileiro", cidade: "Rio de Janeiro, RJ" },
    { id: "fonte-nova", nome: "Arena Fonte Nova", cidade: "Salvador, BA" },
    { id: "arena-gremio", nome: "Arena do Grêmio", cidade: "Porto Alegre, RS" },
    { id: "laroc-club", nome: "Laroc Club", cidade: "Valinhos, SP" },
    { id: "classic-hall", nome: "Classic Hall", cidade: "Recife, PE" },
];

const semAcento = (t: string) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

/** Chamada simulada à API de busca de endereço: a partir de 2 letras, por nome do local ou cidade. */
export const buscarLocais = (q: string) =>
    new Promise<LocalEncontrado[]>((resolve) => {
        const termo = semAcento(q.trim());
        setTimeout(() => resolve(termo.length < 2 ? [] : LOCAIS_SIMULADOS.filter((l) => semAcento(`${l.nome} ${l.cidade}`).includes(termo)).slice(0, 6)), 300);
    });
