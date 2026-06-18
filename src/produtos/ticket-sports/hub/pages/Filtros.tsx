import { useState } from "react";
import { ArrowLeft, Calendar, Globe01, MarkerPin01, TrendUp02, Users03 } from "@untitledui/icons";
import { useNavigate } from "react-router";
import { cx } from "@/utils/cx";
import { TicketSportsLayout } from "../../components/TicketSportsLayout";
import { Bloco } from "../components/Bloco";
import { HubSelect } from "../components/hub-ui";

const CATEGORIAS = ["Corrida", "Musculação", "Ciclismo", "Natação", "Yoga", "CrossFit", "Caminhada", "Tênis"];
const PRECO = ["Todos", "Gratuito", "Pago"];
const DISTANCIA = ["Qualquer", "Até 5 km", "Até 10 km", "Até 25 km", "Até 50 km"];
const DATA = ["Qualquer", "Esta semana", "Este mês", "Próximos 3 meses"];
const NIVEL = ["Todos", "Iniciante", "Intermediário", "Avançado"];
const IDADE = ["Todas", "Sub-18", "18–29", "30–44", "45–59", "60+"];
const SEXO = ["Todos", "Masculino", "Feminino", "Misto"];

const PAISES = [
    { id: "br", emoji: "🇧🇷", label: "Brasil" },
    { id: "ar", emoji: "🇦🇷", label: "Argentina" },
    { id: "pt", emoji: "🇵🇹", label: "Portugal" },
    { id: "us", emoji: "🇺🇸", label: "Estados Unidos" },
];
const ESTADOS = ["SP", "RJ", "MG", "RS", "PR", "BA", "SC"].map((s) => ({ id: s.toLowerCase(), label: s }));
const CIDADES = ["São Paulo", "Campinas", "Santos", "Rio de Janeiro", "Belo Horizonte", "Curitiba"].map((c) => ({
    id: c,
    label: c,
}));

const Chip = ({ ativo, onClick, children }: { ativo: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button
        type="button"
        onClick={onClick}
        className={cx(
            "rounded-full border px-4 py-2 text-sm font-medium transition duration-100",
            ativo ? "border-[#7C3AED] bg-[#7C3AED] text-white" : "border-secondary text-secondary",
        )}
    >
        {children}
    </button>
);

const Secao = ({ titulo, children }: { titulo: string; children: React.ReactNode }) => (
    <div className="flex flex-col gap-3">
        <span className="text-sm font-semibold text-primary">{titulo}</span>
        {children}
    </div>
);

export function Filtros() {
    const navigate = useNavigate();
    const [categorias, setCategorias] = useState<Set<string>>(new Set());
    const [preco, setPreco] = useState("Todos");
    const [distancia, setDistancia] = useState("Qualquer");
    const [pais, setPais] = useState<string | null>("br");
    const [estado, setEstado] = useState<string | null>("sp");
    const [cidade, setCidade] = useState<string | null>("São Paulo");
    const [data, setData] = useState("Qualquer");
    const [nivel, setNivel] = useState("Todos");
    const [idade, setIdade] = useState("Todas");
    const [sexo, setSexo] = useState("Todos");

    const toggleCat = (c: string) => {
        const next = new Set(categorias);
        next.has(c) ? next.delete(c) : next.add(c);
        setCategorias(next);
    };

    const limpar = () => {
        setCategorias(new Set());
        setPreco("Todos");
        setDistancia("Qualquer");
        setPais(null);
        setEstado(null);
        setCidade(null);
        setData("Qualquer");
        setNivel("Todos");
        setIdade("Todas");
        setSexo("Todos");
    };

    return (
        <TicketSportsLayout fullHeight>
            <header className="flex items-center justify-between gap-2 border-b border-secondary bg-primary px-5 py-3.5 md:rounded-t-3xl">
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        aria-label="Voltar"
                        className="flex size-9 items-center justify-center rounded-full text-fg-secondary hover:bg-secondary"
                    >
                        <ArrowLeft className="size-5" />
                    </button>
                    <h1 className="text-xl font-bold text-primary">Filtros</h1>
                </div>
                <button type="button" onClick={limpar} className="text-sm font-semibold text-[#7C3AED]">
                    Limpar
                </button>
            </header>

            <main className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 py-5 pb-28">
                <Bloco icon={TrendUp02} titulo="Categoria">
                    <Secao titulo="Categoria">
                        <div className="flex flex-wrap gap-2">
                            {CATEGORIAS.map((c) => (
                                <Chip key={c} ativo={categorias.has(c)} onClick={() => toggleCat(c)}>
                                    {c}
                                </Chip>
                            ))}
                        </div>
                    </Secao>
                </Bloco>

                <Bloco icon={MarkerPin01} titulo="Preço e distância">
                    <Secao titulo="Preço">
                        <div className="flex flex-wrap gap-2">
                            {PRECO.map((p) => (
                                <Chip key={p} ativo={preco === p} onClick={() => setPreco(p)}>
                                    {p}
                                </Chip>
                            ))}
                        </div>
                    </Secao>

                    <Secao titulo="Distância">
                        <div className="flex flex-wrap gap-2">
                            {DISTANCIA.map((d) => (
                                <Chip key={d} ativo={distancia === d} onClick={() => setDistancia(d)}>
                                    {d}
                                </Chip>
                            ))}
                        </div>
                    </Secao>
                </Bloco>

                <Bloco icon={Globe01} titulo="Localização">
                    <Secao titulo="Localização">
                        <div className="flex flex-col gap-3">
                            <HubSelect label="País" placeholder="Selecione o país" value={pais} onChange={setPais} options={PAISES} />
                            <HubSelect label="Estado" placeholder="Selecione o estado" value={estado} onChange={setEstado} options={ESTADOS} />
                            <HubSelect label="Cidade" placeholder="Selecione a cidade" value={cidade} onChange={setCidade} options={CIDADES} />
                        </div>
                    </Secao>
                </Bloco>

                <Bloco icon={Calendar} titulo="Data e nível">
                    <Secao titulo="Data">
                        <div className="flex flex-wrap gap-2">
                            {DATA.map((d) => (
                                <Chip key={d} ativo={data === d} onClick={() => setData(d)}>
                                    {d}
                                </Chip>
                            ))}
                        </div>
                    </Secao>

                    <Secao titulo="Nível">
                        <div className="flex flex-wrap gap-2">
                            {NIVEL.map((n) => (
                                <Chip key={n} ativo={nivel === n} onClick={() => setNivel(n)}>
                                    {n}
                                </Chip>
                            ))}
                        </div>
                    </Secao>
                </Bloco>

                <Bloco icon={Users03} titulo="Público">
                    <Secao titulo="Faixa etária">
                        <div className="flex flex-wrap gap-2">
                            {IDADE.map((f) => (
                                <Chip key={f} ativo={idade === f} onClick={() => setIdade(f)}>
                                    {f}
                                </Chip>
                            ))}
                        </div>
                    </Secao>

                    <Secao titulo="Sexo">
                        <div className="flex flex-wrap gap-2">
                            {SEXO.map((s) => (
                                <Chip key={s} ativo={sexo === s} onClick={() => setSexo(s)}>
                                    {s}
                                </Chip>
                            ))}
                        </div>
                    </Secao>
                </Bloco>
            </main>

            <div className="border-t border-secondary bg-primary px-4 py-4 md:rounded-b-3xl">
                <button
                    type="button"
                    onClick={() => navigate("/ticket-sports/hub/eventos")}
                    className="w-full rounded-lg bg-[#7C3AED] py-3.5 text-sm font-semibold text-white transition hover:bg-[#6D28D9]"
                >
                    Aplicar filtros
                </button>
            </div>
        </TicketSportsLayout>
    );
}
