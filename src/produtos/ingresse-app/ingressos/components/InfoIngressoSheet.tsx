import { useState } from "react";
import { CheckCircle, Copy01, XClose } from "@untitledui/icons";
import { cx } from "@/utils/cx";
import { BottomSheet } from "../../components/BottomSheet";

/** Gera um código alfanumérico estável (11 caracteres) a partir de uma semente. */
export function gerarCodigoIngresso(seed: string, n = 11): string {
    const chars = "0123456789ABCDEFGHIJKLMNPQRSTUVWXYZ";
    let h = 2166136261 >>> 0;
    for (let i = 0; i < seed.length; i++) {
        h ^= seed.charCodeAt(i);
        h = Math.imul(h, 16777619) >>> 0;
    }
    let out = "";
    for (let i = 0; i < n; i++) {
        h ^= i + 0x9e3779b9;
        h = Math.imul(h, 16777619) >>> 0;
        out += chars[h % chars.length];
    }
    return out;
}

interface InfoIngressoSheetProps {
    isOpen: boolean;
    onClose: () => void;
    /** Semente para gerar o código exibido (ex.: id do item). */
    seed: string;
    /** Sessão/data disponível do item. */
    sessao: string;
    /** Descrição do item (ex.: "Inteira", "Meia-entrada"). */
    descricao: string;
    /** Substantivo usado nos rótulos e textos. */
    variant?: "ingresso" | "produto";
}

/** Bottom sheet de "Informações do ingresso/produto" (código + sessão + descrição + orientações). */
export function InfoIngressoSheet({ isOpen, onClose, seed, sessao, descricao, variant = "ingresso" }: InfoIngressoSheetProps) {
    const [copiado, setCopiado] = useState(false);
    const codigo = gerarCodigoIngresso(seed || variant);
    const noun = variant === "produto" ? "produto" : "ingresso";

    const copiar = () => {
        navigator.clipboard?.writeText(codigo).catch(() => {});
        setCopiado(true);
        setTimeout(() => setCopiado(false), 1600);
    };

    return (
        <BottomSheet isOpen={isOpen} onClose={onClose}>
            <div className="flex flex-col">
                {/* Cabeçalho */}
                <div className="flex items-start justify-between gap-4">
                    <h2 className="text-lg font-bold text-primary">Informações do {noun}</h2>
                    <button
                        type="button"
                        aria-label="Fechar"
                        onClick={onClose}
                        className="-mt-1 -mr-1 flex size-8 shrink-0 items-center justify-center rounded-lg text-fg-quaternary transition duration-100 ease-linear active:bg-secondary"
                    >
                        <XClose className="size-5" />
                    </button>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-tertiary">
                    Consulte o código, as sessões disponíveis e outras informações complementares deste {noun}
                </p>

                {/* Card de informações */}
                <div className="mt-5 rounded-2xl bg-primary p-5 ring-1 ring-border-secondary">
                    <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                            <p className="text-sm text-tertiary">Código do {noun}</p>
                            <p className="mt-0.5 text-md font-bold tracking-wide text-primary">{codigo}</p>
                        </div>
                        <button
                            type="button"
                            aria-label={copiado ? "Código copiado" : "Copiar código"}
                            onClick={copiar}
                            className={cx(
                                "flex size-10 shrink-0 items-center justify-center rounded-lg ring-1 transition duration-100 ease-linear active:bg-secondary",
                                copiado ? "text-fg-success-primary ring-border-secondary" : "text-fg-secondary ring-border-secondary",
                            )}
                        >
                            {copiado ? <CheckCircle className="size-5" /> : <Copy01 className="size-5" />}
                        </button>
                    </div>

                    <p className="mt-4 text-sm text-tertiary">Sessão disponível</p>
                    <p className="mt-0.5 text-md font-bold text-primary">{sessao}</p>

                    <p className="mt-4 text-sm text-tertiary">Descrição do {noun}</p>
                    <p className="mt-0.5 text-md font-bold text-primary">{descricao}</p>

                    <div className="mt-5 flex flex-col gap-4 text-sm leading-relaxed text-tertiary">
                        {variant === "produto" ? (
                            <p>Ao chegar ao evento, retire seu produto na área de retirada indicada.</p>
                        ) : (
                            <p>Ao chegar ao evento, utilize a entrada indicada no seu ingresso.</p>
                        )}
                        <p>
                            Este {noun} está vinculado ao seu nome. Tenha um documento de identificação em mãos, caso ele seja solicitado na entrada.
                        </p>
                        <p>Em caso de dúvidas, fale com a nossa equipe.</p>
                        <button type="button" className="self-start text-sm font-bold text-brand-secondary transition duration-100 ease-linear active:opacity-70">
                            Falar com a Ingresse
                        </button>
                    </div>
                </div>
            </div>
        </BottomSheet>
    );
}
