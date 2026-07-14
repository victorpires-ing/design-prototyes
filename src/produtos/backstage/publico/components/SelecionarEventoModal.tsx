import { useEffect, useMemo, useState } from "react";
import {
    Dialog as AriaDialog,
    Modal as AriaModal,
    ModalOverlay as AriaModalOverlay,
    Radio as AriaRadio,
    RadioGroup as AriaRadioGroup,
} from "react-aria-components";
import { SearchLg, XClose } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Input } from "@/components/base/input/input";
import { cx } from "@/utils/cx";

export interface EventoDisponivel {
    id: string;
    titulo: string;
}

export const EVENTOS_DISPONIVEIS: EventoDisponivel[] = [
    { id: "sao-silvestre-geral", titulo: "São Silvestre - Geral" },
    { id: "sao-silvestre-pets", titulo: "São Silvestre - Pets" },
    { id: "sao-silvestre-criancas", titulo: "São Silvestre - Crianças" },
    { id: "maratona-do-rio", titulo: "Maratona do Rio" },
    { id: "maratona-de-sao-paulo", titulo: "Maratona Internacional de São Paulo" },
    { id: "meia-maratona-do-rio", titulo: "Meia Maratona Internacional do Rio de Janeiro" },
    { id: "volta-internacional-da-pampulha", titulo: "Volta Internacional da Pampulha" },
    { id: "maratona-internacional-de-porto-alegre", titulo: "Maratona Internacional de Porto Alegre" },
    { id: "circuito-das-estacoes", titulo: "Circuito das Estações" },
    { id: "track-and-field-run-series", titulo: "Track&Field Run Series" },
    { id: "corrida-de-reveillon-copacabana", titulo: "Corrida de Réveillon de Copacabana" },
    { id: "meia-maratona-de-florianopolis", titulo: "Meia Maratona de Florianópolis" },
    { id: "maratona-de-fortaleza", titulo: "Maratona de Fortaleza" },
    { id: "corrida-internacional-de-sao-silvestre", titulo: "Corrida Internacional de São Silvestre" },
    { id: "maratona-do-nordeste", titulo: "Maratona do Nordeste" },
    { id: "corrida-da-virada-ibirapuera", titulo: "Corrida da Virada - Ibirapuera" },
    { id: "meia-maratona-de-brasilia", titulo: "Meia Maratona de Brasília" },
    { id: "maratona-internacional-de-curitiba", titulo: "Maratona Internacional de Curitiba" },
    { id: "corrida-salomon", titulo: "Corrida Salomon" },
    { id: "maratona-de-belo-horizonte", titulo: "Maratona Internacional de Belo Horizonte" },
];

interface SelecionarEventoModalProps {
    isOpen: boolean;
    onClose: () => void;
    onContinuar: (eventoId: string) => void;
}

/** Modal "Novo formulário": seleção do evento que utilizará o formulário. */
export function SelecionarEventoModal({ isOpen, onClose, onContinuar }: SelecionarEventoModalProps) {
    const [busca, setBusca] = useState("");
    const [eventoId, setEventoId] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setBusca("");
            setEventoId(null);
        }
    }, [isOpen]);

    const eventosFiltrados = useMemo(() => {
        const query = busca.trim().toLowerCase();
        if (!query) return EVENTOS_DISPONIVEIS;
        return EVENTOS_DISPONIVEIS.filter((e) => e.titulo.toLowerCase().includes(query));
    }, [busca]);

    return (
        <AriaModalOverlay
            isOpen={isOpen}
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
            isDismissable
            className={({ isEntering, isExiting }) =>
                cx(
                    "fixed inset-0 z-[80] flex items-center justify-center bg-overlay/70 p-4 outline-hidden backdrop-blur-[2px]",
                    isEntering && "duration-200 ease-out animate-in fade-in",
                    isExiting && "duration-150 ease-in animate-out fade-out",
                )
            }
        >
            <AriaModal
                className={({ isEntering, isExiting }) =>
                    cx(
                        "flex max-h-[85vh] w-full max-w-[560px] flex-col overflow-hidden rounded-2xl bg-primary shadow-xl ring-1 ring-secondary outline-hidden",
                        isEntering && "duration-200 ease-out animate-in zoom-in-95 fade-in",
                        isExiting && "duration-150 ease-in animate-out zoom-out-95 fade-out",
                    )
                }
            >
                <AriaDialog className="flex max-h-[85vh] flex-col outline-hidden">
                    <div className="flex items-start justify-between gap-4 px-6 pt-6">
                        <div className="flex flex-col gap-1">
                            <h2 className="text-lg font-semibold text-primary">Selecione o evento que utilizará o formulário</h2>
                            <p className="text-sm text-tertiary">
                                As comunicações enviadas aos interessados vão mencionar este evento. Se o evento que você procura
                                não aparecer, ele pode já ter sido selecionado.
                            </p>
                        </div>
                        <ButtonUtility size="sm" color="tertiary" icon={XClose} tooltip="Fechar" onClick={onClose} />
                    </div>

                    <div className="px-6 pt-5">
                        <Input
                            size="md"
                            icon={SearchLg}
                            aria-label="Buscar evento"
                            placeholder="Buscar evento"
                            value={busca}
                            onChange={setBusca}
                        />
                    </div>

                    <div className="mt-4 max-h-[320px] min-h-0 flex-1 overflow-y-auto border-t border-secondary px-6 py-3">
                        {eventosFiltrados.length === 0 ? (
                            <p className="px-2 py-6 text-center text-sm text-tertiary">Nenhum evento encontrado.</p>
                        ) : (
                            <AriaRadioGroup value={eventoId} onChange={setEventoId} className="flex flex-col" aria-label="Evento">
                                {eventosFiltrados.map((evento) => (
                                    <AriaRadio
                                        key={evento.id}
                                        value={evento.id}
                                        className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-3 outline-none transition duration-100 ease-linear hover:bg-secondary"
                                    >
                                        {({ isSelected }) => (
                                            <>
                                                <div
                                                    className={cx(
                                                        "relative flex size-4 shrink-0 items-center justify-center rounded-full ring-inset",
                                                        isSelected ? "bg-brand-solid" : "ring-1 ring-primary",
                                                    )}
                                                >
                                                    <div
                                                        className={cx(
                                                            "absolute size-1.5 rounded-full bg-fg-white",
                                                            isSelected ? "opacity-100" : "opacity-0",
                                                        )}
                                                    />
                                                </div>
                                                <span className="text-md font-medium text-primary">{evento.titulo}</span>
                                            </>
                                        )}
                                    </AriaRadio>
                                ))}
                            </AriaRadioGroup>
                        )}
                    </div>

                    <div className="flex gap-3 border-t border-secondary px-6 py-4">
                        <Button size="lg" color="secondary" className="flex-1" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button
                            size="lg"
                            color="primary"
                            className="flex-1"
                            isDisabled={!eventoId}
                            onClick={() => eventoId && onContinuar(eventoId)}
                        >
                            Continuar
                        </Button>
                    </div>
                </AriaDialog>
            </AriaModal>
        </AriaModalOverlay>
    );
}
