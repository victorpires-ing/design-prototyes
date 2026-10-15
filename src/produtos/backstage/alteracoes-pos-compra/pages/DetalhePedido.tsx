import { useEffect, useMemo, useRef, useState, type FC, type ReactNode } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { Dialog as AriaDialog, DialogTrigger as AriaDialogTrigger, Popover as AriaPopover } from "react-aria-components";
import { AnimatePresence, motion } from "motion/react";
import { AlertTriangle, ArrowLeft, Calendar, Check, Copy01, DotsVertical, Mail01, Phone, Tag01, User01 } from "@untitledui/icons";
import { Badge, BadgeWithDot } from "@/components/base/badges/badges";
import { AvatarProfilePhoto } from "@/components/base/avatar/avatar-profile-photo";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { Tabs } from "@/components/application/tabs/tabs";
import { useClipboard } from "@/hooks/use-clipboard";
import { cx } from "@/utils/cx";
import { BackstageLayout } from "../../components/Backstage";
import { CartaoOperacao, idDoCartao } from "../components/CartaoOperacao";
import {
    TIPO_OPERACAO_ICONE, FOCO, FOCO_ESCOPO, Miniatura, iniciaisDe, mascararCPF, telefoneParaCopia } from "../components/pos-compra-ui";
import { descartarRascunho, identidadeDaLinha } from "../components/wizard/seletor-unidades";
import {
    SESSOES,
    TIPO_OPERACAO_CURTO,
    descreverMotivo,
    disponivelPara,
    formatarMoeda,
    getConta,
    getEvento,
    getItem,
    pedidoEncerrado,
    solicitacaoDaLinha,
    temFormulario,
    totaisDoPedido,
    usePedidos,
    useRascunhos,
    uuidCurto,
    type CatalogoItem,
    type EntradaHistorico,
    type Pedido,
    type PedidoItem,
    type Rascunho,
    type Sessao,
    type Solicitacao,
    type TipoOperacao,
    type Verbo,
} from "../data/pos-compra-store";

const plural = (n: number, singular: string, varios: string) => `${n} ${n === 1 ? singular : varios}`;
const rotuloDoLote = (lote: string) => (lote.toLowerCase().startsWith("lote") ? lote : `Lote ${lote}`);
const tituloDaSessao = (sessao: Sessao) => `${sessao.dataLabel}, ${sessao.horaLabel.replace(":", "h")}`;
const horaDe = (instante: number) => new Date(instante).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
const dataDoLabel = (dataLabel: string) => dataLabel.split(", ")[0];
const horaDoLabel = (dataLabel: string) => dataLabel.split(", ")[1] ?? "";
/** "Cartão de crédito (3x)" vira "Cartão de crédito em 3x". */
const formaDePagamento = (meio: string) => meio.replace(/\s*\((\d+)x\)/, " em $1x");

type Aba = "itens" | "historico";

const TIPO_DO_VERBO: Record<Verbo, TipoOperacao> = { transferir: "troca-titularidade", trocar: "troca-item", formulario: "alterar-respostas" };
const VERBO_DO_TIPO: Record<TipoOperacao, Verbo> = { "troca-titularidade": "transferir", "troca-item": "trocar", "alterar-respostas": "formulario" };

export function DetalhePedido() {
    const { pedidoId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const pedidos = usePedidos();
    const pedido = pedidos.find((p) => p.id === pedidoId);
    const rascunhos = useRascunhos(pedidoId ?? "");
    /* Sempre abre em Itens e nada troca de aba sozinho: a mesma ação (abrir o pedido) leva sempre
       ao mesmo lugar. O que está em andamento fica acima das abas, visível de qualquer uma. */
    const [aba, setAba] = useState<Aba>("itens");
    /* Voltando de um fluxo, o cartão recém-criado chega pela URL para receber o foco. */
    const [focar, setFocar] = useState<string | null>(() => new URLSearchParams(location.search).get("focar"));
    /* A lista guarda busca e filtros na URL: voltar devolve a lista como estava. */
    const voltarPara = `/backstage/pedidos${(location.state as { de?: string } | null)?.de ?? ""}`;
    const comprador = pedido ? getConta(pedido.compradorId) : undefined;

    useEffect(() => {
        if (!pedido) return;
        const anterior = document.title;
        document.title = `${comprador?.nome ?? "Pedido"} · Pedido ${uuidCurto(pedido.id)} · Backstage`;
        return () => {
            document.title = anterior;
        };
    }, [pedido?.id, comprador?.nome]);

    /* Leva o foco até um cartão ou grupo do histórico. Espera o overlay devolver o foco ao botão
       que o abriu antes de mover, senão o foco volta para trás do cartão novo. */
    useEffect(() => {
        if (!focar) return;
        const id = window.setTimeout(() => {
            const alvo = document.getElementById(focar);
            alvo?.scrollIntoView({ behavior: "smooth", block: "center" });
            alvo?.focus({ preventScroll: true });
            setFocar(null);
        }, 80);
        return () => window.clearTimeout(id);
    }, [focar, pedido]);

    if (!pedido) {
        return (
            <BackstageLayout showEventContext={false} activeProducer="pedidos">
                <div className="flex min-w-0 flex-1 flex-col gap-4 p-6">
                    <p className="text-sm text-tertiary">Pedido não encontrado.</p>
                    <div>
                        <Button size="md" color="secondary" iconLeading={ArrowLeft} onClick={() => navigate(voltarPara)}>
                            Voltar para pedidos
                        </Button>
                    </div>
                </div>
            </BackstageLayout>
        );
    }

    /* Os fluxos são telas com rota própria. A unidade escolhida e o rascunho viajam na URL, então
       recarregar a página ou mandar o link para um colega cai no mesmo ponto do atendimento. */
    const rotaDoFluxo = (verbo: Verbo, linhas: string[], rascunhoId?: string) => {
        const query = new URLSearchParams();
        if (linhas.length > 0) query.set("linhas", linhas.join(","));
        if (rascunhoId) query.set("rascunho", rascunhoId);
        const busca = query.toString();
        return `/backstage/pedidos/${pedido.id}/${verbo}${busca ? `?${busca}` : ""}`;
    };
    const abrir = (verbo: Verbo, linhas: string[]) => {
        /* Um rascunho por unidade: o mesmo verbo numa unidade que já está num rascunho retoma ele. */
        const tipo = TIPO_DO_VERBO[verbo];
        const rascunho = linhas.length === 1 ? rascunhos.find((r) => r.tipo === tipo && r.linhasSelecionadas.includes(linhas[0])) : undefined;
        navigate(rotaDoFluxo(verbo, linhas, rascunho?.id));
    };
    const continuar = (rascunho: Rascunho) => navigate(rotaDoFluxo(VERBO_DO_TIPO[rascunho.tipo], rascunho.linhasSelecionadas, rascunho.id));
    const verNoHistorico = (solicitacaoId?: string) => {
        setAba("historico");
        if (solicitacaoId) setFocar(`grupo-${solicitacaoId}`);
    };

    return (
        <BackstageLayout showEventContext={false} activeProducer="pedidos">
            <motion.div
                className={cx("flex min-w-0 flex-1 flex-col gap-4 p-4 md:py-6 md:pr-6 md:pl-0", FOCO_ESCOPO)}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, ease: "easeOut" }}
            >
                <div>
                    <Button size="sm" color="link-gray" iconLeading={ArrowLeft} href={voltarPara}>
                        Pedidos
                    </Button>
                </div>

                {/* Trilho e trabalho começam na mesma altura: o voltar subiu para fora das duas
                    colunas, senão as abas nasciam acima do topo do cartão. */}
                <div className="flex flex-col gap-5 md:flex-row md:items-start md:gap-5">
                    <TrilhoDoComprador pedido={pedido} />

                {/*
                  Duas colunas, como o resto do Backstage: à esquerda o trilho com de quem é
                  o pedido, que fica à vista enquanto se rola a lista; à direita o trabalho.
                  Antes a pessoa era uma faixa no topo que saía da tela no primeiro scroll,
                  justamente num atendimento em que a pergunta "com quem eu estou falando"
                  volta o tempo todo.
                */}
                <div className="flex min-w-0 flex-1 flex-col gap-5">
                    <RegiaoAlteracoes pedido={pedido} rascunhos={rascunhos} onContinuar={continuar} />

                    <Tabs selectedKey={aba} onSelectionChange={(key) => setAba(key as Aba)}>
                        <Tabs.List type="underline" size="sm">
                            <Tabs.Item id="itens">Itens</Tabs.Item>
                            <Tabs.Item id="historico">Histórico</Tabs.Item>
                        </Tabs.List>
                    </Tabs>

                    {aba === "itens" ? (
                        <ListaDeItens pedido={pedido} rascunhos={rascunhos} onAbrir={abrir} onContinuar={continuar} onVerAlteracao={(id) => setFocar(idDoCartao(id))} onVerHistorico={verNoHistorico} />
                    ) : (
                        <Historico pedido={pedido} onVerAlteracao={(id) => setFocar(idDoCartao(id))} />
                    )}
                    </div>
                </div>
            </motion.div>

        </BackstageLayout>
    );
}

/* ------------------------------------------------------------------ */
/*  Cabeçalho: de quem é este pedido                                   */
/* ------------------------------------------------------------------ */

/**
 * Trilho do comprador, na forma do trilho do evento: um aside de 280px, grudado, com um card
 * de capa, identidade e números. De quem é o pedido é a pergunta que volta durante o
 * atendimento inteiro, e como faixa no topo ela saía da tela no primeiro scroll da lista.
 */
const TrilhoDoComprador = ({ pedido }: { pedido: Pedido }) => {
    const comprador = getConta(pedido.compradorId);
    const evento = getEvento(pedido.eventoId);
    const { copied, copy } = useClipboard();
    const [falhaCopia, setFalhaCopia] = useState(false);
    const idCompleto = useRef<HTMLSpanElement>(null);
    const rotuloCompra = pedido.canal === "Online" ? "Compra online" : pedido.canal === "Bilheteria" ? "Compra na bilheteria" : "Cortesia emitida";
    const { final, cortesia } = usePagamento(pedido);

    const copiarId = async () => {
        const resultado = await copy(pedido.id, "id");
        if (resultado.success) return;
        setFalhaCopia(true);
        requestAnimationFrame(() => {
            const selecao = window.getSelection();
            if (!idCompleto.current || !selecao) return;
            const intervalo = document.createRange();
            intervalo.selectNodeContents(idCompleto.current);
            selecao.removeAllRanges();
            selecao.addRange(intervalo);
        });
    };

    return (
        /* `top` acompanha a shell: a variante com barra no topo define --bs-header-offset, a de
           sidebar não define e o fallback zera. Mesma convenção do RelatorioPageHeader. */
        /* Sticky sem teto de altura: o trilho tem a altura do próprio cartão. Chegou a ter altura
           de janela com rolagem interna, para prender em qualquer tela, mas rolar por dentro de um
           cartão de identidade é pior que ele descer junto num pedido curto. */
        <aside className="flex w-full shrink-0 flex-col gap-3 md:sticky md:top-[calc(var(--bs-header-offset,0px)+1.5rem)] md:w-[280px]">
            {/*
              Cartão de perfil: a capa do evento, o comprador sobreposto a ela, e a compra como
              uma fileira de números. O `capa` do evento existia no modelo com o comentário
              "Arte do evento, mostrada no cabeçalho do pedido" e nunca era lido — agora é.

              A grade de sete campos rotulados que estava aqui tinha rótulo e valor no mesmo
              tamanho, então os rótulos dobravam a massa de texto sem liderar nada. Agora a
              compra é uma fileira de quatro números legíveis de relance, e o que serve para
              conferir identidade ao telefone desce para uma lista de contato com ícone.
            */}
            <div className="flex flex-col gap-4 rounded-2xl bg-primary p-3 ring-1 ring-border-secondary">
                {evento?.capa && (
                    <div className="relative aspect-[256/160] w-full overflow-hidden rounded-xl bg-secondary">
                        <img src={evento.capa} alt="" className="size-full object-cover" />
                        {pedido.cupom && (
                            <Badge size="sm" type="pill-color" color="gray" className="absolute top-3 left-3">
                                Cupom {pedido.cupom}
                            </Badge>
                        )}
                    </div>
                )}

                <div className={cx("flex flex-col gap-4 px-1", evento?.capa && "-mt-10")}>
                    <AvatarProfilePhoto size="sm" alt={comprador?.nome ?? "Comprador"} initials={iniciaisDe(comprador?.nome ?? "?")} />

                    <div className="min-w-0">
                        <h1 className="truncate text-md font-bold text-primary">{comprador?.nome ?? `Pedido ${uuidCurto(pedido.id)}`}</h1>
                        <p className="truncate text-sm text-tertiary">{evento?.nome}</p>
                    </div>

                    {/* Em 280px os números empilham. O rótulo fica em text-sm por regra do projeto
                        (nada abaixo disso), então o contraste vem do peso e da cor. */}
                    <dl className="flex flex-col divide-y divide-border-secondary border-y border-secondary">
                        <Estatistica rotulo="Pago">
                            {cortesia ? (
                                "Sem valor"
                            ) : (
                                <span className="flex items-baseline gap-2">
                                    <span className="tabular-nums">{formatarMoeda(final)}</span>
                                    <DetalhePagamento pedido={pedido} />
                                </span>
                            )}
                        </Estatistica>
                        <Estatistica rotulo="No pedido">
                            {plural(pedido.itens.length, "unidade", "unidades")} em {plural(new Set(pedido.itens.map((l) => l.itemId)).size, "item", "itens")}
                        </Estatistica>
                        <Estatistica rotulo={rotuloCompra}>{pedido.criadoEmLabel}</Estatistica>
                    </dl>

                    {/* Conferência ao telefone: o que o atendente lê de volta para o comprador. */}
                    <ul className="flex flex-col gap-2">
                        {comprador?.cpf && (
                            <ItemDeContato icone={User01}>
                                <span className="tabular-nums">CPF {mascararCPF(comprador.cpf)}</span>
                            </ItemDeContato>
                        )}
                        {comprador && (
                            <ItemDeContato icone={Mail01}>
                                <Contato valor={comprador.email} textoCopia={comprador.email} rotulo="Copiar e-mail" chave="email" copied={copied} copy={copy} />
                            </ItemDeContato>
                        )}
                        {comprador?.celular && (
                            <ItemDeContato icone={Phone}>
                                <Contato valor={comprador.celular} textoCopia={telefoneParaCopia(comprador.celular)} rotulo="Copiar celular" chave="celular" copied={copied} copy={copy} />
                            </ItemDeContato>
                        )}
                        <ItemDeContato icone={Tag01}>
                            <Contato valor={pedido.id} textoCopia={pedido.id} rotulo="Copiar ID do pedido" chave="id" copied={copied} copy={copy} onCopiar={copiarId} mono />
                        </ItemDeContato>
                    </ul>
                </div>
            </div>

            <span role="status" className="sr-only">
                {copied === "id" ? "ID do pedido copiado" : copied === "email" ? "E-mail copiado" : copied === "celular" ? "Celular copiado" : ""}
            </span>
            {falhaCopia && (
                <p className="text-sm text-warning-primary">
                    Não foi possível copiar. O ID está selecionado, use Ctrl+C ou ⌘C: <span ref={idCompleto} className="font-mono select-all">{pedido.id}</span>
                </p>
            )}
        </aside>
    );
};

/** Detalhe do pagamento sobre o resumo, não dentro dele: a quebra por cupom interessa em poucos
 *  atendimentos e não vale uma faixa fixa ocupando o cabeçalho de todos os outros. */
const DetalhePagamento = ({ pedido }: { pedido: Pedido }) => (
    <AriaDialogTrigger>
        <Button size="sm" color="link-gray" className="text-utility-blue-600 hover:text-utility-blue-700">
            Detalhes
        </Button>
        <AriaPopover
            offset={8}
            placement="bottom start"
            className={({ isEntering, isExiting }) =>
                cx(
                    "origin-(--trigger-anchor-point) will-change-transform",
                    isEntering && "duration-150 ease-out animate-in fade-in placement-top:slide-in-from-bottom-0.5 placement-bottom:slide-in-from-top-0.5",
                    isExiting && "duration-100 ease-in animate-out fade-out placement-top:slide-out-to-bottom-0.5 placement-bottom:slide-out-to-top-0.5",
                )
            }
        >
            <AriaDialog aria-label="Detalhe do pagamento" className="w-72 rounded-2xl bg-primary p-4 shadow-xl ring ring-secondary_alt outline-hidden">
                <LinhasPagamento pedido={pedido} />
            </AriaDialog>
        </AriaPopover>
    </AriaDialogTrigger>
);

/** Um número da compra, no formato da fileira de estatísticas do cartão de perfil. */
/**
 * Rótulo sobre valor, como o bloco de status do trilho do evento: em 280px o par lado a lado
 * quebrava o valor em duas linhas e desalinhava a coluna inteira.
 *
 * O valor fica um degrau abaixo do nome do comprador. A 16/600 ele empatava com o nome em
 * 16/700 e o trilho ficava com dois níveis disputando o topo; pago, quantidade e data são
 * referência de atendimento, não a manchete do cartão.
 */
const Estatistica = ({ rotulo, children }: { rotulo: string; children: ReactNode }) => (
    <div className="flex flex-col gap-0.5 py-2.5">
        <dt className="text-sm font-medium text-quaternary">{rotulo}</dt>
        <dd className="text-sm font-semibold text-primary">{children}</dd>
    </div>
);

/** Linha da lista de conferência: ícone apagado e o dado, como o bloco "About" do cartão. */
const ItemDeContato = ({ icone: Icone, children }: { icone: FC<{ className?: string }>; children: ReactNode }) => (
    <li className="flex items-center gap-2 text-sm text-tertiary">
        <Icone className="size-5 shrink-0 text-fg-quaternary" aria-hidden="true" />
        {children}
    </li>
);

/** Rótulo em cima, valor embaixo: o rótulo é a âncora de leitura e os valores alinham em coluna. */
const Campo = ({ rotulo, className, children }: { rotulo: string; className?: string; children: ReactNode }) => (
    <div className={cx("flex min-w-0 flex-col gap-0.5", className)}>
        <dt className="text-sm text-tertiary">{rotulo}</dt>
        <dd className="min-w-0 text-sm text-primary">{children}</dd>
    </div>
);

const Contato = ({
    valor,
    textoCopia,
    rotulo,
    chave,
    copied,
    copy,
    onCopiar,
    mono = false,
}: {
    valor: string;
    textoCopia: string;
    rotulo: string;
    chave: string;
    copied: string | boolean;
    copy: (texto: string, id?: string) => unknown;
    /** Caminho próprio de cópia, para quem tem plano B quando a área de transferência falha. */
    onCopiar?: () => void;
    mono?: boolean;
}) => (
    <span className="flex min-w-0 items-center gap-0.5">
        <span className={cx("truncate", mono && "font-mono select-all")} title={mono ? valor : undefined}>
            {valor}
        </span>
        <ButtonUtility size="xs" color="tertiary" icon={copied === chave ? Check : Copy01} aria-label={rotulo} onClick={() => (onCopiar ? onCopiar() : copy(textoCopia, chave))} />
    </span>
);

/* ------------------------------------------------------------------ */
/*  Pagamento                                                          */
/* ------------------------------------------------------------------ */

/** "Desconto" só aparece quando houve cupom: diferença de lote não é desconto, e um desconto de
 *  R$ 0,00 era só ruído (e saía como "-R$ 0,00"). */
const usePagamento = (pedido: Pedido) => {
    const totais = totaisDoPedido(pedido);
    return { ...totais, comCupom: Boolean(pedido.cupom) && totais.desconto > 0, cortesia: pedido.canal === "Cortesia" || totais.final === 0 };
};

const LinhasPagamento = ({ pedido }: { pedido: Pedido }) => {
    const { original, desconto, final, comCupom, cortesia } = usePagamento(pedido);
    if (cortesia) return <p className="text-sm text-primary">Cortesia, sem valor pago</p>;
    return (
        <dl className="flex flex-col gap-2">
            {comCupom && (
                <>
                    <ParValor rotulo="Valor sem desconto" valor={formatarMoeda(original)} />
                    <ParValor rotulo={`Cupom ${pedido.cupom}`} valor={`-${formatarMoeda(desconto)}`} />
                </>
            )}
            <ParValor rotulo="Total pago" valor={formatarMoeda(final)} destaque />
            <div className="flex flex-col gap-0.5 border-t border-secondary pt-2">
                <dt className="text-sm text-tertiary">Forma de pagamento</dt>
                <dd className="text-sm text-primary">{formaDePagamento(pedido.meioPagamento)}</dd>
            </div>
        </dl>
    );
};

const ParValor = ({ rotulo, valor, destaque = false }: { rotulo: string; valor: string; destaque?: boolean }) => (
    <div className="flex items-baseline justify-between gap-3">
        <dt className={cx("text-sm", destaque ? "font-semibold text-primary" : "text-tertiary")}>{rotulo}</dt>
        <dd className={cx("shrink-0 text-sm tabular-nums", destaque ? "font-semibold text-primary" : "text-primary")}>{valor}</dd>
    </div>
);

/* ------------------------------------------------------------------ */
/*  Alterações em andamento                                            */
/* ------------------------------------------------------------------ */

const ORDEM_ESTADO: Record<Solicitacao["estado"], number> = { falha: 0, processando: 1, aguardando: 2, "aguardando-financeiro": 3 };

/** O que está aberto neste pedido, sempre acima das abas: usado ao mesmo tempo que a lista, não
 *  pode ficar atrás de um clique. Falha primeiro. Só existe quando há alguma coisa aberta. */
const RegiaoAlteracoes = ({ pedido, rascunhos, onContinuar }: { pedido: Pedido; rascunhos: Rascunho[]; onContinuar: (rascunho: Rascunho) => void }) => {
    const abertas = [...pedido.solicitacoes].sort((a, b) => ORDEM_ESTADO[a.estado] - ORDEM_ESTADO[b.estado] || a.expiraEm - b.expiraEm);
    if (abertas.length === 0 && rascunhos.length === 0) return null;
    const precisam = abertas.filter((s) => s.estado === "falha").length;

    return (
        <section aria-label="Alterações em andamento" className="flex flex-col gap-3">
            {abertas.length > 0 && (
                <>
                    <h2 className="text-base font-semibold text-primary">
                        Alterações em andamento ({abertas.length})
                        {precisam > 0 && <span className="text-error-primary"> · {precisam === 1 ? "1 precisa de ação" : `${precisam} precisam de ação`}</span>}
                    </h2>
                    <AnimatePresence initial={false}>
                        {abertas.map((solicitacao) => (
                            <motion.div key={solicitacao.id} initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2, ease: "easeOut" }} className="overflow-hidden p-0.5">
                                <CartaoOperacao pedido={pedido} solicitacao={solicitacao} />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </>
            )}

            {rascunhos.length > 0 && (
                <div className="flex flex-col gap-2">
                    <h2 className="text-sm font-semibold text-secondary">Não enviadas ({rascunhos.length})</h2>
                    {rascunhos.map((rascunho) => (
                        <CartaoRascunho key={rascunho.id} pedido={pedido} rascunho={rascunho} onContinuar={() => onContinuar(rascunho)} />
                    ))}
                </div>
            )}
        </section>
    );
};

/** Rascunho com cara de rascunho: fundo neutro, sem cor de tipo, sem prazo. Não se confunde com
 *  uma cobrança enviada. */
const CartaoRascunho = ({ pedido, rascunho, onContinuar }: { pedido: Pedido; rascunho: Rascunho; onContinuar: () => void }) => {
    const destino = rascunho.titularPorLinha ? getConta(Object.values(rascunho.titularPorLinha)[0] ?? "") : undefined;
    const unidades = plural(rascunho.linhasSelecionadas.length, "unidade", "unidades");
    const titulo = rascunho.tipo === "troca-titularidade" ? `Rascunho de transferência${destino ? ` para ${destino.nome}` : ""} · ${unidades}` : `Rascunho de troca · ${unidades}`;
    const itens = [...new Set(rascunho.linhasSelecionadas.map((id) => getItem(pedido.itens.find((l) => l.id === id)?.itemId ?? "")?.nome).filter(Boolean))].join(", ");

    return (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-secondary p-4 ring-1 ring-border-secondary">
            <div className="flex min-w-0 flex-col gap-0.5">
                <p className="text-sm font-semibold text-primary">{titulo}</p>
                {itens && <p className="text-sm text-tertiary">{itens}</p>}
                <p className="text-sm text-tertiary">
                    Atualizado por {rascunho.operador} às {horaDoLabel(rascunho.atualizadoEmLabel)}. Nada foi cobrado nem reservado.
                    {rascunho.aguardandoCadastroDe && ` Aguardando o cadastro de ${rascunho.aguardandoCadastroDe}.`}
                </p>
            </div>
            <div className="flex items-center gap-4">
                <Button size="sm" color="link-gray" onClick={() => descartarRascunho(rascunho)}>
                    Descartar
                </Button>
                <Button size="sm" color="secondary" onClick={onContinuar}>
                    Continuar
                </Button>
            </div>
        </div>
    );
};

/* ------------------------------------------------------------------ */
/*  Itens                                                              */
/* ------------------------------------------------------------------ */

interface ItemComLinhas {
    item: CatalogoItem;
    linhas: PedidoItem[];
}

interface AcoesDaLista {
    onAbrir: (verbo: Verbo, linhas: string[]) => void;
    onContinuar: (rascunho: Rascunho) => void;
    onVerAlteracao: (solicitacaoId: string) => void;
    onVerHistorico: (solicitacaoId?: string) => void;
}

/**
 * Painel de leitura com ações na linha. Sem seleção em massa na página: escolher várias unidades
 * acontece dentro do overlay, depois de saber o verbo, porque o que pode entrar depende dele.
 * Nada desabilitado: o que não é possível não aparece, e o motivo fica perto.
 */
const ListaDeItens = ({ pedido, rascunhos, ...acoes }: { pedido: Pedido; rascunhos: Rascunho[] } & AcoesDaLista) => {
    const estrutura = useMemo(() => {
        const porItem = new Map<string, ItemComLinhas>();
        pedido.itens.forEach((linha) => {
            const item = getItem(linha.itemId);
            if (!item) return;
            const grupo = porItem.get(item.id) ?? { item, linhas: [] };
            grupo.linhas.push(linha);
            porItem.set(item.id, grupo);
        });
        const todos = [...porItem.values()];
        const sessoes = SESSOES.filter((s) => s.eventoId === pedido.eventoId)
            .sort((a, b) => a.inicio - b.inicio)
            .map((sessao) => ({ sessao, itens: todos.filter((g) => g.item.tipo === "ingresso" && g.item.sessaoId === sessao.id) }))
            .filter((s) => s.itens.length > 0);
        return { sessoes, produtos: todos.filter((g) => g.item.tipo === "produto"), combos: todos.filter((g) => g.item.tipo === "combo"), totalItens: todos.length };
    }, [pedido]);

    const elegiveis = (verbo: Verbo) => pedido.itens.filter((l) => disponivelPara(pedido, l, verbo)).length;
    const nTransferir = elegiveis("transferir");
    const nTrocar = elegiveis("trocar");
    const motivoGeral =
        nTransferir === 0 ? "Todas as unidades estão em outra alteração ou com outro titular." : pedidoEncerrado(pedido) ? "As sessões deste pedido já aconteceram. Só a transferência continua disponível." : null;

    const renderItem = (grupo: ItemComLinhas) => <ItemDoPedido key={grupo.item.id} pedido={pedido} rascunhos={rascunhos} {...grupo} {...acoes} />;

    return (
        <section className="rounded-2xl bg-primary ring-1 ring-border-secondary">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-secondary px-5 py-3">
                <p className="text-sm text-tertiary">
                    {plural(pedido.itens.length, "unidade", "unidades")} em {plural(estrutura.totalItens, "item", "itens")}
                    {motivoGeral && <span className="text-secondary"> · {motivoGeral}</span>}
                </p>
                {(nTransferir >= 2 || nTrocar >= 2) && (
                    <div className="flex w-full gap-2 sm:ml-auto sm:w-auto">
                        {nTransferir >= 2 && (
                            <Button size="sm" color="secondary" className="flex-1 sm:flex-none" onClick={() => acoes.onAbrir("transferir", [])}>
                                Transferir itens
                            </Button>
                        )}
                        {nTrocar >= 2 && (
                            <Button size="sm" color="secondary" className="flex-1 sm:flex-none" onClick={() => acoes.onAbrir("trocar", [])}>
                                Trocar itens
                            </Button>
                        )}
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-6 p-5">
                {estrutura.sessoes.length > 0 && (
                    <GrupoDeItens titulo="Ingressos">
                        {estrutura.sessoes.map(({ sessao, itens }) => (
                            <div key={sessao.id} className="flex flex-col gap-1">
                                <h4 className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm font-semibold text-secondary">
                                    <Calendar className="size-4 shrink-0 text-fg-quaternary" aria-hidden="true" />
                                    <span className="first-letter:uppercase">{tituloDaSessao(sessao)}</span>
                                    {sessao.inicio <= Date.now() && <span className="font-normal text-tertiary">· Sessão realizada. Só a transferência continua disponível.</span>}
                                </h4>
                                <div className="flex flex-col divide-y divide-border-secondary">{itens.map(renderItem)}</div>
                            </div>
                        ))}
                    </GrupoDeItens>
                )}
                {estrutura.produtos.length > 0 && (
                    <GrupoDeItens titulo="Produtos">
                        <div className="flex flex-col divide-y divide-border-secondary">{estrutura.produtos.map(renderItem)}</div>
                    </GrupoDeItens>
                )}
                {estrutura.combos.length > 0 && (
                    <GrupoDeItens titulo="Combos">
                        <div className="flex flex-col divide-y divide-border-secondary">{estrutura.combos.map(renderItem)}</div>
                    </GrupoDeItens>
                )}
            </div>
        </section>
    );
};

/**
 * Onde o ingresso mora: grupo e lote sob o nome. O ingresso é identificado pelo caminho
 * grupo > ingresso > lote, e sem o grupo na própria linha um item fora do contexto da sessão
 * deixa de se explicar — "Corrida 5 km" existe em mais de um grupo. Produto não tem nem um
 * nem outro, e aí a linha simplesmente não aparece.
 */
const caminhoDoItem = (item: CatalogoItem) => [item.grupo, item.lote && rotuloDoLote(item.lote)].filter(Boolean).join(" · ");

const GrupoDeItens = ({ titulo, children }: { titulo: string; children: ReactNode }) => (
    <div className="flex flex-col gap-3">
        {/* Etiqueta de arquivo, não capítulo: a 16/700 competia de igual para igual com o nome
            do item, que é o alvo da varredura. Desce para o andar do detalhe. */}
        <h3 className="text-sm font-semibold text-secondary">{titulo}</h3>
        {children}
    </div>
);

/** Uma linha da lista: uma unidade, ou várias unidades iguais de um produto não nominal. */
interface Linha {
    chave: string;
    linhas: PedidoItem[];
}

const LIMITE_LINHAS = 5;

/** Unidade em estado normal: sem alteração aberta, sem rascunho, sem outro titular. */
const linhaNormal = (pedido: Pedido, rascunhos: Rascunho[], linha: PedidoItem) => !linha.titularId && !solicitacaoDaLinha(pedido, linha.id) && !rascunhos.some((r) => r.linhasSelecionadas.includes(linha.id));

const ItemDoPedido = ({ pedido, rascunhos, item, linhas, ...acoes }: { pedido: Pedido; rascunhos: Rascunho[] } & ItemComLinhas & AcoesDaLista) => {
    const [todas, setTodas] = useState(false);

    /* Unidades iguais (mesma pessoa, nada acontecendo) viram uma linha só, com a quantidade:
       três linhas idênticas "Letícia Amaral · Fez a compra" não informam nada e triplicam os
       alvos de clique. Qualquer uma delas serve para a ação; o overlay marca uma e oferece incluir
       as outras. Quando algo acontece com uma unidade, ela ganha linha própria. A ordem é a da
       compra e não muda: linha que troca de lugar faz o próximo clique cair na vizinha. */
    const agrupadas: Linha[] = [];
    const normais = new Map<string, PedidoItem[]>();
    linhas.forEach((linha) => {
        if (!linhaNormal(pedido, rascunhos, linha)) {
            agrupadas.push({ chave: linha.id, linhas: [linha] });
            return;
        }
        const titular = linha.titularId ?? pedido.compradorId;
        if (!normais.has(titular)) {
            normais.set(titular, []);
            agrupadas.push({ chave: `grupo-${titular}`, linhas: normais.get(titular)! });
        }
        normais.get(titular)!.push(linha);
    });

    const valores = new Set(linhas.map((l) => l.valorPago));
    const valorDoItem = valores.size === 1 ? (linhas.length > 1 ? `${formatarMoeda(linhas[0].valorPago)} cada` : formatarMoeda(linhas[0].valorPago)) : formatarMoeda(linhas.reduce((soma, l) => soma + l.valorPago, 0));

    /* Uma linha só: o item e a unidade são a mesma coisa, sem sub-linha. */
    if (agrupadas.length === 1) {
        return (
            <div className="py-2">
                <LinhaDaUnidade pedido={pedido} rascunhos={rascunhos} item={item} linhas={agrupadas[0].linhas} valor={valorDoItem} fundida {...acoes} />
            </div>
        );
    }

    /* Até 5 linhas; acima disso, as que fogem do normal continuam visíveis no lugar delas. */
    const visiveis = todas ? agrupadas : agrupadas.filter((g, i) => i < LIMITE_LINHAS || !g.linhas.every((l) => linhaNormal(pedido, rascunhos, l)));
    const ocultas = agrupadas.length - visiveis.length;

    return (
        <div className="flex flex-col py-3">
            <div className="flex items-start gap-3 pb-1">
                {item.tipo !== "ingresso" && <Miniatura item={item} />}
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-primary">{item.nome}</p>
                    {caminhoDoItem(item) && <p className="text-sm text-tertiary">{caminhoDoItem(item)}</p>}
                    {item.tipo !== "ingresso" && item.descricao && <p className="text-sm text-tertiary">{item.descricao}</p>}
                </div>
                <p className="shrink-0 text-right text-sm text-tertiary tabular-nums">
                    {plural(linhas.length, "unidade", "unidades")} · <span className="font-semibold text-primary">{valorDoItem}</span>
                </p>
            </div>
            <ul className="flex flex-col">
                {visiveis.map((grupo) => (
                    <li key={grupo.chave}>
                        <LinhaDaUnidade pedido={pedido} rascunhos={rascunhos} item={item} linhas={grupo.linhas} {...acoes} />
                    </li>
                ))}
            </ul>
            {(ocultas > 0 || todas) && agrupadas.length > LIMITE_LINHAS && (
                <div className="pt-2">
                    <Button size="sm" color="link-color" aria-expanded={todas} onClick={() => setTodas((atual) => !atual)}>
                        {todas ? "Ver menos" : `Ver todas as ${linhas.length} unidades`}
                    </Button>
                </div>
            )}
        </div>
    );
};

/** O que está acontecendo com a unidade, no lugar das ações enquanto houver alteração aberta. */
const EstadoDaUnidade = ({ pedido, linha, solicitacao }: { pedido: Pedido; linha: PedidoItem; solicitacao: Solicitacao }) => {
    const tipo = TIPO_OPERACAO_CURTO[solicitacao.tipo].toLowerCase();
    if (solicitacao.estado === "falha") {
        return (
            <p className="flex items-center gap-1.5 text-sm font-medium text-error-primary">
                <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
                {TIPO_OPERACAO_CURTO[solicitacao.tipo]} paga e não aplicada
            </p>
        );
    }
    if (solicitacao.estado === "aguardando-financeiro") return <p className="text-sm font-medium text-warning-primary">Com o financeiro desde {dataDoLabel(solicitacao.escalonamento?.dataLabel ?? "")}</p>;
    if (solicitacao.estado === "processando") return <p className="text-sm text-secondary">Pagamento registrado. Aplicando a {tipo}.</p>;

    const alvo =
        solicitacao.tipo === "troca-titularidade"
            ? ` para ${getConta(solicitacao.aplicar.titularPorLinha?.[linha.id] ?? "")?.nome ?? "outra pessoa"}`
            : solicitacao.tipo === "troca-item"
              ? ` para ${getItem(solicitacao.aplicar.trocas?.find((t) => t.pedidoItemId === linha.id)?.novoItemId ?? "")?.nome ?? "outro item"}`
              : "";
    return (
        <p className="text-sm font-medium text-warning-primary">
            Aguardando pagamento da {tipo}
            {alvo} até {horaDe(solicitacao.expiraEm)}
        </p>
    );
};

/** Como cada fato fecha a frase "Última alteração: troca ..." na linha da unidade. */
const DESFECHO: Partial<Record<NonNullable<EntradaHistorico["marco"]>, string>> = {
    paga: "paga",
    aplicada: "aplicada",
    falha: "paga e não aplicada",
    financeiro: "encaminhada ao financeiro",
    expirada: "expirou sem pagamento",
    cancelada: "cancelada",
};

const ACOES: Array<{ verbo: Verbo; rotulo: string }> = [
    { verbo: "transferir", rotulo: "Transferir" },
    { verbo: "trocar", rotulo: "Trocar" },
    { verbo: "formulario", rotulo: "Formulário" },
];

const LinhaDaUnidade = ({
    pedido,
    rascunhos,
    item,
    linhas,
    valor,
    fundida = false,
    onAbrir,
    onContinuar,
    onVerAlteracao,
    onVerHistorico,
}: {
    pedido: Pedido;
    rascunhos: Rascunho[];
    item: CatalogoItem;
    linhas: PedidoItem[];
    valor?: string;
    fundida?: boolean;
} & AcoesDaLista) => {
    const linha = linhas[0];
    const { nome, apoio } = identidadeDaLinha(pedido, linha);
    const solicitacao = solicitacaoDaLinha(pedido, linha.id);
    const rascunho = rascunhos.find((r) => r.linhasSelecionadas.includes(linha.id));
    const transferida = Boolean(linha.titularId);
    /* A última mudança da unidade, com autor, para responder "o que aconteceu com este ingresso"
       sem abrir o histórico. O link só existe quando há algo para ver. */
    const ultima = [...pedido.historico].reverse().find((h) => h.solicitacaoId && h.linhaIds?.includes(linha.id) && h.marco !== "solicitada" && h.marco !== "reenviada");
    const acoes = solicitacao || transferida ? [] : ACOES.filter(({ verbo }) => (verbo === "formulario" ? temFormulario(item) && disponivelPara(pedido, linha, verbo) : disponivelPara(pedido, linha, verbo)));

    return (
        <div className={cx("-mx-3 flex flex-wrap items-start gap-x-3 gap-y-2 rounded-lg px-3 py-3 transition duration-100 ease-linear focus-within:bg-primary_hover hover:bg-primary_hover")}>
            {fundida && item.tipo !== "ingresso" && <Miniatura item={item} />}
            <div className="flex min-w-[12rem] flex-1 flex-col gap-0.5">
                {fundida && (
                    <>
                        {/* O nome do item é o único text-md da lista: é por ele que se varre, e
                            ele marca onde um item começa melhor do que qualquer fio. */}
                        <p className="text-md font-semibold text-primary">{item.nome}</p>
                        {caminhoDoItem(item) && <p className="text-sm text-tertiary">{caminhoDoItem(item)}</p>}
                        {item.tipo !== "ingresso" && item.descricao && <p className="text-sm text-tertiary">{item.descricao}</p>}
                    </>
                )}
                {/*
                  O portador só é notícia quando NÃO é o comprador. Nome e CPF do comprador já são
                  o cabeçalho da página, e repeti-los em toda linha enchia a lista de eco: num
                  pedido de três itens, o mesmo nome aparecia quatro vezes. Quando a unidade foi
                  transferida, o portador é outra pessoa, não está em lugar nenhum da tela, e aí
                  o nome e o documento dele são o que o atendente confere ao telefone.
                */}
                {transferida ? (
                    <>
                        <p className={cx("text-sm", fundida ? "text-secondary" : "font-medium text-primary")}>{nome}</p>
                        <p className="text-sm text-tertiary">{apoio}</p>
                    </>
                ) : (
                    !fundida && <p className="text-sm text-secondary">{plural(linhas.length, "unidade", "unidades")}</p>
                )}
                {transferida && (
                    <span className="w-fit">
                        <BadgeWithDot color="gray" type="pill-color" size="md">
                            Transferido
                        </BadgeWithDot>
                    </span>
                )}
                {solicitacao && (
                    <>
                        <EstadoDaUnidade pedido={pedido} linha={linha} solicitacao={solicitacao} />
                        <Button size="sm" color="link-gray" className="w-fit" onClick={() => onVerAlteracao(solicitacao.id)}>
                            Ver alteração
                        </Button>
                    </>
                )}
                {!solicitacao && rascunho && (
                    <p className="flex flex-wrap items-center gap-x-2 text-sm text-tertiary">
                        Rascunho de {rascunho.tipo === "troca-titularidade" ? "transferência" : "troca"} não enviado
                        <Button size="sm" color="link-color" onClick={() => onContinuar(rascunho)}>
                            Continuar
                        </Button>
                    </p>
                )}
                {!solicitacao && ultima && (
                    <p className="flex flex-wrap items-center gap-x-2 text-sm text-tertiary">
                        {!transferida && `Última alteração: ${ultima.tipo ? `${TIPO_OPERACAO_CURTO[ultima.tipo].toLowerCase()} ${DESFECHO[ultima.marco ?? "aplicada"] ?? ""}` : ultima.titulo.toLowerCase()} em ${dataDoLabel(ultima.dataLabel)}`}
                        <Button size="sm" color="link-color" onClick={() => onVerHistorico(ultima.solicitacaoId)}>
                            Ver no histórico
                        </Button>
                    </p>
                )}
            </div>

            {/*
              Zona direita enxuta: valor e um só controle, na mesma linha do nome do
              item. Antes era uma pilha de quatro coisas — valor, selo, "Ver alteração"
              e as ações — e o valor flutuava longe da linha a que pertence.

              Selo e "Ver alteração" desceram para junto das linhas de estado, na coluna
              do meio: eles descrevem o que aconteceu com a unidade, não o que se pode
              fazer com ela.
            */}
            <div className="ml-auto flex shrink-0 items-center gap-2">
                {valor && (
                    <p className="text-sm tabular-nums">
                        {fundida && linhas.length > 1 && <span className="text-tertiary">{plural(linhas.length, "unidade", "unidades")} · </span>}
                        <span className="font-semibold text-primary">{valor}</span>
                    </p>
                )}
                {acoes.length > 0 && (
                    <Dropdown.Root>
                        <ButtonUtility size="sm" color="tertiary" icon={DotsVertical} tooltip="Mais ações" aria-label={`Mais ações para ${item.nome} de ${nome}`} />
                        <Dropdown.Popover placement="bottom end" className="w-auto min-w-56">
                            <Dropdown.Menu onAction={(chave) => onAbrir(chave as Verbo, [linha.id])}>
                                {acoes.map(({ verbo, rotulo }) => (
                                    <Dropdown.Item key={verbo} id={verbo} icon={TIPO_OPERACAO_ICONE[TIPO_DO_VERBO[verbo]]} label={rotulo} />
                                ))}
                            </Dropdown.Menu>
                        </Dropdown.Popover>
                    </Dropdown.Root>
                )}
            </div>
        </div>
    );
};

/* ------------------------------------------------------------------ */
/*  Histórico                                                          */
/* ------------------------------------------------------------------ */

type Tom = "neutro" | "aviso" | "erro";

interface GrupoHistorico {
    chave: string;
    solicitacaoId?: string;
    tipo?: TipoOperacao;
    entradas: EntradaHistorico[];
    ordem: number;
}

const resultadoDoGrupo = (pedido: Pedido, grupo: GrupoHistorico): { rotulo: string; tom: Tom; dinheiro: string; viva?: Solicitacao } => {
    const viva = pedido.solicitacoes.find((s) => s.id === grupo.solicitacaoId);
    if (viva) {
        if (viva.estado === "falha") return { rotulo: "Paga e não aplicada", tom: "erro", dinheiro: "pagos e não aplicados", viva };
        if (viva.estado === "aguardando-financeiro") return { rotulo: "Com o financeiro", tom: "aviso", dinheiro: "pagos e não aplicados", viva };
        return { rotulo: "Em andamento", tom: "neutro", dinheiro: viva.estado === "processando" ? "pagos" : "aguardando pagamento", viva };
    }
    const ultimo = grupo.entradas[grupo.entradas.length - 1];
    switch (ultimo.marco) {
        case "aplicada":
            return { rotulo: "Concluída", tom: "neutro", dinheiro: "cobrados" };
        case "expirada":
            return { rotulo: "Expirou sem pagamento", tom: "neutro", dinheiro: "não cobrados" };
        case "cancelada":
            return { rotulo: "Cancelada", tom: "neutro", dinheiro: "não cobrados" };
        case "falha":
            return { rotulo: "Paga e não aplicada", tom: "erro", dinheiro: "pagos e não aplicados" };
        case "financeiro":
            return { rotulo: "Encaminhada ao financeiro", tom: "aviso", dinheiro: "pagos e não aplicados" };
        default:
            return { rotulo: ultimo.estado === "falha" ? "Falhou" : "Registrado", tom: ultimo.estado === "falha" ? "erro" : "neutro", dinheiro: "" };
    }
};

/** Reenvios iguais em sequência viram uma linha só, com a contagem. */
const juntarReenvios = (entradas: EntradaHistorico[]) =>
    entradas.reduce<Array<{ entrada: EntradaHistorico; vezes: number }>>((lista, entrada) => {
        const anterior = lista[lista.length - 1];
        if (anterior && entrada.marco === "reenviada" && anterior.entrada.marco === "reenviada" && anterior.entrada.descricao === entrada.descricao) {
            anterior.vezes++;
            anterior.entrada = entrada;
        } else lista.push({ entrada, vezes: 1 });
        return lista;
    }, []);

const LIMITE_GRUPOS = 10;

/**
 * Registro imutável, agrupado por alteração: o resultado de cada uma é derivado dos fatos, nunca
 * uma entrada "pendente" que fica amarela para sempre. Quem fez, o que mudou e o motivo ficam
 * sempre visíveis; só o detalhamento da cobrança fica recolhido.
 */
const Historico = ({ pedido, onVerAlteracao }: { pedido: Pedido; onVerAlteracao: (solicitacaoId: string) => void }) => {
    const [todos, setTodos] = useState(false);
    const compra = pedido.historico.find((h) => h.marco === "compra");

    const grupos = new Map<string, GrupoHistorico>();
    pedido.historico.forEach((entrada, indice) => {
        if (entrada.marco === "compra") return;
        const chave = entrada.solicitacaoId ?? entrada.id;
        const grupo = grupos.get(chave) ?? { chave, solicitacaoId: entrada.solicitacaoId, tipo: entrada.tipo, entradas: [], ordem: indice };
        grupo.entradas.push(entrada);
        grupo.ordem = indice;
        grupos.set(chave, grupo);
    });
    const lista = [...grupos.values()].sort((a, b) => b.ordem - a.ordem);
    const visiveis = todos ? lista : lista.slice(0, LIMITE_GRUPOS);

    const contagem = new Map<string, number>();
    lista.forEach((g) => {
        const { rotulo } = resultadoDoGrupo(pedido, g);
        contagem.set(rotulo.toLowerCase(), (contagem.get(rotulo.toLowerCase()) ?? 0) + 1);
    });
    const resumo =
        lista.length === 0
            ? "Nenhuma alteração registrada no Backstage desde a compra."
            : `${plural(lista.length, "alteração", "alterações")} desde a compra: ${[...contagem.entries()].map(([rotulo, n]) => `${n} ${rotulo}`).join(", ")}.`;

    return (
        <section className="flex flex-col gap-4 rounded-2xl bg-primary p-5 ring-1 ring-border-secondary">
            <p className="text-sm text-secondary">{resumo}</p>

            {visiveis.length > 0 && (
                <ol className="flex flex-col divide-y divide-border-secondary">
                    {visiveis.map((grupo) => (
                        <GrupoDoHistorico key={grupo.chave} pedido={pedido} grupo={grupo} onVerAlteracao={onVerAlteracao} />
                    ))}
                </ol>
            )}
            {lista.length > LIMITE_GRUPOS && (
                <div>
                    <Button size="sm" color="link-color" onClick={() => setTodos((atual) => !atual)}>
                        {todos ? "Mostrar menos" : `Mostrar mais ${lista.length - LIMITE_GRUPOS} alterações`}
                    </Button>
                </div>
            )}

            {compra && (
                <div className="flex flex-col gap-1 border-t border-secondary pt-4">
                    <p className="text-sm font-semibold text-primary">Compra</p>
                    <p className="text-sm text-tertiary">
                        {[pedido.criadoEmLabel, pedido.canal, formaDePagamento(pedido.meioPagamento), pedido.cupom && `Cupom ${pedido.cupom}`].filter(Boolean).join(" · ")}
                        {typeof compra.valor === "number" && (
                            <>
                                {" · "}
                                <span className="font-medium text-primary tabular-nums">{formatarMoeda(compra.valor)}</span> pagos na compra
                            </>
                        )}
                    </p>
                    <p className="text-sm text-tertiary">{compra.descricao}</p>
                </div>
            )}
        </section>
    );
};

const GrupoDoHistorico = ({ pedido, grupo, onVerAlteracao }: { pedido: Pedido; grupo: GrupoHistorico; onVerAlteracao: (solicitacaoId: string) => void }) => {
    const { rotulo, tom, dinheiro, viva } = resultadoDoGrupo(pedido, grupo);
    const abertura = grupo.entradas.find((e) => e.marco === "solicitada") ?? grupo.entradas[0];
    const tipo = grupo.tipo ? TIPO_OPERACAO_CURTO[grupo.tipo] : abertura.titulo;
    const valor = abertura.valor;
    const eventos = juntarReenvios(grupo.entradas);

    return (
        <li id={grupo.solicitacaoId ? `grupo-${grupo.solicitacaoId}` : undefined} tabIndex={grupo.solicitacaoId ? -1 : undefined} className={cx("flex scroll-mt-24 flex-col gap-2 rounded-lg py-4 first:pt-0", FOCO)}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <p className="text-sm font-semibold text-primary">
                    {grupo.tipo ? tipo : abertura.titulo}
                    <span className={cx("font-medium", tom === "erro" ? "text-error-primary" : tom === "aviso" ? "text-warning-primary" : "text-tertiary")}> · {rotulo}</span>
                </p>
                {typeof valor === "number" && valor > 0 && dinheiro && (
                    <p className="text-sm text-tertiary">
                        <span className="font-medium text-primary tabular-nums">{formatarMoeda(valor)}</span> {dinheiro}
                    </p>
                )}
            </div>
            <p className="text-sm text-tertiary">
                Por {abertura.responsavel} · {abertura.dataLabel}
            </p>
            {abertura.detalhes && abertura.detalhes.length > 0 && (
                <ul className="flex flex-col gap-0.5">
                    {abertura.detalhes.map((detalhe) => (
                        <li key={detalhe} className="text-sm text-secondary">
                            {detalhe}
                        </li>
                    ))}
                </ul>
            )}
            {abertura.motivo && <p className="text-sm text-secondary">Motivo: {descreverMotivo(abertura.motivo)}</p>}

            <ol className="mt-1 flex flex-col gap-1 border-l border-secondary pl-3">
                {eventos.map(({ entrada, vezes }) => (
                    <li key={entrada.id} className="text-sm text-tertiary">
                        <span className="tabular-nums">{horaDoLabel(entrada.dataLabel) || entrada.dataLabel}</span>
                        {" · "}
                        <span className="text-secondary">{entrada.titulo}</span>
                        {vezes > 1 && ` ${vezes} vezes`}
                        {entrada.marco !== "aplicada" && entrada.descricao && ` · ${entrada.descricao}`}
                        {" · "}
                        {entrada.responsavel}
                    </li>
                ))}
            </ol>

            {viva && (
                <div>
                    <Button size="sm" color="link-color" onClick={() => onVerAlteracao(viva.id)}>
                        Ver alteração
                    </Button>
                </div>
            )}
        </li>
    );
};
