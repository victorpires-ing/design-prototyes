import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { ArrowLeft, Edit01, SearchLg, ShoppingBag01, Trash01 } from "@untitledui/icons";
import { EmptyState } from "@/components/application/empty-state/empty-state";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Select } from "@/components/base/select/select";
import type { ProdutoNoEvento, Transferencia } from "@/plataforma";
import { BackstageLayout } from "../../components/Backstage";
import { estadoDoProduto, produtosDo, salvarProdutosDoEvento, useCatalogo } from "../data/catalogo";
import { formatar, useTextosItens } from "../data/textos-itens";
import { BarraDeSalvar, CabecalhoDoItem, CampoPreco, ConfirmarSaida } from "../components/comuns";

/* ------------------------------------------------------------------ */
/*  Produto no evento (ITM-52)                                         */
/*                                                                     */
/*  No evento só se define o que é dele: preço, estoque, transferência */
/*  e se está à venda. Nome, descrição, imagem, preço sugerido e       */
/*  quantidade por pedido ficam em Produtos da organização.            */
/* ------------------------------------------------------------------ */

const LISTA = "/backstage/catalogo/produtos";

const T = {
    voltar: "Produtos",
    naoEncontrado: "Produto não encontrado",
    naoEncontradoDica: "Ele pode ter sido removido deste evento. Volte para a lista e escolha outro.",
    voltarParaProdutos: "Voltar para Produtos",
    carregando: "Carregando produto",
    preco: "Preço",
    precoDica: "Vazio usa o preço sugerido ({preco}).",
    estoque: "Estoque",
    estoqueErro: "Informe um número inteiro de zero ou mais.",
    transferencia: "Transferência",
    transferencias: { sempre: "Sempre permitir", nunca: "Nunca permitir", compra: "Somente na compra" } satisfies Record<Transferencia, string>,
    editarNaOrganizacao: "Editar produto na organização",
    ligado: "{nome} à venda.",
    desligado: "{nome} pausado. Ele para de vender na hora.",
    desfazer: "Desfazer",
    avisoSemEstoque: "Ligado, mas sem estoque: informe o estoque para vender.",
    remover: {
        botao: "Remover do evento",
        titulo: "Remover {nome} do evento?",
        dica: "O produto continua em Produtos da organização.",
        cancelar: "Cancelar",
        confirmar: "Remover",
        removido: "{nome} foi removido do evento.",
    },
};

interface Rascunho {
    preco?: number;
    estoque: string;
    transferencia: Transferencia;
    ativo: boolean;
}

const paraRascunho = (p: ProdutoNoEvento): Rascunho => ({ preco: p.preco, estoque: String(p.estoque), transferencia: p.transferencia ?? "sempre", ativo: p.ativo });

export function ProdutoDetalhe() {
    const { id = "" } = useParams();
    const navigate = useNavigate();
    const { t, preco } = useTextosItens();
    const { carregando, evento, biblioteca } = useCatalogo();
    const achado = useMemo(() => produtosDo(evento, biblioteca).find((p) => p.produto.id === id), [evento, biblioteca, id]);
    const base = useMemo(() => (achado ? paraRascunho(achado.noEvento) : null), [achado]);

    const [rascunho, setRascunho] = useState<{ id: string; valor: Rascunho } | null>(null);
    const atual = rascunho && rascunho.id === id ? rascunho.valor : base;
    const [versao, setVersao] = useState(0);
    const [tentou, setTentou] = useState(false);
    const [salvando, setSalvando] = useState(false);
    /** Destino pendente quando há mudança não salva. */
    const [sair, setSair] = useState<string | null>(null);
    const [remover, setRemover] = useState(false);

    const mudou = !!atual && !!base && JSON.stringify(atual) !== JSON.stringify(base);
    const erroEstoque = atual && !/^\d+$/.test(atual.estoque.trim()) ? T.estoqueErro : undefined;
    const editar = (patch: Partial<Rascunho>) => atual && setRascunho({ id, valor: { ...atual, ...patch } });
    const irPara = (destino: string) => (mudou ? setSair(destino) : navigate(destino));
    const voltar = () => irPara(LISTA);
    const descartar = () => {
        setRascunho(null);
        setTentou(false);
        setVersao((v) => v + 1);
    };

    /** "À venda" do cabeçalho grava na hora, como o toggle da lista (UI-VIS-015); o resto do rascunho continua. */
    const alternarAtivo = async (ativo: boolean, desfazendo = false) => {
        if (!evento || !achado) return;
        try {
            await salvarProdutosDoEvento(evento, (evento.produtos ?? []).map((p) => (p.produtoId === achado.produto.id ? { ...p, ativo } : p)));
            setRascunho((r) => (r && r.id === id ? { id, valor: { ...r.valor, ativo } } : r));
            toast.success(formatar(ativo ? T.ligado : T.desligado, { nome: achado.produto.nome }), desfazendo ? undefined : { action: { label: T.desfazer, onClick: () => void alternarAtivo(!ativo, true) } });
        } catch {
            toast.error(t.erroAoSalvar);
        }
    };

    const salvar = async () => {
        if (!atual || !evento || !achado) return;
        if (erroEstoque) {
            setTentou(true);
            return;
        }
        // Só o que é do evento; regras antigas (vendas, visibilidade) saem ao gravar.
        const noEvento: ProdutoNoEvento = {
            produtoId: achado.produto.id,
            ...(atual.preco != null ? { preco: atual.preco } : {}),
            estoque: Number(atual.estoque.trim()),
            ativo: atual.ativo,
            ...(atual.transferencia !== "sempre" ? { transferencia: atual.transferencia } : {}),
        };
        setSalvando(true);
        try {
            await salvarProdutosDoEvento(evento, (evento.produtos ?? []).map((p) => (p.produtoId === noEvento.produtoId ? noEvento : p)));
            setRascunho(null);
            setTentou(false);
            setVersao((v) => v + 1);
            toast.success(t.salvo);
        } catch {
            toast.error(t.erroAoSalvar);
        } finally {
            setSalvando(false);
        }
    };

    const confirmarRemocao = async () => {
        if (!evento || !achado) return;
        try {
            await salvarProdutosDoEvento(evento, (evento.produtos ?? []).filter((p) => p.produtoId !== achado.produto.id));
            toast.success(formatar(T.remover.removido, { nome: achado.produto.nome }));
            navigate(LISTA);
        } catch {
            toast.error(t.erroAoSalvar);
        }
    };

    const voltarBotao = (
        <Button color="tertiary" size="md" iconLeading={ArrowLeft} onClick={voltar} className="-ml-3 self-start">
            {T.voltar}
        </Button>
    );

    if (carregando || !atual || !achado) {
        return (
            <BackstageLayout activeSection="itens" activeItem="catalogo-produtos">
                <div className="flex min-w-0 flex-1 flex-col gap-6">
                    {voltarBotao}
                    {carregando ? (
                        <span role="status" aria-label={T.carregando} className="mx-auto h-64 w-full max-w-[732px] animate-pulse rounded-2xl bg-secondary motion-reduce:animate-none" />
                    ) : (
                        <div className="flex items-center justify-center py-16">
                            <EmptyState size="sm">
                                <EmptyState.Header>
                                    <EmptyState.FeaturedIcon icon={SearchLg} color="gray" theme="modern" />
                                </EmptyState.Header>
                                <EmptyState.Content>
                                    <EmptyState.Title>{T.naoEncontrado}</EmptyState.Title>
                                    <EmptyState.Description>{T.naoEncontradoDica}</EmptyState.Description>
                                </EmptyState.Content>
                                <EmptyState.Footer>
                                    <Button color="primary" size="md" onClick={() => navigate(LISTA)}>
                                        {T.voltarParaProdutos}
                                    </Button>
                                </EmptyState.Footer>
                            </EmptyState>
                        </div>
                    )}
                </div>
            </BackstageLayout>
        );
    }

    const { produto } = achado;

    return (
        <BackstageLayout activeSection="itens" activeItem="catalogo-produtos">
            <div className="flex min-w-0 flex-1 flex-col gap-6">
                <CabecalhoDoItem
                    voltar={T.voltar}
                    onVoltar={voltar}
                    titulo={produto.nome}
                    midia={
                        <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-secondary">
                            {produto.imagem ? <img src={produto.imagem} alt="" className="size-full object-cover" /> : <ShoppingBag01 className="size-6 text-fg-quaternary" aria-hidden="true" />}
                        </span>
                    }
                    estado={estadoDoProduto(achado.noEvento)}
                    ativo={atual.ativo}
                    onAtivo={(ativo) => void alternarAtivo(ativo)}
                    aviso={achado.noEvento.ativo && achado.noEvento.estoque <= 0 ? T.avisoSemEstoque : undefined}
                />

                <div className="mx-auto flex w-full max-w-[732px] min-w-0 flex-col gap-4">
                    {/* Só três campos: um cartão aberto, sem seções recolhíveis. */}
                    <section className="flex flex-col gap-5 rounded-2xl bg-primary p-5 ring-1 ring-secondary md:p-6">
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <CampoPreco
                                key={`preco-${versao}`}
                                opcional
                                label={T.preco}
                                valor={atual.preco}
                                placeholder={preco(produto.precoBase).replace(/^R\$\s?/, "")}
                                hint={formatar(T.precoDica, { preco: preco(produto.precoBase) })}
                                onChange={(p) => editar({ preco: p })}
                            />
                            <Input
                                label={T.estoque}
                                type="number"
                                inputMode="numeric"
                                isRequired
                                value={atual.estoque}
                                onChange={(estoque) => editar({ estoque })}
                                isInvalid={tentou && !!erroEstoque}
                                hint={tentou ? erroEstoque : undefined}
                            />
                        </div>
                        <div className="sm:max-w-[calc(50%-0.625rem)]">
                            <Select
                                label={T.transferencia}
                                selectedKey={atual.transferencia}
                                onSelectionChange={(k) => k && editar({ transferencia: k as Transferencia })}
                                items={(["sempre", "nunca", "compra"] as const).map((v) => ({ id: v, label: T.transferencias[v] }))}
                            >
                                {(i) => <Select.Item id={i.id}>{i.label}</Select.Item>}
                            </Select>
                        </div>
                    </section>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                        <Button color="secondary" size="md" iconLeading={Edit01} onClick={() => irPara(`/backstage/produtos/${produto.id}`)}>
                            {T.editarNaOrganizacao}
                        </Button>
                        <Button color="tertiary-destructive" size="md" iconLeading={Trash01} onClick={() => setRemover(true)}>
                            {T.remover.botao}
                        </Button>
                    </div>
                </div>

                <BarraDeSalvar visivel={mudou} salvando={salvando} onSalvar={salvar} onDescartar={descartar} />
            </div>

            <ConfirmarSaida aberto={!!sair} onFechar={() => setSair(null)} onSair={() => sair && navigate(sair)} />

            <ModalOverlay isOpen={remover} onOpenChange={setRemover} isDismissable>
                <Modal className="sm:max-w-[400px]">
                    <Dialog aria-label={formatar(T.remover.titulo, { nome: produto.nome })}>
                        <div className="flex w-full flex-col gap-5 rounded-2xl bg-primary p-6 shadow-xl ring-1 ring-border-secondary">
                            <div className="flex flex-col gap-1">
                                <h2 className="text-lg font-semibold text-primary">{formatar(T.remover.titulo, { nome: produto.nome })}</h2>
                                <p className="text-sm text-tertiary">{T.remover.dica}</p>
                            </div>
                            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                <Button color="secondary" size="md" onClick={() => setRemover(false)}>
                                    {T.remover.cancelar}
                                </Button>
                                <Button color="primary-destructive" size="md" onClick={confirmarRemocao}>
                                    {T.remover.confirmar}
                                </Button>
                            </div>
                        </div>
                    </Dialog>
                </Modal>
            </ModalOverlay>
        </BackstageLayout>
    );
}
