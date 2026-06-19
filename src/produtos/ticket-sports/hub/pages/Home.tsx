import { useEffect, useState } from "react";
import type { ComponentType, ReactNode } from "react";
import { Activity, Bell01, Calendar, Check, ChevronRight, Compass03, Heart, MarkerPin01, TrendUp02, Trophy01, Users01 } from "@untitledui/icons";
import { useNavigate } from "react-router";
import { cx } from "@/utils/cx";
import { TicketSportsLayout } from "../../components/TicketSportsLayout";
import { Confetti } from "../components/Confetti";
import { GiftBox } from "../components/GiftBox";
import { HubTabBar } from "../components/HubTabBar";
import { HubIconButton } from "../components/hub-ui";
import { FEED } from "../data/comunidade";
import { EVENTOS } from "../data/eventos";
import { RESUMO } from "../data/desempenho";
import { CHECKINS_AOVIVO, CHECKINS_TOTAL, COMPROMISSOS, CONCLUIRAM_MES, GRUPOS, HISTORIAS, PRESENTES, STATS, USUARIO } from "../data/home";
import { USUARIOS } from "../data/usuarios";

const fotoDe = (nome: string) => USUARIOS.find((u) => u.nome === nome)?.foto;
const STORIES = HISTORIAS.map((h) => ({ id: h.id, nome: h.nome.split(" ")[0], foto: fotoDe(h.nome) }));
const SEMANA: { d: string; s: "done" | "planned" | "none" }[] = [
    { d: "D", s: "none" },
    { d: "S", s: "done" },
    { d: "T", s: "planned" },
    { d: "Q", s: "done" },
    { d: "Q", s: "none" },
    { d: "S", s: "done" },
    { d: "S", s: "none" },
];

/** Bloco temático: painel com cabeçalho (ícone + título) agrupando itens relacionados. */
const Bloco = ({
    icon: Icon,
    titulo,
    onVer,
    verLabel = "Ver tudo",
    children,
}: {
    icon: ComponentType<{ className?: string }>;
    titulo: string;
    onVer?: () => void;
    verLabel?: string;
    children: ReactNode;
}) => (
    <section className="flex flex-col gap-4 rounded-3xl bg-secondary p-4">
        <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-xl bg-[#7C3AED] text-white">
                    <Icon className="size-4" />
                </span>
                <h2 className="text-base font-bold text-primary">{titulo}</h2>
            </div>
            {onVer && (
                <button type="button" onClick={onVer} className="text-sm font-medium text-[#7C3AED]">
                    {verLabel}
                </button>
            )}
        </div>
        {children}
    </section>
);

const SubHeader = ({ titulo, onVer }: { titulo: string; onVer?: () => void }) => (
    <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wide text-tertiary">{titulo}</span>
        {onVer && (
            <button type="button" onClick={onVer} className="text-xs font-semibold text-[#7C3AED]">
                Ver
            </button>
        )}
    </div>
);

export function Home() {
    const navigate = useNavigate();
    const [i, setI] = useState(0);
    const [checkin, setCheckin] = useState(false);
    const [festa, setFesta] = useState(false);
    const [celebrados, setCelebrados] = useState<Set<string>>(new Set());
    const celebrar = (id: string) => {
        setCelebrados((s) => new Set(s).add(id));
        setFesta(false);
        // reinicia a animação caso já esteja ativa
        requestAnimationFrame(() => setFesta(true));
        window.setTimeout(() => setFesta(false), 2400);
    };
    useEffect(() => {
        const id = setInterval(() => setI((v) => (v + 1) % CHECKINS_AOVIVO.length), 2600);
        return () => clearInterval(id);
    }, []);
    const live = CHECKINS_AOVIVO[i];
    const hoje = COMPROMISSOS.find((c) => c.hoje) ?? COMPROMISSOS[0];
    const desafio = EVENTOS.find((e) => e.recomendado) ?? EVENTOS[0];
    const pct = RESUMO.semanaFeitos / RESUMO.semanaMeta;
    const prontoParaEvento = RESUMO.taxaConclusao >= 70;
    const r = 34;
    const circ = 2 * Math.PI * r;
    const hora = new Date().getHours();
    const saudacao = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";

    return (
        <TicketSportsLayout fullHeight>
            <header className="flex items-center justify-between gap-3 border-b border-secondary bg-primary px-5 py-3.5 md:rounded-t-3xl">
                <div className="flex flex-col">
                    <span className="text-lg font-bold leading-tight text-primary">
                        <span className="font-normal text-tertiary">{saudacao}, </span>
                        {USUARIO.nome}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    {PRESENTES.length > 0 && (
                        <button type="button" onClick={() => navigate("/ticket-sports/hub/presentes")} aria-label="Seus presentes" className="relative">
                            <GiftBox className="size-10" />
                            <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-[#F59E0B] text-[11px] font-bold text-white ring-2 ring-primary">
                                {PRESENTES.length}
                            </span>
                        </button>
                    )}
                    <HubIconButton icon={Bell01} label="Notificações" dot onClick={() => navigate("/ticket-sports/hub/notificacoes")} />
                    <button type="button" onClick={() => navigate("/ticket-sports/hub/perfil")} aria-label="Perfil">
                        <img src={USUARIO.foto} alt="" className="size-10 rounded-full object-cover" />
                    </button>
                </div>
            </header>

            <main className="hub-rise flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 py-5 pb-28 [&>*]:shrink-0">
                {/* Stories / feed */}
                <div className="-mx-5 flex gap-4 overflow-x-auto px-5 py-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <button type="button" onClick={() => navigate("/ticket-sports/hub/feed/novo")} className="flex w-14 shrink-0 flex-col items-center gap-1.5">
                        <span className="relative size-14">
                            <img src={USUARIO.foto} alt="" className="size-14 rounded-full object-cover" />
                            <span className="absolute -bottom-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full bg-[#7C3AED] text-[13px] font-bold text-white ring-2 ring-primary">
                                +
                            </span>
                        </span>
                        <span className="text-[11px] text-tertiary">Você</span>
                    </button>
                    {STORIES.map((s) => (
                        <button key={s.id} type="button" onClick={() => navigate(`/ticket-sports/hub/feed/story/${s.id}`)} className="flex w-14 shrink-0 flex-col items-center gap-1.5">
                            <span className="rounded-full p-[2px] ring-2 ring-[#7C3AED]">
                                <img src={s.foto} alt="" className="size-12 rounded-full object-cover" />
                            </span>
                            <span className="w-full truncate text-center text-[11px] text-secondary">{s.nome}</span>
                        </button>
                    ))}
                </div>

                {/* Chamada: descobrir esporte ideal (nova funcionalidade) */}
                <button
                    type="button"
                    onClick={() => navigate("/ticket-sports/hub/plano")}
                    className="relative flex items-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-br from-[#7C3AED] via-[#9333EA] to-[#D946EF] p-4 text-left text-white shadow-lg"
                >
                    <style>{`@keyframes planoShine{0%{transform:translateX(-160%) skewX(-12deg)}60%,100%{transform:translateX(420%) skewX(-12deg)}}@media (prefers-reduced-motion:reduce){[style*="planoShine"]{animation:none}}`}</style>
                    <span className="pointer-events-none absolute inset-0 z-10 overflow-hidden rounded-2xl">
                        <span className="absolute inset-y-0 left-0 w-1/4 bg-white/25 blur-md" style={{ animation: "planoShine 3.4s ease-in-out infinite" }} />
                    </span>
                    <span className="pointer-events-none absolute -right-6 -top-6 size-24 rounded-full bg-white/10" />
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-2xl backdrop-blur-md">✨</span>
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="flex w-max items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide backdrop-blur-md">
                            Novo
                        </span>
                        <span className="text-md font-bold leading-tight">Descubra seu esporte ideal</span>
                        <span className="text-sm text-white/85">Quiz rápido pra montar sua rotina e alimentação.</span>
                    </div>
                    <ChevronRight className="size-5 shrink-0" />
                </button>

                {/* BLOCO: Sua rotina (meta + esta semana + próximo treino) */}
                <style>{`@keyframes checkinBreath{0%,100%{box-shadow:0 0 0 0 rgba(124,58,237,0);border-color:rgba(124,58,237,0.25)}50%{box-shadow:0 0 16px 1px rgba(124,58,237,0.22);border-color:rgba(124,58,237,0.6)}}`}</style>
                <Bloco icon={Activity} titulo="Sua rotina" onVer={() => navigate("/ticket-sports/hub/rotina/desempenho")}>
                    {/* Meta + Esta semana — conectados num card */}
                    <div className="flex flex-col gap-4 rounded-2xl border border-secondary bg-primary p-4">
                        <button type="button" onClick={() => navigate("/ticket-sports/hub/rotina/desempenho")} className="flex items-center gap-4 text-left">
                            <div className="relative shrink-0">
                                <svg viewBox="0 0 80 80" className="size-[68px] -rotate-90">
                                    <circle cx="40" cy="40" r={r} fill="none" stroke="currentColor" className="text-secondary" strokeWidth="8" />
                                    <circle cx="40" cy="40" r={r} fill="none" stroke="#7C3AED" strokeWidth="8" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)} />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-sm font-bold text-primary">{RESUMO.semanaFeitos}/{RESUMO.semanaMeta}</span>
                                </div>
                            </div>
                            <div className="flex flex-1 flex-col">
                                <span className="text-xs text-tertiary">Meta da semana</span>
                                <span className="text-md font-semibold text-primary">Faltam {RESUMO.semanaMeta - RESUMO.semanaFeitos} treinos</span>
                                <span className="text-sm text-[#7C3AED]">Ver desempenho</span>
                            </div>
                            <ChevronRight className="size-5 shrink-0 text-fg-quaternary" />
                        </button>
                        <div className="-mx-4 border-t border-secondary" />
                        <div className="flex flex-col gap-2.5">
                            <span className="text-xs font-bold uppercase tracking-wide text-tertiary">Esta semana</span>
                            <div className="flex justify-between">
                                {SEMANA.map((d, idx) => (
                                    <div key={idx} className="flex flex-col items-center gap-1.5">
                                        <span className="text-[11px] text-tertiary">{d.d}</span>
                                        <span
                                            className={cx(
                                                "flex size-9 items-center justify-center rounded-full border text-xs font-semibold",
                                                d.s === "done" && "border-[#7C3AED] bg-[#7C3AED] text-white",
                                                d.s === "planned" && "border-[#7C3AED] text-[#7C3AED]",
                                                d.s === "none" && "border-secondary text-tertiary",
                                            )}
                                        >
                                            {d.s === "done" ? <Check className="size-4" /> : "•"}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Próximo treino + check-in */}
                    <div
                        className="relative flex flex-col gap-3 rounded-2xl border bg-primary p-4"
                        style={checkin ? { borderColor: "rgba(124,58,237,0.25)" } : { animation: "checkinBreath 3.2s ease-in-out infinite" }}
                    >
                        <div className="flex items-center gap-3">
                            <span className="flex size-12 items-center justify-center rounded-xl bg-[#7C3AED]/10 text-2xl">{hoje.emoji}</span>
                            <div className="flex flex-1 flex-col">
                                <span className="text-xs text-tertiary">Próximo treino</span>
                                <span className="text-md font-semibold text-primary">{hoje.atividade}</span>
                                <span className="text-sm text-tertiary">Hoje · {hoje.hora} · {hoje.local}</span>
                            </div>
                        </div>
                        {checkin ? (
                            <div className="flex items-center justify-center gap-1.5 rounded-lg bg-[#7C3AED]/5 py-2.5 text-sm font-semibold text-[#7C3AED]">
                                <Check className="size-5" /> Check-in feito! Mandou bem 🎉
                            </div>
                        ) : (
                            <button type="button" onClick={() => setCheckin(true)} className="rounded-lg bg-[#7C3AED] py-2.5 text-sm font-semibold text-white transition hover:bg-[#6D28D9]">
                                Fazer check-in
                            </button>
                        )}
                    </div>
                </Bloco>

                {/* BLOCO: Conquistas do mês — quem fechou 100% da rotina */}
                <Bloco
                    icon={Trophy01}
                    titulo="Conquistas do mês"
                    onVer={() => navigate("/ticket-sports/hub/conquistas")}
                    verLabel="Ver todos"
                >
                    <p className="-mt-1 text-sm text-tertiary">Concluíram todos os treinos da rotina em junho 🏆</p>
                    <div className="flex flex-col divide-y divide-secondary rounded-2xl border border-secondary bg-primary px-4">
                        {CONCLUIRAM_MES.slice(0, 3).map((p) => {
                            const jaCelebrou = celebrados.has(p.id);
                            return (
                                <div key={p.id} className="flex items-center gap-3 py-3">
                                    <span className="relative shrink-0">
                                        <img src={p.foto} alt="" className="size-10 rounded-full object-cover ring-2 ring-[#F59E0B]" />
                                        <span className="absolute -bottom-1 -right-1 flex size-4 items-center justify-center rounded-full bg-[#F59E0B] text-[9px] ring-2 ring-primary">
                                            🏆
                                        </span>
                                    </span>
                                    <div className="flex min-w-0 flex-1 flex-col">
                                        <span className="truncate text-sm font-bold text-primary">{p.nome}</span>
                                        <span className="truncate text-xs text-tertiary">100% da rotina · {p.atividade}</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => !jaCelebrou && celebrar(p.id)}
                                        disabled={jaCelebrou}
                                        className={cx(
                                            "flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold transition",
                                            jaCelebrou
                                                ? "bg-[#7C3AED]/5 text-[#7C3AED]"
                                                : "bg-gradient-to-r from-[#7C3AED] to-[#D946EF] text-white hover:opacity-90",
                                        )}
                                    >
                                        {jaCelebrou ? "Celebrado 🎉" : "Celebrar 🎉"}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </Bloco>

                {/* BLOCO: Eventos pra você (desafio + mapa) */}
                <Bloco icon={Calendar} titulo="Eventos pra você" onVer={() => navigate("/ticket-sports/hub/eventos")}>
                    {/* Seu próximo desafio */}
                    <button
                        type="button"
                        onClick={() => navigate(`/ticket-sports/hub/eventos/${desafio.id}`)}
                        className="relative flex gap-4 overflow-hidden rounded-2xl bg-gradient-to-br from-[#7C3AED] via-[#9333EA] to-[#D946EF] p-4 text-left text-white shadow-lg"
                    >
                        <style>{`@keyframes desafioShine{0%{transform:translateX(-160%) skewX(-12deg)}60%,100%{transform:translateX(360%) skewX(-12deg)}}`}</style>
                        <span className="pointer-events-none absolute inset-0 z-10 overflow-hidden rounded-2xl">
                            <span className="absolute inset-y-0 left-0 w-1/4 bg-white/25 blur-md" style={{ animation: "desafioShine 3.2s ease-in-out infinite" }} />
                        </span>
                        <span className="pointer-events-none absolute -right-6 -top-6 size-24 rounded-full bg-white/10" />
                        <span className="pointer-events-none absolute -bottom-8 right-10 size-20 rounded-full bg-white/10" />
                        <img src={desafio.imagem} alt="" className="size-28 shrink-0 rounded-xl object-cover ring-2 ring-white/40" />
                        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                            <span className="text-[11px] font-bold uppercase tracking-wide text-white/85">🎯 Seu próximo desafio</span>
                            <h3 className="line-clamp-2 text-md font-bold leading-tight">{desafio.titulo}</h3>
                            <span className="flex items-center gap-1.5 text-xs text-white/90">
                                <MarkerPin01 className="size-3.5" /> {desafio.data} · {desafio.distancia}
                            </span>
                            {prontoParaEvento && (
                                <span className="flex w-max items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-semibold">
                                    <Check className="size-3" /> Você está pronto
                                </span>
                            )}
                            <span className="mt-1 flex w-max items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-[#7C3AED]">
                                Topar o desafio <ChevronRight className="size-3.5" />
                            </span>
                        </div>
                    </button>

                    {/* Mapa — eventos perto */}
                    <div className="flex flex-col gap-2.5">
                        <SubHeader titulo="Perto de você" onVer={() => navigate("/ticket-sports/hub/eventos/mapa")} />
                        <button
                            type="button"
                            onClick={() => navigate("/ticket-sports/hub/eventos")}
                            className="relative h-48 overflow-hidden rounded-2xl border border-secondary"
                            style={{ background: "linear-gradient(135deg,#EAF0F6,#E3EDF7)" }}
                        >
                            <span
                                className="absolute inset-0"
                                style={{
                                    backgroundImage:
                                        "linear-gradient(rgba(0,0,0,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,0.04) 1px,transparent 1px)",
                                    backgroundSize: "26px 26px",
                                }}
                            />
                            <span className="absolute -left-10 top-20 h-2.5 w-[160%] -rotate-6 rounded bg-white/90" />
                            <span className="absolute left-0 top-36 h-2 w-full rotate-3 rounded bg-white/80" />
                            <span className="absolute left-28 top-[-20%] h-[160%] w-2.5 rotate-12 rounded bg-white/90" />
                            <span className="absolute right-6 top-5 size-16 rounded-2xl bg-[#BBE3BD]/70" />
                            <span className="absolute bottom-5 left-5 size-14 rounded-2xl bg-[#BBE3BD]/60" />

                            <span className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
                                <span className="relative flex size-4 items-center justify-center">
                                    <span className="absolute inline-flex size-7 animate-ping rounded-full bg-[#3B82F6] opacity-40" />
                                    <span className="relative size-4 rounded-full bg-[#3B82F6] ring-2 ring-white" />
                                </span>
                                <span className="mt-1 rounded-full bg-white/90 px-1.5 text-[10px] font-semibold text-[#1f1f1f]">Você</span>
                            </span>

                            {EVENTOS.slice(0, 4).map((e, idx) => {
                                const pos = [
                                    { top: "20%", left: "28%" },
                                    { top: "30%", left: "72%" },
                                    { top: "68%", left: "66%" },
                                    { top: "62%", left: "26%" },
                                ][idx];
                                return (
                                    <span key={e.id} className="absolute -translate-x-1/2 -translate-y-full" style={pos}>
                                        <span className="flex size-9 items-center justify-center rounded-full bg-white text-base shadow-md ring-2 ring-[#7C3AED]">
                                            {e.emoji}
                                        </span>
                                        <span className="mx-auto -mt-0.5 size-2 rotate-45 bg-white shadow-md" />
                                    </span>
                                );
                            })}

                            <span className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-[#1f1f1f] shadow-sm">
                                <MarkerPin01 className="size-3.5 text-[#7C3AED]" /> {EVENTOS.length} eventos perto
                            </span>
                        </button>
                    </div>
                </Bloco>

                {/* BLOCO: Comunidade (ao vivo + posts + histórias + grupos) */}
                <Bloco icon={Users01} titulo="Comunidade" onVer={() => navigate("/ticket-sports/hub/comunidades")}>
                    {/* Treinando agora */}
                    <div className="flex flex-col gap-3 rounded-2xl bg-primary p-4 ring-1 ring-[#7C3AED]/20">
                        <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[#7C3AED]">
                                <span className="relative flex size-2.5">
                                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#22C55E] opacity-75" />
                                    <span className="relative inline-flex size-2.5 rounded-full bg-[#22C55E]" />
                                </span>
                                Treinando agora
                            </span>
                            <span className="rounded-full bg-[#7C3AED] px-2 py-0.5 text-xs font-bold text-white">{CHECKINS_TOTAL}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex -space-x-2.5">
                                {CHECKINS_AOVIVO.slice(0, 4).map((c, idx) => (
                                    <img key={idx} src={c.foto} alt="" className="size-10 rounded-full object-cover ring-2 ring-primary" />
                                ))}
                            </div>
                            <span key={i} className="flex-1 text-sm text-secondary duration-500 animate-in fade-in slide-in-from-bottom-1">
                                <span className="font-bold text-primary">{live.nome}</span> está treinando · {live.atividade} {live.emoji}
                            </span>
                        </div>
                    </div>

                    {/* Da comunidade */}
                    <div className="flex flex-col gap-3">
                        <SubHeader titulo="Da comunidade" onVer={() => navigate("/ticket-sports/hub/feed")} />
                        {FEED.slice(0, 2).map((p) => (
                            <button
                                key={`${p.comunidadeId}-${p.id}`}
                                type="button"
                                onClick={() => navigate(`/ticket-sports/hub/comunidades/${p.comunidadeId}`)}
                                className="flex flex-col gap-2 rounded-2xl border border-secondary bg-primary p-4 text-left"
                            >
                                <div className="flex items-center gap-2.5">
                                    <img src={p.comunidadeLogo} alt="" className="size-8 rounded-lg object-cover" />
                                    <span className="text-xs font-semibold text-primary">{p.comunidadeNome}</span>
                                </div>
                                <p className="line-clamp-2 text-sm text-secondary">{p.texto}</p>
                                <span className="flex items-center gap-1 text-xs text-tertiary">
                                    <Heart className="size-3.5 text-[#7C3AED]" /> {p.curtidas}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Histórias que inspiram */}
                    <div className="flex flex-col gap-3">
                        <SubHeader titulo="Histórias que inspiram" onVer={() => navigate("/ticket-sports/hub/historias")} />
                        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                            {HISTORIAS.map((h) => (
                                <button
                                    key={h.id}
                                    type="button"
                                    onClick={() => navigate(`/ticket-sports/hub/feed/story/${h.id}`)}
                                    className="flex w-60 shrink-0 flex-col gap-3 rounded-2xl border border-secondary bg-primary p-4 text-left"
                                >
                                    <div className="flex items-center gap-2">
                                        {fotoDe(h.nome) ? (
                                            <img src={fotoDe(h.nome)} alt="" className="size-8 rounded-full object-cover" />
                                        ) : (
                                            <span className="flex size-8 items-center justify-center rounded-full bg-[#7C3AED] text-xs font-bold text-white">{h.inicial}</span>
                                        )}
                                        <span className="text-xs font-semibold text-primary">{h.nome}</span>
                                    </div>
                                    <p className="line-clamp-3 text-sm leading-snug text-secondary">"{h.texto}"</p>
                                    <span className="flex items-center gap-1 text-xs text-tertiary">
                                        <Heart className="size-3.5 text-[#7C3AED]" /> {h.curtidas} · {h.atividade}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Grupos */}
                    <div className="flex flex-col gap-3">
                        <SubHeader titulo="Grupos pra você" onVer={() => navigate("/ticket-sports/hub/grupos")} />
                        <div className="flex flex-col rounded-2xl border border-secondary bg-primary px-4">
                            {GRUPOS.map((g, idx) => (
                                <button
                                    key={g.id}
                                    type="button"
                                    onClick={() => navigate(`/ticket-sports/hub/grupos/${g.id}`)}
                                    className={cx("flex items-center gap-3 py-3 text-left", idx > 0 && "border-t border-secondary")}
                                >
                                    <img src={g.logo} alt="" className="size-10 shrink-0 rounded-xl object-cover" />
                                    <div className="flex flex-1 flex-col">
                                        <span className="text-sm font-semibold text-primary">{g.nome}</span>
                                        <span className="text-xs text-tertiary">{g.membros} membros · {g.atividade}</span>
                                    </div>
                                    <ChevronRight className="size-5 shrink-0 text-fg-quaternary" />
                                </button>
                            ))}
                        </div>
                    </div>
                </Bloco>

                {/* BLOCO: Descobrir (números + tendências) */}
                <Bloco icon={Compass03} titulo="Descobrir">
                    {/* Em alta — números */}
                    <div className="flex items-center justify-between rounded-2xl border border-secondary bg-primary px-2 py-4">
                        {STATS.map((s, idx) => (
                            <div key={s.id} className={cx("flex flex-1 flex-col items-center text-center", idx > 0 && "border-l border-secondary")}>
                                <span className="text-xl font-bold text-primary">{s.valor}</span>
                                <span className="px-2 text-[11px] leading-tight text-tertiary">{s.label}</span>
                            </div>
                        ))}
                    </div>

                    {/* Tendências */}
                    <button
                        type="button"
                        onClick={() => navigate("/ticket-sports/hub/tendencias")}
                        className="flex items-center gap-3 rounded-2xl bg-primary p-4 text-left ring-1 ring-[#7C3AED]/20"
                    >
                        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#7C3AED] text-white">
                            <TrendUp02 className="size-5" />
                        </span>
                        <div className="flex flex-1 flex-col">
                            <span className="text-md font-semibold text-primary">Tendências</span>
                            <span className="text-sm text-tertiary">Veja o que está em alta no Hub</span>
                        </div>
                        <ChevronRight className="size-5 shrink-0 text-fg-quaternary" />
                    </button>
                </Bloco>
            </main>

            <HubTabBar active="inicio" />
            {festa && <Confetti />}
        </TicketSportsLayout>
    );
}
