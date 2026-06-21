import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { AlertCircle, ArrowDown, ArrowLeft, CheckCircle, ChevronRight, Monitor01, Phone01, Send01 } from "@untitledui/icons";
import { Avatar } from "@/components/base/avatar/avatar";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { cx } from "@/utils/cx";
import { SAO_SILVESTRE } from "../data/sao-silvestre";
import { marcarTransferido } from "../data/transfer-store";

type Viewport = "desktop" | "mobile";

/** Destinatário fictício retornado pela busca por e-mail. */
const DESTINATARIO = "Mariana Costa Lima";

const maskEmail = (e: string) => {
    const [local, domain] = e.split("@");
    if (!domain || local.length < 4) return e;
    return `${local.slice(0, 1)}*****${local.slice(-3)}@${domain}`;
};

const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const agoraFormatado = () => {
    const d = new Date();
    return `${d.getDate()} de ${MESES[d.getMonth()]} • ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

export function TransferirInscricao() {
    const navigate = useNavigate();
    const location = useLocation();
    const st = (location.state as { viewport?: Viewport; comboId?: string } | null) ?? {};
    const [viewport, setViewport] = useState<Viewport>(st.viewport ?? "desktop");

    const ev = SAO_SILVESTRE;
    const combo = ev.combos.find((c) => c.id === st.comboId) ?? ev.combos[0];

    const [email, setEmail] = useState("");
    const [searched, setSearched] = useState(false);
    const [step, setStep] = useState<"buscar" | "formulario" | "confirmar" | "concluido">("buscar");
    const [respostas, setRespostas] = useState<Record<string, string>>({});
    const formOk = ev.questionario.every((q) => (respostas[q.pergunta] ?? "").trim() !== "");

    // Ao buscar, rola suavemente até o resultado (feedback de que algo aconteceu).
    const resultRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (searched) resultRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, [searched]);

    const voltar = () => navigate("/carteira-web");
    const seg = "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold transition duration-100 ease-linear";

    const resumo = (
        <div className="rounded-2xl bg-primary p-5 ring-1 ring-border-secondary">
            <p className="text-xs font-medium tracking-wide text-tertiary uppercase">{ev.title}</p>
            <div className="my-3 border-t border-tertiary" />
            <p className="text-xl leading-tight font-bold text-primary">{combo.nome}</p>
            <p className="mt-1.5 text-sm text-tertiary">Data do evento: {combo.dataEvento}</p>
        </div>
    );

    const destinatarioCard = (
        <div className="flex items-center gap-3 rounded-2xl bg-primary p-4 ring-1 ring-border-secondary">
            <Avatar size="md" initials="MC" alt={DESTINATARIO} />
            <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-primary">{DESTINATARIO}</p>
                <p className="truncate text-sm text-tertiary">{maskEmail(email)}</p>
            </div>
        </div>
    );

    return (
        <div className={cx("min-h-screen", viewport === "mobile" ? "bg-secondary" : "bg-primary")}>
            {/* Barra de controle do protótipo */}
            <div className="fixed inset-x-0 top-0 z-30 flex items-center justify-between gap-3 border-b border-secondary bg-primary/90 px-4 py-2.5 backdrop-blur">
                <button
                    type="button"
                    onClick={voltar}
                    className="flex items-center gap-1.5 text-sm font-medium text-tertiary transition hover:text-secondary"
                >
                    <ArrowLeft className="size-4" />
                    Carteira
                </button>

                <div className="flex items-center gap-1 rounded-lg bg-secondary p-1 ring-1 ring-border-secondary">
                    <button type="button" onClick={() => setViewport("desktop")} className={cx(seg, viewport === "desktop" ? "bg-primary text-primary shadow-sm" : "text-tertiary")}>
                        <Monitor01 className="size-4" /> Desktop
                    </button>
                    <button type="button" onClick={() => setViewport("mobile")} className={cx(seg, viewport === "mobile" ? "bg-primary text-primary shadow-sm" : "text-tertiary")}>
                        <Phone01 className="size-4" /> Mobile
                    </button>
                </div>

                <span className="hidden w-[120px] text-right text-xs text-tertiary sm:inline">{viewport === "mobile" ? "390px" : "Full width"}</span>
            </div>

            {/* Área de preview */}
            <div className={cx(viewport === "mobile" ? "pt-16 pb-10 sm:px-4" : "pt-14")}>
                <div
                    className={cx(
                        "mx-auto bg-secondary",
                        viewport === "mobile"
                            ? "min-h-[calc(100vh-6.5rem)] w-full sm:w-[390px] sm:max-w-full sm:overflow-hidden sm:rounded-3xl sm:shadow-xl sm:ring-1 sm:ring-border-secondary"
                            : "min-h-[calc(100vh-3.5rem)] w-full",
                    )}
                >
                    {/* Cabeçalho da tela */}
                    <div className="flex items-center gap-2 border-b border-secondary bg-primary px-5 py-3.5">
                        {step !== "concluido" && (
                            <button
                                type="button"
                                aria-label="Voltar"
                                onClick={() => {
                                    if (step === "confirmar") setStep("formulario");
                                    else if (step === "formulario") setStep("buscar");
                                    else voltar();
                                }}
                                className="flex size-9 items-center justify-center rounded-lg text-fg-quaternary transition duration-100 ease-linear hover:bg-secondary"
                            >
                                <ArrowLeft className="size-5" />
                            </button>
                        )}
                        <h1 className="flex-1 text-base font-bold text-primary">Transferir inscrição</h1>
                    </div>

                    {/* Conteúdo do fluxo */}
                    <div className="mx-auto max-w-md px-5 py-6 sm:px-6">
                        {step === "concluido" ? (
                            <div className="flex flex-col gap-5">
                                <div className="flex items-start gap-3 rounded-2xl bg-primary p-5 ring-1 ring-border-secondary">
                                    <FeaturedIcon icon={CheckCircle} color="success" theme="light" size="lg" />
                                    <div className="min-w-0 flex-1">
                                        <h2 className="text-md font-bold text-primary">Transferência concluída</h2>
                                        <p className="mt-1 text-sm text-tertiary">A inscrição foi enviada com sucesso para o destinatário selecionado.</p>
                                    </div>
                                </div>
                                {destinatarioCard}
                                <Button size="lg" color="primary" className="w-full rounded-lg" onClick={voltar}>
                                    Concluir
                                </Button>
                            </div>
                        ) : step === "confirmar" ? (
                            <div className="flex flex-col gap-5">
                                {resumo}
                                <div className="rounded-2xl bg-primary p-5 ring-1 ring-border-secondary">
                                    <FeaturedIcon icon={Send01} color="gray" theme="modern" size="lg" />
                                    <h2 className="mt-4 text-md font-bold text-primary">Confirmar transferência</h2>
                                    <p className="mt-1 text-sm text-tertiary">
                                        Confira se o destinatário e o e-mail estão corretos. Depois de confirmar,{" "}
                                        <span className="font-semibold text-secondary">a transferência não poderá ser desfeita.</span>
                                    </p>
                                    <div className="mt-4">{destinatarioCard}</div>

                                    {/* Recap das respostas do formulário */}
                                    <div className="mt-4 divide-y divide-border-secondary overflow-hidden rounded-xl ring-1 ring-border-secondary">
                                        {ev.questionario.map((q) => (
                                            <div key={q.pergunta} className="p-3">
                                                <p className="text-xs text-tertiary">{q.pergunta}</p>
                                                <p className="mt-0.5 text-sm font-semibold text-primary">{respostas[q.pergunta]}</p>
                                            </div>
                                        ))}
                                    </div>

                                    <Button
                                        size="lg"
                                        color="primary"
                                        className="mt-5 w-full rounded-lg"
                                        onClick={() => {
                                            marcarTransferido(combo.id, {
                                                destinatario: DESTINATARIO,
                                                email: maskEmail(email),
                                                respostas: ev.questionario.map((q) => ({ pergunta: q.pergunta, resposta: respostas[q.pergunta] })),
                                                data: agoraFormatado(),
                                            });
                                            setStep("concluido");
                                        }}
                                    >
                                        Confirmar transferência
                                    </Button>
                                    <Button size="lg" color="secondary" className="mt-3 w-full rounded-lg" onClick={() => setStep("formulario")}>
                                        Cancelar
                                    </Button>
                                </div>
                            </div>
                        ) : step === "formulario" ? (
                            <div className="flex flex-col gap-5">
                                {/* Para quem está transferindo */}
                                <div className="flex items-center gap-3 rounded-2xl bg-primary p-4 ring-1 ring-border-secondary">
                                    <Avatar size="md" initials="MC" alt={DESTINATARIO} />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs text-tertiary">Transferindo para</p>
                                        <p className="text-sm font-bold text-primary">{DESTINATARIO}</p>
                                    </div>
                                </div>

                                <div className="rounded-2xl bg-primary p-5 ring-1 ring-border-secondary">
                                    <h2 className="text-md font-bold text-primary">Formulário do participante</h2>
                                    <p className="mt-1 text-sm text-tertiary">
                                        Para concluir, responda as mesmas perguntas da inscrição com os dados de {DESTINATARIO}.
                                    </p>
                                    <div className="mt-4 flex flex-col gap-4">
                                        {ev.questionario.map((q) => (
                                            <Input
                                                key={q.pergunta}
                                                isRequired
                                                label={q.pergunta}
                                                placeholder="Sua resposta"
                                                value={respostas[q.pergunta] ?? ""}
                                                onChange={(v) => setRespostas((r) => ({ ...r, [q.pergunta]: v }))}
                                            />
                                        ))}
                                    </div>
                                    <Button size="lg" color="primary" className="mt-5 w-full rounded-lg" isDisabled={!formOk} onClick={() => setStep("confirmar")}>
                                        Continuar
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col">
                                {resumo}

                                {/* Conector */}
                                <div className="flex justify-center py-3">
                                    <span className="flex size-12 items-center justify-center rounded-full bg-primary text-fg-secondary ring-1 ring-border-secondary">
                                        <ArrowDown className="size-5" />
                                    </span>
                                </div>

                                {/* Busca por e-mail */}
                                <div className="rounded-2xl bg-primary p-5 ring-1 ring-border-secondary">
                                    <p className="text-md font-bold text-primary">E-mail do destinatário</p>
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
                                    <p className="mt-2 flex items-start gap-2 text-sm text-tertiary">
                                        <AlertCircle className="mt-0.5 size-4 shrink-0 text-fg-warning-primary" />
                                        <span>Depois da transferência, a inscrição passa a ser do destinatário.</span>
                                    </p>
                                    <Button
                                        size="lg"
                                        color="primary"
                                        className="mt-4 w-full rounded-lg"
                                        isDisabled={email.trim() === ""}
                                        onClick={() => setSearched(true)}
                                    >
                                        Buscar destinatário
                                    </Button>
                                </div>

                                {/* Resultados da busca */}
                                {searched && (
                                    <div
                                        ref={resultRef}
                                        className="mt-4 scroll-mt-6 rounded-2xl bg-primary p-5 ring-1 ring-border-secondary duration-300 animate-in fade-in slide-in-from-bottom-3"
                                    >
                                        <p className="text-md font-bold text-primary">Resultados da busca</p>
                                        <p className="mt-1 text-sm text-tertiary">Escolha o destinatário correto antes de confirmar a transferência.</p>
                                        <div className="my-4 border-t border-tertiary" />
                                        <button
                                            type="button"
                                            onClick={() => setStep("formulario")}
                                            className="flex w-full items-center gap-3 text-left transition duration-100 ease-linear hover:opacity-70"
                                        >
                                            <Avatar size="md" initials="MC" alt={DESTINATARIO} />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-bold text-primary">{DESTINATARIO}</p>
                                                <p className="truncate text-sm text-tertiary">{maskEmail(email)}</p>
                                            </div>
                                            <ChevronRight className="size-5 shrink-0 text-fg-quaternary" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
