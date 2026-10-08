import { MotionConfig } from "motion/react";
import { Route, Routes, useNavigate } from "react-router";
import "../styles/sports-week.css";
import { useFontesDaCampanha, useTemaFixo } from "../utils/use-campanha";
import { SwLayoutProvider } from "../components/SwLayout";
import { Calha, HeaderDaCampanha, PuloParaConteudo, usarAlvoDaCampanha } from "../components/Cromo";
import { BarraDeProgresso, WipeProvider } from "../components/Chrome";
import { WaveDefs } from "../components/SwBrand";
import { Home } from "./Home";
import { Eventos } from "./Eventos";
import { Modalidade } from "./Modalidade";

/**
 * Shell da campanha Sports Week.
 *
 * As três páginas vivem num sub-roteador próprio, registrado em App.tsx como
 * `/landing-pages/sports-week/*`. Isso permite a transição com wipe entre elas
 * sem mexer no `<Routes>` principal do app, que é plano e tem centenas de rotas.
 *
 * Não há moldura de protótipo: a LP ocupa a janela inteira, sem barra de
 * ferramentas, sem seletor de dispositivo e sem teto de largura, para ser lida
 * como o site de verdade. Quem quiser ver o mobile estreita a janela — a LP
 * responde por container query, então o layout acompanha de imediato.
 *
 * O `.sw-root` mora aqui e não em cada página: ele é o CONTAINER de consulta, e
 * um elemento não pode consultar o próprio container. As páginas são `.sw-pagina`,
 * descendentes, e é nelas que as variáveis responsivas são redefinidas por degrau.
 *
 * `reducedMotion="user"` desliga transform e layout em toda a subárvore quando o
 * sistema pede menos movimento, sem precisar tocar em cada componente.
 */
function Cromo() {
    const navigate = useNavigate();
    const alvo = usarAlvoDaCampanha();

    return (
        <>
            <PuloParaConteudo />
            <Calha />
            <HeaderDaCampanha alvoDoCountdown={alvo} onIrParaHome={() => navigate("/landing-pages/sports-week")} />
            <BarraDeProgresso />
        </>
    );
}

export function SportsWeek() {
    useFontesDaCampanha();
    useTemaFixo();

    return (
        <MotionConfig reducedMotion="user">
            <div className="sw-root relative">
                <WaveDefs />
                <SwLayoutProvider>
                    <WipeProvider>
                        <div className="sw-area">
                            <Cromo />
                            <main id="conteudo">
                                <Routes>
                                    <Route index element={<Home />} />
                                    <Route path="eventos" element={<Eventos />} />
                                    <Route path="modalidade/:slug" element={<Modalidade />} />
                                </Routes>
                            </main>
                        </div>
                    </WipeProvider>
                </SwLayoutProvider>
            </div>
        </MotionConfig>
    );
}
