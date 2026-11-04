import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { ChevronRight } from "@untitledui/icons";
import { Avatar } from "@/components/base/avatar/avatar";
import { cx } from "@/utils/cx";
import { WebShell } from "../components/web-shell";
import { CONTA } from "../components/site-header";
import { EU, useDependentes } from "../data/dependentes";
import { entrarNoPerfil, sairDoPerfil } from "../data/perfil-ativo";

/** Mesmo loading curto da troca de perfil. */
const ENTRADA_MS = 700;

type Opcao = { id: string; foto?: string; iniciais: string; nome: string; legenda: string; entrar: () => void };

/**
 * Escolha de perfil logo depois do login (no protótipo, simulada pelo "Sair" do menu da conta), igual ao app:
 * a própria conta numa seção e, em "Outros perfis", os dependentes com acesso habilitado.
 */
export function SelecionarPerfil() {
    // Header sem a conta: o perfil ainda não foi escolhido
    return <WebShell semConta>{(compact) => <Conteudo compact={compact} />}</WebShell>;
}

function Conteudo({ compact }: { compact: boolean }) {
    const navigate = useNavigate();
    const dependentes = useDependentes().filter((d) => d.acesso === "pronto");
    const [entrandoEm, setEntrandoEm] = useState<string | null>(null);

    const minhaConta: Opcao = { id: EU.id, foto: CONTA.foto, iniciais: EU.iniciais, nome: EU.nome, legenda: EU.email, entrar: sairDoPerfil };
    const outros: Opcao[] = dependentes.map((d) => ({
        id: d.id,
        iniciais: d.iniciais,
        nome: d.nome,
        legenda: d.parentesco,
        entrar: () => entrarNoPerfil({ id: d.id, nome: d.nome, iniciais: d.iniciais, cpf: d.cpf, carteira: d.carteira }),
    }));

    const escolher = (o: Opcao) => {
        setEntrandoEm(o.id);
        window.setTimeout(() => {
            o.entrar();
            navigate("/carteira-web");
        }, ENTRADA_MS);
    };

    return (
        <div className={cx(compact ? "scrollbar-hide flex-1 overflow-y-auto bg-secondary px-5 pt-10 pb-8" : "mx-auto w-full max-w-[480px] px-4 pt-16 pb-28")}>
            <h1 className="text-2xl font-bold text-primary">Escolha um perfil</h1>
            <Secao titulo="Sua conta">
                <Linha o={minhaConta} entrandoEm={entrandoEm} onEscolher={escolher} />
            </Secao>
            {outros.length > 0 && (
                <Secao titulo="Outros perfis">
                    {outros.map((o) => (
                        <Linha key={o.id} o={o} entrandoEm={entrandoEm} onEscolher={escolher} />
                    ))}
                </Secao>
            )}
        </div>
    );
}

const Secao = ({ titulo, children }: { titulo: string; children: ReactNode }) => (
    <section className="pt-7">
        <h2 className="pb-2 text-md font-bold text-primary">{titulo}</h2>
        <ul className="overflow-hidden rounded-2xl bg-primary ring-1 ring-border-secondary">{children}</ul>
    </section>
);

const Linha = ({ o, entrandoEm, onEscolher }: { o: Opcao; entrandoEm: string | null; onEscolher: (o: Opcao) => void }) => (
    <li className="border-b border-secondary last:border-0">
        <button
            type="button"
            disabled={Boolean(entrandoEm)}
            onClick={() => onEscolher(o)}
            className="flex w-full items-center gap-3.5 p-4 text-left transition duration-100 ease-linear enabled:hover:bg-secondary/60 enabled:active:bg-secondary"
        >
            <Avatar size="lg" src={o.foto} initials={o.iniciais} alt={o.nome} />
            <div className="min-w-0 flex-1">
                <p className="truncate text-md font-semibold text-primary">{o.nome}</p>
                <p className="truncate text-sm text-tertiary">{o.legenda}</p>
            </div>
            {entrandoEm === o.id ? (
                <span className="size-5 shrink-0 animate-spin rounded-full border-2 border-tertiary border-t-fg-brand-primary" aria-label={`Entrando no perfil de ${o.nome}`} />
            ) : (
                <ChevronRight className="size-5 shrink-0 text-fg-quaternary" />
            )}
        </button>
    </li>
);
