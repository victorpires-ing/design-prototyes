import { AcademyLayout, type AcademySection } from "../../components/AcademyLayout";
import { CourseCard } from "../components/CourseCard";
import { CATEGORIAS, eventosAbertos, gravacoes } from "../data/cursos";

interface SecaoProps {
    categoria: "presencial" | "sports-week";
}

export function Secao({ categoria }: SecaoProps) {
    const meta = CATEGORIAS.find((c) => c.id === categoria);
    const abertos = eventosAbertos(categoria);
    const cursos = gravacoes(categoria);
    const active: AcademySection = categoria === "sports-week" ? "sports-week" : "presencial";

    return (
        <AcademyLayout active={active}>
            <div className="mx-auto flex max-w-[1600px] flex-col gap-10 px-4 pb-20 pt-24 md:px-10">
                <header className="flex flex-col gap-2">
                    <h1 className="text-3xl font-black text-white md:text-5xl">
                        {meta?.emoji} {meta?.label}
                    </h1>
                    <p className="max-w-2xl text-sm text-white/65 md:text-base">
                        Participe ao vivo dos eventos presenciais. Depois que o evento acontece, a gravação completa vira um curso aqui na
                        plataforma — disponível para quem se inscreveu.
                    </p>
                </header>

                {abertos.length > 0 && (
                    <section className="flex flex-col gap-4">
                        <h2 className="text-lg font-bold text-white">Inscrições abertas</h2>
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
                            {abertos.map((c) => (
                                <CourseCard key={c.id} curso={c} />
                            ))}
                        </div>
                    </section>
                )}

                {cursos.length > 0 && (
                    <section className="flex flex-col gap-4">
                        <h2 className="text-lg font-bold text-white">Gravações disponíveis</h2>
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
                            {cursos.map((c) => (
                                <CourseCard key={c.id} curso={c} />
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </AcademyLayout>
    );
}
