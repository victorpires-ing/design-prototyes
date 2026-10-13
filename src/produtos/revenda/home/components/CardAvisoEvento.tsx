import { Mail01, SearchLg } from "@untitledui/icons";
import { cx } from "@/utils/cx";
import { SOMBRA_BOTAO } from "../../components/RevendaHeader";

/** DDIs do seletor de telefone (iguais aos de produção). */
const DDIS = ["+55 BR", "+1 US", "+34 ES", "+54 AR", "+52 MX", "+351 PT"];

/** Rótulo do campo — 14/500 #404040 com asterisco vermelho, como em produção. */
const Rotulo = ({ children, htmlFor }: { children: string; htmlFor: string }) => (
    <label htmlFor={htmlFor} className="flex items-center gap-0.5 text-sm leading-5 font-medium text-[#404040]">
        {children}
        <span className="text-[#ff271a]">*</span>
    </label>
);

/** Caixa do campo — 36px de altura, borda #d4d4d4, radius 8 (medidas do Figma). */
const Caixa = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={cx("flex h-9 items-center gap-2 rounded-lg border border-[#d4d4d4] bg-white px-3", className)}>{children}</div>
);

const entrada = "min-w-0 flex-1 bg-transparent text-sm leading-5 text-[#171717] outline-none placeholder:text-[#737373]";

/**
 * Último card da grade — "Não encontrou o que buscava?".
 * CONTEÚDO conforme o site em produção (4 campos: Evento, Nome, E-mail e WhatsApp com DDI).
 * VISUAL e metragem conforme o Figma: fundo #fff5e4, borda branca, radius 8,
 * header px-6 pt-6, form com gap 16, campos de 36px e botão de 44px.
 */
export function CardAvisoEvento() {
    return (
        <section className="col-span-2 mx-auto flex w-full max-w-[292px] flex-col self-stretch rounded-lg border border-white bg-[#fff5e4] py-4 shadow-[4px_4px_8px_0_rgba(0,0,0,0.05)] md:col-span-1 md:max-w-none">
            <header className="flex flex-col gap-0.5 px-6 pt-6 pb-5">
                <h3 className="text-base leading-6 font-semibold text-[#171717]">Não encontrou o que buscava?</h3>
                <p className="text-sm leading-5 text-[#525252]">
                    Conta pra gente o evento que você procura. Assim que alguém passar o ingresso pra frente, a gente te avisa no WhatsApp!
                </p>
            </header>

            <form className="flex flex-1 flex-col" onSubmit={(e) => e.preventDefault()}>
                <div className="flex flex-col gap-4 px-6">
                    <div className="flex flex-col gap-1.5">
                        <Rotulo htmlFor="rv-evento">Evento</Rotulo>
                        <Caixa>
                            <SearchLg className="size-5 shrink-0 text-[#a3a3a3]" aria-hidden="true" />
                            <input id="rv-evento" type="text" placeholder="Qual evento você busca?" className={entrada} />
                        </Caixa>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <Rotulo htmlFor="rv-nome">Nome</Rotulo>
                        <Caixa>
                            <input id="rv-nome" type="text" placeholder="Como podemos te chamar?" className={entrada} />
                        </Caixa>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <Rotulo htmlFor="rv-email">E-mail</Rotulo>
                        <Caixa>
                            <Mail01 className="size-5 shrink-0 text-[#a3a3a3]" aria-hidden="true" />
                            <input id="rv-email" type="email" placeholder="Seu melhor e-mail" className={entrada} />
                        </Caixa>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <Rotulo htmlFor="rv-zap">WhatsApp</Rotulo>
                        <Caixa className="gap-0">
                            <select
                                aria-label="Código do país"
                                className="shrink-0 appearance-none bg-transparent pr-4 text-sm leading-5 text-[#171717] outline-none"
                            >
                                {DDIS.map((d) => (
                                    <option key={d}>{d}</option>
                                ))}
                            </select>
                            <span className="mr-2 h-5 w-px shrink-0 bg-[#e5e5e5]" aria-hidden="true" />
                            <input id="rv-zap" type="tel" placeholder="(11) 96123-4567" className={entrada} />
                        </Caixa>
                    </div>
                </div>

                {/* Botão ancorado no fim do card */}
                <div className="mt-auto px-6 pt-8 pb-6">
                    <button
                        type="submit"
                        className={cx(
                            "flex h-11 w-full items-center justify-center rounded-lg bg-[#ff271a] text-base leading-6 font-semibold text-white transition duration-100 ease-linear hover:bg-[#e11b10]",
                            SOMBRA_BOTAO,
                        )}
                    >
                        Me avisa!
                    </button>
                </div>
            </form>
        </section>
    );
}
