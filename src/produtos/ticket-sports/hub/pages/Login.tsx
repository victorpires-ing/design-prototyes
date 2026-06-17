import { useState } from "react";
import { useNavigate } from "react-router";
import { TicketSportsLayout } from "../../components/TicketSportsLayout";
import { HubButton, HubGoogleButton, HubInput, HubPasswordField, HubWordmark } from "../components/hub-ui";

export function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");

    const entrar = () => navigate("/ticket-sports/hub/home");

    return (
        <TicketSportsLayout>
            <div className="flex flex-1 flex-col gap-6 px-6 py-8">
                <div className="flex flex-col gap-3">
                    <HubWordmark className="text-4xl" />
                    <h1 className="text-display-xs font-bold text-primary">Bem-vindo de volta!</h1>
                </div>

                <div className="flex flex-col gap-5">
                    <HubInput label="Email" type="email" placeholder="Digite seu email" value={email} onChange={setEmail} />
                    <div className="flex flex-col gap-1.5">
                        <HubPasswordField label="Senha" placeholder="Digite sua senha" value={senha} onChange={setSenha} />
                        <button type="button" className="w-max self-end text-sm font-semibold text-[#7C3AED]">
                            Esqueci minha senha
                        </button>
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    <HubButton onClick={entrar}>Entrar</HubButton>
                    <p className="text-center text-sm text-tertiary">Ou entre pelo Google:</p>
                    <HubGoogleButton onClick={entrar}>Entrar com Google</HubGoogleButton>
                </div>

                <p className="mt-auto text-center text-sm text-tertiary">
                    Não tem uma conta?{" "}
                    <button
                        type="button"
                        onClick={() => navigate("/ticket-sports/hub/tipo-perfil")}
                        className="font-bold text-error-primary underline"
                    >
                        Cadastre-se
                    </button>
                </p>
            </div>
        </TicketSportsLayout>
    );
}
