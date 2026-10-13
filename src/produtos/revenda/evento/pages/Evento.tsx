import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { RevendaHeader } from "../../components/RevendaHeader";
import { faqDoEvento, getEvento } from "../../data/eventos";
import { FaqEvento } from "../components/FaqEvento";
import { LoteCard } from "../components/LoteCard";
import { ModalTaxas } from "../components/ModalTaxas";

/**
 * Página de um evento do canal de Revenda — /revenda/:slug.
 *
 * Estrutura e comportamento conferidos no site em produção
 * (revenda.ingresse.com/retronejo-bauru: container de 1024px, breakpoint em 640px,
 * cabeçalho em 2 colunas no desktop e empilhado no mobile, barra preta de volta).
 * O bloco de ofertas segue o Figma 16414:13496 / 16501:48450, que já traz a quebra
 * de preço do decreto (ingresso + taxas + total) e o modal "Entenda as taxas".
 */
export function Evento() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const evento = getEvento(slug);
    const [modalTaxas, setModalTaxas] = useState(false);

    // Cada evento é uma página nova: sempre começar do topo
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [slug]);

    if (!evento) {
        return (
            <div className="min-h-screen bg-white font-['Elza'] text-[#374151]">
                <RevendaHeader />
                <main className="mx-auto flex max-w-[1024px] flex-col items-center gap-4 px-4 py-24 text-center">
                    <h1 className="text-2xl leading-8 font-bold text-[#212b36]">Evento não encontrado</h1>
                    <p className="text-base leading-6 text-[#454f5b]">Esse evento saiu do ar ou o endereço está errado.</p>
                    <button
                        type="button"
                        onClick={() => navigate("/revenda")}
                        className="mt-2 inline-flex h-11 items-center justify-center rounded-lg bg-[#ff271a] px-5 text-base leading-none font-bold text-white uppercase transition duration-100 ease-linear hover:bg-[#e11b10]"
                    >
                        Ver eventos em revenda
                    </button>
                </main>
            </div>
        );
    }

    const irParaOfertas = () => document.getElementById("ofertas")?.scrollIntoView({ behavior: "smooth", block: "start" });

    const botaoComprar = (
        <button
            type="button"
            onClick={irParaOfertas}
            className="inline-flex h-[41px] shrink-0 items-center justify-center rounded-lg bg-[#ff271a] px-5 text-base leading-none font-bold text-white uppercase transition duration-100 ease-linear hover:bg-[#e11b10] sm:h-10"
        >
            Comprar
        </button>
    );

    return (
        <div className="min-h-screen bg-white font-['Elza'] text-[#374151]">
            <RevendaHeader />

            <main className="w-full bg-white">
                <section className="mx-auto flex w-full max-w-[1024px] flex-col items-center gap-3 px-4 pb-12 sm:items-stretch sm:gap-6 sm:pt-6">
                    {/* Volta para a home — no mobile vira a barra preta no fim da página */}
                    <button
                        type="button"
                        onClick={() => navigate("/revenda")}
                        className="hidden w-full items-center gap-2 pb-1 text-sm leading-[17px] font-semibold text-[#454f5b] transition duration-100 ease-linear hover:text-[#ff271a] sm:flex"
                    >
                        <span aria-hidden="true">←</span>
                        Voltar para as revendas
                    </button>

                    {/*
                     * Cabeçalho. No desktop são 2 colunas (pôster 220 + corpo 756); no mobile a
                     * ordem muda — título, local/data, pôster, CTA e descrição. Como em produção,
                     * a coluna de texto usa `display: contents` no mobile para que os filhos
                     * entrem no flex do header e possam ser reordenados com `order`.
                     */}
                    <header className="flex w-full flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
                        <div className="order-3 flex w-full flex-col items-center gap-4 sm:order-1 sm:w-[220px] sm:shrink-0">
                            <div className="relative">
                                <div
                                    className="aspect-[3/4] w-[262px] overflow-hidden rounded-lg bg-[#f5f5f5] sm:w-[220px] sm:rounded-2xl"
                                    style={{ backgroundImage: evento.gradient }}
                                />
                                {evento.selo && (
                                    <span className="absolute bottom-3.5 left-1/2 -translate-x-1/2 rounded-lg bg-white px-3 py-1 text-xs leading-[18px] whitespace-nowrap text-[#ff271a] sm:hidden">
                                        {evento.selo}
                                    </span>
                                )}
                            </div>
                            {evento.selo && (
                                <span className="hidden rounded-lg bg-[#ff271a]/10 px-3 py-1 text-sm leading-[21px] font-bold text-[#ff271a] sm:block">
                                    {evento.selo}
                                </span>
                            )}
                        </div>

                        <div className="contents sm:order-2 sm:flex sm:min-w-0 sm:flex-1 sm:flex-col sm:gap-3">
                            <h1 className="order-1 pt-4 pb-2 text-center text-2xl leading-8 font-bold tracking-[-0.05em] text-[#212b36] uppercase sm:order-none sm:pt-0 sm:pb-0 sm:text-left sm:text-[36px] sm:leading-[41.4px] sm:tracking-normal">
                                {evento.nome}
                            </h1>

                            {/* Local, data e — só no desktop — o CTA, entre dois filetes */}
                            <div className="order-2 -mt-3 flex w-full items-center gap-1.5 border-y border-[#d4d4d4] py-1 sm:order-none sm:mt-0">
                                <div className="flex min-w-0 flex-1 flex-col items-center sm:items-start sm:py-1">
                                    <span className="text-center text-sm leading-5 text-[#454f5b] uppercase sm:text-left">{evento.local}</span>
                                    <span className="text-center text-sm leading-5 text-[#454f5b] uppercase sm:text-left">{evento.data}</span>
                                </div>
                                <div className="hidden flex-1 items-center justify-end sm:flex">{botaoComprar}</div>
                            </div>

                            {/* No mobile o CTA desce para depois do pôster */}
                            <div className="order-4 flex w-full items-center justify-center pt-3 sm:hidden">{botaoComprar}</div>

                            <div className="order-5 w-full rounded-lg sm:order-none sm:rounded-none">
                                <h2 className="border-b border-[#d4d4d4] pt-3 pb-1 pl-3 text-base leading-6 font-bold text-[#454f5b] sm:border-b-0">
                                    SOBRE ESTE EVENTO
                                </h2>
                                <div className="flex flex-col gap-2 p-3 text-base leading-6 text-[#454f5b] sm:pb-0">
                                    {evento.descricao.map((p) => (
                                        <p key={p.slice(0, 32)}>{p}</p>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* Lotes e ofertas de revenda */}
                    <div id="ofertas" className="flex w-full scroll-mt-24 flex-col gap-6">
                        {evento.lotes.map((l) => (
                            <LoteCard key={l.id} lote={l} aoAbrirTaxas={() => setModalTaxas(true)} />
                        ))}
                    </div>

                    <FaqEvento perguntas={faqDoEvento(evento)} />
                </section>
            </main>

            {/* Único rodapé desta página — a home tem o footer grande */}
            <button
                type="button"
                onClick={() => navigate("/revenda")}
                className="flex w-full items-center gap-2.5 bg-black pt-3 pr-2 pb-6 pl-3 text-sm leading-[17px] font-semibold text-white"
            >
                <span aria-hidden="true">←</span>
                Veja outros eventos em revenda
            </button>

            <ModalTaxas aberto={modalTaxas} aoFechar={() => setModalTaxas(false)} />
        </div>
    );
}
