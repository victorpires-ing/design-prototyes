import { File02 } from "@untitledui/icons";
import type { Solicitacao } from "../data/solicitacoes";

/** Campo (caixa preenchida, sem borda): label acima + valor. */
function Campo({ label, valor }: { label: string; valor: string }) {
    return (
        <div className="flex flex-col gap-1 rounded-xl bg-secondary px-4 py-3">
            <span className="text-sm text-tertiary">{label}</span>
            <span className="text-md text-primary">{valor}</span>
        </div>
    );
}

/** Conteúdo do anexo "Dados cadastrais": card "Dados do atleta" com os dados do solicitante. */
export function DadosCadastraisForm({ solicitacao }: { solicitacao: Solicitacao }) {
    return (
        <div className="mx-auto flex w-full max-w-[520px] flex-col gap-4 rounded-2xl bg-primary p-6 ring-1 ring-secondary">
            <div className="flex items-center gap-2">
                <File02 className="size-5 text-fg-quaternary" aria-hidden="true" />
                <h3 className="text-lg font-bold text-primary">Dados do atleta</h3>
            </div>

            <div className="flex flex-col gap-3">
                <Campo label="CPF" valor={solicitacao.documento} />
                <Campo label="Data de nascimento" valor={solicitacao.nascimento} />
                <Campo label="E-mail" valor={solicitacao.email} />
                <Campo label="Telefone" valor={solicitacao.telefone} />
                <Campo label="CID" valor={solicitacao.cid} />
            </div>
        </div>
    );
}
