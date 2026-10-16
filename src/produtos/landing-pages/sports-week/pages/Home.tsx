import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { CAMPANHA, COMO_FUNCIONA, DISCLAIMER, FAQ, MARQUEE, NUMEROS, SECOES, VANTAGENS } from "../data/campanha";
import { EVENTOS, eventosEmDestaque } from "../data/eventos";
import { FILTROS_INICIAIS, filtrosParaQuery, type Filtros } from "../utils/filtros";
import { DUR, EASE_OUT_EXPO, STAGGER } from "../utils/motion-tokens";
import { useSwMotion } from "../utils/use-sw-motion";
import { GradeEscalonada, Marquee, Reveal, itemDaGrade } from "../components/Motion";
import { Asterisco, FileiraAsteriscos, Logo, Tarja } from "../components/SwBrand";
import { SwContainer, SwFaixa } from "../components/SwContainer";
import { Acordeao, SwBotao, TituloDeSecao } from "../components/SwUi";
import { BlocoDeNumeros, Contador } from "../components/Numeros";
import { EventoCard } from "../components/EventoCard";
import { OfertaRelampago } from "../components/OfertaRelampago";
import { MosaicoModalidades } from "../components/MosaicoModalidades";
import { BarraDeBusca } from "../components/BarraDeBusca";
import { CtaFixo, useIrComWipe } from "../components/Chrome";
import { Hero } from "../components/Hero";

/** Conteúdo de uma faixa infinita: as frases da campanha, separadas por asterisco. */
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

/** A palavra da campanha, repetida. É o device mais literal de "tá ON" que o kit tem. */
function FaixaOn() {
    return (
        <>
            {Array.from({ length: 14 }).map((_, i) => (
                <span key={i} className="flex shrink-0 items-center gap-3 px-3">
                    <span className="sw-display text-[length:var(--sw-fs-d0)] leading-none">ON</span>
                    <Asterisco className="size-3 shrink-0" />
                </span>
            ))}
        </>
    );
}

function Passos() {
    const { reduce } = useSwMotion();
    return (
        <ol className="mt-7 @5xl/sw:mt-12 @5xl/sw:grid @5xl/sw:grid-cols-3 @5xl/sw:gap-10">
            {COMO_FUNCIONA.map((passo, i) => (
                <motion.li
                    key={passo.titulo}
                    /* No celular o trilho é vertical, à esquerda. No desktop ele deita e
                       vira o fio superior de cada coluna: a mesma geometria, girada. */
                    className="relative border-l-2 pb-8 pl-7 last:pb-0 @5xl/sw:border-l-0 @5xl/sw:border-t-2 @5xl/sw:pt-7 @5xl/sw:pb-0 @5xl/sw:pl-0"
                    style={{ borderColor: "var(--sw-line-strong)" }}
                    initial={reduce ? false : { opacity: 0, x: 16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.5 }}
                    transition={{ duration: DUR.reveal, ease: EASE_OUT_EXPO, delay: i * STAGGER.line }}
                >
                    <span
                        className="sw-display absolute top-0 -left-[17px] flex size-8 items-center justify-center rounded-full text-sm leading-none @5xl/sw:-top-[22px] @5xl/sw:left-0 @5xl/sw:size-11 @5xl/sw:text-base"
                        style={{ backgroundColor: "var(--sw-lime)", color: "var(--sw-navy)" }}
                    >
                        {i + 1}
                    </span>
                    <h3 className="sw-ui text-lg leading-tight font-extrabold text-[var(--sw-white)] @5xl/sw:text-[22px]">
                        {passo.titulo}
                    </h3>
                    <p
                        className="mt-1.5 max-w-[38ch] text-[length:var(--sw-fs-corpo)] leading-[1.55]"
                        style={{ color: "var(--sw-muted)" }}
                    >
                        {passo.texto}
                    </p>
                </motion.li>
            ))}
        </ol>
    );
}

export function Home() {
    const ir = useIrComWipe();
    const navigate = useNavigate();
    const [buscaInicial] = useState<Filtros>(FILTROS_INICIAIS);

    const destaques = eventosEmDestaque();
    const relampago = EVENTOS.find((e) => e.relampago && !e.esgotado);

    return (
        <div className="sw-pagina relative pb-28 @5xl/sw:pb-0">
            <Hero
                onVerEventos={() => ir("/landing-pages/sports-week/eventos")}
                onComoFunciona={() => document.getElementById("como-funciona")?.scrollIntoView({ behavior: "smooth" })}
            />

            {/* A barra de busca atravessa o rodapé do hero: é o atalho principal da
                campanha e precisa estar acima da dobra em qualquer largura. Ela não
                filtra ao vivo, manda para a listagem já filtrada. */}
            {/* O id é o gatilho do header: quando esta barra sai da tela, ela reaparece
                no cromo de topo. */}
            <div id="busca-principal" className="relative z-20 -mt-6 @5xl/sw:-mt-10">
                <SwContainer>
                    <BarraDeBusca
                        valores={buscaInicial}
                        onBuscar={(filtros) => navigate(`/landing-pages/sports-week/eventos${filtrosParaQuery(filtros)}`)}
                    />
                </SwContainer>
            </div>

            {/* Duas faixas em velocidades e direções diferentes: iguais pareceria bug. */}
            <div className="mt-10 border-y-2 @5xl/sw:mt-16" style={{ borderColor: "var(--sw-navy)" }}>
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

            {/* ---------------------------- Números ---------------------------- */}
            <section className="py-[var(--sw-ritmo)]">
                <SwContainer>
                    <Reveal>
                        <TituloDeSecao titulo={SECOES.numeros.titulo} apoio={SECOES.numeros.apoio} layout="ladoALado" />
                    </Reveal>
                </SwContainer>
                {/* Dentro do container, não sangrando: os quatro números alinham com o
                    título da seção em vez de correrem de ponta a ponta da janela, onde
                    numa tela larga cada um ficava sozinho no meio da própria coluna. */}
                <Reveal delay={0.08} className="mt-8">
                    <SwContainer>
                        <BlocoDeNumeros itens={NUMEROS} />
                    </SwContainer>
                </Reveal>
            </section>

            {/* -------------------------- Modalidades -------------------------- */}
            <section id="modalidades" className="pb-[var(--sw-ritmo)]">
                <SwContainer>
                    <Reveal>
                        <TituloDeSecao titulo={SECOES.modalidades.titulo} apoio={SECOES.modalidades.apoio} layout="ladoALado" />
                    </Reveal>
                    <div className="mt-6 @5xl/sw:mt-10">
                        <MosaicoModalidades onAbrir={(slug) => ir(`/landing-pages/sports-week/modalidade/${slug}`)} />
                    </div>
                </SwContainer>
            </section>

            {/* --------------------------- Destaques --------------------------- */}
            <section id="destaques" className="pb-[var(--sw-ritmo)]">
                <SwContainer>
                    <Reveal>
                        <div className="@5xl/sw:flex @5xl/sw:items-end @5xl/sw:justify-between @5xl/sw:gap-12">
                            <TituloDeSecao titulo={SECOES.destaques.titulo} apoio={SECOES.destaques.apoio} />
                            <SwBotao
                                variante="contorno"
                                className="mt-6 w-full @5xl/sw:mt-0 @5xl/sw:w-auto @5xl/sw:shrink-0"
                                onClick={() => ir("/landing-pages/sports-week/eventos")}
                            >
                                Ver todos os eventos
                            </SwBotao>
                        </div>
                    </Reveal>

                    <GradeEscalonada className="mt-8 grid grid-cols-2 gap-x-[var(--sw-gap)] gap-y-8 @3xl/sw:grid-cols-3 @5xl/sw:gap-x-6 @5xl/sw:gap-y-10">
                        {destaques.map((evento) => (
                            <motion.div key={evento.id} variants={itemDaGrade}>
                                {/* O container é a CÉLULA: o card se dimensiona pela largura
                                    da própria coluna, nunca pela da página. */}
                                <div className="@container/cartao h-full">
                                    <EventoCard
                                        evento={evento}
                                        onAbrir={() => ir(`/landing-pages/sports-week/modalidade/${evento.modalidade}`)}
                                    />
                                </div>
                            </motion.div>
                        ))}
                    </GradeEscalonada>
                </SwContainer>
            </section>

            {/* ------------------------- Como funciona ------------------------- */}
            <SwFaixa id="como-funciona" as="section" className="py-[var(--sw-ritmo-cor)]" style={{ backgroundColor: "var(--sw-navy)" }}>
                <SwContainer>
                    <Reveal>
                        <TituloDeSecao titulo={SECOES.comoFunciona.titulo} apoio={SECOES.comoFunciona.apoio} layout="ladoALado" />
                    </Reveal>
                    <Passos />
                </SwContainer>
            </SwFaixa>

            <SwFaixa>
                <FileiraAsteriscos style={{ backgroundColor: "var(--sw-magenta)", color: "var(--sw-lime)" }} />
            </SwFaixa>

            {/* --------------------------- Vantagens --------------------------- */}
            <section className="py-[var(--sw-ritmo)]">
                <SwContainer>
                    <Reveal>
                        <TituloDeSecao titulo={SECOES.vantagens.titulo} apoio={SECOES.vantagens.apoio} layout="ladoALado" />
                    </Reveal>

                    <GradeEscalonada className="mt-8 grid grid-cols-1 gap-3 @3xl/sw:grid-cols-2 @5xl/sw:grid-cols-4 @5xl/sw:gap-5">
                        {VANTAGENS.map((vantagem) => (
                            <motion.div
                                key={vantagem.titulo}
                                variants={itemDaGrade}
                                className="group h-full rounded-xl border-2 p-4 transition-colors duration-150 hover:border-[var(--sw-lime)] @5xl/sw:p-6"
                                style={{ borderColor: "var(--sw-line-strong)", backgroundColor: "var(--sw-raised)" }}
                            >
                                <div className="flex items-start gap-3">
                                    <Asterisco
                                        className="mt-0.5 size-4 shrink-0 transition-transform duration-200 group-hover:rotate-90 @5xl/sw:size-6"
                                        style={{ color: "var(--sw-lime)" }}
                                    />
                                    <div>
                                        <h3 className="sw-ui text-base font-extrabold text-[var(--sw-white)] @5xl/sw:text-[19px]">
                                            {vantagem.titulo}
                                        </h3>
                                        <p
                                            className="mt-1 text-sm leading-[1.5] @5xl/sw:text-[length:var(--sw-fs-corpo)]"
                                            style={{ color: "var(--sw-muted)" }}
                                        >
                                            {vantagem.texto}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </GradeEscalonada>
                </SwContainer>
            </section>

            {/* ------------------------ Oferta relâmpago ------------------------ */}
            {relampago ? (
                <OfertaRelampago
                    evento={relampago}
                    onAbrir={() => ir(`/landing-pages/sports-week/modalidade/${relampago.modalidade}`)}
                />
            ) : null}

            {/* ------------------------------ FAQ ------------------------------ */}
            <section id="perguntas" className="py-[var(--sw-ritmo)]">
                <SwContainer className="@5xl/sw:grid @5xl/sw:grid-cols-12 @5xl/sw:gap-10">
                    <div className="@5xl/sw:col-span-4 @5xl/sw:sticky @5xl/sw:top-[calc(var(--sw-chrome-h)+24px)] @5xl/sw:self-start">
                        <Reveal>
                            <TituloDeSecao titulo={SECOES.faq.titulo} apoio={SECOES.faq.apoio} />
                        </Reveal>
                        <motion.div
                            aria-hidden="true"
                            className="mt-10 hidden @5xl/sw:block"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 9, ease: "linear", repeat: Infinity }}
                        >
                            <Asterisco className="size-24" style={{ color: "var(--sw-lime)" }} />
                        </motion.div>
                    </div>

                    {/* Uma coluna só de acordeão: duas quebrariam a ordem de leitura. */}
                    <div className="mt-4 @5xl/sw:col-span-7 @5xl/sw:col-start-6 @5xl/sw:mt-0">
                        {FAQ.map((item) => (
                            <Acordeao key={item.q} pergunta={item.q} resposta={item.a} />
                        ))}
                    </div>
                </SwContainer>
            </section>

            {/* --------------------------- Fechamento -------------------------- */}
            <SwFaixa as="section" className="py-[var(--sw-ritmo-cor)]" style={{ backgroundColor: "var(--sw-navy)" }}>
                <SwContainer>
                    <Reveal>
                        <div className="@5xl/sw:flex @5xl/sw:items-end @5xl/sw:justify-between @5xl/sw:gap-12">
                            <div>
                                <h2 className="sw-display text-[length:var(--sw-fs-d2)] leading-[1.22] text-[var(--sw-lime)]">
                                    {SECOES.fechamento.titulo}
                                </h2>
                                <p className="mt-2 text-[length:var(--sw-fs-corpo)]" style={{ color: "var(--sw-muted)" }}>
                                    {SECOES.fechamento.apoio}
                                </p>
                            </div>
                            <SwBotao
                                tamanho="lg"
                                className="mt-6 w-full @5xl/sw:mt-0 @5xl/sw:w-auto @5xl/sw:shrink-0"
                                onClick={() => ir("/landing-pages/sports-week/eventos")}
                            >
                                Ver eventos em oferta
                            </SwBotao>
                        </div>
                    </Reveal>
                </SwContainer>
            </SwFaixa>

            {/* ----------------------------- Rodapé ---------------------------- */}
            <SwFaixa as="footer" className="py-[var(--sw-ritmo)]" style={{ backgroundColor: "var(--sw-ink)" }}>
                <SwContainer className="@5xl/sw:grid @5xl/sw:grid-cols-12 @5xl/sw:gap-10">
                    <div className="flex items-center justify-between @5xl/sw:col-span-5 @5xl/sw:flex-col @5xl/sw:items-start @5xl/sw:gap-8">
                        {/* No rodapé do desktop a marca entra deitada: a faixa é larga e
                            baixa, e o lockup empilhado só caberia encolhido. No mobile, ao
                            lado do monograma, o empilhado é que cabe. */}
                        <Logo altura={58} className="text-[var(--sw-white)] @5xl/sw:hidden" />
                        <Logo deitado altura={46} className="hidden text-[var(--sw-white)] @5xl/sw:inline-block" />
                    </div>

                    <p
                        className="mt-8 max-w-[64ch] text-sm leading-[1.5] @5xl/sw:col-span-6 @5xl/sw:col-start-7 @5xl/sw:mt-0"
                        style={{ color: "var(--sw-subtle)" }}
                    >
                        {DISCLAIMER}
                        <span className="mt-4 block">Ingresse · Ticket Sports · {CAMPANHA.edicao}</span>
                    </p>
                </SwContainer>
            </SwFaixa>

            <CtaFixo
                apoio={`Até ${CAMPANHA.descontoMaximo}% OFF · ${CAMPANHA.periodo.toLowerCase()}`}
                rotulo="Ver eventos em oferta"
                onClick={() => ir("/landing-pages/sports-week/eventos")}
            />
        </div>
    );
}
