import { Toggle } from "@/components/base/toggle/toggle";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { cx } from "@/utils/cx";
import { PERMISSOES, type Permissao } from "../data/equipe-v2-store";

interface Props {
    concedidas: Set<Permissao>;
    onToggle: (permissao: Permissao, ligada: boolean) => void;
}

/** Passo 1 — só o que o grupo pode fazer. As cotas vêm no passo seguinte. */
export function PermissoesSelector({ concedidas, onToggle }: Props) {
    return (
        <div className="mx-auto flex w-full max-w-[720px] flex-col gap-4">
            <div className="flex flex-col gap-1">
                <h2 className="text-lg font-semibold text-primary">O que este grupo pode fazer?</h2>
                <p className="text-sm text-tertiary">Escolha uma ou mais permissões. No próximo passo você define os limites.</p>
            </div>

            {PERMISSOES.map((permissao) => {
                const ligada = concedidas.has(permissao.id);

                return (
                    <label
                        key={permissao.id}
                        className={cx(
                            "flex cursor-pointer items-start gap-4 rounded-2xl bg-secondary p-5 ring-1 transition duration-100 ease-linear hover:bg-secondary_hover",
                            ligada ? "ring-brand" : "ring-border-secondary",
                        )}
                    >
                        <FeaturedIcon icon={permissao.icon} color="gray" theme="modern" size="lg" className="shrink-0" />
                        <div className="flex min-w-0 flex-1 flex-col">
                            <span className="text-md font-semibold text-primary">{permissao.label}</span>
                            <span className="text-sm text-tertiary">{permissao.descricao}</span>
                        </div>
                        <Toggle
                            size="sm"
                            isSelected={ligada}
                            onChange={(on) => onToggle(permissao.id, on)}
                            aria-label={`Permitir ${permissao.label}`}
                        />
                    </label>
                );
            })}
        </div>
    );
}
