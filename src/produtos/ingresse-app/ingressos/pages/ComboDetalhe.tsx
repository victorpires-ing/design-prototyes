import { useLocation, useNavigate } from "react-router";
import { ArrowLeft, Image01, InfoCircle, Send01, Tag01, UserRight01, Wallet02 } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { cx } from "@/utils/cx";
import { AppShell } from "../../components/AppShell";
import { ActionFab, type FabAction } from "../../components/ActionFab";
import { StatusBar } from "../../components/StatusBar";
import { FakeQR } from "../../components/FakeQR";
import { Zigzag } from "../../components/Zigzag";
import { getEvento, type ComboStatus } from "../data/eventos";
import { isTransferido } from "../data/transfer-store";

const STATUS: Record<ComboStatus, { label: string; color: "gray" | "brand" | "blue" }> = {
    finalizado: { label: "Finalizado", color: "gray" },
    hoje: { label: "Evento de hoje", color: "brand" },
    proximo: { label: "Próximo", color: "blue" },
};

export function ComboDetalhe() {
    const navigate = useNavigate();
    const location = useLocation();
    const state = (location.state as { eventId?: string; comboId?: string; transferido?: boolean } | null) ?? {};
    const transferido = !!state.transferido || isTransferido(state.comboId);
    const evento = getEvento(state.eventId);
    const combo = evento.combos?.find((c) => c.id === state.comboId) ?? evento.combos?.find((c) => c.qr === "unico");
    // Ordem: por status (hoje, próximo, finalizado) e, dentro do mesmo status, o de data mais próxima primeiro.
    const RANK: Record<string, number> = { hoje: 0, proximo: 1, finalizado: 2 };
    const inclusos = [...(combo?.inclusos ?? [])].sort((a, b) => {
        const r = (RANK[a.status ?? ""] ?? 1.5) - (RANK[b.status ?? ""] ?? 1.5);
        if (r !== 0) return r;
        return (a.dataISO ?? "").localeCompare(b.dataISO ?? "");
    });

    if (!combo) {
        return (
            <AppShell showTabBar={false}>
                <div className="flex min-h-full items-center justify-center bg-secondary p-8 text-center text-sm text-tertiary">Combo não encontrado.</div>
            </AppShell>
        );
    }

    const acoes: FabAction[] = [
        { icon: Send01, label: "Transferir ingresso", short: "Transferir", onClick: () => navigate("/ingresse-app/ingressos/transferir", { state: { eventId: evento.id, comboId: combo.id } }) },
        { icon: Tag01, label: "Revender ingresso", short: "Revender" },
        { icon: Wallet02, label: "Adicionar à Carteira", short: "Carteira", dark: true },
    ];

    return (
        <AppShell showTabBar={false} bottomBar={transferido ? undefined : <ActionFab actions={acoes} />}>
            <div className={cx("flex min-h-full flex-col", transferido ? "bg-secondary" : "bg-primary")}>
                <StatusBar tone="dark" />

                {/* Top bar */}
                <div className="flex items-center justify-between px-5 pt-2">
                    <button
                        type="button"
                        aria-label="Voltar"
                        onClick={() => navigate("/ingresse-app/ingressos/evento", { state: { eventId: evento.id } })}
                        className="flex size-10 items-center justify-center rounded-lg bg-primary text-fg-secondary ring-1 ring-border-secondary transition duration-100 ease-linear active:bg-secondary"
                    >
                        <ArrowLeft className="size-5" />
                    </button>
                    <button
                        type="button"
                        aria-label="Informações"
                        className="flex size-10 items-center justify-center rounded-lg bg-primary text-fg-secondary ring-1 ring-border-secondary transition duration-100 ease-linear active:bg-secondary"
                    >
                        <InfoCircle className="size-5" />
                    </button>
                </div>
                <h1 className="px-5 pt-4 text-xl font-bold text-primary">Ingresso</h1>

                <div className="flex flex-1 flex-col gap-6 px-5 pt-4 pb-8">
                    {transferido ? (
                        /* Estado: combo transferido — card branco único (mesma aparência da ARENA) */
                        <div className="rounded-3xl bg-primary shadow-sm ring-1 ring-border-secondary">
                            <div className="p-5">
                                <p className="text-xs font-medium tracking-wide text-tertiary uppercase">{evento.title}</p>
                                <div className="my-3 border-t border-tertiary" />
                                <p className="text-2xl leading-tight font-bold text-primary">{combo.nome}</p>
                                <p className="mt-1.5 text-sm text-tertiary">{combo.dataEvento}</p>
                            </div>

                            <div className="relative py-1">
                                <div className="absolute top-1/2 -left-2.5 size-5 -translate-y-1/2 rounded-full bg-secondary" />
                                <div className="absolute top-1/2 -right-2.5 size-5 -translate-y-1/2 rounded-full bg-secondary" />
                                <div className="px-3">
                                    <Zigzag />
                                </div>
                            </div>

                            <div className="p-5">
                                {/* Combo transferido */}
                                <div className="flex items-start gap-3">
                                    <FeaturedIcon icon={UserRight01} color="gray" theme="modern" size="lg" />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-md font-bold text-primary">Combo transferido</p>
                                        <p className="mt-1 text-sm text-tertiary">Este combo foi enviado para outro usuário e não pode ser resgatado.</p>
                                    </div>
                                </div>

                                <div className="mt-4 border-t border-tertiary pt-4">
                                    <p className="text-sm text-tertiary">Transferido para</p>
                                    <p className="mt-0.5 text-md font-bold text-primary">Duny Alves da Silva</p>
                                    <p className="mt-1 text-sm text-tertiary">
                                        CPF: <span className="font-semibold text-secondary">009.789.568-90</span>
                                    </p>

                                    <p className="mt-4 text-sm text-tertiary">Data da transferência</p>
                                    <p className="mt-0.5 text-md font-bold text-primary">10 de junho • 12:20</p>
                                </div>

                                {/* Itens do combo */}
                                <div className="mt-4 border-t border-tertiary pt-4">
                                    <p className="text-xs font-semibold text-tertiary">{combo.inclusosTitulo ?? "Itens do combo"}</p>
                                    <div className="mt-3 flex flex-col gap-3">
                                        {combo.inclusos?.map((inc, i) => (
                                            <div key={i} className={i > 0 ? "border-t border-tertiary pt-3" : ""}>
                                                <p className="text-sm font-bold text-primary">{inc.grupo ? `${inc.grupo} | ${inc.nome}` : inc.nome}</p>
                                                {inc.data && <p className="mt-0.5 text-sm text-tertiary">{inc.data}</p>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Card do combo */}
                            <div className="rounded-3xl bg-secondary p-5 ring-1 ring-border-secondary">
                                <p className="text-lg font-bold text-primary">{combo.nome}</p>
                                <p className="mt-1 text-sm text-tertiary">Data do evento: {combo.dataEvento}</p>

                                {/* QR Code único compartilhado por todos os inclusos */}
                                <div className="mt-5 overflow-hidden rounded-2xl bg-primary ring-1 ring-border-secondary">
                                    <p className="px-5 pt-5 pb-4 text-center text-sm">
                                        <span className="font-semibold text-brand-secondary">Este combo tem um QR Code único.</span>{" "}
                                        <span className="font-normal text-tertiary">
                                            {evento.id === "sao-silvestre"
                                                ? "Apresente este código para acessar todos os itens da sua inscrição."
                                                : "Apresente este código para acessar todos os ingressos do combo."}
                                        </span>
                                    </p>
                                    <div className="border-t border-secondary" />
                                    <div className="flex justify-center px-5 pt-6 pb-6">
                                        <FakeQR px={230} />
                                    </div>

                                    {/* Titular */}
                                    <div className="border-t border-secondary px-5 py-4">
                                        <p className="text-base text-tertiary">
                                            Titular: <span className="font-bold text-primary">Duny Alves da Silva</span>
                                        </p>
                                        <p className="mt-1 text-base text-tertiary">
                                            CPF: <span className="font-bold text-primary">94759305</span>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Inclusos */}
                            <div>
                                <h2 className="pb-3 text-md font-bold text-primary">{combo.inclusosTitulo ?? "Itens do combo"}</h2>
                                <div className="flex flex-col gap-5">
                                    {inclusos.map((inc, i) => {
                                        const finalizado = inc.status === "finalizado";
                                        const hoje = inc.status === "hoje";
                                        return (
                                            <div key={i}>
                                                {inc.data && <p className="pb-2 text-sm font-bold text-primary">{inc.data}</p>}
                                                <div
                                                    className={cx(
                                                        "rounded-2xl bg-secondary p-4",
                                                        hoje ? "ring-2 ring-fg-brand-primary" : "ring-1 ring-border-secondary",
                                                    )}
                                                >
                                                    {inc.status && (
                                                        <div className="mb-3">
                                                            <Badge size="md" color={STATUS[inc.status].color} type="pill-color">
                                                                {STATUS[inc.status].label}
                                                            </Badge>
                                                        </div>
                                                    )}
                                                    <p className="text-sm">
                                                        {inc.grupo && <span className={finalizado ? "text-tertiary" : "text-secondary"}>{inc.grupo} | </span>}
                                                        <span className={cx("font-bold", finalizado ? "text-tertiary" : "text-primary")}>{inc.nome}</span>
                                                    </p>
                                                    {inc.data && (
                                                        <p className={cx("mt-1.5 text-sm text-tertiary", finalizado && "line-through")}>
                                                            {inc.dataLabel ?? "Data do evento"}: {inc.data}
                                                        </p>
                                                    )}
                                                    {inc.acesso && (
                                                        <p className="mt-1.5 text-sm text-tertiary">
                                                            Acesso por <span className="font-semibold text-secondary">{inc.acesso}</span>
                                                        </p>
                                                    )}
                                                    {inc.endereco && <p className="mt-1.5 text-sm text-tertiary">Endereço: {inc.endereco}</p>}

                                                    {/* Imagem do item (ex.: kit) */}
                                                    {(inc.imagem || inc.conteudo) &&
                                                        (inc.imagem ? (
                                                            <img src={inc.imagem} alt={inc.nome} className="mt-3 w-full rounded-xl object-cover" />
                                                        ) : (
                                                            <div className="mt-3 flex aspect-[4/3] w-full items-center justify-center rounded-xl bg-tertiary text-fg-quaternary">
                                                                <Image01 className="size-8" />
                                                            </div>
                                                        ))}

                                                    {/* Conteúdo do item (ex.: o que vem no kit) */}
                                                    {inc.conteudo && (
                                                        <div className="mt-3">
                                                            <p className="text-xs font-semibold text-tertiary">O kit contém</p>
                                                            <ul className="mt-2 flex flex-col gap-1.5">
                                                                {inc.conteudo.map((c) => (
                                                                    <li key={c} className="flex items-center gap-2 text-sm text-secondary">
                                                                        <span className="size-1.5 shrink-0 rounded-full bg-fg-quaternary" />
                                                                        {c}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </AppShell>
    );
}
