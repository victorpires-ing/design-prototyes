import { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router";
import { AlertCircle, ArrowLeft, CheckCircle, LogIn04 } from "@untitledui/icons";
import { LoadingIndicator } from "@/components/application/loading-indicator/loading-indicator";
import { Button } from "@/components/base/buttons/button";
import { PinInput } from "@/components/base/input/pin-input";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { AppShell } from "../../components/AppShell";
import { mostrarToast } from "../../components/AppToast";
import { StatusBar } from "../../components/StatusBar";
import { entrarNoPerfil } from "../../components/perfil-ativo";
import textura from "../../assets/textura.png";
import { getDependente, iniciarHabilitacao, primeiroNome, useDependentes } from "../data/dependentes";

type Etapa = "codigo" | "processando";
type ErroCodigo = "incorreto" | "expirado" | null;

/* Códigos do protótipo: 000000 = incorreto, 111111 = expirado, qualquer outro = válido. */
const CODIGO_INCORRETO = "000000";
const CODIGO_EXPIRADO = "111111";
const REENVIO_S = 30;

const VOLTAR = "/ingresse-app/perfil/dependentes";

/**
 * Habilitar acesso ao perfil do dependente, depois da explicação (sheet na lista):
 * confirmação de identidade por código → preparando o perfil → sucesso (ou falha).
 */
export function HabilitarAcesso() {
    const navigate = useNavigate();
    const { id } = useParams();
    useDependentes();
    const dep = getDependente(id);

    const [etapa, setEtapa] = useState<Etapa>(() => (dep?.acesso === "preparando" ? "processando" : "codigo"));
    const [codigo, setCodigo] = useState("");
    const [validando, setValidando] = useState(false);
    const [erro, setErro] = useState<ErroCodigo>(null);
    const [espera, setEspera] = useState(REENVIO_S);

    // Contagem para liberar o reenvio.
    useEffect(() => {
        if (etapa !== "codigo" || espera <= 0) return;
        const t = window.setTimeout(() => setEspera((s) => s - 1), 1000);
        return () => window.clearTimeout(t);
    }, [espera, etapa]);

    if (!dep) return <Navigate to={VOLTAR} replace />;
    const nome = primeiroNome(dep);

    const validar = (valor: string) => {
        if (valor.length < 6 || validando) return;
        setValidando(true);
        setErro(null);
        window.setTimeout(() => {
            setValidando(false);
            if (valor === CODIGO_INCORRETO) return setErro("incorreto");
            if (valor === CODIGO_EXPIRADO) return setErro("expirado");
            iniciarHabilitacao(dep.id);
            setEtapa("processando");
        }, 1200);
    };

    const reenviar = () => {
        setCodigo("");
        setErro(null);
        setEspera(REENVIO_S);
        mostrarToast("Código reenviado", "Confira o SMS no seu celular.");
    };

    const entrar = () => {
        entrarNoPerfil({ id: dep.id, nome: dep.nome, iniciais: dep.iniciais, cpf: dep.cpf, carteira: dep.carteira });
        navigate("/ingresse-app/ingressos");
    };

    /* ------------------------- Preparando / resultado ------------------------- */
    if (etapa === "processando") {
        const pronto = dep.acesso === "pronto";
        const falhou = dep.acesso === "falhou";
        return (
            <AppShell
                showTabBar={false}
                scrollClassName="bg-secondary"
                bottomBar={
                    <div className="pointer-events-auto absolute inset-x-0 bottom-0 flex flex-col gap-3 px-5 pb-8">
                        {pronto && (
                            <Button size="lg" color="primary" iconLeading={LogIn04} className="w-full" onClick={entrar}>
                                Entrar como {nome}
                            </Button>
                        )}
                        {falhou && (
                            <Button size="lg" color="primary" className="w-full" onClick={() => iniciarHabilitacao(dep.id)}>
                                Tentar novamente
                            </Button>
                        )}
                        <Button size="lg" color="secondary" className="w-full" onClick={() => navigate(VOLTAR)}>
                            Voltar aos dependentes
                        </Button>
                    </div>
                }
            >
                <div className="relative flex min-h-full flex-col overflow-hidden bg-secondary">
                    <img src={textura} alt="" aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 size-full object-cover opacity-60" />
                    <div className="relative z-10">
                        <StatusBar tone="dark" />
                    </div>
                    <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-8 pb-24 text-center" role="status" aria-live="polite">
                        {pronto ? (
                            <>
                                <FeaturedIcon icon={CheckCircle} color="success" theme="light" size="xl" />
                                <h1 className="mt-5 text-xl font-bold text-primary">Acesso habilitado</h1>
                                <p className="mt-2 text-sm leading-relaxed text-tertiary">
                                    Agora você pode entrar no perfil de {nome} e usar os ingressos pela sua conta.
                                </p>
                            </>
                        ) : falhou ? (
                            <>
                                <FeaturedIcon icon={AlertCircle} color="error" theme="light" size="xl" />
                                <h1 className="mt-5 text-xl font-bold text-primary">Não foi possível habilitar o acesso</h1>
                                <p className="mt-2 text-sm leading-relaxed text-tertiary">
                                    Tente novamente em alguns instantes. {nome} continua nos seus dependentes.
                                </p>
                            </>
                        ) : (
                            <>
                                <LoadingIndicator type="dot-circle" size="lg" />
                                <h1 className="mt-5 text-xl font-bold text-primary">Preparando o perfil de {nome}</h1>
                                <p className="mt-2 text-sm leading-relaxed text-tertiary">
                                    Isso pode levar alguns instantes. Se preferir sair, avisamos quando o acesso estiver pronto.
                                </p>
                            </>
                        )}
                    </div>
                </div>
            </AppShell>
        );
    }

    /* --------------------------------- Código --------------------------------- */
    const dica =
        erro === "incorreto"
            ? "Código incorreto. Confira e tente de novo."
            : erro === "expirado"
              ? "Esse código expirou. Peça um novo para continuar."
              : undefined;

    return (
        <AppShell
            showTabBar={false}
            bottomBar={
                <div className="pointer-events-auto absolute inset-x-0 bottom-0 border-t border-secondary bg-primary px-5 pt-3 pb-6">
                    <Button
                        size="lg"
                        color="primary"
                        className="w-full"
                        isLoading={validando}
                        isDisabled={codigo.length < 6 || erro === "expirado"}
                        onClick={() => validar(codigo)}
                    >
                        Confirmar
                    </Button>
                </div>
            }
        >
            <div className="flex min-h-full flex-col bg-secondary">
                <StatusBar tone="dark" />

                <div className="px-5 pt-2">
                    <button
                        type="button"
                        aria-label="Voltar"
                        disabled={validando}
                        onClick={() => navigate(VOLTAR)}
                        className="flex size-10 items-center justify-center rounded-lg bg-primary text-fg-secondary ring-1 ring-border-secondary transition duration-100 ease-linear active:bg-secondary disabled:opacity-50"
                    >
                        <ArrowLeft className="size-5" />
                    </button>
                </div>
                <div className="px-5 pt-4">
                    <h1 className="text-xl font-bold text-primary">Confirme que é você</h1>
                    <p className="mt-1 text-sm text-tertiary">
                        Enviamos um código de 6 dígitos por SMS para <span className="font-semibold text-secondary">(21) •••••-7195</span>.
                    </p>
                </div>

                <div className="px-5 pt-6 pb-40">
                    <div className="flex flex-col items-center gap-4 rounded-2xl bg-primary p-5 ring-1 ring-border-secondary">
                        <PinInput size="xs" disabled={validando} invalid={Boolean(erro)}>
                            <PinInput.Group
                                maxLength={6}
                                value={codigo}
                                inputMode="numeric"
                                autoFocus
                                onChange={(v) => {
                                    setCodigo(v.replace(/\D/g, ""));
                                    if (erro === "incorreto") setErro(null);
                                }}
                                onComplete={validar}
                            >
                                {[0, 1, 2, 3, 4, 5].map((i) => (
                                    <PinInput.Slot key={i} index={i} />
                                ))}
                            </PinInput.Group>
                            {dica && (
                                <PinInput.Description isInvalid className="text-center">
                                    {dica}
                                </PinInput.Description>
                            )}
                        </PinInput>

                        {espera > 0 && erro !== "expirado" ? (
                            <p className="text-sm text-tertiary tabular-nums">Reenviar código em 0:{String(espera).padStart(2, "0")}</p>
                        ) : (
                            <Button size="sm" color="link-color" onClick={reenviar}>
                                Reenviar código
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </AppShell>
    );
}
