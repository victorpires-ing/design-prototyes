import { useState } from "react";
import type { FC, ReactNode } from "react";
import { AlertCircle, ArrowLeft, Calendar, ChevronDown, ClockRewind, FaceIdSquare, InfoCircle, Package, QrCode02, Send01, Tag01, User01, UsersPlus } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { cx } from "@/utils/cx";
import type { Combo, ComboIncluso, EventoDetalhe, ItemIngresso } from "../data/eventos";
import { GradientFill } from "./GradientFill";

/**
 * Evento no desktop, como no Figma ([Desktop] Carteira → "Ingresso - fechado/aberto"):
 * "← Ingresso" no topo, coluna de 720px com o evento, a sessão e cada ingresso em acordeão.
 * Aberto, o ingresso mostra o aviso (QR só no celular / facial pendente), informações, detalhes, ações e orientações.
 */
export function EventoDesktop({ evento, onBack }: { evento: EventoDetalhe; onBack: () => void }) {
    // Ingressos (não-combo) agrupados por data — cada data vira uma sessão.
    const grupos = Object.entries(
        (evento.ingressos ?? []).reduce<Record<string, ItemIngresso[]>>((acc, item) => {
            (acc[item.data] ??= []).push(item);
            return acc;
        }, {}),
    );

    return (
        <div className="pb-28">
            <VoltarTitulo titulo="Ingresso" onBack={onBack} />

            <div className="mx-auto flex w-full max-w-[720px] flex-col gap-6 px-4 pt-8 md:px-0">
                {/* Evento */}
                <div className="flex items-center gap-4">
                    <div className="h-24 w-[72px] shrink-0 overflow-hidden rounded-xl">
                        <GradientFill gradient={evento.gradient} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h2 className="text-lg font-bold text-primary uppercase">{evento.title}</h2>
                        <p className="mt-1 text-sm text-secondary">{evento.local}</p>
                    </div>
                </div>

                {evento.combos ? (
                    <Sessao titulo={evento.sessao} total={evento.combos.length}>
                        {evento.combos.map((combo) =>
                            combo.qr === "unico" ? (
                                <ComboAcordeao key={combo.id} combo={combo} evento={evento} />
                            ) : (
                                <div key={combo.id} className="flex flex-col gap-3">
                                    <p className="flex items-center gap-2 text-sm font-bold text-primary">
                                        <Package className="size-4 text-fg-brand-primary" />
                                        <span>{combo.nome}</span>
                                        <Badge size="sm" color="brand" type="pill-color">
                                            Combo
                                        </Badge>
                                    </p>
                                    {combo.itens?.map((item) => <IngressoAcordeao key={item.id} item={item} evento={evento} />)}
                                </div>
                            ),
                        )}
                    </Sessao>
                ) : (
                    grupos.map(([data, itens]) => (
                        <Sessao key={data} titulo={data} total={itens.length}>
                            {itens.map((item) => (
                                <IngressoAcordeao key={item.id} item={item} evento={evento} />
                            ))}
                        </Sessao>
                    ))
                )}
            </div>
        </div>
    );
}

/** Faixa branca embaixo do header (como em "Troca concluída" no Figma): voltar + título, com a seta alinhada ao logo. */
export const VoltarTitulo = ({ titulo, onBack, children }: { titulo?: string; onBack: () => void; children?: ReactNode }) => (
    // Sem linha embaixo: a linha do header principal já separa; o branco da faixa contra o cinza faz a divisão
    <div className="bg-primary">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-14 py-3.5">
            <div className="flex items-center gap-2">
                {/* -ml-2: o ícone (não a área de clique) fica na mesma linha do logo */}
                <button
                    type="button"
                    aria-label="Voltar"
                    onClick={onBack}
                    className="-ml-2 flex size-9 items-center justify-center rounded-lg text-fg-quaternary transition duration-100 ease-linear hover:bg-tertiary hover:text-fg-secondary"
                >
                    <ArrowLeft className="size-5" />
                </button>
                {titulo && <h1 className="text-md font-bold text-primary">{titulo}</h1>}
            </div>
            {children}
        </div>
    </div>
);

const Sessao = ({ titulo, total, children }: { titulo: string; total: number; children: ReactNode }) => (
    <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-2">
            <h3 className="text-md font-medium text-primary">{titulo}</h3>
            <span className="flex size-[34px] items-center justify-center rounded-full text-md font-medium text-primary ring-1 ring-border-primary">{total}</span>
        </div>
        {children}
    </section>
);

/* ============================== Acordeões ============================== */

function Acordeao({
    icone,
    titulo,
    badge,
    linhas,
    children,
}: {
    icone: ReactNode;
    titulo: string;
    badge?: ReactNode;
    linhas: { icon: FC<{ className?: string }>; texto: string }[];
    children: ReactNode;
}) {
    const [aberto, setAberto] = useState(false);
    return (
        <div className="overflow-hidden rounded-2xl bg-primary ring-1 ring-border-secondary">
            <button
                type="button"
                aria-expanded={aberto}
                onClick={() => setAberto((v) => !v)}
                className="flex w-full items-center gap-4 p-6 text-left transition duration-100 ease-linear hover:bg-secondary/40"
            >
                <span className="flex h-[52px] w-12 shrink-0 items-center justify-center rounded-xl bg-secondary text-fg-secondary">{icone}</span>
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                        <p className="text-md font-medium text-primary uppercase">{titulo}</p>
                        {badge}
                    </div>
                    {linhas.map(({ icon: Icon, texto }) => (
                        <p key={texto} className="flex items-center gap-1 text-sm text-secondary">
                            <span className="flex size-5 items-center justify-center">
                                <Icon className="size-4 text-fg-quaternary" />
                            </span>
                            <span>{texto}</span>
                        </p>
                    ))}
                </div>
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full text-fg-quaternary ring-1 ring-border-secondary">
                    <ChevronDown className={cx("size-5 transition duration-150 ease-out", aberto && "rotate-180")} />
                </span>
            </button>
            {aberto && <div className="flex flex-col gap-6 border-t border-secondary bg-secondary p-6">{children}</div>}
        </div>
    );
}

function IngressoAcordeao({ item, evento }: { item: ItemIngresso; evento: EventoDetalhe }) {
    const facial = item.acesso === "facial";
    // Facial pendente: "Cadastrar agora" leva ao estado cadastrado (como no celular)
    const [cadastrada, setCadastrada] = useState(item.facial !== "pendente");
    const facialPendente = facial && !cadastrada;

    const badge = evento.finalizado ? (
        <Badge size="sm" color="gray" type="pill-color">
            Finalizado
        </Badge>
    ) : facialPendente ? (
        <Badge size="sm" color="warning" type="pill-color">
            Facial pendente
        </Badge>
    ) : item.produto ? (
        <Badge size="sm" color={item.retirada === "retirado" ? "success" : "warning"} type="pill-color">
            {item.retirada === "retirado" ? "Retirado" : "Retirada pendente"}
        </Badge>
    ) : (
        <Badge size="sm" color="success" type="pill-color">
            Pronto para uso
        </Badge>
    );

    const icone = item.produto ? (
        item.imagem ? (
            <img src={item.imagem} alt="" className="size-full rounded-xl object-cover" />
        ) : (
            <Package className="size-6" />
        )
    ) : facial ? (
        <FaceIdSquare className="size-6" />
    ) : (
        <QrCode02 className="size-6" />
    );

    return (
        <Acordeao
            icone={icone}
            titulo={item.title}
            badge={badge}
            linhas={[
                { icon: Calendar, texto: item.data },
                ...(item.produto ? [] : [{ icon: User01, texto: item.portador }]),
            ]}
        >
            {evento.finalizado ? (
                <Alerta tom="cinza" titulo="Evento finalizado" texto="Este ingresso não pode mais ser usado." />
            ) : facialPendente ? (
                <Alerta
                    tom="erro"
                    titulo="O acesso deste evento mudou"
                    texto="Este evento passou a utilizar reconhecimento facial. Para acessar o evento, cadastre sua biometria."
                    acao={{ label: "Cadastrar agora", onClick: () => setCadastrada(true) }}
                />
            ) : (
                <Alerta
                    tom="aviso"
                    titulo={item.produto ? "Visualize o QR Code de retirada no celular" : "Visualize o QR Code no celular"}
                    texto="Acesse esta página pelo navegador do celular ou pelo aplicativo."
                />
            )}

            {item.produto ? (
                <Bloco titulo="Detalhes do produto" campos={[["Retire em", "Stand Loja, 23"], ["Número do pedido", "82920303"]]} />
            ) : (
                <>
                    <Bloco titulo="Informações" campos={[["Titular", item.portador], ...(item.cpf ? [["CPF", item.cpf] as [string, string]] : [])]} />
                    <Bloco titulo="Detalhes do ingresso" campos={[["Ingresso", item.tipo ?? "Ingresso"], ...(item.recebidoDe ? [["Recebido de", item.recebidoDe] as [string, string]] : [])]} />
                </>
            )}

            {!evento.finalizado && <Acoes acoes={item.produto ? [{ icon: Send01, label: "Transferir" }] : undefined} />}
            <Orientacoes />
        </Acordeao>
    );
}

const STATUS_INCLUSO: Record<string, { label: string; color: "brand" | "blue" | "gray" }> = {
    hoje: { label: "Evento de hoje", color: "brand" },
    proximo: { label: "Próximo", color: "blue" },
    finalizado: { label: "Finalizado", color: "gray" },
};

function ComboAcordeao({ combo, evento }: { combo: Combo; evento: EventoDetalhe }) {
    return (
        <Acordeao
            icone={<Package className="size-6 text-fg-brand-primary" />}
            titulo={combo.nome}
            badge={
                <>
                    <Badge size="sm" color="brand" type="pill-color">
                        Combo
                    </Badge>
                    <Badge size="sm" color="success" type="pill-color">
                        Pronto para uso
                    </Badge>
                </>
            }
            linhas={[
                { icon: Calendar, texto: combo.dataEvento },
                { icon: User01, texto: evento.ingressos?.[0]?.portador ?? "Camila Ferreira Rocha" },
            ]}
        >
            <Alerta tom="aviso" titulo="Visualize o QR Code no celular" texto="Este combo tem um QR Code único. Acesse esta página pelo navegador do celular ou pelo aplicativo." />
            <Bloco titulo="Informações" campos={[["Titular", "Camila Ferreira Rocha"], ["CPF", "832.840.732-12"]]} />
            <div>
                <p className="pb-2 text-sm font-bold text-primary">{combo.inclusosTitulo ?? "Itens do combo"}</p>
                <div className="flex flex-col gap-3">
                    {combo.inclusos?.map((inc) => (
                        <Incluso key={inc.nome} inc={inc} />
                    ))}
                </div>
            </div>
            <Acoes acoes={ACOES_INGRESSO.slice(0, 2)} />
            <Orientacoes />
        </Acordeao>
    );
}

const Incluso = ({ inc }: { inc: ComboIncluso }) => {
    const s = inc.status ? STATUS_INCLUSO[inc.status] : null;
    return (
        <div className={cx("rounded-2xl bg-primary px-6 py-4", inc.status === "hoje" ? "ring-2 ring-fg-brand-primary" : "ring-1 ring-border-secondary")}>
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    {inc.grupo && <p className="text-xs text-tertiary">{inc.grupo}</p>}
                    <p className="text-md text-primary">{inc.nome}</p>
                </div>
                {s && (
                    <Badge size="sm" color={s.color} type="pill-color">
                        {s.label}
                    </Badge>
                )}
            </div>
            {inc.data && <p className="mt-1 text-sm text-secondary">{inc.data}</p>}
            {inc.acesso && <p className="text-sm text-tertiary">{inc.acesso}</p>}
        </div>
    );
};

/* ============================== Peças ============================== */

/** Alerta do topo do ingresso aberto (padrão do Figma: ícone em anel, título, texto e ação opcional). */
const Alerta = ({ tom, titulo, texto, acao }: { tom: "aviso" | "erro" | "cinza"; titulo: string; texto: string; acao?: { label: string; onClick: () => void } }) => (
    <div
        className={cx(
            "flex items-start gap-4 rounded-xl border p-4",
            tom === "aviso" && "border-utility-yellow-300 bg-utility-yellow-50",
            tom === "erro" && "border-error_subtle bg-primary",
            tom === "cinza" && "border-secondary bg-primary",
        )}
    >
        <FeaturedIcon icon={tom === "cinza" ? ClockRewind : tom === "erro" ? AlertCircle : InfoCircle} color={tom === "aviso" ? "warning" : tom === "erro" ? "error" : "gray"} theme="outline" size="sm" />
        <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-secondary">{titulo}</p>
            <p className="text-sm text-tertiary">{texto}</p>
            {acao && (
                <button type="button" onClick={acao.onClick} className="mt-3 text-sm font-semibold text-error-primary transition duration-100 ease-linear hover:opacity-80">
                    {acao.label}
                </button>
            )}
        </div>
    </div>
);

/** Bloco de dados (Informações / Detalhes): título e os campos lado a lado num cartão branco. */
const Bloco = ({ titulo, campos }: { titulo: string; campos: [string, string][] }) => (
    <div>
        <p className="pb-1.5 text-sm font-bold text-primary">{titulo}</p>
        <div className="flex flex-wrap gap-x-14 gap-y-3 rounded-2xl bg-primary p-6 ring-1 ring-border-secondary">
            {campos.map(([label, valor]) => (
                <div key={label}>
                    <p className="text-sm text-tertiary">{label}</p>
                    <p className="mt-0.5 text-md text-primary">{valor}</p>
                </div>
            ))}
        </div>
    </div>
);

type Acao = { icon: FC<{ className?: string }>; label: string };

const ACOES_INGRESSO: Acao[] = [
    { icon: Send01, label: "Transferir" },
    { icon: Tag01, label: "Vender" },
    { icon: UsersPlus, label: "Dependente" },
];

/** CTAs do ingresso aberto, como no Figma: botões secundários pequenos, mesma largura, centralizados. */
const Acoes = ({ acoes = ACOES_INGRESSO }: { acoes?: Acao[] }) => (
    <div className="flex flex-wrap items-center justify-center gap-5">
        {acoes.map((a) => (
            <Button key={a.label} size="sm" color="secondary" iconLeading={a.icon} className="w-[134px]">
                {a.label}
            </Button>
        ))}
    </div>
);

const Orientacoes = () => (
    <div className="flex flex-col gap-2 px-2 pt-2 text-sm text-secondary">
        <p>Ao chegar ao evento, utilize a entrada indicada no seu ingresso.</p>
        <p>Este ingresso está vinculado ao seu nome. Tenha um documento de identificação em mãos, caso ele seja solicitado na entrada.</p>
        <div className="flex flex-col items-start gap-1">
            <p>Em caso de dúvidas, fale com a nossa equipe.</p>
            <Button size="sm" color="link-color">
                Falar com a Ingresse
            </Button>
        </div>
    </div>
);
