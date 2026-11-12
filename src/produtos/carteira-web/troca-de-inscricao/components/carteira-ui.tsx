import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, ChevronDown, Settings02 } from "@untitledui/icons";
import { toast } from "sonner";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Select } from "@/components/base/select/select";
import { cx } from "@/utils/cx";
import { USUARIOS, pessoa, reiniciar, setUsuario, simularPeriodo, periodo, usuario, useTroca } from "../data/troca-store";

/** Logo da carteira como está em produção (Ticket Sports by Ingresse). */
export function LogoTs({ claro }: { claro?: boolean }) {
    return (
        <span className={cx("inline-flex items-center gap-1.5", claro ? "text-white" : "text-primary")}>
            <svg viewBox="0 0 28 20" width="26" height="19" aria-hidden="true">
                <path d="M2 14 C7 3 17 1 26 2 C19 5 15 9 13 18 L9 18 C10 13 12 10 15 7 C10 8 6 11 4 15 Z" fill="currentColor" />
            </svg>
            <span className="leading-none">
                <span className="block text-sm tracking-wide">
                    TICKET<b className="font-extrabold">SPORTS</b>
                </span>
                <span className="block pl-3.5 text-[8px]">
                    By <b className="font-extrabold">INGRESSE</b>
                </span>
            </span>
        </span>
    );
}

const Bandeira = () => (
    <span
        aria-hidden="true"
        className="ml-2 inline-block size-4 rounded-full"
        style={{ background: "radial-gradient(circle,#2563eb 30%,#facc15 32%,#facc15 55%,#16a34a 57%)" }}
    />
);

/** Topo da carteira (lista de inscrições). */
export function TopoCarteira() {
    useTroca();
    return (
        <div className="flex items-center justify-between border-b border-secondary bg-primary px-3 py-3.5">
            <LogoTs />
            <span className="inline-flex items-center gap-1 text-xs text-primary">
                {pessoa(usuario()).email.split("@")[0]}
                <ChevronDown className="size-3.5" aria-hidden="true" />
                <Bandeira />
            </span>
        </div>
    );
}

/** Topo das telas de compra (Trocar ingresso, Finalizar pedido), com a faixa do evento. */
export function TopoCompra() {
    useTroca();
    return (
        <div className="flex items-center justify-between px-6 py-5 md:px-10" style={{ background: "linear-gradient(90deg,#1e3a8a 0%,#334155 35%,#7c2d12 70%,#1e293b 100%)" }}>
            <LogoTs claro />
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-white">
                {pessoa(usuario()).nome.toUpperCase()}
                <ChevronDown className="size-4" aria-hidden="true" />
                <Bandeira />
            </span>
        </div>
    );
}

/** Barra com voltar e título, como em produção. */
export function BarraVoltar({ titulo, onVoltar, grande, extra }: { titulo: string; onVoltar: () => void; grande?: boolean; extra?: React.ReactNode }) {
    return (
        <div className={cx("flex items-center gap-3 bg-primary", grande ? "gap-5 border-b border-secondary px-6 py-5 text-xl md:px-12" : "px-3 py-3.5 text-sm")}>
            <button type="button" aria-label="Voltar" onClick={onVoltar} className="rounded-md p-1 text-primary outline-focus-ring hover:bg-primary_hover focus-visible:outline-2">
                <ArrowLeft className="size-5" aria-hidden="true" />
            </button>
            <b className="flex-1 font-semibold text-primary">{titulo}</b>
            {extra}
        </div>
    );
}

const PERIODOS = [
    { id: "aberto", label: "Trocas abertas" },
    { id: "antes", label: "Trocas ainda não abriram" },
    { id: "depois", label: "Período de trocas terminou" },
    { id: "off", label: "Trocas desligadas no evento" },
];

/** Controles do protótipo da carteira: usuário logado, período e atalhos. */
export function ControlesCarteira({ extras }: { extras?: React.ReactNode }) {
    const S = useTroca();
    const navigate = useNavigate();
    const [aberto, setAberto] = useState(false);
    const pr = periodo();
    return (
        <div className="fixed bottom-4 left-4 z-50 flex flex-col items-start gap-2">
            {aberto && (
                <div className="flex w-72 animate-in flex-col gap-4 rounded-xl bg-primary p-4 shadow-lg ring-1 ring-border-secondary duration-150 fade-in slide-in-from-bottom-1">
                    <p className="text-sm font-semibold text-primary">Controles do protótipo</p>
                    <Select label="Logado como" size="sm" selectedKey={usuario()} onSelectionChange={(k) => setUsuario(String(k))} items={Object.entries(USUARIOS).map(([id, label]) => ({ id, label }))}>
                        {(i) => <Select.Item id={i.id}>{i.label}</Select.Item>}
                    </Select>
                    <Select
                        label="Período de trocas"
                        size="sm"
                        selectedKey={S.permitir ? (pr.st === "off" ? "off" : pr.st) : "off"}
                        onSelectionChange={(k) => simularPeriodo(k as "off" | "aberto" | "antes" | "depois")}
                        items={PERIODOS}
                    >
                        {(i) => <Select.Item id={i.id}>{i.label}</Select.Item>}
                    </Select>
                    {extras}
                    <Button size="sm" color="secondary" onClick={() => navigate("/backstage/pedidos")}>
                        Ir para o Backstage
                    </Button>
                    <Button
                        size="sm"
                        color="secondary"
                        onClick={() => {
                            reiniciar();
                            toast.success("Protótipo reiniciado");
                            navigate("/carteira-web/inscricoes");
                        }}
                    >
                        Reiniciar dados
                    </Button>
                </div>
            )}
            <ButtonUtility size="sm" color="secondary" icon={Settings02} tooltip={aberto ? "Fechar controles do protótipo" : "Controles do protótipo"} onClick={() => setAberto((a) => !a)} className="shadow-lg" />
        </div>
    );
}
