import { useState } from "react";
import { ArrowLeft, ChevronRight, Gift01 } from "@untitledui/icons";
import { useNavigate } from "react-router";
import { TicketSportsLayout } from "../../components/TicketSportsLayout";
import { Bloco } from "../components/Bloco";
import { Confetti } from "../components/Confetti";
import { GiftBox } from "../components/GiftBox";
import { PRESENTES, type Presente } from "../data/home";

export function Presentes() {
    const navigate = useNavigate();
    const [sel, setSel] = useState<Presente | null>(null);
    const [fase, setFase] = useState<"abrindo" | "aberto">("abrindo");
    const [festa, setFesta] = useState(false);
    const [abertos, setAbertos] = useState<Set<string>>(new Set());

    const abrir = (p: Presente) => {
        setSel(p);
        if (abertos.has(p.id)) {
            setFase("aberto");
            return;
        }
        setFase("abrindo");
        setFesta(false);
        window.setTimeout(() => {
            setFase("aberto");
            setAbertos((s) => new Set(s).add(p.id));
            setFesta(true);
            window.setTimeout(() => setFesta(false), 2400);
        }, 1000);
    };
    const fechar = () => {
        setSel(null);
        setFesta(false);
    };

    const aFazer = PRESENTES.filter((p) => !abertos.has(p.id)).length;

    return (
        <TicketSportsLayout>
            <div className="hub-rise flex flex-1 flex-col px-6 pt-8 pb-10">
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="flex w-max items-center gap-1.5 text-sm font-semibold text-[#7C3AED]"
                >
                    <ArrowLeft className="size-4" />
                    Voltar
                </button>
                <h1 className="mt-2 text-display-xs font-bold text-primary">Seus presentes</h1>
                <p className="mt-1 text-md text-tertiary">
                    {aFazer > 0 ? `Você tem ${aFazer} presente${aFazer > 1 ? "s" : ""} para abrir 🎁` : "Você abriu todos os seus presentes 🎉"}
                </p>

                <div className="mt-6">
                    <Bloco icon={Gift01} titulo="Seus presentes">
                        {PRESENTES.map((p) => {
                            const aberto = abertos.has(p.id);
                            return (
                                <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => abrir(p)}
                                    className="flex items-center gap-4 rounded-2xl border border-secondary bg-primary p-4 text-left transition duration-100 hover:bg-secondary"
                                >
                                    {aberto ? (
                                        <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-[#7C3AED]/10 text-3xl">{p.emoji}</span>
                                    ) : (
                                        <GiftBox className="size-14 shrink-0" />
                                    )}
                                    <div className="flex min-w-0 flex-1 flex-col">
                                        <span className="truncate text-sm font-bold text-primary">{aberto ? p.titulo : "Presente surpresa"}</span>
                                        <span className="truncate text-xs text-tertiary">{aberto ? "Aberto" : "Toque para abrir"} · de {p.remetente}</span>
                                    </div>
                                    <ChevronRight className="size-5 shrink-0 text-fg-quaternary" />
                                </button>
                            );
                        })}
                    </Bloco>
                </div>
            </div>

            {/* Abertura do presente */}
            {sel && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-6" onClick={fechar}>
                    <div className="w-full max-w-xs rounded-3xl bg-primary p-6 text-center shadow-xl" onClick={(e) => e.stopPropagation()}>
                        {fase === "abrindo" ? (
                            <div className="flex flex-col items-center gap-4 py-4">
                                <GiftBox className="size-40" animar />
                                <span className="text-sm font-semibold text-tertiary">Abrindo seu presente…</span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-3 duration-500 animate-in fade-in zoom-in-75">
                                <span className="flex size-24 items-center justify-center rounded-3xl bg-gradient-to-br from-[#7C3AED]/15 to-[#D946EF]/15 text-5xl">
                                    {sel.emoji}
                                </span>
                                <span className="rounded-full bg-[#7C3AED]/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-[#7C3AED]">
                                    Presente de {sel.remetente}
                                </span>
                                <h3 className="text-xl font-bold text-primary">{sel.titulo}</h3>
                                <p className="text-sm text-secondary">{sel.descricao}</p>
                                {sel.codigo && (
                                    <div className="w-full rounded-xl border border-dashed border-[#7C3AED]/40 bg-[#7C3AED]/5 py-2.5">
                                        <span className="text-base font-black tracking-widest text-[#7C3AED]">{sel.codigo}</span>
                                    </div>
                                )}
                                <button
                                    type="button"
                                    onClick={fechar}
                                    className="mt-1 w-full rounded-lg bg-[#7C3AED] py-3 text-sm font-semibold text-white transition hover:bg-[#6D28D9]"
                                >
                                    {sel.cta}
                                </button>
                                <button type="button" onClick={fechar} className="text-sm font-medium text-tertiary">
                                    Fechar
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
            {festa && <Confetti />}
        </TicketSportsLayout>
    );
}
