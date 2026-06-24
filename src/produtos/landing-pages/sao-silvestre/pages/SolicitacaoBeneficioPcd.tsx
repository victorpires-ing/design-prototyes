import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router";
import { ArrowLeft, Check, CheckCircle, Monitor01, Phone01, UploadCloud02 } from "@untitledui/icons";
import { useTheme } from "@/providers/theme-provider";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { Input } from "@/components/base/input/input";
import { cx } from "@/utils/cx";
import logoTicketSports from "../assets/LOGO TICKET INGRESSE.svg";

const BLUE = "#0099FF";
type Viewport = "desktop" | "mobile";

/** Modal de confirmação exibido após o envio da solicitação. */
function ConfirmacaoModal({ viewport, onVoltar, onInfos }: { viewport: Viewport; onVoltar: () => void; onInfos: () => void }) {
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
            <FeaturedIcon icon={CheckCircle} color="success" theme="light" size="lg" />
            <h3 className="mt-4 text-lg font-bold text-primary">Solicitação enviada</h3>
            <div className="mt-2 space-y-3 text-sm text-tertiary">
                <p>Recebemos sua solicitação de benefício PCD para a São Silvestre.</p>
                <p>A organização irá analisar os dados e documentos enviados. A resposta será enviada por e-mail.</p>
                <p>Se a solicitação for aprovada, você poderá acessar o fluxo de inscrição e visualizar a categoria PCD disponível para compra.</p>
            </div>
            <div className="mt-6 space-y-3">
                <button
                    type="button"
                    onClick={onVoltar}
                    className="w-full rounded-lg px-5 py-3.5 text-sm font-semibold text-white transition duration-100 ease-linear hover:brightness-95"
                    style={{ backgroundColor: BLUE }}
                >
                    Voltar para a página da São Silvestre
                </button>
                <button
                    type="button"
                    onClick={onInfos}
                    className="w-full rounded-lg border border-secondary bg-primary px-5 py-3.5 text-sm font-semibold text-primary transition duration-100 ease-linear hover:bg-secondary"
                >
                    Ver informações do evento
                </button>
            </div>
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

/** Campo de upload de arquivo (apenas captura o nome, é um protótipo). */
function UploadField({ label, value, onChange }: { label: string; value: string; onChange: (name: string) => void }) {
    const inputRef = useRef<HTMLInputElement>(null);
    return (
        <div>
            <label className="text-sm font-medium text-secondary">{label}</label>
            <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="mt-1.5 flex w-full items-center gap-3 rounded-lg border border-dashed border-border-primary bg-primary px-3.5 py-3 text-left transition duration-100 ease-linear hover:bg-secondary"
            >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-fg-quaternary">
                    <UploadCloud02 className="size-5" />
                </span>
                <span className={cx("min-w-0 flex-1 truncate text-sm", value ? "font-medium text-primary" : "text-tertiary")}>
                    {value || "Clique para enviar um arquivo"}
                </span>
            </button>
            <input ref={inputRef} type="file" className="hidden" onChange={(e) => onChange(e.target.files?.[0]?.name ?? "")} />
        </div>
    );
}

/** Formulário de solicitação de benefício PCD (a partir da landing da SS). */
export function SolicitacaoBeneficioPcd() {
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

    const [nome, setNome] = useState("");
    const [cpf, setCpf] = useState("");
    const [nascimento, setNascimento] = useState("");
    const [email, setEmail] = useState("");
    const [telefone, setTelefone] = useState("");
    const [cid, setCid] = useState("");
    const [docId, setDocId] = useState("");
    const [laudo, setLaudo] = useState("");
    const [aceite, setAceite] = useState(false);
    const [enviado, setEnviado] = useState(false);

    const ok = nome.trim() !== "" && cpf.trim() !== "" && email.trim() !== "" && aceite;

    const seg = "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold transition duration-100 ease-linear";

    const conteudo = (
        <div className="mx-auto max-w-[33.6rem] px-5 py-8">
            {/* Logo no topo (mesmo tamanho da LP) */}
            <div className="flex justify-center">
                <img src={logoTicketSports} alt="TicketSports by Ingresse" className="h-9 w-auto" />
            </div>

            {/* Card do formulário */}
            <div className="mt-6 rounded-2xl bg-primary p-6 shadow-sm ring-1 ring-border-secondary">
                <h1 className="text-xl font-bold text-primary">Solicitação de benefício PCD</h1>
                <p className="mt-2 text-sm text-tertiary">
                    Preencha os dados abaixo para que a organização avalie sua elegibilidade ao benefício PCD. A resposta será enviada por e-mail.
                </p>

                {/* Dados do atleta */}
                <p className="mt-6 text-sm font-bold text-primary">Dados do atleta</p>
                <div className="mt-3 space-y-4">
                    <Input label="Nome completo" placeholder="Digite o nome do atleta PCD" value={nome} onChange={setNome} />
                    <Input label="CPF" placeholder="000.000.000-00" value={cpf} onChange={setCpf} />
                    <Input label="Data de nascimento" placeholder="DD/MM/AAAA" value={nascimento} onChange={setNascimento} />
                    <Input label="E-mail" placeholder="email@exemplo.com" value={email} onChange={setEmail} />
                    <Input label="Telefone" placeholder="(00) 00000-0000" value={telefone} onChange={setTelefone} />
                </div>

                {/* Informações para análise */}
                <p className="mt-6 text-sm font-bold text-primary">Informações para análise</p>
                <div className="mt-3 space-y-4">
                    <Input label="CID" placeholder="Informe o CID" value={cid} onChange={setCid} />
                    <UploadField label="Documento de identificação" value={docId} onChange={setDocId} />
                    <UploadField label="Laudo ou documento comprobatório" value={laudo} onChange={setLaudo} />
                </div>

                {/* Termo obrigatório */}
                <p className="mt-6 text-sm font-bold text-primary">Termo obrigatório</p>
                <div className="mt-3 rounded-xl border border-secondary bg-secondary/60 p-4">
                    <button type="button" role="checkbox" aria-checked={aceite} onClick={() => setAceite(!aceite)} className="flex w-full items-start gap-3 text-left">
                        <span
                            className={cx(
                                "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md text-white ring-1 ring-inset transition duration-100 ease-linear",
                                aceite ? "ring-transparent" : "bg-primary ring-primary",
                            )}
                            style={aceite ? { backgroundColor: BLUE } : undefined}
                        >
                            {aceite && <Check className="size-3.5" strokeWidth={3} />}
                        </span>
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-secondary">
                                Li e autorizo o uso dos dados e documentos enviados para análise da solicitação de benefício PCD, conforme a política de privacidade.
                            </p>
                            <p className="mt-1 text-sm text-tertiary">
                                Seus documentos serão usados apenas para análise da solicitação e tratados conforme as regras de segurança e privacidade.
                            </p>
                        </div>
                    </button>
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
        <div className="min-h-screen bg-secondary">
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
                    onVoltar={() => navigate("/landing-pages/sao-silvestre", { state: { viewport } })}
                    onInfos={() => navigate("/landing-pages/sao-silvestre", { state: { viewport } })}
                />
            )}
        </div>
    );
}
