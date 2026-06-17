import { ArrowLeft, ChevronRight } from "@untitledui/icons";
import { useNavigate } from "react-router";
import { TicketSportsLayout } from "../../components/TicketSportsLayout";
import { CONTEUDOS, SAUDE, TREINO, type Dica } from "../data/recomendacoes";
import { GRUPOS } from "../data/home";
import { USUARIOS } from "../data/usuarios";

const DicaCard = ({ d }: { d: Dica }) => (
    <div className="flex gap-3 rounded-2xl border border-secondary p-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#7C3AED]/10 text-xl">{d.emoji}</span>
        <div className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold text-primary">{d.titulo}</span>
            <span className="text-sm text-tertiary">{d.texto}</span>
            {d.acao && <span className="mt-1 text-sm font-semibold text-[#7C3AED]">{d.acao}</span>}
        </div>
    </div>
);

const Secao = ({ titulo, children }: { titulo: string; children: React.ReactNode }) => (
    <section className="flex flex-col gap-3">
        <h2 className="text-md font-semibold text-primary">{titulo}</h2>
        {children}
    </section>
);

export function Recomendacoes() {
    const navigate = useNavigate();
    const gruposSugeridos = GRUPOS.filter((g) => ["Corrida", "CrossFit"].includes(g.atividade)).slice(0, 2);
    const pessoasSugeridas = USUARIOS.filter((u) => ["Corrida", "Musculação"].includes(u.atividade)).slice(0, 3);

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

            <div className="hub-rise flex flex-1 flex-col gap-6 px-5 py-5 pb-10">
                <p className="text-md text-tertiary">
                    Com base na sua rotina, nas suas atividades e no que você acompanha. ✨
                </p>

                <Secao titulo="Para o seu treino">
                    <div className="flex flex-col gap-3">
                        {TREINO.map((d, i) => (
                            <DicaCard key={i} d={d} />
                        ))}
                    </div>
                </Secao>

                <Secao titulo="Saúde & bem-estar">
                    <div className="flex flex-col gap-3">
                        {SAUDE.map((d, i) => (
                            <DicaCard key={i} d={d} />
                        ))}
                    </div>
                </Secao>

                <Secao titulo="Conteúdos pra você">
                    <div className="flex flex-col gap-3">
                        {CONTEUDOS.map((d, i) => (
                            <DicaCard key={i} d={d} />
                        ))}
                    </div>
                </Secao>

                <Secao titulo="Grupos pra você">
                    <div className="flex flex-col">
                        {gruposSugeridos.map((g, i) => (
                            <button
                                key={g.id}
                                type="button"
                                onClick={() => navigate(`/ticket-sports/hub/grupos/${g.id}`)}
                                className={`flex items-center gap-3 py-3 text-left ${i > 0 ? "border-t border-secondary" : ""}`}
                            >
                                <span className="flex size-10 items-center justify-center rounded-xl bg-secondary text-xl">{g.emoji}</span>
                                <div className="flex flex-1 flex-col">
                                    <span className="text-sm font-semibold text-primary">{g.nome}</span>
                                    <span className="text-xs text-tertiary">{g.membros} membros · {g.atividade}</span>
                                </div>
                                <ChevronRight className="size-5 shrink-0 text-fg-quaternary" />
                            </button>
                        ))}
                    </div>
                </Secao>

                <Secao titulo="Pessoas pra seguir">
                    <div className="flex flex-col">
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
                </Secao>
            </div>
        </TicketSportsLayout>
    );
}
