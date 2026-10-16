import { useEffect, useMemo, useRef, useState, type FC, type ReactNode } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { Dialog as AriaDialog, DialogTrigger as AriaDialogTrigger, Popover as AriaPopover } from "react-aria-components";
import { AnimatePresence, motion } from "motion/react";
import { AlertTriangle, ArrowLeft, Calendar, Check, Copy01, Mail01, Phone, Tag01, User01 } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { AvatarProfilePhoto } from "@/components/base/avatar/avatar-profile-photo";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Tabs } from "@/components/application/tabs/tabs";
import { useClipboard } from "@/hooks/use-clipboard";
import { cx } from "@/utils/cx";
import { BackstageLayout } from "../../components/Backstage";
import { CartaoOperacao, idDoCartao } from "../components/CartaoOperacao";
import {
    TIPO_OPERACAO_ICONE, FOCO, FOCO_ESCOPO, Miniatura, caminhoDoItem, iniciaisDe, formatarCPF, telefoneParaCopia } from "../components/pos-compra-ui";
import { descartarRascunho } from "../components/wizard/seletor-unidades";
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
                        <ListaDeItens pedido={pedido} rascunhos={rascunhos} onAbrir={abrir} onContinuar={continuar} />
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
            <div className="flex flex-col gap-4 overflow-hidden rounded-2xl bg-primary px-3 pt-3 pb-0 ring-1 ring-border-secondary">
                {evento?.capa && (
                    <div className="aspect-[256/160] w-full overflow-hidden rounded-xl bg-secondary">
                        <img src={evento.capa} alt="" className="size-full object-cover" />
                    </div>
                )}

                <div className={cx("flex flex-col gap-4 px-1", evento?.capa && "-mt-10")}>
                    <AvatarProfilePhoto size="sm" alt={comprador?.nome ?? "Comprador"} initials={iniciaisDe(comprador?.nome ?? "?")} />

                    <div className="min-w-0">
                        <h1 className="truncate text-md font-bold text-primary">{comprador?.nome ?? `Pedido ${uuidCurto(pedido.id)}`}</h1>
                        <p className="truncate text-sm text-tertiary">{evento?.nome}</p>
                    </div>

                    {/* Tudo que o atendente lê de volta ao telefone, junto e antes do primeiro
                        divisor: quem é a pessoa e qual é o pedido. Abaixo do divisor ficam só os
                        números da compra, que ninguém dita, se consulta. */}
                    <ul className="flex flex-col gap-2">
                        {comprador?.cpf && (
                            <ItemDeContato icone={User01}>
                                <span className="tabular-nums">CPF {formatarCPF(comprador.cpf)}</span>
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

                    {/* Em 280px os números empilham. O rótulo fica em text-sm por regra do projeto
                        (nada abaixo disso), então o contraste vem do peso e da cor. */}
                    {/* `-mx-4` desfaz o px-3 do cartão mais o px-1 do miolo, então as réguas vão de
                        ponta a ponta; cada Estatistica repõe o mesmo 4 em padding para o texto seguir
                        alinhado com os contatos. Embaixo não há borda própria: o cartão não tem padding
                        inferior e o ring dele já desenha 1px na mesma cor ali, duas linhas somariam 2px. */}
                    <dl className="-mx-4 flex flex-col divide-y divide-border-secondary border-t border-secondary">
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
    <div className="flex flex-col gap-0.5 px-4 py-2.5">
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

/** Uma unidade comprada e o item de catálogo dela. Cópias do mesmo item NÃO se juntam: cada
 *  uma tem respostas próprias de formulário e pode ser editada sozinha, então cada uma é um
 *  cartão. Agregá-las economizava altura e tirava a única porta para a cópia certa. */
interface UnidadeDoPedido {
    item: CatalogoItem;
    linha: PedidoItem;
}

interface AcoesDaLista {
    onAbrir: (verbo: Verbo, linhas: string[]) => void;
    onContinuar: (rascunho: Rascunho) => void;
}

/**
 * Painel de leitura com ações na linha. Sem seleção em massa na página: escolher várias unidades
 * acontece dentro do overlay, depois de saber o verbo, porque o que pode entrar depende dele.
 * Nada desabilitado: o que não é possível não aparece, e o motivo fica perto.
 */
const ListaDeItens = ({ pedido, rascunhos, ...acoes }: { pedido: Pedido; rascunhos: Rascunho[] } & AcoesDaLista) => {
    const estrutura = useMemo(() => {
        /* Ordem da compra, sem reordenar: linha que troca de lugar faz o próximo clique cair
           na vizinha. */
        const todas = pedido.itens.map((linha) => ({ linha, item: getItem(linha.itemId) })).filter((u): u is UnidadeDoPedido => Boolean(u.item));
        const sessoes = SESSOES.filter((s) => s.eventoId === pedido.eventoId)
            .sort((a, b) => a.inicio - b.inicio)
            .map((sessao) => ({ sessao, unidades: todas.filter((u) => u.item.tipo === "ingresso" && u.item.sessaoId === sessao.id) }))
            .filter((s) => s.unidades.length > 0);
        return { sessoes, produtos: todas.filter((u) => u.item.tipo === "produto"), combos: todas.filter((u) => u.item.tipo === "combo") };
    }, [pedido]);

    /* Uma unidade elegível já basta para o botão existir: ele é a única porta de transferência
       e troca, e com o corte antigo de duas unidades 17 dos 25 pedidos ficavam sem ação. */
    const elegiveis = (verbo: Verbo) => pedido.itens.filter((l) => disponivelPara(pedido, l, verbo)).length;
    const nTransferir = elegiveis("transferir");
    const verbos = VERBOS_EM_MASSA.filter(({ verbo }) => elegiveis(verbo) > 0);
    const motivoGeral =
        nTransferir === 0 ? "Todas as unidades estão em outra alteração ou com outro titular." : pedidoEncerrado(pedido) ? "As sessões deste pedido já aconteceram. Só a transferência continua disponível." : null;

    const renderUnidade = (unidade: UnidadeDoPedido) => <CartaoDaUnidade key={unidade.linha.id} pedido={pedido} rascunhos={rascunhos} {...unidade} {...acoes} />;

    return (
        /* Sem moldura: os itens já estão dentro da coluna de trabalho, que o trilho à esquerda
           delimita. Um cartão em volta deles acrescentava uma segunda borda ao redor do mesmo
           conteúdo e empurrava tudo 20px para dentro, estreitando a linha sem separar nada. */
        <section className="flex flex-col gap-5">
            {(verbos.length > 0 || motivoGeral) && (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    {verbos.length > 0 && (
                        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
                            {verbos.map(({ verbo, rotulo }) => (
                                <Button key={verbo} size="sm" color="secondary" iconLeading={TIPO_OPERACAO_ICONE[TIPO_DO_VERBO[verbo]]} className="max-sm:flex-1" onClick={() => acoes.onAbrir(verbo, [])}>
                                    {rotulo}
                                </Button>
                            ))}
                        </div>
                    )}
                    {motivoGeral && <p className="text-sm text-secondary">{motivoGeral}</p>}
                </div>
            )}

            {/* gap-6 entre grupos, gap-3 entre cartoes: o cartao traz a propria moldura, entao
                o que separa itens agora e o ar, nao mais o fio do divide-y. */}
            <div className="flex flex-col gap-6">
                {estrutura.sessoes.length > 0 && (
                    /* Uma sessao so: "Ingressos" e a data cabem na mesma linha. Dois titulos
                       empilhados sobre um cartao que ja tem borda eram tres caixas para dizer
                       uma coisa. Com duas ou mais sessoes os niveis voltam a existir. */
                    <GrupoDeItens titulo="Ingressos" sessao={estrutura.sessoes.length === 1 ? estrutura.sessoes[0].sessao : undefined}>
                        {estrutura.sessoes.map(({ sessao, unidades }) => (
                            <div key={sessao.id} className="flex flex-col gap-3">
                                {estrutura.sessoes.length > 1 && <TituloDaSessao sessao={sessao} />}
                                {unidades.map(renderUnidade)}
                            </div>
                        ))}
                    </GrupoDeItens>
                )}
                {estrutura.produtos.length > 0 && <GrupoDeItens titulo="Produtos">{estrutura.produtos.map(renderUnidade)}</GrupoDeItens>}
                {estrutura.combos.length > 0 && <GrupoDeItens titulo="Combos">{estrutura.combos.map(renderUnidade)}</GrupoDeItens>}
            </div>
        </section>
    );
};

/** "Qua, 11 de nov., 06h00" e, quando a sessão já passou, o que isso restringe. */
const MarcaDaSessao = ({ sessao }: { sessao: Sessao }) => (
    <>
        <Calendar className="size-4 shrink-0 text-fg-quaternary" aria-hidden="true" />
        <span className="first-letter:uppercase">{tituloDaSessao(sessao)}</span>
        {sessao.inicio <= Date.now() && <span className="font-normal text-tertiary">· Sessão realizada. Só a transferência continua disponível.</span>}
    </>
);

/** Quando o grupo tem uma sessão só, ela sobe para a mesma linha do título. */
const GrupoDeItens = ({ titulo, sessao, children }: { titulo: string; sessao?: Sessao; children: ReactNode }) => (
    <div className="flex flex-col gap-3">
        {/* Etiqueta de arquivo, não capítulo: a 16/700 competia de igual para igual com o nome
            do item, que é o alvo da varredura. Desce para o andar do detalhe. */}
        <h3 className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm font-semibold text-secondary">
            {titulo}
            {sessao && (
                <>
                    <span className="text-quaternary" aria-hidden="true">
                        ·
                    </span>
                    <MarcaDaSessao sessao={sessao} />
                </>
            )}
        </h3>
        {children}
    </div>
);

const TituloDaSessao = ({ sessao }: { sessao: Sessao }) => (
    <h4 className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm font-semibold text-secondary">
        <MarcaDaSessao sessao={sessao} />
    </h4>
);

/** Acima disso a lista de unidades nasce recolhida. Até seis, o alternador custa mais linha
 *  do que esconde, e a lista inteira cabe sem rolar. */
/* Um degrau abaixo do `rounded-2xl` do trilho e do CartaoOperacao: a unidade é conteúdo da
   página, não o objeto mais alto dela. Mesmo anel, raio menor, sem sombra pesada. */
const CARTAO = "flex flex-col rounded-xl bg-primary shadow-xs ring-1 ring-border-secondary ring-inset";

/** A regra do catálogo que faz uma transferência ser recusada lá na frente. */
const RESTRICAO_DO_ITEM: Record<NonNullable<CatalogoItem["segmentacao"]>, string> = {
    feminino: "Exclusivo feminino",
    socio: "Exclusivo sócios",
};

/**
 * Uma unidade comprada, como cartão. Duas cópias do mesmo ingresso dão dois cartões iguais.
 *
 * Elas não se agregam porque não são a mesma coisa: cada uma tem as respostas de formulário do
 * seu participante, e é por elas que o comprador liga. Agregadas, a única forma de chegar numa
 * cópia específica era um ordinal ("unidade 17 de 40") que não corresponde a nada que o
 * comprador vê, ou uma coluna com a resposta de uma pergunta eleita entre vinte. Repetir o
 * cartão custa altura e resolve as duas: a cópia é o objeto, e o formulário dela é a ação.
 */
const CartaoDaUnidade = ({ pedido, rascunhos, item, linha, onAbrir, ...resto }: { pedido: Pedido; rascunhos: Rascunho[] } & UnidadeDoPedido & AcoesDaLista) => {
    const estado = lerUnidade(pedido, rascunhos, linha);
    /* Só o que está em curso abre um andar próprio. Quem porta a unidade subiu para o
       cabeçalho: é identidade, não acontecimento. */
    const temFatos = Boolean(estado.solicitacao || estado.rascunho);
    /* O formulário é desta unidade, com as respostas dela: a porta é o cartão, não um botão de
       pedido inteiro. Some quando o item não tem formulário ou a unidade está travada. */
    const podeFormulario = temFormulario(item) && disponivelPara(pedido, linha, "formulario");

    return (
        <article className={CARTAO}>
            <div className="flex items-start gap-3 px-4 py-4 lg:px-5">
                <Miniatura item={item} />
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        {/* O único text-md do cartão: é por ele que se varre a coluna. */}
                        <p className="text-md font-semibold text-primary">{item.nome}</p>
                        {item.segmentacao && (
                            <Badge size="md" type="modern" color="gray">
                                {RESTRICAO_DO_ITEM[item.segmentacao]}
                            </Badge>
                        )}
                    </div>
                    {caminhoDoItem(item) && <p className="text-sm text-tertiary">{caminhoDoItem(item)}</p>}
                    {item.datasCombo && item.datasCombo.length > 0 && <p className="text-sm text-tertiary">{item.datasCombo.join(" · ")}</p>}
                    {item.descricao && <p className="text-sm text-tertiary">{item.descricao}</p>}
                    <PortadorDaUnidade linha={linha} />
                </div>
                <p className="shrink-0 text-sm font-semibold text-primary tabular-nums">{formatarMoeda(linha.valorPago)}</p>
            </div>

            {temFatos && (
                <div className="flex flex-col gap-0.5 border-t border-secondary px-4 py-3 lg:px-5">
                    <FatosDaUnidade pedido={pedido} linha={linha} estado={estado} {...resto} />
                </div>
            )}

            {podeFormulario && (
                <footer className="flex border-t border-secondary px-4 py-3 lg:px-5">
                    <Button size="sm" color="secondary" iconLeading={TIPO_OPERACAO_ICONE[TIPO_DO_VERBO.formulario]} className="max-sm:flex-1" onClick={() => onAbrir("formulario", [linha.id])}>
                        Editar formulário
                    </Button>
                </footer>
            )}
        </article>
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

/**
 * Transferir e trocar têm uma porta só, no topo da lista, porque servem para uma unidade ou
 * para n: a escolha de quais acontece dentro do fluxo, depois de saber o verbo, já que o que
 * pode entrar depende dele.
 *
 * Editar formulário não está aqui. Ele não tem versão geral: o formulário é de uma unidade,
 * com as respostas dela, então a porta dele é o cartão da unidade.
 */
const VERBOS_EM_MASSA: Array<{ verbo: Verbo; rotulo: string }> = [
    { verbo: "transferir", rotulo: "Transferir itens" },
    { verbo: "trocar", rotulo: "Trocar itens" },
];
/**
 * Tudo o que se sabe sobre uma unidade, lido de um lugar só: a linha da lista e o cartão de
 * unidade única consultam daqui, e assim nunca discordam sobre o que oferecer.
 */
const lerUnidade = (pedido: Pedido, rascunhos: Rascunho[], linha: PedidoItem) => {
    const solicitacao = solicitacaoDaLinha(pedido, linha.id);
    const transferida = Boolean(linha.titularId);
    return {
        solicitacao,
        transferida,
        rascunho: rascunhos.find((r) => r.linhasSelecionadas.includes(linha.id)),
    };
};

type EstadoLido = ReturnType<typeof lerUnidade>;

/** O que aconteceu com a unidade. Fica sempre na coluna de texto, nunca na de controle: a
 *  direita do cartão é o que se pode fazer, não o que já foi feito. */
const FatosDaUnidade = ({ pedido, linha, estado, onContinuar }: { pedido: Pedido; linha: PedidoItem; estado: EstadoLido } & Omit<AcoesDaLista, "onAbrir">) => {
    const { solicitacao, rascunho } = estado;
    return (
        <>
            {/* Só a frase de estado: o cartão da operação já está na tela, logo acima das abas,
                então "Ver alteração" rolava até algo que a pessoa está vendo. */}
            {solicitacao && <EstadoDaUnidade pedido={pedido} linha={linha} solicitacao={solicitacao} />}
            {!solicitacao && rascunho && (
                <p className="flex flex-wrap items-center gap-x-2 text-sm text-tertiary">
                    Rascunho de {rascunho.tipo === "troca-titularidade" ? "transferência" : "troca"} não enviado
                    <Button size="sm" color="link-color" onClick={() => onContinuar(rascunho)}>
                        Continuar
                    </Button>
                </p>
            )}
        </>
    );
};

/**
 * Quem porta a unidade, numa linha só, logo abaixo do grupo e do lote. Vale para ingresso,
 * produto e combo: quem segura a unidade é a mesma pergunta nos três.
 *
 * Era um bloco próprio, com nome, frase de origem e um selo "Transferido", e partia o cartão
 * em três andares para dizer o que cabe numa linha. Quem porta é da mesma natureza de grupo e
 * lote: identifica a unidade, não é um acontecimento. De onde ela veio é conferência, e
 * conferência fica atrás de "Detalhes", como no pagamento.
 */
const PortadorDaUnidade = ({ linha }: { linha: PedidoItem }) => {
    const conta = linha.titularId ? getConta(linha.titularId) : undefined;
    if (!conta) return <p className="text-sm text-tertiary">Portado pelo comprador</p>;

    const origem = [linha.transferidoEmLabel && `em ${linha.transferidoEmLabel}`, linha.transferidoPor && `por ${linha.transferidoPor}`].filter(Boolean).join(" ");
    return (
        <p className="flex flex-wrap items-center gap-x-2 text-sm text-tertiary">
            <span>Portado por {conta.nome}</span>
            <span className="text-quaternary" aria-hidden="true">
                |
            </span>
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
                    <AriaDialog aria-label="Detalhe da titularidade" className="w-72 rounded-2xl bg-primary p-4 shadow-xl ring ring-secondary_alt outline-hidden">
                        <dl className="flex flex-col gap-2">
                            <Campo rotulo="Portador">{conta.nome}</Campo>
                            {conta.cpf && <Campo rotulo="CPF">{formatarCPF(conta.cpf)}</Campo>}
                            {conta.email && <Campo rotulo="E-mail">{conta.email}</Campo>}
                            <div className="flex flex-col gap-0.5 border-t border-secondary pt-2">
                                <dt className="text-sm text-tertiary">Recebeu por transferência</dt>
                                <dd className="text-sm text-primary">{origem || "Sem registro da data"}</dd>
                            </div>
                        </dl>
                    </AriaDialog>
                </AriaPopover>
            </AriaDialogTrigger>
        </p>
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
