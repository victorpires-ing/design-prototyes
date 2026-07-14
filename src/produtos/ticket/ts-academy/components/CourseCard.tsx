import { Calendar, PlayCircle } from "@untitledui/icons";
import { useNavigate } from "react-router";
import { cx } from "@/utils/cx";
import { type Curso, ehAnuncio } from "../data/cursos";

interface CourseCardProps {
    curso: Curso;
    className?: string;
}

/** Pôster vertical estilo streaming: imagem 2:3, nome do curso e nº de aulas (ou data, se for anúncio). */
export function CourseCard({ curso, className }: CourseCardProps) {
    const navigate = useNavigate();
    const anuncio = ehAnuncio(curso);
    const destino = anuncio ? `/ticket/ts-academy/evento/${curso.id}` : `/ticket/ts-academy/curso/${curso.id}`;
    const gravacao = curso.estado === "curso" && (curso.categoria === "presencial" || curso.categoria === "sports-week");

    return (
        <button
            type="button"
            onClick={() => navigate(destino)}
            className={cx(
                "group flex w-full shrink-0 flex-col text-left transition duration-200 hover:-translate-y-1 focus:outline-none",
                className,
            )}
        >
            <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl ring-1 ring-white/10 transition duration-200 group-hover:ring-2 group-hover:ring-white/60">
                <img src={curso.poster} alt="" className="size-full object-cover transition duration-300 group-hover:scale-105" />
                <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                {anuncio && (
                    <span className="absolute left-2 top-2 flex items-center gap-1 rounded bg-[#E50914] px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-white">
                        Inscrições abertas
                    </span>
                )}
                {!anuncio && gravacao && (
                    <span className="absolute left-2 top-2 rounded bg-emerald-500 px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-white">
                        Gravação
                    </span>
                )}
                {!anuncio && !gravacao && curso.novo && (
                    <span className="absolute left-2 top-2 rounded bg-[#E50914] px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-white">
                        Novo
                    </span>
                )}

                <span className="absolute inset-0 flex items-center justify-center opacity-0 transition duration-200 group-hover:opacity-100">
                    <span className="flex size-12 items-center justify-center rounded-full bg-white/90 text-black">
                        <PlayCircle className="size-7" />
                    </span>
                </span>
            </div>
            <h3 className="mt-2 line-clamp-2 text-sm font-bold leading-snug text-white">{curso.titulo}</h3>
            {anuncio && curso.evento ? (
                <span className="flex items-center gap-1 text-xs text-white/55">
                    <Calendar className="size-3.5" /> {curso.evento.data}
                </span>
            ) : (
                <span className="text-xs text-white/55">{curso.aulas} aulas</span>
            )}
        </button>
    );
}
