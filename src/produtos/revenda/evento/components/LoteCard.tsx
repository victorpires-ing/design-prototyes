import type { FC } from "react";
import { InfoCircle, TrendDown01, TrendUp01 } from "@untitledui/icons";
import { cx } from "@/utils/cx";
import { SOMBRA_BOTAO } from "../../components/RevendaHeader";
import {
    brl,
    compararComOriginal,
    ofertasDoLote,
    plural,
    precoOriginal,
    totalOferta,
    type ComparacaoValor,
    type LoteRevenda,
    type OfertaRevenda,
} from "../../data/eventos";

/** Tooltip escuro do DS (bg-primary-solid no light). `lado` define de onde ele sai. */
function Dica({ children, lado }: { children: string; lado: "cima" | "direita" }) {
    return (
        <span
            role="tooltip"
            aria-hidden="true"
            className={cx(
                "pointer-events-none absolute z-40 scale-95 rounded-lg bg-[#0a0a0a] px-2.5 py-1.5 text-xs leading-[18px] font-semibold whitespace-nowrap text-white opacity-0 transition duration-100 ease-out",
                "group-hover/dica:scale-100 group-hover/dica:opacity-100 group-focus-within/dica:scale-100 group-focus-within/dica:opacity-100",
                lado === "cima" && "bottom-full left-1/2 mb-2 -translate-x-1/2",
                lado === "direita" && "top-1/2 left-full ml-2 -translate-y-1/2",
            )}
        >
            {children}
            {lado === "cima" ? (
                <span aria-hidden="true" className="absolute top-full left-1/2 -ml-1 size-0 border-x-4 border-t-4 border-x-transparent border-t-[#0a0a0a]" />
            ) : (
                <span aria-hidden="true" className="absolute top-1/2 right-full -mt-1 size-0 border-y-4 border-r-4 border-y-transparent border-r-[#0a0a0a]" />
            )}
        </span>
    );
}

/** Seta ao lado de "Preço na revenda" — Figma 16795:1997. Igual ao original: sem seta. */
const INDICATIVO: Record<Exclude<ComparacaoValor, "igual">, { Icone: FC<{ className?: string; strokeWidth?: number }>; cor: string; texto: string }> = {
    acima: { Icone: TrendUp01, cor: "text-[#a16207]", texto: "Acima do preço original" },
    abaixo: { Icone: TrendDown01, cor: "text-[#1d4ed8]", texto: "Abaixo do preço original" },
};

function Indicativo({ comparacao }: { comparacao: ComparacaoValor }) {
    if (comparacao === "igual") return null;
    const { Icone, cor, texto } = INDICATIVO[comparacao];
    return (
        <span className="group/dica relative flex">
            {/* Botão para o toque abrir a dica no mobile (foco), já que lá não há hover */}
            <button type="button" aria-label={texto} className={cx("flex focus-visible:outline-none", cor)}>
                {/* 2.25 no viewBox 24 = 1,5px no ícone de 16px, a espessura do Figma */}
                <Icone className="size-4" strokeWidth={2.25} aria-hidden="true" />
            </button>
            <Dica lado="direita">{texto}</Dica>
        </span>
    );
}

/** Mobile 14px (Figma 16795:2128); no desktop segue 12px. No mobile os valores usam text-primary (#171717), no desktop #212b36. */
const Rotulo = ({ children }: { children: string }) => <span className="text-sm leading-5 font-medium text-[#525252] sm:text-xs sm:leading-[18px]">{children}</span>;

/**
 * Linha de oferta: preço original (primário, sem taxas), preço na revenda + taxas e o total.
 * Desktop: tudo numa linha. Mobile: os valores empilhados e o Comprar na largura toda.
 * Figma 16795:1997 (desktop) e 16795:2128 (mobile).
 */
function LinhaOferta({ oferta, original, aoAbrirTaxas }: { oferta: OfertaRevenda; original: number; aoAbrirTaxas: () => void }) {
    const comparacao = compararComOriginal(oferta, original);

    return (
        <li className="flex w-full flex-col gap-4 rounded-xl bg-[#fafafa] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-4">
                {/* Preço na revenda em destaque; o original vem embaixo, pequeno e numa linha só (Figma 16815:63151 / 16795:62330) */}
                <div className="flex flex-col gap-2">
                    <span className="flex flex-col gap-0.5">
                        <span className="flex items-center gap-1">
                            <Rotulo>Preço na revenda</Rotulo>
                            <Indicativo comparacao={comparacao} />
                        </span>
                        <span className="flex flex-wrap items-center gap-x-1 gap-y-0.5 sm:flex-nowrap sm:gap-x-1.5 sm:whitespace-nowrap">
                            <span className="text-[18px] leading-7 text-[#171717] sm:text-[#212b36]">{brl(oferta.ingresso)}</span>
                            <span className="flex items-center gap-1">
                                <span className="text-base leading-6 text-[#171717] sm:text-[#212b36]">+ {brl(oferta.taxa)} de taxas</span>
                                <span className="group/dica relative flex">
                                    <button
                                        type="button"
                                        onClick={aoAbrirTaxas}
                                        aria-label="Entenda as taxas"
                                        className="relative flex size-[18px] shrink-0 items-center justify-center text-[#8c8c8c] transition duration-100 ease-linear hover:text-[#525252] focus-visible:text-[#525252] focus-visible:outline-none before:absolute before:-inset-1 before:content-['']"
                                    >
                                        <InfoCircle className="size-[18px]" strokeWidth={2} aria-hidden="true" />
                                    </button>
                                    {/* Dica no hover; o clique abre o modal completo */}
                                    <Dica lado="cima">Entenda as taxas</Dica>
                                </span>
                            </span>
                        </span>
                    </span>

                    <span className="flex items-center gap-0.5 text-xs leading-[18px] text-[#737373]">
                        <span className="font-medium">Preço original:</span>
                        <span>{brl(original)}</span>
                    </span>
                </div>

                {/* Mobile: o total vira o último bloco da pilha */}
                <span className="flex flex-col gap-0.5 sm:hidden">
                    <Rotulo>Total</Rotulo>
                    <span className="text-[18px] leading-7 font-semibold text-[#171717]">{brl(totalOferta(oferta))}</span>
                </span>
            </div>

            <div className="flex items-center gap-3">
                <span className="hidden text-sm leading-[1.2] text-[#212b36] sm:inline">({plural(oferta.disponiveis, "disponível", "disponíveis")})</span>
                <span className="hidden items-baseline gap-1 sm:flex">
                    <span className="text-sm leading-[1.2] text-[#212b36]">total</span>
                    <span className="text-[18px] leading-[1.4] font-bold text-[#212b36]">{brl(totalOferta(oferta))}</span>
                </span>
                {/*
                 * Altura fixa + centragem por flex. `pt-px`: a Elza tem a caixa do texto alta e
                 * o rótulo ficava 1px acima do Figma. `antialiased`: sem ele o macOS engrossa o
                 * branco sobre o vermelho. Pesos do Figma: Semibold no mobile, Bold no desktop.
                 */}
                <button
                    type="button"
                    className={cx(
                        "inline-flex h-8 w-full shrink-0 items-center justify-center rounded-lg bg-[#ff271a] pt-px text-sm leading-none font-semibold text-white antialiased transition duration-100 ease-linear hover:bg-[#e11b10] sm:h-[33px] sm:w-auto sm:px-5 sm:font-bold sm:shadow-none",
                        // No mobile o Figma usa o Button do DS, com borda interna e sombra; no desktop, não.
                        SOMBRA_BOTAO,
                    )}
                >
                    Comprar
                </button>
            </div>
        </li>
    );
}

/** Card de um tipo/modalidade (sem divisão por lote) com as ofertas de revenda. */
export function LoteCard({ lote, aoAbrirTaxas }: { lote: LoteRevenda; aoAbrirTaxas: () => void }) {
    const disponiveis = ofertasDoLote(lote);

    return (
        <article className="flex w-full flex-col gap-3 rounded-2xl border border-[#e5e5e5] p-4 sm:p-6">
            <header className="flex w-full flex-col gap-1 pt-1 pb-3">
                <h3 className="text-xl leading-[26px] font-bold text-[#212b36]">{lote.nome}</h3>
                <p className="text-base leading-6 text-[#454f5b]">
                    {plural(disponiveis, "oferta", "ofertas")}
                </p>
            </header>

            <ul className="flex w-full flex-col gap-3">
                {lote.ofertas.map((o) => (
                    <LinhaOferta key={o.id} oferta={o} original={precoOriginal(o, lote)} aoAbrirTaxas={aoAbrirTaxas} />
                ))}
            </ul>
        </article>
    );
}
