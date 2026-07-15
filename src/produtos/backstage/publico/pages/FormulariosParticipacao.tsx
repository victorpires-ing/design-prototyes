import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Calendar, ChevronLeft, ChevronRight, Plus } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";
import { BackstageLayout } from "../../components/Backstage";
import { EVENTOS_DISPONIVEIS, SelecionarEventoModal } from "../components/SelecionarEventoModal";
import { FormularioParticipacaoModal, type LimiteSolicitacoes } from "../components/FormularioParticipacaoModal";
import { adicionarFormulario, FORMULARIOS, type FormularioParticipacao } from "../data/formularios";
import { SOLICITACOES } from "../data/solicitacoes";
import thumbPadrao from "../components/assets/formulario-thumb.png";

type StatusFormulario = "inativo" | "disponivel" | "pausado";

const STATUS_META: Record<StatusFormulario, { label: string; dot: string }> = {
    inativo: { label: "Inativo", dot: "bg-fg-quaternary" },
    disponivel: { label: "Disponível", dot: "bg-fg-success-secondary" },
    pausado: { label: "Pausado", dot: "bg-fg-warning-secondary" },
};

const statusDoFormulario = (f: FormularioParticipacao): StatusFormulario => {
    if (!f.ativo) return "inativo";
    if (f.limite === "limitado" && f.quantidadeLimite !== undefined && f.solicitacoesRecebidas >= f.quantidadeLimite) {
        return "pausado";
    }
    return "disponivel";
};

const DIAS_SEMANA = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

/** Gera uma data futura aleatória (entre 30 e 365 dias a partir de hoje), formatada como "Quinta, 31 Dez 2026". */
const gerarDataFutura = () => {
    const dias = 30 + Math.floor(Math.random() * 335);
    const data = new Date();
    data.setDate(data.getDate() + dias);
    return `${DIAS_SEMANA[data.getDay()]}, ${String(data.getDate()).padStart(2, "0")} ${MESES[data.getMonth()]} ${data.getFullYear()}`;
};

/** Backstage → Público → Formulário de participação: lista de formulários por evento. */
export function FormulariosParticipacao() {
    const navigate = useNavigate();
    const [formularios, setFormularios] = useState(FORMULARIOS);
    const [isSelecionarEventoOpen, setIsSelecionarEventoOpen] = useState(false);
    const [eventoNovoFormularioId, setEventoNovoFormularioId] = useState<string | null>(null);

    const handleContinuarSelecaoEvento = (eventoId: string) => {
        setEventoNovoFormularioId(eventoId);
        setIsSelecionarEventoOpen(false);
    };

    const handleSalvarNovoFormulario = ({ ativo, limite, quantidade }: { ativo: boolean; limite: LimiteSolicitacoes; quantidade?: number }) => {
        const evento = EVENTOS_DISPONIVEIS.find((e) => e.id === eventoNovoFormularioId);
        adicionarFormulario({
            id: `${eventoNovoFormularioId}-${FORMULARIOS.length}`,
            titulo: evento?.titulo ?? "Novo formulário",
            data: gerarDataFutura(),
            imagem: thumbPadrao,
            rascunho: true,
            ativo,
            limite,
            quantidadeLimite: quantidade,
            solicitacoesRecebidas: SOLICITACOES.length,
        });
        setFormularios([...FORMULARIOS]);
        toast.success("Formulário criado!", {
            description: "O novo formulário já está disponível para o público.",
            duration: 2000,
        });
    };

    return (
        <BackstageLayout showEventContext={false} showLayoutSwitcher={false} activeProducer="publico">
            <div className="flex min-w-0 flex-1 flex-col gap-6 px-4 py-6 md:px-6">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            aria-label="Voltar"
                            onClick={() => navigate("/backstage/publico")}
                            className="flex size-11 shrink-0 items-center justify-center rounded-[8px] text-fg-secondary ring-1 ring-secondary transition duration-100 ease-linear hover:bg-secondary"
                        >
                            <ChevronLeft className="size-5" aria-hidden="true" />
                        </button>
                        <h1 className="text-display-xs font-bold text-primary">Formulário de participação</h1>
                    </div>
                    <Button size="md" color="primary" iconLeading={Plus} onClick={() => setIsSelecionarEventoOpen(true)}>
                        Novo formulário
                    </Button>
                </div>

                <div className="flex flex-col gap-3">
                    {formularios.map((f) => {
                        const status = statusDoFormulario(f);
                        return (
                            <button
                                key={f.id}
                                type="button"
                                onClick={() => navigate("/backstage/publico/solicitacoes", { state: { formularioId: f.id } })}
                                className="flex w-full items-center gap-4 rounded-xl bg-primary p-3 text-left ring-1 ring-border-secondary outline-none transition duration-100 ease-linear hover:bg-primary_hover focus-visible:ring-2 focus-visible:ring-brand"
                            >
                                <img src={f.imagem} alt="" className="size-16 shrink-0 rounded-lg object-cover" />
                                <div className="flex min-w-px flex-1 flex-col gap-1.5">
                                    <span className="text-md font-bold text-primary">{f.titulo}</span>
                                    <span className="flex items-center gap-1.5 text-sm text-tertiary">
                                        <Calendar className="size-3.5 text-fg-quaternary" aria-hidden="true" />
                                        {f.data}
                                    </span>
                                </div>
                                <span className="flex shrink-0 items-center gap-1.5 text-sm text-tertiary">
                                    <span className={cx("size-2 shrink-0 rounded-full", STATUS_META[status].dot)} aria-hidden="true" />
                                    <span className="font-semibold text-primary">{STATUS_META[status].label}</span>
                                    <span>
                                        ·{" "}
                                        {f.limite === "limitado" && f.quantidadeLimite !== undefined
                                            ? `${f.solicitacoesRecebidas.toLocaleString("pt-BR")} de ${f.quantidadeLimite.toLocaleString("pt-BR")} solicitações recebidas`
                                            : `${f.solicitacoesRecebidas.toLocaleString("pt-BR")} solicitaç${f.solicitacoesRecebidas === 1 ? "ão" : "ões"} recebida${f.solicitacoesRecebidas === 1 ? "" : "s"}`}
                                    </span>
                                </span>
                                <ChevronRight className="size-5 shrink-0 text-fg-quaternary" aria-hidden="true" />
                            </button>
                        );
                    })}
                </div>
            </div>

            <SelecionarEventoModal
                isOpen={isSelecionarEventoOpen}
                onClose={() => setIsSelecionarEventoOpen(false)}
                onContinuar={handleContinuarSelecaoEvento}
            />

            <FormularioParticipacaoModal
                isOpen={eventoNovoFormularioId !== null}
                onClose={() => setEventoNovoFormularioId(null)}
                onSalvar={handleSalvarNovoFormulario}
                ativoInicial={true}
                limiteInicial="ilimitado"
                solicitacoesRecebidas={SOLICITACOES.length}
            />
        </BackstageLayout>
    );
}
