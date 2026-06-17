/** Linha de rasgo em zigzag usada nos cards de ingresso. */
export const Zigzag = () => {
    const teeth = 36;
    const w = 8;
    const h = 8;
    const pts: string[] = [];
    for (let i = 0; i <= teeth; i++) pts.push(`${i * w},${i % 2 === 0 ? h : 0}`);
    return (
        <svg
            viewBox={`0 0 ${teeth * w} ${h}`}
            preserveAspectRatio="none"
            className="h-2 w-full"
            style={{ color: "var(--color-border-secondary)" }}
            aria-hidden="true"
        >
            <polyline points={pts.join(" ")} fill="none" stroke="currentColor" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
        </svg>
    );
};
