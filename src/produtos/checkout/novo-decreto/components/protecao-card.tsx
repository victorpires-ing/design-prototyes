import { useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import icChevronCoberturas from "../assets/ic-chevron-coberturas.svg";
import icChevronOcultar from "../assets/ic-chevron-ocultar-coberturas.svg";
import shieldBranco16 from "../assets/shield-tick-branco-16.svg";
import shieldBranco20 from "../assets/shield-tick-branco-20.svg";
import shieldSucesso from "../assets/shield-tick-sucesso-22.svg";
import { PRECO_PROTECAO, brl, type Protecao } from "../data/pedido";
import { SMART_ANIMATE, SMART_ANIMATE_CSS } from "../utils/transicao";
import { AlturaAnimada } from "./altura-animada";
import { Botao, Divisor, Icone, LinkTexto } from "./base";
import { BottomSheetCoberturas, CoberturasDetalhadas } from "./coberturas";

type Escolha = "com" | "sem";

interface ProtecaoCardProps {
    isMobile: boolean;
    protecao: Exclude<Protecao, "sem-oferta">;
    onChange: (protecao: Escolha) => void;
}

const TituloCard = ({ children, tom = "primario" }: { children: string; tom?: "primario" | "card" }) => (
    <h2 className={`text-[16px] leading-[1.38] font-semibold ${tom === "card" ? "text-(--ck-heading-card)" : "text-(--ck-text-primary)"}`}>{children}</h2>
);

const Termos = () => (
    <p className="text-[12px] leading-4 font-medium tracking-[0.24px] text-(--ck-content-secundary)">
        Ao proteger seu ingresso, você concorda com os{" "}
        <a href="#termos" onClick={(e) => e.preventDefault()} className="text-(--ck-text-brand-tertiary)">
            Termos e condições
        </a>
        .
    </p>
);

/** "Carregando proteção": skeleton enquanto a oferta da seguradora não chega. */
function Carregando() {
    return (
        <div className="flex flex-col gap-3.5" aria-busy="true" aria-label="Carregando proteção">
            <TituloCard>Reembolso por imprevistos</TituloCard>
            <div className="flex flex-col gap-3">
                <span className="h-5 w-3/4 animate-pulse rounded-[4px] bg-(--ck-skeleton)" />
                <span className="h-3.5 w-full animate-pulse rounded-[4px] bg-(--ck-skeleton)" />
                <span className="h-3.5 w-[60%] animate-pulse rounded-[4px] bg-(--ck-skeleton)" />
                <span className="h-11 w-full animate-pulse rounded-lg bg-(--ck-skeleton)" />
            </div>
        </div>
    );
}

/** Decisão: "Proteja-se de imprevistos" + Seguir sem proteção / Proteger por R$ 10,00. */
function Decisao({ isMobile, onChange }: Omit<ProtecaoCardProps, "protecao">) {
    const [coberturas, setCoberturas] = useState(false);

    return (
        <div className="flex flex-col gap-3.5">
            <TituloCard>{isMobile ? "Proteja-se de imprevistos!" : "Proteja-se de imprevistos"}</TituloCard>
            <Divisor />
            <p className="text-[14px] leading-[1.4] text-(--ck-text-secondary)">Quero meu dinheiro de volta nos casos previstos</p>

            {isMobile ? (
                <>
                    <LinkTexto className="self-start" onPress={() => setCoberturas(true)}>
                        Ver coberturas
                    </LinkTexto>
                    <BottomSheetCoberturas isOpen={coberturas} onClose={() => setCoberturas(false)} />
                </>
            ) : (
                <>
                    <LinkTexto className="self-start" aria-expanded={coberturas} onPress={() => setCoberturas((v) => !v)}>
                        {coberturas ? "Ocultar coberturas" : "Ver coberturas"}
                        {coberturas ? (
                            <Icone src={icChevronOcultar} tamanho={16} className="rotate-180" />
                        ) : (
                            <Icone src={icChevronCoberturas} tamanho={20} />
                        )}
                    </LinkTexto>
                    <AnimatePresence initial={false}>
                        {coberturas && (
                            <motion.div
                                initial={{ height: 0, opacity: 0, marginTop: -14 }}
                                animate={{ height: "auto", opacity: 1, marginTop: 0 }}
                                exit={{ height: 0, opacity: 0, marginTop: -14 }}
                                transition={SMART_ANIMATE}
                                className="overflow-hidden"
                            >
                                <CoberturasDetalhadas />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </>
            )}

            <div className={`flex gap-3 ${isMobile ? "flex-col" : "items-center"}`}>
                <Botao variante="secundario" className={isMobile ? "w-full" : "flex-1"} onPress={() => onChange("sem")}>
                    Seguir sem proteção
                </Botao>
                <Botao variante="primario" icone={<Icone src={shieldBranco20} tamanho={20} />} className={isMobile ? "w-full" : "flex-1"} onPress={() => onChange("com")}>
                    Proteger por {brl(PRECO_PROTECAO)}
                </Botao>
            </div>

            <Termos />
        </div>
    );
}

/** Ingresso protegido: "Reembolso por imprevistos" + Remover. */
function Protegido({ onChange }: Pick<ProtecaoCardProps, "onChange">) {
    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-4">
                <TituloCard tom="card">Reembolso por imprevistos</TituloCard>
                <LinkTexto onPress={() => onChange("sem")}>Remover</LinkTexto>
            </div>
            <div className="flex w-full items-center gap-2.5 overflow-clip rounded-xl bg-(--ck-neutral-50) px-2 py-4">
                <Icone src={shieldSucesso} tamanho={22} />
                <p className="text-[16px] leading-[1.38] font-bold text-(--ck-text-success)">Ingresso protegido</p>
            </div>
        </div>
    );
}

/** Ingresso sem proteção: ainda dá para proteger depois. */
function SemProtecao({ isMobile, onChange }: Omit<ProtecaoCardProps, "protecao">) {
    const textos = (
        <div className="flex flex-col gap-2">
            <p className="text-[16px] leading-[1.38] font-bold text-(--ck-text-brand-secondary)">Ingresso sem proteção</p>
            <p className="text-[14px] leading-[1.4] text-(--ck-text-secondary)">Tenho certeza que vou ao evento, imprevistos acontecem.</p>
        </div>
    );

    return (
        <div className="flex flex-col gap-2">
            {isMobile ? <TituloCard>Proteja-se de imprevistos!</TituloCard> : <TituloCard tom="card">Reembolso por imprevistos</TituloCard>}
            <div className="w-full overflow-clip rounded-xl bg-(--ck-neutral-50) px-2 py-4">
                {isMobile ? (
                    <div className="flex flex-col gap-3">
                        {textos}
                        <Botao variante="primario" tamanho="sm-largo" icone={<Icone src={shieldBranco20} tamanho={20} />} className="w-full" onPress={() => onChange("com")}>
                            Proteger por {brl(PRECO_PROTECAO)}
                        </Botao>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <div className="w-[428px] max-w-[66%] shrink-0">{textos}</div>
                        <Botao variante="primario" tamanho="sm" icone={<Icone src={shieldBranco16} tamanho={16} />} className="shrink-0" onPress={() => onChange("com")}>
                            Proteger por {brl(PRECO_PROTECAO)}
                        </Botao>
                    </div>
                )}
            </div>
        </div>
    );
}

/**
 * Card "Proteção para imprevistos". Cada troca de estado é um Smart Animate (Ease In and
 * Out, 450 ms): a altura acompanha o conteúdo, o conteúdo antigo sai em fade enquanto o novo
 * entra, e a borda e a sombra mudam junto. Nada navega, então a rolagem fica onde estava.
 */
export function ProtecaoCard({ isMobile, protecao, onChange }: ProtecaoCardProps) {
    const card = useRef<HTMLElement>(null);
    const escolhida = protecao === "com" || protecao === "sem";

    const escolher = (nova: Escolha) => {
        onChange(nova);
        // O botão clicado some com a troca: o foco vai para o card, sem rolar a página.
        requestAnimationFrame(() => card.current?.focus({ preventScroll: true }));
    };

    return (
        <section
            ref={card}
            tabIndex={-1}
            aria-label="Proteção para imprevistos"
            className={`relative rounded-[14px] bg-(--ck-bg-primary) outline-hidden transition-[box-shadow] ${SMART_ANIMATE_CSS} ${
                escolhida ? "ck-sombra-protecao-escolhida" : "ck-sombra-protecao"
            }`}
        >
            {/* Borda "inside" do Figma: anel por cima do conteúdo, sem somar altura */}
            <span
                aria-hidden="true"
                className={`pointer-events-none absolute inset-0 z-10 rounded-[14px] ring-1 transition-[box-shadow] ring-inset ${SMART_ANIMATE_CSS} ${
                    escolhida ? "ring-(--ck-border-primary)" : "ring-transparent"
                }`}
            />
            <AlturaAnimada className="rounded-[14px]">
                {/* Depois da escolha o Figma soma a borda de 1px ao padding de 20px (card de 126px) */}
                <div className={`relative ${escolhida ? "p-[21px]" : "p-5"}`}>
                    <AnimatePresence initial={false} mode="popLayout">
                        <motion.div key={protecao} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={SMART_ANIMATE}>
                            {protecao === "carregando" && <Carregando />}
                            {protecao === "pendente" && <Decisao isMobile={isMobile} onChange={escolher} />}
                            {protecao === "com" && <Protegido onChange={escolher} />}
                            {protecao === "sem" && <SemProtecao isMobile={isMobile} onChange={escolher} />}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </AlturaAnimada>
        </section>
    );
}
