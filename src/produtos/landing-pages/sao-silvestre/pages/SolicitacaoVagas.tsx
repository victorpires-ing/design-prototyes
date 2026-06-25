import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router";
import { ArrowLeft, CheckCircle, ChevronDown, InfoCircle, Monitor01, Phone01, XClose } from "@untitledui/icons";
import { useTheme } from "@/providers/theme-provider";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { Input } from "@/components/base/input/input";
import { cx } from "@/utils/cx";
import logoTicketSports from "../assets/LOGO TICKET INGRESSE.svg";

const BLUE = "#0099FF";
type Viewport = "desktop" | "mobile";

/** Modal de confirmação exibido após o envio da solicitação de vagas. */
function ConfirmacaoModal({ viewport, onClose, onVoltar }: { viewport: Viewport; onClose: () => void; onVoltar: () => void }) {
    const mobile = viewport === "mobile";

    useEffect(() => {
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prev;
        };
    }, []);

    const conteudo = (
        <div className="overflow-y-auto p-6">
            <div className="flex items-start justify-between gap-3">
                <FeaturedIcon icon={CheckCircle} color="success" theme="outline" size="lg" />
                <button
                    type="button"
                    aria-label="Fechar"
                    onClick={onClose}
                    className="-mt-1.5 -mr-1.5 flex size-9 shrink-0 items-center justify-center rounded-lg text-fg-quaternary transition duration-100 ease-linear hover:bg-secondary"
                >
                    <XClose className="size-5" />
                </button>
            </div>
            <h3 className="mt-4 text-lg font-bold text-primary">Solicitação enviada</h3>
            <div className="mt-2 space-y-3 text-sm text-tertiary">
                <p>Recebemos sua solicitação de vagas para grupos na São Silvestre.</p>
                <p>A organização vai analisar o pedido. Se aprovado, você receberá por e-mail as instruções e o prazo para concluir as inscrições do seu grupo.</p>
                <p>Fique de olho na sua caixa de entrada — e também no spam — para não perder nenhuma atualização.</p>
            </div>
            <button
                type="button"
                onClick={onVoltar}
                className="mt-6 w-full rounded-lg px-5 py-3.5 text-sm font-semibold text-white transition duration-100 ease-linear hover:brightness-95"
                style={{ backgroundColor: BLUE }}
            >
                Voltar para página da São Silvestre
            </button>
        </div>
    );

    // Mobile: confina o overlay + card à coluna de 390px (o "celular" do preview).
    if (mobile) {
        return createPortal(
            <div className="fixed inset-0 z-[70] flex justify-center" role="dialog" aria-modal="true">
                <div className="relative flex h-full w-[390px] max-w-full items-center justify-center">
                    <div className="absolute inset-0 bg-black/50" />
                    <div className="relative z-10 max-h-[calc(100%-2rem)] w-[calc(100%-2rem)] overflow-hidden rounded-2xl bg-primary shadow-xl">{conteudo}</div>
                </div>
            </div>,
            document.body,
        );
    }

    return createPortal(
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
            <div className="max-h-[90vh] w-full max-w-md overflow-hidden rounded-2xl bg-primary shadow-xl">{conteudo}</div>
        </div>,
        document.body,
    );
}

/** Formulário de solicitação de vagas para grupos/assessorias (a partir da landing da SS). */
export function SolicitacaoVagas() {
    const navigate = useNavigate();
    const location = useLocation();
    const { theme, setTheme } = useTheme();
    const prevTheme = useRef(theme);
    const [viewport, setViewport] = useState<Viewport>(((location.state as { viewport?: Viewport } | null)?.viewport) ?? "desktop");

    // A página é sempre exibida em light mode (igual à landing) e começa no topo
    // (a navegação não reseta o scroll por conta própria).
    useEffect(() => {
        window.scrollTo(0, 0);
        setTheme("light");
        return () => setTheme(prevTheme.current);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const [vagas, setVagas] = useState("");
    const [segmento, setSegmento] = useState("Grupos Esportivos");
    const [nome, setNome] = useState("");
    const [enviado, setEnviado] = useState(false);
    const ok = vagas.trim() !== "" && nome.trim() !== "";

    const seg = "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold transition duration-100 ease-linear";

    const conteudo = (
        <div className="mx-auto max-w-[33.6rem] px-5 py-8">
            {/* Logo no topo (mesmo tamanho da LP) */}
            <div className="flex justify-center">
                <img src={logoTicketSports} alt="TicketSports by Ingresse" className="h-9 w-auto" />
            </div>

            {/* Card do formulário (estilo da transferência) */}
            <div className="mt-6 rounded-2xl bg-primary p-6 shadow-sm ring-1 ring-border-secondary">
                <h1 className="text-xl font-bold text-primary">Solicitação de vagas</h1>
                <p className="mt-2 text-sm text-tertiary">
                    Sua solicitação para <span className="font-semibold text-primary">São Silvestre 2026</span> será enviada para o organizador e estará sujeita a aprovação.
                </p>

                {/* Prazo (alert do DS, sem truncar a legenda) */}
                <div className="mt-5 flex gap-4 rounded-xl border border-secondary bg-secondary/60 p-4">
                    <FeaturedIcon icon={InfoCircle} color="gray" theme="modern" size="md" />
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-secondary">Inscrições de grupos até 20/11/2026</p>
                        <p className="mt-0.5 text-sm text-tertiary">Você receberá um e-mail com a resposta assim que analisada.</p>
                    </div>
                </div>

                {/* Campos */}
                <div className="mt-5 space-y-4">
                    <Input label="Informe a quantidade de vagas" placeholder="Mínimo de 10" value={vagas} onChange={setVagas} />

                    <div>
                        <label htmlFor="segmento" className="text-sm font-medium text-secondary">
                            Segmento
                        </label>
                        <div className="relative mt-1.5">
                            <select
                                id="segmento"
                                value={segmento}
                                onChange={(e) => setSegmento(e.target.value)}
                                className="w-full appearance-none rounded-lg bg-primary px-3.5 py-2.5 pr-10 text-md text-primary shadow-xs outline-none ring-1 ring-border-primary ring-inset focus:ring-2 focus:ring-brand"
                            >
                                <option>Grupos Esportivos</option>
                                <option>Assessoria de corrida</option>
                                <option>Empresa</option>
                                <option>Família e amigos</option>
                            </select>
                            <ChevronDown className="pointer-events-none absolute top-1/2 right-3.5 size-5 -translate-y-1/2 text-fg-quaternary" />
                        </div>
                    </div>

                    <Input label="Nome do grupo, equipe ou assessoria" placeholder="Digite aqui" value={nome} onChange={setNome} />
                </div>

                <button
                    type="button"
                    disabled={!ok}
                    onClick={() => setEnviado(true)}
                    className="mt-6 w-full rounded-lg px-5 py-3.5 text-sm font-semibold text-white transition duration-100 ease-linear hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
                    style={{ backgroundColor: BLUE }}
                >
                    Enviar solicitação
                </button>
            </div>
        </div>
    );

    return (
        <div className={cx("min-h-screen", viewport === "mobile" ? "bg-secondary" : "bg-secondary")}>
            {/* Barra de controle do protótipo */}
            <div className="fixed inset-x-0 top-0 z-30 flex items-center justify-between gap-3 border-b border-secondary bg-primary/90 px-4 py-2.5 backdrop-blur">
                <button
                    type="button"
                    onClick={() => navigate("/landing-pages/sao-silvestre")}
                    className="flex items-center gap-1.5 text-sm font-medium text-tertiary transition hover:text-secondary"
                >
                    <ArrowLeft className="size-4" />
                    <span>São Silvestre</span>
                </button>

                <div className="flex items-center gap-1 rounded-lg bg-secondary p-1 ring-1 ring-border-secondary">
                    <button type="button" onClick={() => setViewport("desktop")} className={cx(seg, viewport === "desktop" ? "bg-primary text-primary shadow-sm" : "text-tertiary")}>
                        <Monitor01 className="size-4" /> <span>Desktop</span>
                    </button>
                    <button type="button" onClick={() => setViewport("mobile")} className={cx(seg, viewport === "mobile" ? "bg-primary text-primary shadow-sm" : "text-tertiary")}>
                        <Phone01 className="size-4" /> <span>Mobile</span>
                    </button>
                </div>

                <span className="hidden w-[120px] text-right text-xs text-tertiary sm:inline">{viewport === "mobile" ? "390px" : "Full width"}</span>
            </div>

            {/* Área de preview */}
            <div className={cx(viewport === "mobile" ? "px-4 pt-16 pb-10" : "pt-14")}>
                <div
                    className={cx(
                        "mx-auto bg-secondary",
                        viewport === "mobile" ? "w-[390px] max-w-full overflow-hidden rounded-3xl shadow-xl ring-1 ring-border-secondary" : "w-full",
                    )}
                >
                    {conteudo}
                </div>
            </div>

            {enviado && (
                <ConfirmacaoModal
                    viewport={viewport}
                    onClose={() => setEnviado(false)}
                    onVoltar={() => navigate("/landing-pages/sao-silvestre", { state: { viewport } })}
                />
            )}
        </div>
    );
}
