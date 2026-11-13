import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router";
import { ArrowLeft, Monitor01, Phone01 } from "@untitledui/icons";
import { cx } from "@/utils/cx";

/*
 * Desktop/Mobile do protótipo (mesmo controle flutuante da Carteira Web).
 * No mobile a página roda dentro de um iframe de 390px: os breakpoints, a barra fixa
 * e a rolagem se comportam como num celular de verdade. A escolha vale para todas
 * as páginas de Serviços adicionais e sobrevive à navegação (sessionStorage).
 */

type Vista = "desktop" | "mobile";
const CHAVE = "servicos-adicionais:vista";
const ouvintes = new Set<() => void>();
const ler = (): Vista => {
    try {
        return sessionStorage.getItem(CHAVE) === "mobile" ? "mobile" : "desktop";
    } catch {
        return "desktop";
    }
};
const definir = (v: Vista) => {
    try {
        sessionStorage.setItem(CHAVE, v);
    } catch {
        /* sem storage: vale só até recarregar */
    }
    ouvintes.forEach((o) => o());
};
const useVista = () =>
    useSyncExternalStore((fn) => {
        ouvintes.add(fn);
        return () => ouvintes.delete(fn);
    }, ler);

const MENSAGEM = "servicos-adicionais:rota";

export function VistaPrototipo({ children }: { children: ReactNode }) {
    const location = useLocation();
    const navigate = useNavigate();
    const vista = useVista();
    // Dentro do iframe do celular? (vale para qualquer rota navegada lá dentro)
    const embutido = typeof window !== "undefined" && window.self !== window.top;

    // Dentro do iframe: avisa a página de fora a cada troca de rota
    useEffect(() => {
        if (!embutido || window.parent === window) return;
        window.parent.postMessage({ tipo: MENSAGEM, rota: location.pathname + location.search }, window.location.origin);
    }, [embutido, location.pathname, location.search]);

    // Dentro do iframe: a tela rola, mas sem a barra de rolagem aparente (como num celular)
    useEffect(() => {
        if (!embutido) return;
        const estilo = document.createElement("style");
        estilo.textContent = "html{scrollbar-width:none}html::-webkit-scrollbar,body::-webkit-scrollbar{display:none}";
        document.head.appendChild(estilo);
        return () => estilo.remove();
    }, [embutido]);

    // Fora do iframe: acompanha a rota do celular, para "Desktop" abrir a mesma tela
    useEffect(() => {
        if (embutido) return;
        const aoReceber = (e: MessageEvent) => {
            if (e.origin !== window.location.origin || e.data?.tipo !== MENSAGEM) return;
            if (e.data.rota !== location.pathname + location.search) navigate(e.data.rota, { replace: true });
        };
        window.addEventListener("message", aoReceber);
        return () => window.removeEventListener("message", aoReceber);
    }, [embutido, location.pathname, location.search, navigate]);

    if (embutido) return <>{children}</>;

    return (
        <>
            {vista === "mobile" ? <Moldura /> : children}
            <Controles vista={vista} />
        </>
    );
}

/** Celular de 390 × 844 com a página dentro. O src é fixado ao abrir, para não recarregar a cada navegação. */
function Moldura() {
    const location = useLocation();
    const [src] = useState(() => location.pathname + location.search);

    return (
        <div className="flex min-h-screen items-center justify-center bg-tertiary px-4 py-10">
            <iframe
                title="Versão mobile"
                src={src}
                className="h-[844px] max-h-[calc(100vh-120px)] w-[390px] max-w-full rounded-[32px] bg-primary shadow-xl ring-8 ring-black"
            />
        </div>
    );
}

function Controles({ vista }: { vista: Vista }) {
    const navigate = useNavigate();
    const seg = "flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold transition duration-100 ease-linear";

    // Escondido em celular de verdade: lá o protótipo já é o mobile
    return (
        <div className="fixed right-6 bottom-6 z-[60] hidden sm:block">
            <div className="flex items-center gap-1 rounded-xl bg-primary p-1 shadow-lg ring-1 ring-border-secondary">
                <button
                    type="button"
                    onClick={() => navigate("/novos-negocios/servicos-adicionais")}
                    className="flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-tertiary transition duration-100 ease-linear hover:bg-secondary hover:text-secondary"
                >
                    <ArrowLeft className="size-4" />
                    <span>Ofertas</span>
                </button>
                <span aria-hidden="true" className="mx-0.5 h-5 w-px bg-border-secondary" />
                <button
                    type="button"
                    aria-pressed={vista === "desktop"}
                    onClick={() => definir("desktop")}
                    className={cx(seg, vista === "desktop" ? "bg-secondary text-primary" : "text-tertiary hover:text-secondary")}
                >
                    <Monitor01 className="size-4" /> <span>Desktop</span>
                </button>
                <button
                    type="button"
                    aria-pressed={vista === "mobile"}
                    onClick={() => definir("mobile")}
                    className={cx(seg, vista === "mobile" ? "bg-secondary text-primary" : "text-tertiary hover:text-secondary")}
                >
                    <Phone01 className="size-4" /> <span>Mobile</span>
                </button>
            </div>
        </div>
    );
}
