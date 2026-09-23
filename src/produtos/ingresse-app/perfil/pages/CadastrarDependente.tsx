import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Calendar, UserPlus01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Select } from "@/components/base/select/select";
import { AppShell } from "../../components/AppShell";
import { StatusBar } from "../../components/StatusBar";
import { addDependente } from "../data/dependentes";

const ANO_ATUAL = 2026;

const VINCULOS = [
    { id: "dependente", label: "Dependente" },
    { id: "conjuge", label: "Cônjuge" },
    { id: "filho", label: "Filho(a)" },
    { id: "pai-mae", label: "Pai ou mãe" },
    { id: "irmao", label: "Irmão ou irmã" },
    { id: "avo", label: "Avô ou avó" },
    { id: "neto", label: "Neto ou neta" },
    { id: "outro", label: "Outro" },
];

const maskDate = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 8);
    let out = d.slice(0, 2);
    if (d.length > 2) out += "/" + d.slice(2, 4);
    if (d.length > 4) out += "/" + d.slice(4, 8);
    return out;
};

const maskCpf = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 11);
    let out = d.slice(0, 3);
    if (d.length > 3) out += "." + d.slice(3, 6);
    if (d.length > 6) out += "." + d.slice(6, 9);
    if (d.length > 9) out += "-" + d.slice(9, 11);
    return out;
};

const parseNasc = (s: string) => {
    const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!m) return null;
    const dia = +m[1];
    const mes = +m[2];
    const ano = +m[3];
    if (mes < 1 || mes > 12 || dia < 1 || dia > 31 || ano < 1900 || ano > ANO_ATUAL) return null;
    return { dia, mes, ano };
};

// Validação de CPF (dígitos verificadores).
const cpfValido = (v: string) => {
    const d = v.replace(/\D/g, "");
    if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
    let soma = 0;
    for (let i = 0; i < 9; i++) soma += +d[i] * (10 - i);
    let resto = (soma * 10) % 11;
    if (resto === 10) resto = 0;
    if (resto !== +d[9]) return false;
    soma = 0;
    for (let i = 0; i < 10; i++) soma += +d[i] * (11 - i);
    resto = (soma * 10) % 11;
    if (resto === 10) resto = 0;
    return resto === +d[10];
};

const iniciaisDe = (nome: string) =>
    nome
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase() ?? "")
        .join("");

export function CadastrarDependente() {
    const navigate = useNavigate();
    const voltar = () => navigate("/ingresse-app/perfil/dependentes");

    const [nome, setNome] = useState("");
    const [cpf, setCpf] = useState("");
    const [dataNasc, setDataNasc] = useState("");
    const [vinculo, setVinculo] = useState<string | null>(null);
    const [erroCpf, setErroCpf] = useState<string | undefined>(undefined);
    const [enviando, setEnviando] = useState(false);

    // Botão só habilita quando todos os campos estão preenchidos.
    const formValido = nome.trim().length > 0 && cpf.replace(/\D/g, "").length === 11 && !!parseNasc(dataNasc) && !!vinculo;

    const cadastrar = () => {
        const digits = cpf.replace(/\D/g, "");

        // Único erro possível no formulário: CPF inválido.
        if (!cpfValido(digits)) {
            setErroCpf("CPF inválido. Verifique os dados e tente novamente.");
            return;
        }

        // Loading no botão + interação bloqueada enquanto processa.
        setEnviando(true);
        window.setTimeout(() => {
            const nomeFinal = nome.trim();
            addDependente({
                nome: nomeFinal,
                nascimento: dataNasc,
                cpf: maskCpf(digits),
                parentesco: VINCULOS.find((v) => v.id === vinculo)?.label ?? "Dependente",
                iniciais: iniciaisDe(nomeFinal),
            });
            // Sem confirmação: volta direto pra lista, com o novo dependente no topo.
            voltar();
        }, 1000);
    };

    return (
        <AppShell
            showTabBar={false}
            bottomBar={
                <div className="pointer-events-auto absolute inset-x-0 bottom-0 flex flex-col gap-3 border-t border-secondary bg-primary px-5 pt-3 pb-6">
                    <Button
                        size="lg"
                        color="primary"
                        className="w-full"
                        iconLeading={UserPlus01}
                        isLoading={enviando}
                        isDisabled={!formValido}
                        onClick={cadastrar}
                    >
                        Cadastrar dependente
                    </Button>
                    <Button size="lg" color="secondary" className="w-full" isDisabled={enviando} onClick={voltar}>
                        Cancelar
                    </Button>
                </div>
            }
        >
            <div className="flex min-h-full flex-col bg-secondary">
                <StatusBar tone="dark" />

                {/* Top bar */}
                <div className="px-5 pt-2">
                    <button
                        type="button"
                        aria-label="Voltar"
                        disabled={enviando}
                        onClick={voltar}
                        className="flex size-10 items-center justify-center rounded-lg bg-primary text-fg-secondary ring-1 ring-border-secondary transition duration-100 ease-linear active:bg-secondary disabled:opacity-50"
                    >
                        <ArrowLeft className="size-5" />
                    </button>
                </div>
                <div className="px-5 pt-4">
                    <h1 className="text-xl font-bold text-primary">Cadastrar dependente</h1>
                    <p className="mt-1 text-sm text-tertiary">Informe os dados da pessoa que será vinculada à sua conta.</p>
                </div>

                {/* Formulário */}
                <div className="flex flex-1 flex-col px-5 pt-6 pb-40">
                    <div className="flex flex-col gap-5 rounded-2xl bg-primary p-5 ring-1 ring-border-secondary">
                        <Input
                            isRequired
                            isDisabled={enviando}
                            label="Nome completo"
                            placeholder="Digite o nome completo"
                            value={nome}
                            onChange={setNome}
                        />

                        <Input
                            isRequired
                            isDisabled={enviando}
                            label="CPF"
                            placeholder="Apenas números"
                            inputMode="numeric"
                            value={cpf}
                            onChange={(v) => {
                                setCpf(maskCpf(v));
                                setErroCpf(undefined);
                            }}
                            isInvalid={!!erroCpf}
                            hint={erroCpf}
                        />

                        <Input
                            isRequired
                            isDisabled={enviando}
                            icon={Calendar}
                            label="Data de nascimento"
                            placeholder="DD/MM/AAAA"
                            inputMode="numeric"
                            value={dataNasc}
                            onChange={(v) => setDataNasc(maskDate(v))}
                        />

                        <Select
                            isRequired
                            isDisabled={enviando}
                            label="Qual é o vínculo com essa pessoa?"
                            placeholder="Escolha o vínculo"
                            selectedKey={vinculo}
                            onSelectionChange={(k) => setVinculo(String(k))}
                            items={VINCULOS}
                        >
                            {(item) => <Select.Item id={item.id}>{item.label}</Select.Item>}
                        </Select>
                    </div>
                </div>
            </div>
        </AppShell>
    );
}
