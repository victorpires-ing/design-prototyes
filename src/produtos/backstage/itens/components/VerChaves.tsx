import { useMemo, useState } from "react";
import { Key01, SearchLg } from "@untitledui/icons";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Button } from "@/components/base/buttons/button";
import { InputBase } from "@/components/base/input/input";
import type { TipoIngresso } from "@/plataforma";
import { formatar, useTextosItens } from "../data/textos-itens";
import { BotaoMostrarMais, LIMIAR_FERRAMENTAS, paraBusca, useMostrarMais } from "./escala";

/* ------------------------------------------------------------------ */
/*  Chaves de acesso de um ingresso, para consultar na lista           */
/*                                                                     */
/*  Só leitura: as chaves do ingresso inteiro e as de cada lote, com   */
/*  busca e "Mostrar mais" acima do limiar (UI-LST-001). Editar é no   */
/*  detalhe do ingresso.                                               */
/* ------------------------------------------------------------------ */

const T = {
    botao: { one: "{n} chave de acesso", other: "{n} chaves de acesso" },
    /** Começa pelo texto visível (WCAG 2.5.3) e diz de qual ingresso. */
    botaoRotulo: "{chaves} de {ingresso}",
    titulo: "Chaves de {ingresso}",
    dica: "Só quem tem uma destas chaves compra o ingresso ou o lote.",
    todoIngresso: "Todo o ingresso",
    grupo: { one: "{grupo}, {n} chave", other: "{grupo}, {n} chaves" },
    buscar: "Buscar chave",
    nada: "Nenhuma chave com esse termo.",
    editar: "Editar no ingresso",
    fechar: "Fechar",
};

interface GrupoDeChaves {
    id: string;
    nome: string;
    chaves: string[];
}

const gruposDe = (tipo: TipoIngresso, todoIngresso: string): GrupoDeChaves[] =>
    [
        { id: "ingresso", nome: todoIngresso, chaves: tipo.chaves ?? [] },
        ...tipo.lotes.map((l) => ({ id: l.id, nome: l.nome, chaves: l.chaves ?? [] })),
    ].filter((g) => g.chaves.length > 0);

/** Total de chaves distintas do ingresso, somando as do ingresso e as dos lotes. */
export const totalDeChaves = (tipo: TipoIngresso) => new Set([...(tipo.chaves ?? []), ...tipo.lotes.flatMap((l) => l.chaves ?? [])]).size;

/** Botão da linha do ingresso: "N chaves de acesso", abre a consulta. Some sem chaves. */
export function BotaoChaves({ tipo, onEditar }: { tipo: TipoIngresso; onEditar: () => void }) {
    const { plural } = useTextosItens();
    const [aberto, setAberto] = useState(false);
    const total = totalDeChaves(tipo);
    if (!total) return null;
    return (
        <>
            <Button
                color="link-gray"
                size="sm"
                iconLeading={Key01}
                aria-label={formatar(T.botaoRotulo, { chaves: plural(T.botao, total), ingresso: tipo.nome })}
                onClick={() => setAberto(true)}
                className="relative z-10 self-start"
            >
                {plural(T.botao, total)}
            </Button>
            {aberto && <VerChaves tipo={tipo} onEditar={onEditar} onFechar={() => setAberto(false)} />}
        </>
    );
}

function VerChaves({ tipo, onEditar, onFechar }: { tipo: TipoIngresso; onEditar: () => void; onFechar: () => void }) {
    const { plural, numero } = useTextosItens();
    const [busca, setBusca] = useState("");
    const termo = paraBusca(busca.trim());
    const grupos = useMemo(() => gruposDe(tipo, T.todoIngresso), [tipo]);
    const total = grupos.reduce((n, g) => n + g.chaves.length, 0);
    const filtrados = useMemo(
        () => (termo ? grupos.map((g) => ({ ...g, chaves: g.chaves.filter((c) => paraBusca(c).includes(termo)) })).filter((g) => g.chaves.length) : grupos),
        [grupos, termo],
    );

    return (
        <ModalOverlay isOpen onOpenChange={(v) => !v && onFechar()} isDismissable>
            <Modal className="sm:max-w-[480px]">
                <Dialog>
                    <div className="flex max-h-[85dvh] w-full flex-col gap-4 rounded-2xl bg-primary p-6 shadow-xl ring-1 ring-border-secondary">
                        <div className="flex flex-col gap-1">
                            <h2 className="text-lg font-semibold text-primary">{formatar(T.titulo, { ingresso: tipo.nome })}</h2>
                            <p className="text-sm text-tertiary">{T.dica}</p>
                        </div>
                        {total > LIMIAR_FERRAMENTAS && (
                            <InputBase
                                size="sm"
                                icon={SearchLg}
                                aria-label={T.buscar}
                                placeholder={T.buscar}
                                value={busca}
                                onChange={(v: unknown) => setBusca(typeof v === "string" ? v : ((v as { target?: { value?: string } })?.target?.value ?? ""))}
                            />
                        )}
                        <div className="-mx-2 flex min-h-0 flex-col gap-5 overflow-y-auto px-2">
                            {filtrados.map((g) => (
                                <GrupoDaLista key={g.id} grupo={g} titulo={plural(T.grupo, g.chaves.length, { grupo: g.nome })} />
                            ))}
                            {filtrados.length === 0 && <p className="text-sm text-tertiary">{T.nada}</p>}
                        </div>
                        <div className="flex flex-col-reverse gap-3 border-t border-secondary pt-4 sm:flex-row sm:justify-end">
                            <Button color="secondary" size="md" onClick={onFechar}>
                                {T.fechar}
                            </Button>
                            <Button color="primary" size="md" onClick={onEditar}>
                                {T.editar}
                            </Button>
                        </div>
                        <span className="sr-only" role="status">
                            {termo ? numero(filtrados.reduce((n, g) => n + g.chaves.length, 0)) : ""}
                        </span>
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
}

function GrupoDaLista({ grupo, titulo }: { grupo: GrupoDeChaves; titulo: string }) {
    const { visiveis, restantes, mostrarMais } = useMostrarMais(grupo.chaves, 50);
    return (
        <section className="flex flex-col gap-2">
            <h3 className="text-sm font-medium text-secondary">{titulo}</h3>
            {/* Códigos em grade que quebra linha: sem rolagem horizontal (UI-MOB-004). */}
            <ul className="flex flex-wrap gap-2">
                {visiveis.map((c) => (
                    <li key={c} className="rounded-md bg-secondary px-2 py-1 font-mono text-sm text-primary ring-1 ring-secondary ring-inset">
                        {c}
                    </li>
                ))}
            </ul>
            <BotaoMostrarMais restantes={restantes} onClick={mostrarMais} passo={50} />
        </section>
    );
}
