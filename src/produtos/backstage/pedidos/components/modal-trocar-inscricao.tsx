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
import { EVENTO, brl, mod, nomeItem, nomes, norm, opcoes, r2, TAXA, vagas, type Item, type Opcao } from "../data/troca-store";

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
    const grupos = [...new Set(vis.map((o) => o.m.grupo))];
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

                                <p className="text-sm text-tertiary">Só o lote ativo de cada inscrição pode ser escolhido. Lotes esgotados aparecem para consulta.</p>
                                <AriaRadioGroup aria-label="Nova inscrição" value={sel} onChange={setSel} className="flex flex-col overflow-hidden rounded-xl ring-1 ring-border-secondary">
                                    <div className="flex items-center justify-between gap-3 border-b border-secondary bg-secondary px-4 py-3">
                                        <span className="text-sm font-semibold text-primary">{EVENTO.sessao}</span>
                                        <span className="text-xs text-tertiary">Sessão</span>
                                    </div>
                                    {grupos.map((g) => (
                                        <div key={g} role="group" aria-label={`Grupo ${g}`}>
                                            <div className="flex items-center justify-between gap-3 border-b border-secondary bg-secondary_subtle px-4 py-2.5 pl-6">
                                                <span className="text-sm font-semibold text-primary">{g}</span>
                                                <span className="text-xs text-tertiary">Grupo</span>
                                            </div>
                                            {vis
                                                .filter((o) => o.m.grupo === g)
                                                .map((o) => (
                                                    <Inscricao key={o.m.id} o={o} item={item} />
                                                ))}
                                        </div>
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

/** Inscrição na árvore: nome, tags e motivo do bloqueio; abaixo, todos os lotes. */
function Inscricao({ o, item }: { o: Opcao; item: Item }) {
    const seg = o.e?.find((x) => x.seg);
    const outros = (o.e ?? []).filter((x) => !x.seg).map((x) => x.curto);
    const esgotada = !!o.motivo;
    const preco = o.l.valor > item.pago ? "Mais caro" : o.l.valor < item.pago ? "Mais barato" : "Mesmo valor";
    const avisar = () => o.off && toast.error(esgotada ? "Inscrição esgotada" : "Troca não permitida", { description: esgotada ? `${o.m.nome} não tem mais vagas.` : (o.e ?? []).map((x) => x.msg).join(" ") });

    return (
        <div className="border-b border-secondary last:border-b-0">
            <div className="flex items-start justify-between gap-3 py-3 pr-4 pl-10">
                <div className="flex min-w-0 flex-col gap-1">
                    <span className={cx("flex flex-wrap items-center gap-1.5 text-sm font-semibold", o.off ? "text-tertiary" : "text-primary")}>
                        {o.m.nome}
                        {esgotada ? (
                            <Badge size="sm" type="color" color="gray">
                                Esgotada
                            </Badge>
                        ) : (
                            !o.off && (
                                <Badge size="sm" type="color" color={preco === "Mais caro" ? "warning" : preco === "Mais barato" ? "success" : "gray"}>
                                    {preco}
                                </Badge>
                            )
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
                    {seg && (
                        <span className="flex gap-1.5 text-sm text-error-primary">
                            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                            <span>
                                <b className="font-semibold">Troca não permitida.</b> {seg.msg}
                            </span>
                        </span>
                    )}
                    {outros.length > 0 && <span className="text-sm text-tertiary">{outros.join(". ")}</span>}
                </div>
                <span className="shrink-0 text-xs text-tertiary">Inscrição</span>
            </div>
            {o.m.lotes.map((l) => {
                const ativo = !o.motivo && l.id === o.l.id;
                const esgotado = vagas(l) <= 0;
                const estado = ativo ? null : esgotado ? "Esgotado" : !l.ativo ? "Encerrado" : "Indisponível para troca";
                if (ativo)
                    return (
                        <div key={l.id} onClick={avisar}>
                            <AriaRadio
                                value={o.m.id}
                                isDisabled={o.off}
                                className={({ isSelected, isDisabled, isFocusVisible }) =>
                                    cx(
                                        "flex cursor-pointer items-center gap-3 border-t border-secondary py-3 pr-4 pl-16 transition duration-100 ease-linear hover:bg-primary_hover",
                                        isSelected && "bg-brand-primary_alt",
                                        isFocusVisible && "outline-2 -outline-offset-2 outline-focus-ring",
                                        isDisabled && "cursor-not-allowed hover:bg-transparent",
                                    )
                                }
                            >
                                {({ isSelected, isDisabled, isFocusVisible }) => (
                                    <>
                                        <RadioButtonBase isSelected={isSelected} isDisabled={isDisabled} isFocusVisible={isFocusVisible} />
                                        <span className="flex min-w-0 flex-1 flex-col">
                                            <span className={cx("flex items-center gap-1.5 text-sm font-medium", isDisabled ? "text-tertiary" : "text-primary")}>
                                                {l.nome}
                                                <Badge size="sm" type="color" color="success">
                                                    Ativo
                                                </Badge>
                                            </span>
                                            <span className="text-xs text-tertiary">{vagas(l).toLocaleString("pt-BR")} vagas</span>
                                        </span>
                                        <span className={cx("text-right text-sm font-semibold", isDisabled ? "text-tertiary" : "text-primary")}>
                                            {brl(l.valor)} <span className="font-normal text-tertiary">e taxa de {brl(r2(l.valor * TAXA))}</span>
                                            {!o.off && o.f && <span className="block font-normal text-tertiary">{o.f.total ? `${brl(o.f.total)} a cobrar` : "Sem cobrança"}</span>}
                                        </span>
                                    </>
                                )}
                            </AriaRadio>
                        </div>
                    );
                return (
                    <div
                        key={l.id}
                        aria-disabled="true"
                        onClick={() => toast.error("Lote não disponível", { description: `${l.nome} da ${o.m.nome}: ${estado!.toLowerCase()}. Só o lote ativo pode ser escolhido.` })}
                        className="flex cursor-not-allowed items-center gap-3 border-t border-secondary py-3 pr-4 pl-16"
                    >
                        <RadioButtonBase isDisabled />
                        <span className="flex min-w-0 flex-1 items-center gap-1.5 text-sm text-tertiary">
                            {l.nome}
                            <Badge size="sm" type="color" color="gray">
                                {estado}
                            </Badge>
                        </span>
                        <span className="text-right text-sm text-tertiary">{brl(l.valor)}</span>
                    </div>
                );
            })}
        </div>
    );
}
