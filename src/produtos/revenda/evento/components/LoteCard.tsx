import { InfoCircle } from "@untitledui/icons";
import { cx } from "@/utils/cx";
import {
    brl,
    compararComOriginal,
    ofertasDoLote,
    plural,
    totalOferta,
    valor,
    type ComparacaoValor,
    type LoteRevenda,
    type OfertaRevenda,
} from "../../data/eventos";

/** Como a oferta se posiciona frente ao valor de face — medidas do Figma 16420:25547. */
const BADGES: Record<ComparacaoValor, { texto: string; estilo: string }> = {
    abaixo: { texto: "Abaixo do valor original", estilo: "border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8]" },
    igual: { texto: "Valor igual ao original", estilo: "border-[#e5e5e5] bg-[#fafafa] text-[#404040]" },
    acima: { texto: "Acima do valor original", estilo: "border-[#fef08a] bg-[#fefce8] text-[#a16207]" },
};

function BadgeValor({ comparacao, className }: { comparacao: ComparacaoValor; className?: string }) {
    const { texto, estilo } = BADGES[comparacao];
    return (
        <span
            className={cx(
                "shrink-0 items-center rounded-full border px-2 py-0.5 text-xs leading-[18px] font-medium whitespace-nowrap",
                estilo,
                className,
            )}
        >
            {texto}
        </span>
    );
}

/**
 * Linha de oferta com a quebra de preço do decreto:
 * valor do ingresso + valor das taxas e, à direita, o total.
 * Desktop: tudo numa linha (h 57). Mobile: preço/taxa em cima e total embaixo (h 86).
 * Medidas do Figma 16414:25113 (desktop) e 16501:48493 (mobile).
 */
function LinhaOferta({ oferta, valorOriginal, aoAbrirTaxas }: { oferta: OfertaRevenda; valorOriginal: number; aoAbrirTaxas: () => void }) {
    const comparacao = compararComOriginal(oferta, valorOriginal);

    return (
        <li className="flex w-full items-center justify-between gap-2 rounded-xl bg-[#fafafa] px-2 py-3 sm:gap-[14px] sm:px-4">
            {/* O `gap` garante a folga mínima quando o space-between se fecha em telas estreitas */}
            <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                {/* No mobile a badge abre a pilha; no desktop ela acompanha o total, à direita */}
                <BadgeValor comparacao={comparacao} className="inline-flex self-start sm:hidden" />

                {/*
                 * Preço, taxa e disponibilidade compartilham a linha de base (como em produção:
                 * `_price_1340n` usa align-items: baseline). Centrar as caixas deixaria os
                 * textos de 18px e 14px desalinhados entre si em ~3,5px.
                 */}
                <span className="flex flex-wrap items-baseline gap-x-1 gap-y-0.5">
                    <span className="text-base leading-6 text-[#212b36] sm:text-[18px] sm:leading-7">{brl(oferta.ingresso)}</span>
                    <span className="flex items-baseline gap-1">
                        <span className="text-sm leading-5 text-[#212b36] sm:leading-[1.2]">+ {valor(oferta.taxa)} de taxa</span>
                        {/* No desktop a taxa tem entrelinha 16,8 e o círculo cai 2px abaixo do centro óptico do texto */}
                        <span className="group/taxa relative flex self-center sm:-translate-y-0.5">
                            <button
                                type="button"
                                onClick={aoAbrirTaxas}
                                aria-label="Entenda as taxas"
                                className="relative flex size-5 shrink-0 items-center justify-center text-[#8c8c8c] transition duration-100 ease-linear hover:text-[#525252] focus-visible:text-[#525252] focus-visible:outline-none before:absolute before:-inset-1 before:content-['']"
                            >
                                <InfoCircle className="size-5" strokeWidth={2} aria-hidden="true" />
                            </button>

                            {/* Dica no hover; o clique promove para o modal completo */}
                            <span
                                role="tooltip"
                                aria-hidden="true"
                                className="pointer-events-none absolute bottom-full left-1/2 z-40 mb-2 -translate-x-1/2 translate-y-0.5 scale-95 rounded-lg bg-[#0a0a0a] px-2.5 py-1.5 text-xs leading-[18px] font-semibold whitespace-nowrap text-white opacity-0 transition duration-100 ease-out group-hover/taxa:translate-y-0 group-hover/taxa:scale-100 group-hover/taxa:opacity-100 group-focus-within/taxa:translate-y-0 group-focus-within/taxa:scale-100 group-focus-within/taxa:opacity-100"
                            >
                                Entenda as taxas
                                <span aria-hidden="true" className="absolute top-full left-1/2 -ml-1 size-0 border-x-4 border-t-4 border-x-transparent border-t-[#0a0a0a]" />
                            </span>
                        </span>
                    </span>
                    {/* O Figma esconde a disponibilidade no mobile para a linha caber em 2 alturas */}
                    <span className="hidden text-sm leading-[1.2] text-[#212b36] sm:ml-1 sm:inline">
                        ({plural(oferta.disponiveis, "disponível", "disponíveis")})
                    </span>
                </span>

                {/* Badge + total, agrupados à direita no desktop */}
                <span className="flex shrink-0 items-center gap-2">
                    <BadgeValor comparacao={comparacao} className="hidden sm:inline-flex" />
                    <span className="flex items-baseline gap-1 sm:w-[118px]">
                        <span className="text-sm leading-5 text-[#212b36] sm:leading-[1.2]">total</span>
                        <span className="text-[18px] leading-7 font-bold text-[#212b36] sm:leading-[1.4]">{brl(totalOferta(oferta))}</span>
                    </span>
                </span>
            </div>

            {/* Altura fixa + centragem por flex: o rótulo não fica à mercê da entrelinha */}
            <button
                type="button"
                className="inline-flex h-8 w-[92px] shrink-0 items-center justify-center rounded-lg bg-[#ff271a] text-sm leading-none font-semibold text-white transition duration-100 ease-linear hover:bg-[#e11b10] sm:h-[33px] sm:w-auto sm:px-5"
            >
                Comprar
            </button>
        </li>
    );
}

/** Card de um lote/setor: cabeçalho com valor de face + as ofertas de revenda. */
export function LoteCard({ lote, aoAbrirTaxas }: { lote: LoteRevenda; aoAbrirTaxas: () => void }) {
    const disponiveis = ofertasDoLote(lote);

    return (
        <article className="flex w-full flex-col gap-3 rounded-2xl border border-[#e5e5e5] p-4 sm:p-6">
            <header className="flex w-full flex-col gap-1 pt-1 pb-3">
                <h3 className="text-xl leading-[26px] font-bold text-[#212b36]">{lote.nome}</h3>
                <p className="text-base leading-6 text-[#454f5b]">
                    {plural(disponiveis, "oferta", "ofertas")} · Valor original <span className="text-[#212b36]">{brl(lote.valorOriginal)}</span>
                </p>
            </header>

            <ul className="flex w-full flex-col gap-3">
                {lote.ofertas.map((o) => (
                    <LinhaOferta key={o.id} oferta={o} valorOriginal={lote.valorOriginal} aoAbrirTaxas={aoAbrirTaxas} />
                ))}
            </ul>
        </article>
    );
}
