import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Calendar, ImagePlus, Plus, Trash01, XClose } from "@untitledui/icons";
import { toast } from "sonner";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Input } from "@/components/base/input/input";
import { Select } from "@/components/base/select/select";
import { TextEditor } from "@/components/base/text-editor/text-editor";
import { BackstageLayout } from "../../components/Backstage";
import { ConfiguracoesAvancadas } from "../components/configuracoes-avancadas";
import { ControlesPrototipo } from "../components/controles-prototipo";
import { EVENTO, perfil } from "../data/troca-store";

/**
 * Réplica da tela de produção "Editar evento". Fica como está hoje: é só o caminho até
 * Configurações avançadas, onde está a mudança da troca (TS-1816).
 */
export function EditarEvento() {
    const navigate = useNavigate();
    const [avancadas, setAvancadas] = useState(false);

    const abrirAvancadas = () => {
        if (!perfil().config) {
            toast.error("Sem permissão", { description: "Seu perfil não pode editar as configurações avançadas do evento." });
            return;
        }
        setAvancadas(true);
    };

    return (
        <BackstageLayout activeSection="informacoes-evento" showLayoutSwitcher={false}>
            <div className="flex min-w-0 flex-1 flex-col gap-8 px-4 py-6 md:px-6">
                <header className="flex items-center gap-3">
                    <ButtonUtility size="sm" color="secondary" icon={ArrowLeft} tooltip="Voltar" onClick={() => navigate("/backstage/evento/visao-geral")} />
                    <h1 className="text-display-xs font-bold text-primary">Editar evento</h1>
                </header>

                <section className="flex flex-col gap-5">
                    <h2 className="text-lg font-semibold text-primary">Informações do evento</h2>
                    <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
                        <Input label="Nome do evento" defaultValue={EVENTO.nome} />
                        <div className="flex flex-col gap-1.5">
                            <span className="text-sm font-medium text-secondary">Local</span>
                            <div className="flex min-h-11 items-center gap-3 rounded-lg bg-primary px-3.5 py-2 shadow-xs ring-1 ring-border-primary ring-inset">
                                <span className="flex flex-1 flex-col">
                                    <span className="text-md text-primary">Parque das Pedras</span>
                                    <span className="text-sm text-tertiary">Curitiba, PR</span>
                                </span>
                                <Button size="sm" color="link-gray">
                                    Renomear
                                </Button>
                                <XClose className="size-4 text-fg-quaternary" aria-hidden="true" />
                            </div>
                        </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[150px_100px_150px_100px_1fr_1fr_1fr]">
                        <Input label="Data inicial" defaultValue="14/03/2027" icon={Calendar} />
                        <Input label="Hora inicial" defaultValue="06:00" />
                        <Input label="Data final" defaultValue="14/03/2027" icon={Calendar} />
                        <Input label="Hora final" defaultValue="12:00" />
                        <Select label="Moeda" selectedKey="brl" items={[{ id: "brl", label: "Brazilian Reais (R$)" }]}>
                            {(i) => <Select.Item id={i.id}>{i.label}</Select.Item>}
                        </Select>
                        <Input label="Limite por usuário" defaultValue="5" tooltip="Quantidade máxima de itens por usuário" />
                        <Select label="Idade mínima" selectedKey="livre" items={[{ id: "livre", label: "Livre" }, { id: "16", label: "16 anos" }, { id: "18", label: "18 anos" }]}>
                            {(i) => <Select.Item id={i.id}>{i.label}</Select.Item>}
                        </Select>
                    </div>
                </section>

                <section className="flex flex-col gap-5">
                    <h2 className="text-lg font-semibold text-primary">Descrição e imagens</h2>
                    <TextEditor.Root content="<ul><li>Corrida de rua com percursos de 3 a 42 km no Parque das Pedras.</li></ul>" limit={30000} inputClassName="min-h-28">
                        <TextEditor.Label>Descrição</TextEditor.Label>
                        <TextEditor.Toolbar />
                        <TextEditor.Content />
                        <TextEditor.HintText>65/30000</TextEditor.HintText>
                    </TextEditor.Root>
                    <div className="grid gap-4 md:grid-cols-2">
                        <CartaoArquivo rotulo="Banner" titulo="Banner do evento" texto="Imagem atual" thumb acao={<Trash01 className="size-5 text-fg-quaternary" aria-hidden="true" />} />
                        <CartaoArquivo rotulo="Mapa" titulo="Clique para adicionar um mapa (Opcional)" texto="Escolha entre um mapa estático ou interativo." />
                    </div>
                </section>

                <section className="flex flex-col gap-4">
                    <h2 className="text-lg font-semibold text-primary">Cronograma de sessões</h2>
                    <button
                        type="button"
                        className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-primary p-4 text-sm font-semibold text-secondary hover:bg-primary_hover"
                    >
                        <Plus className="size-4" aria-hidden="true" />
                        Clique para adicionar uma sessão
                    </button>
                    <div className="flex items-center gap-3 rounded-xl p-4 ring-1 ring-border-secondary">
                        <span className="flex flex-1 flex-col">
                            <span className="text-sm text-tertiary">Domingo</span>
                            <span className="text-sm font-medium text-primary">14/03/2027 às 06:00</span>
                        </span>
                        <Trash01 className="size-5 text-fg-quaternary" aria-hidden="true" />
                    </div>
                </section>

                <div className="flex flex-wrap justify-end gap-3 border-t border-secondary pt-6">
                    <Button size="md" color="secondary" onClick={abrirAvancadas}>
                        Configurações avançadas
                    </Button>
                    <Button size="md" color="primary" onClick={() => toast.success("Alterações salvas")}>
                        Salvar alterações
                    </Button>
                </div>
            </div>

            <ConfiguracoesAvancadas aberto={avancadas} onClose={() => setAvancadas(false)} />
            <ControlesPrototipo />
        </BackstageLayout>
    );
}

function CartaoArquivo({ rotulo, titulo, texto, thumb, acao }: { rotulo: string; titulo: string; texto: string; thumb?: boolean; acao?: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-secondary">{rotulo}</span>
            <div className="flex items-center gap-3 rounded-xl p-3 ring-1 ring-border-secondary">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-tertiary">
                    {thumb ? <span className="size-full rounded-lg bg-linear-to-br from-brand-600 to-brand-900" /> : <ImagePlus className="size-5 text-fg-quaternary" aria-hidden="true" />}
                </span>
                <span className="flex flex-1 flex-col">
                    <span className="text-sm font-semibold text-primary">{titulo}</span>
                    <span className="text-sm text-tertiary">{texto}</span>
                </span>
                {acao}
            </div>
        </div>
    );
}

