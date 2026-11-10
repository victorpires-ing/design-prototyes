import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Copy01, MessageQuestionSquare, Plus, SearchLg, Trash01 } from "@untitledui/icons";
import { Reorder, useDragControls, useReducedMotion } from "motion/react";
import { EmptyState } from "@/components/application/empty-state/empty-state";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { InputBase } from "@/components/base/input/input";
import { DURACAO_TRANSICAO, Surgir } from "@/components/foundations/transicao";
import type { Pergunta } from "@/plataforma";
import { TITULO_PAGINA } from "@/produtos/backstage/components/titulo-pagina";
import { BackstageLayout } from "../../components/Backstage";
import { useResumoDeIngressos } from "../../aberturas-de-vendas/components/SeletorDeIngressos";
import { Alca, mover } from "../../itens/components/Alca";
import { LIMIAR_FERRAMENTAS, paraBusca } from "../../itens/components/escala";
import { novoId, salvarPerguntas, useCatalogo } from "../../itens/data/catalogo";
import { formatar, useTextosItens } from "../../itens/data/textos-itens";
import { NOME_DO_TIPO, setoresPorIngresso } from "../data/questionario";
import { CartaoEdicaoNaCarteira, editaveisNaCarteira } from "../components/EdicaoNaCarteira";

/* ------------------------------------------------------------------ */
/*  Questionário do evento (QST)                                       */
/*                                                                     */
/*  Perguntas que quem compra responde, uma vez por ingresso ou combo, */
/*  na compra e na transferência. A lista é a ordem do formulário:     */
/*  arrastar ou setas na alça. Abrir a pergunta leva à página dela     */
/*  (UI-NAV-001); duplicar e excluir ficam na linha.                   */
/* ------------------------------------------------------------------ */

export const T = {
    titulo: "Questionário",
    subtitulo: "Perguntas que quem compra responde, uma vez por ingresso ou combo.",
    nova: "Nova pergunta",
    buscar: "Buscar pergunta",
    contagem: "{visiveis} de {total}",
    nada: "Nenhuma pergunta com esse texto.",
    vazio: "Nenhuma pergunta ainda",
    vazioDica: "Crie as perguntas do formulário do participante e escolha em quais ingressos e combos cada uma aparece.",
    carregando: "Carregando perguntas",
    obrigatoria: "Obrigatória",
    opcional: "Opcional",
    naCarteira: "Editável na carteira",
    apareceEm: "Aparece em {itens}",
    combos: { one: "{n} combo", other: "{n} combos" },
    semItens: "Não aparece em nenhum ingresso ou combo",
    abrir: "Abrir {pergunta}",
    duplicar: "Duplicar {pergunta}",
    excluir: "Excluir {pergunta}",
    copia: "Cópia de {pergunta}",
    duplicada: "{pergunta} duplicada.",
    erro: "Tente de novo: não foi possível salvar.",
    ordemNaBusca: "Limpe a busca para mudar a ordem.",
    confirmar: {
        titulo: "Excluir {pergunta}?",
        dica: "Ela sai do formulário de todos os ingressos e combos. Esta ação não pode ser desfeita.",
        cancelar: "Cancelar",
        excluir: "Excluir",
        excluida: "Pergunta excluída.",
    },
};

/** "60 ingressos em 7 setores e 2 combos": resume onde a pergunta aparece, para qualquer volume (UI-LST-002). */
export function useOndeAparece() {
    const { plural, locale } = useTextosItens();
    const resumirIngressos = useResumoDeIngressos();
    return (p: Pergunta, setorDe: Map<string, string>) => {
        const ingressos = p.itens.filter((i) => i.tipo === "ingresso");
        const combos = p.itens.filter((i) => i.tipo === "combo").length;
        const partes = [
            ingressos.length ? resumirIngressos(ingressos.length, new Set(ingressos.map((i) => setorDe.get(i.id) ?? i.id)).size) : "",
            combos ? plural(T.combos, combos) : "",
        ].filter(Boolean);
        return partes.length ? new Intl.ListFormat(locale, { style: "long", type: "conjunction" }).format(partes) : "";
    };
}

export function Questionario() {
    const navigate = useNavigate();
    const { carregando, evento } = useCatalogo();
    const { numero } = useTextosItens();
    const ondeAparece = useOndeAparece();
    const setorDe = useMemo(() => setoresPorIngresso(evento), [evento?.sessoes]);

    // Ordem local enquanto arrasta; grava ao soltar.
    const [local, setLocal] = useState<Pergunta[]>(evento?.perguntas ?? []);
    const localRef = useRef(local);
    localRef.current = local;
    useEffect(() => setLocal(evento?.perguntas ?? []), [evento?.perguntas]);

    const [excluir, setExcluir] = useState<Pergunta | null>(null);
    const [busca, setBusca] = useState("");
    const termo = paraBusca(busca.trim());
    const filtradas = useMemo(() => (termo ? local.filter((p) => paraBusca(p.titulo).includes(termo)) : local), [local, termo]);

    const gravar = async (lista: Pergunta[], mensagem?: string) => {
        if (!evento) return false;
        try {
            await salvarPerguntas(evento, lista);
            if (mensagem) toast.success(mensagem);
            return true;
        } catch {
            toast.error(T.erro);
            setLocal(evento.perguntas ?? []);
            return false;
        }
    };

    const moverPorTeclado = (id: string, delta: -1 | 1) => {
        const de = local.findIndex((p) => p.id === id);
        const para = de + delta;
        if (de < 0 || para < 0 || para >= local.length) return;
        const prox = mover(local, de, para);
        setLocal(prox);
        void gravar(prox);
    };

    const duplicar = (p: Pergunta) => {
        const copia: Pergunta = {
            ...p,
            id: novoId("prg"),
            titulo: formatar(T.copia, { pergunta: p.titulo }),
            opcoes: p.opcoes?.map((o) => ({ ...o, id: novoId("opc") })),
            itens: [...p.itens],
        };
        const i = local.findIndex((x) => x.id === p.id);
        const prox = [...local.slice(0, i + 1), copia, ...local.slice(i + 1)];
        setLocal(prox);
        void gravar(prox, formatar(T.duplicada, { pergunta: p.titulo }));
    };

    const lista = evento?.perguntas ?? [];
    const naCarteira = editaveisNaCarteira(evento);

    return (
        <BackstageLayout activeSection="itens" activeItem="catalogo-questionario">
            <div className="flex min-w-0 flex-1 flex-col gap-6">
                <header className="flex flex-wrap items-end justify-between gap-4">
                    <div className="flex min-w-0 flex-col gap-1">
                        <h1 className={TITULO_PAGINA}>{T.titulo}</h1>
                        <p className="text-md text-tertiary">{T.subtitulo}</p>
                    </div>
                    {lista.length > 0 && (
                        <Button color="primary" size="md" iconLeading={Plus} onClick={() => navigate("/backstage/catalogo/questionario/nova")}>
                            {T.nova}
                        </Button>
                    )}
                </header>

                {carregando ? (
                    <div role="status" aria-label={T.carregando} className="flex flex-col gap-2">
                        {[0, 1, 2].map((i) => (
                            <span key={i} aria-hidden="true" className="h-16 w-full animate-pulse rounded-xl bg-secondary motion-reduce:animate-none" />
                        ))}
                    </div>
                ) : lista.length === 0 ? (
                    <div className="flex items-center justify-center py-16">
                        <EmptyState size="sm">
                            <EmptyState.Header>
                                <EmptyState.FeaturedIcon icon={MessageQuestionSquare} color="gray" theme="modern" />
                            </EmptyState.Header>
                            <EmptyState.Content>
                                <EmptyState.Title>{T.vazio}</EmptyState.Title>
                                <EmptyState.Description>{T.vazioDica}</EmptyState.Description>
                            </EmptyState.Content>
                            <EmptyState.Footer>
                                <Button color="primary" size="md" iconLeading={Plus} onClick={() => navigate("/backstage/catalogo/questionario/nova")}>
                                    {T.nova}
                                </Button>
                            </EmptyState.Footer>
                        </EmptyState>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {evento && <CartaoEdicaoNaCarteira evento={evento} />}
                        {lista.length > LIMIAR_FERRAMENTAS && (
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <InputBase
                                    size="sm"
                                    icon={SearchLg}
                                    aria-label={T.buscar}
                                    placeholder={T.buscar}
                                    value={busca}
                                    onChange={(v: unknown) => setBusca(typeof v === "string" ? v : ((v as { target?: { value?: string } })?.target?.value ?? ""))}
                                    wrapperClassName="w-full sm:max-w-80"
                                />
                                <span role="status" className="text-sm text-tertiary tabular-nums">
                                    {termo ? T.ordemNaBusca : formatar(T.contagem, { visiveis: numero(filtradas.length), total: numero(local.length) })}
                                </span>
                            </div>
                        )}
                        {/* A ordem da lista é a do formulário. Na busca, a alça some: mover numa lista filtrada confundiria a posição. */}
                        <Reorder.Group as="ol" axis="y" values={local} onReorder={termo ? () => undefined : setLocal} className="flex flex-col overflow-hidden rounded-2xl bg-primary ring-1 ring-secondary">
                            {filtradas.map((p) => (
                                <LinhaArrastavel key={p.id} pergunta={p} arrastavel={!termo} onSoltar={() => void gravar(localRef.current)} onMoverPorTeclado={(d) => moverPorTeclado(p.id, d)}>
                                    {(alca) => (
                                        <div className="relative flex items-start gap-2 px-3 py-4 md:px-4">
                                            <div className="w-8 shrink-0">{alca}</div>
                                            <div className="flex min-w-0 flex-1 flex-col gap-1">
                                                {/* O título cobre a linha: clicar em qualquer ponto abre a pergunta. */}
                                                <button
                                                    type="button"
                                                    data-linha
                                                    aria-label={formatar(T.abrir, { pergunta: p.titulo })}
                                                    onClick={() => navigate(`/backstage/catalogo/questionario/${p.id}`)}
                                                    className="text-left text-md font-semibold text-primary outline-focus-ring after:absolute after:inset-0 after:content-[''] focus-visible:outline-2 focus-visible:outline-offset-2"
                                                >
                                                    {p.titulo}
                                                </button>
                                                {/* Dados em linhas próprias, sem símbolo separador (UI-TXT-010). */}
                                                <dl className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-tertiary">
                                                    <div>
                                                        <dt className="sr-only">Tipo</dt>
                                                        <dd>{NOME_DO_TIPO[p.tipo]}</dd>
                                                    </div>
                                                    <div>
                                                        <dt className="sr-only">Resposta</dt>
                                                        <dd>{p.obrigatoria ? T.obrigatoria : T.opcional}</dd>
                                                    </div>
                                                    {naCarteira.has(p.id) && (
                                                        <div>
                                                            <dt className="sr-only">Carteira</dt>
                                                            <dd>{T.naCarteira}</dd>
                                                        </div>
                                                    )}
                                                    <div>
                                                        <dt className="sr-only">Onde aparece</dt>
                                                        <dd className={p.itens.length ? undefined : "text-warning-primary"}>
                                                            {p.itens.length ? formatar(T.apareceEm, { itens: ondeAparece(p, setorDe) }) : T.semItens}
                                                        </dd>
                                                    </div>
                                                </dl>
                                            </div>
                                            <div className="relative z-10 flex shrink-0 items-center gap-1">
                                                <ButtonUtility size="sm" color="tertiary" icon={Copy01} tooltip={formatar(T.duplicar, { pergunta: p.titulo })} onClick={() => duplicar(p)} />
                                                <ButtonUtility size="sm" color="tertiary" icon={Trash01} tooltip={formatar(T.excluir, { pergunta: p.titulo })} onClick={() => setExcluir(p)} />
                                            </div>
                                        </div>
                                    )}
                                </LinhaArrastavel>
                            ))}
                        </Reorder.Group>
                        <Surgir visivel={filtradas.length === 0}>
                            <p className="text-sm text-tertiary">{T.nada}</p>
                        </Surgir>
                    </div>
                )}
            </div>

            <ConfirmarExclusao
                pergunta={excluir}
                onFechar={() => setExcluir(null)}
                onExcluir={async () => {
                    if (!excluir) return;
                    const prox = local.filter((p) => p.id !== excluir.id);
                    if (await gravar(prox, T.confirmar.excluida)) {
                        setLocal(prox);
                        setExcluir(null);
                    }
                }}
            />
        </BackstageLayout>
    );
}

function LinhaArrastavel({
    pergunta,
    arrastavel,
    children,
    onSoltar,
    onMoverPorTeclado,
}: {
    pergunta: Pergunta;
    arrastavel: boolean;
    children: (alca: ReactNode) => ReactNode;
    onSoltar: () => void;
    onMoverPorTeclado: (d: -1 | 1) => void;
}) {
    const controles = useDragControls();
    const reduzir = useReducedMotion();
    return (
        <Reorder.Item
            as="li"
            value={pergunta}
            dragListener={false}
            dragControls={controles}
            onDragEnd={onSoltar}
            transition={{ duration: reduzir ? 0 : DURACAO_TRANSICAO }}
            className="group/linha border-b border-secondary bg-primary last:border-b-0 hover:bg-primary_hover"
        >
            {children(arrastavel ? <Alca grupo="linha" nome={pergunta.titulo} onPointerDown={(e) => controles.start(e)} onMover={onMoverPorTeclado} /> : null)}
        </Reorder.Item>
    );
}

/** Confirmação de exclusão, usada na lista e na página da pergunta. */
export function ConfirmarExclusao({ pergunta, onFechar, onExcluir }: { pergunta: Pergunta | null; onFechar: () => void; onExcluir: () => void }) {
    return (
        <ModalOverlay isOpen={!!pergunta} onOpenChange={(v) => !v && onFechar()} isDismissable>
            <Modal className="sm:max-w-[400px]">
                <Dialog aria-label={pergunta ? formatar(T.confirmar.titulo, { pergunta: pergunta.titulo }) : undefined}>
                    <div className="flex w-full flex-col gap-5 rounded-2xl bg-primary p-6 shadow-xl ring-1 ring-border-secondary">
                        <div className="flex flex-col gap-1">
                            <h2 className="text-lg font-semibold text-primary">{pergunta && formatar(T.confirmar.titulo, { pergunta: pergunta.titulo })}</h2>
                            <p className="text-sm text-tertiary">{T.confirmar.dica}</p>
                        </div>
                        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <Button color="secondary" size="md" onClick={onFechar}>
                                {T.confirmar.cancelar}
                            </Button>
                            <Button color="primary-destructive" size="md" onClick={onExcluir}>
                                {T.confirmar.excluir}
                            </Button>
                        </div>
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
}
