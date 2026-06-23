import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, ChevronDown, InfoCircle } from "@untitledui/icons";
import { useTheme } from "@/providers/theme-provider";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { Input } from "@/components/base/input/input";
import logoTicketSports from "../assets/LOGO TICKET INGRESSE.svg";

const BLUE = "#0099FF";

/** Formulário de solicitação de vagas para grupos/assessorias (a partir da landing da SS). */
export function SolicitacaoVagas() {
    const navigate = useNavigate();
    const { theme, setTheme } = useTheme();
    const prevTheme = useRef(theme);

    // A página é sempre exibida em light mode (igual à landing).
    useEffect(() => {
        setTheme("light");
        return () => setTheme(prevTheme.current);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const [vagas, setVagas] = useState("");
    const [segmento, setSegmento] = useState("Grupos Esportivos");
    const [nome, setNome] = useState("");

    const ok = vagas.trim() !== "" && nome.trim() !== "";

    return (
        <div className="min-h-screen bg-secondary text-primary">
            {/* Barra de controle do protótipo (sem logo) */}
            <div className="fixed inset-x-0 top-0 z-30 flex items-center gap-2 border-b border-secondary bg-primary/90 px-4 py-2.5 backdrop-blur">
                <button
                    type="button"
                    onClick={() => navigate("/landing-pages/sao-silvestre")}
                    className="flex items-center gap-1.5 text-sm font-medium text-tertiary transition hover:text-secondary"
                >
                    <ArrowLeft className="size-4" />
                    <span>São Silvestre</span>
                </button>
            </div>

            <div className="pt-14">
                <div className="mx-auto max-w-md px-5 py-8">
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
                            className="mt-6 w-full rounded-lg px-5 py-3.5 text-sm font-semibold text-white transition duration-100 ease-linear hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
                            style={{ backgroundColor: BLUE }}
                        >
                            Enviar solicitação
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
