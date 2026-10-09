import { Button } from "@/components/base/buttons/button";
import type { Quantitativo, TaxaServico } from "../data/combos";
import { brl, percentual, type Preco } from "../utils/preco";
import { Slideout } from "./Slideout";

/**
 * Painéis de informação legal que abrem SOBRE a tela de seleção.
 *
 * Nunca `navigate()`: o carrinho é `useState` puro, então sair da rota para ler
 * as regras da meia-entrada custa refazer a compra inteira. Obstáculo
 * desproporcional para exercer o benefício é exatamente o art. 8º II.
 */

const Paragrafo = ({ children }: { children: React.ReactNode }) => <p className="text-sm leading-relaxed text-tertiary">{children}</p>;

interface TaxaSlideoutProps {
    isOpen: boolean;
    onClose: () => void;
    taxa: TaxaServico;
    /** Par inteira/meia do próprio evento, para demonstrar a proporcionalidade do art. 9º. */
    exemplo?: { inteira: Preco; meia: Preco };
}

export function TaxaSlideout({ isOpen, onClose, taxa, exemplo }: TaxaSlideoutProps) {
    return (
        <Slideout isOpen={isOpen} title={`O que é a ${taxa.nome.toLowerCase()}`} onClose={onClose}>
            <Paragrafo>{taxa.descricao}</Paragrafo>
            <Paragrafo>É uma taxa só. Não cobramos taxa de conveniência, de processamento nem de entrega sobre o ingresso.</Paragrafo>
            <Paragrafo>
                Ela corresponde a {percentual(taxa.aliquota)} do valor do ingresso, sempre no mesmo percentual para inteira e meia-entrada.
                {exemplo && (
                    <>
                        {" "}
                        Por isso a meia continua custando exatamente metade: {brl(exemplo.meia.total)} contra {brl(exemplo.inteira.total)}.
                    </>
                )}
            </Paragrafo>
            <Paragrafo>
                Se o evento for cancelado, adiado ou sofrer alteração relevante, devolvemos o valor do ingresso e a {taxa.nome.toLowerCase()}.
            </Paragrafo>
            {/* Art. 7º §3º: o link só existe quando o documento existe. Link quebrado é pior que link ausente. */}
            {taxa.criteriosUrl && (
                <Button size="sm" color="link-color" href={taxa.criteriosUrl} target="_blank" rel="noreferrer" className="self-start">
                    Como definimos a {taxa.nome.toLowerCase()}
                </Button>
            )}
        </Slideout>
    );
}

interface MeiaSlideoutProps {
    isOpen: boolean;
    onClose: () => void;
    /** Quantitativo por grupo, para o art. 11 aparecer também aqui. */
    quantitativo?: Record<string, Quantitativo>;
    percentualVendido?: number | null;
}

export function MeiaSlideout({ isOpen, onClose, quantitativo, percentualVendido }: MeiaSlideoutProps) {
    const grupos = Object.entries(quantitativo ?? {}).filter(([, q]) => q.ofertados > 0);
    const totais = grupos.reduce((acc, [, q]) => ({ ofertados: acc.ofertados + q.ofertados, meia: acc.meia + q.ofertadosMeia }), { ofertados: 0, meia: 0 });
    const pctCota = totais.ofertados > 0 ? Math.round((totais.meia / totais.ofertados) * 100) : 0;

    return (
        <Slideout isOpen={isOpen} title="Regras da meia-entrada" onClose={onClose}>
            <Paragrafo>
                Têm direito à meia-entrada estudantes, pessoas com deficiência e seu acompanhante, jovens de 15 a 29 anos de baixa renda com ID
                Jovem, e pessoas com 60 anos ou mais.
            </Paragrafo>
            <Paragrafo>
                O benefício é pessoal. Na entrada do evento é preciso apresentar o documento que comprova a categoria escolhida na compra.
            </Paragrafo>

            {grupos.length > 0 && (
                <div className="flex flex-col gap-3 rounded-xl bg-secondary p-4">
                    <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-bold text-primary">Neste evento</span>
                        <span className="text-sm text-tertiary tabular-nums">
                            {totais.ofertados.toLocaleString("pt-BR")} ingressos disponibilizados
                        </span>
                        <span className="text-sm text-tertiary tabular-nums">
                            {totais.meia.toLocaleString("pt-BR")} com meia-entrada, {pctCota}% do total
                        </span>
                    </div>
                    <ul className="flex flex-col gap-2 border-t border-secondary pt-3">
                        {grupos.map(([nome, q]) => (
                            <li key={nome} className="flex items-baseline justify-between gap-3">
                                <span className="text-sm text-secondary">{nome}</span>
                                <span className="shrink-0 text-sm text-tertiary tabular-nums">
                                    {q.ofertados.toLocaleString("pt-BR")} ofertados, {q.ofertadosMeia.toLocaleString("pt-BR")} com meia
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <Paragrafo>
                {typeof percentualVendido === "number"
                    ? `Neste evento, ${percentualVendido}% dos ingressos foram vendidos com o benefício.`
                    : "Até 30 dias após o evento, publicamos aqui o percentual de ingressos vendidos com o benefício."}
            </Paragrafo>

            <Button size="sm" color="link-color" href="/marketplace/meia-entrada" target="_blank" rel="noreferrer" className="self-start">
                Ver a página completa da meia-entrada
            </Button>
        </Slideout>
    );
}
