import type { ReactNode } from "react";
import { Edit01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { apoioDoItem, ITEM_POR_ID, SESSAO_POR_ID } from "../data/catalogo-evento";
import { plural, ROTULO_ATUACAO, ROTULO_COTA, type Atuacao, type CotaGrupo } from "../data/equipe-v3-store";
import { GRUPO_MEMBROS_POR_ID } from "../data/membros";
import { TituloSecao } from "./ui-cotas";

/*
 * PROVISÓRIA: a etapa "Revisão" ainda vai ser desenhada no Figma. Enquanto isso, esta
 * tela resume o que foi configurado nas etapas anteriores para o fluxo não quebrar.
 * Substituir pelo design final quando ele existir.
 */

interface Props {
    atuacao?: Atuacao;
    grupoMembrosId?: string;
    totalOperadores: number;
    itens: string[];
    cota: CotaGrupo;
    /** Volta para uma etapa (0 = Grupo, 1 = Itens, 2 = Cotas). */
    onEditar: (etapa: number) => void;
}

export function RevisaoProvisoria({ atuacao, grupoMembrosId, totalOperadores, itens, cota, onEditar }: Props) {
    const grupoMembros = grupoMembrosId ? GRUPO_MEMBROS_POR_ID[grupoMembrosId] : undefined;
    const lista = itens.map((id) => ITEM_POR_ID[id]).filter(Boolean);

    return (
        <div className="flex w-full max-w-[800px] flex-col gap-6">
            <TituloSecao apoio="Confira as configurações. Você pode voltar a qualquer etapa para ajustar.">Revise o grupo antes de criar</TituloSecao>

            <CardRevisao titulo="Grupo" onEditar={() => onEditar(0)}>
                <Linha rotulo="Onde atua">{atuacao ? ROTULO_ATUACAO[atuacao] : "—"}</Linha>
                <Linha rotulo="Grupo vinculado">
                    {grupoMembros ? `${grupoMembros.nome} – ${plural(totalOperadores, "operador", "operadores")}` : "—"}
                </Linha>
            </CardRevisao>

            <CardRevisao titulo={`Itens (${lista.length})`} onEditar={() => onEditar(1)}>
                {lista.map((item) => (
                    <Linha key={item.id} rotulo={SESSAO_POR_ID[item.sessaoId]?.curto ?? ""}>
                        {item.nome} <span className="text-tertiary">· {apoioDoItem(item)}</span>
                    </Linha>
                ))}
            </CardRevisao>

            <CardRevisao titulo="Cotas" onEditar={() => onEditar(2)}>
                <Linha rotulo="Tipo de cota">{ROTULO_COTA[cota.tipo]}</Linha>
                {cota.tipo === "compartilhada" && <Linha rotulo="Cota total do grupo">{cota.total}</Linha>}
                {cota.tipo === "por-item" &&
                    lista.map((item) => (
                        <Linha key={item.id} rotulo={item.nome}>
                            {cota.porItem[item.id] ?? 0}
                        </Linha>
                    ))}
            </CardRevisao>
        </div>
    );
}

const CardRevisao = ({ titulo, onEditar, children }: { titulo: string; onEditar: () => void; children: ReactNode }) => (
    <section className="flex flex-col gap-3 rounded-xl bg-primary p-4 ring-1 ring-border-secondary ring-inset">
        <div className="flex items-center justify-between gap-3">
            <h3 className="text-md font-semibold text-primary">{titulo}</h3>
            <Button size="sm" color="tertiary" iconLeading={Edit01} onClick={onEditar}>
                Editar
            </Button>
        </div>
        <dl className="flex flex-col">{children}</dl>
    </section>
);

const Linha = ({ rotulo, children }: { rotulo: string; children: ReactNode }) => (
    <div className="flex items-baseline justify-between gap-4 border-t border-secondary py-2.5 text-sm">
        <dt className="shrink-0 text-tertiary">{rotulo}</dt>
        <dd className="min-w-0 text-right text-secondary">{children}</dd>
    </div>
);
