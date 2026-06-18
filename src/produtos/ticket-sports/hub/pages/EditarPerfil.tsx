import { useRef, useState } from "react";
import { ArrowLeft, Camera01, Heart, LogOut01, Moon01, User01 } from "@untitledui/icons";
import { useNavigate } from "react-router";
import { cx } from "@/utils/cx";
import { useTheme } from "@/providers/theme-provider";
import { TicketSportsLayout } from "../../components/TicketSportsLayout";
import { getHubTheme, setHubTheme } from "../../components/use-light-theme";
import { Bloco } from "../components/Bloco";
import { HubButton, HubInput, HubTextarea, HubToggle } from "../components/hub-ui";
import { ATIVIDADES } from "../data/onboarding";

export function EditarPerfil() {
    const navigate = useNavigate();
    const [foto, setFoto] = useState<string | null>(null);
    const fotoRef = useRef<HTMLInputElement>(null);
    const [nome, setNome] = useState("William Campos");
    const [bio, setBio] = useState("Apaixonado por corrida e bons treinos. Bora juntos! 🏃");
    const [cidade, setCidade] = useState("São Paulo, SP");
    const [atividades, setAtividades] = useState<Set<string>>(new Set(["corrida", "academia"]));
    const [visivel, setVisivel] = useState(true);
    const { setTheme } = useTheme();
    const [noturno, setNoturno] = useState(getHubTheme() === "dark");

    const alternarNoturno = (on: boolean) => {
        setNoturno(on);
        const tema = on ? "dark" : "light";
        setHubTheme(tema);
        setTheme(tema); // aplica imediatamente em todo o app
    };

    const onArquivo = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => setFoto(reader.result as string);
        reader.readAsDataURL(file);
    };

    const toggleAtividade = (id: string) => {
        const next = new Set(atividades);
        next.has(id) ? next.delete(id) : next.add(id);
        setAtividades(next);
    };

    return (
        <TicketSportsLayout>
            <input ref={fotoRef} type="file" accept="image/*" hidden onChange={onArquivo} />

            <div className="flex flex-1 flex-col gap-5 px-6 pt-8">
                {/* Cabeçalho da página (fora de bloco) */}
                <div className="flex flex-col">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="flex w-max items-center gap-1.5 text-sm font-semibold text-[#7C3AED]"
                    >
                        <ArrowLeft className="size-4" />
                        Voltar
                    </button>
                    <h1 className="mt-2 text-display-xs font-bold text-primary">Editar perfil</h1>
                </div>

                {/* BLOCO: Foto e dados */}
                <Bloco icon={User01} titulo="Foto e dados">
                    <div className="flex flex-col items-center">
                        <button type="button" onClick={() => fotoRef.current?.click()} className="relative">
                            <span className="flex size-24 items-center justify-center overflow-hidden rounded-full bg-[#7C3AED] text-2xl font-bold text-white">
                                {foto ? <img src={foto} alt="Foto de perfil" className="size-full object-cover" /> : "W"}
                            </span>
                            <span className="absolute -bottom-0.5 -right-0.5 flex size-8 items-center justify-center rounded-full bg-primary text-[#7C3AED] ring-1 ring-border-secondary">
                                <Camera01 className="size-4" />
                            </span>
                        </button>
                        <button type="button" onClick={() => fotoRef.current?.click()} className="mt-3 text-sm font-semibold text-[#7C3AED]">
                            Alterar foto
                        </button>
                    </div>

                    <HubInput label="Nome" placeholder="Seu nome" value={nome} onChange={setNome} />
                    <HubTextarea label="Sobre mim" placeholder="Conte um pouco sobre você" value={bio} onChange={setBio} />
                    <HubInput label="Cidade" placeholder="Ex: São Paulo, SP" value={cidade} onChange={setCidade} />

                    <div className="rounded-xl border border-secondary bg-primary p-4">
                        <HubToggle checked={visivel} onChange={setVisivel} label="Deixar perfil visível para todos" />
                    </div>
                </Bloco>

                {/* BLOCO: Atividades favoritas */}
                <Bloco icon={Heart} titulo="Atividades favoritas">
                    <div className="flex flex-wrap gap-2">
                        {ATIVIDADES.map((a) => {
                            const sel = atividades.has(a.id);
                            return (
                                <button
                                    key={a.id}
                                    type="button"
                                    onClick={() => toggleAtividade(a.id)}
                                    className={cx(
                                        "flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition duration-100",
                                        sel ? "border-[#7C3AED] bg-[#7C3AED]/5 text-[#7C3AED]" : "border-secondary bg-primary text-secondary",
                                    )}
                                >
                                    <span className="text-base leading-none">{a.emoji}</span>
                                    {a.label}
                                </button>
                            );
                        })}
                    </div>
                </Bloco>

                {/* BLOCO: Aparência — versão noturna (vale para todo o app) */}
                <Bloco icon={Moon01} titulo="Aparência">
                    <div className="flex flex-col gap-2 rounded-xl border border-secondary bg-primary p-4">
                        <HubToggle checked={noturno} onChange={alternarNoturno} label="Versão noturna" />
                        <p className="text-xs text-tertiary">Ativa o tema escuro em todo o app.</p>
                    </div>
                </Bloco>

                {/* BLOCO: Conta */}
                <Bloco icon={LogOut01} titulo="Conta">
                    <button
                        type="button"
                        onClick={() => navigate("/ticket-sports/hub")}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-semibold text-error-primary ring-1 ring-border-secondary transition duration-100 hover:bg-secondary"
                    >
                        <LogOut01 className="size-5" /> Sair da conta
                    </button>
                </Bloco>
            </div>

            <div className="px-4 pb-8 pt-4">
                <HubButton onClick={() => navigate("/ticket-sports/hub/perfil")}>Salvar alterações</HubButton>
            </div>
        </TicketSportsLayout>
    );
}
