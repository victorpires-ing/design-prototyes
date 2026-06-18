/* QR Code fake (placeholder), sem molduras coloridas. */
export const FakeQR = ({ px = 200 }: { px?: number }) => {
    const N = 25;
    const isFinder = (r: number, c: number) => (r < 7 && c < 7) || (r < 7 && c >= N - 7) || (r >= N - 7 && c < 7);
    const cells: { x: number; y: number }[] = [];
    for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
            if (isFinder(r, c)) continue;
            if ((r * 3 + c * 7 + ((r * c) % 5)) % 3 === 0) cells.push({ x: c, y: r });
        }
    }
    const Finder = ({ x, y }: { x: number; y: number }) => (
        <>
            <rect x={x} y={y} width={7} height={7} fill="currentColor" />
            <rect x={x + 1} y={y + 1} width={5} height={5} fill="#fff" />
            <rect x={x + 2} y={y + 2} width={3} height={3} fill="currentColor" />
        </>
    );
    return (
        <svg width={px} height={px} viewBox={`0 0 ${N} ${N}`} shapeRendering="crispEdges" className="text-black" aria-label="QR Code">
            <rect width={N} height={N} fill="#fff" />
            {cells.map((cell, i) => (
                <rect key={i} x={cell.x} y={cell.y} width={1} height={1} fill="currentColor" />
            ))}
            <Finder x={0} y={0} />
            <Finder x={N - 7} y={0} />
            <Finder x={0} y={N - 7} />
        </svg>
    );
};
