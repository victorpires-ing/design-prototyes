import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { CheckCircle, ChevronLeft, ChevronUp, Copy01, Download01, Mail01, Printer, Receipt, Send01 } from "@untitledui/icons";
import { cx } from "@/utils/cx";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Progress } from "@/components/application/progress-steps/progress-steps";
import type { ProgressIconType } from "@/components/application/progress-steps/progress-types";
import { LoadingIndicator } from "@/components/application/loading-indicator/loading-indicator";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { Badge } from "@/components/base/badges/badges";
import { BackstageLayout } from "../../components/Backstage";
import { CompradorStep } from "../components/CompradorStep";
import { ItensVendaSelector } from "../components/ItensVendaSelector";
import { MeioPagamentoStep } from "../components/MeioPagamentoStep";
import { QrMock } from "../components/QrMock";
import { ITENS_POR_ID, SESSAO_DO_ITEM, currency, exigeIdentificacao, type Comprador } from "../data/bilheteria-data";
import { useBilheteria, type Pedido, type PedidoItem, type PedidoTipo } from "../data/bilheteria-store";

const TITULOS = ["Comprador", "Itens", "Meio de pagamento"];
type Fase = "wizard" | "processando" | "confirmacao";

export function NovaVenda() {
    const navigate = useNavigate();
    const { criarPedido } = useBilheteria();

    const [fase, setFase] = useState<Fase>("wizard");
    const [step, setStep] = useState(0);
    const [comprador, setComprador] = useState<Comprador | null>(null);
    const [itens, setItens] = useState<PedidoItem[]>([]);
    const [tipo, setTipo] = useState<PedidoTipo | null>(null);
    const [pedido, setPedido] = useState<Pedido | null>(null);

    const total = useMemo(() => itens.reduce((s, i) => s + (ITENS_POR_ID[i.itemId]?.preco ?? 0) * i.qtd, 0), [itens]);
    // Identificação é opcional: a etapa 1 sempre avança (só alerta quando não há comprador).
    const podeAvancar = step === 0 ? true : step === 1 ? itens.length > 0 : !!tipo;

    const steps: ProgressIconType[] = useMemo(
        () => TITULOS.map((title, i) => ({ title, description: "", status: i < step ? "complete" : i === step ? "current" : "incomplete" })),
        [step],
    );

    const voltar = () => (step === 0 ? navigate("/backstage/bilheteria-online") : setStep((s) => s - 1));

    const avancar = () => {
        if (!podeAvancar) return;
        if (step === 0) {
            // Sem comprador, ingressos faciais não podem ser vendidos: descarta qualquer um já no carrinho.
            if (!comprador) setItens((prev) => prev.filter((i) => !exigeIdentificacao(ITENS_POR_ID[i.itemId])));
            return setStep(1);
        }
        if (step < 2) return setStep((s) => s + 1);
        // Emitir pedido → processando → confirmação.
        setFase("processando");
        setTimeout(() => {
            const p = criarPedido({ tipo: tipo!, comprador: comprador ?? undefined, itens, valor: total });
            setPedido(p);
            setFase("confirmacao");
        }, 1800);
    };

    const novaVenda = () => {
        setPedido(null);
        setComprador(null);
        setItens([]);
        setTipo(null);
        setStep(0);
        setFase("wizard");
    };

    if (fase === "processando") {
        const proc =
            tipo === "debito"
                ? { t: "Aproxime o cartão ou o celular", s: "Aguardando o pagamento por aproximação." }
                : tipo === "pix"
                  ? { t: "Gerando cobrança Pix", s: "Isso leva só alguns segundos." }
                  : { t: "Processando compra", s: "Estamos emitindo o pedido. Isso leva só alguns segundos." };
        return (
            <BackstageLayout activeSection="cortesias" activeItem="bilheteria-online">
                <div className="flex min-w-0 flex-1 flex-col">
                    <header className="flex items-center justify-center px-0 py-6 md:px-6">
                        <h1 className="text-display-xs font-bold text-primary">Nova venda</h1>
                    </header>
                    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-0 pb-10 text-center md:px-6">
                        <LoadingIndicator type="line-spinner" size="lg" />
                        <div className="flex flex-col gap-1">
                            <h2 className="text-lg font-semibold text-primary">{proc.t}</h2>
                            <p className="text-sm text-tertiary">{proc.s}</p>
                        </div>
                    </main>
                </div>
            </BackstageLayout>
        );
    }

    if (fase === "confirmacao" && pedido) {
        return (
            <BackstageLayout activeSection="cortesias" activeItem="bilheteria-online">
                <div className="flex min-w-0 flex-1 flex-col">
                    <header className="flex items-center justify-center px-0 py-6 md:px-6">
                        <h1 className="text-display-xs font-bold text-primary">Nova venda</h1>
                    </header>
                    <main className="flex flex-1 flex-col items-center gap-6 px-0 pb-10 md:px-6">
                        <Confirmacao pedido={pedido} onGestao={() => navigate("/backstage/bilheteria-online")} onNova={novaVenda} />
                    </main>
                </div>
            </BackstageLayout>
        );
    }

    return (
        <BackstageLayout activeSection="cortesias" activeItem="bilheteria-online">
            <div className="flex min-w-0 flex-1 flex-col">
                <header className="relative flex items-center justify-between gap-3 px-0 py-6 md:px-6">
                    <ButtonUtility size="md" color="secondary" icon={ChevronLeft} tooltip="Voltar" onClick={voltar} className="max-md:hidden" />
                    <h1 className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-display-xs font-bold text-primary">Nova venda</h1>
                    <Button size="md" color="primary" isDisabled={!podeAvancar} onClick={avancar} className="max-md:hidden">
                        {step === 2 ? "Emitir pedido" : "Avançar"}
                    </Button>
                </header>

                <main className="flex flex-1 flex-col items-center gap-8 px-0 pb-32 md:px-6 md:pb-10">
                    <Progress.IconsWithText items={steps} type="number" size="sm" orientation="horizontal" className="max-w-[640px] max-md:hidden" />
                    <Progress.IconsWithText items={steps} type="number" size="sm" orientation="vertical" className="w-full md:hidden" />

                    <section className="w-full max-w-[1000px]">
                        {step === 0 && <CompradorStep comprador={comprador} onComprador={setComprador} />}
                        {step === 1 && <ItensVendaSelector itens={itens} onItens={setItens} identificado={!!comprador} />}
                        {step === 2 && <MeioPagamentoStep tipo={tipo} onTipo={setTipo} comprador={comprador} itens={itens} total={total} />}
                    </section>
                </main>

                {/* Rodapé fixo (mobile): resumo colapsável + ações */}
                <div className="fixed inset-x-0 bottom-0 z-30 md:hidden">
                    {itens.length > 0 && <ResumoMobile itens={itens} total={total} />}
                    <div className="flex gap-3 border-t border-secondary bg-primary px-4 py-3">
                        <Button size="lg" color="secondary" className="flex-1" onClick={voltar}>Voltar</Button>
                        <Button size="lg" color="primary" className="flex-1" isDisabled={!podeAvancar} onClick={avancar}>
                            {step === 2 ? "Emitir pedido" : "Avançar"}
                        </Button>
                    </div>
                </div>
            </div>
        </BackstageLayout>
    );
}

/* --------------------- Resumo colapsável (mobile) ---------------- */

function ResumoMobile({ itens, total }: { itens: PedidoItem[]; total: number }) {
    const [aberto, setAberto] = useState(false);
    const qtd = itens.reduce((s, i) => s + i.qtd, 0);

    return (
        <div className="border-t border-secondary bg-primary">
            <button type="button" onClick={() => setAberto((v) => !v)} aria-expanded={aberto} className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition duration-100 ease-linear hover:bg-primary_hover">
                <ChevronUp className={cx("size-4 shrink-0 text-fg-quaternary transition-transform duration-150", aberto && "rotate-180")} aria-hidden="true" />
                <span className="flex-1 text-sm font-semibold text-primary">Resumo</span>
                <span className="text-sm text-tertiary tabular-nums">{qtd} {qtd === 1 ? "item" : "itens"}</span>
                <span className="text-sm font-bold text-primary tabular-nums">{currency.format(total)}</span>
            </button>
            {aberto && (
                <ul className="flex max-h-[45vh] flex-col gap-3 overflow-y-auto border-t border-secondary px-4 py-3">
                    {itens.map((v) => {
                        const item = ITENS_POR_ID[v.itemId];
                        return (
                            <li key={v.itemId} className="flex items-start gap-3">
                                <span className="flex h-7 min-w-9 shrink-0 items-center justify-center rounded-md bg-secondary px-1.5 text-xs font-semibold text-secondary tabular-nums ring-1 ring-border-secondary">{v.qtd}</span>
                                <div className="flex min-w-0 flex-1 flex-col">
                                    <span className="truncate text-sm font-semibold text-primary">{item?.nome}</span>
                                    <span className="truncate text-xs text-tertiary">{[item?.grupo, item?.tipo].filter(Boolean).join(" - ")} · {SESSAO_DO_ITEM[v.itemId]}</span>
                                </div>
                                <span className="shrink-0 text-sm font-semibold text-primary tabular-nums">{currency.format((item?.preco ?? 0) * v.qtd)}</span>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}

/* ---------------------------- Confirmação ------------------------ */

const COPY: Record<Pedido["tipo"], { titulo: string; desc: string }> = {
    link: { titulo: "Pedido emitido com sucesso!", desc: "O link de pagamento foi gerado. Compartilhe com o comprador para concluir o pagamento." },
    pix: { titulo: "Pix gerado com sucesso!", desc: "Mostre o QR code para o comprador ou compartilhe o código copia e cola." },
    debito: { titulo: "Pagamento aprovado!", desc: "O pagamento por aproximação foi aprovado e o pedido está confirmado." },
    saldo: { titulo: "Pedido confirmado!", desc: "O valor foi debitado do saldo do produtor." },
};

function Confirmacao({ pedido, onGestao, onNova }: { pedido: Pedido; onGestao: () => void; onNova: () => void }) {
    const copiar = async (texto: string, msg: string) => {
        try {
            await navigator.clipboard?.writeText(texto);
            toast.success(msg);
        } catch {
            toast.message(texto);
        }
    };
    const meta = COPY[pedido.tipo];

    return (
        <div className="flex w-full max-w-[720px] flex-col gap-5">
            <div className="flex flex-col items-center gap-4 rounded-2xl bg-primary_alt p-6 text-center ring-1 ring-border-secondary">
                <FeaturedIcon icon={CheckCircle} color="success" theme="gradient" size="lg" />
                <Badge size="sm" color="success" type="pill-color">Pedido {pedido.id}</Badge>
                <div className="flex flex-col gap-1">
                    <h2 className="text-lg font-semibold text-primary">{meta.titulo}</h2>
                    <p className="text-sm text-tertiary">{meta.desc}</p>
                </div>

                {pedido.tipo === "pix" && pedido.pixCode && (
                    <div className="flex w-full flex-col items-center gap-4 pt-2">
                        <div className="rounded-2xl bg-white p-3 ring-1 ring-border-secondary">
                            <QrMock value={pedido.pixCode} className="size-44" />
                        </div>
                        <div className="flex w-full flex-col gap-1.5 text-left">
                            <span className="text-sm font-medium text-secondary">Pix copia e cola</span>
                            <div className="flex flex-col gap-2 sm:flex-row">
                                <div className="flex min-w-0 flex-1 items-center rounded-lg bg-primary_alt px-3 py-2.5 text-sm text-tertiary ring-1 ring-border-primary">
                                    <span className="truncate">{pedido.pixCode}</span>
                                </div>
                                <Button size="md" color="secondary" className="w-full sm:w-auto" iconLeading={Copy01} onClick={() => copiar(pedido.pixCode!, "Código Pix copiado")}>Copiar código</Button>
                            </div>
                        </div>
                    </div>
                )}

                {pedido.tipo === "link" && pedido.link && (
                    <div className="flex w-full flex-col gap-3 pt-2 text-left">
                        <div className="flex flex-col gap-1.5">
                            <span className="text-sm font-medium text-secondary">Link de pagamento</span>
                            <div className="flex flex-col gap-2 sm:flex-row">
                                <div className="flex min-w-0 flex-1 items-center rounded-lg bg-primary_alt px-3 py-2.5 text-sm text-tertiary ring-1 ring-border-primary">
                                    <span className="truncate">{pedido.link}</span>
                                </div>
                                <div className="flex gap-2">
                                    <Button size="md" color="secondary" className="flex-1 sm:flex-none" iconLeading={Copy01} onClick={() => copiar(`https://${pedido.link}`, "Link copiado")}>Copiar</Button>
                                    <Button size="md" color="secondary" className="flex-1 sm:flex-none" iconLeading={Send01} onClick={() => toast.success("Abrindo o WhatsApp…")}>WhatsApp</Button>
                                </div>
                            </div>
                        </div>
                        {pedido.comprador && (
                            <div className="flex items-center gap-2 rounded-lg bg-primary_alt px-3 py-2.5 ring-1 ring-border-secondary">
                                <Mail01 className="size-4 shrink-0 text-fg-quaternary" aria-hidden="true" />
                                <span className="truncate text-sm text-tertiary">Link enviado para o e-mail ({pedido.comprador.emailExibicao})</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Ingresso e nota — entrega igual para todo pedido aprovado (com ou sem identificação). */}
                {pedido.status === "aprovado" && (
                    <div className="flex w-full flex-col gap-2 pt-2 text-left">
                        <span className="text-sm font-medium text-secondary">Ingresso e nota</span>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                            <Button size="md" color="secondary" iconLeading={Printer} onClick={() => toast.success("Preparando impressão do ingresso…")}>Imprimir</Button>
                            <Button size="md" color="secondary" iconLeading={Download01} onClick={() => toast.success("PDF do ingresso baixado")}>Baixar PDF</Button>
                            <Button size="md" color="secondary" iconLeading={Receipt} onClick={() => toast.success("Nota baixada")}>Nota</Button>
                            {pedido.comprador && (
                                <Button size="md" color="secondary" iconLeading={Mail01} onClick={() => toast.success(`Enviado para ${pedido.comprador!.emailExibicao}`)}>Enviar</Button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button size="md" color="secondary" onClick={onGestao}>Ir para gestão de pedidos</Button>
                <Button size="md" color="primary" onClick={onNova}>Realizar nova venda</Button>
            </div>
        </div>
    );
}
