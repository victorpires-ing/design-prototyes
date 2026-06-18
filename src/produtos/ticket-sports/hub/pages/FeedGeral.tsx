import { useMemo, useState } from "react";
import { Edit05, Rss01, SearchLg } from "@untitledui/icons";
import { useNavigate } from "react-router";
import { cx } from "@/utils/cx";
import { TicketSportsLayout } from "../../components/TicketSportsLayout";
import { Bloco } from "../components/Bloco";
import { HubTabBar } from "../components/HubTabBar";
import { PostCard, type MuralItem } from "../components/PostCard";
import { FEED } from "../data/comunidade";
import { FEED_GERAL, GRUPOS, MINHA_CONQUISTA } from "../data/home";
import { USUARIOS } from "../data/usuarios";

const fotoDe = (nome: string) => USUARIOS.find((u) => u.nome === nome)?.foto;
const idDe = (nome: string) => USUARIOS.find((u) => u.nome === nome)?.id;

type Filtro = "todas" | "pessoas" | "comunidades" | "grupos";
const FILTROS: { id: Filtro; label: string }[] = [
    { id: "todas", label: "Todas" },
    { id: "pessoas", label: "Pessoas" },
    { id: "comunidades", label: "Comunidades" },
    { id: "grupos", label: "Grupos" },
];

export function FeedGeral() {
    const navigate = useNavigate();
    const [busca, setBusca] = useState("");
    const [filtro, setFiltro] = useState<Filtro>("todas");

    const pessoas = useMemo(
        () => USUARIOS.filter((u) => u.nome.toLowerCase().includes(busca.trim().toLowerCase())),
        [busca],
    );

    // Pessoas (PF)
    const pf = useMemo<MuralItem[]>(
        () =>
            FEED_GERAL.map((p) => ({
                key: `pf-${p.id}`,
                tipo: "pf",
                nome: p.autor,
                foto: fotoDe(p.autor),
                inicial: p.inicial,
                subtitulo: p.tempo,
                texto: p.texto,
                imagem: p.foto,
                curtidas: p.curtidas,
                comentarios: p.comentarios,
                onOpen: () => {
                    const id = idDe(p.autor);
                    if (id) navigate(`/ticket-sports/hub/feed/usuario/${id}`);
                },
            })),
        [navigate],
    );

    // Comunidades (PJ)
    const pj = useMemo<MuralItem[]>(
        () =>
            FEED.map((p) => ({
                key: `pj-${p.comunidadeId}-${p.id}`,
                tipo: "pj",
                nome: p.comunidadeNome,
                foto: p.comunidadeLogo,
                inicial: p.comunidadeNome.charAt(0),
                subtitulo: `${p.autor} · ${p.tempo}`,
                texto: p.texto,
                imagem: p.foto,
                curtidas: p.curtidas,
                comentarios: p.comentarios,
                onOpen: () => navigate(`/ticket-sports/hub/comunidades/${p.comunidadeId}`),
            })),
        [navigate],
    );

    // Recados dos grupos que participo
    const grupos = useMemo<MuralItem[]>(
        () =>
            GRUPOS.flatMap((g) =>
                g.recados.map((r) => ({
                    key: `grupo-${g.id}-${r.id}`,
                    tipo: "grupo" as const,
                    nome: g.nome,
                    foto: g.logo,
                    inicial: g.nome.charAt(0),
                    subtitulo: r.tempo,
                    texto: r.texto,
                    onOpen: () => navigate(`/ticket-sports/hub/grupos/${g.id}`),
                })),
            ),
        [navigate],
    );

    const lista = useMemo<MuralItem[]>(() => {
        if (filtro === "pessoas") return pf;
        if (filtro === "comunidades") return pj;
        if (filtro === "grupos") return grupos;
        // Todas — intercala os três tipos
        const out: MuralItem[] = [];
        const max = Math.max(pf.length, pj.length, grupos.length);
        for (let k = 0; k < max; k++) {
            if (pf[k]) out.push(pf[k]);
            if (pj[k]) out.push(pj[k]);
            if (grupos[k]) out.push(grupos[k]);
        }
        return out;
    }, [filtro, pf, pj, grupos]);

    return (
        <TicketSportsLayout fullHeight>
            <header className="flex items-center justify-between gap-3 border-b border-secondary bg-primary px-5 py-3.5 md:rounded-t-3xl">
                <h1 className="text-xl font-bold text-primary">Mural</h1>
                <button
                    type="button"
                    onClick={() => navigate("/ticket-sports/hub/feed/novo")}
                    aria-label="Compartilhar conteúdo"
                    className="relative flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-[#7C3AED] to-[#D946EF] text-white shadow-md transition hover:opacity-90"
                >
                    <span className="absolute inset-0 animate-ping rounded-full bg-[#7C3AED] opacity-30" />
                    <Edit05 className="relative size-5" />
                </button>
            </header>

            <main className="hub-rise flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-5 pb-28 [&>*]:shrink-0">
                {/* Buscar pessoas */}
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

                {/* Filtro */}
                <div className="-mx-5 flex gap-2 overflow-x-auto px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {FILTROS.map((f) => (
                        <button
                            key={f.id}
                            type="button"
                            onClick={() => setFiltro(f.id)}
                            className={cx(
                                "shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition duration-100",
                                filtro === f.id ? "border-[#7C3AED] bg-[#7C3AED] text-white" : "border-secondary text-secondary",
                            )}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                {/* Celebraram sua conquista do mês */}
                {filtro === "todas" && MINHA_CONQUISTA.concluida && MINHA_CONQUISTA.celebradoPor.length > 0 && (
                    <div className="flex flex-col gap-3 rounded-2xl border border-[#7C3AED]/30 bg-gradient-to-br from-[#7C3AED]/10 to-[#D946EF]/10 p-4">
                        <div className="flex items-center gap-2">
                            <span className="text-xl leading-none">🎉</span>
                            <span className="text-sm font-bold text-primary">Celebraram sua conquista!</span>
                        </div>
                        <p className="text-sm text-secondary">
                            Você concluiu <span className="font-semibold text-primary">100% da rotina</span> em {MINHA_CONQUISTA.mes}. Mandou muito! 🏆
                        </p>
                        <div className="flex items-center gap-2.5">
                            <div className="flex -space-x-2.5">
                                {MINHA_CONQUISTA.celebradoPor.map((c, idx) => (
                                    <img key={idx} src={c.foto} alt="" className="size-9 rounded-full object-cover ring-2 ring-primary" />
                                ))}
                            </div>
                            <span className="text-xs text-tertiary">
                                {MINHA_CONQUISTA.celebradoPor
                                    .map((c) => c.nome.split(" ")[0])
                                    .join(", ")
                                    .replace(/, ([^,]*)$/, " e $1")}{" "}
                                celebraram você
                            </span>
                        </div>
                    </div>
                )}

                {/* Lista filtrada */}
                <Bloco icon={Rss01} titulo="Publicações">
                    {lista.map((item) => (
                        <PostCard key={item.key} item={item} />
                    ))}
                    {lista.length === 0 && (
                        <p className="py-10 text-center text-sm text-tertiary">
                            {filtro === "grupos" ? "Nenhum recado dos seus grupos por aqui." : "Nada por aqui ainda."}
                        </p>
                    )}
                </Bloco>
            </main>

            <HubTabBar active="feed" />
        </TicketSportsLayout>
    );
}
