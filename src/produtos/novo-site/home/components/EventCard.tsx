import { BellRinging02, MarkerPin01 } from "@untitledui/icons";
import { cx } from "@/utils/cx";
import { getFamily, gradientCss } from "../../components/gradient-families";
import { MatchupCover } from "./MatchupCover";
import { coverUrl, formatPreco, type EventoMock } from "../data/events";

/* ------------------------------------------------------------------ */
/*  Card de evento — capa fotográfica + acento adaptativo da vibe      */
/* ------------------------------------------------------------------ */

const STATUS: Record<EventoMock["status"], { label: string; cls: string } | null> = {
    venda: null,
    esgotado: { label: "Esgotado", cls: "bg-black/70 text-white" },
    "pre-venda": { label: "Pré-venda", cls: "bg-white text-black" },
    "fura-fila": { label: "Fura-fila", cls: "bg-white text-black" },
};

const EVENT_HREF = "/novo-site/home/event-details";

export function EventCard({ evento, className }: { evento: EventoMock; className?: string }) {
    const family = getFamily(evento.vibe);
    const status = STATUS[evento.status];

    const tipo = evento.futebol ? "Jogo oficial" : evento.camarote ? "Camarote" : null;

    return (
        <a
            href={`${EVENT_HREF}?ev=${evento.id}`}
            className={cx("group flex flex-col gap-3 outline-hidden", className)}
            aria-label={evento.titulo}
        >
            <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-secondary ring-1 ring-border-secondary">
                {evento.futebol ? (
                    <MatchupCover confronto={evento.futebol} />
                ) : (
                    <img
                        src={evento.cover ?? coverUrl(evento.seed)}
                        alt={evento.titulo}
                        loading="lazy"
                        className={cx(
                            "size-full object-cover transition duration-500 ease-out group-hover:scale-105",
                            evento.status === "esgotado" && "opacity-60 grayscale",
                        )}
                    />
                )}
                {/* Filete da vibe (heartbeat de cor adaptativa) */}
                <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1.5" style={{ backgroundImage: gradientCss(family, 90) }} />
                {/* Barra superior: tipo (jogo/camarote) + status + club */}
                {(tipo || status || evento.club) && (
                    <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
                        <div className="flex flex-col items-start gap-1.5">
                            {tipo && (
                                <span className={cx("rounded-full px-2.5 py-1 text-xs font-bold", evento.futebol ? "bg-white text-black" : "bg-black/70 text-white")}>
                                    {tipo}
                                </span>
                            )}
                            {status && <span className={cx("rounded-full px-2.5 py-1 text-xs font-bold", status.cls)}>{status.label}</span>}
                        </div>
                        {evento.club && <span className="rounded-full bg-brand-solid px-2.5 py-1 text-xs font-bold text-white">Club</span>}
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold tracking-wide text-tertiary uppercase">
                    {evento.dataLabel} · {evento.cidade}
                </span>
                <h3 className="line-clamp-2 text-md font-bold text-primary transition-colors group-hover:text-brand-secondary">{evento.titulo}</h3>
                {evento.artista && <p className="line-clamp-1 text-sm text-tertiary">{evento.artista}</p>}
                <div className="mt-1 flex items-center gap-1.5 text-sm text-secondary">
                    <MarkerPin01 className="size-4 shrink-0 text-fg-quaternary" />
                    <span className="truncate">{evento.local}</span>
                </div>
                <p className="mt-1 text-sm">
                    {evento.status === "esgotado" ? (
                        <span className="inline-flex items-center gap-1.5 font-semibold text-tertiary">
                            <BellRinging02 className="size-4" /> Lista de espera
                        </span>
                    ) : (
                        <>
                            <span className="text-tertiary">{evento.preco === 0 ? "" : "a partir de "}</span>
                            <span className="font-bold text-primary">{formatPreco(evento.preco)}</span>
                        </>
                    )}
                </p>
            </div>
        </a>
    );
}
