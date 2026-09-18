import { useState } from "react";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Select } from "@/components/base/select/select";
import { criarConta, getItem, type Conta, type PedidoItem } from "../../data/pos-compra-store";
import { Regra } from "../pos-compra-ui";

const GENEROS = [
    { id: "F", label: "Feminino" },
    { id: "M", label: "Masculino" },
    { id: "outro", label: "Outro" },
];

/** Cadastro da pessoa que vai receber a transferência, sem sair do wizard — o caso mais comum
 *  (novo titular sem conta) não precisa mais de uma ligação de volta. Só pede gênero/sócio quando
 *  alguma das linhas selecionadas exige esse dado para validar a restrição de segmentação — a
 *  restrição em si nunca é contornada, só o dado que faltava é coletado aqui. */
export function CadastroContaInline({ nomeInicial, linhas, onCriada, onCancelar }: { nomeInicial: string; linhas: PedidoItem[]; onCriada: (conta: Conta) => void; onCancelar: () => void }) {
    const itens = linhas.map((l) => getItem(l.itemId));
    const precisaGenero = itens.some((i) => i?.segmentacao === "feminino");
    const precisaSocio = itens.some((i) => i?.segmentacao === "socio");

    const [nome, setNome] = useState(nomeInicial.includes("@") || /\d/.test(nomeInicial) ? "" : nomeInicial);
    const [email, setEmail] = useState(nomeInicial.includes("@") ? nomeInicial : "");
    const [celular, setCelular] = useState("");
    const [cpf, setCpf] = useState(/^\d/.test(nomeInicial) ? nomeInicial : "");
    const [genero, setGenero] = useState<"F" | "M" | "outro" | "">("");
    const [socio, setSocio] = useState(false);

    const podeCriar = nome.trim().length > 0 && email.trim().length > 0 && celular.trim().length > 0 && (!precisaGenero || genero !== "");

    const handleCriar = () => {
        if (!podeCriar) return;
        const conta = criarConta({ nome: nome.trim(), email: email.trim(), celular: celular.trim(), cpf: cpf.trim() || undefined, genero: genero || undefined, socio: precisaSocio ? socio : undefined });
        onCriada(conta);
    };

    return (
        <div className="flex w-full flex-col gap-4 rounded-2xl bg-primary p-5 ring-1 ring-border-secondary">
            <div>
                <p className="text-base font-semibold text-primary">Cadastrar quem vai receber</p>
                <p className="mt-0.5 text-sm text-tertiary">Dados mínimos para gerar a cobrança. A pessoa completa o cadastro dela depois.</p>
            </div>

            <Input label="Nome completo" value={nome} onChange={setNome} isRequired />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input label="E-mail" type="email" value={email} onChange={setEmail} isRequired />
                <Input label="Celular" placeholder="(11) 98888-7777" value={celular} onChange={setCelular} isRequired />
            </div>
            <Input label="CPF" placeholder="000.000.000-00" value={cpf} onChange={setCpf} hint="Opcional agora, pode ser confirmado no pagamento." />

            {(precisaGenero || precisaSocio) && (
                <div className="flex flex-col gap-4 border-t border-secondary pt-4">
                    <Regra>Pelo menos um item selecionado tem restrição de segmentação, por isso esse dado é necessário aqui.</Regra>
                    {precisaGenero && (
                        <Select label="Gênero" placeholder="Selecione" selectedKey={genero || undefined} onSelectionChange={(k) => setGenero(k as "F" | "M" | "outro")} items={GENEROS} isRequired>
                            {(item) => <Select.Item id={item.id}>{item.label}</Select.Item>}
                        </Select>
                    )}
                    {precisaSocio && <Checkbox label="Tem vínculo de sócio ativo" isSelected={socio} onChange={setSocio} />}
                </div>
            )}

            <div className="flex justify-end gap-3 border-t border-secondary pt-4">
                <Button size="sm" color="secondary" onClick={onCancelar}>
                    Cancelar
                </Button>
                <Button size="sm" color="primary" isDisabled={!podeCriar} onClick={handleCriar}>
                    Cadastrar e selecionar
                </Button>
            </div>
        </div>
    );
}
