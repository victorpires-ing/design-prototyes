/** QR code decorativo (mock) — padrão determinístico a partir de um valor. */
export function QrMock({ value, className }: { value: string; className?: string }) {
    const N = 25;
    const cell = 8;

    const finder = (r: number, c: number): boolean | null => {
        const test = (br: number, bc: number) => {
            const rr = r - br;
            const cc = c - bc;
            if (rr < 0 || cc < 0 || rr > 6 || cc > 6) return null;
            const ring = rr === 0 || rr === 6 || cc === 0 || cc === 6;
            const center = rr >= 2 && rr <= 4 && cc >= 2 && cc <= 4;
            return ring || center;
        };
        return test(0, 0) ?? test(0, N - 7) ?? test(N - 7, 0);
    };

    const seed = [...value].reduce((a, ch) => ((a << 5) - a + ch.charCodeAt(0)) | 0, 7);
    const on = (r: number, c: number) => {
        const f = finder(r, c);
        if (f !== null) return f;
        const h = (Math.abs((r * 31 + c * 17) ^ seed) * 2654435761) >>> 0;
        return h % 100 < 48;
    };

    const cells: React.ReactNode[] = [];
    for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
            if (on(r, c)) cells.push(<rect key={`${r}-${c}`} x={c * cell} y={r * cell} width={cell} height={cell} fill="#0a0a0a" />);
        }
    }

    return (
        <svg viewBox={`0 0 ${N * cell} ${N * cell}`} className={className} shapeRendering="crispEdges" role="img" aria-label="QR code do Pix">
            <rect width={N * cell} height={N * cell} fill="#ffffff" />
            {cells}
        </svg>
    );
}
