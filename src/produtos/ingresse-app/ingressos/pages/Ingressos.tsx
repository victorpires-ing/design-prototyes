import { useLayoutEffect, useRef, useState } from "react";
import type { FC, MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent, ReactNode } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, ChevronRight, FaceIdSquare, FilterLines, Map01, Package, QrCode02, Send01, Tag01, User01, XClose } from "@untitledui/icons";
import { AnimatePresence, motion } from "motion/react";
import { Badge } from "@/components/base/badges/badges";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { cx } from "@/utils/cx";
import { AppShell } from "../../components/AppShell";
import { BottomSheet } from "../../components/BottomSheet";
import { GradientFill } from "../../components/GradientFill";
import { StatusBar } from "../../components/StatusBar";
import { getEvento, type Combo, type EventoDetalhe, type ItemIngresso } from "../data/eventos";
import { getDependenteAtribuido, isTransferido } from "../data/transfer-store";
import googleMapsLogo from "../assets/google-maps.png";
import appleMapsLogo from "../assets/apple-maps.png";
import wazeLogo from "../assets/waze.png";

export function Ingressos() {
    const navigate = useNavigate();
    const { eventId } = useParams();
    const evento = getEvento(eventId);

    const total = evento.combos ? evento.combos.length : (evento.ingressos?.length ?? 0);

    // Ingressos (não-combo) agrupados por data — cada data vira um cabeçalho.
    const gruposPorData = Object.entries(
        (evento.ingressos ?? []).reduce<Record<string, ItemIngresso[]>>((acc, item) => {
            (acc[item.data] ??= []).push(item);
            return acc;
        }, {}),
    );

    // Toque curto abre o detalhe; pressionar e segurar abre o menu de contexto (estilo iOS).
    const [menu, setMenu] = useState<{ rect: DOMRect; content: ReactNode; actions: MenuAction[] } | null>(null);

    // Bottom sheet "Abrir mapa em" (acionado pelo ícone de mapa no card do evento).
    const [mapaOpen, setMapaOpen] = useState(false);
    const localQuery = encodeURIComponent(evento.local);
    const mapas = [
        { nome: "Google Maps", logo: googleMapsLogo, url: `https://www.google.com/maps/search/?api=1&query=${localQuery}` },
        { nome: "Apple Maps", logo: appleMapsLogo, url: `https://maps.apple.com/?q=${localQuery}` },
        { nome: "Waze", logo: wazeLogo, url: `https://waze.com/ul?q=${localQuery}` },
    ];

    const abrirItem = (item: ItemIngresso) => {
        const base = item.produto ? "produto" : "detalhe";
        navigate(`/ingresse-app/ingressos/${base}/${evento.id}/${item.id}`);
    };

    // "Cadastrar facial" só aparece em ingressos de acesso facial.
    const acoes = (transferir: () => void, facial: boolean): MenuAction[] => [
        ...(facial ? [{ icon: FaceIdSquare, label: "Cadastrar facial" }] : []),
        { icon: Send01, label: "Transferir", onClick: transferir },
        { icon: Tag01, label: "Revender" },
    ];

    const abrirMenuIngresso = (item: ItemIngresso, rect: DOMRect) =>
        setMenu({
            rect,
            content: <TicketRowContent item={item} />,
            actions: acoes(() => navigate(`/ingresse-app/ingressos/transferir/${evento.id}/${item.id}`), item.acesso === "facial"),
        });

    const abrirMenuCombo = (combo: Combo, rect: DOMRect) =>
        setMenu({
            rect,
            content: <ComboCardContent combo={combo} evento={evento} />,
            actions: acoes(() => navigate(`/ingresse-app/ingressos/transferir/${evento.id}/${combo.id}`), false),
        });

    return (
        <AppShell activeTab="ingressos" scrollClassName="bg-secondary">
            <div className="min-h-full bg-secondary">
                <StatusBar tone="dark" />

                {/* Top bar */}
                <div className="flex items-center justify-between px-5 pt-2">
                    <IconButton icon={ArrowLeft} label="Voltar" onClick={() => navigate("/ingresse-app/ingressos")} />
                    <IconButton icon={FilterLines} label="Filtrar" />
                </div>

                <h1 className="px-5 pt-4 text-xl font-bold text-primary">{evento.id === "sao-silvestre" ? "Inscrição" : "Ingressos"}</h1>

                {/* Card do evento */}
                <div className="px-5 pt-5">
                    <div className="flex gap-3 rounded-2xl bg-primary p-3 ring-1 ring-border-secondary">
                        <div className="size-24 shrink-0 overflow-hidden rounded-xl">
                            <GradientFill gradient={evento.gradient} />
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col gap-1">
                            <p className="text-sm font-bold text-primary">{evento.title}</p>
                            <p className="text-sm font-medium text-secondary">{evento.date}</p>
                            <div className="flex items-end justify-between gap-2">
                                <p className="text-sm text-tertiary">{evento.local}</p>
                                <IconButton icon={Map01} label="Ver no mapa" small onClick={() => setMapaOpen(true)} />
                            </div>
                        </div>
                    </div>
                </div>

                {evento.combos ? (
                    <>
                        {/* Sessão */}
                        <div className="flex items-center justify-between px-5 pt-6">
                            <h2 className="text-sm font-semibold text-primary">{evento.sessao}</h2>
                            <span className="flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-sm font-medium text-secondary ring-1 ring-border-secondary">
                                {total}
                            </span>
                        </div>

                        <div className="flex flex-col gap-4 px-5 pt-3 pb-6">
                            {evento.combos.map((combo) =>
                                combo.qr === "unico" ? (
                                    /* Combo de QR único: um item que abre a tela do combo */
                                    <ComboCard
                                        key={combo.id}
                                        combo={combo}
                                        evento={evento}
                                        onTap={() => navigate(`/ingresse-app/ingressos/combo/${evento.id}/${combo.id}`)}
                                        onLongPress={(rect) => abrirMenuCombo(combo, rect)}
                                    />
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
                                            <TicketRow key={item.id} item={item} isFirst={i === 0} onTap={() => abrirItem(item)} onLongPress={(rect) => abrirMenuIngresso(item, rect)} />
                                        ))}
                                    </div>
                                ),
                            )}
                        </div>
                    </>
                ) : (
                    /* Ingressos agrupados por data (cada data vira um cabeçalho) */
                    <div className="flex flex-col gap-6 px-5 pt-6 pb-6">
                        {gruposPorData.map(([data, itens]) => (
                            <section key={data}>
                                <div className="flex items-center justify-between pb-3">
                                    <h2 className="text-sm font-semibold text-primary">{data}</h2>
                                    <span className="flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-sm font-medium text-secondary ring-1 ring-border-secondary">
                                        {itens.length}
                                    </span>
                                </div>
                                <div className="flex flex-col gap-3">
                                    {itens.map((item) => (
                                        <div key={item.id} className="overflow-hidden rounded-2xl bg-primary ring-1 ring-border-secondary">
                                            <TicketRow item={item} isFirst onTap={() => abrirItem(item)} onLongPress={(rect) => abrirMenuIngresso(item, rect)} />
                                        </div>
                                    ))}
                                </div>
                            </section>
                        ))}
                    </div>
                )}
            </div>

            <AnimatePresence>
                {menu && <TicketContextMenu rect={menu.rect} content={menu.content} actions={menu.actions} onClose={() => setMenu(null)} />}
            </AnimatePresence>

            {/* Bottom sheet: escolher app de mapa (mesmo padrão da confirmação de transferência) */}
            <BottomSheet isOpen={mapaOpen} onClose={() => setMapaOpen(false)}>
                <div className="flex items-start justify-between gap-3">
                    <FeaturedIcon icon={Map01} color="gray" theme="modern" size="lg" />
                    <button
                        type="button"
                        aria-label="Fechar"
                        onClick={() => setMapaOpen(false)}
                        className="text-fg-quaternary transition duration-100 ease-linear active:text-fg-secondary"
                    >
                        <XClose className="size-6" />
                    </button>
                </div>

                <h2 className="mt-4 text-lg font-bold text-primary">Abrir mapa em</h2>
                <p className="mt-1 text-sm text-tertiary">Escolha o aplicativo para ver a localização do evento.</p>

                <div className="mt-4 flex flex-col divide-y divide-border-secondary">
                    {mapas.map((m) => (
                        <button
                            key={m.nome}
                            type="button"
                            onClick={() => {
                                setMapaOpen(false);
                                window.open(m.url, "_blank");
                            }}
                            className="flex items-center gap-3 px-2 py-3 text-left transition duration-100 ease-linear active:bg-secondary"
                        >
                            <span className="size-10 shrink-0 overflow-hidden rounded-xl ring-1 ring-border-secondary">
                                <img src={m.logo} alt="" className="size-full object-cover" />
                            </span>
                            <span className="text-md font-semibold text-primary">{m.nome}</span>
                            <ChevronRight className="ml-auto size-5 text-fg-quaternary" />
                        </button>
                    ))}
                </div>
            </BottomSheet>
        </AppShell>
    );
}

interface MenuAction {
    icon: FC<{ className?: string }>;
    label: string;
    onClick?: () => void;
}

const MENU_W = 232;
const GAP = 10;

/**
 * Menu de contexto estilo iOS/WhatsApp: ao segurar, o fundo borra/escurece, o
 * card pressionado "levita" na própria posição e o menu de ações aparece ancorado a ele.
 */
const TicketContextMenu = ({ rect, content, actions, onClose }: { rect: DOMRect; content: ReactNode; actions: MenuAction[]; onClose: () => void }) => {
    const overlayRef = useRef<HTMLDivElement>(null);
    const [box, setBox] = useState<{ top: number; left: number; width: number; height: number; menuTop: number; menuLeft: number; below: boolean } | null>(null);

    // Converte a posição do card (viewport) para coordenadas relativas ao frame.
    useLayoutEffect(() => {
        const o = overlayRef.current?.getBoundingClientRect();
        if (!o) return;
        const top = rect.top - o.top;
        const left = rect.left - o.left;
        const menuH = actions.length * 52 + 12;
        const below = top + rect.height + GAP + menuH <= o.height - 12;
        const menuTop = below ? top + rect.height + GAP : Math.max(12, top - GAP - menuH);
        const menuLeft = Math.max(12, Math.min(left, o.width - 12 - MENU_W));
        setBox({ top, left, width: rect.width, height: rect.height, menuTop, menuLeft, below });
    }, [rect, actions.length]);

    return (
        <motion.div ref={overlayRef} className="absolute inset-0 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
            {/* Fundo borrado + escuro */}
            <button type="button" aria-label="Fechar" onClick={onClose} className="absolute inset-0 bg-black/40 backdrop-blur-md" />

            {box && (
                <>
                    {/* Card levitado (na posição original) */}
                    <motion.div
                        className="pointer-events-none absolute"
                        style={{ top: box.top, left: box.left, width: box.width, transformOrigin: "center" }}
                        initial={{ scale: 0.96 }}
                        animate={{ scale: 1.02 }}
                        exit={{ scale: 0.96 }}
                        transition={{ type: "spring", damping: 22, stiffness: 340 }}
                    >
                        <div className="overflow-hidden rounded-2xl bg-primary shadow-2xl ring-1 ring-border-secondary">{content}</div>
                    </motion.div>

                    {/* Menu de ações ancorado ao card */}
                    <motion.div
                        className="absolute"
                        style={{ top: box.menuTop, left: box.menuLeft, width: MENU_W, transformOrigin: box.below ? "top left" : "bottom left" }}
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ type: "spring", damping: 24, stiffness: 360 }}
                    >
                        <div className="overflow-hidden rounded-2xl bg-primary shadow-2xl ring-1 ring-border-secondary">
                            {actions.map((a, i) => {
                                const Icon = a.icon;
                                return (
                                    <button
                                        key={a.label}
                                        type="button"
                                        onClick={() => {
                                            onClose();
                                            a.onClick?.();
                                        }}
                                        className={cx(
                                            "flex w-full items-center gap-3 px-4 py-3.5 text-left transition duration-100 ease-linear active:bg-secondary",
                                            i > 0 && "border-t border-secondary",
                                        )}
                                    >
                                        <Icon className="size-5 shrink-0 text-fg-quaternary" />
                                        <span className="text-md font-medium text-primary">{a.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                </>
            )}
        </motion.div>
    );
};

const LONG_PRESS_MS = 450;

/** Toque curto (onTap) vs. pressionar e segurar (onLongPress, com o rect do elemento). */
function useLongPress(onLongPress: (rect: DOMRect) => void, onTap: () => void) {
    const timer = useRef<number | null>(null);
    const el = useRef<HTMLElement | null>(null);
    const fired = useRef(false);
    const [pressing, setPressing] = useState(false);

    const cancel = () => {
        setPressing(false);
        if (timer.current != null) {
            clearTimeout(timer.current);
            timer.current = null;
        }
    };

    return {
        pressing,
        handlers: {
            onPointerDown: (e: ReactPointerEvent<HTMLElement>) => {
                el.current = e.currentTarget;
                fired.current = false;
                setPressing(true);
                timer.current = window.setTimeout(() => {
                    fired.current = true;
                    timer.current = null;
                    setPressing(false);
                    if (el.current) onLongPress(el.current.getBoundingClientRect());
                }, LONG_PRESS_MS);
            },
            onPointerUp: cancel,
            onPointerLeave: cancel,
            onPointerCancel: cancel,
            onContextMenu: (e: ReactMouseEvent) => e.preventDefault(),
            onClick: () => {
                // Se o long-press já disparou, ignora o clique de soltar o dedo.
                if (fired.current) {
                    fired.current = false;
                    return;
                }
                onTap();
            },
        },
    };
}

const TicketRow = ({ item, isFirst, onTap, onLongPress }: { item: ItemIngresso; isFirst: boolean; onTap: () => void; onLongPress: (rect: DOMRect) => void }) => {
    const { pressing, handlers } = useLongPress(onLongPress, onTap);
    return (
        <button
            type="button"
            {...handlers}
            className={cx(
                "block w-full select-none transition duration-100 ease-linear active:bg-secondary",
                pressing && "scale-[0.98] bg-secondary",
                !isFirst && "border-t border-secondary",
            )}
        >
            <TicketRowContent item={item} />
        </button>
    );
};

/** Card de combo (QR único) com o mesmo atalho de pressionar e segurar. */
const ComboCard = ({ combo, evento, onTap, onLongPress }: { combo: Combo; evento: EventoDetalhe; onTap: () => void; onLongPress: (rect: DOMRect) => void }) => {
    const { pressing, handlers } = useLongPress(onLongPress, onTap);
    return (
        <button
            type="button"
            {...handlers}
            className={cx(
                "block w-full select-none rounded-2xl bg-primary text-left ring-1 ring-border-secondary transition duration-100 ease-linear active:bg-secondary",
                pressing && "scale-[0.98] bg-secondary",
            )}
        >
            <ComboCardContent combo={combo} evento={evento} />
        </button>
    );
};

/** Conteúdo visual do card de combo (reaproveitado no card levitado do menu). */
const ComboCardContent = ({ combo, evento }: { combo: Combo; evento: EventoDetalhe }) => (
    <div className="flex items-start gap-3 p-4 text-left">
        {evento.id !== "sao-silvestre" && (
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand-secondary text-fg-brand-primary">
                <Package className="size-6" />
            </span>
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-bold text-primary">{combo.nome}</p>
                <ChevronRight className="mt-0.5 size-5 shrink-0 text-fg-quaternary" />
            </div>
            <p className="-mt-1 text-sm text-tertiary">{evento.id === "sao-silvestre" ? "1 inscrição" : `${combo.inclusos?.length ?? 0} itens`}</p>
            <div className="flex flex-wrap gap-2 pt-1">
                {evento.id !== "sao-silvestre" && (
                    <Badge size="md" color="brand" type="pill-color">
                        Combo
                    </Badge>
                )}
                {isTransferido(combo.id) ? (
                    <Badge size="md" color="blue" type="pill-color">
                        Transferido
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

/** Conteúdo visual de uma linha de ingresso (reaproveitado no card levitado do menu). */
const TicketRowContent = ({ item }: { item: ItemIngresso }) => {
    const Icon = item.acesso === "facial" ? FaceIdSquare : QrCode02;
    const transf = isTransferido(item.id);
    const dep = getDependenteAtribuido(item.id);

    // Item de produto/merchandising (ex.: camiseta) — visual diferente do ingresso.
    if (item.produto) {
        return (
            <div className="flex items-center gap-3 p-4 text-left">
                <div className="h-16 w-12 shrink-0 overflow-hidden rounded-xl bg-secondary">
                    {item.imagem ? (
                        item.imagem.startsWith("linear-gradient") ? (
                            <GradientFill gradient={item.imagem} />
                        ) : (
                            <img src={item.imagem} alt="" className="size-full object-cover" />
                        )
                    ) : null}
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
                        {item.retirada === "retirado" ? (
                            <Badge size="md" color="success" type="pill-color">
                                Retirado
                            </Badge>
                        ) : (
                            <Badge size="md" color="warning" type="pill-color">
                                Retirada pendente
                            </Badge>
                        )}
                    </div>
                </div>
            </div>
        );
    }

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
                    <span>{dep ? dep.nome : item.portador}</span>
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                    {transf ? (
                        <Badge size="md" color="blue" type="pill-color">
                            Transferido
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
                    {dep && (
                        <Badge size="md" color="gray" type="pill-color">
                            Dependente
                        </Badge>
                    )}
                </div>
            </div>
        </div>
    );
};

const IconButton = ({ icon: Icon, label, onClick, small }: { icon: typeof ArrowLeft; label: string; onClick?: () => void; small?: boolean }) => (
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
