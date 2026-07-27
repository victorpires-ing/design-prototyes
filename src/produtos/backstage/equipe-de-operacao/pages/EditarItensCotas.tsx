import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { BackstageLayout } from "../../components/Backstage";
import { WizardHeader } from "../components/WizardHeader";
import { ItensCotasSelector } from "../components/ItensCotasSelector";
import { COTA_MAXIMA } from "../data/equipe-data";
import { useEquipe } from "../data/equipe-store";
import { toastSucesso } from "../utils/toast";

export function EditarItensCotas() {
    const navigate = useNavigate();
    const { grupoId = "" } = useParams();
    const { getGrupo, atualizarGrupo } = useEquipe();
    const grupo = getGrupo(grupoId);

    const [itens, setItens] = useState<string[]>(grupo?.itens ?? []);
    const [cota, setCota] = useState(grupo?.cota ?? 0);

    if (!grupo) {
        return (
            <BackstageLayout activeSection="equipe-de-operacao" activeItem="grupos-operacao">
                <div className="flex flex-1 items-center justify-center py-20 text-sm text-tertiary">Grupo não encontrado.</div>
            </BackstageLayout>
        );
    }

    const voltar = () => navigate(`/backstage/equipe-de-operacao/${grupo.id}`);
    // A cota não pode ficar abaixo do que já foi emitido.
    const valido = itens.length > 0 && cota >= grupo.emitidas && cota <= COTA_MAXIMA;

    const salvar = () => {
        if (!valido) return;
        atualizarGrupo(grupo.id, { itens, cota });
        toastSucesso("Itens atualizados", "Os itens e a cota do grupo foram atualizados.");
        voltar();
    };

    return (
        <BackstageLayout activeSection="equipe-de-operacao" activeItem="grupos-operacao">
            <div className="flex min-w-0 flex-1 flex-col">
                <WizardHeader title="Editar itens e cota" subtitle={`Grupo: ${grupo.nome}`} onBack={voltar} actionLabel="Salvar configuração" onAction={salvar} actionDisabled={!valido} />
                <main className="flex flex-1 flex-col px-6 pb-10">
                    <section className="mx-auto w-full max-w-[1000px]">
                        <ItensCotasSelector itens={itens} onItens={setItens} cota={cota} onCota={setCota} minCota={grupo.emitidas} />
                    </section>
                </main>
            </div>
        </BackstageLayout>
    );
}
