import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { BackstageLayout } from "../../components/Backstage";
import { WizardHeader } from "../components/WizardHeader";
import { OperadoresEditor } from "../components/OperadoresEditor";
import { useEquipe } from "../data/equipe-store";
import { toastSucesso } from "../utils/toast";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function EditarOperadores() {
    const navigate = useNavigate();
    const { grupoId = "" } = useParams();
    const { getGrupo, atualizarGrupo } = useEquipe();
    const grupo = getGrupo(grupoId);

    const [operadores, setOperadores] = useState<string[]>(grupo?.operadores ?? []);

    if (!grupo) {
        return (
            <BackstageLayout activeSection="equipe-de-operacao" activeItem="grupos-operacao">
                <div className="flex flex-1 items-center justify-center py-20 text-sm text-tertiary">Grupo não encontrado.</div>
            </BackstageLayout>
        );
    }

    const voltar = () => navigate(`/backstage/equipe-de-operacao/${grupo.id}`);
    const valido = operadores.length > 0 && operadores.every((e) => EMAIL_RE.test(e));

    const salvar = () => {
        if (!valido) return;
        atualizarGrupo(grupo.id, { operadores });
        toastSucesso("Operadores atualizados", "Os operadores foram atualizados.");
        voltar();
    };

    return (
        <BackstageLayout activeSection="equipe-de-operacao" activeItem="grupos-operacao">
            <div className="flex min-w-0 flex-1 flex-col">
                <WizardHeader title="Editar operadores" subtitle={`Grupo: ${grupo.nome}`} onBack={voltar} actionLabel="Atualizar operadores" onAction={salvar} actionDisabled={!valido} />
                <main className="flex flex-1 flex-col px-6 pb-10">
                    <section className="mx-auto w-full max-w-[720px]">
                        <OperadoresEditor value={operadores} onChange={setOperadores} bloqueados={grupo.operadores} mostrarConta badgeConta />
                    </section>
                </main>
            </div>
        </BackstageLayout>
    );
}
