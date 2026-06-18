import { useRef, useState } from "react";
import type { ComponentType, ReactNode } from "react";
import { Activity, Calendar, ChevronRight, Clock, Edit01, Heart, Image01, LayoutAlt01, LogOut01, Settings01, XClose } from "@untitledui/icons";
import { useNavigate } from "react-router";
import { cx } from "@/utils/cx";
import { TicketSportsLayout } from "../../components/TicketSportsLayout";
import { HubTabBar } from "../components/HubTabBar";
import { HubIconButton } from "../components/hub-ui";
import { ATIVIDADES } from "../data/onboarding";
import { DIAS, MINHA_ROTINA } from "../data/rotina";

interface Post {
    id: string;
    texto: string;
    imagens: string[];
    tempo: string;
    curtidas: number;
}

const POSTS_INICIAIS: Post[] = [
    {
        id: "1",
        texto: "Fechei a semana com 4 treinos! Consistência é tudo. 💪",
        imagens: ["https://picsum.photos/seed/perfil-post1/600/400"],
        tempo: "há 2 dias",
        curtidas: 34,
    },
    {
        id: "2",
        texto: "Primeiro 10k da vida concluído hoje. Bora pra mais! 🏃",
        imagens: [],
        tempo: "há 5 dias",
        curtidas: 58,
    },
];

const Avatar = ({ className }: { className?: string }) => (
    <span className={cx("flex items-center justify-center rounded-full bg-[#7C3AED] font-bold text-white", className)}>W</span>
);

/** Bloco temático: painel com cabeçalho (ícone + título) agrupando itens relacionados. */
const Bloco = ({ icon: Icon, titulo, children }: { icon: ComponentType<{ className?: string }>; titulo: string; children: ReactNode }) => (
    <section className="flex flex-col gap-4 rounded-3xl bg-secondary p-4">
        <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-xl bg-[#7C3AED] text-white">
                <Icon className="size-4" />
            </span>
            <h2 className="text-base font-bold text-primary">{titulo}</h2>
        </div>
        {children}
    </section>
);

export function Perfil() {
    const navigate = useNavigate();
    const [posts, setPosts] = useState<Post[]>(POSTS_INICIAIS);
    const [texto, setTexto] = useState("");
    const [imagens, setImagens] = useState<string[]>([]);
    const fileRef = useRef<HTMLInputElement>(null);

    const onArquivos = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        files.forEach((file) => {
            const reader = new FileReader();
            reader.onload = () => setImagens((prev) => [...prev, reader.result as string]);
            reader.readAsDataURL(file);
        });
        e.target.value = "";
    };

    const publicar = () => {
        if (!texto.trim() && imagens.length === 0) return;
        setPosts((prev) => [{ id: `novo-${prev.length}`, texto: texto.trim(), imagens, tempo: "agora", curtidas: 0 }, ...prev]);
        setTexto("");
        setImagens([]);
    };

    const podePublicar = texto.trim().length > 0 || imagens.length > 0;

    const ativ = ATIVIDADES.find((a) => a.id === MINHA_ROTINA.atividade);
    const diasTxt = MINHA_ROTINA.dias.map((id) => DIAS.find((d) => d.id === id)?.curto).join(", ");
    const horaTxt = MINHA_ROTINA.mesmoHorario ? MINHA_ROTINA.horaGeral : "Horários por dia";

    return (
        <TicketSportsLayout fullHeight>
            <header className="flex items-center justify-between gap-3 border-b border-secondary bg-primary px-5 py-3.5 md:rounded-t-3xl">
                <h1 className="text-xl font-bold text-primary">Perfil</h1>
                <HubIconButton icon={Settings01} label="Editar perfil" onClick={() => navigate("/ticket-sports/hub/perfil/editar")} />
            </header>

            <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={onArquivos} />

            <main className="hub-rise flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 py-5 pb-28 [&>*]:shrink-0">
                {/* Identidade */}
                <div className="flex flex-col items-center gap-2 pt-1 text-center">
                    <Avatar className="size-20 text-2xl" />
                    <div className="flex flex-col">
                        <span className="text-display-xs font-bold text-primary">William Campos</span>
                        <span className="text-sm text-tertiary">São Paulo, SP</span>
                    </div>
                    <p className="max-w-xs text-sm text-secondary">Apaixonado por corrida e bons treinos. Bora juntos! 🏃</p>
                    <button
                        type="button"
                        onClick={() => navigate("/ticket-sports/hub/perfil/editar")}
                        className="mt-1 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary ring-1 ring-border-secondary transition hover:bg-secondary"
                    >
                        Editar perfil
                    </button>
                </div>

                {/* BLOCO: Seu treino (rotina + recomendações) */}
                <Bloco icon={Activity} titulo="Seu treino">
                    {/* Minha rotina */}
                    <div className="flex flex-col gap-3 rounded-2xl border border-secondary bg-primary p-4">
                        <div className="flex items-center justify-between gap-3">
                            <span className="text-sm font-bold text-primary">Minha rotina</span>
                            <button
                                type="button"
                                onClick={() => navigate("/ticket-sports/hub/criar-rotina?editar=1")}
                                className="flex items-center gap-1.5 text-sm font-semibold text-[#7C3AED]"
                            >
                                <Edit01 className="size-4" /> Editar
                            </button>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="flex size-11 items-center justify-center rounded-xl bg-[#7C3AED]/10 text-2xl">{ativ?.emoji}</span>
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-primary">{MINHA_ROTINA.nome}</span>
                                <span className="text-xs text-tertiary">{ativ?.label}</span>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-tertiary">
                            <span className="flex items-center gap-1.5">
                                <Calendar className="size-4 text-fg-quaternary" /> {diasTxt}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Clock className="size-4 text-fg-quaternary" /> {horaTxt}
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={() => navigate("/ticket-sports/hub/rotina/desempenho")}
                            className="mt-1 flex items-center justify-center gap-1.5 rounded-lg bg-[#7C3AED]/10 py-2.5 text-sm font-semibold text-[#7C3AED] transition hover:bg-[#7C3AED]/15"
                        >
                            📈 Ver desempenho
                        </button>
                    </div>

                    {/* Recomendações */}
                    <button
                        type="button"
                        onClick={() => navigate("/ticket-sports/hub/perfil/recomendacoes")}
                        className="flex w-full items-center gap-3 rounded-2xl bg-primary p-4 text-left ring-1 ring-[#7C3AED]/20"
                    >
                        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#7C3AED] text-lg text-white">✨</span>
                        <div className="flex flex-1 flex-col">
                            <span className="text-md font-semibold text-primary">Recomendações pra você</span>
                            <span className="text-sm text-tertiary">Sugestões de treino, saúde e conteúdos</span>
                        </div>
                        <ChevronRight className="size-5 shrink-0 text-fg-quaternary" />
                    </button>
                </Bloco>

                {/* BLOCO: Suas publicações (compositor + posts) */}
                <Bloco icon={LayoutAlt01} titulo="Suas publicações">
                    {/* Compositor */}
                    <div className="flex flex-col gap-3 rounded-2xl border border-secondary bg-primary p-4">
                        <div className="flex gap-3">
                            <Avatar className="size-10 shrink-0 text-sm" />
                            <textarea
                                value={texto}
                                onChange={(e) => setTexto(e.target.value)}
                                placeholder="Compartilhe uma conquista ou um momento do treino…"
                                rows={2}
                                className="mt-1 w-full resize-none bg-transparent text-md text-primary placeholder:text-placeholder outline-none"
                            />
                        </div>

                        {imagens.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {imagens.map((src, i) => (
                                    <div key={i} className="relative size-20 overflow-hidden rounded-xl">
                                        <img src={src} alt="" className="size-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => setImagens((prev) => prev.filter((_, idx) => idx !== i))}
                                            aria-label="Remover imagem"
                                            className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-black/60 text-white"
                                        >
                                            <XClose className="size-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex items-center justify-between border-t border-secondary pt-3">
                            <button
                                type="button"
                                onClick={() => fileRef.current?.click()}
                                className="flex items-center gap-1.5 text-sm font-semibold text-[#7C3AED]"
                            >
                                <Image01 className="size-5" /> Adicionar imagem
                            </button>
                            <button
                                type="button"
                                onClick={publicar}
                                disabled={!podePublicar}
                                className="rounded-lg bg-[#7C3AED] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#6D28D9] disabled:bg-[#C4B5FD]"
                            >
                                Publicar
                            </button>
                        </div>
                    </div>

                    {/* Posts */}
                    {posts.map((p) => (
                        <article key={p.id} className="flex flex-col gap-3 rounded-2xl border border-secondary bg-primary p-4">
                            <div className="flex items-center gap-3">
                                <Avatar className="size-10 text-sm" />
                                <div className="flex flex-col">
                                    <span className="text-sm font-semibold text-primary">William Campos</span>
                                    <span className="text-xs text-tertiary">{p.tempo}</span>
                                </div>
                            </div>
                            {p.texto && <p className="text-md leading-snug text-secondary">{p.texto}</p>}
                            {p.imagens.length > 0 && (
                                <div className={cx("grid gap-2", p.imagens.length === 1 ? "grid-cols-1" : "grid-cols-2")}>
                                    {p.imagens.map((src, i) => (
                                        <img key={i} src={src} alt="" className="aspect-[3/2] w-full rounded-xl object-cover" />
                                    ))}
                                </div>
                            )}
                            <div className="flex items-center gap-1.5 text-sm text-tertiary">
                                <Heart className="size-4 text-[#7C3AED]" /> {p.curtidas} curtidas
                            </div>
                        </article>
                    ))}
                </Bloco>

                {/* Sair */}
                <button
                    type="button"
                    onClick={() => navigate("/ticket-sports/hub")}
                    className="flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold text-error-primary ring-1 ring-border-secondary transition duration-100 hover:bg-secondary"
                >
                    <LogOut01 className="size-5" /> Sair da conta
                </button>
            </main>

            <HubTabBar active="perfil" />
        </TicketSportsLayout>
    );
}
