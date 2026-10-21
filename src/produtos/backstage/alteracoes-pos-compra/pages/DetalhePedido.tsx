import { Fragment, useEffect, useMemo, useRef, useState, type FC, type ReactNode } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { Dialog as AriaDialog, DialogTrigger as AriaDialogTrigger, Popover as AriaPopover } from "react-aria-components";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { AlertTriangle, ArrowLeft, Calendar, Check, ChevronDown, ChevronRight, Copy01, Mail01, Phone, Tag01, User01 } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { AvatarProfilePhoto } from "@/components/base/avatar/avatar-profile-photo";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Tooltip } from "@/components/base/tooltip/tooltip";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Tabs } from "@/components/application/tabs/tabs";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { useClipboard } from "@/hooks/use-clipboard";
import { cx } from "@/utils/cx";
import { BackstageLayout } from "../../components/Backstage";
import { CartaoOperacao, idDoCartao } from "../components/CartaoOperacao";
import {
    TIPO_OPERACAO_ICONE, FOCO, FOCO_ESCOPO, Miniatura, caminhoDoItem, iniciaisDe, formatarCPF, telefoneParaCopia } from "../components/pos-compra-ui";
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
    itensDoCombo,
    temFormulario,
    totaisDoPedido,
    usePedidos,
    uuidCurto,
    vocabularioDoEvento,
    type TipoItem,
    type Vocabulario,
    type CatalogoItem,
    type EntradaHistorico,
    type Pedido,
    type PedidoItem,
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

/** O mesmo texto serve ao leitor de tela, no desktop, e ao toast, no telefone. */
const CONFIRMACAO_COPIA: Record<string, string> = {
    id: "ID do pedido copiado",
    email: "E-mail copiado",
    celular: "Celular copiado",
};

export function DetalhePedido() {
    const { pedidoId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const pedidos = usePedidos();
    const pedido = pedidos.find((p) => p.id === pedidoId);
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

    /* Os fluxos são telas com rota própria e a unidade escolhida viaja na URL, então recarregar
       a página ou mandar o link para um colega cai no mesmo ponto do atendimento. */
    const abrir = (verbo: Verbo, linhas: string[]) => {
        const query = linhas.length > 0 ? `?linhas=${linhas.join(",")}` : "";
        navigate(`/backstage/pedidos/${pedido.id}/${verbo}${query}`);
    };

    return (
        <BackstageLayout showEventContext={false} activeProducer="pedidos">
            <motion.div
                className={cx("flex min-w-0 flex-1 flex-col gap-4 p-4 md:py-6 md:pr-6 md:pl-0", FOCO_ESCOPO)}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, ease: "easeOut" }}
            >
                <FaixaDoPedido pedido={pedido} aoVoltar={() => navigate(voltarPara)} />

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
                    {/* Título e ações na mesma faixa, depois do trilho, como no detalhe de grupo
                        da equipe de operação: o voltar e o nome da página abrem a coluna de
                        trabalho, e o que se pode fazer com o pedido fica no canto, à vista em
                        qualquer aba. Antes o voltar morava acima das duas colunas e as ações
                        estavam enterradas no topo da lista de itens, onde só existiam enquanto a
                        aba Itens estivesse aberta. */}
                    {/* `flex-wrap`: com os três tipos no nome dos botões eles somam mais de 70
                        caracteres, e como `shrink-0` espremiam o título até "Pedid...". Agora
                        descem para a própria linha quando não cabem, e o título fica inteiro. */}
                    <header className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-4">
                        <div className="flex items-center gap-3 max-md:hidden">
                            <ButtonUtility size="sm" color="tertiary" className="max-md:size-11" icon={ArrowLeft} tooltip="Voltar para os pedidos" onClick={() => navigate(voltarPara)} />
                            {/* Só o id: a palavra "Pedido" repetia o que a aba do navegador, o
                                caminho de volta e a tela inteira já dizem. Mostra a forma curta,
                                que é por onde o pedido é chamado, e copia a completa, que é a que
                                se cola em outro sistema. */}
                            <h1 className="text-display-xs font-bold text-primary">{uuidCurto(pedido.id)}</h1>
                            <CopiarIdDoPedido id={pedido.id} />
                        </div>
                        <AcoesDoPedido pedido={pedido} onAbrir={abrir} />
                    </header>

                    <RegiaoAlteracoes pedido={pedido} />

                    {/* Abaixo de md as duas abas dividem a largura e a fileira gruda logo abaixo
                        da barra do Backstage. Encostadas à esquerda e paradas no topo da página,
                        voltar para o Histórico depois de percorrer os itens custava rolar a tela
                        inteira de volta até um alvo de 40px no canto que o polegar não alcança. */}
                    <Tabs
                        selectedKey={aba}
                        onSelectionChange={(key) => setAba(key as Aba)}
                        /* 129px = barra do Backstage (61) + a faixa do pedido (68). As abas encostam no fim da
                           faixa; um pixel a menos e o conteúdo aparecia na fresta entre as duas. */
                        className="max-md:sticky max-md:top-[129px] max-md:z-20 max-md:-mx-4 max-md:w-auto max-md:bg-primary_alt max-md:px-4 max-md:py-2"
                    >
                        <Tabs.List type="underline" size="sm">
                            <Tabs.Item id="itens" className="max-md:flex-1">
                                Itens
                            </Tabs.Item>
                            <Tabs.Item id="historico" className="max-md:flex-1">
                                Histórico
                            </Tabs.Item>
                        </Tabs.List>
                    </Tabs>

                    {aba === "itens" ? (
                        <ListaDeItens pedido={pedido} onAbrir={abrir} />
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
const TrilhoDoComprador = ({ pedido, emPainel = false }: { pedido: Pedido; emPainel?: boolean }) => {
    const comprador = getConta(pedido.compradorId);
    const evento = getEvento(pedido.eventoId);
    const { copied, copy } = useClipboard();
    const [falhaCopia, setFalhaCopia] = useState(false);
    const idCompleto = useRef<HTMLSpanElement>(null);
    const rotuloCompra = pedido.canal === "Online" ? "Compra online" : pedido.canal === "Bilheteria" ? "Compra na bilheteria" : "Cortesia emitida";
    const { pago, cortesia } = usePagamento(pedido);
    const isDesktop = useBreakpoint("md");

    /* Devolve se copiou: o tooltip de confirmação só pode abrir quando de fato copiou, e este
       caminho tem plano B justamente para quando a área de transferência falha. */
    const copiarId = async () => {
        const resultado = await copy(pedido.id, "id");
        if (resultado.success) {
            /* No telefone o dedo cobre o ícone que vira check, então a confirmação sai no toast.
               Sem ela o atendente ditava de volta o que já estava na área de transferência. */
            if (!isDesktop) toast.success(CONFIRMACAO_COPIA.id);
            return true;
        }
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
        <aside
            className={cx(
                "flex w-full shrink-0 flex-col gap-3",
                // Na coluna: grudado e com 280px, e invisível no telefone — lá a identidade é a
                // faixa do topo, e este cartão inteiro vive dentro do painel de Detalhes.
                !emPainel && "max-md:hidden md:sticky md:top-[calc(var(--bs-header-offset,0px)+1.5rem)] md:w-[280px]",
            )}
        >
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
                    <div className="aspect-[256/160] w-full overflow-hidden rounded-xl bg-secondary max-md:hidden">
                        <img src={evento.capa} alt="" className="size-full object-cover" />
                    </div>
                )}

                <div className={cx("flex flex-col gap-4 px-1", evento?.capa && "md:-mt-10")}>
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
                            <ItemDeContato icone={Mail01} alvoDeToque>
                                <Contato valor={comprador.email} textoCopia={comprador.email} rotulo="Copiar e-mail" chave="email" copied={copied} copy={copy} />
                            </ItemDeContato>
                        )}
                        {comprador?.celular && (
                            <ItemDeContato icone={Phone} alvoDeToque>
                                <Contato valor={comprador.celular} textoCopia={telefoneParaCopia(comprador.celular)} rotulo="Copiar celular" chave="celular" copied={copied} copy={copy} />
                            </ItemDeContato>
                        )}
                        <ItemDeContato icone={Tag01} alvoDeToque>
                            <Contato valor={pedido.id} textoCopia={pedido.id} rotulo="Copiar ID do pedido" chave="id" copied={copied} copy={copy} onCopiar={copiarId} mono />
                        </ItemDeContato>
                    </ul>

                    {/* Em 280px os números empilham. O rótulo fica em text-sm por regra do projeto
                        (nada abaixo disso), então o contraste vem do peso e da cor. */}
                    {/* `-mx-4` desfaz o px-3 do cartão mais o px-1 do miolo, então as réguas vão de
                        ponta a ponta; cada Estatistica repõe o mesmo 4 em padding para o texto seguir
                        alinhado com os contatos. Embaixo não há borda própria: o cartão não tem padding
                        inferior e o ring dele já desenha 1px na mesma cor ali, duas linhas somariam 2px. */}
                    {/* Abaixo de md os três viram uma fileira: empilhados custavam ~150px de
                        altura numa tela em que o item do pedido já começa longe. */}
                    <dl className="-mx-4 flex border-t border-secondary max-md:divide-x max-md:divide-border-secondary md:flex-col md:divide-y md:divide-border-secondary">
                        {/* O número é o que saiu do bolso, taxa e proteção incluídas: o cartão
                            mostrava a soma dos valores de face e chamava de "Pago", então batia
                            com a nota do cliente só nos pedidos sem taxa. A quebra está em
                            "Detalhes". A contagem de unidades saiu: a lista de itens, logo ao
                            lado, diz isso com mais precisão do que um resumo. */}
                        <Estatistica rotulo="Pago">
                            {cortesia ? (
                                "Sem valor"
                            ) : (
                                /* Abaixo de md o valor e o "Detalhes" empilham: lado a lado, o
                                   gatilho ficava com a altura do texto e sem folga nenhuma. */
                                <span className="flex items-baseline gap-2 max-md:flex-col max-md:items-stretch max-md:gap-0">
                                    <span className="tabular-nums">{formatarMoeda(pago)}</span>
                                    <DetalhePagamento pedido={pedido} />
                                </span>
                            )}
                        </Estatistica>
                        <Estatistica rotulo={rotuloCompra}>{pedido.criadoEmLabel}</Estatistica>
                    </dl>

                </div>
            </div>

            <span role="status" className="sr-only">
                {typeof copied === "string" ? (CONFIRMACAO_COPIA[copied] ?? "") : ""}
            </span>
            {falhaCopia && (
                <p className="text-sm text-warning-primary">
                    Não foi possível copiar. O ID está selecionado, use Ctrl+C ou ⌘C: <span ref={idCompleto} className="font-mono select-all">{pedido.id}</span>
                </p>
            )}
        </aside>
    );
};

/**
 * Identidade do pedido no telefone: miniatura do evento, id curto e nome, com "Detalhes"
 * abrindo o trilho inteiro numa folha.
 *
 * O cartão de identidade ocupava a primeira tela inteira a 375px — avatar, nome, quatro linhas
 * de contato e a fileira de números — e o atendimento só começava depois de rolar tudo. Como
 * faixa, a mesma pergunta ("de quem é este pedido") fica respondida em duas linhas e grudada no
 * topo, e o resto segue a um toque de distância em vez de na frente.
 */
const FaixaDoPedido = ({ pedido, aoVoltar }: { pedido: Pedido; aoVoltar: () => void }) => {
    const evento = getEvento(pedido.eventoId);
    const comprador = getConta(pedido.compradorId);

    return (
        /* `-mt-11` encosta a faixa na barra do Backstage. Ela nasce dentro de três paddings
           somados — py-3 da linha do layout (12) + p-4 do wrapper do BackstageLayout (16) +
           p-4 da página (16) = 44px —, então o respiro em cima era quase quatro vezes o py-3
           dela mesma embaixo. Cancelado o vão, sobra só o padding próprio nos dois lados. */
        <div className="sticky top-[60px] z-30 -mx-4 -mt-11 flex items-center gap-3 border-b border-secondary bg-primary_alt px-4 py-3 md:hidden">
            <ButtonUtility size="sm" color="tertiary" className="size-11" icon={ArrowLeft} tooltip="Voltar para os pedidos" onClick={aoVoltar} />

            {evento?.capa ? (
                <img src={evento.capa} alt="" className="size-11 shrink-0 rounded-lg object-cover ring-1 ring-border-primary" />
            ) : (
                <AvatarProfilePhoto size="sm" alt={comprador?.nome ?? "Comprador"} initials={iniciaisDe(comprador?.nome ?? "?")} />
            )}

            <div className="min-w-0 flex-1">
                <p className="truncate text-md font-bold text-primary">{uuidCurto(pedido.id)}…</p>
                <p className="truncate text-sm text-tertiary">{evento?.nome}</p>
            </div>

            <AriaDialogTrigger>
                {/* Azul utilitário, não a marca: no tema escuro `text-brand-secondary` resolve
                    para cinza claro e o link não se lê como link. Mesmo par de classes do
                    "Detalhes" do pagamento, logo abaixo nesta tela. */}
                <Button size="sm" color="link-gray" className="min-h-11 shrink-0 text-utility-blue-600 hover:text-utility-blue-700">
                    Detalhes
                </Button>
                <ModalOverlay isDismissable>
                    <Modal className="sm:max-w-md">
                        <Dialog aria-label="Detalhes do pedido">
                            <div className="flex w-full flex-col gap-3 rounded-2xl bg-primary p-5 shadow-xl ring-1 ring-border-secondary">
                                <h2 className="text-md font-semibold text-primary">Detalhes do pedido</h2>
                                <TrilhoDoComprador pedido={pedido} emPainel />
                            </div>
                        </Dialog>
                    </Modal>
                </ModalOverlay>
            </AriaDialogTrigger>
        </div>
    );
};

/**
 * Conferência sob demanda: popover ancorado no desktop, folha inferior no telefone.
 *
 * A 390px o popover de 288px cobria justamente o cartão com que se estava comparando e fechava
 * no primeiro toque fora, então conferir dois portadores seguidos custava acertar duas vezes um
 * alvo da altura do texto. A folha ancora no rodapé, perto do polegar, e tem título.
 */
const Conferencia = ({ rotulo, gatilho, children }: { rotulo: string; gatilho: ReactNode; children: ReactNode }) => {
    const isDesktop = useBreakpoint("md");

    return (
        <AriaDialogTrigger>
            {gatilho}
            {isDesktop ? (
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
                    <AriaDialog aria-label={rotulo} className="w-72 rounded-2xl bg-primary p-4 shadow-xl ring ring-secondary_alt outline-hidden">
                        {children}
                    </AriaDialog>
                </AriaPopover>
            ) : (
                <ModalOverlay isDismissable>
                    <Modal className="sm:max-w-md">
                        <Dialog aria-label={rotulo}>
                            <div className="flex w-full flex-col gap-3 rounded-2xl bg-primary p-5 shadow-xl ring-1 ring-border-secondary">
                                <h2 className="text-md font-semibold text-primary">{rotulo}</h2>
                                {children}
                            </div>
                        </Dialog>
                    </Modal>
                </ModalOverlay>
            )}
        </AriaDialogTrigger>
    );
};

/** Gatilho das conferências: link na altura do texto no desktop, linha de 44px com chevron
 *  abaixo de md, que é onde o alvo de 20px ficava impossível de acertar. */
const GatilhoDeConferencia = ({ className, children }: { className?: string; children: ReactNode }) => (
    <Button
        size="sm"
        color="link-gray"
        iconTrailing={<ChevronRight data-icon className="md:hidden" />}
        className={cx("text-utility-blue-600 hover:text-utility-blue-700 max-md:min-h-11 max-md:w-full max-md:justify-between max-md:gap-3", className)}
    >
        {children}
    </Button>
);

/** Detalhe do pagamento sobre o resumo, não dentro dele: a quebra por cupom interessa em poucos
 *  atendimentos e não vale uma faixa fixa ocupando o cabeçalho de todos os outros. */
const DetalhePagamento = ({ pedido }: { pedido: Pedido }) => (
    <Conferencia rotulo="Detalhe do pagamento" gatilho={<GatilhoDeConferencia>Detalhes</GatilhoDeConferencia>}>
        <LinhasPagamento pedido={pedido} />
    </Conferencia>
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
    /* Em fileira no telefone, os três dividem a largura igualmente; em coluna no desktop, cada um
       ocupa a largura do trilho. */
    <div className="flex min-w-0 flex-1 flex-col gap-0.5 px-4 py-2.5 max-md:px-3">
        <dt className="text-sm font-medium text-quaternary">{rotulo}</dt>
        <dd className="text-sm font-semibold text-primary">{children}</dd>
    </div>
);

/**
 * Linha da lista de conferência: ícone apagado e o dado, como o bloco "About" do cartão.
 *
 * Com `alvoDeToque`, abaixo de md a linha ganha 48px de altura e vira a âncora do botão de
 * cópia, que se estica por cima dela.
 */
const ItemDeContato = ({ icone: Icone, alvoDeToque = false, children }: { icone: FC<{ className?: string }>; alvoDeToque?: boolean; children: ReactNode }) => (
    <li
        className={cx(
            "flex items-center gap-2 text-sm text-tertiary",
            /* O realce do toque é da linha, não do botão: esticado por cima do texto, o fundo
               do botão escondia justamente o valor que se quer conferir antes de copiar. */
            alvoDeToque && "relative transition duration-100 ease-linear max-md:min-h-12 max-md:rounded-lg max-md:has-[button:hover]:bg-primary_hover",
        )}
    >
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
    copy: (texto: string, id?: string) => Promise<{ success: boolean; error?: Error }>;
    /** Caminho próprio de cópia, para quem tem plano B quando a área de transferência falha.
     *  Devolve se copiou, para a confirmação não aparecer quando o plano B entrou em cena. */
    onCopiar?: () => Promise<boolean | void>;
    mono?: boolean;
}) => {
    const isDesktop = useBreakpoint("md");

    const { aberto, setAberto, confirmar } = useTooltipQueSobreviveAoClique();
    const copiar = async () => {
        const { success } = await copy(textoCopia, chave);
        if (!success) return;
        if (isDesktop) confirmar();
        else toast.success(CONFIRMACAO_COPIA[chave] ?? "Copiado");
    };

    return (
        <span className="flex min-w-0 items-center gap-0.5">
            <span className={cx("truncate", mono && "font-mono select-all")} title={mono ? valor : undefined}>
                {valor}
            </span>
            {/* Abaixo de md o botão cobre a linha inteira em vez de ser um quadrado de 28px colado
                a 2px do valor: o toque que escorregava para a esquerda caía no texto select-all e
                selecionava o ID em vez de copiá-lo, sem avisar que nada tinha sido copiado. */}
            {/* O `aria-label` continua específico ("Copiar e-mail"): no leitor de tela, três
                botões chamados "Copiar" na mesma lista não dizem qual é qual. O tooltip é para o
                olho, que já vê ao lado de quê o botão está. */}
            <Tooltip title={copied === chave ? "Copiado" : "Copiar"} isOpen={aberto} onOpenChange={setAberto} placement="top">
                <ButtonUtility
                    size="xs"
                    color="tertiary"
                    icon={copied === chave ? Check : Copy01}
                    aria-label={rotulo}
                    onClick={async () => {
                    if (!onCopiar) return copiar();
                    const copiou = await onCopiar();
                    if (copiou && isDesktop) confirmar();
                }}
                    className="max-md:absolute max-md:inset-0 max-md:h-auto max-md:justify-end max-md:rounded-lg max-md:px-2 max-md:hover:bg-transparent"
                />
            </Tooltip>
        </span>
    );
};

/* ------------------------------------------------------------------ */
/*  Pagamento                                                          */
/* ------------------------------------------------------------------ */

/** "Desconto" só aparece quando houve cupom: diferença de lote não é desconto, e um desconto de
 *  R$ 0,00 era só ruído (e saía como "-R$ 0,00"). */
const usePagamento = (pedido: Pedido) => {
    const totais = totaisDoPedido(pedido);
    return { ...totais, comCupom: Boolean(pedido.cupom) && totais.desconto > 0, cortesia: pedido.canal === "Cortesia" || totais.final === 0 };
};

/**
 * O recibo da compra: cada parcela do que foi cobrado e o total que bate com a fatura do
 * cliente. Antes vinham só o cupom e a forma de pagamento, e o "Total pago" era a soma dos
 * valores de face — o atendente lia um número que o cliente não encontrava no extrato.
 */
const LinhasPagamento = ({ pedido }: { pedido: Pedido }) => {
    const { original, desconto, final, taxaServico, protecao, pago, comCupom, cortesia } = usePagamento(pedido);
    if (cortesia) return <p className="text-sm text-primary">Cortesia, sem valor pago</p>;
    return (
        <dl className="flex flex-col gap-2">
            {comCupom ? (
                <>
                    <ParValor rotulo="Itens sem desconto" valor={formatarMoeda(original)} />
                    <ParValor rotulo={`Cupom ${pedido.cupom}`} valor={`−${formatarMoeda(desconto)}`} />
                    <ParValor rotulo="Itens" valor={formatarMoeda(final)} />
                </>
            ) : (
                <ParValor rotulo="Itens" valor={formatarMoeda(final)} />
            )}
            {taxaServico > 0 && <ParValor rotulo="Taxa de serviço" valor={formatarMoeda(taxaServico)} />}
            {protecao > 0 && <ParValor rotulo="Proteção do pedido" valor={formatarMoeda(protecao)} />}

            <div className="mt-1 border-t border-secondary pt-2">
                <ParValor rotulo="Total pago" valor={formatarMoeda(pago)} destaque />
            </div>

            <div className="flex flex-col gap-0.5 border-t border-secondary pt-2">
                <dt className="text-sm text-tertiary">Forma de pagamento</dt>
                <dd className="text-sm text-primary">{formaDePagamento(pedido.meioPagamento)}</dd>
            </div>
            {protecao > 0 && (
                <p className="text-sm text-tertiary">A proteção cobre cancelamento e remarcação pelo cliente, e não é devolvida em alteração do Backstage.</p>
            )}
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

const ORDEM_ESTADO: Record<Solicitacao["estado"], number> = { falha: 0, reprovada: 1, processando: 2, aguardando: 3 };

/** O que está aberto neste pedido, sempre acima das abas: usado ao mesmo tempo que a lista, não
 *  pode ficar atrás de um clique. Falha primeiro. Só existe quando há alguma coisa aberta. */
const RegiaoAlteracoes = ({ pedido }: { pedido: Pedido }) => {
    const abertas = [...pedido.solicitacoes].sort((a, b) => ORDEM_ESTADO[a.estado] - ORDEM_ESTADO[b.estado] || a.expiraEm - b.expiraEm);
    if (abertas.length === 0) return null;
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

        </section>
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
}

/**
 * Painel de leitura com ações na linha. Sem seleção em massa na página: escolher várias unidades
 * acontece dentro do overlay, depois de saber o verbo, porque o que pode entrar depende dele.
 * Nada desabilitado: o que não é possível não aparece, e o motivo fica perto.
 */
const ListaDeItens = ({ pedido, ...acoes }: { pedido: Pedido } & AcoesDaLista) => {
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
    const motivoGeral =
        nTransferir === 0 ? "Todas as unidades estão em outra alteração ou com outro titular." : pedidoEncerrado(pedido) ? "As sessões deste pedido já aconteceram. Só a transferência continua disponível." : null;

    const renderUnidade = (unidade: UnidadeDoPedido) => <CartaoDaUnidade key={unidade.linha.id} pedido={pedido} {...unidade} {...acoes} />;

    return (
        /* Sem moldura: os itens já estão dentro da coluna de trabalho, que o trilho à esquerda
           delimita. Um cartão em volta deles acrescentava uma segunda borda ao redor do mesmo
           conteúdo e empurrava tudo 20px para dentro, estreitando a linha sem separar nada. */
        <section className="flex flex-col gap-5">
            {/* Os botões subiram para o cabeçalho da coluna. Aqui fica só o porquê de não haver
                nenhum: é explicação sobre estas unidades, e o lugar dela é junto delas. */}
            {motivoGeral && <p className="text-sm text-secondary">{motivoGeral}</p>}

            {/* gap-6 entre grupos, gap-3 entre cartoes: o cartao traz a propria moldura, entao
                o que separa itens agora e o ar, nao mais o fio do divide-y. */}
            <div className="flex flex-col gap-6">
                {estrutura.sessoes.length > 0 && (
                    /* A data fica numa linha própria abaixo de "Ingressos", sempre: com uma
                       sessão ou com várias, é o mesmo nível de informação no mesmo lugar. */
                    <GrupoDeItens titulo={vocabularioDoEvento(pedido.eventoId).ingressos}>
                        {estrutura.sessoes.map(({ sessao, unidades }) => (
                            <div key={sessao.id} className="flex flex-col gap-2">
                                <TituloDaSessao sessao={sessao} />
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

const GrupoDeItens = ({ titulo, children }: { titulo: string; children: ReactNode }) => (
    <div className="flex flex-col gap-3">
        {/* Etiqueta de arquivo, não capítulo: a 16/700 competia de igual para igual com o nome
            do item, que é o alvo da varredura. Desce para o andar do detalhe. */}
        <h3 className="text-sm font-semibold text-secondary">{titulo}</h3>
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
const CartaoDaUnidade = ({ pedido, item, linha, onAbrir }: { pedido: Pedido } & UnidadeDoPedido & AcoesDaLista) => {
    const estado = lerUnidade(pedido, linha);
    /* Só o que está em curso abre um andar próprio. Quem porta a unidade subiu para o
       cabeçalho: é identidade, não acontecimento. */
    const temFatos = Boolean(estado.solicitacao);
    /* O formulário é desta unidade, com as respostas dela: a porta é o cartão, não um botão de
       pedido inteiro. Some quando o item não tem formulário ou a unidade está travada. */
    const podeFormulario = temFormulario(item) && disponivelPara(pedido, linha, "formulario");
    const partesDoCombo = itensDoCombo(item);

    return (
        <article className={CARTAO}>
            {/* O preço era a terceira coluna da fileira e agora fecha a primeira linha do texto.
                Como coluna, ele comia 82px da largura em todas as linhas do cartão e sobravam
                ~170px para o texto a 390px, cabendo 23 caracteres por linha; e ele mudava de
                altura a cada unidade, porque a coluna ao lado tem de uma a oito linhas, então
                conferir valores deixava de ser uma varredura vertical. */}
            <div className="flex items-start gap-3 px-4 py-4 lg:px-5">
                <Miniatura item={item} />
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex items-start gap-3">
                        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
                            {/* O único text-md do cartão: é por ele que se varre a coluna. */}
                            <p className="text-md font-semibold text-primary">{item.nome}</p>
                            {item.segmentacao && (
                                <Badge size="md" type="modern" color="gray">
                                    {RESTRICAO_DO_ITEM[item.segmentacao]}
                                </Badge>
                            )}
                        </div>
                        <p className="shrink-0 text-sm font-semibold text-primary tabular-nums">{formatarMoeda(linha.valorPago)}</p>
                    </div>
                    {caminhoDoItem(item) && <p className="text-sm text-tertiary">{caminhoDoItem(item)}</p>}
                    {item.datasCombo && item.datasCombo.length > 0 && <p className="text-sm text-tertiary">{item.datasCombo.join(" · ")}</p>}
                    {/* O combo não é a unidade atômica: ele empacota ingressos, cada um com seu
                        grupo e lote, e produtos. Recolhido, o cartão volta a ser varrido pelo nome
                        do pacote; aberto, diz o que tem dentro. A régua à esquerda liga a lista ao
                        item acima sem precisar de um cartão dentro do cartão.

                        A descrição do combo saiu: ela contava a mesma coisa em prosa publicitária,
                        e quem atende precisa dos itens, não da frase de venda. */}
                    {partesDoCombo.length > 0 ? (
                        <details className="group">
                            <summary className="flex w-fit cursor-pointer list-none items-center gap-1 rounded-md text-sm text-tertiary transition duration-100 ease-linear hover:text-tertiary_hover max-md:min-h-11 [&::-webkit-details-marker]:hidden">
                                Detalhes
                                <ChevronDown className="size-4 text-fg-quaternary transition-transform duration-100 ease-linear group-open:rotate-180" aria-hidden="true" />
                            </summary>
                            <ul className="mt-1 flex flex-col gap-1 border-l border-secondary pl-3">
                                {partesDoCombo.map((parte) => (
                                    <li key={parte.id} className="text-sm text-tertiary">
                                        {parte.nome}
                                        {caminhoDoItem(parte) && <span className="text-quaternary"> · {caminhoDoItem(parte)}</span>}
                                    </li>
                                ))}
                            </ul>
                        </details>
                    ) : (
                        item.descricao && <p className="text-sm text-tertiary">{item.descricao}</p>
                    )}
                    <PortadorDaUnidade linha={linha} />
                </div>
            </div>

            {temFatos && (
                <div className="flex flex-col gap-0.5 border-t border-secondary px-4 py-3 lg:px-5">
                    <FatosDaUnidade pedido={pedido} linha={linha} estado={estado} />
                </div>
            )}

            {podeFormulario && (
                <footer className="flex border-t border-secondary px-4 py-3 lg:px-5">
                    <Button size="sm" color="secondary" iconLeading={TIPO_OPERACAO_ICONE[TIPO_DO_VERBO.formulario]} className="max-sm:flex-1" onClick={() => onAbrir("formulario", [linha.id])}>
                        Editar {vocabularioDoEvento(pedido.eventoId).formulario}
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
    if (solicitacao.estado === "reprovada") return <p className="text-sm text-secondary">Reprovada na revalidação. O valor pago foi estornado e nada mudou.</p>;
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
/**
 * Mantém o tooltip aberto depois do clique.
 *
 * O React Aria fecha o tooltip ao apertar o gatilho, de propósito: o tooltip descreve o que o
 * botão FAZ, não o que ele acabou de fazer. Aqui a confirmação é justamente o que interessa, e
 * ela cabe no lugar onde o olho já estava, então reabrimos no quadro seguinte — depois do
 * fechamento da biblioteca, senão ele desfaz o que acabamos de pedir.
 *
 * O fechamento automático existe porque o ponteiro pode ter saído do botão antes da reabertura,
 * e aí nenhum `mouseleave` viria para fechá-lo.
 */
const useTooltipQueSobreviveAoClique = (janelaMs = 2000) => {
    const [aberto, setAberto] = useState(false);
    const timer = useRef<number | null>(null);
    useEffect(() => () => void (timer.current && window.clearTimeout(timer.current)), []);
    const confirmar = () => {
        requestAnimationFrame(() => {
            setAberto(true);
            if (timer.current) window.clearTimeout(timer.current);
            timer.current = window.setTimeout(() => setAberto(false), janelaMs);
        });
    };
    return { aberto, setAberto, confirmar };
};

/** O que foi comprado, uma linha por item, com a quantidade na frente quando repete. O nome
 *  vem do catálogo, então a lista nunca discorda da aba de itens. */
const itensDaCompra = (pedido: Pedido) => {
    const porItem = new Map<string, { chave: string; nome: string; detalhe: string; quantidade: number }>();
    pedido.itens.forEach((linha) => {
        const item = getItem(linha.itemId);
        if (!item) return;
        const atual = porItem.get(linha.itemId) ?? { chave: linha.itemId, nome: item.nome, detalhe: caminhoDoItem(item), quantidade: 0 };
        atual.quantidade++;
        porItem.set(linha.itemId, atual);
    });
    return [...porItem.values()].map(({ chave, nome, detalhe, quantidade }) => ({
        chave,
        rotulo: [quantidade > 1 ? `${quantidade}x ${nome}` : nome, detalhe].filter(Boolean).join(" · "),
    }));
};

/** O id completo do pedido na área de transferência, ao lado do título. O trilho também copia,
 *  mas lá o id é uma linha de conferência entre outras; aqui ele é o nome da tela. */
const CopiarIdDoPedido = ({ id }: { id: string }) => {
    const { copied, copy } = useClipboard();
    const isDesktop = useBreakpoint("md");
    const { aberto, setAberto, confirmar } = useTooltipQueSobreviveAoClique();
    const copiar = async () => {
        const resultado = await copy(id, "id");
        if (!resultado.success) return;
        /* No telefone o dedo cobre o ícone que vira check, então a confirmação sai no toast. */
        if (isDesktop) confirmar();
        else toast.success(CONFIRMACAO_COPIA.id);
    };
    return (
        <Tooltip title={copied === "id" ? "Copiado" : "Copiar"} isOpen={aberto} onOpenChange={setAberto} placement="top">
            <ButtonUtility size="sm" color="tertiary" className="max-md:size-11" icon={copied === "id" ? Check : Copy01} aria-label="Copiar ID do pedido" onClick={copiar} />
        </Tooltip>
    );
};

/** "ingressos", "categorias e produtos", "ingressos, produtos e combos": o que o verbo alcança
 *  neste pedido, na voz do evento. "Itens" é palavra nossa — o operador conhece ingresso,
 *  produto e combo, e no esporte categoria. */
const tiposAlcancados = (pedido: Pedido, verbo: Verbo, v: Vocabulario) => {
    const tem = (tipo: TipoItem) => pedido.itens.some((l) => getItem(l.itemId)?.tipo === tipo && disponivelPara(pedido, l, verbo));
    const nomes = [tem("ingresso") && v.ingressos.toLowerCase(), tem("produto") && "produtos", tem("combo") && "combos"].filter(Boolean) as string[];
    if (nomes.length < 2) return nomes.join("");
    return `${nomes.slice(0, -1).join(", ")} e ${nomes[nomes.length - 1]}`;
};

/** As ações do pedido, no canto do cabeçalho. Um verbo entra quando ao menos uma unidade o
 *  aceita: é a única porta de transferência e troca, e exigir duas deixava a maioria dos
 *  pedidos sem ação nenhuma. */
const AcoesDoPedido = ({ pedido, onAbrir }: { pedido: Pedido; onAbrir: (verbo: Verbo, linhas: string[]) => void }) => {
    const v = vocabularioDoEvento(pedido.eventoId);
    const verbos = VERBOS_EM_MASSA.map(({ verbo, rotulo }) => ({ verbo, rotulo, tipos: tiposAlcancados(pedido, verbo, v) })).filter(({ tipos }) => tipos !== "");
    if (verbos.length === 0) return null;
    return (
        <div className="flex shrink-0 flex-wrap gap-2 max-md:w-full">
            {verbos.map(({ verbo, rotulo, tipos }) => (
                <Button
                    key={verbo}
                    size="md"
                    color="secondary"
                    iconLeading={TIPO_OPERACAO_ICONE[TIPO_DO_VERBO[verbo]]}
                    className="max-md:flex-1"
                    onClick={() => onAbrir(verbo, [])}
                >
                    {rotulo} {tipos}
                </Button>
            ))}
        </div>
    );
};

const VERBOS_EM_MASSA: Array<{ verbo: Verbo; rotulo: string }> = [
    { verbo: "transferir", rotulo: "Transferir" },
    { verbo: "trocar", rotulo: "Trocar" },
];
/**
 * Tudo o que se sabe sobre uma unidade, lido de um lugar só: a linha da lista e o cartão de
 * unidade única consultam daqui, e assim nunca discordam sobre o que oferecer.
 */
const lerUnidade = (pedido: Pedido, linha: PedidoItem) => {
    const solicitacao = solicitacaoDaLinha(pedido, linha.id);
    const transferida = Boolean(linha.titularId);
    return {
        solicitacao,
        transferida,
    };
};

type EstadoLido = ReturnType<typeof lerUnidade>;

/** O que aconteceu com a unidade. Fica sempre na coluna de texto, nunca na de controle: a
 *  direita do cartão é o que se pode fazer, não o que já foi feito. */
const FatosDaUnidade = ({ pedido, linha, estado }: { pedido: Pedido; linha: PedidoItem; estado: EstadoLido }) => {
    const { solicitacao } = estado;
    return (
        <>
            {/* Só a frase de estado: o cartão da operação já está na tela, logo acima das abas,
                então "Ver alteração" rolava até algo que a pessoa está vendo. */}
            {solicitacao && <EstadoDaUnidade pedido={pedido} linha={linha} solicitacao={solicitacao} />}
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
            {/* Abaixo de md a linha inteira é o gatilho e o nome entra dentro dele. Solto depois
                do separador, numa coluna estreita, o "Detalhes" caía sozinho numa linha quebrada
                com a altura do texto, e é por ele que se confere o CPF de quem porta. */}
            <span className="max-md:hidden">Portado por {conta.nome}</span>
            <span className="text-quaternary max-md:hidden" aria-hidden="true">
                |
            </span>
            <Conferencia
                rotulo="Detalhe da titularidade"
                gatilho={
                    <GatilhoDeConferencia className="max-md:text-left max-md:whitespace-normal max-md:text-tertiary">
                        <span className="max-md:hidden">Detalhes</span>
                        <span className="md:hidden">Portado por {conta.nome}</span>
                    </GatilhoDeConferencia>
                }
            >
                <dl className="flex flex-col gap-2">
                    <Campo rotulo="Portador">{conta.nome}</Campo>
                    {conta.cpf && <Campo rotulo="CPF">{formatarCPF(conta.cpf)}</Campo>}
                    {conta.email && <Campo rotulo="E-mail">{conta.email}</Campo>}
                    <div className="flex flex-col gap-0.5 border-t border-secondary pt-2">
                        <dt className="text-sm text-tertiary">Recebeu por transferência</dt>
                        <dd className="text-sm text-primary">{origem || "Sem registro da data"}</dd>
                    </div>
                </dl>
            </Conferencia>
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
        if (viva.estado === "reprovada") return { rotulo: "Reprovada, valor estornado", tom: "neutro", dinheiro: "estornados", viva };
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

    /* Só a contagem. A quebra por desfecho ("1 alteração desde a compra: 1 concluída") repetia o
       número para dizer a mesma coisa duas vezes, e cada alteração já carrega o seu desfecho. */
    const resumo =
        lista.length === 0
            ? "Nenhuma alteração registrada no Backstage desde a compra."
            : `${plural(lista.length, "alteração", "alterações")} desde a compra.`;

    /* Sem moldura própria: cada alteração já é um cartão, e a caixa em volta punha caixa dentro
       de caixa. O que organiza a aba é a pilha, não o anel. */
    return (
        <section className="flex flex-col gap-4">
            <p className="text-sm text-secondary">{resumo}</p>

            {/* A compra entra na mesma pilha e no mesmo cartão das alterações. Ela era um bloco
                solto depois de uma régua, com tipografia própria, e lia como se não fizesse parte
                do histórico — sendo que é a primeira linha dele. */}
            <ol className="flex flex-col gap-2">
                {visiveis.map((grupo) => (
                    <GrupoDoHistorico key={grupo.chave} pedido={pedido} grupo={grupo} onVerAlteracao={onVerAlteracao} />
                ))}
                {compra && <CompraNoHistorico pedido={pedido} compra={compra} />}
            </ol>
            {lista.length > LIMITE_GRUPOS && (
                <div>
                    <Button size="sm" color="link-color" onClick={() => setTodos((atual) => !atual)}>
                        {todos ? "Mostrar menos" : `Mostrar mais ${lista.length - LIMITE_GRUPOS} alterações`}
                    </Button>
                </div>
            )}
        </section>
    );
};

/**
 * Uma alteração no histórico: uma linha de extrato que abre.
 *
 * Era tudo aberto e tudo em 14px: 16 elementos de texto do mesmo tamanho, encadeados por 16
 * pontos médios, 399px para UMA alteração. A decisão de 14/10 pede o contrário, "fechado e
 * expandindo sob demanda, com o básico do básico à vista, e A → B com seta em vez de frases
 * verbosas de/para".
 *
 * Fechado mostra o que o atendente sempre precisa: o que foi, de que virou o quê, quanto e como
 * terminou. Aberto mostra o que ele precisa às vezes: o motivo, o chamado e a hora de cada marco.
 * A exceção deliberada é a alteração que ainda pede trabalho: ela nasce aberta, porque é para
 * onde ele ia de qualquer jeito.
 */
/**
 * A compra, no cartão das alterações: mesmo ícone à esquerda, mesmo título de 16px, mesmo
 * dinheiro à direita e o mesmo campo "Detalhes" no pé. O que ela tem de próprio é o conteúdo:
 * canal, forma de pagamento, cupom e o que foi comprado.
 */
const CompraNoHistorico = ({ pedido, compra }: { pedido: Pedido; compra: EntradaHistorico }) => (
    <li className="scroll-mt-24">
        <div className={cx("rounded-xl bg-primary ring-1 ring-border-secondary", FOCO_ESCOPO)}>
            <div className="flex items-start gap-3 p-4">
                <FeaturedIcon icon={Tag01} color="gray" theme="modern" size="sm" className="mt-0.5 shrink-0" />
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <p className="text-md font-semibold text-primary">Compra</p>
                    <p className="text-sm text-tertiary">
                        <span className="tabular-nums">{horaDoLabel(pedido.criadoEmLabel) || pedido.criadoEmLabel}</span> · {pedido.canal}
                    </p>
                </div>
                {typeof compra.valor === "number" && (
                    <div className="flex shrink-0 flex-col items-end gap-1">
                        <p className="text-md font-semibold text-primary tabular-nums">{formatarMoeda(compra.valor)}</p>
                        <p className="text-sm text-tertiary">pagos na compra</p>
                    </div>
                )}
            </div>

            <details className="group border-t border-secondary">
                <summary
                    className={cx(
                        "flex cursor-pointer list-none items-center gap-1 px-4 py-3 text-sm text-tertiary transition duration-100 ease-linear hover:text-tertiary_hover max-md:min-h-11 [&::-webkit-details-marker]:hidden",
                        FOCO,
                    )}
                >
                    Detalhes
                    <ChevronDown className="size-4 text-fg-quaternary transition-transform duration-100 ease-linear group-open:rotate-180" aria-hidden="true" />
                </summary>

                <div className="flex flex-col gap-3 px-4 pb-4">
                    <dl className="grid grid-cols-[4.5rem_1fr] gap-x-3 gap-y-1.5">
                        <dt className="text-sm text-tertiary">Data</dt>
                        <dd className="text-sm text-secondary">{pedido.criadoEmLabel}</dd>
                        <dt className="text-sm text-tertiary">Pagamento</dt>
                        <dd className="text-sm text-secondary">{formaDePagamento(pedido.meioPagamento)}</dd>
                        {pedido.cupom && (
                            <>
                                <dt className="text-sm text-tertiary">Cupom</dt>
                                <dd className="text-sm text-secondary">{pedido.cupom}</dd>
                            </>
                        )}
                    </dl>
                    {/* Os itens empilhados com régua à esquerda, como o "Detalhes" do combo: é o
                        mesmo gesto, abrir um item para ver o que tem dentro, e vale a pena ser o
                        mesmo desenho. Entra a lista do pedido no lugar da frase que resumia a
                        compra em prosa. */}
                    <div className="flex flex-col gap-1 border-l border-secondary pl-3">
                        {itensDaCompra(pedido).map(({ chave, rotulo }) => (
                            <p key={chave} className="text-sm text-tertiary">
                                {rotulo}
                            </p>
                        ))}
                    </div>
                </div>
            </details>
        </div>
    </li>
);

const GrupoDoHistorico = ({ pedido, grupo, onVerAlteracao }: { pedido: Pedido; grupo: GrupoHistorico; onVerAlteracao: (solicitacaoId: string) => void }) => {
    const { rotulo, tom, dinheiro, viva } = resultadoDoGrupo(pedido, grupo);
    const abertura = grupo.entradas.find((e) => e.marco === "solicitada") ?? grupo.entradas[0];
    const tipo = grupo.tipo ? TIPO_OPERACAO_CURTO[grupo.tipo] : abertura.titulo;
    const valor = abertura.valor;
    const eventos = juntarReenvios(grupo.entradas);
    const mudancas = abertura.mudancas ?? [];
    const Icone = grupo.tipo ? TIPO_OPERACAO_ICONE[grupo.tipo] : Calendar;

    return (
        <li id={grupo.solicitacaoId ? `grupo-${grupo.solicitacaoId}` : undefined} className="scroll-mt-24">
            {/* O cabeçalho sai de dentro do `details`: o gatilho agora é um campo rotulado no pé
                do cartão, e o `summary` precisa ser o primeiro filho do seu próprio `details`.
                O que se ganha é um alvo que diz o que faz, em vez de uma linha inteira clicável
                com um chevron mudo no canto. */}
            <div className={cx("rounded-xl bg-primary ring-1 ring-border-secondary", FOCO_ESCOPO)}>
                <div className="flex items-start gap-3 p-4">
                    <FeaturedIcon icon={Icone} color="gray" theme="modern" size="sm" className="mt-0.5 shrink-0" />

                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                        {/* O único text-md do bloco: é por ele que se varre a coluna de alterações. */}
                        <p className="text-md font-semibold text-primary">{grupo.tipo ? tipo : abertura.titulo}</p>

                        {/* A → B vem de dado, não de frase: `mudancas` guarda o par. */}
                        {mudancas.length > 0 && (
                            <ul className="flex flex-col gap-0.5">
                                {mudancas.slice(0, 2).map((m, i) => (
                                    <li key={i} className="flex flex-wrap items-center gap-x-2 text-sm">
                                        <span className="text-tertiary line-through">{m.de}</span>
                                        <span className="text-fg-quaternary" aria-hidden="true">
                                            {"\u2192"}
                                        </span>
                                        <span className="font-medium text-primary">{m.para}</span>
                                    </li>
                                ))}
                                {mudancas.length > 2 && <li className="text-sm text-tertiary">{`e mais ${mudancas.length - 2}`}</li>}
                            </ul>
                        )}

                        <p className="text-sm text-tertiary">
                            <span className="tabular-nums">{horaDoLabel(abertura.dataLabel) || abertura.dataLabel}</span> · {abertura.responsavel}
                        </p>
                    </div>

                    {/* Dinheiro e resultado numa coluna fixa à direita: entre linhas, os valores
                        alinham e o selo dá a cor do desfecho sem virar cauda do título. */}
                    <div className="flex shrink-0 flex-col items-end gap-1">
                        {typeof valor === "number" && valor > 0 && dinheiro && (
                            <>
                                <p className="text-md font-semibold text-primary tabular-nums">{formatarMoeda(valor)}</p>
                                <p className="text-sm text-tertiary">{dinheiro}</p>
                            </>
                        )}
                        {/* "Concluída" é o desfecho que toda alteração deveria ter: o selo gastava
                            cor e espaço para dizer que nada aconteceu de diferente. Os outros
                            ficam, porque aí há algo acontecendo ou algo deu errado. */}
                        {rotulo !== "Concluída" && (
                            <Badge size="md" type="pill-color" color={tom === "erro" ? "error" : tom === "aviso" ? "warning" : "gray"}>
                                {rotulo}
                            </Badge>
                        )}
                    </div>

                </div>

                <details open={tom !== "neutro"} className="group border-t border-secondary">
                    <summary
                        className={cx(
                            "flex cursor-pointer list-none items-center gap-1 px-4 py-3 text-sm text-tertiary transition duration-100 ease-linear hover:text-tertiary_hover max-md:min-h-11 [&::-webkit-details-marker]:hidden",
                            FOCO,
                        )}
                    >
                        Detalhes
                        <ChevronDown className="size-4 text-fg-quaternary transition-transform duration-100 ease-linear group-open:rotate-180" aria-hidden="true" />
                    </summary>

                    <div className="flex flex-col gap-3 px-4 pb-4">
                    {/* Abrir mostra o que o cabeçalho não mostra. O A → B saiu daqui: ele já está
                        acima, e repetido logo abaixo de si mesmo lia como duas alterações.

                        A hora vira coluna, e a coluna vira o separador: a linha do tempo tinha três
                        pontos médios por marco só para emendar hora, fato, descrição e autor. */}
                    <ol className="grid grid-cols-[4.5rem_1fr] gap-x-3 gap-y-1.5">
                        {eventos.map(({ entrada, vezes }) => (
                            <Fragment key={entrada.id}>
                                <dt className="text-sm text-tertiary tabular-nums">{horaDoLabel(entrada.dataLabel) || entrada.dataLabel}</dt>
                                <dd className="min-w-0 text-sm text-secondary">
                                    <span className="font-medium text-primary">{entrada.titulo}</span>
                                    {vezes > 1 && ` ${vezes} vezes`}
                                    {entrada.marco !== "aplicada" && entrada.descricao && <span className="block text-tertiary">{entrada.descricao}</span>}
                                    <span className="block text-tertiary">{entrada.responsavel}</span>
                                </dd>
                            </Fragment>
                        ))}
                    </ol>

                    {/* O porquê num box ao pé: é a leitura que vem depois dos fatos, não entre
                        eles, e o fundo o separa da linha do tempo sem mais uma régua. */}
                    {(abertura.detalhes?.length || abertura.motivo) && (
                        <div className="flex flex-col gap-1 rounded-lg bg-secondary p-3">
                            {abertura.detalhes?.map((detalhe) => (
                                <p key={detalhe} className="text-sm text-secondary">
                                    {detalhe}
                                </p>
                            ))}
                            {abertura.motivo && <p className="text-sm text-tertiary">{descreverMotivo(abertura.motivo)}</p>}
                        </div>
                    )}

                        {viva && (
                            <div>
                                <Button size="sm" color="link-color" onClick={() => onVerAlteracao(viva.id)}>
                                    Ver alteração
                                </Button>
                            </div>
                        )}
                    </div>
                </details>
            </div>
        </li>
    );
};
