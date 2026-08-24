import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, ChevronRight, HomeLine } from "@untitledui/icons";
import { Avatar } from "@/components/base/avatar/avatar";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Toggle } from "@/components/base/toggle/toggle";
import { BackstageLayout } from "../../components/Backstage";
import { ResumoPermissoes } from "../components/ResumoPermissao";
import { PERMISSAO_META, permissoesDo, useEquipeV2 } from "../data/equipe-v2-store";

const iniciais = (nome: string) =>
    nome
        .trim()
        .split(/\s+/)
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase() || "GR";

export function DetalheGrupoV2() {
    const navigate = useNavigate();
    const { grupoId = "" } = useParams();
    const { getGrupo, toggleAtivo } = useEquipeV2();
    const grupo = getGrupo(grupoId);

    const [operadoresAtivos, setOperadoresAtivos] = useState<Record<string, boolean>>(() =>
        Object.fromEntries((grupo?.operadores ?? []).map((e) => [e, true])),
    );

    const voltar = () => navigate("/backstage/equipe-de-operacao/v2");

    if (!grupo) {
        return (
            <BackstageLayout activeSection="equipe-de-operacao" activeItem="grupos-operacao">
                <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-4 py-20 text-center">
                    <p className="text-sm text-tertiary">Grupo não encontrado.</p>
                    <Button size="md" color="secondary" onClick={voltar}>
                        Voltar
                    </Button>
                </div>
            </BackstageLayout>
        );
    }

    const concedidas = permissoesDo(grupo);

    return (
        <BackstageLayout activeSection="equipe-de-operacao" activeItem="grupos-operacao">
            <div className="flex min-w-0 flex-1 flex-col">
                <div className="px-6 pt-6">
                    <nav className="flex items-center gap-1.5 text-sm text-tertiary">
                        <button
                            type="button"
                            onClick={() => navigate("/backstage/home")}
                            aria-label="Início"
                            className="transition duration-100 ease-linear hover:text-secondary"
                        >
                            <HomeLine className="size-4" aria-hidden="true" />
                        </button>
                        <ChevronRight className="size-3.5" aria-hidden="true" />
                        <button type="button" onClick={voltar} className="transition duration-100 ease-linear hover:text-secondary">
                            Equipe de operação
                        </button>
                        <ChevronRight className="size-3.5" aria-hidden="true" />
                        <span className="rounded-md bg-secondary px-2 py-0.5 font-medium text-secondary">Detalhes</span>
                    </nav>
                </div>

                <header className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-3">
                        <ButtonUtility size="md" color="tertiary" icon={ArrowLeft} tooltip="Voltar" onClick={voltar} />
                        <Avatar size="lg" initials={iniciais(grupo.nome)} alt={grupo.nome} />
                        <div className="flex flex-col gap-1">
                            <h1 className="text-display-xs font-bold text-primary">{grupo.nome}</h1>
                            <p className="text-sm text-tertiary">
                                {grupo.operadores.length} {grupo.operadores.length === 1 ? "operador" : "operadores"}
                            </p>
                            <div className="flex flex-wrap items-center gap-1.5">
                                {concedidas.map((id) => (
                                    <Badge key={id} size="sm" color="brand" type="pill-color">
                                        {PERMISSAO_META[id].label}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-sm text-tertiary">{grupo.ativo ? "Grupo ativo" : "Grupo desativado"}</span>
                        <Toggle
                            size="sm"
                            isSelected={grupo.ativo}
                            onChange={() => toggleAtivo(grupo.id)}
                            aria-label={`Ativar grupo ${grupo.nome}`}
                        />
                    </div>
                </header>

                <main className="flex flex-1 flex-col gap-5 px-6 pb-10">
                    <ResumoPermissoes permissoes={grupo.permissoes} concedidas={concedidas} modo={grupo.modo} itens={grupo.itens} showUso />

                    <section className="flex flex-col gap-4 rounded-2xl bg-secondary p-5 ring-1 ring-border-secondary">
                        <span className="text-md font-semibold text-primary">Operadores</span>
                        <div className="flex flex-col divide-y divide-secondary">
                            {grupo.operadores.map((email) => (
                                <div key={email} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                                    <span className="min-w-0 truncate text-sm text-secondary">{email}</span>
                                    <Toggle
                                        size="sm"
                                        isSelected={operadoresAtivos[email] ?? true}
                                        onChange={(on) => setOperadoresAtivos((atual) => ({ ...atual, [email]: on }))}
                                        aria-label={`Ativar operador ${email}`}
                                    />
                                </div>
                            ))}
                        </div>
                    </section>
                </main>
            </div>
        </BackstageLayout>
    );
}
