import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { AlertTriangle, ArrowLeft, Bank, CheckCircle } from "@untitledui/icons";
import { BadgeWithDot } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";
import { PayOutLayout } from "../../components/PayOutLayout";
import {
    REPASSES,
    STATUS_META,
    formatarData,
    formatarValor,
    liquido,
    type Repasse,
    type StatusRepasse,
} from "../data/repasses";

/**
 * PayOut → Repasses → Detalhe: composição do valor (bruto → taxas → líquido),
 * conta de destino e liberação manual do repasse.
 */
export function DetalheRepasse() {
    const navigate = useNavigate();
    const { repasseId } = useParams();
    const original = REPASSES.find((r) => r.id === repasseId);

    const [status, setStatus] = useState<StatusRepasse | null>(original?.status ?? null);

    if (!original || !status) {
        return (
            <PayOutLayout titulo="Repasses">
                <div className="mx-auto flex w-full max-w-container flex-col items-start gap-4 px-4 py-16 md:px-8">
                    <h1 className="text-display-xs font-semibold text-primary">Repasse não encontrado</h1>
                    <p className="text-sm text-tertiary">O repasse solicitado não existe nesta base de protótipo.</p>
                    <Button size="sm" color="secondary" iconLeading={ArrowLeft} onClick={() => navigate("/payout/repasses")}>
                        Voltar para a fila
                    </Button>
                </div>
            </PayOutLayout>
        );
    }

    const repasse: Repasse = { ...original, status };
    const meta = STATUS_META[status];

    return (
        <PayOutLayout titulo="Repasses">
            <div className="mx-auto flex w-full max-w-container flex-col gap-8 px-4 py-8 md:px-8">
                <div className="flex flex-col gap-4">
                    <Button
                        size="sm"
                        color="link-gray"
                        iconLeading={ArrowLeft}
                        onClick={() => navigate("/payout/repasses")}
                        className="self-start"
                    >
                        Fila de repasses
                    </Button>

                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="flex flex-col gap-1">
                            <h1 className="text-display-xs font-semibold text-primary">{repasse.evento}</h1>
                            <p className="text-sm text-tertiary">
                                {repasse.organizador} · crédito {status === "pago" ? "em" : "previsto para"}{" "}
                                {formatarData(repasse.data)}
                            </p>
                        </div>
                        <BadgeWithDot size="md" color={meta.cor}>
                            {meta.label}
                        </BadgeWithDot>
                    </div>
                </div>

                {status === "bloqueado" && repasse.motivoBloqueio && (
                    <div className="flex items-start gap-3 rounded-xl bg-error-primary px-5 py-4 ring-1 ring-error">
                        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-fg-error-secondary" aria-hidden="true" />
                        <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-semibold text-primary">Repasse bloqueado</span>
                            <span className="text-sm text-tertiary">{repasse.motivoBloqueio}</span>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Composição do valor */}
                    <div className="flex flex-col gap-1 rounded-xl bg-primary px-6 py-5 ring-1 ring-secondary lg:col-span-2">
                        <span className="mb-2 text-sm font-semibold text-primary">Composição do valor</span>
                        <Linha rotulo="Valor bruto das vendas" valor={formatarValor(repasse.bruto)} />
                        <Linha rotulo="Taxa de serviço" valor={negativo(repasse.taxaServico)} />
                        <Linha rotulo="Taxa de antecipação" valor={negativo(repasse.taxaAntecipacao)} />
                        <Linha rotulo="Estornos e chargebacks" valor={negativo(repasse.estornos)} />
                        <Linha rotulo="Valor líquido a repassar" valor={formatarValor(liquido(repasse))} destaque />
                    </div>

                    {/* Destino + ação */}
                    <div className="flex flex-col gap-5 rounded-xl bg-primary px-6 py-5 ring-1 ring-secondary">
                        <div className="flex flex-col gap-2">
                            <span className="text-sm font-semibold text-primary">Conta de destino</span>
                            <div className="flex items-center gap-2.5">
                                <span className="flex size-9 items-center justify-center rounded-lg bg-secondary text-fg-quaternary">
                                    <Bank className="size-5" aria-hidden="true" />
                                </span>
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-primary">{repasse.contaDestino}</span>
                                    <span className="text-xs text-quaternary">{repasse.organizador}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 border-t border-secondary pt-5">
                            {status === "pago" ? (
                                <div className="flex items-center gap-2 text-sm text-tertiary">
                                    <CheckCircle className="size-5 text-fg-success-secondary" aria-hidden="true" />
                                    Repasse já creditado em {formatarData(repasse.data)}.
                                </div>
                            ) : (
                                <>
                                    <Button size="md" color="primary" onClick={() => setStatus("pago")}>
                                        Liberar repasse
                                    </Button>
                                    {status !== "bloqueado" && (
                                        <Button size="md" color="secondary" onClick={() => setStatus("bloqueado")}>
                                            Bloquear para revisão
                                        </Button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </PayOutLayout>
    );
}

/** Formata um desconto: sem sinal quando é zero, com "-" quando há valor. */
const negativo = (centavos: number) => (centavos === 0 ? formatarValor(0) : `- ${formatarValor(centavos)}`);

const Linha = ({ rotulo, valor, destaque = false }: { rotulo: string; valor: string; destaque?: boolean }) => (
    <div
        className={cx(
            "flex items-center justify-between py-2.5",
            destaque ? "mt-1 border-t border-secondary pt-4" : "border-b border-secondary last:border-b-0",
        )}
    >
        <span className={cx("text-sm", destaque ? "font-semibold text-primary" : "text-tertiary")}>{rotulo}</span>
        <span className={cx(destaque ? "text-lg font-semibold text-primary" : "text-sm text-primary")}>{valor}</span>
    </div>
);
