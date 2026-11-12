import { useCorDeParticulas } from "../../components/campo-de-particulas";

/* Faixa do painel segue o tema; o holofote é sempre escuro, então as partículas são sempre brancas. */
export function useCorDasParticulas(onde: "faixa" | "holofote"): string {
    const doTema = useCorDeParticulas();
    return onde === "holofote" ? "rgba(255,255,255,0.22)" : doTema;
}
