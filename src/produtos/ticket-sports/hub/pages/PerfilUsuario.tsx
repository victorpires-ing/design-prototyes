import { useState } from "react";
import { ArrowLeft, Check, Heart, LayoutAlt01 } from "@untitledui/icons";
import { useNavigate, useParams } from "react-router";
import { cx } from "@/utils/cx";
import { TicketSportsLayout } from "../../components/TicketSportsLayout";
import { Bloco } from "../components/Bloco";
import { HubButton } from "../components/hub-ui";
import { getUsuario } from "../data/usuarios";

export function PerfilUsuario() {
    const navigate = useNavigate();
    const { id } = useParams();
    const u = getUsuario(id);
    const [seguindo, setSeguindo] = useState(false);

    if (!u) {
        return (
            <TicketSportsLayout>
                <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
                    <p className="text-md text-tertiary">Usuário não encontrado.</p>
                    <HubButton variant="secondary" onClick={() => navigate("/ticket-sports/hub/feed")}>
                        Voltar ao feed
                    </HubButton>
                </div>
            </TicketSportsLayout>
        );
    }

    return (
        <TicketSportsLayout>
            <header className="flex items-center gap-2 border-b border-secondary bg-primary px-5 py-3.5 md:rounded-t-3xl">
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    aria-label="Voltar"
                    className="flex size-9 items-center justify-center rounded-full text-fg-secondary hover:bg-secondary"
                >
                    <ArrowLeft className="size-5" />
                </button>
                <h1 className="text-xl font-bold text-primary">{u.nome}</h1>
            </header>

            <div className="flex flex-1 flex-col gap-5 px-5 py-5 pb-10">
                {/* Identidade (fora de bloco) */}
                <div className="flex flex-col items-center gap-2 pt-1 text-center">
                    <img src={u.foto} alt={u.nome} className="size-20 rounded-full object-cover" />
                    <div className="flex flex-col">
                        <span className="text-display-xs font-bold text-primary">{u.nome}</span>
                        <span className="text-sm text-tertiary">{u.atividade} · {u.cidade}</span>
                    </div>
                    <p className="max-w-xs text-sm text-secondary">{u.bio}</p>
                    <div className="my-1 flex items-center gap-6">
                        <span className="flex flex-col items-center">
                            <span className="text-md font-bold text-primary">{u.seguidores}</span>
                            <span className="text-xs text-tertiary">seguidores</span>
                        </span>
                        <span className="flex flex-col items-center">
                            <span className="text-md font-bold text-primary">{u.posts.length}</span>
                            <span className="text-xs text-tertiary">publicações</span>
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setSeguindo((v) => !v)}
                        className={cx(
                            "flex items-center gap-1.5 rounded-lg px-6 py-2.5 text-sm font-semibold transition duration-100",
                            seguindo ? "bg-primary text-primary ring-1 ring-border-secondary" : "bg-[#7C3AED] text-white hover:bg-[#6D28D9]",
                        )}
                    >
                        {seguindo && <Check className="size-4" />}
                        {seguindo ? "Seguindo" : "Seguir"}
                    </button>
                </div>

                {/* BLOCO: Publicações */}
                <Bloco icon={LayoutAlt01} titulo="Publicações">
                    {u.posts.map((p) => (
                        <article key={p.id} className="flex flex-col gap-3 rounded-2xl border border-secondary bg-primary p-4">
                            <div className="flex items-center gap-3">
                                <img src={u.foto} alt="" className="size-10 rounded-full object-cover" />
                                <div className="flex flex-col">
                                    <span className="text-sm font-semibold text-primary">{u.nome}</span>
                                    <span className="text-xs text-tertiary">{p.tempo}</span>
                                </div>
                            </div>
                            <p className="text-md leading-snug text-secondary">{p.texto}</p>
                            {p.foto && <img src={p.foto} alt="" className="aspect-[3/2] w-full rounded-xl object-cover" />}
                            <div className="flex items-center gap-1.5 text-sm text-tertiary">
                                <Heart className="size-4 text-[#7C3AED]" /> {p.curtidas} curtidas
                            </div>
                        </article>
                    ))}
                </Bloco>
            </div>
        </TicketSportsLayout>
    );
}
