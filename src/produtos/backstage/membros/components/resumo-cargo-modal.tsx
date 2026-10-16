import type { FC } from "react";
import { Check, Minus, Plus } from "@untitledui/icons";
import { Heading as AriaHeading } from "react-aria-components";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";
import { CATALOGO_PERMISSOES, acoesDaSecao, chavePermissao } from "../data/permissoes-catalogo";

const minuscula = (texto: string) => texto.charAt(0).toLowerCase() + texto.slice(1);
const maiuscula = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1);
const juntar = (itens: string[]) => (itens.length <= 1 ? itens.join("") : `${itens.slice(0, -1).join(", ")} e ${itens[itens.length - 1]}`);

/**
 * Traduz as permissões marcadas em frases por seção ("Visualizar e editar datas do evento").
 * Linhas de ação já começam pelo verbo, então entram com o próprio nome.
 */
export function resumirPermissoes(selecionadas: Set<string>) {
    const comAcesso: { secao: string; frases: string[] }[] = [];
    const semAcesso: string[] = [];

    for (const secao of CATALOGO_PERMISSOES) {
        const frases = secao.recursos.flatMap((r) => {
            const acoes = acoesDaSecao(secao).filter((a) => r.base.includes(a.id) && selecionadas.has(chavePermissao(r.id, a.id)));
            if (!acoes.length) return [];
            if (r.dono) return [r.nome];
            return [maiuscula(`${juntar(acoes.map((a) => a.nome.toLowerCase()))} ${minuscula(r.nome)}`)];
        });
        if (frases.length) comAcesso.push({ secao: secao.nome, frases });
        else semAcesso.push(secao.nome);
    }

    return { comAcesso, semAcesso };
}

type GrupoSecao = { secao: string; frases: string[] };

function ListaPorSecao({ grupos, icone: Icone, corIcone }: { grupos: GrupoSecao[]; icone: FC<{ className?: string }>; corIcone: string }) {
    return (
        <>
            {grupos.map(({ secao, frases }) => (
                <section key={secao} className="flex flex-col gap-2">
                    <h3 className="text-sm font-semibold text-secondary">{secao}</h3>
                    <ul className="flex flex-col gap-1.5">
                        {frases.map((frase) => (
                            <li key={frase} className="flex items-start gap-2 text-sm text-tertiary">
                                <Icone className={cx("mt-0.5 size-4 shrink-0", corIcone)} aria-hidden="true" />
                                {frase}
                            </li>
                        ))}
                    </ul>
                </section>
            ))}
        </>
    );
}

interface ResumoCargoModalProps {
    isOpen: boolean;
    nome: string;
    selecionadas: Set<string>;
    /** Permissões salvas do cargo em edição; com elas o modal mostra só o que muda. */
    originais?: Set<string>;
    /** Quantos membros têm o cargo em edição. */
    membrosAfetados?: number;
    onClose: () => void;
    onConfirm: () => void;
}

export function ResumoCargoModal({ isOpen, nome, selecionadas, originais, membrosAfetados = 0, onClose, onConfirm }: ResumoCargoModalProps) {
    const editando = Boolean(originais);
    const { comAcesso, semAcesso } = resumirPermissoes(selecionadas);
    const vazio = comAcesso.length === 0;

    const ganhos = originais ? resumirPermissoes(new Set([...selecionadas].filter((k) => !originais.has(k)))).comAcesso : [];
    const perdas = originais ? resumirPermissoes(new Set([...originais].filter((k) => !selecionadas.has(k)))).comAcesso : [];
    const semMudanca = editando && !ganhos.length && !perdas.length;

    const titulo = editando
        ? vazio
            ? "Este cargo vai ficar sem permissões"
            : semMudanca
              ? "Nenhuma permissão foi alterada"
              : "Revise as alterações antes de salvar"
        : vazio
          ? "Este cargo está sem permissões"
          : "Revise as permissões antes de criar";

    const cargo = <span className="font-semibold text-secondary">{nome}</span>;
    const afetados =
        membrosAfetados === 0
            ? "Nenhum membro tem este cargo ainda."
            : `${membrosAfetados} ${membrosAfetados === 1 ? "membro tem" : "membros têm"} este cargo hoje.`;

    return (
        <ModalOverlay isOpen={isOpen} onOpenChange={(aberto) => !aberto && onClose()} isDismissable>
            <Modal className="sm:max-w-[560px]">
                <Dialog>
                    <div className="flex w-full flex-col gap-5 rounded-2xl bg-primary p-6 shadow-xl ring-1 ring-border-secondary">
                        <div className="flex min-w-0 flex-col gap-1">
                            <AriaHeading slot="title" className="text-lg font-semibold text-primary">
                                {titulo}
                            </AriaHeading>
                            <p className="text-sm text-tertiary">
                                {editando ? (
                                    semMudanca ? (
                                        <>As permissões do cargo {cargo} continuam as mesmas.</>
                                    ) : (
                                        <>
                                            O que muda para quem tem o cargo {cargo}. {afetados}
                                        </>
                                    )
                                ) : vazio ? (
                                    <>
                                        Quem tiver o cargo {cargo} não terá acesso a {juntar(semAcesso)}. Você pode editar o cargo depois para liberar acessos.
                                    </>
                                ) : (
                                    <>Quem tiver o cargo {cargo} poderá:</>
                                )}
                            </p>
                        </div>

                        {editando && !semMudanca && (
                            <div className="flex max-h-[50vh] flex-col gap-6 overflow-y-auto rounded-xl bg-secondary p-4">
                                {ganhos.length > 0 && (
                                    <div className="flex flex-col gap-3">
                                        <p className="text-sm font-semibold text-primary">Passa a poder</p>
                                        <ListaPorSecao grupos={ganhos} icone={Plus} corIcone="text-fg-success-primary" />
                                    </div>
                                )}
                                {perdas.length > 0 && (
                                    <div className="flex flex-col gap-3">
                                        <p className="text-sm font-semibold text-primary">Deixa de poder</p>
                                        <ListaPorSecao grupos={perdas} icone={Minus} corIcone="text-fg-quaternary" />
                                    </div>
                                )}
                            </div>
                        )}

                        {!editando && !vazio && (
                            <div className="flex max-h-[50vh] flex-col gap-5 overflow-y-auto rounded-xl bg-secondary p-4">
                                <ListaPorSecao grupos={comAcesso} icone={Check} corIcone="text-fg-success-primary" />
                            </div>
                        )}

                        {/* Um badge por seção: nomes como "Ingressos e produtos" quebrariam uma lista com "e". */}
                        {!editando && !vazio && semAcesso.length > 0 && (
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-semibold text-secondary">Sem acesso:</span>
                                {semAcesso.map((secao) => (
                                    <Badge key={secao} size="md" color="gray" type="color">
                                        {secao}
                                    </Badge>
                                ))}
                            </div>
                        )}

                        <div className="flex flex-col-reverse gap-3 sm:grid sm:grid-cols-2">
                            <Button size="md" color="secondary" onClick={onClose}>
                                Voltar e ajustar
                            </Button>
                            <Button size="md" color="primary" onClick={onConfirm}>
                                {editando ? "Salvar alterações" : "Criar cargo"}
                            </Button>
                        </div>
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
}
