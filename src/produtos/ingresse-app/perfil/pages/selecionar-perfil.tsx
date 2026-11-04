import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { ChevronRight } from "@untitledui/icons";
import { Avatar } from "@/components/base/avatar/avatar";
import { AppShell } from "../../components/AppShell";
import { FOTO_MINHA_CONTA, entrarNoPerfil, sairDoPerfil } from "../../components/perfil-ativo";
import { StatusBar } from "../../components/StatusBar";
import { EU, useDependentes } from "../data/dependentes";

/** Mesmo loading curto da troca de perfil na aba Perfil. */
const ENTRADA_MS = 700;

type Opcao = { id: string; foto?: string; iniciais: string; nome: string; legenda: string; entrar: () => void };

/**
 * Seleção de perfil logo depois do login (no protótipo, simulada pelo "Sair" do Perfil).
 * A própria conta fica numa seção separada; abaixo, em "Outros perfis", os dependentes com acesso habilitado. Quem tem só a própria conta não vê esta tela.
 */
export function SelecionarPerfil() {
    const navigate = useNavigate();
    const dependentes = useDependentes().filter((d) => d.acesso === "pronto");
    const [entrandoEm, setEntrandoEm] = useState<string | null>(null);

    const minhaConta: Opcao = { id: EU.id, foto: FOTO_MINHA_CONTA, iniciais: EU.iniciais, nome: EU.nome, legenda: EU.email, entrar: sairDoPerfil };
    const outrosPerfis: Opcao[] = dependentes.map((d) => ({
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
            navigate("/ingresse-app");
        }, ENTRADA_MS);
    };

    return (
        <AppShell showTabBar={false} scrollClassName="bg-secondary">
            <div className="flex min-h-full flex-col bg-secondary">
                <StatusBar tone="dark" />

                <div className="px-5 pt-10">
                    <h1 className="text-2xl font-bold text-primary">Escolha um perfil</h1>
                </div>

                {/* Como na troca de contas de outros apps: a sua conta separada, e os dependentes como outros perfis */}
                <Secao titulo="Sua conta">
                    <Linha o={minhaConta} entrandoEm={entrandoEm} onEscolher={escolher} />
                </Secao>
                {outrosPerfis.length > 0 && (
                    <Secao titulo="Outros perfis">
                        {outrosPerfis.map((o) => (
                            <Linha key={o.id} o={o} entrandoEm={entrandoEm} onEscolher={escolher} />
                        ))}
                    </Secao>
                )}
            </div>
        </AppShell>
    );
}

const Secao = ({ titulo, children }: { titulo: string; children: ReactNode }) => (
    <section className="px-5 pt-7">
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
            className="flex w-full items-center gap-3.5 p-4 text-left transition duration-100 ease-linear enabled:active:bg-secondary"
        >
            <Avatar size="lg" src={o.foto} initials={o.iniciais} alt={o.nome} />
            <div className="min-w-0 flex-1">
                <p className="truncate text-md font-semibold text-primary">{o.nome}</p>
                <p className="truncate text-sm text-tertiary">{o.legenda}</p>
            </div>
            {entrandoEm === o.id ? (
                <span
                    className="size-5 shrink-0 animate-spin rounded-full border-2 border-tertiary border-t-fg-brand-primary"
                    aria-label={`Entrando no perfil de ${o.nome}`}
                />
            ) : (
                <ChevronRight className="size-5 shrink-0 text-fg-quaternary" />
            )}
        </button>
    </li>
);
