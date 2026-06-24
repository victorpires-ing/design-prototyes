import { useMemo, useState } from "react";
import {
    ArrowLeft,
    CheckCircle,
    Clock,
    Download01,
    File02,
    MarkerPin01,
    MessageCircle01,
    PlayCircle,
    Star01,
    VideoRecorder,
} from "@untitledui/icons";
import { useNavigate, useParams } from "react-router";
import { cx } from "@/utils/cx";
import { AcademyLayout } from "../../components/AcademyLayout";
import {
    type Aula,
    type Comentario,
    CURSOS,
    COMENTARIOS_INICIAIS,
    descricaoCurso,
    formatarDuracao,
    gerarAulas,
    gerarMateriais,
} from "../data/cursos";

const TIPO_COR: Record<string, string> = {
    PDF: "bg-[#E50914]/20 text-[#ff6b6b]",
    XLSX: "bg-emerald-500/20 text-emerald-300",
    ZIP: "bg-amber-500/20 text-amber-300",
    MP3: "bg-violet-500/20 text-violet-300",
};

export function CursoDetalhe() {
    const { id } = useParams();
    const navigate = useNavigate();
    const curso = CURSOS.find((c) => c.id === id) ?? CURSOS[0];

    const [aulas, setAulas] = useState<Aula[]>(() => gerarAulas(curso));
    const [comentarios, setComentarios] = useState<Comentario[]>(COMENTARIOS_INICIAIS);
    const [texto, setTexto] = useState("");

    const materiais = useMemo(() => gerarMateriais(curso), [curso]);

    const assistidas = aulas.filter((a) => a.assistida).length;
    const total = aulas.length;
    const progresso = total > 0 ? Math.round((assistidas / total) * 100) : 0;
    const faltam = total - assistidas;

    const toggleAula = (aulaId: string) =>
        setAulas((prev) => prev.map((a) => (a.id === aulaId ? { ...a, assistida: !a.assistida } : a)));

    const proximaAula = aulas.find((a) => !a.assistida) ?? aulas[0];

    const enviarComentario = () => {
        const t = texto.trim();
        if (!t) return;
        setComentarios((prev) => [
            { id: `co-${Date.now()}`, autor: "William Campos", iniciais: "WC", tempo: "agora", texto: t },
            ...prev,
        ]);
        setTexto("");
    };

    return (
        <AcademyLayout active="cursos">
            {/* ===== Topo com backdrop ===== */}
            <section className="relative">
                <div className="relative h-[52vh] min-h-[340px] w-full md:h-[60vh]">
                    <img src={curso.backdrop} alt="" className="absolute inset-0 size-full object-cover" />
                    <span className="absolute inset-0 bg-gradient-to-t from-[#0b0b0f] via-[#0b0b0f]/50 to-black/40" />
                    <span className="absolute inset-0 bg-gradient-to-r from-[#0b0b0f]/90 via-transparent to-transparent" />

                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="absolute left-4 top-20 z-10 flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-black/60 md:left-10"
                    >
                        <ArrowLeft className="size-4" /> Voltar
                    </button>

                    <div className="absolute inset-x-0 bottom-0 mx-auto max-w-[1600px] px-4 pb-6 md:px-10 md:pb-8">
                        <div className="flex max-w-2xl flex-col gap-3">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded bg-white/15 px-2 py-0.5 text-xs font-bold text-white backdrop-blur">{curso.nivel}</span>
                                <span className="flex items-center gap-1 text-sm font-semibold text-white/85">
                                    <Star01 className="size-4 text-[#F59E0B]" /> {curso.nota.toFixed(1)}
                                </span>
                                <span className="text-sm text-white/70">
                                    {total} {total === 1 ? "aula" : "aulas"} · {formatarDuracao(curso.duracaoMin)}
                                </span>
                            </div>
                            <h1 className="text-3xl font-black leading-tight text-white drop-shadow-lg md:text-5xl">{curso.titulo}</h1>
                            <span className="text-sm text-white/75">por {curso.instrutor}</span>

                            <div className="mt-1 flex flex-wrap items-center gap-3">
                                <button
                                    type="button"
                                    className="flex items-center gap-2 rounded-md bg-white px-6 py-2.5 text-sm font-bold text-black transition hover:bg-white/85"
                                >
                                    <PlayCircle className="size-5" />
                                    {progresso === 0 ? "Começar curso" : progresso === 100 ? "Assistir de novo" : "Continuar assistindo"}
                                </button>
                                <span className="text-sm font-semibold text-white/80">
                                    {progresso === 100 ? "Curso concluído 🎉" : `${progresso}% concluído`}
                                </span>
                            </div>

                            {/* Barra de progresso */}
                            <div className="mt-1 max-w-md">
                                <div className="h-1.5 overflow-hidden rounded-full bg-white/20">
                                    <div className="h-full rounded-full bg-[#E50914] transition-all duration-300" style={{ width: `${progresso}%` }} />
                                </div>
                                {progresso < 100 && (
                                    <span className="mt-1.5 block text-xs text-white/60">
                                        Faltam {faltam} {faltam === 1 ? "aula" : "aulas"} para concluir
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== Corpo ===== */}
            <div className="mx-auto grid max-w-[1600px] gap-8 px-4 pb-20 pt-8 md:grid-cols-[1fr_360px] md:px-10">
                {/* Coluna principal: descrição + aulas */}
                <div className="flex min-w-0 flex-col gap-8">
                    {/* Aviso: gravação de evento presencial */}
                    {(curso.categoria === "presencial" || curso.categoria === "sports-week") && curso.evento && (
                        <div className="flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                            <VideoRecorder className="mt-0.5 size-5 shrink-0 text-emerald-300" />
                            <p className="text-sm leading-relaxed text-white/85">
                                <strong className="text-white">Gravação de evento presencial.</strong> {curso.evento.data}
                                {curso.evento.cidade && (
                                    <span className="ml-1 inline-flex items-center gap-1 text-white/70">
                                        <MarkerPin01 className="size-4" /> {curso.evento.local} · {curso.evento.cidade}
                                    </span>
                                )}
                            </p>
                        </div>
                    )}

                    {/* Sobre */}
                    <section className="flex flex-col gap-2">
                        <h2 className="text-lg font-bold text-white">Sobre o curso</h2>
                        <p className="text-sm leading-relaxed text-white/70">{descricaoCurso(curso)}</p>
                    </section>

                    {/* Aulas */}
                    <section className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-white">{total === 1 ? "Aula" : `${total} aulas`}</h2>
                            <span className="text-sm text-white/55">
                                {assistidas}/{total} assistidas
                            </span>
                        </div>
                        <ul className="flex flex-col gap-2">
                            {aulas.map((a) => (
                                <li
                                    key={a.id}
                                    className={cx(
                                        "flex items-center gap-3 rounded-xl border p-3 transition duration-100",
                                        a.assistida ? "border-white/10 bg-white/[0.03]" : "border-white/10 bg-white/[0.06] hover:bg-white/[0.1]",
                                        a.id === proximaAula?.id && progresso < 100 && "ring-1 ring-[#E50914]",
                                    )}
                                >
                                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white">
                                        <PlayCircle className="size-5" />
                                    </span>
                                    <div className="flex min-w-0 flex-1 flex-col">
                                        <span className={cx("truncate text-sm font-semibold", a.assistida ? "text-white/55" : "text-white")}>
                                            {a.titulo}
                                        </span>
                                        <span className="flex items-center gap-1 text-xs text-white/45">
                                            <Clock className="size-3.5" /> {formatarDuracao(a.duracaoMin)}
                                        </span>
                                    </div>
                                    {/* Marcação de assistido */}
                                    <button
                                        type="button"
                                        onClick={() => toggleAula(a.id)}
                                        aria-label={a.assistida ? "Marcar como não assistida" : "Marcar como assistida"}
                                        className={cx(
                                            "flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition duration-100",
                                            a.assistida ? "bg-emerald-500/15 text-emerald-300" : "bg-white/10 text-white/60 hover:bg-white/20",
                                        )}
                                    >
                                        <CheckCircle className="size-4" /> {a.assistida ? "Assistida" : "Marcar"}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </section>

                    {/* Comentários */}
                    <section className="flex flex-col gap-3">
                        <h2 className="flex items-center gap-2 text-lg font-bold text-white">
                            <MessageCircle01 className="size-5" /> Comente sobre o curso
                        </h2>
                        <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/[0.04] p-3">
                            <textarea
                                value={texto}
                                onChange={(e) => setTexto(e.target.value)}
                                rows={3}
                                placeholder="Conte o que você achou do curso, tire dúvidas ou compartilhe seu progresso…"
                                className="w-full resize-none bg-transparent text-sm text-white placeholder:text-white/40 outline-none"
                            />
                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={enviarComentario}
                                    disabled={!texto.trim()}
                                    className="rounded-md bg-[#E50914] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#c40811] disabled:opacity-40"
                                >
                                    Publicar
                                </button>
                            </div>
                        </div>
                        <ul className="flex flex-col gap-3 pt-1">
                            {comentarios.map((c) => (
                                <li key={c.id} className="flex gap-3">
                                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white">
                                        {c.iniciais}
                                    </span>
                                    <div className="flex min-w-0 flex-col">
                                        <span className="text-sm font-semibold text-white">
                                            {c.autor} <span className="ml-1 text-xs font-normal text-white/45">{c.tempo}</span>
                                        </span>
                                        <p className="text-sm text-white/70">{c.texto}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </section>
                </div>

                {/* Coluna lateral: materiais para download */}
                <aside className="flex flex-col gap-3 md:sticky md:top-24 md:self-start">
                    <h2 className="flex items-center gap-2 text-lg font-bold text-white">
                        <Download01 className="size-5" /> Materiais do curso
                    </h2>
                    <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/[0.04] p-3">
                        {materiais.map((m) => (
                            <button
                                key={m.id}
                                type="button"
                                className="flex items-center gap-3 rounded-lg p-2 text-left transition duration-100 hover:bg-white/[0.06]"
                            >
                                <span className={cx("flex size-10 shrink-0 items-center justify-center rounded-lg", TIPO_COR[m.tipo])}>
                                    <File02 className="size-5" />
                                </span>
                                <div className="flex min-w-0 flex-1 flex-col">
                                    <span className="truncate text-sm font-semibold text-white">{m.nome}</span>
                                    <span className="text-xs text-white/45">
                                        {m.tipo} · {m.tamanho}
                                    </span>
                                </div>
                                <Download01 className="size-5 shrink-0 text-white/60" />
                            </button>
                        ))}
                    </div>
                </aside>
            </div>
        </AcademyLayout>
    );
}
