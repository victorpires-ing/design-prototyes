import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, CheckCircle, Minus, Plus } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { FreepassHeader } from "../components/FreepassHeader";
import { getEvento } from "../data/eventos";
import { addEnvios, useEnvios } from "../data/envios-store";
import { ItemResumoSticky } from "./reenviar-cortesia";

export function ResgatarCortesia() {
    const { eventoId = "", itemId = "" } = useParams();
    const navigate = useNavigate();
    const evento = getEvento(eventoId);
    const item = evento?.itens.find((i) => i.id === itemId);

    const [qtd, setQtd] = useState(1);

    const enviosPrevios = useEnvios(eventoId, itemId);
    const consumido = enviosPrevios.reduce((s, e) => s + e.quantidade, 0);
    const disponivel = Math.max(0, (item?.disponivel ?? 0) - consumido);
    const restante = Math.max(0, disponivel - qtd);

    const voltarDetalhe = () => navigate(`/freepass/distribuicao-cortesias/${eventoId}/${itemId}`);

    const confirmarResgate = () => {
        addEnvios(eventoId, itemId, [{ destinatario: "Você", email: "voce@ingresse.com", quantidade: qtd, status: "resgatado" as const }]);
        navigate(`/freepass/distribuicao-cortesias/${eventoId}/${itemId}/resgatar/sucesso`);
    };

    return (
        <div className="flex min-h-screen flex-col bg-secondary">
            <FreepassHeader />

            <div className="border-b border-secondary bg-primary">
                <div className="mx-auto flex h-14 w-full max-w-[1440px] items-center gap-2 px-4 md:px-8">
                    <button
                        type="button"
                        onClick={voltarDetalhe}
                        aria-label="Voltar"
                        className="flex size-9 items-center justify-center rounded-md text-fg-secondary transition duration-100 ease-linear hover:bg-secondary"
                    >
                        <ArrowLeft className="size-5" aria-hidden="true" />
                    </button>
                    <h1 className="text-md font-semibold text-primary">Resgatar para mim</h1>
                </div>
            </div>

            <main className="mx-auto flex w-full max-w-[768px] flex-1 flex-col gap-6 px-4 py-6 md:px-6">
                {!item || !evento ? (
                    <div className="rounded-2xl bg-primary px-6 py-16 text-center text-sm text-tertiary ring-1 ring-border-secondary">Cortesia não encontrada.</div>
                ) : evento.passado ? (
                    <div className="flex flex-col items-center gap-4 rounded-2xl bg-primary px-6 py-16 text-center ring-1 ring-border-secondary">
                        <p className="text-sm text-tertiary">Este evento já aconteceu. Não é possível resgatar cortesias.</p>
                        <Button size="md" color="secondary" onClick={voltarDetalhe}>
                            Voltar
                        </Button>
                    </div>
                ) : (
                    <>
                        <ItemResumoSticky evento={evento} item={item} connector hideDisponivel />

                        <div className="flex flex-col gap-4 rounded-2xl bg-primary p-6 ring-1 ring-border-secondary">
                            <div className="flex flex-col gap-1">
                                <h2 className="text-lg font-semibold text-primary">Quantas cortesias você quer resgatar?</h2>
                                <p className="text-sm text-tertiary">
                                    {restante === 1 ? "Resta" : "Restam"} {restante} de {disponivel} {disponivel === 1 ? "cortesia disponível" : "cortesias disponíveis"}
                                </p>
                            </div>
                            <div className="flex items-center justify-center gap-6 py-2">
                                <button
                                    type="button"
                                    onClick={() => setQtd(Math.max(1, qtd - 1))}
                                    disabled={qtd <= 1}
                                    aria-label="Diminuir quantidade"
                                    className="flex size-11 shrink-0 items-center justify-center rounded-lg text-fg-secondary ring-1 ring-border-primary transition duration-100 ease-linear hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <Minus className="size-5" aria-hidden="true" />
                                </button>
                                <span className="min-w-[72px] text-center text-6xl font-bold tabular-nums text-primary">{String(qtd).padStart(2, "0")}</span>
                                <button
                                    type="button"
                                    onClick={() => setQtd(Math.min(disponivel, qtd + 1))}
                                    disabled={qtd >= disponivel}
                                    aria-label="Aumentar quantidade"
                                    className="flex size-11 shrink-0 items-center justify-center rounded-lg text-fg-secondary ring-1 ring-border-primary transition duration-100 ease-linear hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <Plus className="size-5" aria-hidden="true" />
                                </button>
                            </div>
                        </div>

                        <Button size="lg" color="primary" onClick={confirmarResgate} className="w-full sm:w-auto sm:self-start">
                            Confirmar resgate
                        </Button>
                    </>
                )}
            </main>
        </div>
    );
}

/* Tela de sucesso do resgate — rota própria (`.../resgatar/sucesso`) para o teste de usabilidade. */
export function ResgatarSucesso() {
    const { eventoId = "", itemId = "" } = useParams();
    const navigate = useNavigate();
    const voltarDetalhe = () => navigate(`/freepass/distribuicao-cortesias/${eventoId}/${itemId}`);

    return (
        <div className="flex min-h-screen flex-col bg-secondary">
            <FreepassHeader />
            <main className="mx-auto flex w-full max-w-[768px] flex-1 flex-col gap-6 px-4 py-6 md:px-6">
                <div className="flex flex-col gap-4 pt-6">
                    <div className="flex flex-col items-center gap-6 rounded-2xl bg-primary p-6 text-center ring-1 ring-border-secondary md:p-8">
                        <FeaturedIcon icon={CheckCircle} color="success" theme="light" size="xl" />
                        <div className="flex flex-col gap-1">
                            <h1 className="text-display-xs font-semibold text-primary">Cortesia resgatada</h1>
                            <p className="max-w-sm text-sm text-tertiary">Os itens ficarão disponíveis na aba "Ingressos" no app Ingresse.</p>
                        </div>
                    </div>
                    <Button size="lg" color="primary" onClick={voltarDetalhe} className="w-full">
                        Ver status do envio
                    </Button>
                </div>
            </main>
        </div>
    );
}
