import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { CheckCircle, Mail01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { MarketplaceLayout } from "../../components/MarketplaceLayout";
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
            const saved = localStorage.getItem("marketplace:lastConfig:v2");
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

    const qs = params.toString();
    const voltarEvento = () => navigate(`/marketplace/event${qs ? `?${qs}` : ""}`);

    return (
        <MarketplaceLayout title={config.nome} badge={config.selo || undefined} logo={config.logo || undefined} accent={config.corDestaque || undefined}>
            <div className="mx-auto flex w-full max-w-[560px] flex-col items-center gap-6 rounded-2xl bg-primary p-6 text-center ring-1 ring-border-secondary md:p-10">
                <FeaturedIcon icon={CheckCircle} color="success" theme="light" size="xl" />

                <div className="flex flex-col gap-2">
                    <h1 className="text-2xl font-bold text-primary">{primeiroNome ? `Inscrição concluída, ${primeiroNome}!` : "Inscrição concluída!"}</h1>
                    <p className="text-md text-tertiary">
                        Tudo certo! Sua inscrição em <span className="font-semibold text-secondary">{config.nome}</span> foi confirmada com sucesso.
                    </p>
                </div>

                <div className="flex w-full items-start gap-3 rounded-xl bg-secondary p-4 text-left">
                    <Mail01 className="mt-0.5 size-5 shrink-0 text-fg-quaternary" />
                    <p className="text-sm text-secondary">
                        Enviamos os ingressos e os detalhes da inscrição para o seu e-mail. Os titulares atribuídos a outros usuários também receberão um convite por e-mail.
                    </p>
                </div>

                <div className="flex w-full flex-col gap-3 sm:flex-row">
                    <Button size="lg" color="secondary" className="w-full" onClick={voltarEvento}>
                        Voltar ao evento
                    </Button>
                    <Button size="lg" color="primary" className="w-full" href="https://ingresse.com">
                        Ver minhas compras
                    </Button>
                </div>
            </div>
        </MarketplaceLayout>
    );
}
