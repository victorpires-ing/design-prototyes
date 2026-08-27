import { CreditCard02, QrCode01 } from "@untitledui/icons";
import type { Pagamento } from "./EtapaPagamento";

interface Props {
    metodo: Pagamento;
    total: string;
}

/**
 * O que acontece entre "Finalizar" e o comprovante.
 *
 * Num totem essa espera é física: a pessoa tem que ir até a maquininha ou pegar
 * o celular. A tela precisa dizer para onde olhar, não só girar um spinner.
 */
export function ProcessandoPagamento({ metodo, total }: Props) {
    const pix = metodo === "pix";

    return (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-8 bg-primary px-10 text-center">
            {pix ? (
                <>
                    <QrCodeFalso />
                    <div className="flex flex-col gap-2">
                        <span className="text-3xl font-bold text-primary">Aponte a câmera para o QR Code</span>
                        <span className="text-lg text-tertiary">A confirmação aparece aqui assim que o Pix cair.</span>
                    </div>
                </>
            ) : (
                <>
                    <span className="relative flex size-24 items-center justify-center">
                        <span className="absolute inline-flex size-24 animate-ping rounded-full bg-brand-primary motion-reduce:hidden" />
                        <span className="relative flex size-20 items-center justify-center rounded-full bg-brand-solid">
                            <CreditCard02 className="size-9 text-white" aria-hidden="true" />
                        </span>
                    </span>
                    <div className="flex flex-col gap-2">
                        <span className="text-3xl font-bold text-primary">Siga as instruções na maquininha</span>
                        <span className="text-lg text-tertiary">Ela está do lado direito do totem.</span>
                    </div>
                </>
            )}

            <span className="rounded-xl bg-secondary px-5 py-3 text-2xl font-bold text-primary tabular-nums">{total}</span>
        </div>
    );
}

/** Grade decorativa no lugar de um QR de verdade — é protótipo, não cobra ninguém. */
function QrCodeFalso() {
    const celulas = Array.from({ length: 121 }, (_, i) => (i * 7919) % 11 > 4);

    return (
        <div aria-hidden="true" className="grid grid-cols-11 gap-1 rounded-2xl bg-white p-4 ring-1 ring-border-secondary">
            {celulas.map((cheia, i) => (
                <span key={i} className={`size-3 rounded-[2px] ${cheia ? "bg-black" : "bg-transparent"}`} />
            ))}
        </div>
    );
}
