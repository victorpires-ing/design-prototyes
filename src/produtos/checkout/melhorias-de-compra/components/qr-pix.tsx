import type { ReactNode } from "react";
import { cx } from "@/utils/cx";
import icPix from "../assets/ic-pix.svg";

/* QR "falso" determinístico, só para ilustrar o Pix gerado. */
function FakeQR({ size, variacao }: { size: number; variacao: number }) {
    const n = 25;
    const cell = size / n;
    let seed = (987654321 * variacao) & 0x7fffffff;
    const rand = () => {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        return seed / 0x7fffffff;
    };
    const finder = (r: number, c: number, br: number, bc: number) => {
        const rr = r - br;
        const cc = c - bc;
        if (rr < 0 || cc < 0 || rr > 6 || cc > 6) return null;
        const edge = rr === 0 || rr === 6 || cc === 0 || cc === 6;
        const center = rr >= 2 && rr <= 4 && cc >= 2 && cc <= 4;
        return edge || center;
    };
    // Miolo livre para o logo do Pix.
    const noLogo = (r: number, c: number) => Math.abs(r - 12) <= 2 && Math.abs(c - 12) <= 2;
    const rects: ReactNode[] = [];
    for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
            if (noLogo(r, c)) continue;
            const f = finder(r, c, 0, 0) ?? finder(r, c, 0, n - 7) ?? finder(r, c, n - 7, 0);
            const on = f !== null ? f : rand() > 0.55;
            if (on) rects.push(<rect key={`${r}-${c}`} x={c * cell} y={r * cell} width={cell + 0.5} height={cell + 0.5} />);
        }
    }
    return (
        <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} aria-label="QR Code do Pix" role="img">
            <rect width={size} height={size} fill="#ffffff" />
            <g fill="#27272a">{rects}</g>
        </svg>
    );
}

/** QR do Pix com as cantoneiras de leitura e o logo ao centro. */
export function QrPix({ size, variacao, className }: { size: number; variacao: number; className?: string }) {
    const canto = "absolute size-5 border-fg-brand-secondary";
    return (
        <div className={cx("relative inline-block shrink-0 p-5", className)}>
            <span className={cx(canto, "top-0 left-0 border-t-[3px] border-l-[3px]")} />
            <span className={cx(canto, "top-0 right-0 border-t-[3px] border-r-[3px]")} />
            <span className={cx(canto, "bottom-0 left-0 border-b-[3px] border-l-[3px]")} />
            <span className={cx(canto, "right-0 bottom-0 border-r-[3px] border-b-[3px]")} />
            <div className="relative">
                <FakeQR size={size} variacao={variacao} />
                <span className="absolute top-1/2 left-1/2 flex size-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white">
                    <img src={icPix} alt="" className="size-5" />
                </span>
            </div>
        </div>
    );
}
