type MosaicPath = { d: string; fill: string };

interface AnimatedMosaicProps {
    viewBox: string;
    paths: MosaicPath[];
    className?: string;
    /** Atraso (em segundos) antes da primeira peça começar a animar */
    baseDelay?: number;
}

/** Renderiza um grafismo em mosaico com cada peça (path) surgindo individualmente, em vez do conjunto inteiro como uma única imagem. */
export function AnimatedMosaic({ viewBox, paths, className, baseDelay = 0 }: AnimatedMosaicProps) {
    return (
        <svg viewBox={viewBox} preserveAspectRatio="none" className={className} style={{ display: "block", width: "100%", height: "100%" }}>
            {paths.map((p, i) => (
                <path
                    key={i}
                    d={p.d}
                    fill={p.fill}
                    style={{
                        transformBox: "fill-box",
                        transformOrigin: "center",
                        animation: `ss-piece-in 0.6s ease-out ${(baseDelay + i * 0.02).toFixed(2)}s both`,
                    }}
                />
            ))}
        </svg>
    );
}
