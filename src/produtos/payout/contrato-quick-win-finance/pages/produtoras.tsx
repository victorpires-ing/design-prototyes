import { useMemo, useState } from "react";
import { Building03, Calendar, ChevronDown, ChevronUp, Eye, FilterFunnel01, Plus, User01 } from "@untitledui/icons";
import { cx } from "@/utils/cx";
import { CashoutShell } from "../../components/cashout-shell";
import { Btn, Card, FieldLabel, PageHeader, RowDivider, SearchField, SelectField, StatusDot, Th, TipoPessoaBadge } from "../components/ui";
import { PRODUTORAS, type Produtora } from "../data/cashout";

/** Colunas da tabela, nas proporções do refinamento (320/230/75/337/178). */
const GRID = "grid-cols-[minmax(280px,320px)_minmax(180px,230px)_75px_minmax(240px,337px)_minmax(160px,178px)]";

/** Sub-tabela de contratos exibida quando a linha é expandida. */
const GRID_CONTRATOS = "grid-cols-[minmax(180px,1fr)_minmax(160px,1fr)_minmax(200px,1.4fr)_minmax(120px,1fr)_minmax(160px,1fr)]";

const TIPOS_PESSOA = ["Todas", "PJ", "PF"];

function LinhaContratos({ produtora }: { produtora: Produtora }) {
    return (
        <div className="bg-secondary px-3 py-4">
            <div className={`grid ${GRID_CONTRATOS} items-start pb-3`}>
                <Th>Contrato</Th>
                <Th>Status</Th>
                <Th>Condição comercial</Th>
                <Th>Papel</Th>
                <Th>Vigência</Th>
            </div>

            {produtora.contratos.map((contrato) => (
                <div key={contrato.nome} className={`grid ${GRID_CONTRATOS} items-center border-t border-secondary py-3.5`}>
                    <span className="text-sm font-medium text-primary">{contrato.nome}</span>
                    <StatusDot status={contrato.status} />
                    <span className="text-[13px] text-secondary">{contrato.condicao}</span>
                    <span className="text-[13px] text-quaternary">{contrato.papel}</span>
                    <span className={cx("text-[13px]", contrato.vencido ? "font-medium text-utility-red-700" : "text-quaternary")}>
                        {contrato.vigencia}
                    </span>
                </div>
            ))}
        </div>
    );
}

export function Produtoras() {
    const [tipo, setTipo] = useState("Todas");
    const [busca, setBusca] = useState("");
    const [expandida, setExpandida] = useState<string>();

    const visiveis = useMemo(() => {
        const termo = busca.trim().toLowerCase();

        return PRODUTORAS.filter((produtora) => {
            const casaBusca =
                termo === "" ||
                produtora.nome.toLowerCase().includes(termo) ||
                produtora.documento.includes(termo) ||
                produtora.id.includes(termo);

            return casaBusca && (tipo === "Todas" || produtora.tipo === tipo);
        });
    }, [tipo, busca]);

    return (
        <CashoutShell itemAtivo="produtoras">
            <PageHeader
                title="Produtoras"
                description="Contratos e condições comerciais de cada produtora"
                action={
                    <Btn variant="brand" icon={Plus} className="px-4 py-3 text-sm">
                        Produtora
                    </Btn>
                }
            />

            <Card icon={FilterFunnel01} title="Filtros e Busca">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                    <div className="flex w-full flex-col gap-2.5 sm:w-[250px]">
                        <FieldLabel>Tipo de pessoa</FieldLabel>
                        <SelectField value={tipo} onChange={setTipo} options={TIPOS_PESSOA} />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-2.5">
                        <FieldLabel>Buscar por</FieldLabel>
                        <SearchField placeholder="Nome da produtora, CNPJ, CPF ou ID" value={busca} onChange={setBusca} />
                    </div>
                </div>
            </Card>

            <Card icon={Calendar} title="Produtoras e contratos">
                <div className="w-full overflow-x-auto">
                    <div className="min-w-[1000px]">
                        <div className={`grid ${GRID} items-start pb-3.5`}>
                            <Th>Produtora</Th>
                            <Th>Documento</Th>
                            <Th>Tipo</Th>
                            <Th>Contratos</Th>
                            <Th>Ações</Th>
                        </div>

                        <RowDivider />

                        {visiveis.map((produtora) => {
                            const aberta = expandida === produtora.id;
                            const total = produtora.contratos.length;

                            return (
                                <div key={produtora.id}>
                                    <div className={`grid ${GRID} items-center py-4`}>
                                        <div className="flex min-w-0 items-center gap-3">
                                            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand-secondary text-brand-secondary">
                                                {produtora.tipo === "PJ" ? (
                                                    <Building03 className="size-4" aria-hidden="true" />
                                                ) : (
                                                    <User01 className="size-4" aria-hidden="true" />
                                                )}
                                            </span>
                                            <div className="flex min-w-0 flex-col gap-0.5">
                                                <span className="truncate text-[15px] font-semibold text-primary">{produtora.nome}</span>
                                                <span className="text-[13px] text-placeholder">ID: {produtora.id}</span>
                                            </div>
                                        </div>

                                        <span className="text-sm text-secondary">{produtora.documento}</span>

                                        <TipoPessoaBadge tipo={produtora.tipo} />

                                        <div>
                                            {total === 0 ? (
                                                <span className="text-sm text-quaternary">Nenhum contrato</span>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => setExpandida(aberta ? undefined : produtora.id)}
                                                    aria-expanded={aberta}
                                                    className={cx(
                                                        "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-primary transition duration-100 ease-linear",
                                                        aberta ? "bg-secondary" : "hover:bg-secondary",
                                                    )}
                                                >
                                                    {total} {total === 1 ? "contrato" : "contratos"}
                                                    {aberta ? (
                                                        <ChevronUp className="size-4 text-quaternary" aria-hidden="true" />
                                                    ) : (
                                                        <ChevronDown className="size-4 text-quaternary" aria-hidden="true" />
                                                    )}
                                                </button>
                                            )}
                                        </div>

                                        <div className="flex justify-start">
                                            {total === 0 ? <Btn icon={Plus}>Novo contrato</Btn> : <Btn icon={Eye}>Ver produtora</Btn>}
                                        </div>
                                    </div>

                                    {aberta && <LinhaContratos produtora={produtora} />}

                                    <RowDivider />
                                </div>
                            );
                        })}

                        {visiveis.length === 0 && (
                            <p className="py-10 text-center text-sm text-quaternary">Nenhuma produtora encontrada para os filtros aplicados.</p>
                        )}
                    </div>
                </div>
            </Card>
        </CashoutShell>
    );
}
