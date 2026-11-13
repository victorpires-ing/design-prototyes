import { useState } from "react";
import { MinusCircle, PlusCircle } from "@untitledui/icons";
import { cx } from "@/utils/cx";
import type { PerguntaEvento } from "../../data/eventos";

/**
 * "Quer saber mais sobre este evento?" — acordeão do rodapé da página do evento.
 * Um item aberto por vez, o primeiro já nasce aberto (comportamento do site).
 * Aberto ganha fundo #f5f5f5 e ícone minus-circle; fechado fica sem fundo.
 */
export function FaqEvento({ perguntas }: { perguntas: PerguntaEvento[] }) {
    const [aberta, setAberta] = useState(0);

    return (
        <section className="flex w-full flex-col gap-6 sm:-mx-4 sm:gap-0">
            <header className="flex flex-col items-center gap-2 pt-6 pb-3 sm:py-3">
                <h2 className="text-center text-2xl leading-9 font-bold text-[#ff271a]">Quer saber mais sobre este evento?</h2>
                <p className="hidden text-xl leading-[30px] font-bold text-[#ff4a40] sm:block">A gente te explica</p>
            </header>

            <div className="flex w-full flex-col gap-6 sm:gap-0">
                {perguntas.map((p, i) => {
                    const estaAberta = aberta === i;
                    const Icone = estaAberta ? MinusCircle : PlusCircle;

                    return (
                        <div key={p.pergunta} className={cx("rounded-2xl px-3 py-6 sm:p-6", estaAberta && "bg-[#f5f5f5]")}>
                            <h3>
                                <button
                                    type="button"
                                    onClick={() => setAberta(estaAberta ? -1 : i)}
                                    aria-expanded={estaAberta}
                                    aria-controls={`faq-painel-${i}`}
                                    className="flex w-full items-start gap-4 text-left"
                                >
                                    <Icone className="size-6 shrink-0 text-[#a3a3a3]" strokeWidth={2} aria-hidden="true" />
                                    <span className="min-w-0 flex-1 text-base leading-6 font-semibold text-[#171717]">{p.pergunta}</span>
                                </button>
                            </h3>

                            {/* grid-rows 0fr → 1fr: anima a altura sem precisar medir o conteúdo */}
                            <div
                                id={`faq-painel-${i}`}
                                aria-hidden={!estaAberta}
                                className={cx(
                                    "grid pl-10 transition-[grid-template-rows] duration-200 ease-out",
                                    estaAberta ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                                )}
                            >
                                <div className="overflow-hidden">
                                    <p className="pt-1 text-base leading-6 text-[#525252]">{p.resposta}</p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
