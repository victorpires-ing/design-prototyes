import { useLocation, useNavigate } from "react-router";
import { ArrowLeft, Calendar, ChevronRight, FaceIdSquare, FilterLines, Map01, Package, QrCode02, User01 } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { cx } from "@/utils/cx";
import { AppShell } from "../../components/AppShell";
import { GradientFill } from "../../components/GradientFill";
import { StatusBar } from "../../components/StatusBar";
import { getEvento, type ItemIngresso } from "../data/eventos";
import { isTransferido } from "../data/transfer-store";

export function Ingressos() {
    const navigate = useNavigate();
    const location = useLocation();
    const eventId = (location.state as { eventId?: string } | null)?.eventId;
    const evento = getEvento(eventId);

    const total = evento.combos ? evento.combos.length : (evento.ingressos?.length ?? 0);

    const abrirDetalhe = (item: ItemIngresso) =>
        navigate("/ingresse-app/ingressos/detalhe", {
            state: { evento: evento.title, title: item.title, tipo: item.tipo, sessao: evento.sessao, eventId: evento.id, acesso: item.acesso, portador: item.portador, cpf: item.cpf, itemId: item.id },
        });

    return (
        <AppShell activeTab="ingressos">
            <div className="min-h-full bg-secondary">
                <StatusBar tone="dark" />

                {/* Top bar */}
                <div className="flex items-center justify-between px-5 pt-2">
                    <IconButton icon={ArrowLeft} label="Voltar" onClick={() => navigate("/ingresse-app/ingressos")} />
                    <IconButton icon={FilterLines} label="Filtrar" />
                </div>

                <h1 className="px-5 pt-4 text-xl font-bold text-primary">Ingressos</h1>

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
                                <IconButton icon={Map01} label="Ver no mapa" small />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sessão */}
                <div className="flex items-center justify-between px-5 pt-6">
                    <h2 className="text-sm font-semibold text-primary">{evento.sessao}</h2>
                    <span className="flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-sm font-medium text-secondary ring-1 ring-border-secondary">
                        {total}
                    </span>
                </div>

                {/* Conteúdo: combos (QR individual ou único) ou lista de ingressos */}
                <div className="flex flex-col gap-4 px-5 pt-3 pb-6">
                    {evento.combos
                        ? evento.combos.map((combo) =>
                              combo.qr === "unico" ? (
                                  /* Combo de QR único: um item que abre a tela do combo */
                                  <button
                                      key={combo.id}
                                      type="button"
                                      onClick={() => navigate("/ingresse-app/ingressos/combo", { state: { eventId: evento.id, comboId: combo.id } })}
                                      className="flex w-full items-start gap-3 rounded-2xl bg-primary p-4 text-left ring-1 ring-border-secondary transition duration-100 ease-linear active:bg-secondary"
                                  >
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
                                          <p className="-mt-1 text-sm text-tertiary">
                                              {evento.id === "sao-silvestre" ? "1 inscrição" : `${combo.inclusos?.length ?? 0} itens`}
                                          </p>
                                          <p className="flex items-center gap-1.5 text-sm text-secondary">
                                              <Calendar className="size-4 shrink-0 text-fg-quaternary" />
                                              <span>{combo.dataEvento}</span>
                                          </p>
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
                                          <TicketRow key={item.id} item={item} isFirst={i === 0} onClick={() => abrirDetalhe(item)} />
                                      ))}
                                  </div>
                              ),
                          )
                        : (
                              <div className="overflow-hidden rounded-2xl bg-primary ring-1 ring-border-secondary">
                                  {evento.ingressos?.map((item, i) => (
                                      <TicketRow key={item.id} item={item} isFirst={i === 0} onClick={() => abrirDetalhe(item)} />
                                  ))}
                              </div>
                          )}
                </div>
            </div>
        </AppShell>
    );
}

const TicketRow = ({ item, isFirst, onClick }: { item: ItemIngresso; isFirst: boolean; onClick: () => void }) => {
    const Icon = item.acesso === "facial" ? FaceIdSquare : QrCode02;
    const transf = isTransferido(item.id);
    return (
    <button
        type="button"
        onClick={onClick}
        className={cx("flex w-full items-start gap-3 p-4 text-left transition duration-100 ease-linear active:bg-secondary", !isFirst && "border-t border-secondary")}
    >
        <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-secondary text-fg-secondary">
            <Icon className="size-6" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-bold text-primary">{item.title}</p>
                <ChevronRight className="mt-0.5 size-5 shrink-0 text-fg-quaternary" />
            </div>
            {item.tipo && <p className="-mt-1 text-sm text-tertiary">{item.tipo}</p>}
            <p className="flex items-center gap-1.5 text-sm text-secondary">
                <Calendar className="size-4 shrink-0 text-fg-quaternary" />
                <span>{item.data}</span>
            </p>
            <p className="flex items-center gap-1.5 text-sm text-secondary">
                <User01 className="size-4 shrink-0 text-fg-quaternary" />
                <span>{item.portador}</span>
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
                {transf ? (
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
    </button>
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
