import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, ChevronRight, Copy01, Plus, SearchLg, Share07, ShoppingCart01, SlashCircle01, UsersPlus } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Input } from "@/components/base/input/input";
import { Toggle } from "@/components/base/toggle/toggle";
import { Avatar } from "@/components/base/avatar/avatar";
import { Badge } from "@/components/base/badges/badges";
import { EmptyState } from "@/components/application/empty-state/empty-state";
import { PaginationCardAdvanced } from "@/components/application/pagination/pagination";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { cx } from "@/utils/cx";
import { BackstageLayout } from "../../components/Backstage";
import { useEquipe, usoDaCota, type GrupoOperacao } from "../data/equipe-store";
import { toastSucesso } from "../utils/toast";

const PORTAL_URL = "freepass.ingresse.com/emitir-cortesia";

const iniciais = (nome: string) => nome.trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase() || "GR";

export function EquipeDeOperacao() {
    const navigate = useNavigate();
    const { grupos, temItens, toggleAtivo } = useEquipe();
    const [busca, setBusca] = useState("");
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);

    const filtrados = useMemo(() => {
        const t = busca.trim().toLowerCase();
        return t ? grupos.filter((g) => g.nome.toLowerCase().includes(t) || g.operadores.some((e) => e.toLowerCase().includes(t))) : grupos;
    }, [grupos, busca]);

    const totalPages = Math.max(1, Math.ceil(filtrados.length / pageSize));
    const safePage = Math.min(page, totalPages - 1);
    const visiveis = filtrados.slice(safePage * pageSize, (safePage + 1) * pageSize);

    const vazio = grupos.length === 0;

    return (
        <BackstageLayout activeSection="equipe-de-operacao" activeItem="grupos-operacao">
            <div className="flex min-w-0 flex-1 flex-col">
                <header className="flex items-center gap-3 px-6 py-6">
                    <ButtonUtility size="md" color="tertiary" icon={ArrowLeft} tooltip="Voltar" onClick={() => navigate("/backstage/")} />
                    <h1 className="text-display-xs font-bold text-primary">Equipe de operação</h1>
                    {temItens && (
                        <Button size="md" color="primary" iconLeading={Plus} className="ml-auto" onClick={() => navigate("/backstage/equipe-de-operacao/criar")}>
                            Criar grupo
                        </Button>
                    )}
                </header>

                <main className="flex flex-1 flex-col gap-5 px-6 pb-10">
                    {!temItens ? (
                        <EstadoSemItens onConfigurar={() => navigate("/backstage/catalogo/ingressos")} />
                    ) : vazio ? (
                        <EstadoSemGrupos onCriar={() => navigate("/backstage/equipe-de-operacao/criar")} />
                    ) : (
                        <>
                            {/* Busca (esquerda) + Portal do operador (direita) */}
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                                <div className="flex flex-col gap-1.5 lg:w-[300px]">
                                    <span className="text-sm font-semibold text-secondary">Busca</span>
                                    <Input icon={SearchLg} placeholder="Buscar por nome, e-mail ou item" value={busca} onChange={(v) => { setBusca(v); setPage(0); }} aria-label="Buscar grupo" />
                                </div>
                                <PortalOperador />
                            </div>

                            <ListaGrupos grupos={visiveis} onToggle={toggleAtivo} onDetalhe={(id) => navigate(`/backstage/equipe-de-operacao/${id}`)} />

                            {filtrados.length > 0 && (
                                <div className="overflow-hidden rounded-xl bg-secondary ring-1 ring-border-secondary">
                                    <PaginationCardAdvanced page={safePage + 1} total={totalPages} pageSize={pageSize} onPageChange={(p) => setPage(p - 1)} onPageSizeChange={(s) => { setPageSize(s); setPage(0); }} />
                                </div>
                            )}
                        </>
                    )}
                </main>
            </div>
        </BackstageLayout>
    );
}

/* ------------------------- Portal do operador -------------------- */

const PortalOperador = () => (
    <section className="flex items-center justify-between gap-4 rounded-xl bg-secondary px-4 py-3 lg:w-[400px] lg:shrink-0">
        <div className="flex min-w-0 flex-col">
            <span className="text-sm font-medium text-tertiary">Portal do operador</span>
            <span className="truncate text-sm text-secondary">{PORTAL_URL}</span>
        </div>
        <div className="flex shrink-0 items-center gap-1">
            <ButtonUtility size="sm" color="tertiary" icon={Copy01} tooltip="Copiar link" onClick={() => toastSucesso("Link copiado", "O link do portal do operador foi copiado.")} />
            <ButtonUtility size="sm" color="tertiary" icon={Share07} tooltip="Compartilhar" onClick={() => toastSucesso("Link pronto para compartilhar", "O link do portal do operador foi copiado.")} />
        </div>
    </section>
);

/* --------------------------- Estados vazios ---------------------- */

const EstadoSemItens = ({ onConfigurar }: { onConfigurar: () => void }) => (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-16 text-center">
        <FeaturedIcon icon={SlashCircle01} color="gray" theme="modern" size="lg" />
        <div className="flex max-w-md flex-col gap-1">
            <h2 className="text-lg font-semibold text-primary">Configure algum item antes de gerir operadores</h2>
            <p className="text-sm text-tertiary">É necessário ter itens cadastrados no evento para configurar as permissões dos operadores.</p>
        </div>
        <Button size="md" color="primary" iconLeading={ShoppingCart01} onClick={onConfigurar}>
            Configurar itens
        </Button>
    </div>
);

const AVATARES = [
    { src: "https://www.untitledui.com/images/avatars/marco-kelly?fm=webp&q=80" },
    { src: "https://www.untitledui.com/images/avatars/lily-rose-chedjou?fm=webp&q=80" },
    { src: "https://www.untitledui.com/images/avatars/ammar-foley?fm=webp&q=80" },
    { src: "https://www.untitledui.com/images/avatars/sienna-hewitt?fm=webp&q=80" },
    { src: "https://www.untitledui.com/images/avatars/caitlyn-king?fm=webp&q=80" },
    { src: "https://www.untitledui.com/images/avatars/mathilde-lewis?fm=webp&q=80" },
    { src: "https://www.untitledui.com/images/avatars/zahra-christensen?fm=webp&q=80" },
    { src: "https://www.untitledui.com/images/avatars/olly-schroeder?fm=webp&q=80" },
];

const EstadoSemGrupos = ({ onCriar }: { onCriar: () => void }) => (
    <div className="flex flex-1 items-center justify-center py-16">
        <EmptyState size="md">
            <EmptyState.Header pattern="none" className="mb-6">
                <EmptyState.AvatarRow avatars={AVATARES}>
                    <EmptyState.FeaturedIcon icon={UsersPlus} color="gray" theme="modern-neue" size="xl" className="text-fg-quaternary" />
                </EmptyState.AvatarRow>
            </EmptyState.Header>

            <EmptyState.Content>
                <EmptyState.Title>Configure grupos de operação</EmptyState.Title>
                <EmptyState.Description>Crie grupos de operadores, defina um limite total de cortesias para o grupo e gerencie as permissões de emissão.</EmptyState.Description>
            </EmptyState.Content>

            <EmptyState.Footer>
                <Button size="md" iconLeading={Plus} onClick={onCriar}>
                    Criar grupo
                </Button>
            </EmptyState.Footer>
        </EmptyState>
    </div>
);

/* ----------------------- Lista de grupos (cards) ----------------- */

const ListaGrupos = ({ grupos, onToggle, onDetalhe }: { grupos: GrupoOperacao[]; onToggle: (id: string) => void; onDetalhe: (id: string) => void }) => {
    if (grupos.length === 0) {
        return <div className="rounded-xl bg-secondary px-6 py-16 text-center text-sm text-tertiary ring-1 ring-border-secondary">Nenhum grupo encontrado.</div>;
    }
    return (
        <div className="flex flex-col gap-3">
            {grupos.map((g) => {
                const pct = usoDaCota(g);
                return (
                    <div
                        key={g.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => onDetalhe(g.id)}
                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onDetalhe(g.id); } }}
                        className="group flex cursor-pointer items-center gap-4 rounded-xl bg-secondary px-5 py-4 ring-1 ring-border-secondary transition duration-100 ease-linear hover:bg-secondary_hover hover:ring-border-primary"
                    >
                        {/* Toggle não navega */}
                        <span onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                            <Toggle isSelected={g.ativo} onChange={() => onToggle(g.id)} size="sm" aria-label={`Ativar grupo ${g.nome}`} />
                        </span>

                        <Avatar size="md" initials={iniciais(g.nome)} alt={g.nome} />

                        <div className="flex min-w-0 flex-col">
                            <div className="flex items-center gap-2">
                                <span className="truncate text-sm font-semibold text-primary">{g.nome}</span>
                                {!g.ativo && <Badge size="sm" color="gray" type="modern">Desativado</Badge>}
                            </div>
                            <span className="text-xs text-tertiary">{g.operadores.length} {g.operadores.length === 1 ? "operador" : "operadores"}</span>
                        </div>

                        <div className="ml-auto flex items-center gap-3">
                            <div className="hidden h-2 w-40 overflow-hidden rounded-full bg-quaternary sm:block lg:w-72">
                                <div className={cx("h-full rounded-full", pct >= 100 ? "bg-error-solid" : "bg-brand-solid")} style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-sm font-medium text-secondary tabular-nums">{pct}%</span>
                        </div>

                        <ChevronRight className="size-5 shrink-0 text-fg-quaternary transition duration-100 ease-linear group-hover:translate-x-0.5 group-hover:text-fg-brand-primary" aria-hidden="true" />
                    </div>
                );
            })}
        </div>
    );
};
