import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Progress } from "@/components/application/progress-steps/progress-steps";
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
        <div className={cx("flex items-center gap-3 bg-primary", grande ? "border-b border-secondary px-3 py-3 text-lg md:gap-5 md:px-12 md:py-5 md:text-xl" : "px-2 py-2 text-sm")}>
            <button type="button" aria-label="Voltar" onClick={onVoltar} className="grid size-11 shrink-0 place-items-center rounded-md text-primary outline-focus-ring hover:bg-primary_hover focus-visible:outline-2">
                <ArrowLeft className="size-5" aria-hidden="true" />
            </button>
            <b className="min-w-0 flex-1 truncate font-semibold text-primary" title={titulo}>
                {titulo}
            </b>
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
        <div className="fixed bottom-24 left-4 z-50 flex flex-col items-start gap-2 min-[1000px]:bottom-4">
            {aberto && (
                <div className="flex w-72 motion-safe:animate-in flex-col gap-4 rounded-xl bg-primary p-4 shadow-lg ring-1 ring-border-secondary duration-150 motion-safe:fade-in motion-safe:slide-in-from-bottom-1">
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
                    <Button size="sm" color="secondary" onClick={() => navigate("/backstage/troca-de-inscricao")}>
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

/** Preço sem centavos quando o valor é redondo (UI-TXT-002). */
export const brlc = (v = 0) => {
    const inteiro = Math.abs(v % 1) < 0.001;
    return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: inteiro ? 0 : 2, maximumFractionDigits: 2 });
};

const ETAPAS = ["Escolher a nova inscrição", "Responder as perguntas", "Pagamento"];

/** Onde a pessoa está no fluxo (UI-FRM-002): stepper no desktop, "Etapa 2 de 3" no celular. */
export function Etapas({ atual }: { atual: 1 | 2 | 3 }) {
    const items = ETAPAS.map((title, i) => ({
        title,
        description: "",
        status: (i + 1 < atual ? "complete" : i + 1 === atual ? "current" : "incomplete") as "complete" | "current" | "incomplete",
    }));
    return (
        <nav aria-label="Etapas da troca">
            <Progress.IconsWithText items={items} size="sm" type="number" orientation="horizontal" className="max-w-[640px] max-md:hidden" />
            <p className="text-sm font-semibold text-brand-secondary md:hidden">
                Etapa {atual} de 3: {ETAPAS[atual - 1]}
            </p>
        </nav>
    );
}

/** Conteúdo que abre e fecha animando a altura, sem pular a tela (UI-VIS-008); respeita reduced motion. */
export function Recolhivel({ aberto, children, className }: { aberto: boolean; children: ReactNode; className?: string }) {
    const reduzir = useReducedMotion();
    return (
        <AnimatePresence initial={false}>
            {aberto && (
                <motion.div
                    key="conteudo"
                    initial={reduzir ? { opacity: 0 } : { height: 0, opacity: 0 }}
                    animate={reduzir ? { opacity: 1 } : { height: "auto", opacity: 1 }}
                    exit={reduzir ? { opacity: 0 } : { height: 0, opacity: 0 }}
                    transition={{ duration: reduzir ? 0.01 : 0.2, ease: "easeOut" }}
                    className="overflow-hidden"
                >
                    <div className={className}>{children}</div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

/** Cada tela do fluxo abre no topo; sem isso, a rolagem da tela anterior é herdada. */
export function useTopoAoEntrar(chave?: string) {
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    }, [chave]);
}
