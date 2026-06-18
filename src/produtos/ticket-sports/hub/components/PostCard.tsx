import { CheckVerified01, Heart, MessageCircle01, Users01 } from "@untitledui/icons";
import { cx } from "@/utils/cx";

/** Item unificado do Mural — pode vir de uma pessoa (PF), comunidade (PJ) ou recado de grupo. */
export interface MuralItem {
    key: string;
    tipo: "pf" | "pj" | "grupo";
    nome: string;
    foto?: string;
    inicial: string;
    subtitulo: string;
    texto: string;
    imagem?: string;
    curtidas?: number;
    comentarios?: number;
    onOpen: () => void;
}

/**
 * Card de publicação do Mural. Mesma estrutura para todos os tipos — a diferença
 * é o selo: comunidade (PJ) ganha verificado roxo; grupo ganha ícone de membros.
 */
export function PostCard({ item }: { item: MuralItem }) {
    const ehPF = item.tipo === "pf";
    const ehPJ = item.tipo === "pj";
    const ehGrupo = item.tipo === "grupo";
    const temMetricas = item.curtidas != null || item.comentarios != null;
    const prefixo = ehPJ ? "Comunidade · " : ehGrupo ? "Recado do grupo · " : "";

    return (
        <article className="flex flex-col gap-3 rounded-2xl border border-secondary bg-primary p-4">
            <button type="button" onClick={item.onOpen} className="flex items-center gap-2.5 text-left">
                {item.foto ? (
                    <img src={item.foto} alt="" className={cx("size-10 shrink-0 object-cover", ehPF ? "rounded-full" : "rounded-lg")} />
                ) : (
                    <span className={cx("flex size-10 shrink-0 items-center justify-center bg-[#7C3AED] text-sm font-bold text-white", ehPF ? "rounded-full" : "rounded-lg")}>
                        {item.inicial}
                    </span>
                )}
                <div className="flex min-w-0 flex-col">
                    <span className="flex items-center gap-1 text-sm font-bold text-primary">
                        <span className="truncate">{item.nome}</span>
                        {ehPJ && <CheckVerified01 className="size-3.5 shrink-0 text-[#7C3AED]" />}
                        {ehGrupo && <Users01 className="size-3.5 shrink-0 text-fg-quaternary" />}
                    </span>
                    <span className="truncate text-xs text-tertiary">
                        {prefixo}
                        {item.subtitulo}
                    </span>
                </div>
            </button>

            <p className="text-md leading-snug text-secondary">{item.texto}</p>
            {item.imagem && <img src={item.imagem} alt="" className="aspect-[3/2] w-full rounded-xl object-cover" />}

            {temMetricas && (
                <div className="flex items-center gap-4 text-sm text-tertiary">
                    <span className="flex items-center gap-1.5">
                        <Heart className="size-4 text-[#7C3AED]" /> {item.curtidas}
                    </span>
                    <span className="flex items-center gap-1.5">
                        <MessageCircle01 className="size-4 text-fg-quaternary" /> {item.comentarios}
                    </span>
                </div>
            )}
        </article>
    );
}
