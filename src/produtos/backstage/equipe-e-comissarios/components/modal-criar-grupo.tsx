import { useState } from "react";
import { useNavigate } from "react-router";
import { XClose } from "@untitledui/icons";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { gruposDeExemplo } from "../data/grupos-exemplo";
import { BASE, criarGrupo, NOME_MAX, operadoresDe, type GrupoEquipe } from "../data/equipe";
import { SeletorOperadores } from "./seletor-operadores";

/**
 * Criar grupo (ECO-07, ECO-08, ECO-30, ECO-31): só nome e pessoas. Comissário e canais se
 * configuram depois, na tela do grupo, para onde a criação leva.
 */
export function ModalCriarGrupo({
    aberto,
    onFechar,
    eventoId,
    organizacaoId,
    grupos,
}: {
    aberto: boolean;
    onFechar: () => void;
    eventoId: string;
    organizacaoId: string;
    /** Grupos do evento, para o nome não repetir. */
    grupos: GrupoEquipe[];
}) {
    const navigate = useNavigate();
    const [nome, setNome] = useState("");
    const [gruposMembros, setGruposMembros] = useState<string[]>([]);
    const [emails, setEmails] = useState<string[]>([]);
    const [tentou, setTentou] = useState(false);
    const pessoas = operadoresDe(gruposMembros, emails);

    const nomeLimpo = nome.trim();
    const repetido = grupos.some((g) => g.nome.toLowerCase() === nomeLimpo.toLowerCase());
    const longo = nomeLimpo.length > NOME_MAX;
    const erros = {
        nome: !nomeLimpo ? "Dê um nome ao grupo." : repetido ? "Já existe um grupo com esse nome neste evento." : longo ? `Use até ${NOME_MAX} caracteres.` : undefined,
        pessoas: pessoas.length === 0 ? "Adicione ao menos uma pessoa, por grupo de Membros ou por e-mail." : undefined,
    };

    const fechar = () => {
        setNome("");
        setGruposMembros([]);
        setEmails([]);
        setTentou(false);
        onFechar();
    };

    const criar = () => {
        if (erros.nome || erros.pessoas) return setTentou(true);
        const novo = criarGrupo(
            {
                eventoId,
                organizacaoId,
                nome: nomeLimpo,
                gruposMembrosIds: gruposMembros,
                emailsAvulsos: emails,
                operadores: pessoas,
            },
            gruposDeExemplo(eventoId, organizacaoId),
        );
        fechar();
        navigate(`${BASE}/${novo.id}`, { state: { criado: true } });
    };

    return (
        <ModalOverlay isOpen={aberto} onOpenChange={(abrir) => !abrir && fechar()} isDismissable className="bg-black/40 backdrop-blur-[16px]">
            <Modal className="max-w-[720px]">
                <Dialog aria-label="Criar grupo">
                    <div className="relative flex max-h-[calc(100dvh-96px)] w-full flex-col overflow-hidden rounded-2xl bg-primary shadow-xl ring-1 ring-border-secondary ring-inset">
                        <button
                            type="button"
                            onClick={fechar}
                            aria-label="Fechar"
                            className="absolute top-4 right-4 flex size-9 items-center justify-center rounded-lg text-fg-quaternary transition duration-100 ease-linear hover:bg-primary_hover hover:text-fg-quaternary_hover"
                        >
                            <XClose className="size-5" aria-hidden="true" />
                        </button>
                        <div className="flex shrink-0 flex-col gap-0.5 px-6 pt-6 pr-14">
                            <h2 className="text-md font-semibold text-primary">Criar grupo</h2>
                            <p className="text-sm text-tertiary">Depois de criar, você configura os canais do grupo e, se houver, o comissário.</p>
                        </div>

                        <div className="flex min-h-0 flex-col gap-5 overflow-y-auto px-6 pt-5">
                            <Input
                                label="Nome do grupo"
                                isRequired
                                placeholder="Ex.: Equipe de portaria"
                                value={nome}
                                onChange={setNome}
                                isInvalid={(tentou && !!erros.nome) || repetido || longo}
                                hint={(tentou || repetido || longo) && erros.nome ? erros.nome : undefined}
                            />
                            <div className="flex flex-col gap-3 border-t border-secondary pt-5">
                                <h3 className="text-sm font-semibold text-primary">Pessoas</h3>
                                <SeletorOperadores grupos={gruposMembros} onGrupos={setGruposMembros} emails={emails} onEmails={setEmails} semMoldura />
                                {tentou && erros.pessoas && <p className="text-sm text-error-primary">{erros.pessoas}</p>}
                            </div>
                        </div>

                        <div className="mt-6 flex shrink-0 gap-3 border-t border-secondary p-6">
                            <Button size="md" color="secondary" className="flex-1" onClick={fechar}>
                                Cancelar
                            </Button>
                            <Button size="md" color="primary" className="flex-1" onClick={criar}>
                                Criar grupo
                            </Button>
                        </div>
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
}
