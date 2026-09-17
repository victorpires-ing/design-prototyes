import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { CheckCircle, CreditCard02, Mail01, Printer, QrCode01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { TotemLayout } from "../../components/TotemLayout";
import { DEFAULT_CONFIG, decodeConfig, resolverLinkCurto, type EventConfig } from "../data/config";

/** Tela de sucesso — compra/inscrição concluída. Mantém o branding do evento via ?cfg= ou ?e=. */
export function Sucesso() {
    const navigate = useNavigate();
    const [params] = useSearchParams();

    const configInicial = useMemo<EventConfig>(() => {
        const raw = params.get("cfg");
        if (raw) {
            const d = decodeConfig(raw);
            if (d) return d;
        }
        try {
            const saved = localStorage.getItem("totem:lastConfig:v2");
            if (saved) {
                const d = decodeConfig(saved);
                if (d) return d;
            }
        } catch {
            /* ignore */
        }
        return DEFAULT_CONFIG;
    }, [params]);

    const [config, setConfig] = useState<EventConfig>(configInicial);

    // Link curto (?e=<id>): resolve o cfg no Redis para herdar o branding do evento.
    useEffect(() => {
        const e = params.get("e");
        if (!e) {
            setConfig(configInicial);
            return;
        }
        let vivo = true;
        resolverLinkCurto(e).then((c) => {
            if (vivo && c) setConfig(c);
        });
        return () => {
            vivo = false;
        };
    }, [params, configInicial]);

    const usuario = params.get("u")?.trim() || "";
    const primeiroNome = usuario.split(" ")[0] || "";
    const entrega = params.get("entrega") === "impresso" ? "impresso" : "digital";
    const pagamento = params.get("pg");
    const PAGAMENTOS: Record<string, { label: string; icon: typeof CreditCard02 }> = {
        credito: { label: "Cartão de crédito", icon: CreditCard02 },
        debito: { label: "Cartão de débito", icon: CreditCard02 },
        pix: { label: "Pix", icon: QrCode01 },
    };
    const meio = pagamento ? PAGAMENTOS[pagamento] : undefined;

    const qs = params.toString();
    const voltarEvento = () => navigate(`/totem/event${qs ? `?${qs}` : ""}`);

    return (
        <TotemLayout
            title={config.nome}
            badge={config.selo || undefined}
            logo={config.logo || undefined}
            accent={config.corDestaque || undefined}
            /* O comprovante é o fim da compra: abre visível e só depois volta ao repouso. */
            repousoInicial={false}
            onOcioso={voltarEvento}
            segundosOciosos={45}
        >
            <div className="mx-auto flex w-full max-w-[560px] flex-col items-center gap-6 rounded-2xl bg-primary p-6 text-center ring-1 ring-border-secondary md:p-10">
                <FeaturedIcon icon={CheckCircle} color="success" theme="light" size="xl" />

                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold text-primary">{primeiroNome ? `Compra concluída, ${primeiroNome}!` : "Compra concluída!"}</h1>
                    <p className="text-lg text-tertiary">
                        Seus ingressos de <span className="font-semibold text-secondary">{config.nome}</span> já estão garantidos.
                    </p>
                </div>

                {/* O que a pessoa precisa fazer agora depende da entrega que ela escolheu. */}
                <div className="flex w-full items-start gap-3 rounded-xl bg-secondary p-4 text-left">
                    {entrega === "impresso" ? (
                        <>
                            <Printer className="mt-0.5 size-5 shrink-0 text-fg-quaternary" />
                            <p className="text-md text-secondary">
                                Retire os ingressos na impressora do totem. Eles também ficam na sua carteira Ingresse e chegam por e-mail.
                            </p>
                        </>
                    ) : (
                        <>
                            <Mail01 className="mt-0.5 size-5 shrink-0 text-fg-quaternary" />
                            <p className="text-md text-secondary">
                                Enviamos os ingressos por e-mail e eles já estão na carteira Ingresse. Quem foi atribuído recebe o convite no e-mail dele.
                            </p>
                        </>
                    )}
                </div>

                {meio && (
                    <div className="flex w-full items-center gap-2 rounded-xl bg-secondary px-4 py-3 text-left">
                        <meio.icon className="size-4 shrink-0 text-fg-quaternary" aria-hidden="true" />
                        <span className="text-md text-tertiary">Pago com</span>
                        <span className="text-md font-medium text-secondary">{meio.label}</span>
                    </div>
                )}

                <div className="flex w-full flex-col gap-3 sm:flex-row">
                    {/* Num totem a saída é liberar a tela para a próxima pessoa. */}
                    <Button size="lg" color="primary" className="w-full" onClick={voltarEvento}>
                        Concluir
                    </Button>
                </div>
            </div>
        </TotemLayout>
    );
}
