import { useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle, ChevronDown, Copy01, HelpCircle, InfoCircle, Lock01, MarkerPin01, QrCode01, Ticket01, XClose } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";
import { useTheme } from "@/providers/theme-provider";
import icPix from "../assets/ic-pix.svg";

/* Vermelho Ingresse (brand-600 do DS). */
const VERMELHO = "rgb(255 39 26)";
const VERMELHO_BG = "rgb(255 241 240)"; // brand-50
const TEAL = "#3a9b8f"; // teal do Pix (botão/links)

/* QR "falso" determinístico, só para ilustrar o Pix gerado. */
function FakeQR({ size = 220, variacao = 1 }: { size?: number; variacao?: number }) {
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
    const rects: ReactNode[] = [];
    for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
            const f = finder(r, c, 0, 0) ?? finder(r, c, 0, n - 7) ?? finder(r, c, n - 7, 0);
            const on = f !== null ? f : rand() > 0.55;
            if (on) rects.push(<rect key={`${r}-${c}`} x={c * cell} y={r * cell} width={cell + 0.5} height={cell + 0.5} />);
        }
    }
    return (
        <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} aria-label="QR Code Pix">
            <rect width={size} height={size} fill="#ffffff" />
            <g fill="#111827">{rects}</g>
        </svg>
    );
}

function BracketsQR({ children }: { children: ReactNode }) {
    const bracket = "absolute size-7 border-border-secondary";
    return (
        <div className="relative inline-block p-4">
            <span className={cx(bracket, "top-0 left-0 rounded-tl-lg border-t-4 border-l-4")} />
            <span className={cx(bracket, "top-0 right-0 rounded-tr-lg border-t-4 border-r-4")} />
            <span className={cx(bracket, "bottom-0 left-0 rounded-bl-lg border-b-4 border-l-4")} />
            <span className={cx(bracket, "right-0 bottom-0 rounded-br-lg border-r-4 border-b-4")} />
            {children}
        </div>
    );
}

const RadioDot = ({ selected }: { selected: boolean }) => (
    <span
        className={cx("mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition", selected ? "" : "border-border-primary")}
        style={selected ? { borderColor: VERMELHO } : undefined}
    >
        {selected && <span className="size-2.5 rounded-full" style={{ backgroundColor: VERMELHO }} />}
    </span>
);

const MetodoRecolhido = ({ icon, label }: { icon: ReactNode; label: string }) => (
    <button type="button" className="flex w-full items-center gap-3 rounded-2xl bg-primary px-4 py-4 text-left ring-1 ring-border-secondary transition duration-100 ease-linear hover:bg-secondary">
        <span className="flex size-6 items-center justify-center text-fg-secondary">{icon}</span>
        <span className="flex-1 text-md font-semibold text-primary">{label}</span>
        <ChevronDown className="size-5 text-fg-quaternary" />
    </button>
);

const LinhaResumo = ({ label, valor, bold }: { label: ReactNode; valor: string; bold?: boolean }) => (
    <div className="flex items-baseline justify-between gap-3">
        <span className={cx(bold ? "text-md font-bold text-primary" : "text-sm text-secondary")}>{label}</span>
        <span className={cx("tabular-nums text-primary", bold ? "text-lg font-bold" : "text-sm font-semibold")}>{valor}</span>
    </div>
);

/** Detecta viewport de celular (< lg = 1024px). */
function useIsMobile() {
    const [mobile, setMobile] = useState(() => typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches);
    useEffect(() => {
        const mq = window.matchMedia("(max-width: 1023px)");
        const handler = () => setMobile(mq.matches);
        mq.addEventListener("change", handler);
        return () => mq.removeEventListener("change", handler);
    }, []);
    return mobile;
}

export function Checkout() {
    const navigate = useNavigate();
    const isMobile = useIsMobile();
    // Checkout sempre em light mode; restaura o tema anterior ao sair.
    const { theme, setTheme } = useTheme();
    const temaAnterior = useRef(theme);
    useEffect(() => {
        setTheme("light");
        return () => setTheme(temaAnterior.current);
    }, [setTheme]);

    const [protecao, setProtecao] = useState<"com" | "sem">("com");
    const [taxasAbertas, setTaxasAbertas] = useState(true);
    const [taxasInfo, setTaxasInfo] = useState(false);
    const [copiado, setCopiado] = useState(false);
    const [resumoAberto, setResumoAberto] = useState(false);
    const [qrAberto, setQrAberto] = useState(false);

    const copiarCodigo = () => {
        navigator.clipboard?.writeText("00020126580014br.gov.bcb.pix0136a1f35204000053039865802BR").catch(() => {});
        setCopiado(true);
        window.setTimeout(() => setCopiado(false), 2000);
    };

    // Valores do resumo — o total muda com a seleção da proteção de compra.
    const PRECO_ITENS = 140;
    const PRECO_PROTECAO = 10;
    const PRECO_TAXAS = 45;
    const brl = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const totalPedido = PRECO_ITENS + (protecao === "com" ? PRECO_PROTECAO : 0) + PRECO_TAXAS;

    // Contagem regressiva da reserva (topo).
    const [restante, setRestante] = useState(9 * 60 + 15);
    useEffect(() => {
        const t = window.setInterval(() => setRestante((r) => (r > 0 ? r - 1 : 0)), 1000);
        return () => window.clearInterval(t);
    }, []);
    const tempo = `${String(Math.floor(restante / 60)).padStart(2, "0")}m${String(restante % 60).padStart(2, "0")}s`;

    // QR do Pix: ciclo de 1 min. Ao zerar, gera um novo QR e reinicia a contagem.
    const QR_TOTAL = 60;
    const [qrRestante, setQrRestante] = useState(QR_TOTAL);
    const [qrSeed, setQrSeed] = useState(1);
    useEffect(() => {
        const t = window.setInterval(() => {
            setQrRestante((r) => {
                if (r <= 1) {
                    setQrSeed((s) => s + 1);
                    return QR_TOTAL;
                }
                return r - 1;
            });
        }, 1000);
        return () => window.clearInterval(t);
    }, []);
    const relogio = `${String(Math.floor(qrRestante / 60)).padStart(2, "0")}:${String(qrRestante % 60).padStart(2, "0")}s`;
    const larguraTempo = (qrRestante / QR_TOTAL) * 100;
    const urgente = qrRestante <= 20; // últimos 20s: amarelo
    const piscando = qrRestante <= 10; // últimos 10s: QR piscando

    const thumbEvento = (cls: string) => (
        <div className={cx("shrink-0 overflow-hidden rounded-lg", cls)} style={{ background: "linear-gradient(135deg,#f59e0b 0%,#db2777 55%,#7c3aed 100%)" }} />
    );

    // Detalhamento do pedido (Itens + Adicionais + Taxas), compartilhado entre o resumo desktop e mobile.
    const resumoDetalhe = (
        <>
            <p className="text-md font-bold text-primary">Itens</p>
            <div className="mt-2 flex items-start justify-between gap-3">
                <p className="text-sm text-secondary">
                    <span className="font-semibold text-primary">1</span> Inteira
                    <br />
                    <span className="text-tertiary">Sab, 13/06/26 às 13h00</span>
                </p>
                <span className="text-sm font-semibold text-primary tabular-nums">{brl(PRECO_ITENS)}</span>
            </div>

            {protecao === "com" && (
                <>
                    <div className="my-4 border-t border-secondary" />
                    <p className="text-md font-bold text-primary">Adicionais</p>
                    <div className="mt-2">
                        <LinhaResumo label="Proteção de compra" valor={brl(PRECO_PROTECAO)} />
                    </div>
                </>
            )}

            <div className="my-4 border-t border-secondary" />

            <div className="flex items-baseline justify-between gap-3">
                <span className="flex items-center gap-1 text-md font-bold text-primary">
                    Taxas
                    <button
                        type="button"
                        aria-label="Entenda como calculamos os valores"
                        onClick={() => setTaxasInfo(true)}
                        className="text-fg-quaternary transition duration-100 ease-linear hover:text-fg-secondary"
                    >
                        <InfoCircle className="size-4" />
                    </button>
                </span>
                <span className="text-sm font-semibold text-primary tabular-nums">{brl(PRECO_TAXAS)}</span>
            </div>
            <button type="button" onClick={() => setTaxasAbertas((v) => !v)} className="mt-1 flex items-center gap-1 text-sm text-tertiary">
                {taxasAbertas ? "Ocultar detalhes" : "Ver detalhes"}
                <ChevronDown className={cx("size-4 transition", taxasAbertas && "rotate-180")} />
            </button>
            {taxasAbertas && (
                <div className="mt-2 flex flex-col gap-2">
                    <LinhaResumo label="Taxa de serviço" valor="R$ 15,00" />
                    <LinhaResumo label="Taxa de processamento" valor="R$ 20,00" />
                    <LinhaResumo label="Juros de parcelamento" valor="R$ 10,00" />
                </div>
            )}
        </>
    );

    const pixHeader = (
        <div className="flex items-center gap-2.5">
            <img src={icPix} alt="Pix" className="size-6" />
            <p className="text-md font-semibold text-primary">Aprovação imediata com o PIX</p>
        </div>
    );
    const pixCodigo = (
        <div className="flex items-center gap-3 rounded-xl bg-secondary px-4 py-3.5 ring-1 ring-border-secondary">
            <span className="min-w-0 flex-1 truncate text-sm text-tertiary">00020126580014br.gov.bcb.pix0136a1f3…5204000053039865802BR</span>
            <button
                type="button"
                onClick={copiarCodigo}
                className="relative flex min-w-[8.5rem] shrink-0 items-center justify-end overflow-hidden text-sm font-semibold text-emerald-600"
            >
                <AnimatePresence mode="wait" initial={false}>
                    {copiado ? (
                        <motion.span key="ok" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18, ease: "easeOut" }} className="flex items-center gap-1.5">
                            <CheckCircle className="size-4" />
                            Código copiado
                        </motion.span>
                    ) : (
                        <motion.span key="copy" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18, ease: "easeOut" }} className="flex items-center gap-1.5">
                            <Copy01 className="size-4" />
                            Copiar código
                        </motion.span>
                    )}
                </AnimatePresence>
            </button>
        </div>
    );
    const pixTimer = (
        <div>
            <div className="flex items-center justify-between">
                <span className="text-sm text-tertiary">Tempo restante</span>
                <span className={cx("text-sm font-semibold tabular-nums", urgente ? "text-amber-500" : "text-primary")}>{relogio}</span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                <div className={cx("h-full rounded-full transition-all duration-1000 ease-linear", urgente ? "bg-amber-400" : "bg-emerald-500")} style={{ width: `${larguraTempo}%` }} />
            </div>
        </div>
    );
    const pixQR = (size: number) => (
        <div className={cx("shrink-0 self-center", piscando && "animate-pulse")}>
            <BracketsQR>
                <FakeQR size={size} variacao={qrSeed} />
            </BracketsQR>
        </div>
    );

    return (
        <div className="min-h-screen bg-secondary text-primary">
            {/* Top bar */}
            <header className="bg-black">
                <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-center px-6">
                    <span className="flex items-center gap-1.5 font-bold tracking-wide text-white">
                        <Ticket01 className="size-5" />
                        INGRESSE
                    </span>
                </div>
            </header>

            <div className="mx-auto w-full max-w-6xl px-5 pt-6 pb-24 sm:px-6 lg:pb-16">
                {/* Breadcrumb + ações */}
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <nav className="flex items-center gap-2 text-sm text-tertiary">
                        <span>Ingressos</span>
                        <span>·</span>
                        <span>Atribuição</span>
                        <span>·</span>
                        <span className="font-semibold" style={{ color: VERMELHO }}>
                            Pagamento
                        </span>
                    </nav>
                    <div className="flex items-center justify-between gap-3 lg:justify-end">
                        <span
                            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold"
                            style={{ color: VERMELHO, backgroundColor: VERMELHO_BG }}
                        >
                            <HelpCircle className="size-4" />
                            Suporte
                        </span>
                        <button type="button" className="flex items-center gap-1.5 text-sm font-medium text-secondary">
                            <span className="flex size-5 items-center justify-center overflow-hidden rounded-full bg-green-600 text-[9px]">🇧🇷</span>
                            PT
                            <ChevronDown className="size-4 text-fg-quaternary" />
                        </button>
                    </div>
                </div>

                {/* Resumo condensado no topo (mobile) */}
                {isMobile && (
                    <div className="mt-5 rounded-2xl bg-primary p-4 shadow-sm ring-1 ring-border-secondary">
                        <div className="flex items-center gap-3">
                            {thumbEvento("h-14 w-11")}
                            <p className="text-md font-bold text-primary">Vai safadão</p>
                        </div>
                        <div className="my-3 border-t border-secondary" />
                        {resumoAberto ? (
                            resumoDetalhe
                        ) : (
                            <div className="flex flex-col gap-1 text-sm text-secondary">
                                <p>
                                    <span className="font-semibold text-primary">1</span> Item · Proteção de compra
                                </p>
                                <p>Taxas · Cupom de desconto</p>
                            </div>
                        )}
                        <div className="my-3 border-t border-secondary" />
                        <div className="flex items-center justify-between gap-3">
                            <span className="text-md font-bold text-primary">Total do pedido</span>
                            <span className="text-lg font-bold text-primary tabular-nums">{brl(totalPedido)}</span>
                        </div>
                        <button
                            type="button"
                            aria-label={resumoAberto ? "Recolher resumo" : "Ver resumo"}
                            onClick={() => setResumoAberto((v) => !v)}
                            className="mt-1 flex w-full items-center justify-center text-fg-quaternary"
                        >
                            <ChevronDown className={cx("size-5 transition", resumoAberto && "rotate-180")} />
                        </button>
                    </div>
                )}

                {/* Evento (desktop) */}
                {!isMobile && (
                    <div className="mt-5 flex items-center gap-3">
                        {thumbEvento("h-20 w-16")}
                        <div className="min-w-0">
                            <p className="text-md font-bold text-primary">Vai safadão</p>
                            <p className="mt-0.5 flex items-center gap-1 text-sm text-tertiary">
                                <MarkerPin01 className="size-4" />
                                Belém - PA
                            </p>
                            <p className="mt-1 flex items-center gap-3 text-sm font-semibold" style={{ color: VERMELHO }}>
                                <span>Ver página do evento</span>
                                <span>Compartilhar</span>
                            </p>
                        </div>
                    </div>
                )}

                {/* Cabeçalho (desktop): Finalizar compra + timer acima do resumo */}
                {!isMobile && (
                    <div className="mt-8 flex items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-primary">Finalizar compra</h1>
                            <p className="mt-1 flex items-center gap-1.5 text-sm text-tertiary">
                                <Lock01 className="size-4" />
                                Compra 100% segura
                            </p>
                        </div>
                        <p className="shrink-0 text-sm text-tertiary">
                            Tempo restante:<span className="ml-1 font-semibold text-secondary tabular-nums">{tempo}</span>
                        </p>
                    </div>
                )}

                {/* Duas colunas */}
                <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
                    {/* Coluna principal */}
                    <div>
                        {/* Proteção */}
                        <h2 className="text-lg font-bold text-primary">Proteja-se de imprevistos!</h2>
                        <div className="mt-3 flex flex-col gap-3">
                            <button
                                type="button"
                                onClick={() => setProtecao("com")}
                                className="relative flex items-start gap-3 rounded-2xl border-2 p-5 text-left transition"
                                style={protecao === "com" ? { borderColor: VERMELHO, backgroundColor: VERMELHO_BG } : { borderColor: "var(--color-border-secondary)", backgroundColor: "var(--color-bg-primary)" }}
                            >
                                <span className="absolute -top-3 right-5 rounded-full bg-gray-900 px-3 py-1 text-xs font-semibold text-white">Recomendado</span>
                                <RadioDot selected={protecao === "com"} />
                                <div>
                                    <p className="text-md font-bold text-primary">Compra protegida por R$ 23,90</p>
                                    <p className="mt-0.5 text-sm text-tertiary">Quero meu dinheiro de volta nos casos previstos</p>
                                    <span className="mt-1 inline-block text-sm font-semibold underline" style={{ color: VERMELHO }}>
                                        Ver coberturas
                                    </span>
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => setProtecao("sem")}
                                className="flex items-start gap-3 rounded-2xl border-2 p-5 text-left transition"
                                style={protecao === "sem" ? { borderColor: VERMELHO, backgroundColor: VERMELHO_BG } : { borderColor: "var(--color-border-secondary)", backgroundColor: "var(--color-bg-primary)" }}
                            >
                                <RadioDot selected={protecao === "sem"} />
                                <div>
                                    <p className="text-md font-bold text-primary">Seguir sem proteção adicional</p>
                                    <p className="mt-0.5 text-sm text-tertiary">Tenho certeza que vou ao evento, imprevistos acontecem.</p>
                                </div>
                            </button>
                        </div>
                        <p className="mt-3 text-sm text-tertiary">
                            Ao aderir à proteção de compra, você declara estar de acordo com os{" "}
                            <span className="font-semibold" style={{ color: VERMELHO }}>
                                Termos e condições
                            </span>
                            .
                        </p>

                        {/* Pagamento */}
                        <h2 className="mt-8 text-lg font-bold text-primary">Escolha como pagar</h2>
                        <div className="mt-3 flex flex-col gap-3">
                            {/* Pix — já gerado por padrão (incentivo) */}
                            <div className="rounded-2xl bg-primary p-6 ring-1 ring-border-secondary">
                                {isMobile ? (
                                    <div className="flex flex-col">
                                        {pixHeader}
                                        <p className="mt-2 text-sm text-tertiary">Copie o código e cole no app do seu banco para pagar.</p>

                                        <div className="mt-4 rounded-xl bg-secondary px-4 py-3.5 ring-1 ring-border-secondary">
                                            <span className="block text-sm break-all text-tertiary">00020126580014br.gov.bcb.pix0136a1f3…5204000053039865802BR</span>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={copiarCodigo}
                                            className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl text-md font-semibold text-white transition duration-100 ease-linear active:opacity-90"
                                            style={{ backgroundColor: TEAL }}
                                        >
                                            {copiado ? <CheckCircle className="size-5" /> : <Copy01 className="size-5" />}
                                            {copiado ? "Código copiado" : "Copiar código PIX"}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setQrAberto((v) => !v)}
                                            className="mt-3 flex items-center justify-center gap-1.5 text-sm font-semibold"
                                            style={{ color: TEAL }}
                                        >
                                            <QrCode01 className="size-4" />
                                            Mostrar QR Code
                                            <ChevronDown className={cx("size-4 transition", qrAberto && "rotate-180")} />
                                        </button>
                                        {qrAberto && <div className="mt-4 flex justify-center">{pixQR(200)}</div>}

                                        <div className="mt-4">{pixTimer}</div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-12">
                                        <div className="flex min-w-0 flex-1 flex-col">
                                            {pixHeader}
                                            <div className="mt-4">{pixCodigo}</div>
                                            <div className="mt-4">{pixTimer}</div>
                                        </div>
                                        {pixQR(148)}
                                    </div>
                                )}
                            </div>

                            <MetodoRecolhido icon={<CreditCardIcon className="size-5" />} label="Cartão de crédito" />
                            <MetodoRecolhido icon={<GoogleIcon className="size-5" />} label="Google Pay" />
                            <MetodoRecolhido icon={<ClickToPayIcon className="size-5" />} label="Click To Pay" />
                        </div>
                    </div>

                    {/* Resumo do pedido (desktop) */}
                    {!isMobile && (
                        <aside className="h-fit self-start rounded-2xl bg-primary p-5 shadow-sm ring-1 ring-border-secondary lg:sticky lg:top-6">
                            <div className="flex items-center gap-3">
                                {thumbEvento("h-14 w-11")}
                                <p className="text-md font-bold text-primary">Vai safadão</p>
                            </div>
                            <div className="my-4 border-t border-secondary" />
                            {resumoDetalhe}
                            <div className="my-4 border-t border-secondary" />
                            <LinhaResumo label="Total do pedido" valor={brl(totalPedido)} bold />
                        </aside>
                    )}
                </div>
            </div>

            {/* Modal: entenda as taxas */}
            {taxasInfo && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay/50 p-5" role="dialog" aria-modal="true" onClick={() => setTaxasInfo(false)}>
                    <div className="w-full max-w-md rounded-2xl bg-primary p-6 shadow-xl ring-1 ring-border-secondary" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-start justify-between gap-3">
                            <h2 className="text-lg font-bold text-primary">Entenda como calculamos os valores</h2>
                            <button
                                type="button"
                                aria-label="Fechar"
                                onClick={() => setTaxasInfo(false)}
                                className="-mr-1 flex size-6 shrink-0 items-center justify-center text-fg-quaternary transition duration-100 ease-linear hover:text-fg-secondary"
                            >
                                <XClose className="size-5" />
                            </button>
                        </div>

                        <div className="mt-4 flex flex-col gap-4">
                            <ItemTaxa
                                titulo="Taxa de serviço"
                                texto="Responsável por viabilizar a operação da plataforma, incluindo tecnologia, atendimento e segurança da compra."
                            />
                            <ItemTaxa
                                titulo="Taxa de processamento"
                                texto="Referente ao processamento do pagamento e às integrações necessárias para concluir a transação com segurança."
                            />
                            <ItemTaxa
                                titulo="Juros de parcelamento"
                                texto="Valor aplicado pela operadora financeira em compras parceladas, conforme a forma de pagamento escolhida."
                            />
                            <ItemTaxa titulo="Desconto" texto="Os descontos são aplicados exclusivamente ao valor dos itens, sem incidência nas taxas." />
                        </div>
                    </div>
                </div>
            )}

            {/* Botão flutuante — teste de usabilidade */}
            {isMobile ? (
                <div className="fixed inset-x-0 bottom-0 z-40 bg-primary px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] ring-1 ring-border-secondary">
                    <Button
                        size="lg"
                        color="primary"
                        iconLeading={CheckCircle}
                        className="w-full"
                        onClick={() => navigate("/payin/checkout/analise")}
                    >
                        Terminei minha análise
                    </Button>
                </div>
            ) : (
                <Button
                    size="lg"
                    color="primary"
                    iconLeading={CheckCircle}
                    className="fixed right-6 bottom-6 z-40 shadow-lg"
                    onClick={() => navigate("/payin/checkout/analise")}
                >
                    Terminei minha análise
                </Button>
            )}
        </div>
    );
}

const ItemTaxa = ({ titulo, texto }: { titulo: string; texto: string }) => (
    <div>
        <p className="text-sm font-bold text-primary">{titulo}</p>
        <p className="mt-1 text-sm leading-relaxed text-tertiary">{texto}</p>
    </div>
);

/* --- Ícones custom --- */
function CreditCardIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
            <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
            <path d="M2.5 9.5h19" />
        </svg>
    );
}
function GoogleIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
            <path fill="#4285F4" d="M21.6 12.2c0-.7-.06-1.3-.18-1.9H12v3.6h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.2Z" />
            <path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.2H3.1v2.6A10 10 0 0 0 12 22Z" />
            <path fill="#FBBC05" d="M6.4 13.9a6 6 0 0 1 0-3.8V7.5H3.1a10 10 0 0 0 0 9l3.3-2.6Z" />
            <path fill="#EA4335" d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.8-2.8A10 10 0 0 0 3.1 7.5l3.3 2.6C7.2 7.7 9.4 5.9 12 5.9Z" />
        </svg>
    );
}
function ClickToPayIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
            <path d="M4 6c4-2 12-2 16 0M5 10c3.5-1.6 10.5-1.6 14 0M7 14c2.5-1.1 7.5-1.1 10 0" />
        </svg>
    );
}
