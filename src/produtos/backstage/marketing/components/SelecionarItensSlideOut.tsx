import { useEffect, useMemo, useState } from "react";
import {
    Dialog as AriaDialog,
    Modal as AriaModal,
    ModalOverlay as AriaModalOverlay,
    type Key,
    type Selection,
} from "react-aria-components";
import { Package, SearchLg, Ticket01, XClose } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Input } from "@/components/base/input/input";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { TreeView } from "@/components/application/tree-view/tree-view";

/* ------------------------------------------------------------------ */
/*  Mock tree data                                                    */
/* ------------------------------------------------------------------ */

/** Nó genérico da árvore — profundidade variável. Folha = sem `children`. */
interface TreeNode {
    id: string;
    label: string;
    icon?: typeof Ticket01;
    children?: TreeNode[];
}

/** Grupos (A/B/C) com variantes Inteira/Meia, a partir de um prefixo de id. */
const grupos = (prefix: string): TreeNode[] =>
    ["A", "B", "C"].map((g) => ({
        id: `${prefix}-grupo-${g.toLowerCase()}`,
        label: `Grupo ${g}`,
        children: [
            { id: `${prefix}-grupo-${g.toLowerCase()}-inteira`, label: "Inteira" },
            { id: `${prefix}-grupo-${g.toLowerCase()}-meia`, label: "Meia" },
        ],
    }));

/** Sessões do evento — nível extra exclusivo dos ingressos. */
const SESSOES = [
    { num: 1, label: "05/06/2026 às 16:00" },
    { num: 2, label: "06/06/2026 às 16:00" },
];

const TREE: TreeNode[] = [
    {
        id: "ingressos",
        label: "Ingressos",
        icon: Ticket01,
        // Ingressos têm um nível de sessão antes dos grupos.
        children: SESSOES.map((s) => ({
            id: `ing-sessao-${s.num}`,
            label: s.label,
            children: grupos(`ing-sessao-${s.num}`),
        })),
    },
    // Combos não têm sessão — vão direto para os grupos.
    { id: "combos", label: "Combos", icon: Package, children: grupos("com") },
];

/** Coleta recursivamente os ids das folhas (nós sem filhos). */
const collectLeafIds = (nodes: TreeNode[], acc: Set<string>) => {
    nodes.forEach((n) => {
        if (n.children && n.children.length > 0) collectLeafIds(n.children, acc);
        else acc.add(n.id);
    });
};

const LEAF_IDS = new Set<string>();
collectLeafIds(TREE, LEAF_IDS);

/** Ids de todos os nós internos (com filhos) — usados para expandir na busca. */
const collectBranchIds = (nodes: TreeNode[], acc: Set<Key>) => {
    nodes.forEach((n) => {
        if (n.children && n.children.length > 0) {
            acc.add(n.id);
            collectBranchIds(n.children, acc);
        }
    });
};

/** Filtra a árvore recursivamente; um match em um nó mantém toda a sua subárvore. */
const filterTree = (nodes: TreeNode[], query: string): TreeNode[] =>
    nodes
        .map((node) => {
            const selfMatch = node.label.toLowerCase().includes(query);
            if (!node.children || node.children.length === 0) {
                return selfMatch ? node : null;
            }
            if (selfMatch) return node;
            const kids = filterTree(node.children, query);
            return kids.length > 0 ? { ...node, children: kids } : null;
        })
        .filter((n): n is TreeNode => n !== null);

/* ------------------------------------------------------------------ */
/*  Slide out                                                         */
/* ------------------------------------------------------------------ */

interface SelecionarItensSlideOutProps {
    isOpen: boolean;
    /** Itens atualmente participantes — usados para refletir a seleção ao abrir. */
    selectedIds: string[];
    onClose: () => void;
    onConfirm: (selectedLeafIds: string[]) => void;
}

const DEFAULT_EXPANDED: Selection = new Set<Key>(["ingressos", "combos"]);

export function SelecionarItensSlideOut({
    isOpen,
    selectedIds,
    onClose,
    onConfirm,
}: SelecionarItensSlideOutProps) {
    const [selectedKeys, setSelectedKeys] = useState<Selection>(() => new Set<Key>(selectedIds));
    const [search, setSearch] = useState("");
    const [expandedKeys, setExpandedKeys] = useState<Selection>(DEFAULT_EXPANDED);

    // Ao abrir, ressincroniza a seleção com os itens atuais da pré-venda
    // (ex.: itens removidos da tabela não aparecem mais marcados).
    useEffect(() => {
        if (isOpen) {
            setSelectedKeys(new Set<Key>(selectedIds));
            setSearch("");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    const query = search.trim().toLowerCase();

    const filteredTree = useMemo<TreeNode[]>(
        () => (query ? filterTree(TREE, query) : TREE),
        [query],
    );

    const hasResults = filteredTree.length > 0;

    // When searching, expand every visible branch so matches are revealed.
    useEffect(() => {
        if (!query) {
            setExpandedKeys(new Set<Key>(["ingressos", "combos"]));
            return;
        }
        const keys = new Set<Key>();
        collectBranchIds(filteredTree, keys);
        setExpandedKeys(keys);
    }, [query, filteredTree]);

    const selectedLeaves = useMemo(() => {
        if (selectedKeys === "all") return [...LEAF_IDS];
        return [...(selectedKeys as Set<Key>)].map(String).filter((k) => LEAF_IDS.has(k));
    }, [selectedKeys]);

    const count = selectedLeaves.length;
    const footerLabel =
        count === 0
            ? "Nenhum item selecionado"
            : `${count} ${count === 1 ? "item selecionado" : "itens selecionados"}`;

    const handleSalvar = () => onConfirm(selectedLeaves);

    return (
        <AriaModalOverlay
            isOpen={isOpen}
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
            isDismissable
            className={({ isEntering, isExiting }) =>
                [
                    "fixed inset-0 z-50 flex justify-end bg-overlay/70 outline-hidden backdrop-blur-[2px]",
                    isEntering && "duration-300 ease-out animate-in fade-in",
                    isExiting && "duration-200 ease-in animate-out fade-out",
                ]
                    .filter(Boolean)
                    .join(" ")
            }
        >
            <AriaModal
                className={({ isEntering, isExiting }) =>
                    [
                        "h-full w-full max-w-[504px] bg-primary shadow-xl outline-hidden",
                        isEntering && "duration-300 ease-out animate-in slide-in-from-right",
                        isExiting && "duration-200 ease-in animate-out slide-out-to-right",
                    ]
                        .filter(Boolean)
                        .join(" ")
                }
            >
                <AriaDialog className="flex h-full flex-col outline-hidden">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-5">
                        <div className="flex flex-col gap-0.5">
                            <h2 className="text-lg font-semibold text-primary">
                                Selecione os itens participantes
                            </h2>
                            <p className="text-sm text-tertiary">
                                Você poderá ajustar preço e limites quando salvar.
                            </p>
                        </div>
                        <ButtonUtility size="sm" color="tertiary" icon={XClose} tooltip="Fechar" onClick={onClose} />
                    </div>

                    {/* Content */}
                    <div className="flex flex-1 flex-col gap-5 overflow-y-auto border-t border-secondary px-6 pt-6 pb-6">
                        <Input
                            size="md"
                            aria-label="Buscar itens"
                            icon={SearchLg}
                            placeholder="Buscar"
                            value={search}
                            onChange={setSearch}
                        />

                        {hasResults ? (
                            <TreeView
                                // Remount when the filter changes so the tree's internal
                                // collection ref captures the *filtered* collection — keeps the
                                // parent "select all" cascading only over the visible items.
                                key={query}
                                aria-label="Itens participantes"
                                size="md"
                                selectionMode="multiple"
                                selectedKeys={selectedKeys}
                                // Seed the (remounted) tree's selection diff with the current
                                // selection so deselecting a parent still cascades correctly.
                                defaultSelectedKeys={selectedKeys}
                                onSelectionChange={setSelectedKeys}
                                expandedKeys={expandedKeys}
                                onExpandedChange={(keys) => setExpandedKeys(keys)}
                            >
                                {filteredTree.map((node) => renderNode(node))}
                            </TreeView>
                        ) : (
                            <BuscaSemResultado query={search.trim()} onLimpar={() => setSearch("")} />
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between gap-4 border-t border-secondary px-6 py-4">
                        <span className="text-sm text-tertiary">{footerLabel}</span>
                        <div className="flex items-center gap-3">
                            <Button size="md" color="secondary" onClick={onClose}>
                                Cancelar
                            </Button>
                            <Button size="md" color="primary" onClick={handleSalvar} isDisabled={count === 0}>
                                Salvar
                            </Button>
                        </div>
                    </div>
                </AriaDialog>
            </AriaModal>
        </AriaModalOverlay>
    );
}

/** Renderiza um nó da árvore recursivamente (raiz, sessão, grupo ou folha). */
const renderNode = (node: TreeNode) => (
    <TreeView.Item key={node.id} id={node.id} textValue={node.label}>
        <TreeView.ItemContent icon={node.icon}>{node.label}</TreeView.ItemContent>
        {node.children?.map((child) => renderNode(child))}
    </TreeView.Item>
);

/* ------------------------------------------------------------------ */
/*  Empty state — busca sem resultado                                 */
/* ------------------------------------------------------------------ */

const BuscaSemResultado = ({ query, onLimpar }: { query: string; onLimpar: () => void }) => (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-10 text-center">
        <div className="flex flex-col items-center gap-4">
            <FeaturedIcon icon={SearchLg} color="gray" theme="modern" size="lg" />
            <div className="flex max-w-[352px] flex-col gap-1">
                <p className="text-md font-semibold text-primary">Nenhum item encontrado</p>
                <p className="text-sm text-tertiary">
                    Não encontramos resultados para “{query}”. Verifique a digitação e tente
                    novamente.
                </p>
            </div>
        </div>
        <Button size="md" color="secondary" onClick={onLimpar}>
            Limpar busca
        </Button>
    </div>
);
