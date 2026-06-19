import { Activity, ArrowLeft, Calendar, ChevronRight, Heart, LayoutAlt01, UsersPlus, Users03 } from "@untitledui/icons";
import { useNavigate } from "react-router";
import { TicketSportsLayout } from "../../components/TicketSportsLayout";
import { Bloco } from "../components/Bloco";
import { CONTEUDOS, SAUDE, TREINO, type Dica } from "../data/recomendacoes";
import { CIDADE_USUARIO, EVENTOS } from "../data/eventos";
import { GRUPOS } from "../data/home";
import { USUARIOS } from "../data/usuarios";

const INTERESSES = ["Corrida", "CrossFit", "Musculação"];

const DicaCard = ({ d }: { d: Dica }) => (
    <div className="flex gap-3 rounded-2xl border border-secondary bg-primary p-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#7C3AED]/10 text-xl">{d.emoji}</span>
        <div className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold text-primary">{d.titulo}</span>
            <span className="text-sm text-tertiary">{d.texto}</span>
            {d.acao && <span className="mt-1 text-sm font-semibold text-[#7C3AED]">{d.acao}</span>}
        </div>
    </div>
);

export function Recomendacoes() {
    const navigate = useNavigate();
    const gruposSugeridos = GRUPOS.filter((g) => ["Corrida", "CrossFit"].includes(g.atividade)).slice(0, 2);
    const pessoasSugeridas = USUARIOS.filter((u) => ["Corrida", "Musculação"].includes(u.atividade)).slice(0, 3);
    const eventosSugeridos = EVENTOS.filter((e) => INTERESSES.includes(e.atividade)).slice(0, 4);

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
                <h1 className="text-xl font-bold text-primary">Recomendações</h1>
            </header>

            <div className="hub-rise flex flex-1 flex-col gap-5 px-5 py-5 pb-10">
                <p className="text-md text-tertiary">
                    Com base na sua rotina, nas suas atividades e no que você acompanha. ✨
                </p>

                <Bloco icon={Calendar} titulo="Eventos pra você" onVer={() => navigate("/ticket-sports/hub/eventos")}>
                    <p className="-mt-1 text-sm text-tertiary">Perto de você em {CIDADE_USUARIO}, no seu esporte. 📍</p>
                    <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        {eventosSugeridos.map((e) => (
                            <button
                                key={e.id}
                                type="button"
                                onClick={() => navigate(`/ticket-sports/hub/eventos/${e.id}`)}
                                className="w-40 shrink-0 overflow-hidden rounded-2xl border border-secondary bg-primary text-left transition active:scale-[0.97]"
                            >
                                <div className="relative h-24">
                                    <img src={e.imagem} alt="" className="size-full object-cover" />
                                    <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-black/45 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-md">
                                        {e.emoji} {e.atividade}
                                    </span>
                                </div>
                                <div className="flex flex-col gap-0.5 p-2.5">
                                    <span className="line-clamp-1 text-sm font-bold text-primary">{e.titulo}</span>
                                    <span className="truncate text-[11px] text-tertiary">{e.data}</span>
                                    <span className="text-[11px] font-semibold text-[#7C3AED]">{e.distancia}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </Bloco>

                <Bloco icon={Activity} titulo="Para o seu treino">
                    <div className="flex flex-col gap-3">
                        {TREINO.map((d, i) => (
                            <DicaCard key={i} d={d} />
                        ))}
                    </div>
                </Bloco>

                <Bloco icon={Heart} titulo="Saúde & bem-estar">
                    <div className="flex flex-col gap-3">
                        {SAUDE.map((d, i) => (
                            <DicaCard key={i} d={d} />
                        ))}
                    </div>
                </Bloco>

                <Bloco icon={LayoutAlt01} titulo="Conteúdos pra você">
                    <div className="flex flex-col gap-3">
                        {CONTEUDOS.map((d, i) => (
                            <DicaCard key={i} d={d} />
                        ))}
                    </div>
                </Bloco>

                <Bloco icon={Users03} titulo="Grupos pra você">
                    <div className="flex flex-col rounded-2xl border border-secondary bg-primary px-4">
                        {gruposSugeridos.map((g, i) => (
                            <button
                                key={g.id}
                                type="button"
                                onClick={() => navigate(`/ticket-sports/hub/grupos/${g.id}`)}
                                className={`flex items-center gap-3 py-3 text-left ${i > 0 ? "border-t border-secondary" : ""}`}
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
                </Bloco>

                <Bloco icon={UsersPlus} titulo="Pessoas pra seguir">
                    <div className="flex flex-col rounded-2xl border border-secondary bg-primary px-4">
                        {pessoasSugeridas.map((u, i) => (
                            <button
                                key={u.id}
                                type="button"
                                onClick={() => navigate(`/ticket-sports/hub/feed/usuario/${u.id}`)}
                                className={`flex items-center gap-3 py-3 text-left ${i > 0 ? "border-t border-secondary" : ""}`}
                            >
                                <img src={u.foto} alt="" className="size-10 rounded-full object-cover" />
                                <div className="flex flex-1 flex-col">
                                    <span className="text-sm font-semibold text-primary">{u.nome}</span>
                                    <span className="text-xs text-tertiary">{u.atividade} · {u.seguidores} seguidores</span>
                                </div>
                                <span className="shrink-0 rounded-lg bg-[#7C3AED] px-4 py-1.5 text-sm font-semibold text-white">Seguir</span>
                            </button>
                        ))}
                    </div>
                </Bloco>
            </div>
        </TicketSportsLayout>
    );
}
