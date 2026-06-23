import { Paperclip, XClose } from "@untitledui/icons";
import { Dialog as AriaDialog, Modal as AriaModal, ModalOverlay as AriaModalOverlay } from "react-aria-components";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Input } from "@/components/base/input/input";
import { RadioButton, RadioGroup } from "@/components/base/radio-buttons/radio-buttons";
import { cx } from "@/utils/cx";
import { usePesquisas, type Pergunta } from "../data/pesquisas-store";

interface FormularioPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    /** Ingresso cujo formulário será exibido. */
    ingressoId: string | null;
}

export function FormularioPreviewModal({ isOpen, onClose, ingressoId }: FormularioPreviewModalProps) {
    const { ingressos, itensDoIngresso, tituloDoIngresso } = usePesquisas();
    const ativo = ingressos.find((i) => i.id === ingressoId) ?? null;
    const itens = ativo ? itensDoIngresso(ativo.id) : [];

    return (
        <AriaModalOverlay
            isOpen={isOpen}
            onOpenChange={(open) => !open && onClose()}
            isDismissable
            className={({ isEntering, isExiting }) =>
                cx(
                    "fixed inset-0 z-50 flex items-center justify-center bg-overlay/70 p-4 outline-hidden backdrop-blur-[2px]",
                    isEntering && "duration-200 ease-out animate-in fade-in",
                    isExiting && "duration-150 ease-in animate-out fade-out",
                )
            }
        >
            <AriaModal
                className={({ isEntering, isExiting }) =>
                    cx(
                        "flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-primary shadow-xl outline-hidden",
                        isEntering && "duration-200 ease-out animate-in zoom-in-95 fade-in",
                        isExiting && "duration-150 ease-in animate-out zoom-out-95 fade-out",
                    )
                }
            >
                <AriaDialog className="flex min-h-0 flex-col outline-hidden">
                    {/* Header */}
                    <div className="flex shrink-0 items-start justify-between gap-4 border-b border-secondary px-6 py-5">
                        <div className="flex min-w-0 flex-col gap-0.5">
                            <span className="text-xs font-semibold tracking-wide text-tertiary uppercase">
                                {ativo?.nome} · {ativo?.grupo}
                            </span>
                            <h2 className="text-lg font-semibold text-primary">{ativo ? tituloDoIngresso(ativo.id) : ""}</h2>
                        </div>
                        <ButtonUtility size="sm" color="tertiary" icon={XClose} onClick={onClose} tooltip="Fechar" />
                    </div>

                    {/* Corpo — visão do comprador */}
                    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto bg-secondary px-6 py-5">
                        <p className="text-sm text-tertiary">Como o comprador vê, antes de pagar.</p>
                        {itens.length === 0 ? (
                            <div className="rounded-xl bg-primary px-4 py-10 text-center text-sm text-tertiary ring-1 ring-border-secondary">
                                Sem perguntas para este ingresso.
                            </div>
                        ) : (
                            <div className="flex flex-col gap-5 rounded-xl bg-primary p-5 ring-1 ring-border-secondary">
                                {itens.map((it) => (
                                    <CampoPreview key={it.pergunta.id} pergunta={it.pergunta} obrigatoria={it.obrigatoria} />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex shrink-0 items-center justify-between gap-3 border-t border-secondary px-6 py-4">
                        <span className="text-sm text-tertiary">Só visualização.</span>
                        <Button size="md" color="primary" isDisabled>
                            Ir para o pagamento
                        </Button>
                    </div>
                </AriaDialog>
            </AriaModal>
        </AriaModalOverlay>
    );
}

function Label({ pergunta, obrigatoria }: { pergunta: Pergunta; obrigatoria: boolean }) {
    return (
        <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-secondary">
                {pergunta.titulo}
                {obrigatoria && <span className="text-brand-secondary"> *</span>}
            </span>
            {pergunta.ajuda && <span className="text-xs text-tertiary">{pergunta.ajuda}</span>}
        </div>
    );
}

function CampoPreview({ pergunta, obrigatoria }: { pergunta: Pergunta; obrigatoria: boolean }) {
    const { consumoDaOpcao } = usePesquisas();
    // Opção esgotada (consumo ≥ limite) fica desabilitada, mas continua visível com "(indisponível)".
    const esgotada = (i: number) => {
        const limite = pergunta.estoqueOpcoes?.[i];
        return limite != null && consumoDaOpcao(pergunta.id, i) >= limite;
    };
    const rotulo = (o: string, i: number) => (esgotada(i) ? `${o} (indisponível)` : o);

    if (pergunta.tipo === "selecao-unica") {
        return (
            <div className="flex flex-col gap-2">
                <Label pergunta={pergunta} obrigatoria={obrigatoria} />
                <RadioGroup aria-label={pergunta.titulo}>
                    {pergunta.opcoes.map((o, i) => (
                        <RadioButton key={o} value={o} label={rotulo(o, i)} isDisabled={esgotada(i)} />
                    ))}
                </RadioGroup>
            </div>
        );
    }

    if (pergunta.tipo === "multipla-escolha") {
        return (
            <div className="flex flex-col gap-2">
                <Label pergunta={pergunta} obrigatoria={obrigatoria} />
                <div className="flex flex-col gap-2">
                    {pergunta.opcoes.map((o, i) => (
                        <Checkbox key={o} size="sm" label={rotulo(o, i)} isDisabled={esgotada(i)} />
                    ))}
                </div>
            </div>
        );
    }

    if (pergunta.tipo === "texto-longo") {
        return (
            <div className="flex flex-col gap-1.5">
                <Label pergunta={pergunta} obrigatoria={obrigatoria} />
                <textarea
                    rows={3}
                    placeholder="Resposta"
                    className="w-full resize-none rounded-lg bg-primary px-3 py-2 text-sm text-primary shadow-xs ring-1 ring-border-primary outline-hidden placeholder:text-placeholder"
                />
            </div>
        );
    }

    if (pergunta.tipo === "anexo") {
        return (
            <div className="flex flex-col gap-1.5">
                <Label pergunta={pergunta} obrigatoria={obrigatoria} />
                <button
                    type="button"
                    className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-secondary px-3 py-4 text-sm font-medium text-tertiary transition duration-100 ease-linear hover:bg-primary_hover"
                >
                    <Paperclip className="size-4" />
                    Anexar arquivo
                </button>
            </div>
        );
    }

    // texto-curto, numero, data
    const tipoInput = pergunta.tipo === "numero" ? "number" : pergunta.tipo === "data" ? "date" : "text";
    return (
        <div className="flex flex-col gap-1.5">
            <Label pergunta={pergunta} obrigatoria={obrigatoria} />
            <Input type={tipoInput} placeholder={pergunta.tipo === "numero" ? "0" : "Resposta"} />
        </div>
    );
}
