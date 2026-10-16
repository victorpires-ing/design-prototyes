import { useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router";
import { ArrowLeft } from "@untitledui/icons";
import { toast } from "sonner";
import { Button } from "@/components/base/buttons/button";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Input } from "@/components/base/input/input";
import { TextArea } from "@/components/base/textarea/textarea";
import { cx } from "@/utils/cx";
import { BackstageLayout } from "../../components/Backstage";
import { addCargo, cargoById, isCargoSistema, updateCargo, useMembros } from "../../components/membros-store";
import { ResumoCargoModal } from "../components/resumo-cargo-modal";
import {
    CATALOGO_PERMISSOES,
    acoesDaSecao,
    chavePermissao,
    chavesDoRecurso,
    completarSelecao,
    semDependentesOrfaos,
    type AcaoBase,
    type RecursoPermissao,
    type SecaoPermissao,
} from "../data/permissoes-catalogo";

const COL_ACAO_REM = 8.5;
const gridStyle = (colunas: number) => ({
    gridTemplateColumns: `minmax(0,1fr) repeat(${colunas}, ${COL_ACAO_REM}rem)`,
});

// O Checkbox do DS não tem hover; aplicado aqui no quadrado (primeiro div do label).
const CHECKBOX_HOVER = cx(
    "[&>div:first-of-type]:transition [&>div:first-of-type]:duration-100 [&>div:first-of-type]:ease-linear",
    "[&[data-hovered]:not([data-selected]):not([data-indeterminate]):not([data-disabled])>div:first-of-type]:bg-secondary_hover",
    "[&[data-hovered]:not([data-selected]):not([data-indeterminate]):not([data-disabled])>div:first-of-type]:ring-brand",
    "[&[data-hovered]:is([data-selected],[data-indeterminate])>div:first-of-type]:bg-brand-solid_hover",
    "[&[data-hovered]:is([data-selected],[data-indeterminate])>div:first-of-type]:ring-brand-solid_hover",
);

export function CriarCargo() {
    const navigate = useNavigate();
    const { id } = useParams();
    const cargo = id ? cargoById(id) : undefined;
    const editando = Boolean(cargo);
    const [nome, setNome] = useState(cargo?.nome ?? "");
    const [descricao, setDescricao] = useState(cargo?.descricao ?? "");
    const [selecionadas, setSelecionadas] = useState<Set<string>>(() => new Set(cargo?.acoes ?? []));
    const [revisando, setRevisando] = useState(false);
    const membros = useMembros();

    const setChaves = (chaves: string[], marcar: boolean) => {
        setSelecionadas((prev) => {
            const next = new Set(prev);
            chaves.forEach((k) => (marcar ? next.add(k) : next.delete(k)));
            return marcar ? completarSelecao(next) : semDependentesOrfaos(next);
        });
    };

    if (id && (!cargo || isCargoSistema(id))) {
        return <Navigate to="/backstage/membros" replace />;
    }

    const revisar = () => {
        if (!nome.trim() || !descricao.trim()) {
            toast.error(!nome.trim() ? "Informe o nome do cargo" : "Informe a descrição do cargo");
            return;
        }
        setRevisando(true);
    };

    const salvar = () => {
        if (cargo) {
            updateCargo(cargo.id, {
                nome: nome.trim(),
                descricao: descricao.trim(),
                acoes: [...selecionadas],
            });
            toast.success(`Cargo "${nome.trim()}" atualizado`);
            navigate("/backstage/membros");
            return;
        }
        addCargo({
            id: `cargo-${Date.now()}`,
            nome: nome.trim(),
            descricao: descricao.trim(),
            acoes: [...selecionadas],
        });
        toast.success(`Cargo "${nome.trim()}" criado`);
        navigate("/backstage/membros");
    };

    return (
        <BackstageLayout showEventContext={false} activeProducer="equipe" showLayoutSwitcher={false}>
            <div className="flex min-w-0 flex-1 flex-col">
                <main className="flex flex-1 flex-col gap-6 px-6 pt-6 pb-10">
                    <header className="flex items-center gap-3">
                        <Button size="sm" color="tertiary" iconLeading={ArrowLeft} aria-label="Voltar" onClick={() => navigate("/backstage/membros")} />
                        <h1 className="text-display-xs font-semibold text-primary">{editando ? "Editar cargo" : "Criar cargo"}</h1>
                    </header>

                    <div className="flex w-full max-w-lg flex-col gap-5">
                        <Input label="Nome do cargo" placeholder="Ex: Gerente de eventos" value={nome} onChange={setNome} isRequired />
                        <TextArea
                            label="Descrição"
                            placeholder="Ex: Cria e edita eventos, ingressos e cupons, sem acesso ao financeiro"
                            hint="Ajuda quem for convidar membros a escolher o cargo certo."
                            rows={3}
                            value={descricao}
                            isRequired
                            onChange={setDescricao}
                        />
                    </div>

                    <div className="flex flex-col gap-6">
                        {CATALOGO_PERMISSOES.map((secao) => (
                            <SecaoTabela key={secao.id} secao={secao} selecionadas={selecionadas} onSet={setChaves} />
                        ))}
                    </div>
                </main>

                <footer className="sticky bottom-0 z-10 flex items-center bg-primary_alt justify-between gap-3 border-t border-secondary px-6 py-4">
                    <span className="text-sm text-tertiary">
                        {selecionadas.size} {selecionadas.size === 1 ? "permissão selecionada" : "permissões selecionadas"}
                    </span>
                    <div className="flex items-center gap-3">
                        <Button size="md" color="secondary" onClick={() => navigate("/backstage/membros")}>
                            Cancelar
                        </Button>
                        <Button size="md" color="primary" onClick={revisar} isDisabled={!nome.trim() || !descricao.trim()}>
                            {editando ? "Salvar alterações" : "Criar cargo"}
                        </Button>
                    </div>
                </footer>
            </div>

            <ResumoCargoModal
                isOpen={revisando}
                nome={nome.trim()}
                selecionadas={selecionadas}
                originais={cargo ? new Set(cargo.acoes ?? []) : undefined}
                membrosAfetados={cargo ? membros.filter((m) => m.cargoIds.includes(cargo.id)).length : 0}
                onClose={() => setRevisando(false)}
                onConfirm={salvar}
            />
        </BackstageLayout>
    );
}

interface SecaoTabelaProps {
    secao: SecaoPermissao;
    selecionadas: Set<string>;
    onSet: (chaves: string[], marcar: boolean) => void;
}

function SecaoTabela({ secao, selecionadas, onSet }: SecaoTabelaProps) {
    const [preview, setPreview] = useState<Preview | null>(null);
    const previsualizar = (origem: string, chaves: string[] | null) => {
        if (!chaves?.length) return setPreview(null);
        // Inclui o que viria junto: pais completos e os Visualizar exigidos.
        setPreview({ origem, chaves: completarSelecao(new Set([...selecionadas, ...chaves])) });
    };
    const soltar = (origem: string) => setPreview((p) => (p?.origem === origem ? null : p));
    const naoMarcadas = (chaves: string[]) => chaves.filter((k) => !selecionadas.has(k));

    const todasChaves = useMemo(() => secao.recursos.flatMap((r) => chavesDoRecurso(r)), [secao]);

    const acoes = acoesDaSecao(secao);
    const colunas = acoes.filter((a) => secao.recursos.some((r) => r.base.includes(a.id)));
    const filhosDe = (i: number) => {
        if (secao.recursos[i].nivel) return [];
        const filhos: RecursoPermissao[] = [];
        for (const r of secao.recursos.slice(i + 1)) {
            if (!r.nivel) break;
            filhos.push(r);
        }
        return filhos;
    };
    const chavesDaColuna = (acao: AcaoBase) => secao.recursos.filter((r) => r.base.includes(acao)).map((r) => chavePermissao(r.id, acao));
    const tituloId = `secao-${secao.id}`;

    return (
        <section aria-labelledby={tituloId} className="overflow-clip rounded-xl bg-primary ring-1 ring-secondary">
            <div className="sticky top-0 z-10 grid items-center border-b border-secondary bg-secondary" style={gridStyle(acoes.length)}>
                <div className="flex items-start gap-3 px-5 py-4">
                    <CheckboxMassa
                        className="mt-0.5"
                        aria-label={`Todas as permissões de ${secao.nome}`}
                        chaves={todasChaves}
                        origem="secao"
                        selecionadas={selecionadas}
                        preview={preview}
                        onSet={onSet}
                        onPreview={previsualizar}
                        onPreviewEnd={soltar}
                        naoMarcadas={naoMarcadas}
                    />
                    <div className="flex min-w-0 flex-col gap-0.5">
                        <h2 id={tituloId} className="text-md font-semibold text-primary">
                            {secao.nome}
                        </h2>
                        {secao.descricao && <p className="text-sm text-tertiary">{secao.descricao}</p>}
                    </div>
                </div>
                {acoes.map((acao) => {
                    if (!colunas.includes(acao)) return <div key={acao.id} aria-hidden="true" />;
                    return (
                        <div key={acao.id} className="flex flex-col items-center gap-2 px-2 py-4 text-center">
                            <span className="text-sm font-semibold text-primary">{acao.nome}</span>
                            <CheckboxMassa
                                aria-label={`${acao.nome} em todas as permissões de ${secao.nome}`}
                                chaves={chavesDaColuna(acao.id)}
                                origem={`coluna:${acao.id}`}
                                selecionadas={selecionadas}
                                preview={preview}
                                onSet={onSet}
                                onPreview={previsualizar}
                                onPreviewEnd={soltar}
                                naoMarcadas={naoMarcadas}
                            />
                        </div>
                    );
                })}
            </div>

            {secao.recursos.map((recurso, i) => (
                <LinhaRecurso
                    key={recurso.id}
                    recurso={recurso}
                    filhos={filhosDe(i)}
                    acoes={acoes}
                    colunas={colunas}
                    selecionadas={selecionadas}
                    onSet={onSet}
                    preview={preview}
                    onPreview={previsualizar}
                    onPreviewEnd={soltar}
                    ultima={i === secao.recursos.length - 1}
                />
            ))}
        </section>
    );
}

interface CheckboxMassaProps {
    "aria-label": string;
    className?: string;
    chaves: string[];
    origem: string;
    selecionadas: Set<string>;
    preview: Preview | null;
    onSet: (chaves: string[], marcar: boolean) => void;
    onPreview: (origem: string, chaves: string[] | null) => void;
    onPreviewEnd: (origem: string) => void;
    naoMarcadas: (chaves: string[]) => string[];
}

/** Checkbox do cabeçalho: marca ou desmarca um conjunto (seção ou coluna); parcial quando só parte está marcada. */
function CheckboxMassa({ chaves, origem, selecionadas, preview, onSet, onPreview, onPreviewEnd, naoMarcadas, className, ...props }: CheckboxMassaProps) {
    const marcadas = chaves.filter((k) => selecionadas.has(k)).length;
    const previstas = preview && preview.origem !== origem ? chaves.filter((k) => selecionadas.has(k) || preview.chaves.has(k)).length : marcadas;
    const emPreview = previstas > marcadas;
    const exibidas = emPreview ? previstas : marcadas;
    const total = chaves.length;
    return (
        <Checkbox
            size="md"
            aria-label={props["aria-label"]}
            // Área de clique maior que o quadrado, sem mudar o layout.
            className={cx(CHECKBOX_HOVER, "-m-1 cursor-pointer p-1", emPreview && "[&>div:first-of-type]:opacity-50", className)}
            isSelected={total > 0 && exibidas === total}
            isIndeterminate={exibidas > 0 && exibidas < total}
            onChange={() => onSet(chaves, marcadas < total)}
            onHoverStart={() => marcadas < total && onPreview(origem, naoMarcadas(chaves))}
            onHoverEnd={() => onPreviewEnd(origem)}
        />
    );
}

/** Chaves que o controle sob o mouse marcaria ao ser clicado. */
interface Preview {
    origem: string;
    chaves: Set<string>;
}

interface LinhaRecursoProps {
    recurso: RecursoPermissao;
    /** Sub-recursos: o checkbox do pai agrega a coluna deles. */
    filhos: RecursoPermissao[];
    /** Todas as trilhas da tabela; `colunas` são as que a seção usa. */
    acoes: { id: AcaoBase; nome: string }[];
    colunas: { id: AcaoBase; nome: string }[];
    selecionadas: Set<string>;
    onSet: (chaves: string[], marcar: boolean) => void;
    preview: Preview | null;
    onPreview: (origem: string, chaves: string[] | null) => void;
    onPreviewEnd: (origem: string) => void;
    ultima: boolean;
}

function LinhaRecurso({ recurso, filhos, acoes, colunas, selecionadas, onSet, preview, onPreview, onPreviewEnd, ultima }: LinhaRecursoProps) {
    return (
        <div
            className={cx("grid items-start transition duration-100 ease-linear hover:bg-primary_hover", !ultima && "border-b border-secondary")}
            style={gridStyle(acoes.length)}
        >
            <div className={cx("flex min-w-0 flex-col gap-3 py-3.5 pr-4", recurso.nivel ? "pl-10" : "pl-5")}>
                <span className={cx("text-sm", recurso.nivel ? "text-tertiary" : "font-medium text-secondary")}>{recurso.nome}</span>
            </div>
            {acoes.map((acao) => {
                if (!colunas.includes(acao)) return <div key={acao.id} aria-hidden="true" />;
                // O pai só agrega os filhos nas colunas que ele próprio tem; sem isso, ganharia
                // uma célula que apenas duplica a do sub-item.
                const grupo = recurso.base.includes(acao.id)
                    ? [recurso, ...filhos].filter((r) => r.base.includes(acao.id)).map((r) => chavePermissao(r.id, acao.id))
                    : [];
                const marcadas = grupo.filter((k) => selecionadas.has(k)).length;
                const disponivel = grupo.length > 0;
                const origem = `celula:${recurso.id}:${acao.id}`;
                const previstas = preview && preview.origem !== origem ? grupo.filter((k) => selecionadas.has(k) || preview.chaves.has(k)).length : marcadas;
                const emPreview = previstas > marcadas;
                const exibidas = emPreview ? previstas : marcadas;
                return (
                    <div key={acao.id} className="flex self-stretch">
                        <Checkbox
                            size="md"
                            className={cx(CHECKBOX_HOVER, "w-full cursor-pointer justify-center py-4", emPreview && "[&>div:first-of-type]:opacity-50")}
                            aria-label={`${recurso.nome}: ${acao.nome}`}
                            isDisabled={!disponivel}
                            isSelected={disponivel && exibidas === grupo.length}
                            isIndeterminate={exibidas > 0 && exibidas < grupo.length}
                            onChange={(v) => onSet(grupo, v)}
                            onHoverStart={() =>
                                marcadas < grupo.length &&
                                onPreview(
                                    origem,
                                    grupo.filter((k) => !selecionadas.has(k)),
                                )
                            }
                            onHoverEnd={() => onPreviewEnd(origem)}
                        />
                    </div>
                );
            })}
        </div>
    );
}
