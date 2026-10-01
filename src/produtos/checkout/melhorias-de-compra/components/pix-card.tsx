import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle, ChevronDown, Copy01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";
import icPix from "../assets/ic-pix.svg";
import { PIX_CODIGO } from "../data/pedido";
import { useValidadePix } from "../utils/hooks";
import { QrPix } from "./qr-pix";

interface PixCardProps {
    isMobile: boolean;
    /** "fallback": o Pix oferecido depois que o cartão foi recusado. */
    variante?: "padrao" | "fallback";
}

/** Pix já gerado por padrão — o código vem antes do QR (copy-first), que é o gesto do celular. */
export function PixCard({ isMobile, variante = "padrao" }: PixCardProps) {
    const [copiado, setCopiado] = useState(false);
    const [qrAberto, setQrAberto] = useState(false);
    const { seed, relogio, progresso, urgente } = useValidadePix();

    const copiar = () => {
        navigator.clipboard?.writeText(PIX_CODIGO).catch(() => {});
        setCopiado(true);
        window.setTimeout(() => setCopiado(false), 2000);
    };

    const titulo =
        variante === "fallback" ? (
            <p className="text-md text-primary">O cartão não passou mas este ingresso ainda pode ser seu pagando com o PIX</p>
        ) : (
            <p className={cx("text-primary", isMobile ? "text-md font-medium" : "text-lg font-medium")}>Aprovação imediata com o PIX</p>
        );

    const cabecalho = (
        <div className={cx("flex gap-3", variante === "fallback" ? "items-start" : "items-center")}>
            <img src={icPix} alt="" className={cx("shrink-0", variante === "fallback" && !isMobile ? "size-10" : "size-6")} />
            {titulo}
        </div>
    );

    const rotuloCopia = (
        <AnimatePresence mode="wait" initial={false}>
            <motion.span
                key={copiado ? "ok" : "copiar"}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="flex items-center gap-1.5"
            >
                {copiado ? <CheckCircle className="size-4" /> : <Copy01 className="size-4" />}
                {copiado ? "Código copiado" : "Copiar código"}
            </motion.span>
        </AnimatePresence>
    );

    const tempo = (
        <div role="timer" aria-label={`Código válido por mais ${relogio}`}>
            <div className="flex items-center justify-between">
                <span className="text-sm text-secondary">Tempo restante</span>
                <span className={cx("text-sm font-semibold tabular-nums", urgente ? "text-warning-primary" : "text-primary")}>{relogio}</span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-quaternary">
                <div
                    className={cx("h-full rounded-full transition-[width] duration-1000 ease-linear", urgente ? "bg-warning-solid" : "bg-brand-solid")}
                    style={{ width: `${progresso}%` }}
                />
            </div>
        </div>
    );

    const selo =
        variante === "fallback" ? (
            <span className="absolute -top-2.5 right-3 rounded-full bg-success-solid px-2.5 py-0.5 text-xs font-medium text-white">Aprovação imediata</span>
        ) : null;

    if (isMobile) {
        return (
            <div className="relative rounded-2xl bg-primary p-4 shadow-md">
                {selo}
                {cabecalho}
                {variante === "padrao" && <p className="mt-4 text-sm text-tertiary">Copie o código e cole no app do seu banco para pagar.</p>}

                <div className="mt-4 flex items-center gap-3 rounded-xl bg-secondary px-4 py-4 ring-1 ring-border-secondary">
                    <span className="min-w-0 flex-1 truncate text-sm text-secondary">{PIX_CODIGO}</span>
                    <button type="button" onClick={copiar} aria-label="Copiar código Pix" className="shrink-0 text-fg-brand-secondary">
                        {copiado ? <CheckCircle className="size-4" /> : <Copy01 className="size-4" />}
                    </button>
                </div>

                <Button size="xl" color="primary" className="mt-4 w-full" iconLeading={copiado ? CheckCircle : Copy01} onClick={copiar}>
                    {copiado ? "Código copiado" : "Copiar código"}
                </Button>
                <Button
                    size="xl"
                    color="secondary"
                    className="mt-3 w-full"
                    aria-expanded={qrAberto}
                    iconTrailing={<ChevronDown className={cx("size-5 text-fg-quaternary transition", qrAberto && "rotate-180")} />}
                    onClick={() => setQrAberto((v) => !v)}
                >
                    Mostrar QR Code
                </Button>
                {qrAberto && (
                    <div className="mt-3 flex justify-center">
                        <QrPix size={172} variacao={seed} />
                    </div>
                )}

                <div className="mt-4">{tempo}</div>
            </div>
        );
    }

    return (
        <div className="relative flex items-center gap-8 rounded-2xl bg-primary px-5 py-6 shadow-md">
            {selo}
            <div className="flex min-w-0 flex-1 flex-col gap-6">
                {cabecalho}
                <div className="flex items-center gap-3 rounded-xl bg-secondary py-3.5 pr-4 pl-4 ring-1 ring-border-secondary">
                    <span className="min-w-0 flex-1 truncate text-sm text-tertiary">{PIX_CODIGO}</span>
                    <button
                        type="button"
                        onClick={copiar}
                        className="relative flex min-w-[8.5rem] shrink-0 items-center justify-end text-md font-semibold text-brand-secondary transition duration-100 ease-linear hover:text-brand-secondary_hover"
                    >
                        {rotuloCopia}
                    </button>
                </div>
                {tempo}
            </div>
            <QrPix size={164} variacao={seed} />
        </div>
    );
}
