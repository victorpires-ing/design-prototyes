import { useMemo } from "react";
import { useBanco, useDoc, type Organizacao, type ProdutoDaOrganizacao } from "@/plataforma";
import { bibliotecaDe, salvarBiblioteca } from "../../itens/data/catalogo";
import { useOrganizacaoAtual } from "../../organizacoes/data/organizacao-atual";

/* ------------------------------------------------------------------ */
/*  Biblioteca de produtos da organização em contexto                  */
/*                                                                     */
/*  Nome, descrição, imagem, preço sugerido e regras de venda moram    */
/*  aqui. Cada evento só escolhe o produto e define preço, estoque,    */
/*  transferência e se está à venda (itens/rules.md).                  */
/* ------------------------------------------------------------------ */

export function useBiblioteca() {
    const { modo } = useBanco();
    const atual = useOrganizacaoAtual();
    const orgId = atual?.id ?? "";
    const salva = useDoc("organizacoes", orgId || null);
    const biblioteca = useMemo(() => bibliotecaDe(salva, orgId), [salva, orgId]);

    /** Quantos eventos da organização vendem cada produto. */
    const usos = useMemo(() => {
        const m = new Map<string, number>();
        for (const e of atual?.eventos ?? []) for (const p of e.produtos ?? []) m.set(p.produtoId, (m.get(p.produtoId) ?? 0) + 1);
        return m;
    }, [atual]);

    // Organização que ainda não está gravada (banco antigo) nasce com nome e sigla da que está em contexto.
    const base: Organizacao | undefined = salva ?? (atual ? { id: atual.id, nome: atual.nome, sigla: atual.sigla, criadoEm: atual.criadoEm } : undefined);
    const gravar = (produtos: ProdutoDaOrganizacao[]) => salvarBiblioteca(base, orgId, produtos);

    return { carregando: modo === "carregando" || !atual, organizacao: atual, biblioteca, usos, gravar };
}
