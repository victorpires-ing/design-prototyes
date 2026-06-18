import { useState } from "react";
import { Announcement01, ArrowLeft, Check, Image01, LayoutAlt01, MarkerPin01, Users03 } from "@untitledui/icons";
import { useNavigate, useParams } from "react-router";
import { cx } from "@/utils/cx";
import { TicketSportsLayout } from "../../components/TicketSportsLayout";
import { Bloco } from "../components/Bloco";
import { HubButton, HubTextarea } from "../components/hub-ui";
import { GRUPOS, type Recado } from "../data/home";

export function DetalhesGrupo() {
    const navigate = useNavigate();
    const { id } = useParams();
    const grupo = GRUPOS.find((g) => g.id === id);

    const [participando, setParticipando] = useState(false);
    const [recados, setRecados] = useState<Recado[]>(grupo?.recados ?? []);
    const [novoRecado, setNovoRecado] = useState("");

    if (!grupo) {
        return (
            <TicketSportsLayout>
                <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
                    <p className="text-md text-tertiary">Grupo não encontrado.</p>
                    <HubButton variant="secondary" onClick={() => navigate("/ticket-sports/hub/grupos")}>
                        Voltar para grupos
                    </HubButton>
                </div>
            </TicketSportsLayout>
        );
    }

    const enviarRecado = () => {
        if (!novoRecado.trim()) return;
        setRecados((prev) => [{ id: `novo-${prev.length}`, texto: novoRecado.trim(), tempo: "agora" }, ...prev]);
        setNovoRecado("");
    };

    return (
        <TicketSportsLayout>
            <div className="flex flex-1 flex-col px-6 pt-8 pb-10">
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="flex w-max items-center gap-1.5 text-sm font-semibold text-[#7C3AED]"
                >
                    <ArrowLeft className="size-4" />
                    Voltar
                </button>

                {/* Cabeçalho do grupo */}
                <div className="mt-4 flex flex-col items-center text-center">
                    <img src={grupo.logo} alt="" className="size-20 rounded-2xl object-cover" />
                    <h1 className="mt-3 text-display-xs font-bold text-primary">{grupo.nome}</h1>
                    <p className="mt-1 text-sm text-tertiary">
                        {grupo.membros} membros · {grupo.atividade}
                    </p>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-tertiary">
                        <MarkerPin01 className="size-4 text-fg-quaternary" /> {grupo.local}
                    </p>
                </div>

                <div className="mt-5">
                    {participando ? (
                        <HubButton variant="secondary" iconLeading={Check} onClick={() => setParticipando(false)}>
                            Participando
                        </HubButton>
                    ) : (
                        <HubButton onClick={() => setParticipando(true)}>Participar</HubButton>
                    )}
                </div>

                <div className="mt-8 flex flex-col gap-4">
                    {/* Sobre */}
                    <Bloco icon={LayoutAlt01} titulo="Sobre">
                        <p className="rounded-2xl border border-secondary bg-primary p-4 text-md leading-snug text-secondary">{grupo.descricao}</p>
                    </Bloco>

                    {/* Galeria de fotos */}
                    <Bloco icon={Image01} titulo="Galeria de fotos">
                        <div className="grid grid-cols-3 gap-2">
                            {Array.from({ length: 6 }, (_, i) => (
                                <img
                                    key={i}
                                    src={`https://picsum.photos/seed/grupo-${grupo.id}-${i}/300/300`}
                                    alt={`Foto ${i + 1} do grupo ${grupo.nome}`}
                                    className="aspect-square w-full rounded-xl object-cover"
                                />
                            ))}
                        </div>
                    </Bloco>

                    {/* Recados */}
                    <Bloco icon={Announcement01} titulo="Recados">
                        {grupo.souCriador ? (
                            <div className="flex flex-col gap-2">
                                <HubTextarea
                                    label=""
                                    placeholder="Escreva um recado para o grupo…"
                                    value={novoRecado}
                                    onChange={setNovoRecado}
                                    rows={2}
                                />
                                <div className="self-end">
                                    <button
                                        type="button"
                                        onClick={enviarRecado}
                                        disabled={!novoRecado.trim()}
                                        className="rounded-lg bg-[#7C3AED] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#6D28D9] disabled:bg-[#C4B5FD]"
                                    >
                                        Enviar recado
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <p className="rounded-2xl border border-secondary bg-primary p-4 text-sm text-tertiary">Apenas o criador do grupo pode enviar recados.</p>
                        )}

                        {recados.length === 0 ? (
                            <p className="rounded-2xl border border-secondary bg-primary p-4 text-sm text-tertiary">Nenhum recado ainda.</p>
                        ) : (
                            recados.map((r) => (
                                <div key={r.id} className="flex flex-col gap-1 rounded-xl border border-secondary bg-primary p-3.5">
                                    <span className="text-xs font-semibold text-[#7C3AED]">
                                        {grupo.criador.nome} · {r.tempo}
                                    </span>
                                    <p className="text-sm text-secondary">{r.texto}</p>
                                </div>
                            ))
                        )}
                    </Bloco>

                    {/* Participantes */}
                    <Bloco icon={Users03} titulo={`Participantes (${grupo.participantes.length})`}>
                        <div className="flex flex-col gap-3 rounded-2xl border border-secondary bg-primary p-4">
                            {grupo.participantes.map((p, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <span className={cx("flex size-10 items-center justify-center rounded-full bg-[#7C3AED] font-bold text-white")}>
                                        {p.inicial}
                                    </span>
                                    <span className="text-sm font-medium text-primary">{p.nome}</span>
                                </div>
                            ))}
                        </div>
                    </Bloco>
                </div>
            </div>
        </TicketSportsLayout>
    );
}
