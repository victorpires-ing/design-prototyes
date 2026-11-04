import { useEffect, useRef, useState } from "react";
import type { FC, ReactNode } from "react";
import Lottie, { type LottieRefCurrentProps } from "lottie-react";
import { motion } from "motion/react";
import {
    ArrowLeft,
    CheckCircle,
    ChevronRight,
    ClockRewind,
    FaceIdSquare,
    FilterLines,
    InfoCircle,
    MarkerPin01,
    Package,
    QrCode02,
    Send01,
    ShoppingBag03,
    SwitchHorizontal01,
    Tag01,
    User01,
    UsersPlus,
} from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { cx } from "@/utils/cx";
import faceIdSuccess from "../assets/face-id-success.json";
import { getItem, type Combo, type ComboIncluso, type EventoDetalhe, type ItemIngresso } from "../data/eventos";
import { FakeQR } from "./FakeQR";
import { EventoDesktop } from "./evento-desktop";
import { GradientFill } from "./GradientFill";
import { Zigzag } from "./Zigzag";

/** O que abrir a partir da lista do evento: um ingresso/produto ou um combo de QR único. */
export type Alvo = { tipo: "item"; id: string } | { tipo: "combo"; id: string };

/* =============================== Lista do evento =============================== */

/**
 * Ingressos de um evento, como na tela do app (sessão → ingressos / combos).
 * `compact` = dentro do celular; no desktop vai para o layout do Figma (EventoDesktop).
 */
export function EventoIngressos({
    evento,
    compact,
    onBack,
    onAbrir,
}: {
    evento: EventoDetalhe;
    compact: boolean;
    onBack: () => void;
    onAbrir: (alvo: Alvo) => void;
}) {
    // Desktop: layout do Figma (ingressos em acordeão, sem tela de detalhe separada)
    if (!compact) return <EventoDesktop evento={evento} onBack={onBack} />;

    // Ingressos (não-combo) agrupados por data — cada data vira um cabeçalho.
    const grupos = Object.entries(
        (evento.ingressos ?? []).reduce<Record<string, ItemIngresso[]>>((acc, item) => {
            (acc[item.data] ??= []).push(item);
            return acc;
        }, {}),
    );

    const conteudo = evento.combos ? (
        <section>
            <CabecalhoSessao titulo={evento.sessao} total={evento.combos.length} />
            <div className="flex flex-col gap-4">
                {evento.combos.map((combo) =>
                    combo.qr === "unico" ? (
                        <button
                            key={combo.id}
                            type="button"
                            onClick={() => onAbrir({ tipo: "combo", id: combo.id })}
                            className={cx(cardClicavel, "block w-full")}
                        >
                            <ComboLinha combo={combo} />
                        </button>
                    ) : (
                        /* Combo de QR individual: agrupador com itens, cada um com seu QR */
                        <div key={combo.id} className="overflow-hidden rounded-2xl bg-primary ring-1 ring-border-secondary">
                            <div className="flex items-center gap-3 border-b border-secondary bg-secondary/50 px-4 py-3">
                                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-secondary text-fg-brand-primary">
                                    <Package className="size-5" />
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-bold text-primary">{combo.nome}</p>
                                    <p className="text-xs text-tertiary">
                                        {combo.itens?.length ?? 0} {combo.itens?.length === 1 ? "item" : "itens"}
                                    </p>
                                </div>
                                <Badge size="sm" color="brand" type="pill-color">
                                    Combo
                                </Badge>
                            </div>
                            {combo.itens?.map((item, i) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => onAbrir({ tipo: "item", id: item.id })}
                                    className={cx(
                                        "block w-full transition duration-100 ease-linear hover:bg-secondary/60 active:bg-secondary",
                                        i > 0 && "border-t border-secondary",
                                    )}
                                >
                                    <IngressoLinha item={item} finalizado={evento.finalizado} />
                                </button>
                            ))}
                        </div>
                    ),
                )}
            </div>
        </section>
    ) : (
        grupos.map(([data, itens]) => (
            <section key={data}>
                <CabecalhoSessao titulo={data} total={itens.length} />
                <div className="flex flex-col gap-3">
                    {itens.map((item) => (
                        <button key={item.id} type="button" onClick={() => onAbrir({ tipo: "item", id: item.id })} className={cx(cardClicavel, "block w-full")}>
                            <IngressoLinha item={item} finalizado={evento.finalizado} />
                        </button>
                    ))}
                </div>
            </section>
        ))
    );

    return (
            <div className="scrollbar-hide flex-1 overflow-y-auto bg-secondary">
                <div className="flex items-center justify-between px-5 pt-6">
                    <IconeBotao icon={ArrowLeft} label="Voltar" onClick={onBack} />
                    <IconeBotao icon={FilterLines} label="Filtrar" />
                </div>
                <h1 className="px-5 pt-4 text-xl font-bold text-primary">Ingressos</h1>
                <div className="px-5 pt-5">
                    <div className="flex gap-3 rounded-2xl bg-primary p-3 ring-1 ring-border-secondary">
                        <div className="h-[96px] w-[72px] shrink-0 overflow-hidden rounded-xl">
                            <GradientFill gradient={evento.gradient} />
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col gap-1">
                            <p className="text-sm font-bold text-primary">{evento.title}</p>
                            <p className="text-sm font-medium text-secondary">{evento.date}</p>
                            <div className="flex items-end justify-between gap-2">
                                <p className="text-sm text-tertiary">{evento.local}</p>
                                <IconeBotao icon={MarkerPin01} label="Ver no mapa" small />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col gap-6 px-5 pt-6 pb-6">{conteudo}</div>
            </div>
    );
}

/* ================================== Detalhe ================================== */

/** Detalhe do ingresso, produto ou combo de QR único no celular (no desktop o ingresso abre em acordeão, em EventoDesktop). */
export function DetalheEvento({ evento, alvo, onBack }: { evento: EventoDetalhe; alvo: Alvo; onBack: () => void }) {
    if (alvo.tipo === "combo") {
        const combo = evento.combos?.find((c) => c.id === alvo.id);
        if (combo) return <DetalheCombo evento={evento} combo={combo} onBack={onBack} />;
    } else {
        const item = getItem(evento, alvo.id);
        if (item?.produto) return <DetalheProduto item={item} onBack={onBack} />;
        if (item) return <DetalheIngresso evento={evento} item={item} onBack={onBack} />;
    }
    return null;
}

type Acao = { icon: FC<{ className?: string }>; label: string };

function DetalheIngresso({ evento, item, onBack }: { evento: EventoDetalhe; item: ItemIngresso; onBack: () => void }) {
    const facial = item.acesso === "facial";
    // Facial pendente começa não cadastrada; "Cadastrar agora" leva ao estado cadastrado.
    const [cadastrada, setCadastrada] = useState(item.facial !== "pendente");
    const [verQR, setVerQR] = useState(false);

    const acoes: Acao[] = [
        { icon: Send01, label: "Transferir ingresso" },
        { icon: Tag01, label: "Vender ingresso" },
        { icon: UsersPlus, label: "Atribuir dependente" },
        { icon: SwitchHorizontal01, label: "Trocar ingresso" },
    ];

    const topo = (
        <div className="p-5">
            <p className="text-xs font-medium tracking-wide text-tertiary uppercase">{evento.title}</p>
            <p className="mt-1 text-2xl leading-tight font-bold text-primary">{item.title}</p>
            {item.tipo && <p className="mt-1.5 text-sm text-tertiary">{item.tipo}</p>}
            <div className="my-4 border-t border-tertiary" />
            <p className="text-xs font-semibold text-tertiary">Sessão</p>
            <p className="mt-1 text-sm font-bold text-primary">{item.data}</p>
            {item.recebidoDe && (
                <p className="mt-3 text-sm text-tertiary">
                    <span>Recebido de </span><span className="font-semibold text-secondary">{item.recebidoDe}</span>
                </p>
            )}
        </div>
    );

    const acesso = evento.finalizado ? (
        <EventoFinalizado />
    ) : facial && !cadastrada ? (
        <div className="rounded-2xl border border-error_subtle p-6 text-center">
            <div className="flex justify-center text-fg-error-primary">
                <InfoCircle className="size-8" />
            </div>
            <h3 className="mt-3 text-md font-bold text-primary">Cadastre sua facial</h3>
            <p className="mt-1.5 text-sm text-tertiary">O acesso a este ingresso é feito por reconhecimento facial. Sem isso, não será possível acessar o evento.</p>
            <button
                type="button"
                onClick={() => setCadastrada(true)}
                className="mt-5 w-full rounded-lg bg-error-solid px-5 py-3 text-sm font-semibold text-white transition duration-100 ease-linear hover:bg-error-solid_hover"
            >
                Cadastrar agora
            </button>
        </div>
    ) : facial && !verQR ? (
        <div className="flex flex-col items-center py-2 text-center">
            <AnimacaoFacial />
            <p className="mt-5 text-sm text-secondary">Seu acesso será feito por reconhecimento facial.</p>
            <p className="text-sm text-secondary">Você já está cadastrado.</p>
            <Button size="md" color="secondary" className="mt-5" onClick={() => setVerQR(true)}>
                Abrir QR code
            </Button>
        </div>
    ) : item.qrModo === "oculto" ? (
        <QROculto />
    ) : item.qrModo === "dinamico" ? (
        <QRDinamico />
    ) : (
        <div className="flex justify-center">
            <FakeQR px={220} />
        </div>
    );

    return (
        <TelaMobile titulo="Ingresso" onBack={onBack} acoes={evento.finalizado ? [] : acoes}>
            <CartaoIngresso topo={topo}>
                {acesso}
                <Titular nome={item.portador} cpf={item.cpf} />
            </CartaoIngresso>
        </TelaMobile>
    );

}

const DETALHES_RETIRADA = [
    "Apresente seu ingresso na área de retirada de produtos do evento.",
    "Tenha em mãos um documento oficial com foto.",
    "Informe o nome do titular da compra, se solicitado.",
    "A retirada está sujeita aos horários de funcionamento de evento.",
    "Guarde seu comprovante após a retirada dos itens.",
];

function DetalheProduto({ item, onBack }: { item: ItemIngresso; onBack: () => void }) {
    const retirado = item.retirada === "retirado";
    const acoes: Acao[] = [
        { icon: Send01, label: "Transferir produto" },
        { icon: ShoppingBag03, label: "Minhas compras" },
    ];

    const topo = (
        <div className="p-5">
            <div className="flex items-center justify-between gap-3">
                <div className="size-16 shrink-0 overflow-hidden rounded-xl bg-secondary">
                    {item.imagem && <img src={item.imagem} alt="" className="size-full object-cover" />}
                </div>
                <Badge size="sm" color={retirado ? "success" : "warning"} type="pill-color">
                    {retirado ? "Retirado" : "Retirada pendente"}
                </Badge>
            </div>
            <p className="mt-4 text-2xl leading-tight font-bold text-primary">{item.title}</p>
            <p className="mt-1.5 text-sm text-tertiary">Retire em: Stand Loja, 23</p>
            <div className="my-4 border-t border-tertiary" />
            <p className="text-xs font-semibold text-tertiary">Data de retirada</p>
            <p className="mt-1 text-sm font-bold text-primary">{item.data}</p>
        </div>
    );

    const pedido = (
        <div className="text-left">
            <p className="text-sm text-tertiary">
                <span>Data do pedido: </span><span className="font-semibold text-primary">22 de Abril de 2026</span>
            </p>
            <p className="mt-1 text-sm text-tertiary">
                <span>Número do pedido: </span><span className="font-semibold text-primary">82920303</span>
            </p>
        </div>
    );

    const detalhes = (
        <div>
            <h2 className="pb-3 text-md font-bold text-primary">Detalhes de retirada</h2>
            <div className="flex flex-col gap-4 rounded-2xl bg-primary p-5 ring-1 ring-border-secondary">
                {DETALHES_RETIRADA.map((t) => (
                    <p key={t} className="text-sm leading-relaxed text-tertiary">
                        {t}
                    </p>
                ))}
            </div>
        </div>
    );

    return (
        <TelaMobile titulo="Produto" onBack={onBack} acoes={acoes}>
            <CartaoIngresso topo={topo}>
                <div className="flex justify-center">
                    <FakeQR px={220} />
                </div>
                <p className="mt-5 text-center text-sm text-tertiary">Apresente este QR Code no espaço para retirada dos seus produtos</p>
                <div className="-mx-6 my-5 border-t border-tertiary" />
                {pedido}
            </CartaoIngresso>
            {detalhes}
        </TelaMobile>
    );

}

const STATUS_INCLUSO: Record<string, { label: string; color: "brand" | "blue" | "gray" }> = {
    hoje: { label: "Evento de hoje", color: "brand" },
    proximo: { label: "Próximo", color: "blue" },
    finalizado: { label: "Finalizado", color: "gray" },
};

function DetalheCombo({ evento, combo, onBack }: { evento: EventoDetalhe; combo: Combo; onBack: () => void }) {
    const titular = evento.ingressos?.[0]?.portador ?? "Camila Ferreira Rocha";
    const cpf = "832.840.732-12";
    const acoes: Acao[] = [
        { icon: Send01, label: "Transferir combo" },
        { icon: Tag01, label: "Vender combo" },
    ];

    const topo = (
        <div className="p-5">
            <p className="text-xs font-medium tracking-wide text-tertiary uppercase">{evento.title}</p>
            <p className="mt-1 text-2xl leading-tight font-bold text-primary">{combo.nome}</p>
            <p className="mt-1.5 text-sm text-tertiary">Data do evento: {combo.dataEvento}</p>
        </div>
    );

    const inclusos = (
        <div>
            <h2 className="pb-3 text-md font-bold text-primary">{combo.inclusosTitulo ?? "Itens do combo"}</h2>
            <div className="flex flex-col gap-3">
                {combo.inclusos?.map((inc) => (
                    <InclusoLinha key={inc.nome} inc={inc} />
                ))}
            </div>
        </div>
    );

    return (
        <TelaMobile titulo="Combo" onBack={onBack} acoes={acoes}>
            <CartaoIngresso topo={topo}>
                <p className="text-center text-sm">
                    <span className="font-semibold text-brand-secondary">Este combo tem um QR Code único.</span>{" "}
                    <span className="text-tertiary">Apresente este código em todos os itens inclusos.</span>
                </p>
                <div className="mt-5 flex justify-center">
                    <FakeQR px={220} />
                </div>
                <Titular nome={titular} cpf={cpf} />
            </CartaoIngresso>
            {inclusos}
        </TelaMobile>
    );

}

/* ================================ Peças comuns ================================ */

const cardClicavel = "rounded-2xl bg-primary text-left ring-1 ring-border-secondary transition duration-100 ease-linear hover:-translate-y-0.5 hover:shadow-lg active:bg-secondary";

const CabecalhoSessao = ({ titulo, total }: { titulo: string; total: number }) => (
    <div className="flex items-center justify-between pb-3">
        <h2 className="text-sm font-semibold text-primary">{titulo}</h2>
        <span className="flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-sm font-medium text-secondary ring-1 ring-border-secondary">{total}</span>
    </div>
);

/** Linha de ingresso ou produto da lista (mesmo conteúdo do app). */
function IngressoLinha({ item, finalizado }: { item: ItemIngresso; finalizado?: boolean }) {
    if (item.produto) {
        return (
            <div className="flex items-center gap-3 p-4 text-left">
                <div className="h-16 w-12 shrink-0 overflow-hidden rounded-xl bg-secondary">
                    {item.imagem && <img src={item.imagem} alt="" className="size-full object-cover" />}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-bold text-primary">{item.title}</p>
                        <ChevronRight className="mt-0.5 size-5 shrink-0 text-fg-quaternary" />
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                        <Badge size="md" color="pink" type="pill-color">
                            Produto
                        </Badge>
                        <Badge size="md" color={item.retirada === "retirado" ? "success" : "warning"} type="pill-color">
                            {item.retirada === "retirado" ? "Retirado" : "Retirada pendente"}
                        </Badge>
                    </div>
                </div>
            </div>
        );
    }

    const Icon = item.acesso === "facial" ? FaceIdSquare : QrCode02;
    return (
        <div className="flex items-start gap-3 p-4 text-left">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-secondary text-fg-secondary">
                <Icon className="size-6" />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-bold text-primary">{item.title}</p>
                    <ChevronRight className="mt-0.5 size-5 shrink-0 text-fg-quaternary" />
                </div>
                <p className="flex items-center gap-1.5 text-sm text-secondary">
                    <User01 className="size-4 shrink-0 text-fg-quaternary" />
                    <span>{item.portador}</span>
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                    {finalizado ? (
                        <Badge size="md" color="gray" type="pill-color">
                            Finalizado
                        </Badge>
                    ) : item.acesso === "facial" && item.facial !== "cadastrada" ? (
                        <Badge size="md" color="warning" type="pill-color">
                            Facial pendente
                        </Badge>
                    ) : (
                        <Badge size="md" color="success" type="pill-color">
                            Pronto para uso
                        </Badge>
                    )}
                </div>
            </div>
        </div>
    );
}

const ComboLinha = ({ combo }: { combo: Combo }) => (
    <div className="flex items-start gap-3 p-4 text-left">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand-secondary text-fg-brand-primary">
            <Package className="size-6" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-bold text-primary">{combo.nome}</p>
                <ChevronRight className="mt-0.5 size-5 shrink-0 text-fg-quaternary" />
            </div>
            <p className="-mt-1 text-sm text-tertiary">{combo.inclusos?.length ?? 0} itens</p>
            <div className="flex flex-wrap gap-2 pt-1">
                <Badge size="md" color="brand" type="pill-color">
                    Combo
                </Badge>
                <Badge size="md" color="success" type="pill-color">
                    Pronto para uso
                </Badge>
            </div>
        </div>
    </div>
);

const InclusoLinha = ({ inc }: { inc: ComboIncluso }) => {
    const s = inc.status ? STATUS_INCLUSO[inc.status] : null;
    return (
        <div className={cx("rounded-2xl bg-primary p-4", inc.status === "hoje" ? "ring-2 ring-fg-brand-primary" : "ring-1 ring-border-secondary")}>
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    {inc.grupo && <p className="text-xs font-medium text-tertiary">{inc.grupo}</p>}
                    <p className="text-sm font-bold text-primary">{inc.nome}</p>
                </div>
                {s && (
                    <Badge size="sm" color={s.color} type="pill-color">
                        {s.label}
                    </Badge>
                )}
            </div>
            {inc.data && <p className="mt-1.5 text-sm text-secondary">{inc.data}</p>}
            {inc.acesso && <p className="mt-0.5 text-sm text-tertiary">{inc.acesso}</p>}
        </div>
    );
};

const IconeBotao = ({ icon: Icon, label, onClick, small }: { icon: FC<{ className?: string }>; label: string; onClick?: () => void; small?: boolean }) => (
    <button
        type="button"
        aria-label={label}
        onClick={onClick}
        className={cx(
            "flex shrink-0 items-center justify-center rounded-lg bg-primary text-fg-secondary ring-1 ring-border-secondary transition duration-100 ease-linear active:bg-secondary",
            small ? "size-9" : "size-10",
        )}
    >
        <Icon className="size-5" />
    </button>
);

/** Tela do celular: topo com voltar, título, conteúdo e ações em grade no fim. */
function TelaMobile({ titulo, onBack, acoes, children }: { titulo: string; onBack: () => void; acoes: Acao[]; children: ReactNode }) {
    return (
        <div className="scrollbar-hide flex-1 overflow-y-auto bg-secondary">
            <div className="flex items-center justify-between px-5 pt-6">
                <IconeBotao icon={ArrowLeft} label="Voltar" onClick={onBack} />
                <IconeBotao icon={InfoCircle} label="Informações" />
            </div>
            <h1 className="px-5 pt-4 text-xl font-bold text-primary">{titulo}</h1>
            <div className="flex flex-col gap-5 px-5 pt-4 pb-8">
                {children}
                {acoes.length > 0 && (
                    <div className="grid grid-cols-4 gap-2">
                        {acoes.map(({ icon: Icon, label }) => (
                            <button key={label} type="button" className="flex flex-col items-center gap-1.5 text-center transition duration-100 ease-linear active:scale-95">
                                <span className="flex size-12 items-center justify-center rounded-full bg-primary text-fg-secondary ring-1 ring-border-secondary">
                                    <Icon className="size-5" />
                                </span>
                                <span className="text-xs font-medium text-secondary">{label.split(" ")[0]}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

/** Cartão de ingresso do celular: topo, rasgadinho e a parte de acesso. */
const CartaoIngresso = ({ topo, children }: { topo: ReactNode; children: ReactNode }) => (
    <div className="rounded-3xl bg-primary shadow-sm ring-1 ring-border-secondary">
        {topo}
        <div className="relative py-1">
            <div className="absolute top-1/2 -left-2.5 size-5 -translate-y-1/2 rounded-full bg-secondary" />
            <div className="absolute top-1/2 -right-2.5 size-5 -translate-y-1/2 rounded-full bg-secondary" />
            <div className="px-3">
                <Zigzag />
            </div>
        </div>
        <div className="px-6 pt-6 pb-7">{children}</div>
    </div>
);

const Titular = ({ nome, cpf }: { nome: string; cpf?: string }) => (
    <>
        <div className="-mx-6 my-5 border-t border-tertiary" />
        <p className="text-sm text-tertiary">
            <span>Titular: </span><span className="font-semibold text-primary">{nome}</span>
        </p>
        {cpf && (
            <p className="mt-1 text-sm text-tertiary">
                <span>CPF: </span><span className="font-semibold text-primary">{cpf}</span>
            </p>
        )}
    </>
);

const EventoFinalizado = () => (
    <div className="flex flex-col items-center py-4 text-center">
        <FeaturedIcon icon={ClockRewind} color="gray" theme="modern" size="lg" />
        <p className="mt-3 text-md font-bold text-primary">Evento finalizado</p>
        <p className="mt-1 text-sm text-tertiary">Este ingresso não pode mais ser usado.</p>
    </div>
);

/** QR oculto: liberado no dia do evento (QR a 10% + card por cima). */
const QROculto = () => (
    <div className="relative flex items-center justify-center">
        <div className="opacity-10">
            <FakeQR px={220} />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
            <div className="mx-2 w-full max-w-[260px] rounded-2xl border border-secondary bg-primary p-5 text-center shadow-sm">
                <div className="flex justify-center">
                    <FeaturedIcon icon={CheckCircle} color="success" theme="outline" size="md" />
                </div>
                <p className="mt-3 text-md font-bold text-primary">Ingresso confirmado</p>
                <p className="mt-1 text-sm text-tertiary">O QR Code ficará disponível no dia do evento, às 12:00.</p>
            </div>
        </div>
    </div>
);

/* QR dinâmico: atualiza a cada 30 s; pisca nos últimos 5 s e a barra reinicia. */
const QR_TOTAL = 30;
function QRDinamico() {
    const [versao, setVersao] = useState(0);
    const [resta, setResta] = useState(QR_TOTAL);
    useEffect(() => {
        setResta(QR_TOTAL);
        const id = setInterval(() => setResta((r) => Math.max(0, r - 1)), 1000);
        return () => clearInterval(id);
    }, [versao]);
    const piscando = resta <= 5 && resta > 0;
    return (
        <div>
            <div className="flex justify-center">
                <motion.div
                    key={versao}
                    animate={piscando ? { opacity: [1, 0.2, 1] } : { opacity: 1 }}
                    transition={piscando ? { duration: 0.9, repeat: Infinity, ease: "easeInOut" } : { duration: 0.25 }}
                >
                    <FakeQR px={220} seed={versao} />
                </motion.div>
            </div>
            <p className="mt-5 text-center text-sm text-tertiary">
                O QR code será atualizado em {resta} {resta === 1 ? "segundo" : "segundos"}
            </p>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                <motion.div
                    key={versao}
                    className="h-full rounded-full bg-brand-solid"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: QR_TOTAL, ease: "linear" }}
                    onAnimationComplete={() => setVersao((v) => v + 1)}
                />
            </div>
        </div>
    );
}

/** Carinha de reconhecimento facial: toca 2 vezes e congela no último frame. */
function AnimacaoFacial() {
    const ref = useRef<LottieRefCurrentProps>(null);
    const vezes = useRef(1);
    return (
        <Lottie
            lottieRef={ref}
            animationData={faceIdSuccess}
            loop={false}
            autoplay
            onComplete={() => {
                if (vezes.current < 2) {
                    vezes.current += 1;
                    ref.current?.goToAndPlay(0, true);
                }
            }}
            aria-hidden="true"
            className="size-28"
        />
    );
}
