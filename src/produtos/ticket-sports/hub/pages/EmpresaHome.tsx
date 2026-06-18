import { Bell01, ChevronRight, Heart, LayoutAlt01, MessageCircle01, Users01, Users03 } from "@untitledui/icons";
import { useNavigate } from "react-router";
import { TicketSportsLayout } from "../../components/TicketSportsLayout";
import { Bloco } from "../components/Bloco";
import { HubTabBarEmpresa } from "../components/HubTabBarEmpresa";
import { HubIconButton } from "../components/hub-ui";
import { COMUNIDADES } from "../data/comunidade";

export function EmpresaHome() {
    const navigate = useNavigate();
    const c = COMUNIDADES[0]; // comunidade da empresa logada
    const verComunidade = () => navigate(`/ticket-sports/hub/comunidades/${c.id}`);

    return (
        <TicketSportsLayout fullHeight>
            {/* Header */}
            <header className="flex items-center justify-between gap-3 border-b border-secondary bg-primary px-5 py-3.5 md:rounded-t-3xl">
                <button type="button" onClick={verComunidade} className="flex items-center gap-3 text-left">
                    <img src={c.logo} alt="" className="size-11 rounded-xl object-cover ring-2 ring-[#7C3AED]/25" />
                    <span className="flex flex-col">
                        <span className="text-xs text-tertiary">Olá,</span>
                        <span className="text-md font-bold leading-tight text-primary">{c.empresa} 👋</span>
                    </span>
                </button>
                <HubIconButton icon={Bell01} label="Notificações" dot onClick={() => navigate("/ticket-sports/hub/notificacoes")} />
            </header>

            <main className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 py-5 pb-28">
                {/* BLOCO: Sua comunidade */}
                <Bloco icon={Users03} titulo="Sua comunidade" onVer={verComunidade} verLabel="Ver comunidade">
                    <div className="overflow-hidden rounded-2xl border border-secondary bg-primary">
                        <div className="relative">
                            <img src={c.banner} alt="" className="h-28 w-full object-cover" />
                            <span className="absolute -bottom-6 left-4 size-16 overflow-hidden rounded-2xl ring-4 ring-primary">
                                <img src={c.logo} alt="" className="size-full object-cover" />
                            </span>
                        </div>
                        <div className="flex flex-col gap-3 p-4 pt-9">
                            <div className="flex flex-col">
                                <span className="text-md font-bold text-primary">{c.nome}</span>
                                <span className="text-sm text-tertiary">
                                    {c.inscritos} inscritos · {c.atividade}
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() => navigate("/ticket-sports/hub/configurar-comunidade?editar=1")}
                                className="flex items-center justify-center gap-1.5 rounded-lg bg-[#7C3AED] py-2.5 text-sm font-semibold text-white transition hover:bg-[#6D28D9]"
                            >
                                Configurar comunidade
                            </button>
                        </div>
                    </div>
                </Bloco>

                {/* BLOCO: Inscritos */}
                <Bloco icon={Users01} titulo="Inscritos">
                    <div className="flex items-center justify-between gap-3 rounded-2xl border border-secondary bg-primary p-4">
                        <div className="flex items-center gap-3">
                            <div className="flex -space-x-2">
                                {c.participantes.slice(0, 5).map((p, i) => (
                                    <span key={i} className="flex size-9 items-center justify-center rounded-full bg-[#7C3AED] text-xs font-bold text-white ring-2 ring-primary">
                                        {p.inicial}
                                    </span>
                                ))}
                            </div>
                            <span className="text-sm text-tertiary">
                                <span className="font-bold text-primary">{c.inscritos}</span> pessoas inscritas
                            </span>
                        </div>
                        <button type="button" onClick={verComunidade} aria-label="Ver inscritos" className="text-fg-quaternary">
                            <ChevronRight className="size-5" />
                        </button>
                    </div>
                </Bloco>

                {/* BLOCO: Suas postagens */}
                <Bloco
                    icon={LayoutAlt01}
                    titulo="Suas postagens"
                    onVer={() => navigate("/ticket-sports/hub/empresa/publicar")}
                    verLabel="Nova"
                >
                    {c.publicacoes.map((p) => (
                        <article key={p.id} className="flex flex-col gap-3 rounded-2xl border border-secondary bg-primary p-4">
                            <div className="flex items-center gap-3">
                                <span className="flex size-10 items-center justify-center rounded-full bg-[#7C3AED] font-bold text-white">{p.inicial}</span>
                                <div className="flex flex-col">
                                    <span className="text-sm font-semibold text-primary">{p.autor}</span>
                                    <span className="text-xs text-tertiary">{p.tempo}</span>
                                </div>
                            </div>
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
                    ))}
                </Bloco>
            </main>

            <HubTabBarEmpresa active="inicio" />
        </TicketSportsLayout>
    );
}
