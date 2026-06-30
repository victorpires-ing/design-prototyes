import { useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, InfoCircle, PlayCircle, SearchLg, XClose } from "@untitledui/icons";
import { useNavigate } from "react-router";
import { cx } from "@/utils/cx";
import { Input } from "@/components/base/input/input";
import { AcademyLayout } from "../../components/AcademyLayout";
import { CourseCard } from "../components/CourseCard";
import { CURSOS, type Curso, type Fileira, FILEIRAS } from "../data/cursos";

function Carrossel({ fileira }: { fileira: Fileira }) {
    const ref = useRef<HTMLDivElement>(null);
    const scroll = (dir: 1 | -1) => {
        ref.current?.scrollBy({ left: dir * Math.round((ref.current.clientWidth || 600) * 0.8), behavior: "smooth" });
    };
    return (
        <section className="group/row flex flex-col gap-2">
            <h2 className="px-4 text-lg font-bold text-white md:px-10">{fileira.titulo}</h2>
            <div className="relative">
                {/* setas (desktop) */}
                <button
                    type="button"
                    onClick={() => scroll(-1)}
                    aria-label="Anterior"
                    className="absolute left-0 top-0 z-10 hidden h-full w-10 items-center justify-center bg-gradient-to-r from-black/80 to-transparent text-white opacity-0 transition group-hover/row:opacity-100 md:flex"
                >
                    <ChevronLeft className="size-7" />
                </button>
                <button
                    type="button"
                    onClick={() => scroll(1)}
                    aria-label="Próximo"
                    className="absolute right-0 top-0 z-10 hidden h-full w-10 items-center justify-center bg-gradient-to-l from-black/80 to-transparent text-white opacity-0 transition group-hover/row:opacity-100 md:flex"
                >
                    <ChevronRight className="size-7" />
                </button>
                <div
                    ref={ref}
                    className="flex gap-3 overflow-x-auto scroll-smooth px-4 pb-2 md:gap-4 md:px-10 [&::-webkit-scrollbar]:hidden"
                >
                    {fileira.cursos.map((curso) => (
                        <CourseCard key={curso.id} curso={curso} className="w-[33vw] max-w-[180px] sm:w-40 md:w-44" />
                    ))}
                </div>
            </div>
        </section>
    );
}

export function Catalogo() {
    const [busca, setBusca] = useState("");
    const [buscaAberta, setBuscaAberta] = useState(false);

    const destaque = CURSOS.find((c) => c.destaque)!;

    const resultados = useMemo(() => {
        const termo = busca.trim().toLowerCase();
        if (!termo) return null;
        return CURSOS.filter((c) => `${c.titulo} ${c.instrutor}`.toLowerCase().includes(termo));
    }, [busca]);

    const campoBusca = (
        <Input size="sm" icon={SearchLg} placeholder="Buscar cursos…" value={busca} onChange={setBusca} aria-label="Buscar cursos" />
    );

    return (
        <AcademyLayout active="inicio" search={campoBusca} onSearch={() => setBuscaAberta((v) => !v)}>
            {/* Busca mobile (acionada pelo ícone do header) */}
            {buscaAberta && (
                <div className="fixed inset-x-0 top-[60px] z-40 flex items-center gap-2 bg-black/95 px-4 py-3 md:hidden">
                    <div className="flex-1">{campoBusca}</div>
                    <button
                        type="button"
                        onClick={() => {
                            setBuscaAberta(false);
                            setBusca("");
                        }}
                        aria-label="Fechar busca"
                        className="flex size-9 items-center justify-center rounded-full text-white/80 hover:bg-white/10"
                    >
                        <XClose className="size-5" />
                    </button>
                </div>
            )}

            {resultados ? (
                /* ===== Resultados da busca: grade de pôsteres ===== */
                <div className="px-4 pt-24 pb-16 md:px-10">
                    <h2 className="mb-4 text-lg font-bold text-white">
                        {resultados.length > 0 ? `Resultados para "${busca}"` : `Nada encontrado para "${busca}"`}
                    </h2>
                    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 md:gap-4">
                        {resultados.map((c) => (
                            <CourseCard key={c.id} curso={c} />
                        ))}
                    </div>
                </div>
            ) : (
                <>
                    {/* ===== HERO ===== */}
                    <Hero curso={destaque} />

                    {/* ===== Fileiras ===== */}
                    <div className="relative z-10 -mt-16 flex flex-col gap-8 pb-16 md:-mt-24 md:gap-10">
                        {FILEIRAS.filter((f) => f.cursos.length > 0).map((f) => (
                            <Carrossel key={f.titulo} fileira={f} />
                        ))}
                    </div>
                </>
            )}
        </AcademyLayout>
    );
}

function Hero({ curso }: { curso: Curso }) {
    const navigate = useNavigate();
    const abrir = () => navigate(`/ticket/ts-academy/curso/${curso.id}`);
    return (
        <section className="relative h-[78vh] min-h-[460px] w-full md:h-[88vh]">
            <img src={curso.backdrop} alt="" className="absolute inset-0 size-full object-cover" />
            <span className="absolute inset-0 bg-gradient-to-t from-[#0b0b0f] via-[#0b0b0f]/40 to-black/60" />
            <span className="absolute inset-0 bg-gradient-to-r from-[#0b0b0f]/90 via-[#0b0b0f]/30 to-transparent" />

            <div className="relative z-10 mx-auto flex h-full max-w-[1600px] items-end px-4 pb-24 md:px-10 md:pb-32">
                <div className="flex items-end gap-5">
                    {/* Pôster vertical em destaque */}
                    <div className="hidden aspect-[2/3] w-40 shrink-0 overflow-hidden rounded-xl ring-1 ring-white/15 shadow-2xl sm:block md:w-52">
                        <img src={curso.poster} alt="" className="size-full object-cover" />
                    </div>
                    <div className="flex max-w-xl flex-col gap-3">
                        <span className="w-max rounded bg-[#E50914] px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-wide text-white">
                            Em destaque
                        </span>
                        {/* Apenas nome do curso + nº de aulas */}
                        <h1 className="text-3xl font-black leading-tight text-white drop-shadow-lg md:text-5xl">{curso.titulo}</h1>
                        <span className="text-sm font-semibold text-white/80 md:text-base">{curso.aulas} aulas</span>
                        <div className="mt-1 flex flex-wrap gap-3">
                            <button
                                type="button"
                                onClick={abrir}
                                className="flex items-center gap-2 rounded-md bg-white px-6 py-2.5 text-sm font-bold text-black transition hover:bg-white/85"
                            >
                                <PlayCircle className="size-5" /> Assistir
                            </button>
                            <button
                                type="button"
                                onClick={abrir}
                                className={cx(
                                    "flex items-center gap-2 rounded-md bg-white/20 px-6 py-2.5 text-sm font-bold text-white backdrop-blur transition hover:bg-white/30",
                                )}
                            >
                                <InfoCircle className="size-5" /> Mais informações
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
