import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "motion/react";
import { cx } from "@/utils/cx";
import { MODALIDADES, type Modalidade } from "../data/modalidades";
import { eventosPorModalidade } from "../data/eventos";
import { DUR, EASE_OUT_EXPO, STAGGER } from "../utils/motion-tokens";
import { useSwMotion } from "../utils/use-sw-motion";
import { SwTag } from "./SwUi";

/* Grade de blocos de cor com tipo girado: o elemento do kit que no celular não
   cabia e aqui vira a estrutura da seção.

   Abaixo de @5xl o componente é exatamente o carrossel que a home tinha, para não
   haver regressão nenhuma no mobile. A partir de @5xl o carrossel some e entra um
   mosaico de larguras desiguais: 5/3/4, depois 4/3/5, depois 6/6. Fileiras com
   ritmos diferentes são o que tira o visual de template de oito cards iguais. */

/* Tailwind varre classes literais, então os spans não podem ser montados por
   interpolação: ficam numa tabela. */
const BLOCOS: { span: string; altura: string; fonte: number }[] = [
    { span: "@5xl/sw:col-span-5", altura: "@5xl/sw:row-start-1", fonte: 48 },
    { span: "@5xl/sw:col-span-3", altura: "@5xl/sw:row-start-1", fonte: 32 },
    { span: "@5xl/sw:col-span-4", altura: "@5xl/sw:row-start-1", fonte: 40 },
    { span: "@5xl/sw:col-span-4", altura: "@5xl/sw:row-start-2", fonte: 40 },
    { span: "@5xl/sw:col-span-3", altura: "@5xl/sw:row-start-2", fonte: 32 },
    { span: "@5xl/sw:col-span-5", altura: "@5xl/sw:row-start-2", fonte: 48 },
    { span: "@5xl/sw:col-span-6", altura: "@5xl/sw:row-start-3", fonte: 52 },
    { span: "@5xl/sw:col-span-6", altura: "@5xl/sw:row-start-3", fonte: 52 },
];

function Bloco({
    modalidade,
    indice,
    emCena,
    onAbrir,
}: {
    modalidade: Modalidade;
    indice: number;
    emCena: boolean;
    onAbrir: () => void;
}) {
    const { reduce } = useSwMotion();
    const total = eventosPorModalidade(modalidade.slug).length;
    const config = BLOCOS[indice] ?? BLOCOS[0];

    return (
        <motion.button
            type="button"
            onClick={onAbrir}
            whileTap={reduce ? undefined : { scale: 0.98 }}
            className={cx(
                "group sw-cursor-retro relative h-44 w-36 shrink-0 cursor-pointer snap-start overflow-hidden rounded-xl text-left",
                "@5xl/sw:h-full @5xl/sw:w-auto @5xl/sw:rounded-2xl",
                config.span,
                config.altura,
            )}
            style={{ backgroundColor: modalidade.cor }}
        >
            <span
                aria-hidden="true"
                className="sw-stripes absolute inset-0 opacity-[0.12] transition-opacity duration-200 group-hover:opacity-[0.22]"
                style={{
                    ["--sw-stripe-a" as string]: modalidade.tinta,
                    ["--sw-stripe-b" as string]: "transparent",
                }}
            />

            <span aria-hidden="true" className="absolute top-3 left-3 text-2xl @5xl/sw:top-5 @5xl/sw:left-5 @5xl/sw:text-[40px]">
                {modalidade.emoji}
            </span>

            {/* A contagem vive numa tarja sólida, não em `tinta` solta: três das oito
                modalidades têm tinta branca sobre azul ou magenta, o que reprova em AA
                a 16px. A tarja passa sobre as oito cores sem exceção. */}
            <span className="absolute top-3 right-3 @5xl/sw:top-5 @5xl/sw:right-5">
                <SwTag style={{ backgroundColor: "var(--sw-ink)", color: "var(--sw-lime)" }}>
                    {total} {total === 1 ? "evento" : "eventos"}
                </SwTag>
            </span>

            <span
                className="sw-display absolute bottom-3 left-3 block text-[19px] leading-[1.12] transition-transform duration-200 group-hover:translate-x-2 @5xl/sw:bottom-6 @5xl/sw:left-6 @5xl/sw:text-[length:var(--sw-bloco-fs)]"
                style={{ color: modalidade.tinta, ["--sw-bloco-fs" as string]: `${config.fonte}px` }}
            >
                {modalidade.nomeCurto}
            </span>

            <span
                aria-hidden="true"
                className="absolute inset-x-0 bottom-0 h-1 origin-left scale-x-0 transition-transform duration-200 group-hover:scale-x-100"
                style={{ backgroundColor: "var(--sw-lime)" }}
            />

            {/* Tampa que recua da direita: entrada em transform puro. */}
            <motion.span
                aria-hidden="true"
                className="absolute inset-0 z-10 origin-right"
                style={{ backgroundColor: "var(--sw-ink)" }}
                initial={false}
                animate={{ scaleX: emCena ? 0 : 1 }}
                /* A abertura anima; o rearme NÃO. Com `whileInView` puro a tampa
                   voltava fechando ao sair de cena, e no meio do scroll os blocos
                   pareciam encolher e crescer sem parar. Fechar sem duração deixa
                   a seção pronta para abrir de novo na próxima entrada. */
                transition={
                    emCena
                        ? { duration: reduce ? 0.18 : 0.52, ease: EASE_OUT_EXPO, delay: reduce ? 0 : indice * STAGGER.grid }
                        : { duration: 0 }
                }
            />

        </motion.button>
    );
}

export function MosaicoModalidades({ onAbrir }: { onAbrir: (slug: string) => void }) {
    const grade = useRef<HTMLDivElement>(null);

    /* Dois limiares, de propósito. A seção ABRE quando 30% dela entra, e só
       REARMA quando ela sai inteira da tela. Com um limiar só, o rearme caía no
       meio do scroll e os blocos abriam e fechavam sem parar. */
    const entrou = useInView(grade, { amount: 0.3 });
    const aindaVisivel = useInView(grade, { amount: 0 });
    const [emCena, setEmCena] = useState(false);

    useEffect(() => {
        if (entrou) setEmCena(true);
        else if (!aindaVisivel) setEmCena(false);
    }, [entrou, aindaVisivel]);

    return (
        <div className="relative">
            <div
                ref={grade}
                className={cx(
                    "scrollbar-hide flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2",
                    "@5xl/sw:grid @5xl/sw:snap-none @5xl/sw:grid-cols-12 @5xl/sw:grid-rows-[240px_200px_240px] @5xl/sw:gap-4 @5xl/sw:overflow-visible @5xl/sw:pb-0",
                )}
            >
                {MODALIDADES.map((modalidade, i) => (
                    <Bloco
                        key={modalidade.slug}
                        modalidade={modalidade}
                        indice={i}
                        emCena={emCena}
                        onAbrir={() => onAbrir(modalidade.slug)}
                    />
                ))}
            </div>
        </div>
    );
}
