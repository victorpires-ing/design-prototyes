import { File02 } from "@untitledui/icons";
import type { Solicitacao } from "../data/solicitacoes";

type Anexo = Solicitacao["anexos"][number];

/** Tipo do anexo a partir da extensão do arquivo. */
export const tipoAnexo = (nome: string): "imagem" | "documento" => {
    const ext = nome.split(".").pop()?.toLowerCase() ?? "";
    return ["jpg", "jpeg", "png", "gif", "webp"].includes(ext) ? "imagem" : "documento";
};

/** Preview "foto" mock (data URI SVG) — representa o conteúdo de um anexo de imagem. */
export const fotoPlaceholder = (nome: string) => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
        <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#7f56d9"/><stop offset="1" stop-color="#1570ef"/>
        </linearGradient></defs>
        <rect width="800" height="600" fill="url(#g)"/>
        <circle cx="620" cy="140" r="70" fill="#ffffff" opacity="0.85"/>
        <path d="M0 600 L240 320 L420 470 L600 250 L800 460 L800 600 Z" fill="#0f172a" opacity="0.45"/>
        <path d="M0 600 L180 420 L360 540 L560 380 L800 560 L800 600 Z" fill="#0f172a" opacity="0.7"/>
    </svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

/** Visualização de um único anexo (imagem ou documento mock). */
export function AnexoPreview({ anexo }: { anexo?: Anexo }) {
    if (!anexo) {
        return <p className="text-sm text-tertiary">Nenhum anexo enviado nesta solicitação.</p>;
    }
    if (tipoAnexo(anexo.nome) === "imagem") {
        return (
            <img
                src={fotoPlaceholder(anexo.nome)}
                alt={anexo.nome}
                className="max-h-full max-w-full rounded-lg object-contain shadow-lg"
            />
        );
    }
    return (
        <div className="flex w-full max-w-md flex-col gap-3 rounded-lg bg-white p-8 shadow-lg">
            <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
                <File02 className="size-5 text-gray-500" aria-hidden="true" />
                <span className="text-sm font-semibold text-gray-700">{anexo.nome}</span>
            </div>
            <div className="h-3 w-2/3 rounded bg-gray-200" />
            <div className="h-2.5 w-full rounded bg-gray-100" />
            <div className="h-2.5 w-full rounded bg-gray-100" />
            <div className="h-2.5 w-5/6 rounded bg-gray-100" />
            <div className="mt-2 h-2.5 w-full rounded bg-gray-100" />
            <div className="h-2.5 w-4/5 rounded bg-gray-100" />
            <div className="h-2.5 w-full rounded bg-gray-100" />
        </div>
    );
}
