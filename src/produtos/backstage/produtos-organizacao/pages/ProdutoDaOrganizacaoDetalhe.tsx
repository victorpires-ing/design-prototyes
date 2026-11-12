import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { ArrowLeft, SearchLg, ShoppingBag01, Trash01 } from "@untitledui/icons";
import { EmptyState } from "@/components/application/empty-state/empty-state";
import { FileUploadDropZone } from "@/components/application/file-upload/file-upload-base";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Input } from "@/components/base/input/input";
import { TextArea } from "@/components/base/textarea/textarea";
import { Surgir } from "@/components/foundations/transicao";
import type { ProdutoDaOrganizacao, RegrasDeVenda } from "@/plataforma";
import { TITULO_PAGINA } from "@/produtos/backstage/components/titulo-pagina";
import { BackstageLayout } from "../../components/Backstage";
import { BarraDeSalvar, CampoPreco, CamposDeVendas, ConfirmarSaida, SecaoDoItem, irParaPrimeiroErro } from "../../itens/components/comuns";
import { novoId } from "../../itens/data/catalogo";
import { formatar, useTextosItens } from "../../itens/data/textos-itens";
import { useBiblioteca } from "../data/biblioteca";

/* ------------------------------------------------------------------ */
/*  Detalhe do produto na organização (POR)                            */
/*                                                                     */
/*  Nome, descrição, imagem, preço sugerido e quantidade por pedido    */
/*  valem para todos os eventos. Preço, estoque, transferência e       */
/*  à venda são de cada evento (Itens › Produtos).                     */
/* ------------------------------------------------------------------ */

const LISTA = "/backstage/produtos";
const MAX_IMAGEM = 400 * 1024;

const T = {
    voltar: "Produtos",
    novo: "Novo produto",
    novoDica: "Depois de criado, ele pode ser adicionado em Itens › Produtos de cada evento.",
    eventos: { one: "Vendido em {n} evento.", other: "Vendido em {n} eventos." },
    semEvento: "Ainda não está em nenhum evento.",
    naoEncontrado: "Produto não encontrado",
    naoEncontradoDica: "Ele pode ter sido excluído. Volte para a lista e escolha outro.",
    carregando: "Carregando produto",
    info: "Informações",
    nome: "Nome",
    nomePlaceholder: "Ex.: Camiseta oficial",
    nomeErro: "Dê um nome ao produto.",
    descricao: "Descrição",
    descricaoPlaceholder: "Material, tamanhos e o que mais ajuda a decidir a compra.",
    imagem: "Imagem",
    imagemDica: "PNG ou JPG até 400 KB, quadrada de preferência.",
    imagemGrande: "Escolha uma imagem de até {maximo} KB: esta tem {tamanho} KB.",
    imagemErro: "Tente outra imagem: não foi possível ler este arquivo.",
    removerImagem: "Remover imagem",
    precoBase: "Preço sugerido",
    precoBaseDica: "Cada evento começa com este preço e pode mudar.",
    precoBaseErro: "Informe um preço de zero ou mais.",
    revise: "Revise os campos destacados para salvar o produto.",
    criado: "{nome} criado.",
    excluir: "Excluir produto",
    excluirEmUso: { one: "Está em {n} evento: remova dele antes de excluir.", other: "Está em {n} eventos: remova deles antes de excluir." },
    excluirTitulo: "Excluir {nome}?",
    excluirDica: "O produto sai da organização. Esta ação não pode ser desfeita.",
    cancelar: "Cancelar",
    confirmar: "Excluir",
    excluido: "{nome} excluído.",
};

interface Rascunho {
    nome: string;
    descricao: string;
    imagem?: string;
    precoBase: number;
    vendas?: RegrasDeVenda;
}

const VAZIO: Rascunho = { nome: "", descricao: "", precoBase: 0 };

const limparVendas = (v: RegrasDeVenda | undefined): RegrasDeVenda | undefined =>
    v?.limitePorPedido != null ? { limitePorPedido: v.limitePorPedido, ...((v.minimoPorPedido ?? 1) > 1 ? { minimoPorPedido: v.minimoPorPedido } : {}) } : undefined;

const paraRascunho = (p: ProdutoDaOrganizacao): Rascunho => ({ nome: p.nome, descricao: p.descricao ?? "", imagem: p.imagem, precoBase: p.precoBase, vendas: limparVendas(p.vendas) });
const assinatura = (r: Rascunho) => JSON.stringify({ ...r, nome: r.nome.trim(), descricao: r.descricao.trim(), vendas: limparVendas(r.vendas) });

export function ProdutoDaOrganizacaoDetalhe() {
    const { id = "" } = useParams();
    const navigate = useNavigate();
    const { t, plural } = useTextosItens();
    const { carregando, biblioteca, usos, gravar } = useBiblioteca();
    const novo = id === "novo";
    const produto = useMemo(() => biblioteca.find((p) => p.id === id), [biblioteca, id]);
    const base = useMemo(() => (novo ? VAZIO : produto ? paraRascunho(produto) : null), [novo, produto]);

    const [rascunho, setRascunho] = useState<{ id: string; valor: Rascunho } | null>(null);
    const atual = rascunho && rascunho.id === id ? rascunho.valor : base;
    const [versao, setVersao] = useState(0);
    const [tentou, setTentou] = useState(0);
    const [salvando, setSalvando] = useState(false);
    const [sair, setSair] = useState(false);
    const [excluir, setExcluir] = useState(false);

    const mudou = !!atual && !!base && assinatura(atual) !== assinatura(base);
    const erroNome = atual && !atual.nome.trim() ? T.nomeErro : undefined;
    const erroPreco = atual && (!Number.isFinite(atual.precoBase) || atual.precoBase < 0) ? T.precoBaseErro : undefined;
    const mostrar = tentou > 0;
    const usadoEm = produto ? (usos.get(produto.id) ?? 0) : 0;

    const editar = (patch: Partial<Rascunho>) => atual && setRascunho({ id, valor: { ...atual, ...patch } });
    const descartar = () => {
        setRascunho(null);
        setTentou(0);
        setVersao((v) => v + 1);
    };
    const voltar = () => (mudou ? setSair(true) : navigate(LISTA));

    const salvar = async () => {
        if (!atual) return;
        if (erroNome || erroPreco) {
            setTentou((n) => n + 1);
            toast.error(T.revise);
            irParaPrimeiroErro();
            return;
        }
        const vendas = limparVendas(atual.vendas);
        const montar = (anterior: Pick<ProdutoDaOrganizacao, "id" | "criadoEm">): ProdutoDaOrganizacao => ({
            ...anterior,
            nome: atual.nome.trim(),
            ...(atual.descricao.trim() ? { descricao: atual.descricao.trim() } : {}),
            ...(atual.imagem ? { imagem: atual.imagem } : {}),
            precoBase: atual.precoBase,
            ...(vendas ? { vendas } : {}),
        });
        setSalvando(true);
        try {
            if (novo) {
                const criado = montar({ id: novoId("prd"), criadoEm: new Date().toISOString() });
                await gravar([...biblioteca, criado]);
                setRascunho(null);
                setTentou(0);
                toast.success(formatar(T.criado, { nome: criado.nome }));
                navigate(`${LISTA}/${criado.id}`, { replace: true });
                return;
            }
            if (!produto) return;
            const salvo = montar(produto);
            await gravar(biblioteca.map((p) => (p.id === salvo.id ? salvo : p)));
            setRascunho(null);
            setTentou(0);
            setVersao((v) => v + 1);
            toast.success(t.salvo);
        } catch {
            toast.error(t.erroAoSalvar);
        } finally {
            setSalvando(false);
        }
    };

    const confirmarExclusao = async () => {
        if (!produto) return;
        try {
            await gravar(biblioteca.filter((p) => p.id !== produto.id));
            toast.success(formatar(T.excluido, { nome: produto.nome }));
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

    if (carregando || !atual || !base) {
        return (
            <BackstageLayout showEventContext={false} activeProducer="produtos" showLayoutSwitcher={false}>
                <div className="flex min-w-0 flex-1 flex-col gap-6">
                    {voltarBotao}
                    {carregando ? (
                        <div role="status" aria-label={T.carregando} className="mx-auto flex w-full max-w-[732px] flex-col gap-4">
                            {[0, 1].map((i) => (
                                <span key={i} aria-hidden="true" className="h-[72px] w-full animate-pulse rounded-2xl bg-secondary motion-reduce:animate-none" />
                            ))}
                        </div>
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
                            </EmptyState>
                        </div>
                    )}
                </div>
            </BackstageLayout>
        );
    }

    return (
        <BackstageLayout showEventContext={false} activeProducer="produtos" showLayoutSwitcher={false}>
            <div className="flex min-w-0 flex-1 flex-col gap-6">
                <header className="flex flex-col gap-3">
                    {voltarBotao}
                    <h1 className={`${TITULO_PAGINA} break-words`}>{novo ? atual.nome.trim() || T.novo : base.nome}</h1>
                    <p className="text-md text-tertiary">{novo ? T.novoDica : usadoEm ? plural(T.eventos, usadoEm) : T.semEvento}</p>
                </header>

                <div className="mx-auto flex w-full max-w-[732px] min-w-0 flex-col gap-4">
                    <SecaoDoItem
                        titulo={T.info}
                        alerta={mostrar && !!(erroNome || erroPreco)}
                    >
                        <Input
                            label={T.nome}
                            placeholder={T.nomePlaceholder}
                            isRequired
                            value={atual.nome}
                            onChange={(nome) => editar({ nome })}
                            isInvalid={mostrar && !!erroNome}
                            hint={mostrar ? erroNome : undefined}
                        />
                        <TextArea label={T.descricao} placeholder={T.descricaoPlaceholder} rows={4} value={atual.descricao} onChange={(descricao) => editar({ descricao })} />
                        <CampoImagem imagem={atual.imagem} onChange={(imagem) => editar({ imagem })} />
                        <div className="sm:max-w-60">
                            <CampoPreco
                                key={`base-${versao}`}
                                label={T.precoBase}
                                isRequired
                                valor={atual.precoBase}
                                onChange={(precoBase) => editar({ precoBase })}
                                isInvalid={mostrar && !!erroPreco}
                                hint={mostrar && erroPreco ? erroPreco : T.precoBaseDica}
                            />
                        </div>
                    </SecaoDoItem>

                    <SecaoDoItem titulo={t.vendas.titulo}>
                        <CamposDeVendas key={`vendas-${versao}`} valor={atual.vendas} onChange={(vendas) => editar({ vendas })} />
                    </SecaoDoItem>

                    {!novo && (
                        <div className="flex flex-col gap-2 pt-2">
                            {usadoEm > 0 ? (
                                <p className="text-sm text-tertiary">{plural(T.excluirEmUso, usadoEm)}</p>
                            ) : (
                                <Button color="secondary-destructive" size="md" iconLeading={Trash01} className="self-start" onClick={() => setExcluir(true)}>
                                    {T.excluir}
                                </Button>
                            )}
                        </div>
                    )}
                </div>

                <BarraDeSalvar visivel={novo || mudou} salvando={salvando} onSalvar={salvar} onDescartar={novo && !mudou ? voltar : descartar} />
            </div>

            <ConfirmarSaida aberto={sair} onFechar={() => setSair(false)} onSair={() => navigate(LISTA)} />

            <ModalOverlay isOpen={excluir} onOpenChange={setExcluir} isDismissable>
                <Modal className="sm:max-w-[400px]">
                    <Dialog aria-label={formatar(T.excluirTitulo, { nome: base.nome })}>
                        <div className="flex w-full flex-col gap-5 rounded-2xl bg-primary p-6 shadow-xl ring-1 ring-border-secondary">
                            <div className="flex flex-col gap-1">
                                <h2 className="text-lg font-semibold text-primary">{formatar(T.excluirTitulo, { nome: base.nome })}</h2>
                                <p className="text-sm text-tertiary">{T.excluirDica}</p>
                            </div>
                            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                <Button color="secondary" size="md" onClick={() => setExcluir(false)}>
                                    {T.cancelar}
                                </Button>
                                <Button color="primary-destructive" size="md" onClick={confirmarExclusao}>
                                    {T.confirmar}
                                </Button>
                            </div>
                        </div>
                    </Dialog>
                </Modal>
            </ModalOverlay>
        </BackstageLayout>
    );
}

const lerComoDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result));
        r.onerror = reject;
        r.readAsDataURL(file);
    });

/** Imagem do produto: mostra a atual e troca por PNG/JPG até 400 KB, gravada como dataUrl. */
function CampoImagem({ imagem, onChange }: { imagem?: string; onChange: (v: string | undefined) => void }) {
    const escolher = async (file: File) => {
        if (file.size > MAX_IMAGEM) {
            toast.error(formatar(T.imagemGrande, { maximo: Math.round(MAX_IMAGEM / 1024), tamanho: Math.round(file.size / 1024) }));
            return;
        }
        try {
            onChange(await lerComoDataUrl(file));
        } catch {
            toast.error(T.imagemErro);
        }
    };
    return (
        <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-secondary">{T.imagem}</span>
            <Surgir visivel={!!imagem}>
                <div className="flex items-center gap-3 rounded-xl p-3 ring-1 ring-secondary">
                    <span className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-secondary">
                        {imagem ? <img src={imagem} alt="" className="size-full object-cover" /> : <ShoppingBag01 className="size-6 text-fg-quaternary" aria-hidden="true" />}
                    </span>
                    <span className="min-w-0 flex-1 text-sm text-tertiary">{T.imagemDica}</span>
                    <ButtonUtility icon={Trash01} color="tertiary" tooltip={T.removerImagem} onClick={() => onChange(undefined)} className="size-11" />
                </div>
            </Surgir>
            <Surgir visivel={!imagem}>
                <FileUploadDropZone
                    // "ou arraste o arquivo" alinhado ao meio do botão de 44 px.
                    className="[&_label+span]:self-center"
                    accept="image/png,image/jpeg"
                    allowsMultiple={false}
                    hint={T.imagemDica}
                    onDropFiles={(files) => {
                        const file = files[0];
                        if (file) void escolher(file);
                    }}
                />
            </Surgir>
        </div>
    );
}
