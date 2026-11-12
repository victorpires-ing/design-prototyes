import { useEffect, useState, type FC, type ReactNode } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router";
import { CoinsHand, Edit01, Plus, User01, Users01 } from "@untitledui/icons";
import { Tab, TabList, TabPanel, Tabs } from "@/components/application/tabs/tabs";
import { Badge, BadgeWithIcon } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Toggle } from "@/components/base/toggle/toggle";
import { Surgir } from "@/components/foundations/transicao";
import { useDoc } from "@/plataforma";
import { TITULO_PAGINA } from "@/produtos/backstage/components/titulo-pagina";
import { BackstageLayout } from "../../components/Backstage";
import { CopiarLink, Secao, TD, TH, dataCurta, linkDeVenda, moeda } from "../../comissarios/components/comuns";
import { RegistrarRepasseModal } from "../../comissarios/components/RegistrarRepasseModal";
import { AbaVendas } from "../components/aba-vendas";
import { CartaoCanal } from "../components/cartao-canal";
import { ModalCanal } from "../components/modal-canal";
import { ModalDesativar } from "../components/modal-desativar";
import { ModalEditarOperadores } from "../components/modal-editar-operadores";
import { BadgeInativo, CabecalhoCotas, TemaCotas } from "../components/ui-cotas";
import { GRUPO_MEMBROS_POR_ID } from "../data/membros";
import {
    alterarGrupo,
    BASE,
    canaisLigados,
    CANAIS_GRUPO,
    operadorAtivo,
    operadoresDe,
    plural,
    ROTULO_CANAL,
    totais,
    useEquipeDoEvento,
    type CanalGrupo,
    type DadosDoGrupo,
} from "../data/equipe";

type Aba = "configuracao" | "pessoas" | "vendas" | "repasses";

/** Configuração do grupo (ECO-11 a ECO-22): abas Configuração e Pessoas; com comissário, Vendas e Repasses. */
export function GrupoDaEquipe() {
    const { grupoId = "" } = useParams();
    const navigate = useNavigate();
    const [params, setParams] = useSearchParams();
    const { carregando, evento, grupos } = useEquipeDoEvento();
    const dados = grupos.find((x) => x.grupo.id === grupoId);
    const slug = useDoc("eventos", evento.id)?.slug ?? evento.id;
    const [repasse, setRepasse] = useState(false);
    const location = useLocation();
    const [criado] = useState(() => Boolean((location.state as { criado?: boolean } | null)?.criado));
    useEffect(() => {
        window.scrollTo({ top: 0 });
        if (criado) navigate(location.pathname, { replace: true, state: null });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [grupoId]);

    const voltar = () => navigate(BASE);

    if (carregando)
        return (
            <BackstageLayout activeSection="equipe-e-comissarios" activeItem="equipe-e-comissarios">
                <div role="status" aria-label="Carregando grupo" className="h-64 w-full animate-pulse rounded-2xl bg-secondary motion-reduce:animate-none" />
            </BackstageLayout>
        );

    if (!dados)
        return (
            <BackstageLayout activeSection="equipe-e-comissarios" activeItem="equipe-e-comissarios">
                <TemaCotas className="items-start gap-4 py-16">
                    <h1 className={TITULO_PAGINA}>Grupo não encontrado</h1>
                    <p className="text-md text-tertiary">Ele não é de {evento.nome}. O evento em contexto pode ter mudado.</p>
                    <Button size="md" color="secondary" onClick={voltar}>
                        Ver grupos do evento
                    </Button>
                </TemaCotas>
            </BackstageLayout>
        );

    const { grupo, comissario, vendas, repasses } = dados;
    const abasValidas: Aba[] = comissario ? ["configuracao", "pessoas", "vendas", "repasses"] : ["configuracao", "pessoas"];
    const pedida = params.get("aba") as Aba | null;
    const aba: Aba = pedida && abasValidas.includes(pedida) ? pedida : "configuracao";
    const t = totais(vendas, repasses);
    const ligados = canaisLigados(grupo);
    const link = comissario ? linkDeVenda(slug, comissario.codigo) : "";

    return (
        <BackstageLayout activeSection="equipe-e-comissarios" activeItem="equipe-e-comissarios">
            <TemaCotas className="gap-6">
                <div className="flex flex-col gap-2">
                    <CabecalhoCotas titulo={grupo.nome} alinhamento="esquerda" onVoltar={voltar} rotuloVoltar="Equipe e Comissários" />
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="flex flex-wrap items-center gap-2 text-md text-tertiary">
                            {!grupo.ativo && <BadgeInativo />}
                            {comissario && (
                                <BadgeWithIcon size="md" type="pill-color" color="brand" iconLeading={CoinsHand}>
                                    Comissário {comissario.codigo}
                                </BadgeWithIcon>
                            )}
                            {ligados.length ? ligados.map((c) => ROTULO_CANAL[c]).join(", ") : "Nenhum canal ligado"}, {plural(grupo.operadores.length, "pessoa", "pessoas")}
                        </p>
                        {comissario && (
                            <div className="flex flex-wrap gap-3">
                                {ligados.includes("link") && <CopiarLink link={link} rotulo="Copiar link de venda" size="md" />}
                                <Button color="secondary" size="md" iconLeading={Plus} onClick={() => setRepasse(true)} isDisabled={t.aRepassar <= 0}>
                                    Registrar repasse
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                <Tabs selectedKey={aba} onSelectionChange={(k) => setParams(k === "configuracao" ? {} : { aba: String(k) }, { replace: true })} className="gap-6">
                    <TabList type="underline" size="sm" aria-label="Seções do grupo">
                        <Tab id="configuracao">Configuração</Tab>
                        <Tab id="pessoas" badge={grupo.operadores.length}>
                            Pessoas
                        </Tab>
                        {comissario && (
                            <Tab id="vendas" badge={vendas.length}>
                                Vendas
                            </Tab>
                        )}
                        {comissario && (
                            <Tab id="repasses" badge={repasses.length}>
                                Repasses
                            </Tab>
                        )}
                    </TabList>
                    <TabPanel id="configuracao">
                        <AbaConfiguracao
                            key={grupo.id}
                            dados={dados}
                            codigos={grupos.filter((x) => x.grupo.id !== grupo.id && x.grupo.comissarioId && x.grupo.codigo).map((x) => x.grupo.codigo!)}
                            criado={criado}
                        />
                    </TabPanel>
                    <TabPanel id="pessoas">
                        <AbaPessoas dados={dados} />
                    </TabPanel>
                    {comissario && (
                        <TabPanel id="vendas" className="flex flex-col gap-6">
                            <AbaVendas vendas={vendas} t={t} grupo={grupo} variosVendedores={comissario.pessoas.length > 1} link={link} codigo={comissario.codigo} />
                        </TabPanel>
                    )}
                    {comissario && (
                        <TabPanel id="repasses">
                            <AbaRepasses dados={dados} aRepassar={t.aRepassar} repassado={t.repassado} onRegistrar={() => setRepasse(true)} />
                        </TabPanel>
                    )}
                </Tabs>
            </TemaCotas>

            {comissario && (
                <RegistrarRepasseModal
                    aberto={repasse}
                    onFechar={() => setRepasse(false)}
                    comissarioId={comissario.id}
                    comissarioNome={comissario.nome}
                    saldos={[{ eventoId: evento.id, nome: evento.nome, aRepassar: t.aRepassar }]}
                    eventoInicial={evento.id}
                />
            )}
        </BackstageLayout>
    );
}

/* ------------------------------------------------------------------ */
/*  Aba Configuração                                                   */
/* ------------------------------------------------------------------ */

function AbaConfiguracao({ dados, codigos, criado }: { dados: DadosDoGrupo; codigos: string[]; criado: boolean }) {
    const { grupo, comissario, vendas } = dados;
    const [configurando, setConfigurando] = useState<CanalGrupo | null>(null);
    const semCanal = Object.keys(grupo.canais).length === 0;
    return (
        <div className="flex flex-col gap-6">
            <Surgir visivel={criado}>
                <p role="status" className="rounded-xl bg-secondary px-4 py-3 text-sm text-secondary">
                    Grupo criado. Agora configure os canais que ele vai operar. Para o grupo vender pelo link e ganhar comissão, configure o canal Comissário.
                </p>
            </Surgir>


            <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-0.5">
                    <h2 className="text-lg font-semibold text-primary">Canais</h2>
                    <p className="text-sm text-tertiary">
                        {semCanal ? "Nenhum canal configurado ainda. " : ""}Cada canal tem os próprios itens e a própria cota. A cota é do grupo, não de cada pessoa.
                    </p>
                </div>
                {/* O comissário é um canal como os outros (ECO-12): sem ele, o cartão diz o que faz e "Configurar". */}
                {CANAIS_GRUPO.map((c) => (
                    <CartaoCanal key={c} grupo={grupo} canal={c} comissario={comissario} onConfigurar={() => setConfigurando(c)} />
                ))}
            </div>
            {configurando && (
                <ModalCanal grupo={grupo} canal={configurando} comissario={comissario} codigosDoEvento={codigos} temVendas={vendas.length > 0} onFechar={() => setConfigurando(null)} />
            )}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Aba Pessoas                                                        */
/* ------------------------------------------------------------------ */

function AbaPessoas({ dados }: { dados: DadosDoGrupo }) {
    const { grupo, comissario } = dados;
    const [desligando, setDesligando] = useState<{ tipo: "operador" | "grupo"; id: string } | null>(null);
    const [editando, setEditando] = useState(false);
    const toggleOperador = (email: string) =>
        alterarGrupo(grupo.id, (g) => ({
            ...g,
            operadoresInativos: g.operadoresInativos.includes(email) ? g.operadoresInativos.filter((e) => e !== email) : [...g.operadoresInativos, email],
        }));
    const toggleGrupoMembros = (m: string) =>
        alterarGrupo(grupo.id, (g) => ({ ...g, gruposInativos: g.gruposInativos.includes(m) ? g.gruposInativos.filter((x) => x !== m) : [...g.gruposInativos, m] }));
    const avulsos = grupo.emailsAvulsos;
    // Em grupo-comissário, toda pessoa tem o cargo Comissário; o responsável aparece como tal (ECO-24).
    const responsavel = comissario?.pessoas.find((p) => p.papel === "responsavel")?.email;
    const cargo = (email: string) => (!comissario ? undefined : email === responsavel ? "Comissário, responsável" : "Comissário");

    const linhaAvulsa = (email: string) => {
        const ativo = operadorAtivo(grupo, email);
        return (
            <LinhaPessoa
                key={email}
                email={email}
                rotulo={grupo.nomes?.[email]}
                cargo={cargo(email)}
                emitidos={grupo.emitidosPorOperador[email] ?? 0}
                ativo={ativo}
                onChange={() => (ativo ? setDesligando({ tipo: "operador", id: email }) : toggleOperador(email))}
            />
        );
    };

    return (
        <div className="flex flex-col gap-6">

            <section className="flex flex-col gap-3 rounded-2xl bg-primary px-5 py-4 ring-1 ring-border-secondary ring-inset">
                <div className="flex items-center justify-between gap-4">
                    <h2 className="text-sm font-semibold text-primary">Pessoas</h2>
                    <Button size="sm" color="tertiary" iconLeading={Edit01} onClick={() => setEditando(true)}>
                        Editar pessoas
                    </Button>
                </div>
                <div className="flex flex-col gap-3 pb-1">
                    {grupo.gruposMembrosIds.map((m) => {
                        const membros = GRUPO_MEMBROS_POR_ID[m];
                        if (!membros) return null;
                        const ligado = !grupo.gruposInativos.includes(m);
                        return (
                            <BlocoPessoas
                                key={m}
                                icone={Users01}
                                titulo={`${membros.nome}, ${plural(membros.emails.length, "membro", "membros")}`}
                                toggle={{ ligado, rotulo: `${ligado ? "Desativar" : "Ativar"} o grupo ${membros.nome}`, onChange: () => (ligado ? setDesligando({ tipo: "grupo", id: m }) : toggleGrupoMembros(m)) }}
                            >
                                {membros.emails.map((email) => (
                                    <LinhaPessoa
                                        key={email}
                                        email={email}
                                        cargo={cargo(email)}
                                        emitidos={grupo.emitidosPorOperador[email] ?? 0}
                                        ativo={ligado && operadorAtivo(grupo, email)}
                                        bloqueado={!ligado}
                                        onChange={() => (operadorAtivo(grupo, email) ? setDesligando({ tipo: "operador", id: email }) : toggleOperador(email))}
                                    />
                                ))}
                            </BlocoPessoas>
                        );
                    })}
                    {avulsos.length > 0 && (
                        <BlocoPessoas icone={User01} titulo={`Adicionadas individualmente, ${plural(avulsos.length, "pessoa", "pessoas")}`}>
                            {avulsos.map((email) => linhaAvulsa(email))}
                        </BlocoPessoas>
                    )}
                    {grupo.operadores.length === 0 && <p className="text-sm text-tertiary">Nenhuma pessoa no grupo.</p>}
                </div>
            </section>

            <ModalEditarOperadores
                grupo={editando ? grupo : null}
                onCancelar={() => setEditando(false)}
                onSalvar={(gruposMembrosIds, emailsAvulsos) => {
                    const operadores = operadoresDe(gruposMembrosIds, emailsAvulsos);
                    alterarGrupo(grupo.id, (g) => ({
                        ...g,
                        gruposMembrosIds,
                        emailsAvulsos,
                        operadores,
                        operadoresInativos: g.operadoresInativos.filter((e) => operadores.includes(e)),
                        gruposInativos: g.gruposInativos.filter((m) => gruposMembrosIds.includes(m)),
                    }));
                    setEditando(false);
                }}
            />
            <ModalDesativar
                aberto={!!desligando}
                titulo={desligando?.tipo === "grupo" ? "Desativar grupo de membros?" : "Desativar pessoa?"}
                descricao={
                    desligando?.tipo === "grupo"
                        ? `Ao desativar, os membros de ${GRUPO_MEMBROS_POR_ID[desligando.id]?.nome ?? "o grupo"} deixam de operar os canais deste grupo. Você pode ativar de novo quando quiser.`
                        : `Ao desativar, ${desligando?.id ?? ""} deixa de operar os canais deste grupo. Você pode ativar de novo quando quiser.`
                }
                acao={desligando?.tipo === "grupo" ? "Desativar grupo" : "Desativar pessoa"}
                onCancelar={() => setDesligando(null)}
                onConfirmar={() => {
                    if (desligando?.tipo === "grupo") toggleGrupoMembros(desligando.id);
                    else if (desligando) toggleOperador(desligando.id);
                    setDesligando(null);
                }}
            />
        </div>
    );
}

const BlocoPessoas = ({
    icone: Icone,
    titulo,
    toggle,
    children,
}: {
    icone: FC<{ className?: string }>;
    titulo: string;
    toggle?: { ligado: boolean; rotulo: string; onChange: () => void };
    children: ReactNode;
}) => (
    <section className="flex flex-col gap-3 rounded-lg bg-primary_alt px-4 pt-3 pb-4 ring-1 ring-border-secondary ring-inset">
        <div className="flex min-h-6 items-center gap-2">
            {toggle && <Toggle size="sm" isSelected={toggle.ligado} onChange={toggle.onChange} aria-label={toggle.rotulo} />}
            <Icone className="size-4 shrink-0 text-fg-quaternary" aria-hidden="true" />
            <h3 className="truncate text-sm font-medium text-secondary">{titulo}</h3>
        </div>
        <ul className={toggle ? "flex flex-col gap-4 pl-11" : "flex flex-col gap-4"}>{children}</ul>
    </section>
);

const LinhaPessoa = ({
    email,
    rotulo,
    cargo,
    emitidos,
    ativo,
    bloqueado = false,
    onChange,
}: {
    email: string;
    rotulo?: string;
    /** Cargo da pessoa no grupo-comissário ("Comissário"). */
    cargo?: string;
    emitidos: number;
    ativo: boolean;
    bloqueado?: boolean;
    onChange: () => void;
}) => (
    <li className="flex items-center gap-4">
        <span className="flex min-w-0 flex-1 items-center gap-2">
            <Toggle size="sm" isSelected={ativo} isDisabled={bloqueado} onChange={onChange} aria-label={ativo ? `Desativar ${email}` : `Ativar ${email}`} />
            <span className="flex min-w-0 flex-col">
                {rotulo && <span className="truncate text-sm font-medium text-primary">{rotulo}</span>}
                <span className="truncate text-sm text-secondary">{email}</span>
            </span>
            {cargo && (
                <Badge size="sm" type="pill-color" color="brand" className="shrink-0">
                    {cargo}
                </Badge>
            )}
        </span>
        <span className="shrink-0 text-sm font-medium text-secondary tabular-nums">{plural(emitidos, "emitido", "emitidos")}</span>
    </li>
);

/* ------------------------------------------------------------------ */
/*  Aba Repasses                                                       */
/* ------------------------------------------------------------------ */

function AbaRepasses({ dados, aRepassar, repassado, onRegistrar }: { dados: DadosDoGrupo; aRepassar: number; repassado: number; onRegistrar: () => void }) {
    const lista = [...dados.repasses].sort((a, b) => b.data.localeCompare(a.data));
    return (
        <Secao
            titulo="Repasses"
            descricao={`O pagamento da comissão é feito por fora da Ingresse e registrado aqui. ${moeda(repassado)} já repassados, ${moeda(aRepassar)} a repassar neste evento.`}
            acao={
                <Button color="secondary" size="sm" iconLeading={Plus} onClick={onRegistrar} isDisabled={aRepassar <= 0}>
                    Registrar repasse
                </Button>
            }
        >
            {lista.length === 0 ? (
                <p className="text-sm text-tertiary">Nenhum repasse registrado neste evento.</p>
            ) : (
                <div className="-mx-5 overflow-x-auto md:-mx-6">
                    <table className="w-full">
                        <thead className="bg-secondary">
                            <tr>
                                <th className={TH}>Data</th>
                                <th className={TH}>Observação</th>
                                <th className={`${TH} text-right`}>Valor</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-secondary">
                            {lista.map((r) => (
                                <tr key={r.id}>
                                    <td className={`${TD} whitespace-nowrap tabular-nums`}>{dataCurta(r.data)}</td>
                                    <td className={TD}>{r.observacao || "Sem observação"}</td>
                                    <td className={`${TD} text-right font-medium text-primary tabular-nums`}>{moeda(r.valor)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </Secao>
    );
}
