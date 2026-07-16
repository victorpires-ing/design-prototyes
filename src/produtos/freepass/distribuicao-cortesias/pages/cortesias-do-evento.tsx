import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Calendar, ChevronRight, Package, Ticket01 } from "@untitledui/icons";
import { cx } from "@/utils/cx";
import { FreepassHeader } from "../components/FreepassHeader";
import { getEvento, type ItemCortesia, type TipoItem } from "../data/eventos";
import { useEnvios } from "../data/envios-store";

const GRUPOS: { tipo: TipoItem; titulo: string }[] = [
    { tipo: "ingresso", titulo: "Ingressos" },
    { tipo: "produto", titulo: "Produtos" },
    { tipo: "combo", titulo: "Combos" },
];

export function CortesiasDoEvento() {
    const { eventoId = "" } = useParams();
    const navigate = useNavigate();
    const evento = getEvento(eventoId);

    return (
        <div className="flex min-h-screen flex-col bg-secondary">
            <FreepassHeader />

            {/* Sub-header: voltar + título */}
            <div className="border-b border-secondary bg-primary">
                <div className="mx-auto flex h-14 w-full max-w-[1440px] items-center gap-2 px-4 md:px-8">
                    <button
                        type="button"
                        onClick={() => navigate("/freepass/distribuicao-cortesias")}
                        aria-label="Voltar"
                        className="flex size-9 items-center justify-center rounded-md text-fg-secondary transition duration-100 ease-linear hover:bg-secondary"
                    >
                        <ArrowLeft className="size-5" aria-hidden="true" />
                    </button>
                    <h1 className="text-md font-semibold text-primary">Cortesias</h1>
                </div>
            </div>

            <main className="mx-auto flex w-full max-w-[768px] flex-1 flex-col gap-8 px-4 py-6 md:px-6">
                {!evento ? (
                    <div className="rounded-2xl bg-primary px-6 py-16 text-center text-sm text-tertiary ring-1 ring-border-secondary">
                        Evento não encontrado.
                    </div>
                ) : (
                    <>
                        {/* Resumo do evento */}
                        <div className="flex items-center gap-4">
                            {evento.capa ? (
                                <img src={evento.capa} alt={evento.nome} className="size-24 shrink-0 rounded-2xl object-cover ring-1 ring-border-secondary" />
                            ) : (
                                <div className={cx("size-24 shrink-0 rounded-2xl bg-gradient-to-br", evento.gradiente)} />
                            )}
                            <div className="flex min-w-0 flex-col gap-1">
                                <span className="line-clamp-2 text-md font-semibold text-primary">{evento.nome}</span>
                                <span className="text-sm text-tertiary">{evento.data}</span>
                                <span className="text-sm text-tertiary">{evento.local}</span>
                            </div>
                        </div>

                        {/* Grupos */}
                        {GRUPOS.map(({ tipo, titulo }) => {
                            const itens = evento.itens.filter((i) => i.tipo === tipo);
                            if (itens.length === 0) return null;
                            return (
                                <section key={tipo} className="flex flex-col gap-3">
                                    <h2 className="text-lg font-semibold text-primary">{titulo}</h2>
                                    <div className="flex flex-col gap-3">
                                        {itens.map((item) => (
                                            <ItemCortesiaCard
                                                key={item.id}
                                                eventoId={evento.id}
                                                item={item}
                                                onClick={() => navigate(`/freepass/distribuicao-cortesias/${evento.id}/${item.id}`)}
                                            />
                                        ))}
                                    </div>
                                </section>
                            );
                        })}
                    </>
                )}
            </main>
        </div>
    );
}

const ItemCortesiaCard = ({ eventoId, item, onClick }: { eventoId: string; item: ItemCortesia; onClick: () => void }) => {
    const Icon = item.tipo === "combo" ? Package : item.tipo === "ingresso" ? Ticket01 : null;
    const consumido = useEnvios(eventoId, item.id).reduce((s, e) => s + e.quantidade, 0);
    const disponivel = Math.max(0, item.disponivel - consumido);
    return (
        <button
            type="button"
            onClick={onClick}
            className="group flex w-full items-start gap-4 rounded-xl bg-primary px-4 py-4 text-left ring-1 ring-border-secondary transition duration-100 ease-linear hover:bg-primary_hover hover:ring-brand"
        >
            {item.tipo === "produto" && item.foto ? (
                <img src={item.foto} alt={item.nome} className="size-12 shrink-0 rounded-lg object-cover ring-1 ring-border-secondary" />
            ) : (
                <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-secondary text-fg-secondary">
                    {Icon && <Icon className="size-6" aria-hidden="true" />}
                </span>
            )}

            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate text-sm font-semibold text-primary">{item.nome}</span>
                {item.detalhe && <span className="truncate text-sm text-tertiary">{item.detalhe}</span>}
                {item.data && (
                    <span className="flex items-center gap-1.5 text-sm text-tertiary">
                        <Calendar className="size-4 shrink-0 text-fg-quaternary" aria-hidden="true" />
                        {item.data}
                    </span>
                )}
                <span className="text-sm font-medium text-brand-secondary">
                    {disponivel} {disponivel === 1 ? "disponível" : "disponíveis"}
                </span>
            </div>

            <ChevronRight aria-hidden="true" className="size-5 shrink-0 self-center text-fg-quaternary transition-transform duration-100 ease-linear group-hover:translate-x-0.5" />
        </button>
    );
};
