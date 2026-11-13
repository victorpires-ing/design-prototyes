import { useState } from "react";
import { ChevronDown, InfoCircle } from "@untitledui/icons";
import { cx } from "@/utils/cx";
import type { Servico } from "../data/servicos";

/** Aviso curto em destaque, junto da seleção de valor (ex.: devolução do saldo). */
export function AvisoServico({ texto }: { texto: string }) {
    return (
        <div className="flex gap-3 rounded-xl bg-secondary p-4">
            <InfoCircle className="mt-0.5 size-5 shrink-0 text-fg-quaternary" aria-hidden="true" />
            <p className="text-sm text-tertiary">{texto}</p>
        </div>
    );
}

/** "Como funciona": condições de uso, validade e devolução, recolhíveis. */
export function Condicoes({ servico, inicialAberto = false }: { servico: Servico; inicialAberto?: boolean }) {
    const [aberto, setAberto] = useState(inicialAberto);
    const id = `condicoes-${servico.id}`;

    return (
        <section className="flex flex-col">
            <button
                type="button"
                aria-expanded={aberto}
                aria-controls={id}
                onClick={() => setAberto((v) => !v)}
                className="flex w-full cursor-pointer items-center justify-between gap-3 py-1 text-left outline-focus-ring focus-visible:outline-2"
            >
                <span className="text-md font-semibold text-primary">Como funciona</span>
                <ChevronDown className={cx("size-5 text-fg-quaternary transition-transform duration-150 ease-out", aberto && "rotate-180")} aria-hidden="true" />
            </button>
            {aberto && (
                <div id={id} className="flex flex-col gap-3 pt-3">
                    <ul className="flex list-disc flex-col gap-2 pl-5 text-sm text-tertiary marker:text-fg-quaternary">
                        {servico.condicoes.map((c) => (
                            <li key={c}>{c}</li>
                        ))}
                    </ul>
                    {/* Os termos ainda não foram validados com os parceiros */}
                    <p className="text-xs text-quaternary">Condições ilustrativas, sujeitas à validação com a {servico.parceiro}.</p>
                </div>
            )}
        </section>
    );
}
