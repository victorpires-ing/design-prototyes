import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { ArrowLeft } from "@untitledui/icons";
import { MARQUEE } from "../data/campanha";
import { EVENTOS } from "../data/eventos";
import { getModalidade } from "../data/modalidades";
import {
    ORDENACOES,
    aplicarFiltros,
    contarFiltrosAtivos,
    filtrosDaQuery,
    filtrosParaQuery,
    FILTROS_INICIAIS,
    type Filtros,
} from "../utils/filtros";
import { ItemRevelado, Marquee } from "../components/Motion";
import { Asterisco } from "../components/SwBrand";
import { SwContainer, SwFaixa } from "../components/SwContainer";
import { SwBotao } from "../components/SwUi";
import { Contador } from "../components/Numeros";
import { BarraDeBusca } from "../components/BarraDeBusca";
import { GatilhoDeBusca } from "../components/BuscaBottomSheet";
import { AtalhosDeModalidade } from "../components/AtalhosDeModalidade";
import { EventoCard } from "../components/EventoCard";
import { OfertaRelampago } from "../components/OfertaRelampago";
import { useIrComWipe } from "../components/Chrome";

/** Contagem de resultados em linguagem natural: a frase muda com o filtro ativo. */
function textoDaContagem(total: number, filtros: Filtros) {
    if (filtros.busca.trim()) {
        const base = `${total === 1 ? "resultado" : "resultados"} para “${filtros.busca.trim()}”`;
        return contarFiltrosAtivos(filtros) > 0 ? `${base}, com filtros aplicados` : base;
    }

    const evento = total === 1 ? "evento" : "eventos";

    if (filtros.modalidades.length === 1) {
        const nome = getModalidade(filtros.modalidades[0])?.nome.toLowerCase();
        return filtros.cidade ? `${evento} em ${nome}, em ${filtros.cidade.split(" · ")[0]}` : `${evento} em ${nome}`;
    }
    if (filtros.modalidades.length > 1) return `${evento} em ${filtros.modalidades.length} modalidades`;
    if (filtros.cidade) return `${evento} em ${filtros.cidade.split(" · ")[0]}`;

    return `${evento} ${total === 1 ? "encontrado" : "encontrados"}`;
}

/** Conteúdo das faixas: as frases da campanha, separadas por asterisco. */
function ConteudoDaFaixa() {
    return (
        <>
            {MARQUEE.map((frase) => (
                <span key={frase} className="flex shrink-0 items-center gap-4 px-4">
                    <span className="sw-display text-[length:var(--sw-fs-mq)] leading-none whitespace-nowrap">{frase}</span>
                    <Asterisco className="size-3.5 shrink-0" />
                </span>
            ))}
        </>
    );
}

function Rotulo({ children }: { children: React.ReactNode }) {
    return (
        <span className="sw-ui mb-1 hidden text-sm font-bold @5xl/sw:block" style={{ color: "var(--sw-subtle)" }}>
            {children}
        </span>
    );
}

export function Eventos() {
    const ir = useIrComWipe();
    const navigate = useNavigate();
    const { search } = useLocation();

    /* A busca vem da URL: a home manda a pessoa para cá já filtrada, e o
       resultado é um link que se compartilha e sobrevive ao refresh. */
    const [filtros, setFiltros] = useState<Filtros>(() => filtrosDaQuery(search));

    const aplicar = (novos: Filtros) => {
        setFiltros(novos);
        navigate({ search: filtrosParaQuery(novos) }, { replace: true });
    };

    const resultado = useMemo(() => aplicarFiltros(EVENTOS, filtros), [filtros]);
    const ativos = contarFiltrosAtivos(filtros);

    /* A faixa da oferta do dia parte a grade depois do trigésimo card: trinta
       cards seguidos viram parede. Com menos que isso ela não entra. */
    const CORTE = 30;
    const relampago = EVENTOS.find((e) => e.relampago && !e.esgotado);
    const primeiros = resultado.slice(0, CORTE);
    const restantes = resultado.slice(CORTE);

    const selectClasse =
        "sw-ui w-full cursor-pointer rounded-full border-2 bg-transparent px-4 py-2.5 text-sm font-bold text-[var(--sw-white)] @5xl/sw:w-[200px] @5xl/sw:text-base";

    return (
        <div className="sw-pagina min-h-[680px] pb-16 @5xl/sw:min-h-dvh">
            <SwContainer as="header" className="pt-6 pb-6 @5xl/sw:pt-12 @5xl/sw:pb-10">
                <button
                    type="button"
                    onClick={() => ir("/landing-pages/sports-week")}
                    className="sw-ui group relative z-10 flex w-fit cursor-pointer items-center gap-1.5 text-sm font-bold transition-colors duration-100 hover:text-[var(--sw-lime)]"
                    style={{ color: "var(--sw-muted)" }}
                >
                    <ArrowLeft className="size-4 transition-transform duration-100 group-hover:-translate-x-1" />
                    Sports Week
                </button>

                <div className="@5xl/sw:grid @5xl/sw:grid-cols-12 @5xl/sw:items-end @5xl/sw:gap-10">
                    <div className="@5xl/sw:col-span-8">
                        <h1 className="sw-display mt-4 text-[length:var(--sw-fs-d2)] leading-[1.42] text-[var(--sw-lime)]">
                            Eventos em oferta
                        </h1>
                        <p className="mt-2 max-w-[46ch] text-[length:var(--sw-fs-corpo)] leading-[1.55]" style={{ color: "var(--sw-muted)" }}>
                            Todos os eventos da Sports Week em um lugar. Filtre por esporte, cidade ou desconto.
                        </p>
                    </div>

                    {/* A contagem vira manchete: número grande orienta o olho, região viva
                        orienta o leitor de tela, e custam a mesma linha. */}
                    <p className="hidden @5xl/sw:col-span-3 @5xl/sw:col-start-10 @5xl/sw:block @5xl/sw:text-right" aria-live="polite">
                        <span className="sw-display block text-[length:var(--sw-fs-d1)] leading-none" style={{ color: "var(--sw-lime)" }}>
                            <Contador valor={resultado.length} />
                        </span>
                        <span className="sw-ui mt-1 block text-sm font-bold" style={{ color: "var(--sw-muted)" }}>
                            {textoDaContagem(resultado.length, filtros)}
                        </span>
                    </p>
                </div>
            </SwContainer>

            {/* O id é o gatilho do header: quando esta barra sai da tela, a busca
                compacta aparece no cromo de topo. */}
            <SwContainer id="busca-principal" className="pt-2 pb-8">
                {/* No mobile é um campo só, que abre a folha de baixo com os filtros. */}
                <div className="@5xl/sw:hidden">
                    <GatilhoDeBusca valores={filtros} onBuscar={aplicar} />
                </div>
                <div className="hidden @5xl/sw:block">
                    <BarraDeBusca valores={filtros} onBuscar={aplicar} comModalidade={false} />
                </div>

                {/* Mesma peça do mosaico da home, em fileira. São atalhos para a
                    página de cada modalidade, por isso o campo de modalidade saiu da
                    barra de busca logo acima. */}
                <AtalhosDeModalidade
                    className="mt-4"
                    onAbrir={(slug) => ir(`/landing-pages/sports-week/modalidade/${slug}`)}
                />
            </SwContainer>

            {/* Duas faixas em velocidades e direções diferentes: iguais pareceria bug. */}
            <div className="border-y-2" style={{ borderColor: "var(--sw-navy)" }}>
                <SwFaixa>
                    <Marquee
                        velocidade={16}
                        className="py-2.5 @5xl/sw:py-4"
                        style={{ backgroundColor: "var(--sw-lime)", color: "var(--sw-navy)" }}
                        textoAcessivel={MARQUEE.join(". ")}
                    >
                        <ConteudoDaFaixa />
                    </Marquee>
                </SwFaixa>
                <SwFaixa>
                    <Marquee
                        velocidade={22}
                        direcao="right"
                        className="border-t-2 py-2.5 @5xl/sw:py-4"
                        style={{ backgroundColor: "var(--sw-navy)", color: "var(--sw-lime)", borderColor: "var(--sw-ink)" }}
                    >
                        <ConteudoDaFaixa />
                    </Marquee>
                </SwFaixa>
            </div>

            {resultado.length === 0 ? (
                <SwContainer className="py-16 text-center @5xl/sw:py-40">
                    <Asterisco className="mx-auto size-10 @5xl/sw:size-24" style={{ color: "var(--sw-magenta)" }} />
                    <h2 className="sw-display mt-5 text-[length:var(--sw-fs-d1)] leading-[1.25] text-[var(--sw-white)]">
                        Nenhum evento por aqui
                    </h2>
                    <p className="mx-auto mt-2 max-w-[40ch] text-[length:var(--sw-fs-corpo)]" style={{ color: "var(--sw-muted)" }}>
                        Nada bateu com esses filtros. Tente outra modalidade, outra cidade, ou veja a lista inteira.
                    </p>
                    <SwBotao className="mt-6" onClick={() => aplicar(FILTROS_INICIAIS)}>
                        Limpar filtros
                    </SwBotao>
                </SwContainer>
            ) : (
                <>
                            <SwContainer className="flex items-center justify-between gap-4 pt-10 pb-4">
                    <label className="min-w-0">
                        <span className="sw-ui mb-1 block text-sm font-bold" style={{ color: "var(--sw-subtle)" }}>
                            Ordenar por
                        </span>
                        <select
                            value={filtros.ordenacao}
                            onChange={(e) => aplicar({ ...filtros, ordenacao: e.target.value as Filtros["ordenacao"] })}
                            aria-label="Ordenar os eventos"
                            className={selectClasse}
                            style={{ borderColor: "var(--sw-line-strong)" }}
                        >
                            {ORDENACOES.map((o) => (
                                <option key={o.id} value={o.id}>
                                    {o.label}
                                </option>
                            ))}
                        </select>
                    </label>

                    {ativos > 0 || filtros.busca ? (
                        <button
                            type="button"
                            onClick={() => aplicar(FILTROS_INICIAIS)}
                            className="sw-ui shrink-0 cursor-pointer self-end py-2.5 text-sm font-extrabold underline"
                            style={{ color: "var(--sw-lime)" }}
                        >
                            Limpar filtros
                        </button>
                    ) : null}
                    </SwContainer>

                    <SwContainer
                        id="resultados"
                        role="region"
                        aria-label={`${resultado.length} ${textoDaContagem(resultado.length, filtros)}`}
                        className="grid grid-cols-2 gap-x-[var(--sw-gap)] gap-y-8 @3xl/sw:grid-cols-3 @5xl/sw:grid-cols-4 @5xl/sw:gap-x-6 @5xl/sw:gap-y-12 @7xl/sw:grid-cols-5"
                    >
                        {primeiros.map((evento) => (
                            <ItemRevelado key={evento.id} className="@container/cartao h-full">
                                <EventoCard
                                    evento={evento}
                                    onAbrir={() => ir(`/landing-pages/sports-week/modalidade/${evento.modalidade}`)}
                                />
                            </ItemRevelado>
                        ))}
                    </SwContainer>

                    {restantes.length > 0 && relampago ? (
                        <div className="pt-[var(--sw-ritmo)]">
                            <OfertaRelampago
                                evento={relampago}
                                onAbrir={() => ir(`/landing-pages/sports-week/modalidade/${relampago.modalidade}`)}
                            />
                        </div>
                    ) : null}

                    {restantes.length > 0 ? (
                        <SwContainer className="mt-[var(--sw-ritmo)] grid grid-cols-2 gap-x-[var(--sw-gap)] gap-y-8 @3xl/sw:grid-cols-3 @5xl/sw:grid-cols-4 @5xl/sw:gap-x-6 @5xl/sw:gap-y-12 @7xl/sw:grid-cols-5">
                            {restantes.map((evento) => (
                                <ItemRevelado key={evento.id} className="@container/cartao h-full">
                                    <EventoCard
                                        evento={evento}
                                        onAbrir={() => ir(`/landing-pages/sports-week/modalidade/${evento.modalidade}`)}
                                    />
                                </ItemRevelado>
                            ))}
                        </SwContainer>
                    ) : null}
                </>
            )}
        </div>
    );
}
