import { useMemo, useState } from "react";
import { Building03, Calendar, Eye, FilterFunnel01, Link03, LinkExternal01 } from "@untitledui/icons";
import { toast } from "sonner";
import { CashoutShell } from "../../components/cashout-shell";
import { AssociarContratoDrawer } from "../components/associar-contrato-drawer";
import { EventThumb } from "../components/event-thumb";
import { Btn, Card, FieldLabel, PageHeader, RowDivider, SearchField, SelectField, SituacaoBadge, Th } from "../components/ui";
import { EVENTOS, type Contrato, type Evento } from "../data/cashout";

/** Colunas da tabela, nas proporções do refinamento. */
const GRID = "grid-cols-[minmax(300px,330px)_110px_minmax(180px,250px)_minmax(260px,300px)_minmax(130px,1fr)]";

const FILTROS_EVENTO = ["Todos", "Com contrato", "Sem contrato", "Contrato inativo"];

export function Eventos() {
    const [eventos, setEventos] = useState<Evento[]>(EVENTOS);
    const [filtro, setFiltro] = useState("Todos");
    const [busca, setBusca] = useState("");
    const [associando, setAssociando] = useState<Evento>();

    const visiveis = useMemo(() => {
        const termo = busca.trim().toLowerCase();

        return eventos.filter((evento) => {
            const casaBusca =
                termo === "" ||
                evento.nome.toLowerCase().includes(termo) ||
                evento.id.includes(termo) ||
                evento.produtora.toLowerCase().includes(termo);

            const casaFiltro =
                filtro === "Todos" ||
                (filtro === "Sem contrato" && evento.situacao === "sem-contrato") ||
                (filtro === "Contrato inativo" && evento.situacao === "inativo") ||
                (filtro === "Com contrato" && evento.situacao !== "sem-contrato" && evento.situacao !== "inativo");

            return casaBusca && casaFiltro;
        });
    }, [eventos, filtro, busca]);

    /** Aplica o contrato escolhido no drawer ao evento em questão. */
    const confirmarAssociacao = (evento: Evento, contrato: Contrato) => {
        setEventos((atuais) =>
            atuais.map((item) =>
                item.id === evento.id
                    ? {
                          ...item,
                          situacao: "ativo",
                          contrato: `contrato ${contrato.id}`,
                          detalhe: `Crédito ${contrato.resumo.credito} · PIX ${contrato.resumo.pix} · Organizador`,
                          acao: "visualizar",
                      }
                    : item,
            ),
        );
        setAssociando(undefined);
        toast.success("Contrato associado ao evento", {
            description: `${contrato.nome} passou a valer para ${evento.nome}. A sincronização com o checkout leva alguns minutos.`,
        });
    };

    return (
        <CashoutShell itemAtivo="eventos">
            <PageHeader title="Eventos" description="Gerencie os eventos e suas associações com contratos" />

            <Card icon={FilterFunnel01} title="Filtros e Busca">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                    <div className="flex w-full flex-col gap-2.5 sm:w-[250px]">
                        <FieldLabel>Eventos</FieldLabel>
                        <SelectField value={filtro} onChange={setFiltro} options={FILTROS_EVENTO} />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-2.5">
                        <FieldLabel>Buscar por</FieldLabel>
                        <SearchField placeholder="Nome, ID do evento, produtora ou CNPJ" value={busca} onChange={setBusca} />
                    </div>
                </div>
            </Card>

            <Card icon={Calendar} title="Eventos">
                <div className="w-full overflow-x-auto">
                    <div className="min-w-[1000px]">
                        <div className={`grid ${GRID} items-start pb-3.5`}>
                            <Th className="pr-3">Evento</Th>
                            <Th className="px-2">Data</Th>
                            <Th className="px-3">Produtora</Th>
                            <Th className="px-3">Contrato associado</Th>
                            <Th className="pl-2">Ações</Th>
                        </div>

                        <RowDivider />

                        {visiveis.map((evento) => (
                            <div key={evento.id}>
                                <div className={`grid ${GRID} items-center py-5`}>
                                    <div className="flex min-w-0 items-center gap-3.5 pr-3">
                                        <EventThumb capa={evento.capa} nome={evento.nome} />
                                        <div className="flex min-w-0 flex-col gap-0.5">
                                            <span className="truncate text-[15px] font-semibold text-primary">{evento.nome}</span>
                                            <span className="text-[13px] text-placeholder">ID: {evento.id}</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-0.5 px-2">
                                        <span className="text-[15px] font-semibold text-primary">{evento.data}</span>
                                        <span className="text-[13px] text-placeholder">{evento.hora}</span>
                                    </div>

                                    <div className="flex min-w-0 items-center gap-2 px-3">
                                        <Building03 className="size-4 shrink-0 text-quaternary" aria-hidden="true" />
                                        <span className="truncate text-sm font-medium text-secondary">{evento.produtora}</span>
                                    </div>

                                    <div className="flex min-w-0 flex-col gap-1.5 px-3">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <SituacaoBadge situacao={evento.situacao} />
                                            {evento.contrato && <span className="text-xs font-medium text-quaternary">{evento.contrato}</span>}
                                        </div>
                                        <span className="text-[13px] text-quaternary">{evento.detalhe}</span>
                                    </div>

                                    <div className="flex items-center justify-end pl-2">
                                        {evento.acao === "associar" && (
                                            <Btn variant="brand" icon={Link03} onClick={() => setAssociando(evento)}>
                                                Associar
                                            </Btn>
                                        )}
                                        {evento.acao === "regularizar" && <Btn icon={LinkExternal01}>Regularizar</Btn>}
                                        {evento.acao === "visualizar" && <Btn icon={Eye}>Visualizar</Btn>}
                                    </div>
                                </div>

                                <RowDivider />
                            </div>
                        ))}

                        {visiveis.length === 0 && (
                            <p className="py-10 text-center text-sm text-quaternary">Nenhum evento encontrado para os filtros aplicados.</p>
                        )}
                    </div>
                </div>
            </Card>

            {associando && (
                <AssociarContratoDrawer
                    evento={associando}
                    onFechar={() => setAssociando(undefined)}
                    onConfirmar={(contrato) => confirmarAssociacao(associando, contrato)}
                />
            )}
        </CashoutShell>
    );
}
