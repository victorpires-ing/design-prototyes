import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { AlertTriangle, ArrowLeft, Calendar, CheckCircle, InfoCircle, UserPlus01, XClose } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { RadioButton, RadioGroup } from "@/components/base/radio-buttons/radio-buttons";
import { Select } from "@/components/base/select/select";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { AppShell } from "../../components/AppShell";
import { BottomSheet } from "../../components/BottomSheet";
import { StatusBar } from "../../components/StatusBar";
import { addDependente } from "../data/dependentes-store";

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

const NOMES_BUREAU = ["Lucas Andrade", "Beatriz Nogueira", "Rafael Mendes", "Camila Duarte", "Thiago Barros"];

const maskDate = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 8);
    let out = d.slice(0, 2);
    if (d.length > 2) out += "/" + d.slice(2, 4);
    if (d.length > 4) out += "/" + d.slice(4, 8);
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

const formatDoc = (digits: string) => {
    if (digits.length === 11) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
    if (digits.length === 14) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
    return digits;
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
    const { eventId, id } = useParams();
    const voltar = () => navigate(`/ingresse-app/ingressos/transferir-dependente/${eventId}/${id}`);

    const [tipoDoc, setTipoDoc] = useState<string | null>(null);
    const [documento, setDocumento] = useState("");
    const [dataNasc, setDataNasc] = useState("");
    const [nome, setNome] = useState("");
    const [vinculo, setVinculo] = useState<string | null>(null);
    const [errors, setErrors] = useState<{ tipo?: string; doc?: string; data?: string; nome?: string; vinculo?: string }>({});
    const [feedback, setFeedback] = useState<"sucesso" | "erro" | null>(null);

    const nascInfo = parseNasc(dataNasc);
    const isMenor = nascInfo ? ANO_ATUAL - nascInfo.ano < 18 : false;

    const maxDoc = tipoDoc === "cpf" ? 11 : 14;

    const cadastrar = () => {
        const digits = documento.replace(/\D/g, "");
        const e: typeof errors = {};

        if (!tipoDoc) e.tipo = "Selecione o tipo de documento.";
        const tamOk = tipoDoc === "cpf" ? digits.length === 11 : tipoDoc === "cnpj" ? digits.length === 14 : digits.length === 11 || digits.length === 14;
        if (!tamOk) e.doc = "Documento inválido. Verifique os dados e tente novamente.";
        if (!nascInfo) e.data = "A data de nascimento não corresponde aos dados encontrados.";
        if (isMenor && !nome.trim()) e.nome = "Não conseguimos identificar o nome. Informe o nome completo do dependente.";
        if (!vinculo) e.vinculo = "Selecione o vínculo com essa pessoa.";

        setErrors(e);
        if (Object.keys(e).length > 0) return;

        // Cenário de erro geral (demo): documento com todos os dígitos iguais.
        if (/^(\d)\1+$/.test(digits)) {
            setFeedback("erro");
            return;
        }

        const somaDigitos = digits.split("").reduce((a, c) => a + Number(c), 0);
        const nomeFinal = nome.trim() || NOMES_BUREAU[somaDigitos % NOMES_BUREAU.length];
        addDependente({
            nome: nomeFinal,
            cpf: formatDoc(digits),
            iniciais: iniciaisDe(nomeFinal),
            vinculo: VINCULOS.find((v) => v.id === vinculo)?.label,
        });
        setFeedback("sucesso");
    };

    return (
        <AppShell showTabBar={false}>
            <div className="flex min-h-full flex-col bg-secondary">
                <StatusBar tone="dark" />

                {/* Top bar */}
                <div className="flex items-center justify-between px-5 pt-2">
                    <button
                        type="button"
                        aria-label="Voltar"
                        onClick={voltar}
                        className="flex size-10 items-center justify-center rounded-lg bg-primary text-fg-secondary ring-1 ring-border-secondary transition duration-100 ease-linear active:bg-secondary"
                    >
                        <ArrowLeft className="size-5" />
                    </button>
                    <button
                        type="button"
                        aria-label="Informações"
                        className="flex size-10 items-center justify-center rounded-lg bg-primary text-fg-secondary ring-1 ring-border-secondary transition duration-100 ease-linear active:bg-secondary"
                    >
                        <InfoCircle className="size-5" />
                    </button>
                </div>
                <div className="px-5 pt-4">
                    <h1 className="text-xl font-bold text-primary">Cadastrar dependente</h1>
                    <p className="mt-1 text-sm text-tertiary">Informe os dados da pessoa que será vinculada à sua conta.</p>
                </div>

                {/* Formulário */}
                <div className="flex flex-1 flex-col px-5 pt-6 pb-8">
                    <div className="flex flex-col gap-5 rounded-2xl bg-primary p-5 ring-1 ring-border-secondary">
                        {/* Tipo de documento */}
                        <div>
                            <p className="text-sm font-semibold text-secondary">Tipo de documento</p>
                            <RadioGroup
                                value={tipoDoc ?? ""}
                                onChange={(v) => {
                                    setTipoDoc(v);
                                    setDocumento((d) => d.slice(0, v === "cpf" ? 11 : 14));
                                    setErrors((p) => ({ ...p, tipo: undefined, doc: undefined }));
                                }}
                                className="mt-3 gap-3"
                            >
                                <RadioButton value="cpf" label="CPF" />
                                <RadioButton value="cnpj" label="CNPJ" />
                            </RadioGroup>
                            {errors.tipo && <p className="mt-2 text-sm text-error-primary">{errors.tipo}</p>}
                        </div>

                        <Input
                            isRequired
                            label="Número do documento"
                            placeholder="Apenas números"
                            inputMode="numeric"
                            value={documento}
                            onChange={(v) => {
                                setDocumento(v.replace(/\D/g, "").slice(0, maxDoc));
                                setErrors((p) => ({ ...p, doc: undefined }));
                            }}
                            isInvalid={!!errors.doc}
                            hint={errors.doc}
                        />

                        <Input
                            isRequired
                            icon={Calendar}
                            label="Data de nascimento"
                            placeholder="DD/MM/AAAA"
                            inputMode="numeric"
                            value={dataNasc}
                            onChange={(v) => {
                                setDataNasc(maskDate(v));
                                setErrors((p) => ({ ...p, data: undefined }));
                            }}
                            isInvalid={!!errors.data}
                            hint={errors.data}
                        />

                        {/* Nome só aparece quando o Bureau não identifica (menores) */}
                        {isMenor && (
                            <Input
                                isRequired
                                label="Nome completo"
                                placeholder="Digite o nome completo"
                                value={nome}
                                onChange={(v) => {
                                    setNome(v);
                                    setErrors((p) => ({ ...p, nome: undefined }));
                                }}
                                isInvalid={!!errors.nome}
                                hint={errors.nome ?? "Não conseguimos identificar o nome. Informe o nome completo do dependente."}
                            />
                        )}

                        <Select
                            isRequired
                            label="Qual é o vínculo com essa pessoa?"
                            placeholder="Escolha o vínculo"
                            selectedKey={vinculo}
                            onSelectionChange={(k) => {
                                setVinculo(String(k));
                                setErrors((p) => ({ ...p, vinculo: undefined }));
                            }}
                            isInvalid={!!errors.vinculo}
                            hint={errors.vinculo}
                            items={VINCULOS}
                        >
                            {(item) => <Select.Item id={item.id}>{item.label}</Select.Item>}
                        </Select>
                    </div>

                    <div className="mt-auto flex flex-col gap-3 pt-8">
                        <Button size="lg" color="primary" className="w-full" iconLeading={UserPlus01} onClick={cadastrar}>
                            Cadastrar dependente
                        </Button>
                        <Button size="lg" color="secondary" className="w-full" onClick={voltar}>
                            Cancelar
                        </Button>
                    </div>
                </div>
            </div>

            {/* Feedback de sucesso */}
            <BottomSheet isOpen={feedback === "sucesso"} onClose={voltar}>
                <div className="flex items-start gap-3">
                    <FeaturedIcon icon={CheckCircle} color="success" theme="modern" size="lg" />
                    <div className="min-w-0 flex-1">
                        <h2 className="text-lg font-bold text-primary">Dependente cadastrado com sucesso</h2>
                        <p className="mt-1 text-sm text-tertiary">A pessoa já está vinculada à sua conta e disponível para receber ingressos.</p>
                    </div>
                    <button
                        type="button"
                        aria-label="Fechar"
                        onClick={voltar}
                        className="text-fg-quaternary transition duration-100 ease-linear active:text-fg-secondary"
                    >
                        <XClose className="size-6" />
                    </button>
                </div>
                <Button size="lg" color="primary" className="mt-5 w-full rounded-full" onClick={voltar}>
                    Concluir
                </Button>
            </BottomSheet>

            {/* Erro geral */}
            <BottomSheet isOpen={feedback === "erro"} onClose={() => setFeedback(null)}>
                <div className="flex items-start gap-3">
                    <FeaturedIcon icon={AlertTriangle} color="error" theme="modern" size="lg" />
                    <div className="min-w-0 flex-1">
                        <h2 className="text-lg font-bold text-primary">Não foi possível cadastrar o dependente</h2>
                        <p className="mt-1 text-sm text-tertiary">Verifique os dados informados e tente novamente.</p>
                    </div>
                    <button
                        type="button"
                        aria-label="Fechar"
                        onClick={() => setFeedback(null)}
                        className="text-fg-quaternary transition duration-100 ease-linear active:text-fg-secondary"
                    >
                        <XClose className="size-6" />
                    </button>
                </div>
                <Button size="lg" color="primary" className="mt-5 w-full rounded-full" onClick={() => setFeedback(null)}>
                    Tentar novamente
                </Button>
            </BottomSheet>
        </AppShell>
    );
}
