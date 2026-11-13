import { useState } from "react";
import { brl, type Servico } from "../data/servicos";

export type Opcao = number | "outro";

/** Máscara de reais inteiros: "1500" → "1.500". Crédito e recarga não usam centavos. */
export const mascararReais = (digitos: string) => {
    const d = digitos.replace(/\D/g, "").replace(/^0+/, "").slice(0, 5);
    return d ? Number(d).toLocaleString("pt-BR") : "";
};

/**
 * Estado da seleção de valor, igual para qualquer serviço: um dos valores sugeridos
 * ou "Outro valor" digitado, com validação de mínimo e máximo.
 */
export function useSelecaoValor(servico: Servico) {
    // Sempre começa sem nada selecionado (inclusive ao recarregar ou voltar do checkout)
    const [opcao, setOpcao] = useState<Opcao | null>(null);
    const [outro, setOutro] = useState("");
    const [tocado, setTocado] = useState(false);

    const outroNumero = outro ? Number(outro.replace(/\./g, "")) : null;
    const valor = opcao === "outro" ? outroNumero : opcao;

    let erro: string | null = null;
    if (opcao == null) erro = "Escolha um valor para continuar.";
    else if (opcao === "outro") {
        if (outroNumero == null) erro = "Informe um valor.";
        else if (outroNumero < servico.minimo) erro = `O valor mínimo é ${brl(servico.minimo)}.`;
        else if (outroNumero > servico.maximo) erro = `O valor máximo é ${brl(servico.maximo)}.`;
    }

    return {
        opcao,
        setOpcao: (o: Opcao) => {
            setOpcao(o);
            setTocado(false);
        },
        outro,
        setOutro: (v: string) => setOutro(mascararReais(v)),
        tocado,
        marcarTocado: () => setTocado(true),
        valor: erro ? null : valor,
        erro,
        /** Só mostra o erro depois que a pessoa interagiu (campo ou botão de contratar). */
        erroVisivel: tocado ? erro : null,
    };
}

export type SelecaoValor = ReturnType<typeof useSelecaoValor>;
