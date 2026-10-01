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
import { addCargo, cargoById, isCargoSistema, updateCargo } from "../../components/membros-store";
import {
    ACOES_BASE,
    CATALOGO_PERMISSOES,
    chavePermissao,
    chavesDoRecurso,
    GRUPOS_PAI,
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

    const setChaves = (chaves: string[], marcar: boolean) => {
        setSelecionadas((prev) => {
            const next = new Set(prev);
            chaves.forEach((k) => (marcar ? next.add(k) : next.delete(k)));
            if (marcar) {
                for (const g of GRUPOS_PAI) {
                    if (g.filhos.every((k) => next.has(k))) next.add(g.pai);
                }
            }
            return next;
        });
    };

    if (id && (!cargo || isCargoSistema(id))) {
        return <Navigate to="/backstage/membros" replace />;
    }

    const handleSalvar = () => {
        if (!nome.trim() || !descricao.trim()) {
            toast.error(!nome.trim() ? "Informe o nome do cargo" : "Informe a descrição do cargo");
            return;
        }
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
                        <Button size="md" color="primary" onClick={handleSalvar} isDisabled={!nome.trim() || !descricao.trim()}>
                            {editando ? "Salvar alterações" : "Criar cargo"}
                        </Button>
                    </div>
                </footer>
            </div>
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
        const previstas = new Set(chaves);
        // Inclui os pais que ficariam marcados por terem todos os sub-itens marcados.
        for (const g of GRUPOS_PAI) {
            if (g.filhos.every((k) => selecionadas.has(k) || previstas.has(k))) {
                previstas.add(g.pai);
            }
        }
        setPreview({ origem, chaves: previstas });
    };
    const soltar = (origem: string) => setPreview((p) => (p?.origem === origem ? null : p));
    const naoMarcadas = (chaves: string[]) => chaves.filter((k) => !selecionadas.has(k));

    const todasChaves = useMemo(() => secao.recursos.flatMap((r) => chavesDoRecurso(r)), [secao]);
    const tudoMarcado = todasChaves.every((k) => selecionadas.has(k));

    const colunas = ACOES_BASE.filter((a) => secao.recursos.some((r) => r.base.includes(a.id)));
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

    return (
        <section className="overflow-clip rounded-xl bg-primary ring-1 ring-secondary">
            <div className="sticky top-0 z-10 grid items-center border-b border-secondary bg-secondary" style={gridStyle(colunas.length)}>
                <div className="flex flex-col items-start gap-1 px-5 py-4">
                    <h2 className="text-md font-semibold text-primary">{secao.nome}</h2>
                    <Button
                        size="sm"
                        color="link-gray"
                        className="*:data-text:decoration-current!"
                        onClick={() => onSet(todasChaves, !tudoMarcado)}
                        onHoverStart={() => !tudoMarcado && previsualizar("secao", naoMarcadas(todasChaves))}
                        onHoverEnd={() => soltar("secao")}
                    >
                        {tudoMarcado ? "Desmarcar seção" : "Marcar seção"}
                    </Button>
                </div>
                {colunas.map((acao) => {
                    const chaves = chavesDaColuna(acao.id);
                    const colunaMarcada = chaves.length > 0 && chaves.every((k) => selecionadas.has(k));
                    return (
                        <div key={acao.id} className="flex flex-col items-center gap-1 px-2 py-4 text-center">
                            <span className="text-sm font-semibold text-primary">{acao.nome}</span>
                            <Button
                                size="sm"
                                color="link-gray"
                                className="*:data-text:decoration-current!"
                                onClick={() => onSet(chaves, !colunaMarcada)}
                                onHoverStart={() => !colunaMarcada && previsualizar(`coluna:${acao.id}`, naoMarcadas(chaves))}
                                onHoverEnd={() => soltar(`coluna:${acao.id}`)}
                            >
                                {colunaMarcada ? "Desmarcar coluna" : "Marcar coluna"}
                            </Button>
                        </div>
                    );
                })}
            </div>

            {secao.recursos.map((recurso, i) => (
                <LinhaRecurso
                    key={recurso.id}
                    recurso={recurso}
                    filhos={filhosDe(i)}
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

/** Chaves que o controle sob o mouse marcaria ao ser clicado. */
interface Preview {
    origem: string;
    chaves: Set<string>;
}

interface LinhaRecursoProps {
    recurso: RecursoPermissao;
    /** Sub-recursos: o checkbox do pai agrega a coluna deles. */
    filhos: RecursoPermissao[];
    colunas: typeof ACOES_BASE;
    selecionadas: Set<string>;
    onSet: (chaves: string[], marcar: boolean) => void;
    preview: Preview | null;
    onPreview: (origem: string, chaves: string[] | null) => void;
    onPreviewEnd: (origem: string) => void;
    ultima: boolean;
}

function LinhaRecurso({ recurso, filhos, colunas, selecionadas, onSet, preview, onPreview, onPreviewEnd, ultima }: LinhaRecursoProps) {
    return (
        <div
            className={cx("grid items-start transition duration-100 ease-linear hover:bg-primary_hover", !ultima && "border-b border-secondary")}
            style={gridStyle(colunas.length)}
        >
            <div className={cx("flex min-w-0 flex-col gap-3 py-3.5 pr-4", recurso.nivel ? "pl-10" : "pl-5")}>
                <span className={cx("text-sm", recurso.nivel ? "text-tertiary" : "font-medium text-secondary")}>{recurso.nome}</span>
            </div>
            {colunas.map((acao) => {
                const grupo = [recurso, ...filhos].filter((r) => r.base.includes(acao.id)).map((r) => chavePermissao(r.id, acao.id));
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
