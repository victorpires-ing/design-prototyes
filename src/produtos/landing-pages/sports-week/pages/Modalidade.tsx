import { useRef } from "react";
import { motion, useScroll, useSpring, useTransform } from "motion/react";
import { useParams } from "react-router";
import { ArrowLeft } from "@untitledui/icons";
import { eventosPorModalidade } from "../data/eventos";
import { getModalidade } from "../data/modalidades";
import { DUR, EASE_OUT_EXPO, SPRING_SCROLL } from "../utils/motion-tokens";
import { useSwMotion } from "../utils/use-sw-motion";
import { HeadlineCinetica, ItemRevelado, Marquee, Reveal } from "../components/Motion";
import { Asterisco, FileiraAsteriscos, Monograma } from "../components/SwBrand";
import { SwContainer, SwFaixa } from "../components/SwContainer";
import { SwBotao, SwTag, TituloDeSecao } from "../components/SwUi";
import { AtalhosDeModalidade } from "../components/AtalhosDeModalidade";
import { EventoCard } from "../components/EventoCard";
import { CtaFixo, useIrComWipe } from "../components/Chrome";

export function Modalidade() {
    const { slug } = useParams();
    const ir = useIrComWipe();
    const { reduce } = useSwMotion();
    const modalidade = getModalidade(slug);
    const heroRef = useRef<HTMLDivElement>(null);

    /* Parallax leve só no bloco de cor do topo. Uma animação ligada ao scroll por
       dobra de tela é o teto: a listagem abaixo já tem o stagger. */
    const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"], layoutEffect: false });
    const p = useSpring(scrollYProgress, SPRING_SCROLL);
    const tituloY = useTransform(p, [0, 1], ["0%", "-30%"]);
    const padraoY = useTransform(p, [0, 1], ["0%", "22%"]);
    const S = (mv: unknown) => (reduce ? undefined : (mv as never));

    if (!modalidade) {
        return (
            /* `.sw-pagina` fica no wrapper da rota, nunca no cartão: ela carrega
               `padding-left: var(--sw-rail)`, a reserva da calha da PÁGINA, e essa
               declaração não está em cascade layer nenhuma, então vence o `px-5`
               do Tailwind (que mora em `@layer utilities`). No mesmo elemento, o
               cartão ficava com 72px de goteira à esquerda e 20px à direita. */
            <div className="sw-pagina">
                <div className="mx-auto flex min-h-[600px] max-w-[480px] flex-col items-center justify-center px-5 text-center">
                    <Asterisco className="size-10" style={{ color: "var(--sw-magenta)" }} />
                    <h1 className="sw-display mt-5 text-[length:var(--sw-fs-d1)] leading-[1.45] text-[var(--sw-white)]">
                        Modalidade não encontrada
                    </h1>
                    <SwBotao className="mt-6" onClick={() => ir("/landing-pages/sports-week/eventos")}>
                        Ver todos os eventos
                    </SwBotao>
                </div>
            </div>
        );
    }

    const eventos = eventosPorModalidade(modalidade.slug);
    const disponiveis = eventos.filter((e) => !e.esgotado);

    return (
        <div className="sw-pagina min-h-[680px] pb-28 @5xl/sw:min-h-dvh @5xl/sw:pb-0">
            {/* -------------------------- Bloco da modalidade ----------------------- */}
            {/* O bloco de cor atravessa a tela de ponta a ponta e carrega só o que
                identifica a modalidade. Chamada, descrição e chips saíram para a
                lista de eventos subir quase até a primeira dobra. */}
            <div
                ref={heroRef}
                className="sw-grain relative overflow-hidden"
                style={{ backgroundColor: modalidade.cor }}
            >
                <motion.div
                    aria-hidden="true"
                    className="sw-stripes absolute inset-0 opacity-[0.13]"
                    style={{
                        y: S(padraoY),
                        ["--sw-stripe-a" as string]: modalidade.tinta,
                        ["--sw-stripe-b" as string]: "transparent",
                    }}
                />

                <motion.div style={{ y: S(tituloY) }}>
                    <SwContainer className="relative pt-6 pb-10 @5xl/sw:pt-12 @5xl/sw:pb-16">
                        <button
                            type="button"
                            onClick={() => ir("/landing-pages/sports-week/eventos")}
                            className="sw-ui group relative z-10 flex w-fit cursor-pointer items-center gap-1.5 text-sm font-bold opacity-80 transition-opacity hover:opacity-100"
                            style={{ color: modalidade.tinta }}
                        >
                            <ArrowLeft className="size-4 transition-transform duration-100 group-hover:-translate-x-1" />
                            Eventos em oferta
                        </button>

                        <p className="sw-overline mt-8 @5xl/sw:mt-10" style={{ color: modalidade.tinta, opacity: 0.75 }}>
                            Sports Week
                        </p>

                        {/* Nome inteiro numa entrada só: quebrar por palavra criava
                            linhas artificiais em "Corrida de rua" e "Mountain bike". */}
                        <HeadlineCinetica
                            quebraNatural
                            linhas={[modalidade.nome]}
                            className="mt-2 max-w-[14ch] text-[length:var(--sw-fs-d2)]"
                            style={{ color: modalidade.tinta }}
                        />

                        {/* A contagem vai numa tarja sólida de ink: sobre cor saturada,
                            texto solto é loteria de contraste. Três das oito modalidades
                            têm tinta branca sobre azul ou magenta e reprovariam em AA. */}
                        <motion.p
                            className="mt-6"
                            initial={reduce ? false : { opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: DUR.enter, ease: EASE_OUT_EXPO, delay: reduce ? 0 : 0.35 }}
                        >
                            <SwTag
                                className="px-4 py-2 text-[length:var(--sw-fs-corpo)]"
                                style={{ backgroundColor: "var(--sw-ink)", color: "var(--sw-lime)" }}
                            >
                                {eventos.length} {eventos.length === 1 ? "inscrição" : "inscrições"} em oferta até 30 de novembro.
                            </SwTag>
                        </motion.p>
                    </SwContainer>
                </motion.div>
            </div>

            <SwFaixa>
                <Marquee
                    velocidade={18}
                    className="py-2 @5xl/sw:py-3"
                    style={{ backgroundColor: "var(--sw-navy)", color: "var(--sw-lime)" }}
                    textoAcessivel={`${modalidade.nomeCurto} na Sports Week`}
                >
                    {Array.from({ length: 10 }).map((_, i) => (
                        <span key={i} className="flex shrink-0 items-center gap-4 px-4">
                            <span className="sw-display text-[length:var(--sw-fs-mq)] leading-none whitespace-nowrap">
                                {modalidade.nomeCurto} na Sports Week
                            </span>
                            <Asterisco className="size-3 shrink-0" />
                        </span>
                    ))}
                </Marquee>
            </SwFaixa>

            {/* ------------------------------ Eventos ------------------------------ */}
            <section className="pt-10 @5xl/sw:pt-14">
                <SwContainer>
                    {eventos.length === 0 ? (
                        <div className="py-10 text-center">
                            <h3 className="sw-display text-[length:var(--sw-fs-d0)] leading-[1.35] text-[var(--sw-white)]">Ainda não tem evento aqui</h3>
                            <p className="mx-auto mt-2 max-w-[40ch] text-[length:var(--sw-fs-corpo)]" style={{ color: "var(--sw-muted)" }}>
                                Nenhuma prova de {modalidade.nomeCurto.toLowerCase()} entrou na campanha até agora. Novos lotes abrem
                                ao longo da semana.
                            </p>
                            <SwBotao className="mt-6" onClick={() => ir("/landing-pages/sports-week/eventos")}>
                                Ver todos os eventos
                            </SwBotao>
                        </div>
                    ) : (
                        /* A grade acompanha a quantidade real, que vai de 2 a 5 por
                           modalidade: com poucas provas, quatro colunas deixariam
                           células vazias. */
                        <div
                            className={
                                eventos.length >= 4
                                    ? "grid grid-cols-2 gap-x-[var(--sw-gap)] gap-y-8 @3xl/sw:grid-cols-3 @5xl/sw:gap-x-6 @5xl/sw:gap-y-12"
                                    : "grid grid-cols-2 gap-x-[var(--sw-gap)] gap-y-8 @5xl/sw:grid-cols-3 @5xl/sw:gap-x-6"
                            }
                        >
                            {eventos.map((evento) => (
                                <ItemRevelado key={evento.id} className="@container/cartao h-full">
                                    <EventoCard evento={evento} />
                                </ItemRevelado>
                            ))}
                        </div>
                    )}
                </SwContainer>
            </section>

            <SwFaixa className="mt-[var(--sw-ritmo)]">
                <FileiraAsteriscos style={{ backgroundColor: "var(--sw-magenta)", color: "var(--sw-lime)" }} />
            </SwFaixa>

            {/* -------------------------- Outras modalidades ------------------------ */}
            <section className="py-[var(--sw-ritmo)]">
                <SwContainer>
                    <Reveal>
                        <TituloDeSecao
                            titulo="Outras modalidades"
                            apoio="Mesma campanha, outro esporte. Todo mundo começa por um e acaba testando o seguinte."
                            layout="ladoALado"
                        />
                    </Reveal>

                    <AtalhosDeModalidade
                        className="mt-6 @5xl/sw:mt-10"
                        excluir={modalidade.slug}
                        onAbrir={(slug) => ir(`/landing-pages/sports-week/modalidade/${slug}`)}
                    />
                </SwContainer>
            </section>

            <SwFaixa as="footer" className="py-[var(--sw-ritmo)]" style={{ backgroundColor: "var(--sw-navy)" }}>
                <SwContainer className="@5xl/sw:grid @5xl/sw:grid-cols-12 @5xl/sw:items-center @5xl/sw:gap-10">
                    <div className="@5xl/sw:col-span-4">
                        <Monograma altura={36} className="text-[var(--sw-lime)] @5xl/sw:hidden" />
                        <Monograma altura={70} className="hidden text-[var(--sw-lime)] @5xl/sw:inline-flex" />
                    </div>
                    <p
                        className="mt-4 max-w-[64ch] text-sm leading-[1.5] @5xl/sw:col-span-7 @5xl/sw:col-start-6 @5xl/sw:mt-0"
                        style={{ color: "var(--sw-subtle)" }}
                    >
                        Preços válidos de 23 a 30 de novembro de 2026 ou enquanto durarem as vagas do lote. Valores não incluem a
                        taxa de serviço, exibida antes da compra.
                    </p>
                </SwContainer>
            </SwFaixa>

            <CtaFixo
                apoio={
                    disponiveis.length > 0
                        ? `${disponiveis.length} ${disponiveis.length === 1 ? "evento" : "eventos"} de ${modalidade.nomeCurto.toLowerCase()} em oferta`
                        : "Lote promocional encerrado"
                }
                rotulo={disponiveis.length > 0 ? "Garantir minha vaga" : "Entrar na lista de espera"}
                onClick={() => ir("/landing-pages/sports-week/eventos")}
            />
        </div>
    );
}
