import { useRef, useState } from "react";
import { ArrowLeft, MarkerPin01, Minus, Plus } from "@untitledui/icons";
import { useNavigate } from "react-router";
import { TicketSportsLayout } from "../../components/TicketSportsLayout";
import { CIDADE_USUARIO, EVENTOS } from "../data/eventos";

const POS = [
    { top: "18%", left: "26%" },
    { top: "24%", left: "68%" },
    { top: "44%", left: "40%" },
    { top: "58%", left: "72%" },
    { top: "66%", left: "24%" },
    { top: "38%", left: "84%" },
];

const MIN = 1;
const MAX = 2.6;

export function MapaEventos() {
    const navigate = useNavigate();
    const abrir = (id: string) => navigate(`/ticket-sports/hub/eventos/${id}`);

    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [arrastando, setArrastando] = useState(false);
    const dragRef = useRef(false);

    const zoomIn = () => setZoom((z) => Math.min(MAX, +(z + 0.4).toFixed(2)));
    const zoomOut = () =>
        setZoom((z) => {
            const nz = Math.max(MIN, +(z - 0.4).toFixed(2));
            if (nz === 1) setPan({ x: 0, y: 0 });
            return nz;
        });

    const onDown = () => {
        if (zoom <= 1) return;
        dragRef.current = true;
        setArrastando(true);
    };
    const onMove = (e: React.PointerEvent) => {
        if (!dragRef.current) return;
        setPan((p) => ({ x: p.x + e.movementX, y: p.y + e.movementY }));
    };
    const onUp = () => {
        dragRef.current = false;
        setArrastando(false);
    };

    return (
        <TicketSportsLayout fullHeight>
            <header className="flex items-center justify-between gap-2 border-b border-secondary bg-primary px-5 py-3.5 md:rounded-t-3xl">
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        aria-label="Voltar"
                        className="flex size-9 items-center justify-center rounded-full text-fg-secondary hover:bg-secondary"
                    >
                        <ArrowLeft className="size-5" />
                    </button>
                    <h1 className="text-xl font-bold text-primary">Mapa de eventos</h1>
                </div>
                <span className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-secondary">
                    <MarkerPin01 className="size-3.5 text-[#7C3AED]" /> {CIDADE_USUARIO}
                </span>
            </header>

            <div className="relative min-h-0 flex-1 overflow-hidden md:rounded-b-3xl">
                {/* área arrastável + zoom */}
                <div
                    className="absolute inset-0 touch-none select-none"
                    style={{ cursor: zoom > 1 ? (arrastando ? "grabbing" : "grab") : "default" }}
                    onPointerDown={onDown}
                    onPointerMove={onMove}
                    onPointerUp={onUp}
                    onPointerLeave={onUp}
                >
                    <div
                        className="absolute inset-0"
                        style={{
                            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                            transformOrigin: "center",
                            transition: arrastando ? "none" : "transform 0.2s ease-out",
                            background: "linear-gradient(135deg,#EAF0F6,#E3EDF7)",
                        }}
                    >
                        <span
                            className="absolute inset-0"
                            style={{
                                backgroundImage:
                                    "linear-gradient(rgba(0,0,0,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,0.04) 1px,transparent 1px)",
                                backgroundSize: "30px 30px",
                            }}
                        />
                        <span className="absolute -left-10 top-1/3 h-3 w-[160%] -rotate-6 rounded bg-white/90" />
                        <span className="absolute left-0 top-2/3 h-2.5 w-full rotate-3 rounded bg-white/80" />
                        <span className="absolute left-1/3 top-[-20%] h-[160%] w-3 rotate-12 rounded bg-white/90" />
                        <span className="absolute right-10 top-[-10%] h-[140%] w-2 -rotate-12 rounded bg-white/70" />
                        <span className="absolute right-8 top-10 size-24 rounded-3xl bg-[#BBE3BD]/70" />
                        <span className="absolute bottom-24 left-6 size-20 rounded-3xl bg-[#BBE3BD]/60" />

                        {/* você */}
                        <span className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
                            <span className="relative flex size-5 items-center justify-center">
                                <span className="absolute inline-flex size-9 animate-ping rounded-full bg-[#3B82F6] opacity-40" />
                                <span className="relative size-5 rounded-full bg-[#3B82F6] ring-2 ring-white" />
                            </span>
                            <span className="mt-1 rounded-full bg-white/90 px-2 text-[11px] font-semibold text-[#1f1f1f]">Você</span>
                        </span>

                        {/* pins */}
                        {EVENTOS.map((e, idx) => {
                            const pos = POS[idx % POS.length];
                            return (
                                <button key={e.id} type="button" onClick={() => abrir(e.id)} className="absolute -translate-x-1/2 -translate-y-full" style={pos}>
                                    <span className="flex size-10 items-center justify-center rounded-full bg-white text-lg shadow-md ring-2 ring-[#7C3AED]">
                                        {e.emoji}
                                    </span>
                                    <span className="mx-auto -mt-0.5 size-2.5 rotate-45 bg-white shadow-md" />
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* controles de zoom */}
                <div className="absolute right-3 top-3 flex flex-col overflow-hidden rounded-xl bg-primary shadow-lg ring-1 ring-border-secondary">
                    <button
                        type="button"
                        onClick={zoomIn}
                        aria-label="Aproximar"
                        className="flex size-10 items-center justify-center text-fg-secondary transition hover:bg-secondary disabled:opacity-40"
                        disabled={zoom >= MAX}
                    >
                        <Plus className="size-5" />
                    </button>
                    <span className="h-px bg-border-secondary" />
                    <button
                        type="button"
                        onClick={zoomOut}
                        aria-label="Afastar"
                        className="flex size-10 items-center justify-center text-fg-secondary transition hover:bg-secondary disabled:opacity-40"
                        disabled={zoom <= MIN}
                    >
                        <Minus className="size-5" />
                    </button>
                </div>

                {/* carrossel inferior */}
                <div className="absolute inset-x-0 bottom-3 flex gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {EVENTOS.map((e) => (
                        <button
                            key={e.id}
                            type="button"
                            onClick={() => abrir(e.id)}
                            className="flex w-60 shrink-0 items-center gap-3 rounded-2xl bg-primary p-2.5 text-left shadow-lg ring-1 ring-border-secondary"
                        >
                            <img src={e.imagem} alt="" className="size-14 shrink-0 rounded-xl object-cover" />
                            <div className="flex min-w-0 flex-1 flex-col">
                                <span className="truncate text-sm font-bold text-primary">{e.titulo}</span>
                                <span className="truncate text-xs text-tertiary">{e.data}</span>
                                <span className="text-xs font-semibold text-[#7C3AED]">{e.distancia}</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </TicketSportsLayout>
    );
}
