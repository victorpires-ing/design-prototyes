import { cx } from "@/utils/cx";

const CORES = ["#22C55E", "#7C3AED", "#3B82F6", "#F97316", "#E30613"];

/** Formas do mosaico — variação de arredondamento por posição, pra imitar o padrão de blocos orgânicos da marca. */
const FORMAS = [
    "rounded-tl-2xl rounded-br-2xl",
    "rounded-tr-2xl rounded-bl-2xl",
    "rounded-full",
    "rounded-2xl",
    "rounded-t-2xl",
    "rounded-b-2xl",
    "rounded-l-2xl",
    "rounded-r-2xl",
];

interface PatternDecorProps {
    /** Número de blocos (linhas x colunas aproximado). */
    cols?: number;
    rows?: number;
    /** Versão em tons de cinza — usada como textura sutil de fundo. */
    mono?: boolean;
    className?: string;
}

/** Mosaico decorativo de blocos coloridos — motivo de marca usado como textura de fundo (mono) ou destaque colorido. */
export const PatternDecor = ({ cols = 6, rows = 3, mono, className }: PatternDecorProps) => {
    const total = cols * rows;

    return (
        <div className={cx("grid gap-1.5", className)} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }} aria-hidden="true">
            {Array.from({ length: total }, (_, i) => (
                <div
                    key={i}
                    className={cx("aspect-square", FORMAS[i % FORMAS.length])}
                    style={{ backgroundColor: mono ? "#EDEDED" : CORES[i % CORES.length] }}
                />
            ))}
        </div>
    );
};
