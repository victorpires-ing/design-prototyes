import { useState } from "react";
import { CheckCircle, User01 } from "@untitledui/icons";
import { useNavigate, useSearchParams } from "react-router";
import { TicketSportsLayout } from "../../components/TicketSportsLayout";
import { Bloco } from "../components/Bloco";
import { HubButton, HubGoogleButton, HubInput, HubPasswordField, HubWordmark } from "../components/hub-ui";

export function Cadastro() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const tipo = searchParams.get("tipo") === "juridica" ? "juridica" : "fisica";
    const isEmpresa = tipo === "juridica";

    const [nome, setNome] = useState("");
    const [cnpj, setCnpj] = useState("");
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [confirmar, setConfirmar] = useState("");

    const proximo = () => navigate(`/ticket-sports/hub/foto?tipo=${tipo}`);

    return (
        <TicketSportsLayout>
            <div className="flex flex-1 flex-col gap-6 px-6 py-8">
                <div className="flex flex-col gap-3">
                    <HubWordmark className="text-4xl" />
                    <h1 className="text-display-xs font-bold text-primary">
                        {isEmpresa ? "Cadastre sua empresa" : "Faça o seu cadastro"}
                    </h1>
                </div>

                <Bloco icon={User01} titulo={isEmpresa ? "Dados da empresa" : "Seus dados"}>
                    <div className="flex flex-col gap-5">
                        <HubInput
                            label={isEmpresa ? "Nome da empresa" : "Nome"}
                            placeholder={isEmpresa ? "Razão social ou nome fantasia" : "Nome completo"}
                            value={nome}
                            onChange={setNome}
                        />
                        {isEmpresa && <HubInput label="CNPJ" placeholder="00.000.000/0000-00" value={cnpj} onChange={setCnpj} />}
                        <HubInput
                            label={isEmpresa ? "Email corporativo" : "Email"}
                            type="email"
                            placeholder={isEmpresa ? "contato@empresa.com" : "Digite"}
                            value={email}
                            onChange={setEmail}
                        />
                        <HubPasswordField
                            label="Senha"
                            placeholder="Capricha na senha"
                            value={senha}
                            onChange={setSenha}
                            hint={
                                <span className="flex items-center gap-1.5 text-sm text-tertiary">
                                    <CheckCircle className="size-4 text-fg-quaternary" />
                                    Deve ter no mínimo 8 caracteres.
                                </span>
                            }
                        />
                        <HubPasswordField label="Confirmar senha" placeholder="Digite novamente" value={confirmar} onChange={setConfirmar} />
                    </div>
                </Bloco>

                <div className="flex flex-col gap-4">
                    <HubButton onClick={proximo}>Começar</HubButton>
                    <p className="text-center text-sm text-tertiary">Ou entre pelo Google:</p>
                    <HubGoogleButton onClick={proximo}>Inscreva-se pelo Google</HubGoogleButton>
                </div>

                <p className="mt-auto text-center text-sm text-tertiary">
                    Já tem uma conta?{" "}
                    <button type="button" onClick={() => navigate("/ticket-sports/hub/login")} className="font-bold text-error-primary underline">
                        Faça o Log in
                    </button>
                </p>
            </div>
        </TicketSportsLayout>
    );
}
