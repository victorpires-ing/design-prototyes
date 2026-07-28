import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Camera01, ChevronLeft, MarkerPin01, Wifi, Zap } from "@untitledui/icons";
import { AppShell } from "../../components/AppShell";
import { GradientFill } from "../../components/GradientFill";
import logoIngresse from "../../assets/Company logo-dark-mode.png";
import wallpaper from "../../assets/wallpaper.avif";

const START = 45 * 60 + 17; // 45:17
const TOTAL = 2890; // define o preenchimento inicial da barra (~6%)

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

export function TelaBloqueadaIphone() {
    const navigate = useNavigate();
    const [restante, setRestante] = useState(START);

    // Atividade ao Vivo: contagem regressiva até o início da sessão.
    useEffect(() => {
        const id = setInterval(() => setRestante((r) => (r > 0 ? r - 1 : 0)), 1000);
        return () => clearInterval(id);
    }, []);

    const progresso = Math.min(100, Math.max(4, ((TOTAL - restante) / TOTAL) * 100));

    return (
        <AppShell showTabBar={false}>
        <div className="relative flex min-h-full flex-col overflow-hidden text-white select-none">
            {/* Papel de parede */}
            <img src={wallpaper} alt="" aria-hidden="true" className="absolute inset-0 z-0 h-full w-full object-cover" />
            <div
                className="absolute inset-0 z-[1]"
                style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.08) 30%, rgba(0,0,0,0.12) 62%, rgba(0,0,0,0.38) 100%)" }}
            />

            {/* Voltar (controle do protótipo) */}
            <button
                type="button"
                aria-label="Voltar"
                onClick={() => navigate("/ingresse-app/perfil")}
                className="absolute left-3 top-14 z-30 flex size-9 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition active:bg-white/25"
            >
                <ChevronLeft className="size-5" />
            </button>

            {/* Status bar */}
            <div className="relative z-10 flex items-center justify-between px-8 pt-3.5 text-[15px] font-semibold">
                <span>9:41</span>
                <div className="flex items-center gap-1.5">
                    <SignalBars />
                    <Wifi className="size-[17px]" />
                    <Battery />
                </div>
            </div>
            {/* Dynamic island */}
            <div className="absolute left-1/2 top-2.5 z-20 h-8 w-28 -translate-x-1/2 rounded-full bg-black" />

            {/* Relógio */}
            <div className="relative z-10 pt-6 text-center [text-shadow:0_1px_16px_rgba(0,0,0,0.25)]">
                <p className="text-xl font-semibold text-white/95">Qua. 13 de mai.</p>
                <p className="mt-1 text-[92px] leading-none font-semibold tracking-tight">9:41</p>
            </div>

            <div className="flex-1" />

            {/* Live Activity + prompt */}
            <div className="relative z-10 px-3 pb-3">
                {/* Widget da Atividade ao Vivo — vidro translúcido (fundo sempre transparente) */}
                <div className="rounded-[26px] bg-black/30 p-4 shadow-2xl ring-1 ring-white/10 backdrop-blur-2xl">
                    <div className="flex gap-4">
                        <div className="flex min-w-0 flex-1 flex-col">
                            <IngressoLogo />
                            <p className="mt-3 text-2xl font-bold tracking-tight text-white">Arena Brasileira</p>
                            <p className="mt-1 flex items-center gap-1.5 text-[15px] text-white/70">
                                <MarkerPin01 className="size-4 shrink-0" />
                                Parque Ibirapuera • São Paulo/SP
                            </p>

                            <div className="mt-3.5 h-1.5 w-full overflow-hidden rounded-full bg-white/20">
                                <div className="h-full rounded-full bg-[#ff271a] transition-all duration-1000 ease-linear" style={{ width: `${progresso}%` }} />
                            </div>
                            <div className="mt-2 flex items-end justify-between gap-2">
                                <p className="text-[15px]">
                                    <span className="font-semibold text-[#ff271a] tabular-nums">{fmt(restante)}</span>{" "}
                                    <span className="text-white/60">até o evento começar</span>
                                </p>
                                <p className="text-[15px] font-medium text-white/85 tabular-nums">20:35</p>
                            </div>
                        </div>

                        <Poster />
                    </div>
                </div>
            </div>

            {/* Ações inferiores + indicador de home */}
            <div className="relative z-10 flex items-center justify-between px-11 pb-3">
                <span className="flex size-12 items-center justify-center rounded-full bg-black/35 backdrop-blur">
                    <Zap className="size-6 text-white" />
                </span>
                <span className="flex size-12 items-center justify-center rounded-full bg-black/35 backdrop-blur">
                    <Camera01 className="size-6 text-white" />
                </span>
            </div>
            <div className="relative z-10 mx-auto mb-2 h-[5px] w-32 rounded-full bg-white/85" />
        </div>
        </AppShell>
    );
}

/* Logo Ingresse (dark mode) — o widget tem fundo escuro translúcido. */
const IngressoLogo = () => <img src={logoIngresse} alt="Ingresse" className="h-5 w-auto self-start object-contain" />;

/* "Foto" do evento — cor sólida, como nos demais eventos do app. */
const Poster = () => (
    <div className="h-[104px] w-[74px] shrink-0 overflow-hidden rounded-xl ring-1 ring-white/10">
        <GradientFill gradient="linear-gradient(150deg,#16a34a,#84cc16)" />
    </div>
);

const SignalBars = () => (
    <span className="flex items-end gap-[2px]">
        {[7, 10, 13, 16].map((h, i) => (
            <span key={i} className="w-[3px] rounded-[1px] bg-white" style={{ height: h, opacity: i < 2 ? 1 : 0.4 }} />
        ))}
    </span>
);

const Battery = () => (
    <span className="ml-0.5 flex items-center">
        <span className="relative h-[13px] w-[24px] rounded-[4px] ring-[1.5px] ring-white/50">
            <span className="absolute inset-[2px] rounded-[2px] bg-white" />
        </span>
        <span className="ml-[1px] h-[5px] w-[2px] rounded-r bg-white/50" />
    </span>
);
