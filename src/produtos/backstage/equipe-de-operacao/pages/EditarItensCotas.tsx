import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { BackstageLayout } from "../../components/Backstage";
import { WizardHeader } from "../components/WizardHeader";
import { ItensCotasSelector } from "../components/ItensCotasSelector";
import { COTA_MAXIMA } from "../data/equipe-data";
import { cotaTotal, useEquipe, type ItemCota } from "../data/equipe-store";
import { toastSucesso } from "../utils/toast";

export function EditarItensCotas() {
    const navigate = useNavigate();
    const { grupoId = "" } = useParams();
    const { getGrupo, atualizarGrupo } = useEquipe();
    const grupo = getGrupo(grupoId);

    const [itens, setItens] = useState<ItemCota[]>(grupo?.itens ?? []);

    // Piso da cota por item = quanto já foi emitido dele (não pode reduzir abaixo disso).
    const minPorItem = useMemo(() => {
        if (!grupo) return {};
        const total = cotaTotal(grupo);
        return Object.fromEntries(grupo.itens.map((v) => [v.itemId, total ? Math.min(v.cota, Math.round(v.cota * (grupo.emitidas / total))) : 0]));
    }, [grupo]);

    if (!grupo) {
        return (
            <BackstageLayout activeSection="equipe-de-operacao" activeItem="grupos-operacao">
                <div className="flex flex-1 items-center justify-center py-20 text-sm text-tertiary">Grupo não encontrado.</div>
            </BackstageLayout>
        );
    }

    const voltar = () => navigate(`/backstage/equipe-de-operacao/${grupo.id}`);
    const valido = itens.length > 0 && itens.every((i) => i.cota >= (minPorItem[i.itemId] ?? 1) && i.cota <= COTA_MAXIMA);

    const salvar = () => {
        if (!valido) return;
        atualizarGrupo(grupo.id, { itens });
        toastSucesso("Itens atualizados", "Os itens e as cotas do grupo foram atualizados.");
        voltar();
    };

    return (
        <BackstageLayout activeSection="equipe-de-operacao" activeItem="grupos-operacao">
            <div className="flex min-w-0 flex-1 flex-col">
                <WizardHeader title="Editar itens e cotas" subtitle={`Grupo: ${grupo.nome}`} onBack={voltar} actionLabel="Salvar configuração" onAction={salvar} actionDisabled={!valido} />
                <main className="flex flex-1 flex-col px-6 pb-10">
                    <section className="mx-auto w-full max-w-[1000px]">
                        <ItensCotasSelector value={itens} onChange={setItens} minPorItem={minPorItem} />
                    </section>
                </main>
            </div>
        </BackstageLayout>
    );
}
