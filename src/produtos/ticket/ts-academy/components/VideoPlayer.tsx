import { useEffect, useRef, useState } from "react";
import { CheckCircle, Maximize01, Play, SkipBack, SkipForward, VolumeMax, XClose } from "@untitledui/icons";
import { cx } from "@/utils/cx";
import type { Aula, Curso } from "../data/cursos";

interface VideoPlayerProps {
    curso: Curso;
    aula: Aula;
    temProxima: boolean;
    onConcluir: (aulaId: string) => void;
    onProxima: () => void;
    onClose: () => void;
}

const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
};

/** Player de vídeo simulado: a "reprodução" avança a barra de progresso ao longo do tempo. */
export function VideoPlayer({ curso, aula, temProxima, onConcluir, onProxima, onClose }: VideoPlayerProps) {
    const totalSeg = aula.duracaoMin * 60;
    const [tocando, setTocando] = useState(true);
    const [progresso, setProgresso] = useState(0); // 0..1
    const [concluida, setConcluida] = useState(false);
    const [controlesVisiveis, setControlesVisiveis] = useState(true);
    const ocultarRef = useRef<number | null>(null);

    // Reprodução simulada: a aula inteira "roda" em ~24s, independente da duração real.
    useEffect(() => {
        if (!tocando || concluida) return;
        const passo = 1 / (24 * 5); // 5 ticks/s durante ~24s
        const t = window.setInterval(() => {
            setProgresso((p) => {
                const np = p + passo;
                if (np >= 1) {
                    window.clearInterval(t);
                    setTocando(false);
                    setConcluida(true);
                    onConcluir(aula.id);
                    return 1;
                }
                return np;
            });
        }, 200);
        return () => window.clearInterval(t);
    }, [tocando, concluida, aula.id, onConcluir]);

    const mostrarControles = () => {
        setControlesVisiveis(true);
        if (ocultarRef.current) window.clearTimeout(ocultarRef.current);
        ocultarRef.current = window.setTimeout(() => setControlesVisiveis(false), 2600);
    };

    const seek = (e: React.MouseEvent<HTMLDivElement>) => {
        const r = e.currentTarget.getBoundingClientRect();
        const p = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
        setProgresso(p);
        if (p < 1) setConcluida(false);
    };

    const segAtual = progresso * totalSeg;

    return (
        <div className="fixed inset-0 z-[60] flex flex-col bg-black" onMouseMove={mostrarControles}>
            {/* Área de vídeo (imagem do curso como "frame") */}
            <button
                type="button"
                onClick={() => {
                    setTocando((v) => !v);
                    if (concluida) {
                        setProgresso(0);
                        setConcluida(false);
                    }
                    mostrarControles();
                }}
                className="relative flex flex-1 items-center justify-center overflow-hidden"
            >
                <img src={curso.backdrop} alt="" className={cx("absolute inset-0 size-full object-cover transition", tocando ? "opacity-50" : "opacity-30")} />
                <span className="absolute inset-0 bg-black/30" />

                {/* Overlay central */}
                {concluida ? (
                    <div className="relative z-10 flex flex-col items-center gap-3 text-center">
                        <CheckCircle className="size-14 text-emerald-400" />
                        <span className="text-lg font-bold text-white">Aula concluída!</span>
                        <div className="flex gap-2">
                            {temProxima && (
                                <span
                                    role="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onProxima();
                                    }}
                                    className="flex items-center gap-1.5 rounded-md bg-white px-4 py-2 text-sm font-bold text-black"
                                >
                                    <SkipForward className="size-4" /> Próxima aula
                                </span>
                            )}
                            <span
                                role="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setProgresso(0);
                                    setConcluida(false);
                                    setTocando(true);
                                }}
                                className="rounded-md bg-white/15 px-4 py-2 text-sm font-bold text-white backdrop-blur"
                            >
                                Assistir de novo
                            </span>
                        </div>
                    </div>
                ) : (
                    !tocando && (
                        <span className="relative z-10 flex size-20 items-center justify-center rounded-full bg-white/90 text-black">
                            <Play className="size-9" />
                        </span>
                    )
                )}

                {/* "AO VIVO/SIMULAÇÃO" selo */}
                <span className="absolute left-4 top-4 z-10 rounded bg-black/50 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-white/80 backdrop-blur">
                    Prévia simulada
                </span>
            </button>

            {/* Barra superior */}
            <div
                className={cx(
                    "pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-3 bg-gradient-to-b from-black/80 to-transparent p-4 transition-opacity duration-300",
                    controlesVisiveis ? "opacity-100" : "opacity-0",
                )}
            >
                <div className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-bold text-white">{curso.titulo}</span>
                    <span className="truncate text-xs text-white/60">{aula.titulo}</span>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Fechar player"
                    className="pointer-events-auto flex size-9 items-center justify-center rounded-full bg-black/40 text-white transition hover:bg-black/70"
                >
                    <XClose className="size-5" />
                </button>
            </div>

            {/* Controles inferiores */}
            <div
                className={cx(
                    "absolute inset-x-0 bottom-0 z-20 flex flex-col gap-2 bg-gradient-to-t from-black/90 to-transparent px-4 pb-4 pt-10 transition-opacity duration-300",
                    controlesVisiveis ? "opacity-100" : "opacity-0",
                )}
            >
                {/* Timeline */}
                <div className="group flex cursor-pointer items-center" onClick={seek}>
                    <div className="relative h-1.5 w-full rounded-full bg-white/25">
                        <div className="absolute inset-y-0 left-0 rounded-full bg-[#E50914]" style={{ width: `${progresso * 100}%` }} />
                        <span
                            className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#E50914] opacity-0 transition group-hover:opacity-100"
                            style={{ left: `${progresso * 100}%` }}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-4 text-white">
                    <button type="button" onClick={() => setTocando((v) => !v)} aria-label={tocando ? "Pausar" : "Reproduzir"}>
                        {tocando ? (
                            <span className="flex gap-1">
                                <span className="h-5 w-1.5 rounded-sm bg-white" />
                                <span className="h-5 w-1.5 rounded-sm bg-white" />
                            </span>
                        ) : (
                            <Play className="size-6" />
                        )}
                    </button>
                    <button type="button" onClick={() => setProgresso((p) => Math.max(0, p - 10 / totalSeg))} aria-label="Voltar 10s">
                        <SkipBack className="size-5" />
                    </button>
                    <button
                        type="button"
                        onClick={() => temProxima && onProxima()}
                        aria-label="Próxima aula"
                        className={cx(!temProxima && "opacity-40")}
                    >
                        <SkipForward className="size-5" />
                    </button>
                    <span className="text-xs font-medium tabular-nums text-white/80">
                        {fmt(segAtual)} / {fmt(totalSeg)}
                    </span>
                    <div className="ml-auto flex items-center gap-4">
                        <VolumeMax className="size-5 text-white/80" />
                        <Maximize01 className="size-5 text-white/80" />
                    </div>
                </div>
            </div>
        </div>
    );
}
