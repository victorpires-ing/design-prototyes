import { ChevronDown, Copy01, LinkExternal01 } from "@untitledui/icons";
import { toast } from "sonner";
import { useDoc, vendeNoLink } from "@/plataforma";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { BackstageLayout, useAbrirModalDeStatus } from "../../components/Backstage";
import { EVENTO_STATUS_BADGE_COLOR, EVENTO_STATUS_DESCRICAO, EVENTO_STATUS_LABEL, useEventoAtual, type Evento } from "../data/eventos";

/** Segundo caminho (navegável) até o status do evento — o atalho rápido continua
 *  na event rail; esta página existe para quem procura por reconhecimento, não recordação. */
export function InformacoesEvento() {
    const evento = useEventoAtual();

    return (
        <BackstageLayout activeSection="informacoes-evento" activeItem="informacoes-gerais">
            <div className="flex min-w-0 flex-1 flex-col gap-6 px-4 py-6 md:px-6">
                <header className="flex flex-wrap items-end justify-between gap-3">
                    <div className="flex flex-col gap-0.5">
                        <h1 className="text-display-xs font-bold text-primary">Informações do evento</h1>
                        <p className="text-sm text-tertiary">Dados gerais e status de {evento.nome}</p>
                    </div>
                </header>

                <section className="flex flex-col gap-4 rounded-xl bg-primary p-5 ring-1 ring-border-secondary sm:flex-row">
                    <img src={evento.cover} alt={evento.nome} className="h-40 w-full shrink-0 rounded-lg object-cover sm:h-auto sm:w-32" />
                    <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
                        <Campo label="Nome" valor={evento.nome} />
                        <Campo label="ID" valor={evento.id} />
                        <Campo label="Produtor" valor={evento.produtor} />
                        <Campo label="Data e horário" valor={evento.dataLabel} />
                        <Campo label="Local" valor={evento.local} />
                    </div>
                </section>

                <StatusSection evento={evento} />
                <LinkDeCompra eventoId={evento.id} />
            </div>
        </BackstageLayout>
    );
}

/** Componente à parte: precisa ser filho de BackstageLayout na árvore de render
 *  (não apenas textualmente aninhado no JSX) para o hook enxergar o Provider dele. */
const StatusSection = ({ evento }: { evento: Evento }) => {
    const abrirModalDeStatus = useAbrirModalDeStatus();
    const encerrado = evento.status === "encerrado";

    return (
        <section className="flex flex-col gap-4 rounded-xl bg-primary p-5 ring-1 ring-border-secondary">
            <div className="flex flex-col gap-0.5">
                <h2 className="text-md font-semibold text-primary">Status do evento</h2>
                <p className="text-sm text-tertiary">Controla se as vendas estão ligadas e define quem acessa o link de compra.</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                <Badge size="md" type="pill-color" color={EVENTO_STATUS_BADGE_COLOR[evento.status]}>
                    {EVENTO_STATUS_LABEL[evento.status]}
                </Badge>
                <p className="text-sm text-tertiary">{EVENTO_STATUS_DESCRICAO[evento.status]}</p>
            </div>

            {encerrado ? (
                <p className="text-sm text-tertiary">Evento encerrado. O status não pode mais ser alterado.</p>
            ) : (
                <Button size="sm" color="secondary" className="w-fit" iconTrailing={ChevronDown} onClick={() => abrirModalDeStatus()}>
                    Alterar status
                </Button>
            )}
        </section>
    );
};

/** Link de compra do evento: vende em publicado (também no site) e privado (só por este link). */
const LinkDeCompra = ({ eventoId }: { eventoId: string }) => {
    const doc = useDoc("eventos", eventoId);
    if (!doc) return null;
    const url = `${window.location.origin}/e/${doc.slug}`;
    const vende = vendeNoLink(doc.status);
    const semIngresso = doc.sessoes.every((s) => s.grupos.every((g) => g.ingressos.length === 0));

    return (
        <section className="flex flex-col gap-4 rounded-xl bg-primary p-5 ring-1 ring-border-secondary">
            <div className="flex flex-col gap-0.5">
                <h2 className="text-md font-semibold text-primary">Link de compra</h2>
                <p className="text-sm text-tertiary">
                    {semIngresso
                        ? "Crie um ingresso para o link vender alguma coisa."
                        : vende
                          ? doc.status === "publicado"
                              ? "Vendendo pelo link e no site da Ingresse."
                              : "Vendendo só por este link. O evento não aparece no site."
                          : "Publique ou deixe o evento privado para o link começar a vender."}
                </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
                <code className="rounded-md bg-secondary px-2.5 py-1.5 text-sm text-secondary ring-1 ring-border-secondary">{url}</code>
                <Button
                    size="sm"
                    color="secondary"
                    iconLeading={Copy01}
                    onClick={() => {
                        void navigator.clipboard?.writeText(url);
                        toast.success("Link copiado.");
                    }}
                >
                    Copiar
                </Button>
                <Button size="sm" color="link-color" iconTrailing={LinkExternal01} href={`/e/${doc.slug}`} target="_blank">
                    Abrir
                </Button>
            </div>
        </section>
    );
};

const Campo = ({ label, valor }: { label: string; valor: string }) => (
    <div className="flex flex-col gap-0.5">
        <span className="text-sm text-tertiary">{label}</span>
        <span className="text-sm font-medium text-primary">{valor}</span>
    </div>
);
