import type { Evento } from "../data/eventos";
import { SECOES } from "../data/campanha";
import { Reveal } from "./Motion";
import { Tarja } from "./SwBrand";
import { SwContainer, SwFaixa } from "./SwContainer";
import { SwBotao } from "./SwUi";
import { Contador } from "./Numeros";

/* Faixa da oferta do dia. Mora na home e volta no meio da listagem, como respiro
   entre blocos de grade: vinte cards seguidos viram parede. */
export function OfertaRelampago({ evento, onAbrir }: { evento: Evento; onAbrir: () => void }) {
    return (
        <SwFaixa
            as="section"
            className="sw-grain py-[var(--sw-ritmo-cor)]"
            style={{
                backgroundColor: "var(--sw-ink)",
                clipPath: "polygon(0 var(--sw-diag), 100% 0, 100% 100%, 0 100%)",
            }}
        >
            {/* A capa do evento é o fundo, sem camada de cor por cima. O que protege
                o texto é escurecimento neutro só do lado onde ele está: assim a foto
                aparece de verdade e o contraste não depende dela. */}
            <img
                src={evento.imagem}
                alt=""
                aria-hidden="true"
                loading="lazy"
                decoding="async"
                className="absolute inset-0 size-full object-cover"
                style={{ objectPosition: "center 35%" }}
            />
            {/* Numa coluna estreita não há "lado do texto": o escurecimento tem de
                ser de cima para baixo, senão o título cai em cima da arte do cartaz. */}
            <span
                aria-hidden="true"
                className="absolute inset-0 @5xl/sw:hidden"
                style={{
                    background:
                        "linear-gradient(180deg, color-mix(in srgb, var(--sw-ink) 92%, transparent) 0%, color-mix(in srgb, var(--sw-ink) 86%, transparent) 55%, color-mix(in srgb, var(--sw-ink) 60%, transparent) 100%)",
                }}
            />
            <span
                aria-hidden="true"
                className="absolute inset-0 hidden @5xl/sw:block"
                style={{
                    background:
                        "linear-gradient(90deg, color-mix(in srgb, var(--sw-ink) 94%, transparent) 0%, color-mix(in srgb, var(--sw-ink) 82%, transparent) 42%, transparent 78%)",
                }}
            />
            <SwContainer className="relative @5xl/sw:grid @5xl/sw:grid-cols-12 @5xl/sw:items-end @5xl/sw:gap-10">
                <Reveal className="@5xl/sw:col-span-7">
                    <Tarja style={{ backgroundColor: "var(--sw-magenta)", color: "var(--sw-white)" }}>{SECOES.relampago.titulo}</Tarja>
                    <h2 className="sw-display mt-4 text-[length:var(--sw-fs-d0)] leading-[1.35] text-[var(--sw-white)]">
                        {evento.titulo}
                    </h2>
                    <p className="mt-2 max-w-[42ch] text-[length:var(--sw-fs-corpo)] text-[var(--sw-white)]/90">
                        {SECOES.relampago.apoio}
                    </p>
                    <p className="mt-1 text-sm text-[var(--sw-white)]/85">
                        {evento.dataLabel} · {evento.cidade}, {evento.uf}
                    </p>
                </Reveal>

                <div
                    className="mt-6 rounded-2xl border-2 p-5 @5xl/sw:col-span-4 @5xl/sw:col-start-9 @5xl/sw:mt-0 @5xl/sw:p-6"
                    style={{ backgroundColor: "var(--sw-ink)", borderColor: "var(--sw-magenta)" }}
                >
                    {/* Lime sobre magenta-ink dá 4.09: só pode aparecer em display acima
                        de 24px. Nenhum corpo em lime nesta faixa. */}
                    {/* "OFF" vai dentro do mesmo parágrafo: solto ao lado, ele se
                        descolava do número quando a linha quebrava. */}
                    <p className="sw-display text-[length:var(--sw-fs-d0)] leading-[1.2] whitespace-nowrap" style={{ color: "var(--sw-lime)" }}>
                        Até <Contador valor={evento.descontoMaximo} sufixo="%" />{" "}
                        <span className="align-baseline text-[0.42em] text-[var(--sw-white)]">OFF</span>
                    </p>
                    <p className="sw-ui mt-2 text-base font-extrabold text-[var(--sw-white)]">
                        Inscreva-se até {evento.inscricoesAteLabel}
                    </p>
                    <SwBotao tamanho="lg" larguraTotal className="mt-5" onClick={onAbrir}>
                        Garantir minha vaga
                    </SwBotao>
                </div>
            </SwContainer>
        </SwFaixa>
    );
}
