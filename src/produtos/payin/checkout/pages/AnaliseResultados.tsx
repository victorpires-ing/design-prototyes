import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, RefreshCw02, Ticket01, Users01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { useTheme } from "@/providers/theme-provider";
import { PERGUNTAS, listarRespostas, type RespostaFeedback } from "../data/feedback-store";

const fmtData = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

export function AnaliseResultados() {
    const navigate = useNavigate();
    const { theme, setTheme } = useTheme();
    const temaAnterior = useRef(theme);
    useEffect(() => {
        setTheme("light");
        return () => setTheme(temaAnterior.current);
    }, [setTheme]);

    const [respostas, setRespostas] = useState<RespostaFeedback[] | null>(null);

    const carregar = () => {
        setRespostas(null);
        listarRespostas().then((r) => setRespostas([...r].sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))));
    };
    useEffect(carregar, []);

    return (
        <div className="min-h-screen bg-secondary text-primary">
            <header className="bg-black">
                <div className="mx-auto flex h-14 w-full max-w-4xl items-center justify-center px-6">
                    <span className="flex items-center gap-1.5 font-bold tracking-wide text-white">
                        <Ticket01 className="size-5" />
                        INGRESSE
                    </span>
                </div>
            </header>

            <div className="mx-auto w-full max-w-4xl px-6 pt-6 pb-16">
                <button
                    type="button"
                    onClick={() => navigate("/payin/checkout")}
                    className="flex items-center gap-1.5 text-sm font-semibold text-secondary transition duration-100 ease-linear hover:text-primary"
                >
                    <ArrowLeft className="size-4" />
                    Checkout
                </button>

                <div className="mt-5 flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-primary">Respostas — teste do checkout Pix</h1>
                        <p className="mt-1.5 text-sm text-tertiary">
                            {respostas === null
                                ? "Carregando…"
                                : `${respostas.length} ${respostas.length === 1 ? "resposta recebida" : "respostas recebidas"}`}
                        </p>
                    </div>
                    <Button size="md" color="secondary" iconLeading={RefreshCw02} onClick={carregar}>
                        Atualizar
                    </Button>
                </div>

                {respostas !== null && respostas.length === 0 && (
                    <div className="mt-10 flex flex-col items-center rounded-2xl border border-dashed border-secondary bg-primary px-6 py-14 text-center">
                        <span className="flex size-12 items-center justify-center rounded-xl bg-secondary text-fg-quaternary">
                            <Users01 className="size-6" />
                        </span>
                        <p className="mt-4 text-md font-semibold text-primary">Nenhuma resposta ainda</p>
                        <p className="mt-1 text-sm text-tertiary">Assim que os participantes enviarem o formulário, as respostas aparecem aqui.</p>
                    </div>
                )}

                {respostas && respostas.length > 0 && (
                    <div className="mt-8 flex flex-col gap-5">
                        {respostas.map((r, idx) => (
                            <div key={r.id} className="rounded-2xl bg-primary p-5 shadow-sm ring-1 ring-border-secondary">
                                <div className="flex items-center justify-between gap-3 border-b border-secondary pb-3">
                                    <p className="text-md font-bold text-primary">Participante #{respostas.length - idx}</p>
                                    <p className="text-xs text-tertiary tabular-nums">{fmtData(r.criadoEm)}</p>
                                </div>
                                <dl className="mt-3 flex flex-col gap-3">
                                    {PERGUNTAS.map((q, i) => (
                                        <div key={i}>
                                            <dt className="text-sm font-semibold text-secondary">
                                                {i + 1}. {q.texto}
                                            </dt>
                                            {q.tipo === "escala" ? (
                                                <dd className="mt-1">
                                                    {r.respostas[i]?.trim() ? (
                                                        <span className="inline-flex items-center rounded-full bg-brand-primary px-2.5 py-0.5 text-sm font-bold text-brand-primary">
                                                            {r.respostas[i]} / 10
                                                        </span>
                                                    ) : (
                                                        <span className="text-sm text-tertiary">—</span>
                                                    )}
                                                </dd>
                                            ) : (
                                                <dd className="mt-0.5 text-sm whitespace-pre-wrap text-tertiary">
                                                    {r.respostas[i]?.trim() ? r.respostas[i] : "—"}
                                                </dd>
                                            )}
                                        </div>
                                    ))}
                                </dl>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
