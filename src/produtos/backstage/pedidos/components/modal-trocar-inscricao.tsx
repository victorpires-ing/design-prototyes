import { useEffect, useState } from "react";
import { AlertCircle, SearchLg, XClose } from "@untitledui/icons";
import { Radio as AriaRadio, RadioGroup as AriaRadioGroup } from "react-aria-components";
import { toast } from "sonner";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { InputBase } from "@/components/base/input/input";
import { RadioButtonBase } from "@/components/base/radio-buttons/radio-buttons";
import { cx } from "@/utils/cx";
import { brl, mod, nomeItem, nomes, norm, opcoes, r2, TAXA, vagas, type Item, type Opcao } from "../data/troca-store";

interface ModalTrocarInscricaoProps {
    item: Item | null;
    selecionado: string | null;
    onClose: () => void;
    onEscolher: (destino: string) => void;
}

/**
 * Escolha da nova inscrição. Cada opção mostra o preço do último lote com a taxa e quanto
 * será cobrado na troca. Indisponíveis ficam no fim, com o motivo explícito.
 */
export function ModalTrocarInscricao({ item, selecionado, onClose, onEscolher }: ModalTrocarInscricaoProps) {
    const [sel, setSel] = useState<string | null>(selecionado);
    const [busca, setBusca] = useState("");

    useEffect(() => {
        setSel(selecionado);
        setBusca("");
    }, [item?.id, selecionado]);

    const ops = item ? opcoes(item) : [];
    const nq = norm(busca);
    const vis = ops.filter((o) => !nq || norm(o.m.nome).includes(nq));
    const ok = vis.filter((o) => !o.off);
    const nao = vis.filter((o) => o.off);
    const atual = item ? mod(item.mod) : undefined;

    return (
        <ModalOverlay isOpen={!!item} onOpenChange={(open) => !open && onClose()} isDismissable>
            <Modal>
                <Dialog aria-labelledby="trocar-h">
                    {item && atual && (
                        <div className="flex max-h-[90dvh] w-full max-w-2xl flex-col rounded-xl bg-primary shadow-xl ring-1 ring-border-secondary">
                            <div className="flex items-start gap-4 p-6 pb-4">
                                <div className="flex-1">
                                    <h2 id="trocar-h" className="text-lg font-semibold text-primary">
                                        Trocar inscrição
                                    </h2>
                                    <p className="mt-1 text-sm text-tertiary">Cada opção mostra o preço do lote atual com a taxa de serviço e quanto será cobrado na troca.</p>
                                </div>
                                <ButtonUtility size="xs" color="tertiary" icon={XClose} tooltip="Fechar" onClick={onClose} />
                            </div>

                            <div className="flex flex-col gap-3 overflow-y-auto px-6 pb-4">
                                {ops.length > 8 && <InputBase size="sm" icon={SearchLg} aria-label="Buscar modalidade" placeholder="Buscar modalidade" value={busca} onChange={(e) => setBusca(e.target.value)} />}

                                <div className="flex items-start justify-between gap-4 rounded-xl bg-secondary p-4">
                                    <div className="flex min-w-0 flex-col gap-1">
                                        <span className="flex flex-wrap items-center gap-1.5 text-sm font-semibold text-primary">
                                            {nomeItem(item)}
                                            <Badge size="sm" type="color" color="gray">
                                                Atual
                                            </Badge>
                                            {atual.passkey && (
                                                <Badge size="sm" type="color" color="gray">
                                                    Oculto por passkey
                                                </Badge>
                                            )}
                                        </span>
                                        <span className="text-sm text-tertiary">
                                            {nomes(item)}
                                            {item.passkey && `, código de passkey ${item.passkey}`}
                                        </span>
                                    </div>
                                    <span className="text-right text-sm font-semibold text-primary">
                                        {brl(item.pago)} <span className="font-normal text-tertiary">e taxa de {brl(item.taxa)}</span>
                                        <span className="block font-normal text-tertiary">valor já pago</span>
                                    </span>
                                </div>

                                {atual.n && <p className="text-sm text-tertiary">Combo trocado por inteiro. Só aparecem combos com {atual.n} inscrições, e as regras valem para todos os atletas.</p>}

                                <AriaRadioGroup aria-label="Nova inscrição" value={sel} onChange={setSel} className="flex flex-col gap-3">
                                    {ok.map((o) => (
                                        <Opcao key={o.m.id} o={o} item={item} />
                                    ))}
                                    {!ok.length && nao.length > 0 && <p className="text-sm text-tertiary">Nenhuma modalidade pode ser escolhida agora. Veja os motivos abaixo.</p>}
                                    {nao.length > 0 && <p className="pt-2 text-xs font-semibold text-tertiary">Indisponíveis</p>}
                                    {nao.map((o) => (
                                        <Opcao key={o.m.id} o={o} item={item} />
                                    ))}
                                </AriaRadioGroup>

                                {!vis.length && (
                                    <div className="flex flex-col items-center gap-3 py-6 text-center">
                                        <p className="text-sm font-semibold text-primary">Nenhuma modalidade com esse nome</p>
                                        <Button size="sm" color="secondary" onClick={() => setBusca("")}>
                                            Limpar busca
                                        </Button>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-3 border-t border-secondary p-4 px-6">
                                <Button size="md" color="secondary" onClick={onClose}>
                                    Cancelar
                                </Button>
                                <Button size="md" color="primary" isDisabled={!sel} onClick={() => sel && onEscolher(sel)}>
                                    Usar esta inscrição
                                </Button>
                            </div>
                        </div>
                    )}
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
}

function Opcao({ o, item }: { o: Opcao; item: Item }) {
    const seg = o.e?.find((x) => x.seg);
    const motivo = o.motivo ?? (o.e ?? []).filter((x) => !x.seg).map((x) => x.curto).join(". ");
    const preco = o.l.valor > item.pago ? "Mais caro" : o.l.valor < item.pago ? "Mais barato" : "Mesmo valor";

    return (
        <div
            onClick={() => {
                if (o.off) toast.error("Troca não permitida", { description: o.motivo ?? (o.e ?? []).map((x) => x.msg).join(" ") });
            }}
        >
            <AriaRadio
                value={o.m.id}
                isDisabled={o.off}
                className={({ isSelected, isDisabled, isFocusVisible }) =>
                    cx(
                        "flex cursor-pointer items-start gap-3 rounded-xl p-4 ring-1 ring-border-secondary transition duration-100 ease-linear ring-inset",
                        isSelected && "ring-2 ring-brand",
                        isFocusVisible && "outline-2 outline-offset-2 outline-focus-ring",
                        isDisabled && "cursor-not-allowed bg-secondary_subtle",
                        seg && "ring-border-error_subtle",
                    )
                }
            >
                {({ isSelected, isDisabled, isFocusVisible }) => (
                    <>
                        <RadioButtonBase isSelected={isSelected} isDisabled={isDisabled} isFocusVisible={isFocusVisible} className="mt-0.5" />
                        <span className="flex min-w-0 flex-1 flex-col gap-1">
                            <span className={cx("flex flex-wrap items-center gap-1.5 text-sm font-semibold", isDisabled ? "text-tertiary" : "text-primary")}>
                                {o.m.nome}
                                {!o.off && (
                                    <Badge size="sm" type="color" color={preco === "Mais caro" ? "warning" : preco === "Mais barato" ? "success" : "gray"}>
                                        {preco}
                                    </Badge>
                                )}
                                {o.m.seg && (
                                    <Badge size="sm" type="color" color="gray">
                                        Segmentação: {o.m.seg.tipo === "idade" ? `${o.m.seg.min} anos ou mais` : "lista de CPF"}
                                    </Badge>
                                )}
                                {o.m.passkey && (
                                    <Badge size="sm" type="color" color="gray">
                                        Oculta por passkey
                                    </Badge>
                                )}
                            </span>
                            {seg ? (
                                <span className="flex gap-1.5 text-sm text-error-primary">
                                    <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                                    <span>
                                        <b className="font-semibold">Troca não permitida.</b> {seg.msg}
                                    </span>
                                </span>
                            ) : o.off ? (
                                <span className="text-sm text-tertiary">{motivo}</span>
                            ) : (
                                <span className="text-sm text-tertiary">
                                    {o.l.nome}, {vagas(o.l).toLocaleString("pt-BR")} vagas
                                </span>
                            )}
                        </span>
                        <span className={cx("text-right text-sm font-semibold", isDisabled ? "text-tertiary" : "text-primary")}>
                            {brl(o.l.valor)} <span className="font-normal text-tertiary">e taxa de {brl(r2(o.l.valor * TAXA))}</span>
                            {!o.off && o.f && <span className="block font-normal text-tertiary">{o.f.total ? `${brl(o.f.total)} a cobrar` : "Sem cobrança"}</span>}
                        </span>
                    </>
                )}
            </AriaRadio>
        </div>
    );
}
