import { useEffect, useState } from "react";
import { CHECKINS_AOVIVO, CHECKINS_TOTAL } from "../data/home";

export function CheckinsAoVivo() {
    const [i, setI] = useState(0);

    useEffect(() => {
        const id = setInterval(() => setI((v) => (v + 1) % CHECKINS_AOVIVO.length), 2600);
        return () => clearInterval(id);
    }, []);

    const c = CHECKINS_AOVIVO[i];

    return (
        <div className="relative mx-5 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-[#7C3AED] via-[#9333EA] to-[#D946EF] p-4 text-white shadow-lg">
            {/* enfeites festivos */}
            <span className="pointer-events-none absolute -right-1 top-1 animate-bounce text-2xl opacity-90">🎉</span>
            <span className="pointer-events-none absolute bottom-2 right-12 animate-pulse text-lg opacity-80">✨</span>
            <span className="pointer-events-none absolute -bottom-2 left-24 animate-pulse text-base opacity-70">🔥</span>

            <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-xs font-bold tracking-wide">
                    <span className="relative flex size-2">
                        <span className="absolute inline-flex size-full animate-ping rounded-full bg-white opacity-75" />
                        <span className="relative inline-flex size-2 rounded-full bg-white" />
                    </span>
                    AO VIVO
                </span>
                <span className="text-xs font-semibold text-white/90">{CHECKINS_TOTAL} check-ins hoje 🙌</span>
            </div>

            <div key={i} className="mt-3 flex items-center gap-3 duration-500 animate-in fade-in slide-in-from-bottom-2">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/25 font-bold">{c.inicial}</span>
                <p className="text-sm font-semibold leading-snug">
                    <span className="font-extrabold">{c.nome}</span> acabou de fazer check-in · {c.atividade} {c.emoji}
                </p>
            </div>
        </div>
    );
}
