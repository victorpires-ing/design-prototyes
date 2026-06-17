import { useMemo, useState } from "react";
import { Bell01, Heart, MessageCircle01, Plus, SearchLg } from "@untitledui/icons";
import { useNavigate } from "react-router";
import { TicketSportsLayout } from "../../components/TicketSportsLayout";
import { HubTabBar } from "../components/HubTabBar";
import { HubIconButton } from "../components/hub-ui";
import { FEED_GERAL, USUARIO } from "../data/home";
import { USUARIOS } from "../data/usuarios";

export function FeedGeral() {
    const navigate = useNavigate();
    const [busca, setBusca] = useState("");
    const pessoas = useMemo(
        () => USUARIOS.filter((u) => u.nome.toLowerCase().includes(busca.trim().toLowerCase())),
        [busca],
    );
    return (
        <TicketSportsLayout fullHeight>
            <header className="flex items-center justify-between gap-3 border-b border-secondary bg-primary px-5 py-3.5 md:rounded-t-3xl">
                <h1 className="text-xl font-bold text-primary">Feed</h1>
                <HubIconButton icon={Bell01} label="Notificações" dot onClick={() => navigate("/ticket-sports/hub/notificacoes")} />
            </header>

            <main className="hub-rise flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-5 pb-28 [&>*]:shrink-0">
                {/* Buscar pessoas */}
                <div className="flex flex-col gap-3">
                    <div className="relative">
                        <SearchLg className="absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-fg-quaternary" />
                        <input
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                            placeholder="Encontrar pessoas…"
                            className="w-full rounded-full border border-secondary bg-primary py-2.5 pl-11 pr-4 text-md text-primary placeholder:text-placeholder outline-none transition duration-100 focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/30"
                        />
                    </div>
                    {busca.trim() && (
                        <div className="flex flex-col gap-1">
                            {pessoas.length === 0 && <p className="px-1 py-2 text-sm text-tertiary">Ninguém encontrado.</p>}
                            {pessoas.map((u) => (
                                <button
                                    key={u.id}
                                    type="button"
                                    onClick={() => navigate(`/ticket-sports/hub/feed/usuario/${u.id}`)}
                                    className="flex items-center gap-3 rounded-xl px-1 py-2 text-left transition duration-100 hover:bg-secondary"
                                >
                                    <img src={u.foto} alt="" className="size-10 rounded-full object-cover" />
                                    <span className="flex flex-col">
                                        <span className="text-sm font-semibold text-primary">{u.nome}</span>
                                        <span className="text-xs text-tertiary">{u.atividade} · {u.seguidores} seguidores</span>
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Atalho para criar publicação */}
                <style>{`@keyframes feedBreath{0%,100%{box-shadow:0 0 0 0 rgba(124,58,237,0);border-color:rgba(124,58,237,0.25)}50%{box-shadow:0 0 16px 1px rgba(124,58,237,0.22);border-color:rgba(124,58,237,0.6)}}@media (prefers-reduced-motion:reduce){[style*="feedBreath"]{animation:none}}`}</style>
                <button
                    type="button"
                    onClick={() => navigate("/ticket-sports/hub/feed/novo")}
                    className="flex items-center gap-3 rounded-2xl border p-4 text-left"
                    style={{ animation: "feedBreath 3.2s ease-in-out infinite" }}
                >
                    <img src={USUARIO.foto} alt="" className="size-10 shrink-0 rounded-full object-cover" />
                    <span className="flex-1 text-sm text-tertiary">Compartilhe um momento do seu treino…</span>
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#7C3AED] text-white">
                        <Plus className="size-4" />
                    </span>
                </button>

                {FEED_GERAL.map((p) => {
                    const usuario = USUARIOS.find((u) => u.nome === p.autor);
                    const abrirPerfil = () => usuario && navigate(`/ticket-sports/hub/feed/usuario/${usuario.id}`);
                    return (
                    <article key={p.id} className="flex flex-col gap-3 rounded-2xl border border-secondary p-4">
                        <button type="button" onClick={abrirPerfil} className="flex items-center gap-3 text-left">
                            {usuario ? (
                                <img src={usuario.foto} alt="" className="size-10 rounded-full object-cover" />
                            ) : (
                                <span className="flex size-10 items-center justify-center rounded-full bg-[#7C3AED] font-bold text-white">{p.inicial}</span>
                            )}
                            <div className="flex flex-col">
                                <span className="text-sm font-semibold text-primary">{p.autor}</span>
                                <span className="text-xs text-tertiary">{p.tempo}</span>
                            </div>
                        </button>
                        <p className="text-md leading-snug text-secondary">{p.texto}</p>
                        {p.foto && <img src={p.foto} alt="" className="aspect-[3/2] w-full rounded-xl object-cover" />}
                        <div className="flex items-center gap-4 text-sm text-tertiary">
                            <span className="flex items-center gap-1.5">
                                <Heart className="size-4 text-[#7C3AED]" /> {p.curtidas}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <MessageCircle01 className="size-4 text-fg-quaternary" /> {p.comentarios}
                            </span>
                        </div>
                    </article>
                    );
                })}
            </main>

            <HubTabBar active="feed" />
        </TicketSportsLayout>
    );
}
