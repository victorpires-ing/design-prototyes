import { EVENTOS, type Evento } from "../data/eventos";
import { MODALIDADES, type ModalidadeSlug } from "../data/modalidades";

export type Ordenacao = "desconto" | "data" | "prazo" | "cidade";

/* Só critérios que o card exibe e que vêm de dado real. Preço fica de fora porque
   a API não manda valor, e popularidade porque não existe esse número no
   calendário público. */
export const ORDENACOES: { id: Ordenacao; label: string }[] = [
    { id: "desconto", label: "Maior desconto" },
    { id: "data", label: "Data mais próxima" },
    { id: "prazo", label: "Inscrições encerrando" },
    { id: "cidade", label: "Cidade (A a Z)" },
];

/* Faixas de DESCONTO, não de preço: a API não devolve valor, só o percentual.
   É o único eixo de oferta que o usuário consegue comparar nesta campanha. */
export interface FaixaDeDesconto {
    id: string;
    label: string;
    min: number;
}

export const FAIXAS_DE_DESCONTO: FaixaDeDesconto[] = [
    { id: "gratis", label: "Inscrição gratuita", min: 0 },
    { id: "ate-40", label: "Até 40% OFF", min: 0 },
    { id: "40-50", label: "40% OFF ou mais", min: 40 },
    { id: "50-mais", label: "50% OFF ou mais", min: 50 },
];

const MESES = [
    "janeiro",
    "fevereiro",
    "março",
    "abril",
    "maio",
    "junho",
    "julho",
    "agosto",
    "setembro",
    "outubro",
    "novembro",
    "dezembro",
];

const capitalizar = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1);

/* Os períodos saem do próprio catálogo: oferecer um mês que não tem prova nenhuma
   só entrega estado vazio para quem usou o filtro direito. */
export const PERIODOS: { id: string; label: string }[] = [...new Set(EVENTOS.map((e) => e.data.slice(0, 7)))]
    .sort()
    .map((id) => ({ id, label: capitalizar(`${MESES[Number(id.slice(5, 7)) - 1]} de ${id.slice(0, 4)}`) }));

export const CIDADES = [...new Set(EVENTOS.map((e) => `${e.cidade} · ${e.uf}`))].sort((a, b) => a.localeCompare(b, "pt-BR"));

export interface Filtros {
    modalidades: ModalidadeSlug[];
    cidade: string | null;
    desconto: string | null;
    periodo: string | null;
    ordenacao: Ordenacao;
    busca: string;
}

export const FILTROS_INICIAIS: Filtros = {
    modalidades: [],
    cidade: null,
    desconto: null,
    periodo: null,
    ordenacao: "desconto",
    busca: "",
};

const semAcento = (texto: string) =>
    texto
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toLowerCase();

export function aplicarFiltros(eventos: Evento[], filtros: Filtros): Evento[] {
    const termo = semAcento(filtros.busca.trim());
    const faixa = FAIXAS_DE_DESCONTO.find((f) => f.id === filtros.desconto);

    const filtrados = eventos.filter((evento) => {
        if (filtros.modalidades.length > 0 && !filtros.modalidades.includes(evento.modalidade)) return false;
        if (filtros.cidade && `${evento.cidade} · ${evento.uf}` !== filtros.cidade) return false;
        if (filtros.periodo && !evento.data.startsWith(filtros.periodo)) return false;

        if (faixa) {
            /* Gratuito é um estado, não uma faixa de desconto. As demais são pisos:
               "40% OFF ou mais" inclui tudo acima, que é como a pessoa pensa. */
            if (faixa.id === "gratis") {
                if (!evento.gratuito) return false;
            } else if (faixa.id === "ate-40") {
                if (evento.gratuito || evento.descontoMaximo >= 40) return false;
            } else if (evento.gratuito || evento.descontoMaximo < faixa.min) {
                return false;
            }
        }

        if (termo) {
            const alvo = semAcento(`${evento.titulo} ${evento.cidade} ${evento.uf}`);
            if (!alvo.includes(termo)) return false;
        }
        return true;
    });

    /* Esgotado sempre vai para o fim, independente da ordenação escolhida: senão a
       lista abre com o que ninguém pode comprar. */
    return filtrados.sort((a, b) => {
        if (a.esgotado !== b.esgotado) return a.esgotado ? 1 : -1;

        switch (filtros.ordenacao) {
            case "data":
                return a.data.localeCompare(b.data);
            case "prazo":
                return a.inscricoesAte.localeCompare(b.inscricoesAte);
            case "cidade":
                return a.cidade.localeCompare(b.cidade, "pt-BR");
            case "desconto":
            default:
                return b.descontoMaximo - a.descontoMaximo;
        }
    });
}

export const contarFiltrosAtivos = (filtros: Filtros) =>
    filtros.modalidades.length + (filtros.cidade ? 1 : 0) + (filtros.desconto ? 1 : 0) + (filtros.periodo ? 1 : 0);

/* A busca vai pela URL em vez de estado em memória: assim a home pode mandar a
   pessoa direto para a listagem já filtrada, e o resultado é um link que se
   compartilha e sobrevive ao refresh. */
export function filtrosParaQuery(filtros: Filtros): string {
    const params = new URLSearchParams();
    if (filtros.busca.trim()) params.set("q", filtros.busca.trim());
    if (filtros.cidade) params.set("cidade", filtros.cidade);
    if (filtros.desconto) params.set("desconto", filtros.desconto);
    if (filtros.periodo) params.set("periodo", filtros.periodo);
    if (filtros.modalidades.length) params.set("modalidade", filtros.modalidades.join(","));
    if (filtros.ordenacao !== FILTROS_INICIAIS.ordenacao) params.set("ordem", filtros.ordenacao);
    const query = params.toString();
    return query ? `?${query}` : "";
}

export function filtrosDaQuery(busca: string): Filtros {
    const params = new URLSearchParams(busca);

    const modalidades = (params.get("modalidade") ?? "")
        .split(",")
        .filter(Boolean)
        .filter((slug): slug is ModalidadeSlug => MODALIDADES.some((m) => m.slug === slug));

    const ordem = params.get("ordem");

    return {
        modalidades,
        cidade: CIDADES.includes(params.get("cidade") ?? "") ? params.get("cidade") : null,
        desconto: FAIXAS_DE_DESCONTO.some((f) => f.id === params.get("desconto")) ? params.get("desconto") : null,
        periodo: PERIODOS.some((p) => p.id === params.get("periodo")) ? params.get("periodo") : null,
        ordenacao: ORDENACOES.some((o) => o.id === ordem) ? (ordem as Ordenacao) : FILTROS_INICIAIS.ordenacao,
        busca: params.get("q") ?? "",
    };
}
