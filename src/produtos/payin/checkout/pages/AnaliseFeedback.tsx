import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, CheckCircle } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { useTheme } from "@/providers/theme-provider";
import { cx } from "@/utils/cx";
import { PERGUNTAS, salvarResposta } from "../data/feedback-store";

const RASCUNHO_KEY = "checkout-feedback:rascunho";

function lerRascunho(): string[] {
    try {
        const raw = localStorage.getItem(RASCUNHO_KEY);
        const arr = raw ? JSON.parse(raw) : null;
        if (Array.isArray(arr) && arr.length === PERGUNTAS.length) return arr.map((x) => (typeof x === "string" ? x : ""));
    } catch {
        /* ignore */
    }
    return PERGUNTAS.map(() => "");
}

export function AnaliseFeedback() {
    const navigate = useNavigate();
    const { theme, setTheme } = useTheme();
    const temaAnterior = useRef(theme);
    useEffect(() => {
        setTheme("light");
        return () => setTheme(temaAnterior.current);
    }, [setTheme]);

    const [respostas, setRespostas] = useState<string[]>(lerRascunho);
    const [enviando, setEnviando] = useState(false);
    const [enviado, setEnviado] = useState(false);

    // Guarda o rascunho a cada alteração pra o usuário poder continuar depois.
    useEffect(() => {
        if (enviado) return;
        try {
            localStorage.setItem(RASCUNHO_KEY, JSON.stringify(respostas));
        } catch {
            /* ignore */
        }
    }, [respostas, enviado]);

    const alterar = (i: number, v: string) => setRespostas((r) => r.map((x, idx) => (idx === i ? v : x)));

    const enviar = async () => {
        setEnviando(true);
        await salvarResposta(respostas);
        setEnviando(false);
        setEnviado(true);
        try {
            localStorage.removeItem(RASCUNHO_KEY);
        } catch {
            /* ignore */
        }
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <div className="min-h-screen bg-secondary text-primary">
            <div className="mx-auto w-full max-w-2xl px-6 pt-6 pb-16">
                {enviado ? (
                    <div className="mt-16 flex flex-col items-center rounded-2xl bg-primary p-10 text-center shadow-sm ring-1 ring-border-secondary">
                        <FeaturedIcon icon={CheckCircle} color="success" theme="light" size="xl" />
                        <h1 className="mt-5 text-xl font-bold text-primary">Respostas enviadas!</h1>
                        <p className="mt-2 text-sm text-tertiary">Obrigada por tudo miguxinhus &lt;3</p>
                    </div>
                ) : (
                    <>
                        <button
                            type="button"
                            onClick={() => navigate("/payin/checkout")}
                            className="flex items-center gap-1.5 text-sm font-semibold text-secondary transition duration-100 ease-linear hover:text-primary"
                        >
                            <ArrowLeft className="size-4" />
                            Voltar
                        </button>

                        <h1 className="mt-5 text-2xl font-bold text-primary">Sobre o protótipo</h1>
                        <p className="mt-1.5 text-sm text-tertiary">
                            Responda com o que vier à cabeça — não há certo ou errado. Queremos entender como você percebe essa tela de pagamento.
                        </p>

                        <form
                            className="mt-8 flex flex-col gap-6"
                            onSubmit={(e) => {
                                e.preventDefault();
                                void enviar();
                            }}
                        >
                            {PERGUNTAS.map((q, i) => (
                                <div key={i}>
                                    <label className="block text-sm font-semibold text-secondary">
                                        {i + 1}. {q.texto}
                                    </label>
                                    {q.tipo === "escala" ? (
                                        <div className="mt-3 flex flex-wrap justify-center gap-2">
                                            {Array.from({ length: 11 }, (_, n) => {
                                                const selecionado = respostas[i] === String(n);
                                                return (
                                                    <button
                                                        key={n}
                                                        type="button"
                                                        aria-pressed={selecionado}
                                                        onClick={() => alterar(i, String(n))}
                                                        className={cx(
                                                            "flex size-9 items-center justify-center rounded-full text-sm font-semibold transition duration-100 ease-linear",
                                                            selecionado
                                                                ? "bg-brand-solid text-white ring-2 ring-brand"
                                                                : "bg-primary text-secondary ring-1 ring-border-primary hover:ring-border-brand",
                                                        )}
                                                    >
                                                        {n}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <textarea
                                            rows={3}
                                            value={respostas[i]}
                                            onChange={(e) => alterar(i, e.target.value)}
                                            placeholder="Escreva sua resposta…"
                                            className="mt-2 w-full resize-y rounded-xl bg-primary px-4 py-3 text-sm text-primary ring-1 ring-border-primary outline-none transition duration-100 placeholder:text-placeholder focus:ring-2 focus:ring-brand"
                                        />
                                    )}
                                </div>
                            ))}

                            <Button type="submit" size="lg" color="primary" className="mt-2 w-full" isLoading={enviando} showTextWhileLoading>
                                Enviar respostas
                            </Button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}
