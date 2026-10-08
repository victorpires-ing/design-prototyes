import { motion } from "motion/react";
import { Calendar, MarkerPin01 } from "@untitledui/icons";
import { cx } from "@/utils/cx";
import type { Evento } from "../data/eventos";
import { getModalidade } from "../data/modalidades";
import { SPRING_POP, T_SNAP } from "../utils/motion-tokens";
import { useSwMotion } from "../utils/use-sw-motion";
import { SwTag } from "./SwUi";

/* Card vertical com capa quadrada.

   O card anuncia o desconto, nunca o preço. A API devolve o percentual, não o valor,
   e um evento tem várias modalidades com preços distintos. Daí o "até X% OFF": diz
   que existe oferta sem prometer um número que a gente não tem.

   A capa é construída com o sistema gráfico da campanha (bloco de cor da modalidade,
   listras do kit e o nome girado 90°, como nas composições do Figma) em vez de foto
   de banco de imagem. */
function Capa({ evento }: { evento: Evento }) {
    const modalidade = getModalidade(evento.modalidade);
    if (!modalidade) return null;

    return (
        /* A cor da modalidade fica por baixo da imagem: enquanto ela carrega, o
           card já tem a cor certa em vez de um buraco cinza. */
        <div className="relative aspect-square w-full shrink-0 overflow-hidden" style={{ backgroundColor: modalidade.cor }}>
            <img
                src={evento.imagem}
                alt=""
                loading="lazy"
                decoding="async"
                className="size-full object-cover"
            />

            {evento.esgotado ? (
                <span
                    aria-hidden="true"
                    className="absolute inset-0"
                    style={{ backgroundColor: "color-mix(in srgb, var(--sw-ink) 60%, transparent)" }}
                />
            ) : null}

            <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                {evento.esgotado ? (
                    <SwTag style={{ backgroundColor: "var(--sw-navy)", color: "var(--sw-muted)" }}>Esgotado</SwTag>
                ) : evento.gratuito ? (
                    <SwTag style={{ backgroundColor: "var(--sw-navy)", color: "var(--sw-lime)" }}>Cortesia</SwTag>
                ) : (
                    <SwTag style={{ backgroundColor: "var(--sw-navy)", color: "var(--sw-lime)" }}>
                        Até {evento.descontoMaximo}% OFF
                    </SwTag>
                )}
                {evento.relampago && !evento.esgotado ? (
                    <SwTag style={{ backgroundColor: "var(--sw-magenta-ink)", color: "var(--sw-white)" }}>Relâmpago</SwTag>
                ) : null}
            </div>
        </div>
    );
}

function Linha({ icone: Icone, children }: { icone: typeof Calendar; children: React.ReactNode }) {
    return (
        <p className="flex items-start gap-2 text-sm leading-snug" style={{ color: "var(--sw-muted-on-light)" }}>
            <Icone aria-hidden="true" className="mt-px size-4 shrink-0" />
            <span className="min-w-0">{children}</span>
        </p>
    );
}

export function EventoCard({ evento, onAbrir, className }: { evento: Evento; onAbrir?: () => void; className?: string }) {
    const { reduce } = useSwMotion();
    const modalidade = getModalidade(evento.modalidade);

    return (
        <motion.button
            type="button"
            onClick={onAbrir}
            /* A sombra sólida é a física do card: no hover ele sobe e ela cresce,
               no toque ele desce e ela some. Nada de blur, que repinta por frame. */
            initial="repouso"
            whileHover={reduce ? undefined : "hover"}
            whileTap={reduce ? undefined : "press"}
            variants={{ repouso: { y: 0 }, hover: { y: -4 }, press: { y: 4 } }}
            transition={SPRING_POP}
            className={cx(
                "relative isolate flex h-full w-full cursor-pointer flex-col rounded-xl border-2 text-left",
                className,
            )}
            style={{ borderColor: "var(--sw-navy)", backgroundColor: "var(--sw-white)" }}
        >
            <motion.span
                aria-hidden="true"
                className="absolute inset-0 -z-10 rounded-xl"
                style={{ backgroundColor: "var(--sw-magenta)" }}
                variants={{ repouso: { x: 4, y: 4 }, hover: { x: 8, y: 8 }, press: { x: 0, y: 0 } }}
                transition={T_SNAP}
            />

            {/* O recorte vive aqui dentro e não na raiz: um `overflow: hidden` na
                raiz cortaria o anel de foco, que é box-shadow. */}
            {/* O fundo mora aqui e não só na raiz: sem ele a sombra magenta, que é
                um irmão atrás do card, apareceria por baixo do conteúdo. */}
            <span
                className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[0.6rem]"
                style={{ backgroundColor: "var(--sw-white)" }}
            >
            <Capa evento={evento} />

            <div className="flex min-w-0 flex-1 flex-col gap-2 p-4 @sm/cartao:p-5">
                {/* `min-h-[2lh]`: com `line-clamp-2`, título curto subiria o bloco de
                    baixo e desalinharia a fileira inteira numa grade de 4 colunas. */}
                <h3 className="sw-ui line-clamp-2 min-h-[2lh] text-base leading-tight font-extrabold text-[var(--sw-navy)] @sm/cartao:text-lg">
                    {evento.titulo}
                </h3>

                <Linha icone={MarkerPin01}>
                    {evento.cidade}, {evento.uf}
                </Linha>

                <Linha icone={Calendar}>{evento.dataLabel}</Linha>

                {/* No card escuro o prazo era lime. No branco, lime dá 1.3:1 e some;
                    o magenta escuro mantém o tom de urgência e lê com 5.5:1. */}
                <p
                    className="sw-ui mt-auto pt-2 text-sm font-bold"
                    style={{ color: evento.esgotado ? "var(--sw-subtle-on-light)" : "var(--sw-magenta-ink)" }}
                >
                    {evento.esgotado ? "Inscrições encerradas" : `Inscreva-se até ${evento.inscricoesAteLabel}`}
                </p>
            </div>
            </span>

            <span className="sr-only">
                {modalidade?.nome}.{" "}
                {evento.esgotado
                    ? "Inscrições encerradas."
                    : `${evento.gratuito ? "Inscrição gratuita" : `Até ${evento.descontoMaximo} por cento de desconto`}. Inscrições abertas até ${evento.inscricoesAteLabel}.`}
            </span>
        </motion.button>
    );
}
