import { Heart, Send01, XClose } from "@untitledui/icons";
import { useNavigate, useParams } from "react-router";
import { TicketSportsLayout } from "../../components/TicketSportsLayout";
import { HISTORIAS } from "../data/home";

export function VerStory() {
    const navigate = useNavigate();
    const { id } = useParams();
    const h = HISTORIAS.find((x) => x.id === id) ?? HISTORIAS[0];
    const fechar = () => navigate(-1);

    return (
        <TicketSportsLayout fullHeight>
            <div className="relative flex min-h-0 flex-1 flex-col bg-gradient-to-b from-[#7C3AED] via-[#9333EA] to-[#4C1D95] text-white">
                {/* progresso */}
                <div className="px-4 pt-4">
                    <div className="h-1 w-full overflow-hidden rounded-full bg-white/30">
                        <div className="h-full w-full rounded-full bg-white" />
                    </div>
                </div>

                {/* header */}
                <div className="flex items-center gap-3 px-4 pt-3">
                    <span className="flex size-10 items-center justify-center rounded-full bg-white/20 font-bold text-white ring-2 ring-white/40">
                        {h.inicial}
                    </span>
                    <div className="flex min-w-0 flex-col">
                        <span className="text-sm font-bold">{h.nome}</span>
                        <span className="text-xs text-white/80">
                            {h.atividade} · há {h.tempo}
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={fechar}
                        aria-label="Fechar"
                        className="ml-auto flex size-9 items-center justify-center rounded-full text-white/90 hover:bg-white/15"
                    >
                        <XClose className="size-6" />
                    </button>
                </div>

                {/* conteúdo */}
                <div className="flex flex-1 flex-col justify-center gap-5 px-6">
                    <span className="w-max rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">{h.atividade}</span>
                    <p className="text-[26px] font-bold leading-snug">"{h.texto}"</p>
                    <span className="flex items-center gap-1.5 text-sm text-white/90">
                        <Heart className="size-5" /> {h.curtidas} pessoas curtiram
                    </span>
                </div>

                {/* responder */}
                <div className="flex items-center gap-2 px-4 pb-6">
                    <input
                        placeholder="Responder…"
                        className="flex-1 rounded-full bg-white/15 px-4 py-2.5 text-sm text-white placeholder:text-white/60 outline-none"
                    />
                    <button type="button" aria-label="Curtir" className="flex size-11 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25">
                        <Heart className="size-5" />
                    </button>
                    <button type="button" aria-label="Enviar" className="flex size-11 items-center justify-center rounded-full bg-white text-[#7C3AED] hover:bg-white/90">
                        <Send01 className="size-5" />
                    </button>
                </div>
            </div>
        </TicketSportsLayout>
    );
}
