import type { Servico } from "../data/servicos";
import { MarcaParceiro } from "./marca-parceiro";

/** Marca da oferta: selo do parceiro (logo oficial ou selo provisório) com nome e categoria. */
export function MarcaServico({ servico }: { servico: Servico }) {
    return (
        <div className="flex items-center gap-3">
            {servico.logo ? (
                // Selo quadrado do parceiro, com a logo oficial em branco
                <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-black">
                    <img src={servico.logo} alt="" className="h-3.5 w-auto invert" />
                </span>
            ) : (
                <MarcaParceiro id={servico.id} nome={servico.parceiro} />
            )}
            <div className="flex flex-col">
                <span className="text-lg font-semibold text-primary">{servico.parceiro}</span>
                <span className="text-sm text-tertiary">{servico.categoria}</span>
            </div>
        </div>
    );
}

/** Título com o benefício principal e vantagens (a marca fica em MarcaServico). */
export function ApresentacaoServico({ servico }: { servico: Servico }) {
    return (
        <div className="flex flex-col gap-6">
            {/* Sem legenda abaixo do título: a descrição do serviço aparece só na lista de serviços */}
            <h2 className="text-xl font-bold text-primary sm:text-display-xs lg:text-display-sm">
                {servico.titulo}
                {(servico.chamada || servico.destaque) && (
                    <span className="block">
                        {servico.chamada} {servico.destaque && <span className="whitespace-nowrap text-brand-secondary">{servico.destaque}</span>}
                    </span>
                )}
            </h2>

            <ul className="flex flex-col gap-3">
                {servico.beneficios.map(({ icone: Icone, texto }) => (
                    <li key={texto} className="flex items-center gap-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary">
                            <Icone className="size-5 text-fg-primary" aria-hidden="true" />
                        </span>
                        <span className="text-md font-medium text-tertiary">{texto}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
