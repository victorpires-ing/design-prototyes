import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Calendar, Package, Send01, Ticket01, User01 } from "@untitledui/icons";
import { Badge, type BadgeColors } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { FreepassHeader } from "../components/FreepassHeader";
import { getEvento } from "../data/eventos";
import { type StatusEnvio, useEnvios } from "../data/envios-store";

const STATUS_META: Record<StatusEnvio, { label: string; color: BadgeColors }> = {
    resgatado: { label: "Resgatado", color: "success" },
    aberto: { label: "Aberto", color: "blue" },
    enviado: { label: "Enviado", color: "gray" },
};

export function DetalhesCortesia() {
    const { eventoId = "", itemId = "" } = useParams();
    const navigate = useNavigate();
    const evento = getEvento(eventoId);
    const item = evento?.itens.find((i) => i.id === itemId);

    const sessionEnvios = useEnvios(eventoId, itemId);
    // Eventos passados mostram o histórico já realizado; futuros preenchem a partir da sessão.
    const envios = evento?.passado ? (item?.historico ?? []) : sessionEnvios;
    const consumido = evento?.passado ? 0 : sessionEnvios.reduce((s, e) => s + e.quantidade, 0);
    const disponivel = item ? Math.max(0, item.disponivel - consumido) : 0;

    return (
        <div className="flex min-h-screen flex-col bg-secondary">
            <FreepassHeader />

            <div className="border-b border-secondary bg-primary">
                <div className="mx-auto flex h-14 w-full max-w-[1440px] items-center gap-2 px-4 md:px-8">
                    <button
                        type="button"
                        onClick={() => navigate(`/freepass/distribuicao-cortesias/${eventoId}`)}
                        aria-label="Voltar"
                        className="flex size-9 items-center justify-center rounded-md text-fg-secondary transition duration-100 ease-linear hover:bg-secondary"
                    >
                        <ArrowLeft className="size-5" aria-hidden="true" />
                    </button>
                    <h1 className="text-md font-semibold text-primary">{item?.tipo === "combo" ? "Combo" : item?.tipo === "produto" ? "Produto" : "Ingresso"}</h1>
                </div>
            </div>

            <main className="mx-auto flex w-full max-w-[768px] flex-1 flex-col gap-6 p-6">
                {!item || !evento ? (
                    <div className="rounded-2xl bg-primary px-6 py-16 text-center text-sm text-tertiary ring-1 ring-border-secondary">
                        Cortesia não encontrada.
                    </div>
                ) : (
                    <>
                        {/* Resumo do item */}
                        <div className="flex items-center gap-4">
                            {item.tipo === "produto" && item.foto ? (
                                <img
                                    src={item.foto}
                                    alt={item.nome}
                                    className="size-24 shrink-0 rounded-2xl object-cover ring-1 ring-border-secondary"
                                />
                            ) : (
                                <span className="flex size-24 shrink-0 items-center justify-center rounded-2xl bg-primary text-fg-secondary ring-1 ring-border-secondary">
                                    {item.tipo === "combo" ? <Package className="size-8" aria-hidden="true" /> : <Ticket01 className="size-8" aria-hidden="true" />}
                                </span>
                            )}
                            <div className="flex min-w-0 flex-col gap-1">
                                <span className="line-clamp-2 text-md font-semibold text-primary">{item.nome}</span>
                                {item.data && (
                                    <span className="flex items-center gap-1.5 text-sm text-tertiary">
                                        <Calendar className="size-4 shrink-0 text-fg-quaternary" aria-hidden="true" />
                                        {item.data}
                                    </span>
                                )}
                                <span className="text-sm text-tertiary">
                                    {disponivel} {disponivel === 1 ? "disponível" : "disponíveis"}
                                </span>
                            </div>
                        </div>

                        {/* Ações: reenviar para outras ou resgatar para si — indisponível em eventos passados */}
                        {!evento.passado && (
                        <div className="flex flex-col gap-3 sm:flex-row">
                            <Button
                                size="md"
                                color="primary"
                                iconLeading={User01}
                                className="sm:w-auto"
                                onClick={() => navigate(`/freepass/distribuicao-cortesias/${eventoId}/${itemId}/resgatar`)}
                            >
                                Resgatar para mim
                            </Button>
                            <Button
                                size="md"
                                color="secondary"
                                iconLeading={Send01}
                                className="sm:w-auto"
                                onClick={() => navigate(`/freepass/distribuicao-cortesias/${eventoId}/${itemId}/enviar`)}
                            >
                                Enviar cortesia
                            </Button>
                        </div>
                        )}

                        {/* Envios e resgates */}
                        <section className="flex flex-col gap-3">
                            <h2 className="text-lg font-semibold text-primary">Envios e resgates</h2>
                            {envios.length === 0 ? (
                                <div className="flex flex-col items-center gap-3 rounded-xl bg-primary px-6 py-12 text-center ring-1 ring-border-secondary">
                                    <FeaturedIcon icon={Send01} color="gray" theme="modern" size="lg" />
                                    <div className="flex flex-col gap-1">
                                        <p className="text-sm font-medium text-primary">Nenhum envio ou resgate ainda</p>
                                        <p className="max-w-xs text-sm text-tertiary">
                                            Quando você reenviar ou resgatar esta cortesia, o histórico aparece aqui.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                            <div className="overflow-hidden rounded-xl bg-primary ring-1 ring-border-secondary">
                                <div className="hidden grid-cols-[minmax(0,1.6fr)_100px_140px_140px] gap-4 border-b border-secondary bg-secondary px-4 py-2.5 md:grid">
                                    <ColHead>Destinatário</ColHead>
                                    <ColHead>Quantidade</ColHead>
                                    <ColHead>Data</ColHead>
                                    <ColHead>Status</ColHead>
                                </div>
                                {envios.map((envio) => {
                                    const meta = STATUS_META[envio.status];
                                    return (
                                        <div
                                            key={envio.id}
                                            className="relative flex flex-col gap-2 border-b border-secondary px-4 py-3 last:border-b-0 md:grid md:grid-cols-[minmax(0,1.6fr)_100px_140px_140px] md:items-center md:gap-4"
                                        >
                                            <div className="flex min-w-0 flex-col pr-24 md:pr-0">
                                                <span className="truncate text-sm font-medium text-primary">{envio.destinatario}</span>
                                                <span className="truncate text-sm text-tertiary">{envio.email}</span>
                                            </div>
                                            <div className="text-sm text-secondary">
                                                <span className="text-tertiary md:hidden">Quantidade: </span>
                                                {envio.quantidade}
                                            </div>
                                            <div className="text-sm text-tertiary">
                                                <span className="md:hidden">Data: </span>
                                                {envio.data}
                                            </div>
                                            <div className="absolute right-4 top-3 flex items-center gap-2 md:static md:right-auto md:top-auto">
                                                <Badge size="sm" type="pill-color" color={meta.color}>
                                                    {meta.label}
                                                </Badge>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            )}
                        </section>
                    </>
                )}
            </main>
        </div>
    );
}

function ColHead({ children }: { children: React.ReactNode }) {
    return <span className="text-sm font-medium text-tertiary">{children}</span>;
}
