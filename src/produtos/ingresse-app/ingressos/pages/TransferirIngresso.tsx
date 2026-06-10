import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowDown, ArrowLeft, CheckCircle, ChevronRight, Send01, XClose } from "@untitledui/icons";
import { Avatar } from "@/components/base/avatar/avatar";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { AppShell } from "../../components/AppShell";
import { BottomSheet } from "../../components/BottomSheet";
import { StatusBar } from "../../components/StatusBar";
import { Zigzag } from "../../components/Zigzag";
import alertAmareloIcon from "../../assets/alert-amarelo.png";

const DESTINATARIO = "Duny Alves da Silva";

const maskEmail = (e: string) => {
    const [local, domain] = e.split("@");
    if (!domain || local.length < 4) return e;
    return `${local.slice(0, 1)}*****${local.slice(-3)}@${domain}`;
};

export function TransferirIngresso() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [searched, setSearched] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const [done, setDone] = useState(false);

    const confirmarTransferencia = () => {
        setConfirming(false);
        setDone(true);
    };
    const concluir = () => {
        setDone(false);
        navigate("/ingresse-app/ingressos/detalhe", { state: { transferido: true } });
    };

    return (
        <AppShell showTabBar={false}>
            <div className="flex min-h-full flex-col bg-secondary">
                <StatusBar tone="dark" />

                {/* Top bar + título */}
                <div className="px-5 pt-2">
                    <button
                        type="button"
                        aria-label="Voltar"
                        onClick={() => navigate("/ingresse-app/ingressos/detalhe")}
                        className="flex size-10 items-center justify-center rounded-lg bg-primary text-fg-secondary ring-1 ring-border-secondary transition duration-100 ease-linear active:bg-secondary"
                    >
                        <ArrowLeft className="size-5" />
                    </button>
                    <h1 className="pt-4 text-xl font-bold text-primary">Transferir ingresso</h1>
                </div>

                <div className="px-5 pt-5 pb-8">
                    {/* Card do ingresso (compacto) */}
                    <div className="rounded-3xl bg-primary shadow-sm ring-1 ring-border-secondary">
                        <div className="p-5">
                            <p className="text-xs font-medium tracking-wide text-tertiary uppercase">ARENA BRASILEIRA 2026</p>
                            <div className="my-3 border-t border-tertiary" />
                            <p className="text-2xl leading-tight font-bold text-primary">ARENA | Brasil x Haiti | (19/06)</p>
                            <p className="mt-1.5 text-sm text-tertiary">Inteira</p>
                        </div>

                        <div className="relative py-1">
                            <div className="absolute top-1/2 -left-2.5 size-5 -translate-y-1/2 rounded-full bg-secondary" />
                            <div className="absolute top-1/2 -right-2.5 size-5 -translate-y-1/2 rounded-full bg-secondary" />
                            <div className="px-3">
                                <Zigzag />
                            </div>
                        </div>

                        <div className="p-5">
                            <p className="text-xs font-semibold text-tertiary">Sessão</p>
                            <p className="mt-1 text-sm font-bold text-primary">Sex, 19 jun • 15:00</p>
                        </div>
                    </div>

                    {/* Conector */}
                    <div className="flex justify-center py-3">
                        <span className="flex size-12 items-center justify-center rounded-full bg-primary text-fg-secondary ring-1 ring-border-secondary">
                            <ArrowDown className="size-5" />
                        </span>
                    </div>

                    {/* Busca por e-mail */}
                    <div className="rounded-2xl bg-primary p-5 ring-1 ring-border-secondary">
                        <p className="text-md font-bold text-primary">Busque por e-mail</p>
                        <div className="mt-3">
                            <Input
                                type="email"
                                placeholder="nome@exemplo.com"
                                value={email}
                                onChange={(v) => {
                                    setEmail(v);
                                    setSearched(false);
                                }}
                            />
                        </div>
                        <p className="mt-2 flex items-start gap-1.5 text-sm text-tertiary">
                            <img src={alertAmareloIcon} alt="" aria-hidden="true" className="mt-0.5 size-9 shrink-0 object-contain" />
                            <span>
                                Informe o e-mail de quem vai receber o ingresso. Após a transferência, o ingresso passa a ser do destinatário e{" "}
                                <span className="font-semibold text-secondary">a ação não pode ser desfeita.</span>
                            </span>
                        </p>

                        <Button
                            size="lg"
                            color="primary"
                            className="mt-4 w-full rounded-full"
                            isDisabled={email.trim() === ""}
                            onClick={() => setSearched(true)}
                        >
                            Buscar destinatário
                        </Button>
                    </div>

                    {/* Resultados da busca */}
                    {searched && (
                        <div className="mt-4 rounded-2xl bg-primary p-5 ring-1 ring-border-secondary">
                            <p className="text-md font-bold text-primary">Resultados da busca</p>
                            <p className="mt-1 text-sm text-tertiary">Escolha o destinatário correto antes de confirmar a transferência.</p>

                            <div className="my-4 border-t border-tertiary" />

                            <button
                                type="button"
                                onClick={() => setConfirming(true)}
                                className="flex w-full items-center gap-3 text-left transition duration-100 ease-linear active:opacity-70"
                            >
                                <Avatar size="md" alt={DESTINATARIO} />
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-bold text-primary">{DESTINATARIO}</p>
                                    <p className="truncate text-sm text-tertiary">{maskEmail(email)}</p>
                                </div>
                                <ChevronRight className="size-5 shrink-0 text-fg-quaternary" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom sheet: confirmar transferência */}
            <BottomSheet isOpen={confirming} onClose={() => setConfirming(false)}>
                <div className="flex items-start justify-between gap-3">
                    <FeaturedIcon icon={Send01} color="gray" theme="modern" size="lg" />
                    <button
                        type="button"
                        aria-label="Fechar"
                        onClick={() => setConfirming(false)}
                        className="text-fg-quaternary transition duration-100 ease-linear active:text-fg-secondary"
                    >
                        <XClose className="size-6" />
                    </button>
                </div>

                <h2 className="mt-4 text-lg font-bold text-primary">Confirmar transferência</h2>
                <p className="mt-1 text-sm text-tertiary">
                    Confira se o destinatário e o e-mail estão corretos. Depois de confirmar,{" "}
                    <span className="font-semibold text-secondary">a transferência não poderá ser desfeita.</span>
                </p>

                <div className="mt-4 flex items-center gap-3 rounded-2xl bg-primary p-4 ring-1 ring-border-secondary">
                    <Avatar size="md" initials="DA" alt={DESTINATARIO} />
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-primary">{DESTINATARIO}</p>
                        <p className="truncate text-sm text-tertiary">{maskEmail(email)}</p>
                    </div>
                </div>

                <Button size="lg" color="primary" className="mt-5 w-full rounded-full" onClick={confirmarTransferencia}>
                    Confirmar transferência
                </Button>
                <Button size="lg" color="secondary" className="mt-3 w-full rounded-full" onClick={() => setConfirming(false)}>
                    Cancelar
                </Button>
            </BottomSheet>

            {/* Bottom sheet: transferência concluída */}
            <BottomSheet isOpen={done} onClose={concluir}>
                <div className="flex items-start gap-3">
                    <FeaturedIcon icon={CheckCircle} color="success" theme="modern" size="lg" />
                    <div className="min-w-0 flex-1">
                        <h2 className="text-lg font-bold text-primary">Transferência concluída</h2>
                        <p className="mt-1 text-sm text-tertiary">O ingresso foi enviado com sucesso para o destinatário selecionado.</p>
                    </div>
                    <button
                        type="button"
                        aria-label="Fechar"
                        onClick={concluir}
                        className="text-fg-quaternary transition duration-100 ease-linear active:text-fg-secondary"
                    >
                        <XClose className="size-6" />
                    </button>
                </div>

                <div className="mt-4 flex items-center gap-3 rounded-2xl bg-primary p-4 ring-1 ring-border-secondary">
                    <Avatar size="md" initials="DA" alt={DESTINATARIO} />
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-primary">{DESTINATARIO}</p>
                        <p className="truncate text-sm text-tertiary">{maskEmail(email)}</p>
                    </div>
                </div>

                <Button size="lg" color="primary" className="mt-5 w-full rounded-full" onClick={concluir}>
                    Concluir
                </Button>
            </BottomSheet>
        </AppShell>
    );
}
