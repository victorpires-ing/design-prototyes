import { useEffect, useRef, useState } from "react";
import { PlusCircle, MinusCircle } from "@untitledui/icons";
import { GuiaMedidasModal } from "../components/GuiaMedidasModal";
import { PcdDetalhesModal } from "../components/PcdDetalhesModal";
import { ComoFuncionaModal } from "../components/ComoFuncionaModal";
import { InformacoesSection } from "../components/InformacoesSection";
import { AnimatedMosaic } from "../components/AnimatedMosaic";
import { Reveal } from "../components/Reveal";
import { InstagramIcon, FacebookIcon, TiktokIcon, YoutubeIcon } from "../components/SocialIcons";
import { FAQ_101 } from "../data/ss101";
import { HERO_MOSAIC_TOP, HERO_MOSAIC_LEFT_EDGE, HERO_MOSAIC_RIGHT } from "../data/hero-mosaics";
import { FAQ_MOSAIC, FOOTER_MOSAIC } from "../data/faq-footer-mosaics";
import logoTicketsportsColor from "../assets/logo-ticketsports-color.png";
import logoHeader from "../assets/logo-header.svg";
import heroLogoCrop from "../assets/hero-logo-crop.png";
import kitPhoto from "../assets/kit-photo.png";
import kitPhotoAzul from "../assets/kit-photo-azul.png";
import kitPhotoVerde from "../assets/kit-photo-verde.png";
import kitPhotoLaranja from "../assets/kit-photo-laranja.png";
import kitShape from "../assets/kit-shape.svg";
import kitBgMiddle from "../assets/kit-bg-middle.svg";
import kitBgLeft from "../assets/kit-bg-left.svg";
import kitBgRight from "../assets/kit-bg-right.svg";
import galeriaSalto from "../assets/galeria-salto.png";
import galeriaVeterana from "../assets/galeria-veterana.png";
import galeriaMedalhas from "../assets/galeria-medalhas.png";
import galeriaAmigosPreto from "../assets/galeria-amigos-preto.png";
import galeriaFantasia from "../assets/galeria-fantasia.png";
import galeriaPcd from "../assets/galeria-pcd.png";
import galeriaFlintstones from "../assets/galeria-flintstones.png";
import galeriaPodio from "../assets/galeria-podio.png";
import galeriaChegada from "../assets/galeria-chegada.png";

// ===== Design tokens — Manual de Marca São Silvestre 101 =====
const ACCENT = "#0099FF"; // Azul de destaque — eyebrows, "101", acentos
const BOTAO_PRIMARIO = "#0086FF"; // Azul específico dos botões primários (header, hero)
const HEADER_BG = "#171717"; // Fundo escuro do header
const ROXO = "#971AFE";
const AZUL_INSCRICAO = "#0070CC"; // Eyebrow "Inscreva-se agora" + card "Geral"
const LARANJA_INSCRICAO = "#C83000"; // Eyebrow + checkmarks do card "Inscrição PNE"
const LARANJA_INSCRICAO_BOTAO = "#FF2F01"; // Botão do card "Inscrição PNE"
const LARANJA_KIT = "#FE3800"; // Heading + setas do carrossel do Kit do atleta
const INK = "#0A0A0A";
const MIST = "#F4F4F5";
const LINE = "#E5E5E5";
const MUTED = "#525252";

const TITLE_FONT = "'Outfit', -apple-system, 'Segoe UI', Roboto, sans-serif";
const BODY_FONT = "'Work Sans', -apple-system, 'Segoe UI', Roboto, sans-serif";

const KIT_AUTOPLAY_MS = 4500;

const KIT_VARIANTES = [
    { nome: "Kit roxo", imagem: kitPhoto },
    { nome: "Kit azul", imagem: kitPhotoAzul },
    { nome: "Kit verde", imagem: kitPhotoVerde },
    { nome: "Kit laranja", imagem: kitPhotoLaranja },
];

// A peça da marca São Silvestre 101 é um retângulo com DUAS pontas bem arredondadas em cantos NÃO sequenciais
// (ou seja, na diagonal — tl+br ou tr+bl, nunca dois cantos vizinhos) e as outras duas com um arredondamento sutil.
type Diagonal = "tl-br" | "tr-bl";
function ssCornerRadius(diag: Diagonal) {
    const GRANDE = "64% 60%";
    const SUTIL = "7px"; // metade do valor anterior (14px) — bem mais discreto que o canto grande
    return diag === "tl-br"
        ? { borderTopLeftRadius: GRANDE, borderBottomRightRadius: GRANDE, borderTopRightRadius: SUTIL, borderBottomLeftRadius: SUTIL, overflow: "hidden" as const }
        : { borderTopRightRadius: GRANDE, borderBottomLeftRadius: GRANDE, borderTopLeftRadius: SUTIL, borderBottomRightRadius: SUTIL, overflow: "hidden" as const };
}

// Paths reais das 6 peças decorativas do "Kit do atleta" mobile (Figma node 2346:13940, frame "elementos"),
// normalizados em objectBoundingBox (0–1) para clip-path — border-radius percentual distorcia essas peças porque
// a maior parte de cada uma sangra fora da tela; o path exato evita esse problema.
const KIT_SHAPE_PATHS = {
    A: "M 0.00016 0.00203 L 0.44262 0.00141 C 0.51720 0.00133 0.66797 -0.00708 0.73464 0.01813 C 0.79666 0.04152 0.85339 0.09234 0.89861 0.16493 C 0.99927 0.32745 0.99992 0.49849 0.99996 0.70966 L 1.00000 0.99805 L 0.46483 0.99994 C 0.32682 1.00026 0.20698 1.00399 0.10155 0.83137 C 0.00101 0.66681 0.00008 0.49696 0.00000 0.28346 L 0.00016 0.00203 Z",
    B: "M 0.55983 0.00015 L 0.99814 0.00000 C 1.00247 0.13629 0.99535 0.28100 0.99828 0.41814 C 0.99981 0.49035 1.00487 0.67019 0.98516 0.73095 C 0.96677 0.78794 0.92541 0.84096 0.86507 0.88485 C 0.75171 0.96666 0.61870 0.99268 0.45319 0.99933 L 0.00102 1.00000 L 0.00136 0.55589 C 0.00116 0.47989 -0.00664 0.32745 0.01747 0.25995 C 0.03792 0.20206 0.08241 0.14867 0.14642 0.10528 C 0.26231 0.02727 0.39618 0.00313 0.55983 0.00015 Z",
    C: "M 0.48627 0.00306 C 0.65725 -0.00035 0.82816 -0.00091 0.99913 0.00139 L 1.00000 0.31519 C 1.00053 0.98679 0.80201 1.00260 0.50802 0.99960 C 0.33911 1.00066 0.17020 0.99962 0.00129 0.99647 C -0.00098 0.47854 -0.02906 0.00967 0.35305 0.00552 C 0.39635 0.00506 0.44264 0.00359 0.48627 0.00306 Z",
    D: "M 0.00253 0.00031 C 0.22223 0.00144 0.44407 -0.00294 0.66364 0.00423 C 1.02871 0.01615 1.00357 0.50036 0.99706 0.99363 C 0.97538 0.99753 0.93734 0.99779 0.91487 0.99812 L 0.52047 0.99715 C 0.42737 0.99705 0.30189 1.01297 0.21359 0.97062 C -0.03511 0.85134 0.00133 0.36786 0.00253 0.00031 Z",
    E: "M 0.54943 0.00172 L 0.97459 0.00000 C 0.97124 0.32764 1.17178 0.92561 0.49814 0.99934 C 0.34470 1.00066 0.18748 0.99958 0.03383 0.99963 C 0.02525 0.64855 -0.18325 0.07291 0.54943 0.00172 Z",
    F: "M 0.56829 0.00085 C 0.69401 -0.00131 0.84043 0.00126 0.96793 0.00186 C 0.96193 0.33493 1.19914 0.90233 0.46770 0.99080 C 0.33041 0.99870 0.15684 0.99836 0.01576 1.00000 C 0.01153 0.88041 0.00708 0.75958 0.00664 0.64010 C 0.00553 0.35299 -0.09950 0.05785 0.56829 0.00085 Z",
};

// As 3 peças coloridas visíveis no canto superior esquerdo do FAQ mobile (Figma node 2311:3050 > Group
// 1000005778, node 2356:15058) — o grupo tem 28 peças e está rotacionado -90°, mas só estas 3 aparecem dentro do
// clip do frame (390px de largura). Paths extraídos via absoluteTransform do Figma e normalizados em
// objectBoundingBox por peça, já no espaço final (pós-rotação), então nenhuma rotação é aplicada aqui.
const FAQ_MOBILE_SHAPE_PATHS = {
    blue: "M 0.997177 0.001350 C 0.984412 0.196221 1.001993 0.412212 0.999810 0.608245 C 0.995218 1.020543 0.589418 1.001541 0.003609 0.999217 C -0.004190 0.791906 0.003434 0.579468 0.001138 0.372568 C -0.003292 -0.025718 0.464649 -0.001863 0.997177 0.001350 Z",
    green: "M 0.000766 0.004349 L 0.441214 0.003959 C 0.637635 0.003075 0.947681 -0.070719 0.992626 0.459798 C 0.999582 0.542223 1.004357 0.925686 0.993990 0.993862 C 0.796137 0.992345 0.589826 1.001720 0.392109 0.999718 C -0.023650 0.995516 -0.001075 0.576914 0.000766 0.004349 Z",
    orange: "M 0.998074 0.011301 C 0.998911 0.077301 0.999527 0.143301 0.999934 0.209301 C 1.002668 0.701044 0.921779 1.000650 0.610464 0.999999 C 0.408025 0.999348 0.203873 0.990012 0.001347 0.983499 C 0.002148 0.699308 -0.021761 0.380162 0.102794 0.157412 C 0.220378 -0.052963 0.421414 0.008695 0.574854 0.007609 C 0.715891 0.006524 0.857234 0.010433 0.998074 0.011301 Z",
};

const FAQ_MOBILE_SHAPES = [
    { key: "blue" as const, left: -48.726334708080685, top: 3.4462863757544255, width: 61.465592520580685, height: 112.20446283078854, color: "#009cfe" },
    { key: "green" as const, left: 17.548828125, top: 2.71484375, width: 112.45098876953125, height: 61.683738708496094, color: "#00eb6d" },
    { key: "orange" as const, left: 132.73349989019516, top: 3.0976535282443365, width: 62.26650010980484, height: 35.32558713337676, color: "#fe3800" },
];

// As 10 peças do mosaico visíveis no canto superior direito do footer mobile (Figma node
// "Footer (Multi-Date Ticket Selection Flow)" 2356:14984 > Group 1000005772, sem rotação), exportado pelo
// usuário como referência (footer.svg, 390x496). Paths extraídos via absoluteTransform e normalizados em
// objectBoundingBox por peça, coordenadas já relativas ao frame de 390px.
const FOOTER_MOBILE_SHAPE_PATHS = {
    piece1: "M 0.000162 0.002031 L 0.442623 0.001410 C 0.517201 0.001331 0.667972 -0.007083 0.734636 0.018133 C 0.796656 0.041524 0.853387 0.092343 0.898611 0.164929 C 0.999273 0.327448 0.999919 0.498492 0.999960 0.709657 L 1.000000 0.998047 L 0.464831 0.999945 C 0.326819 1.000259 0.206977 1.003988 0.101551 0.831367 C 0.001010 0.666807 0.000081 0.496961 0.000000 0.283460 L 0.000162 0.002031 Z",
    piece2: "M 0.000889 0.003727 C 0.213108 0.004662 0.425062 -0.000077 0.637681 0.000210 C 0.739703 -0.003146 0.842789 0.032850 0.916498 0.176709 C 0.975451 0.291843 0.994660 0.442486 0.998116 0.597707 C 1.001173 0.731264 0.999777 0.864521 0.998980 0.997990 L 0.545163 0.999461 C 0.479895 0.999598 0.412434 1.000708 0.347233 0.999274 C -0.029286 0.990967 -0.000108 0.514827 0.000889 0.003727 Z",
    piece3: "M 0.001837 0.006047 L 0.459947 0.004538 C 0.635069 0.003460 0.860368 -0.055525 0.957400 0.285421 C 1.001995 0.442129 1.006249 0.815735 0.994219 0.995756 C 0.779022 0.993263 0.560700 1.004271 0.345503 0.998088 C -0.027870 0.987341 -0.002084 0.518912 0.001837 0.006047 Z",
    piece4: "M 0.000766 0.004349 L 0.441214 0.003959 C 0.637635 0.003075 0.947681 -0.070719 0.992626 0.459798 C 0.999582 0.542223 1.004357 0.925686 0.993990 0.993862 C 0.796137 0.992345 0.589826 1.001720 0.392109 0.999718 C -0.023650 0.995516 -0.001075 0.576914 0.000766 0.004349 Z",
    piece5: "M 0.001350 0.002823 C 0.196221 0.015588 0.412212 -0.001993 0.608245 0.000190 C 1.020543 0.004782 1.001541 0.410582 0.999217 0.996391 C 0.791906 1.004190 0.579468 0.996566 0.372568 0.998862 C -0.025718 1.003292 -0.001863 0.535351 0.001350 0.002823 Z",
    piece6: "M 0.489082 0.003697 C 0.633137 -0.001936 0.830298 0.000689 0.978222 0.000174 C 0.989187 0.224211 1.018213 0.480008 0.983382 0.703138 C 0.960591 0.849193 0.794176 0.942181 0.560894 0.989321 C 0.362873 1.002340 0.227848 1.000573 0.030472 0.998706 C 0.024022 0.680708 -0.166064 0.090999 0.489082 0.003697 Z",
    piece7: "M 0.481313 0.004640 C 0.625982 -0.001983 0.822212 0.000572 0.971142 0.000125 C 0.975829 0.332305 1.162046 0.889224 0.524778 0.996045 C 0.369030 1.000301 0.187075 0.998895 0.029196 1.000000 C 0.027279 0.672556 -0.168739 0.100470 0.481313 0.004640 Z",
    piece8: "M 0.568285 0.000847 C 0.694010 -0.001311 0.840429 0.001264 0.967934 0.001865 C 0.961926 0.334928 1.199135 0.902330 0.467705 0.990802 C 0.330409 0.998700 0.156840 0.998357 0.015761 1.000000 C 0.011533 0.880415 0.007085 0.759579 0.006640 0.640104 C 0.005527 0.352993 -0.099503 0.057850 0.568285 0.000847 Z",
    piece9: "M 0.498531 0.004558 C 0.634848 -0.001903 0.831974 0.000553 0.972968 0.000081 C 0.962499 0.339085 1.186130 0.867695 0.505214 0.994723 C 0.338604 1.002117 0.171104 0.999841 0.003826 0.999011 C 0.006499 0.835199 -0.001521 0.668142 0.000261 0.504154 C 0.002934 0.263039 0.028772 0.078464 0.498531 0.004558 Z",
    piece10: "M 0.666239 0.000841 L 0.976782 0.000000 C 0.957987 0.367510 1.213457 0.936089 0.389573 0.999762 L 0.023958 1.000000 C 0.021335 0.635514 -0.185619 0.026297 0.666239 0.000841 Z",
};

const FOOTER_MOBILE_SHAPES = [
    { key: "piece1" as const, left: 293.87890625, top: 103.736328125, width: 153.2241973876953, height: 94.5633773803711, color: "#00eb6d" },
    { key: "piece2" as const, left: 293.9755859375, top: 50.87890625, width: 93.08595275878906, height: 49.60625457763672, color: "#fe3800" },
    { key: "piece3" as const, left: 294.0478515625, top: -1.4921875, width: 93.09163665771484, height: 49.62903594970703, color: "#fe3800" },
    { key: "piece4" as const, left: 200.24609375, top: -1.4453125, width: 90.71416473388672, height: 49.7602424621582, color: "#971afe" },
    { key: "piece5" as const, left: 200.3349609375, top: 50.90234375, width: 90.5152816772461, height: 49.58426284790039, color: "#0099ff" },
    { key: "piece6" as const, left: 138.3798828125, top: -1.20703125, width: 28.775306701660156, height: 49.37702560424805, color: "#00eb6d" },
    { key: "piece7" as const, left: 168.0634765625, top: -1.2421875, width: 29.037939071655273, height: 49.27904510498047, color: "#fe3800" },
    { key: "piece8" as const, left: 389.6962890625, top: 200.7578125, width: 27.803421020507812, height: 50.45022201538086, color: "#fe3800" },
    { key: "piece9" as const, left: 389.669921875, top: -1.228515625, width: 27.776212692260742, height: 49.1991081237793, color: "#971afe" },
    { key: "piece10" as const, left: 389.060546875, top: 51.060546875, width: 28.31041717529297, height: 49.314208984375, color: "#00eb6d" },
];

// Mosaico da galeria: cada peça encaixa exatamente no grid (16 colunas x 2 linhas em desktop, sem sobras), como no
// grafismo de marca. Intercala fotos com blocos de cor sólida usando as mesmas cores já aplicadas na página.
// É mais largo que a viewport de propósito — vira uma faixa que desliza para a esquerda conforme a página rola,
// revelando as colunas 9–16 que ficam escondidas na primeira visualização.
const GALERIA_MOSAICO = [
    { tipo: "foto" as const, src: galeriaSalto, alt: "Corredora saltando de alegria com a medalha da São Silvestre", diag: "tl-br" as Diagonal, col: "1 / 3", row: "1 / 3" },
    { tipo: "cor" as const, cor: ROXO, diag: "tr-bl" as Diagonal, col: "3 / 4", row: "1 / 2" },
    { tipo: "cor" as const, cor: LARANJA_KIT, diag: "tl-br" as Diagonal, col: "3 / 4", row: "2 / 3" },
    { tipo: "foto" as const, src: galeriaVeterana, alt: "Corredora veterana erguendo os braços na chegada", diag: "tr-bl" as Diagonal, col: "4 / 6", row: "1 / 2" },
    { tipo: "foto" as const, src: galeriaMedalhas, alt: "Casal exibindo as medalhas de finisher da 100ª São Silvestre", diag: "tl-br" as Diagonal, col: "4 / 6", row: "2 / 3" },
    { tipo: "foto" as const, src: galeriaAmigosPreto, alt: "Amigos comemorando no arco de chegada", diag: "tr-bl" as Diagonal, col: "6 / 8", row: "1 / 3" },
    { tipo: "cor" as const, cor: ACCENT, diag: "tl-br" as Diagonal, col: "8 / 9", row: "1 / 2" },
    { tipo: "cor" as const, cor: BOTAO_PRIMARIO, diag: "tr-bl" as Diagonal, col: "8 / 9", row: "2 / 3" },
    { tipo: "foto" as const, src: galeriaFantasia, alt: "Trio fantasiado comemorando sob o arco da prova", diag: "tl-br" as Diagonal, col: "9 / 11", row: "1 / 3" },
    { tipo: "cor" as const, cor: AZUL_INSCRICAO, diag: "tr-bl" as Diagonal, col: "11 / 12", row: "1 / 2" },
    { tipo: "foto" as const, src: galeriaPcd, alt: "Participante da categoria PCD em cadeira adaptada, com plumas coloridas", diag: "tl-br" as Diagonal, col: "11 / 12", row: "2 / 3" },
    { tipo: "foto" as const, src: galeriaFlintstones, alt: "Corredores fantasiados dos Flintstones sorrindo durante a prova", diag: "tr-bl" as Diagonal, col: "12 / 14", row: "1 / 2" },
    { tipo: "cor" as const, cor: LARANJA_INSCRICAO, diag: "tl-br" as Diagonal, col: "12 / 14", row: "2 / 3" },
    { tipo: "foto" as const, src: galeriaPodio, alt: "Atleta comemorando no pódio com champagne e coroa de louros", diag: "tr-bl" as Diagonal, col: "14 / 16", row: "1 / 3" },
    { tipo: "foto" as const, src: galeriaChegada, alt: "Corredora gritando de emoção ao cruzar o arco de chegada", diag: "tl-br" as Diagonal, col: "16 / 17", row: "1 / 2" },
    { tipo: "cor" as const, cor: ROXO, diag: "tr-bl" as Diagonal, col: "16 / 17", row: "2 / 3" },
];

// As 9 fotos disponíveis, usadas para substituir os blocos de cor sólida na versão mobile (100% imagens, sem cor).
const GALERIA_FOTOS_LIST = [
    { src: galeriaSalto, alt: "Corredora saltando de alegria com a medalha da São Silvestre" },
    { src: galeriaVeterana, alt: "Corredora veterana erguendo os braços na chegada" },
    { src: galeriaMedalhas, alt: "Casal exibindo as medalhas de finisher da 100ª São Silvestre" },
    { src: galeriaAmigosPreto, alt: "Amigos comemorando no arco de chegada" },
    { src: galeriaFantasia, alt: "Trio fantasiado comemorando sob o arco da prova" },
    { src: galeriaPcd, alt: "Participante da categoria PCD em cadeira adaptada, com plumas coloridas" },
    { src: galeriaFlintstones, alt: "Corredores fantasiados dos Flintstones sorrindo durante a prova" },
    { src: galeriaPodio, alt: "Atleta comemorando no pódio com champagne e coroa de louros" },
    { src: galeriaChegada, alt: "Corredora gritando de emoção ao cruzar o arco de chegada" },
];

// Versão mobile do mosaico: 100% fotos, sem cor e sem repetição — grid de 6 colunas x 2 linhas (12 unidades),
// uma peça grande (2x2) + 8 peças simples (1x1), usando cada uma das 9 fotos disponíveis exatamente uma vez.
const GALERIA_MOSAICO_MOBILE = [
    { tipo: "foto" as const, ...GALERIA_FOTOS_LIST[0], diag: "tl-br" as Diagonal, col: "1 / 3", row: "1 / 3" },
    { tipo: "foto" as const, ...GALERIA_FOTOS_LIST[1], diag: "tr-bl" as Diagonal, col: "3 / 4", row: "1 / 2" },
    { tipo: "foto" as const, ...GALERIA_FOTOS_LIST[2], diag: "tl-br" as Diagonal, col: "4 / 5", row: "1 / 2" },
    { tipo: "foto" as const, ...GALERIA_FOTOS_LIST[3], diag: "tr-bl" as Diagonal, col: "5 / 6", row: "1 / 2" },
    { tipo: "foto" as const, ...GALERIA_FOTOS_LIST[4], diag: "tl-br" as Diagonal, col: "6 / 7", row: "1 / 2" },
    { tipo: "foto" as const, ...GALERIA_FOTOS_LIST[5], diag: "tr-bl" as Diagonal, col: "3 / 4", row: "2 / 3" },
    { tipo: "foto" as const, ...GALERIA_FOTOS_LIST[6], diag: "tl-br" as Diagonal, col: "4 / 5", row: "2 / 3" },
    { tipo: "foto" as const, ...GALERIA_FOTOS_LIST[7], diag: "tr-bl" as Diagonal, col: "5 / 6", row: "2 / 3" },
    { tipo: "foto" as const, ...GALERIA_FOTOS_LIST[8], diag: "tl-br" as Diagonal, col: "6 / 7", row: "2 / 3" },
];

const NAV_LINKS = [
    { label: "Inscrições", href: "#inscricoes" },
    { label: "Kit do atleta", href: "#kit" },
    { label: "Informações gerais", href: "#informacoes" },
    { label: "Dúvidas", href: "#faq" },
    { label: "Sua inscrição", href: "#inscricoes" },
];

const INSCRICAO_CARDS = [
    {
        cor: AZUL_INSCRICAO,
        corBotao: BOTAO_PRIMARIO,
        eyebrow: "Aberta ao público",
        titulo: "Inscrição geral",
        texto: "Essa é pra quem quer garantir seu lugar na 10ª e viver os 15 km mais clássicos da Paulista, no seu ritmo.",
        cta: "Garantir minha vaga",
        ctaSecundario: "Acessar inscrição",
    },
    {
        cor: LARANJA_INSCRICAO,
        corBotao: LARANJA_INSCRICAO_BOTAO,
        eyebrow: "Todo mundo na pista",
        titulo: "Inscrição PCD gratuita",
        texto: "Categoria gratuita e adaptada com largada exclusiva, apoio dedicado e acessibilidade em todo o percurso.",
        cta: "Enviar documentação",
        ctaSecundario: "Detalhes e requisitos",
    },
    {
        cor: ROXO,
        corBotao: ROXO,
        eyebrow: "Pra correr junto",
        titulo: "Grupos e assessorias",
        texto: "Vai correr com a galera? Solicite vagas para grupos a partir de 20 pessoas. Receba a confirmação por e-mail em até 7 dias.",
        cta: "Inscrever meu grupo",
        ctaSecundario: "Como funciona?",
    },
];

/** Produto lp-ss → Home: recriação hifi da landing page da 101ª São Silvestre, a partir do handoff de design. */
export function Home() {
    const [menuAberto, setMenuAberto] = useState(false);
    const [faqAberto, setFaqAberto] = useState<number | null>(0);
    const [guideOpen, setGuideOpen] = useState(false);
    const [pcdModalOpen, setPcdModalOpen] = useState(false);
    const [comoFuncionaModalOpen, setComoFuncionaModalOpen] = useState(false);
    const [kitVisible, setKitVisible] = useState(false);
    const [kitIndex, setKitIndex] = useState(0);
    const [kitIndexSaindo, setKitIndexSaindo] = useState<number | null>(null);
    const kitSaidaTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const kitVariante = KIT_VARIANTES[kitIndex];
    const trocarKit = (novoIndex: number) => {
        setKitIndexSaindo(kitIndex);
        setKitIndex(novoIndex);
        if (kitSaidaTimeout.current) clearTimeout(kitSaidaTimeout.current);
        kitSaidaTimeout.current = setTimeout(() => setKitIndexSaindo(null), 450);
    };
    const proximoKit = () => trocarKit((kitIndex + 1) % KIT_VARIANTES.length);
    const anteriorKit = () => trocarKit((kitIndex - 1 + KIT_VARIANTES.length) % KIT_VARIANTES.length);
    const kitRef = useRef<HTMLElement>(null);

    // Usa a barra de rolagem padrão do navegador só nesta página, sem alterar o resto do app
    // (ver `html:not(.ss-native-scrollbar)` em src/styles/index.css).
    useEffect(() => {
        document.documentElement.classList.add("ss-native-scrollbar");
        return () => document.documentElement.classList.remove("ss-native-scrollbar");
    }, []);

    // Faixa do mosaico da galeria: desliza para a esquerda conforme a seção passa pela viewport durante o scroll,
    // revelando as colunas que ficam escondidas fora da tela na primeira visualização.
    const galeriaOuterRef = useRef<HTMLDivElement>(null);
    const galeriaTrackRef = useRef<HTMLDivElement>(null);
    const [galeriaTrackX, setGaleriaTrackX] = useState(0);

    // No mobile a galeria é 100% fotos (sem blocos de cor sólida) — troca o array conforme a largura da tela.
    const [galeriaMobile, setGaleriaMobile] = useState(false);
    useEffect(() => {
        const mq = window.matchMedia("(max-width: 767px)");
        const update = () => setGaleriaMobile(mq.matches);
        update();
        mq.addEventListener("change", update);
        return () => mq.removeEventListener("change", update);
    }, []);

    // Lightbox da galeria: clicar numa foto abre em tela cheia, com navegação entre as fotos.
    const [galeriaLightbox, setGaleriaLightbox] = useState<number | null>(null);
    const galeriaFotos = (galeriaMobile ? GALERIA_MOSAICO_MOBILE : GALERIA_MOSAICO).filter(
        (p): p is Extract<typeof p, { tipo: "foto" }> => p.tipo === "foto",
    );

    useEffect(() => {
        if (galeriaLightbox === null) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setGaleriaLightbox(null);
            if (e.key === "ArrowRight") setGaleriaLightbox((i) => (i === null ? i : (i + 1) % galeriaFotos.length));
            if (e.key === "ArrowLeft") setGaleriaLightbox((i) => (i === null ? i : (i - 1 + galeriaFotos.length) % galeriaFotos.length));
        };
        window.addEventListener("keydown", onKeyDown);
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            window.removeEventListener("keydown", onKeyDown);
            document.body.style.overflow = previousOverflow;
        };
    }, [galeriaLightbox, galeriaFotos.length]);

    useEffect(() => {
        const outer = galeriaOuterRef.current;
        const track = galeriaTrackRef.current;
        if (!outer || !track) return;
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        let raf = 0;
        const onScroll = () => {
            if (raf) return;
            raf = requestAnimationFrame(() => {
                raf = 0;
                const rect = outer.getBoundingClientRect();
                const vh = window.innerHeight || 1;
                // No mobile a faixa desliza um pouco mais rápido que no desktop (janela de scroll é mais curta).
                const VELOCIDADE = window.innerWidth < 768 ? 0.5 : 0.3;
                const progresso = Math.max(0, Math.min(1, (vh - rect.top) / (vh + rect.height)));
                const maxTranslate = Math.max(0, track.scrollWidth - outer.clientWidth);
                setGaleriaTrackX(-progresso * maxTranslate * VELOCIDADE);
            });
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll);
        onScroll();
        return () => {
            window.removeEventListener("scroll", onScroll);
            window.removeEventListener("resize", onScroll);
            if (raf) cancelAnimationFrame(raf);
        };
    }, []);

    // Autoplay do carrossel do Kit: avança sozinho enquanto visível; qualquer troca (manual ou automática) reinicia a contagem.
    useEffect(() => {
        if (!kitVisible) return;
        const t = setTimeout(proximoKit, KIT_AUTOPLAY_MS);
        return () => clearTimeout(t);
    }, [kitVisible, kitIndex]);

    // Dispara a animação de surgimento do Kit do atleta quando a seção entra na viewport.
    useEffect(() => {
        const el = kitRef.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setKitVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.15 },
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    // Grafismos coloridos do FAQ e do footer: mesmo efeito do hero (cada peça do mosaico surgindo individualmente),
    // mas só dispara quando a seção entra na viewport, já que ficam bem abaixo da dobra.
    const faqMosaicRef = useRef<HTMLDivElement>(null);
    const faqMosaicMobileRef = useRef<HTMLDivElement>(null);
    const [faqMosaicVisible, setFaqMosaicVisible] = useState(false);
    const footerMosaicRef = useRef<HTMLDivElement>(null);
    const [footerMosaicVisible, setFooterMosaicVisible] = useState(false);

    useEffect(() => {
        const targets = [
            { el: faqMosaicRef.current, set: setFaqMosaicVisible },
            { el: faqMosaicMobileRef.current, set: setFaqMosaicVisible },
            { el: footerMosaicRef.current, set: setFooterMosaicVisible },
        ];
        const observers = targets
            .filter((t): t is { el: HTMLDivElement; set: typeof setFaqMosaicVisible } => t.el !== null)
            .map(({ el, set }) => {
                const observer = new IntersectionObserver(
                    ([entry]) => {
                        if (entry.isIntersecting) {
                            set(true);
                            observer.disconnect();
                        }
                    },
                    { threshold: 0.15 },
                );
                observer.observe(el);
                return observer;
            });
        return () => observers.forEach((o) => o.disconnect());
    }, []);

    // Carrega as fontes da marca (Outfit + Work Sans) só nesta página, sem afetar o resto do app.
    useEffect(() => {
        const links = [
            Object.assign(document.createElement("link"), { rel: "preconnect", href: "https://fonts.googleapis.com" }),
            Object.assign(document.createElement("link"), { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" }),
            Object.assign(document.createElement("link"), {
                rel: "stylesheet",
                href: "https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Work+Sans:ital,wght@0,400;0,500;0,600;0,700;1,600&display=swap",
            }),
        ];
        links.forEach((l) => document.head.appendChild(l));
        return () => links.forEach((l) => l.remove());
    }, []);

    const scrollSuave = (e: React.MouseEvent, href: string) => {
        const el = document.querySelector(href);
        if (!el) return;
        e.preventDefault();
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        setMenuAberto(false);
    };

    return (
        <div className="min-h-dvh scroll-smooth bg-white" style={{ color: INK, fontFamily: BODY_FONT }}>
            <style>{`
                @keyframes ss-float { 0%,100% { transform: translateY(0) rotate(var(--ss-r,0deg)); } 50% { transform: translateY(-14px) rotate(var(--ss-r,0deg)); } }
                @keyframes ss-rise { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes ss-piece-in { from { opacity: 0; transform: scale(0.4); } to { opacity: 1; transform: scale(1); } }
                @keyframes ss-grow-in { from { opacity: 0; transform: scale(0.88); } to { opacity: 1; transform: scale(1); } }
                @keyframes ss-kit-fade-in { from { opacity: 0; } to { opacity: 1; } }
                @keyframes ss-kit-fade-out { from { opacity: 1; } to { opacity: 0; } }
                @keyframes ss-kit-progress { from { transform: scaleX(0); } to { transform: scaleX(1); } }
                @media (min-width: 768px) { .ss-hero-content { opacity: 0; animation: ss-rise 0.8s ease-out 0.4s both; } }
                @media (min-width: 768px) {
                    .ss-hero-outer { --hero-scale: clamp(0.55, calc(100vw / 1470px), 1.6); height: calc(672px * var(--hero-scale)); }
                    .ss-hero-stage {
                        position: absolute;
                        left: 50%;
                        top: 0;
                        width: 1470px;
                        height: 672px;
                        transform-origin: top center;
                        transform: translateX(-50%) scale(var(--hero-scale, 1));
                    }
                }
                @media (prefers-reduced-motion: reduce) { [style*="ss-float"], [style*="ss-rise"], [style*="ss-piece-in"], [style*="ss-grow-in"], [style*="ss-kit-fade"], [style*="ss-kit-progress"] { animation: none !important; } .ss-hero-content { opacity: 1 !important; animation: none !important; } }
                .ss-kit-mobile-outer {
                    position: relative;
                    overflow: hidden;
                    --kit-scale: clamp(0.78, calc(100vw / 390px), 1.3);
                    height: calc(808px * var(--kit-scale));
                }
                .ss-kit-mobile-stage {
                    position: absolute;
                    left: 50%;
                    top: 0;
                    width: 390px;
                    height: 808px;
                    transform-origin: top center;
                    transform: translateX(-50%) scale(var(--kit-scale, 1));
                }
            `}</style>

            {/* Peças decorativas reais do Kit do atleta mobile (Figma node 2346:13940), usadas como clip-path */}
            <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
                <defs>
                    {Object.entries(KIT_SHAPE_PATHS).map(([key, d]) => (
                        <clipPath key={key} id={`kitPiece${key}`} clipPathUnits="objectBoundingBox">
                            <path d={d} />
                        </clipPath>
                    ))}
                    {Object.entries(FAQ_MOBILE_SHAPE_PATHS).map(([key, d]) => (
                        <clipPath key={key} id={`faqMobilePiece${key}`} clipPathUnits="objectBoundingBox">
                            <path d={d} />
                        </clipPath>
                    ))}
                    {Object.entries(FOOTER_MOBILE_SHAPE_PATHS).map(([key, d]) => (
                        <clipPath key={key} id={`footerMobile${key}`} clipPathUnits="objectBoundingBox">
                            <path d={d} />
                        </clipPath>
                    ))}
                </defs>
            </svg>

            {/* ===== Nav ===== */}
            <header
                className="sticky top-0 z-50"
                style={{ backgroundColor: HEADER_BG, WebkitFontSmoothing: "antialiased", MozOsxFontSmoothing: "grayscale" }}
            >
                <div className="mx-auto flex max-w-[1240px] items-center justify-between gap-6 px-6 py-3.5">
                    <a href="#top" onClick={(e) => scrollSuave(e, "#top")}>
                        <img src={logoHeader} alt="Ticket Sports by Ingresse" className="h-9 w-auto" />
                    </a>
                    <div className="hidden items-center gap-7 lg:flex">
                        <nav className="flex gap-[26px]">
                            {NAV_LINKS.map((n) => (
                                <a key={n.label} href={n.href} onClick={(e) => scrollSuave(e, n.href)} className="text-base font-semibold text-white" style={{ fontFamily: BODY_FONT }}>
                                    {n.label}
                                </a>
                            ))}
                        </nav>
                        <a
                            href="#inscricoes"
                            onClick={(e) => scrollSuave(e, "#inscricoes")}
                            className="rounded-xl px-5 py-2.5 text-base font-bold text-white"
                            style={{ backgroundColor: BOTAO_PRIMARIO, fontFamily: TITLE_FONT }}
                        >
                            Inscreva-se
                        </a>
                    </div>
                    <button type="button" onClick={() => setMenuAberto((v) => !v)} aria-label="Menu" className="flex size-9 items-center justify-center rounded-lg lg:hidden">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
                            {menuAberto ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
                        </svg>
                    </button>
                </div>
                {menuAberto && (
                    <nav className="flex flex-col gap-1 border-t px-6 py-3 lg:hidden" style={{ borderColor: "#333" }}>
                        {NAV_LINKS.map((n) => (
                            <a key={n.label} href={n.href} onClick={(e) => scrollSuave(e, n.href)} className="rounded-lg px-2 py-2.5 text-sm font-semibold text-white">
                                {n.label}
                            </a>
                        ))}
                        <a href="#inscricoes" onClick={(e) => scrollSuave(e, "#inscricoes")} className="mt-1 rounded-lg px-2 py-2.5 text-sm font-bold text-white">
                            Inscreva-se
                        </a>
                    </nav>
                )}
            </header>


            {/* ===== Hero ===== */}
            <section id="top" className="relative overflow-hidden bg-white">
                {/*
                    O hero desktop é um "stage" fixo de 1470x672 (dimensão original do frame no Figma) que escala como um
                    todo via transform:scale(), com base na largura da viewport (--hero-scale). Assim grafismos e texto
                    mantêm exatamente a mesma posição relativa entre si em qualquer largura de tela — ampliando em monitores
                    maiores e reduzindo em telas menores — em vez de cada elemento ser reposicionado de forma independente.
                */}
                <div className="ss-hero-outer relative">
                    <div className="ss-hero-stage relative">
                        {/* Grafismo decorativo direito (Group 1000005778, rotate 180°) */}
                        <div className="pointer-events-none absolute hidden md:block" style={{ right: -93.7, top: -265.9, width: 938.4, height: 937.9 }}>
                            <div className="size-full" style={{ transform: "rotate(180deg)" }}>
                                <AnimatedMosaic viewBox={HERO_MOSAIC_RIGHT.viewBox} paths={HERO_MOSAIC_RIGHT.paths} baseDelay={0.5} />
                            </div>
                        </div>
                        {/* Grafismos decorativos superior/esquerda (rotate 90°) */}
                        <div className="pointer-events-none absolute hidden items-center justify-center md:flex" style={{ left: -374.8, top: -851.8, width: 979.3, height: 979.8 }}>
                            <div style={{ width: 979.8, height: 979.3, transform: "rotate(90deg)" }}>
                                <AnimatedMosaic viewBox={HERO_MOSAIC_TOP.viewBox} paths={HERO_MOSAIC_TOP.paths} baseDelay={0.1} />
                            </div>
                        </div>
                        <div className="pointer-events-none absolute hidden items-center justify-center md:flex" style={{ left: -944.7, top: 131, width: 979.2, height: 979.8 }}>
                            <div style={{ width: 979.8, height: 979.2, transform: "rotate(90deg)" }}>
                                <AnimatedMosaic viewBox={HERO_MOSAIC_LEFT_EDGE.viewBox} paths={HERO_MOSAIC_LEFT_EDGE.paths} baseDelay={0.3} />
                            </div>
                        </div>

                        {/* Grafismos decorativos mobile (node 2306:1569) — sangram pelo topo e pela lateral esquerda */}
                        <div className="pointer-events-none absolute flex items-center justify-center md:hidden" style={{ left: -247.9, top: -539.98, width: 620.74, height: 621.13 }}>
                            <div style={{ width: 621.13, height: 620.74, transform: "rotate(90deg)" }}>
                                <AnimatedMosaic viewBox={HERO_MOSAIC_TOP.viewBox} paths={HERO_MOSAIC_TOP.paths} baseDelay={0.1} />
                            </div>
                        </div>
                        <div className="pointer-events-none absolute flex items-center justify-center md:hidden" style={{ left: -609.21, top: 83.05, width: 620.67, height: 621.13 }}>
                            <div style={{ width: 621.13, height: 620.67, transform: "rotate(90deg)" }}>
                                <AnimatedMosaic viewBox={HERO_MOSAIC_LEFT_EDGE.viewBox} paths={HERO_MOSAIC_LEFT_EDGE.paths} baseDelay={0.3} />
                            </div>
                        </div>

                        <div className="ss-hero-content relative z-10 mx-auto flex max-w-[694px] flex-col items-center gap-8 px-6 pt-40 pb-24 text-center md:absolute md:left-[115px] md:top-[203px] md:mx-0 md:max-w-none md:w-[694px] md:items-start md:gap-6 md:px-0 md:pt-0 md:pb-0 md:text-left">
                            <div
                                role="img"
                                aria-label="São Silvestre 101 — São Paulo, Brasil"
                                className="hidden md:block"
                                style={{
                                    width: 490,
                                    height: 167,
                                    backgroundImage: `url(${heroLogoCrop})`,
                                    backgroundSize: "990px auto",
                                    backgroundPosition: "-48px -144px",
                                    backgroundRepeat: "no-repeat",
                                }}
                            />
                            <div
                                role="img"
                                aria-label="São Silvestre 101 — São Paulo, Brasil"
                                className="md:hidden"
                                style={{
                                    width: 300,
                                    height: 300 * (167 / 490),
                                    backgroundImage: `url(${heroLogoCrop})`,
                                    backgroundSize: "606px auto",
                                    backgroundPosition: "-29px -88px",
                                    backgroundRepeat: "no-repeat",
                                }}
                            />

                            <div className="flex flex-col items-center gap-4 md:items-start md:gap-1">
                                <h1 className="text-[26px] leading-normal md:text-[30px]" style={{ fontFamily: TITLE_FONT, color: "#404040" }}>
                                    <span className="font-light">A primeira corrida dos</span> <span className="font-semibold">próximos 100 anos</span>
                                </h1>
                                <p className="max-w-[500px] text-lg leading-[1.5] md:max-w-[622px]" style={{ color: "#737373" }}>
                                    15 km pelo coração de São Paulo, na virada mais famosa do mundo. Garanta sua vaga até 20/11/2026 e faça parte desse próximo capítulo.
                                </p>
                            </div>

                            <a
                                href="#inscricoes"
                                onClick={(e) => scrollSuave(e, "#inscricoes")}
                                className="block w-full rounded-xl px-[34px] py-4 text-center text-base font-bold text-white shadow-[0_4px_10px_rgba(0,153,255,0.5)] transition-shadow duration-150 ease-linear hover:shadow-[0_6px_24px_rgba(0,153,255,0.85)] md:inline-block md:w-fit"
                                style={{ backgroundColor: BOTAO_PRIMARIO, fontFamily: TITLE_FONT }}
                            >
                                Garanta sua inscrição
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== Inscrições ===== */}
            <section id="inscricoes" className="relative overflow-hidden">
                <div className="relative mx-auto max-w-[1240px] px-6 pt-[72px] pb-9 md:pb-[72px]">
                    <div className="max-w-[640px]">
                        <div className="text-sm font-bold tracking-[2px] uppercase" style={{ fontFamily: TITLE_FONT, color: AZUL_INSCRICAO }}>
                            Inscreva-se agora
                        </div>
                        <h2 className="mt-3 text-2xl leading-[0.98] tracking-[-1px] uppercase md:text-[48px] md:tracking-[-1.5px]" style={{ fontFamily: TITLE_FONT, fontWeight: 900 }}>
                            Com seu jeito de correr
                        </h2>
                        <p className="mt-4 text-lg leading-[1.5]" style={{ color: MUTED }}>
                            Individual, adaptada ou em turma: Escolha como quer virar o ano correndo.
                        </p>
                    </div>

                    <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
                        {INSCRICAO_CARDS.map((c, i) => (
                            <Reveal key={c.titulo} delay={i * 0.12} className="h-full">
                                <div
                                    className="relative flex h-full flex-col overflow-hidden rounded-3xl p-8 transition duration-200 ease-out hover:-translate-y-1.5 hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)]"
                                    style={{ backgroundColor: "#fff", border: `1px solid ${LINE}` }}
                                >
                                    <div className="text-sm font-bold tracking-[1.5px] uppercase" style={{ fontFamily: TITLE_FONT, color: c.cor }}>
                                        {c.eyebrow}
                                    </div>
                                    <h3 className="mt-2.5 text-[28px] font-extrabold" style={{ fontFamily: TITLE_FONT }}>
                                        {c.titulo}
                                    </h3>
                                    <p className="mt-3 mb-[26px] text-base leading-[1.45]" style={{ color: MUTED }}>
                                        {c.texto}
                                    </p>
                                    <div className="mt-auto flex flex-col gap-2">
                                        {c.titulo === "Grupos e assessorias" ? (
                                            <button
                                                type="button"
                                                disabled
                                                aria-disabled="true"
                                                className="block cursor-not-allowed rounded-[11px] py-3.5 text-center text-base font-semibold"
                                                style={{ backgroundColor: "#EEECF0", color: "#8A878C", fontFamily: TITLE_FONT }}
                                            >
                                                Em breve
                                            </button>
                                        ) : (
                                            <a href="#" className="block rounded-[11px] py-3.5 text-center text-base font-semibold" style={{ backgroundColor: c.corBotao, color: "#fff", fontFamily: TITLE_FONT }}>
                                                {c.cta}
                                            </a>
                                        )}
                                        {c.titulo === "Inscrição PCD gratuita" || c.titulo === "Grupos e assessorias" ? (
                                            <button
                                                type="button"
                                                onClick={() => (c.titulo === "Inscrição PCD gratuita" ? setPcdModalOpen(true) : setComoFuncionaModalOpen(true))}
                                                className="block rounded-[11px] py-3.5 text-center text-base font-semibold"
                                                style={{ border: `1px solid ${c.corBotao}`, color: c.corBotao, fontFamily: TITLE_FONT }}
                                            >
                                                {c.ctaSecundario}
                                            </button>
                                        ) : (
                                            <a
                                                href="#"
                                                className="block rounded-[11px] py-3.5 text-center text-base font-semibold"
                                                style={{ border: `1px solid ${c.corBotao}`, color: c.corBotao, fontFamily: TITLE_FONT }}
                                            >
                                                {c.ctaSecundario}
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== Kit do atleta ===== */}
            <section id="kit" ref={kitRef} className="relative overflow-hidden bg-white">
                <div className="relative mx-auto md:h-[742px]" style={{ maxWidth: 1240 }}>
                    {/* Grafismos decorativos — só no desktop, calculados a partir do node 2188:21916 */}
                    <div className="pointer-events-none absolute hidden md:block" style={{ left: 49.4, top: -297.3, width: 1262.2, height: 1261.5 }}>
                        <img src={kitBgMiddle} alt="" className="block size-full" />
                    </div>
                    <div className="pointer-events-none absolute hidden items-center justify-center md:flex" style={{ left: -1221.8, top: -298.6, width: 1261.5, height: 1262.2 }}>
                        <div style={{ width: 1262.2, height: 1261.5, transform: "rotate(-90deg)" }}>
                            <img src={kitBgLeft} alt="" className="block size-full" />
                        </div>
                    </div>
                    <img
                        src={kitBgRight}
                        alt=""
                        className="pointer-events-none absolute hidden md:block"
                        style={{ left: 1320.9, top: -298.3, width: 1262.2, height: 1261.6, transform: "rotate(180deg)" }}
                    />

                    {/* Layout mobile — "stage" fixo de 390x856 (frame do Figma 2346:13940) que escala como um todo
                        conforme a largura da tela, igual à técnica do hero desktop. Como texto e grafismos escalam
                        juntos, mantendo sempre a mesma posição relativa entre si, nunca se sobrepõem em nenhuma tela. */}
                    <div className="md:hidden" style={{ opacity: kitVisible ? 1 : 0, animation: kitVisible ? "ss-rise 0.7s ease-out both" : undefined }}>
                        <div className="ss-kit-mobile-outer">
                            <div className="ss-kit-mobile-stage">
                                <div className="absolute px-6" style={{ left: 0, top: 0, width: 390 }}>
                                    <div className="text-sm font-bold tracking-[2px] uppercase" style={{ fontFamily: TITLE_FONT, color: "#171717" }}>
                                        Kit do atleta
                                    </div>
                                    <h2 className="mt-3 text-2xl leading-[1.5] tracking-[-1.5px] uppercase" style={{ fontFamily: TITLE_FONT, fontWeight: 900, color: LARANJA_KIT }}>
                                        Tudo que você veste pra virar o ano correndo
                                    </h2>
                                    <p className="mt-4 text-lg leading-[1.5]" style={{ color: MUTED }}>
                                        Retirada na Expo São Silvestre, nos dias que antecedem a prova. Endereço e horários chegam no seu e-mail.
                                    </p>
                                </div>

                                {/* Grafismos decorativos — path exato de cada peça (Figma 2356:15146). O grupo "elementos" no Figma
                                    tem clipsContent:true (258–686px de altura): a peça roxa, por exemplo, começa bem mais acima
                                    (y=105) mas fica cortada até a moldura — por isso as peças vivem dentro deste contêiner com
                                    overflow:hidden nas mesmas dimensões exatas da moldura, reproduzindo esse corte. */}
                                <div className="pointer-events-none absolute overflow-hidden" style={{ left: -167, top: 258, width: 724, height: 428 }}>
                                    <div className="absolute" style={{ left: -0.39, top: 0.09, width: 444.61, height: 274.39, backgroundColor: LARANJA_KIT, clipPath: "url(#kitPieceA)" }} />
                                    <div className="absolute" style={{ left: 454.57, top: -152.68, width: 269.54, height: 426.6, backgroundColor: ROXO, clipPath: "url(#kitPieceB)" }} />
                                    <div className="absolute" style={{ left: -0.02, top: 281.39, width: 269.11, height: 146.39, backgroundColor: "#00EB6D", clipPath: "url(#kitPieceC)" }} />
                                    <div className="absolute" style={{ left: 454.13, top: 281.29, width: 269.97, height: 145.97, backgroundColor: LARANJA_KIT, clipPath: "url(#kitPieceD)" }} />
                                    <div className="absolute" style={{ left: 360.62, top: 281.42, width: 85.76, height: 145.25, backgroundColor: ROXO, clipPath: "url(#kitPieceE)" }} />
                                    <div className="absolute" style={{ left: 277.64, top: 281.62, width: 80.68, height: 146.39, backgroundColor: "#00EB6D", clipPath: "url(#kitPieceF)" }} />
                                </div>

                                <div className="absolute" style={{ left: 26, top: 257.27, width: 321, height: 397 }}>
                                    <img src={kitShape} alt="" aria-hidden="true" className="pointer-events-none absolute" style={{ left: 23.41, top: -6, width: 291.18, height: 448.98 }} />
                                    <img
                                        src={kitVariante.imagem}
                                        alt="Kit oficial: camiseta, número com chip, medalha de finisher e mochila"
                                        className="absolute inset-0 m-auto transition-opacity duration-200 ease-in-out"
                                        style={{ width: 321, height: "auto" }}
                                    />
                                </div>

                                <button
                                    type="button"
                                    onClick={anteriorKit}
                                    aria-label="Item anterior do kit"
                                    className="absolute flex size-10 items-center justify-center rounded-2xl bg-white"
                                    style={{ left: 24, top: 455.77, border: `1px solid ${LINE}` }}
                                >
                                    <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
                                        <path d="M7 13L1 7L7 1" stroke={LARANJA_KIT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </button>
                                <button
                                    type="button"
                                    onClick={proximoKit}
                                    aria-label="Próximo item do kit"
                                    className="absolute flex size-10 items-center justify-center rounded-2xl bg-white"
                                    style={{ left: 326, top: 455.77, border: `1px solid ${LINE}` }}
                                >
                                    <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
                                        <path d="M1 13L7 7L1 1" stroke={LARANJA_KIT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </button>

                                <div className="absolute" style={{ left: 95, top: 690, width: 200 }}>
                                    <div className="flex gap-1.5">
                                        {KIT_VARIANTES.map((v, i) => (
                                            <div key={v.nome} className="h-1 flex-1 overflow-hidden rounded-full" style={{ backgroundColor: LINE }}>
                                                <div
                                                    className="h-full origin-left rounded-full"
                                                    style={{
                                                        backgroundColor: LARANJA_KIT,
                                                        transform: i < kitIndex ? "scaleX(1)" : "scaleX(0)",
                                                        animation: i === kitIndex ? `ss-kit-progress ${KIT_AUTOPLAY_MS}ms linear both` : undefined,
                                                    }}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setGuideOpen(true)}
                                    className="absolute flex items-center justify-center gap-2 rounded-xl py-3.5 text-base font-bold"
                                    style={{ left: 25, top: 716, width: 341, color: INK, backgroundColor: "#fff", fontFamily: TITLE_FONT, boxShadow: `0 0 0 1.5px ${LINE} inset` }}
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.8">
                                        <path d="M3 6v12M21 6v12M7 9v6M11 10v4M15 9v6M19 10v4" />
                                    </svg>
                                    Guia de medidas
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Layout desktop — posicionamento absoluto igual ao Figma */}
                    <div className="hidden md:block">
                        <div
                            className="absolute top-1/2 left-0 -translate-y-1/2 transition-opacity duration-700 ease-out"
                            style={{ width: 511, opacity: kitVisible ? 1 : 0 }}
                        >
                            <div className="text-sm font-bold tracking-[2px] uppercase" style={{ fontFamily: TITLE_FONT, color: "#171717" }}>
                                Kit do atleta
                            </div>
                            <h2 className="mt-3 text-[48px] leading-[0.98] tracking-[-1.5px] uppercase" style={{ fontFamily: TITLE_FONT, fontWeight: 900, color: LARANJA_KIT }}>
                                Tudo que você
                                <br />
                                veste pra virar
                                <br />o ano correndo
                            </h2>
                            <p className="mt-[18px] text-lg leading-[1.5]" style={{ color: MUTED }}>
                                Retirada na Expo São Silvestre, nos dias que antecedem a prova. Endereço e horários chegam no seu e-mail.
                            </p>
                            <button
                                type="button"
                                onClick={() => setGuideOpen(true)}
                                className="mt-[26px] inline-flex items-center gap-2 rounded-xl px-[27px] py-[15px] text-base font-bold"
                                style={{ color: INK, backgroundColor: "#fff", fontFamily: TITLE_FONT, boxShadow: `0 0 0 1px ${LINE} inset` }}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.8">
                                    <path d="M3 6v12M21 6v12M7 9v6M11 10v4M15 9v6M19 10v4" />
                                </svg>
                                Guia de medidas
                            </button>
                        </div>

                        <div
                            className="absolute"
                            style={{
                                left: 567.2,
                                top: 71.4,
                                width: 624.8,
                                height: 597.5,
                                opacity: kitVisible ? 1 : 0,
                                animation: kitVisible ? "ss-rise 0.8s ease-out 0.15s both" : undefined,
                            }}
                        >
                            <img src={kitShape} alt="" aria-hidden="true" className="absolute" style={{ left: 244.8, top: 0, width: 380, height: 597.5 }} />
                            {kitIndexSaindo !== null && (
                                <img
                                    src={KIT_VARIANTES[kitIndexSaindo].imagem}
                                    alt=""
                                    aria-hidden="true"
                                    className="absolute"
                                    style={{
                                        left: 191.5,
                                        top: 0,
                                        width: 410.7,
                                        height: 508.5,
                                        animation: "ss-kit-fade-out 0.45s ease-in-out both",
                                    }}
                                />
                            )}
                            <img
                                key={kitIndex}
                                src={kitVariante.imagem}
                                alt="Kit oficial: camiseta, número com chip, medalha de finisher e mochila"
                                className="absolute"
                                style={{
                                    left: 191.5,
                                    top: 0,
                                    width: 410.7,
                                    height: 508.5,
                                    animation: kitIndexSaindo !== null ? "ss-kit-fade-in 0.45s ease-in-out both" : undefined,
                                }}
                            />
                            <div className="absolute flex gap-1.5" style={{ left: 381.8, top: 518, width: 106 }}>
                                {KIT_VARIANTES.map((v, i) => (
                                    <div key={v.nome} className="h-1 flex-1 overflow-hidden rounded-full" style={{ backgroundColor: LINE }}>
                                        <div
                                            className="h-full origin-left rounded-full"
                                            style={{
                                                backgroundColor: LARANJA_KIT,
                                                transform: i < kitIndex ? "scaleX(1)" : "scaleX(0)",
                                                animation: i === kitIndex ? `ss-kit-progress ${KIT_AUTOPLAY_MS}ms linear both` : undefined,
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                            <button
                                type="button"
                                onClick={proximoKit}
                                aria-label="Próximo item do kit"
                                className="absolute flex items-center justify-center rounded-2xl bg-white"
                                style={{ left: 604.8, top: 278.7, width: 40, height: 40, border: `1px solid ${LINE}` }}
                            >
                                <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
                                    <path d="M1 13L7 7L1 1" stroke={LARANJA_KIT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                            <button
                                type="button"
                                onClick={anteriorKit}
                                aria-label="Item anterior do kit"
                                className="absolute flex items-center justify-center rounded-2xl bg-white"
                                style={{ left: 224.8, top: 278.7, width: 40, height: 40, border: `1px solid ${LINE}` }}
                            >
                                <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
                                    <path d="M7 13L1 7L7 1" stroke={LARANJA_KIT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== Galeria de momentos ===== */}
            <section id="galeria" className="relative overflow-hidden bg-white">
                <div className="relative mx-auto max-w-[1400px] px-6 py-16 md:pt-28">
                    <Reveal className="mx-auto max-w-[640px] text-center">
                        <div className="text-sm font-bold tracking-[2px] uppercase" style={{ fontFamily: TITLE_FONT, color: ACCENT }}>
                            Momentos da prova
                        </div>
                        <h2 className="mt-3 text-2xl leading-[0.98] tracking-[-1px] uppercase md:text-[44px] md:tracking-[-1.5px]" style={{ fontFamily: TITLE_FONT, fontWeight: 900, color: INK }}>
                            Confira como foi
                            <br />
                            a nossa última edição
                        </h2>
                        <p className="mt-4 text-lg leading-[1.5]" style={{ color: MUTED }}>
                            Da largada na Paulista à emoção da chegada, veja os registros que contam a energia dos 15 km mais tradicionais do fim de ano.
                        </p>
                    </Reveal>
                </div>

                {/* Mosaico full-bleed — a janela (overflow hidden) fica na largura da tela (mobile ou desktop); a faixa
                    interna é mais larga e desliza para a esquerda conforme a seção passa pela viewport durante o
                    scroll. Mesmo comportamento em qualquer tamanho de tela — não vira uma grade estática no mobile. */}
                <div ref={galeriaOuterRef} className="mt-10 w-full overflow-hidden md:mt-16">
                    <div
                        ref={galeriaTrackRef}
                        style={{
                            display: "grid",
                            gridTemplateColumns: galeriaMobile ? "repeat(6, 175px)" : "repeat(16, 175px)",
                            gridTemplateRows: "repeat(2, 1fr)",
                            height: 460,
                            gap: 8,
                            transform: `translateX(${galeriaTrackX}px)`,
                            willChange: "transform",
                        }}
                    >
                        {(() => {
                            let fotoIdx = -1;
                            return (galeriaMobile ? GALERIA_MOSAICO_MOBILE : GALERIA_MOSAICO).map((peca, i) => {
                                if (peca.tipo === "foto") fotoIdx += 1;
                                const meuFotoIdx = fotoIdx;
                                return (
                                    <div
                                        key={i}
                                        style={{
                                            gridColumn: peca.col,
                                            gridRow: peca.row,
                                            backgroundColor: peca.tipo === "cor" ? peca.cor : "#fff",
                                            ...ssCornerRadius(peca.diag),
                                        }}
                                    >
                                        {peca.tipo === "foto" && (
                                            <button
                                                type="button"
                                                onClick={() => setGaleriaLightbox(meuFotoIdx)}
                                                className="block h-full w-full cursor-pointer"
                                                aria-label={`Ver em tela cheia: ${peca.alt}`}
                                            >
                                                <img src={peca.src} alt={peca.alt} loading="lazy" className="block h-full w-full object-cover" />
                                            </button>
                                        )}
                                    </div>
                                );
                            });
                        })()}
                    </div>
                </div>
            </section>

            {/* ===== Lightbox da galeria — tela cheia com navegação entre as fotos ===== */}
            {galeriaLightbox !== null && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4" onClick={() => setGaleriaLightbox(null)}>
                    <button
                        type="button"
                        onClick={() => setGaleriaLightbox(null)}
                        aria-label="Fechar"
                        className="absolute top-4 right-4 flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition duration-150 ease-linear hover:bg-white/20"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <path d="M6 6l12 12M18 6L6 18" />
                        </svg>
                    </button>

                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setGaleriaLightbox((i) => (i === null ? i : (i - 1 + galeriaFotos.length) % galeriaFotos.length));
                        }}
                        aria-label="Foto anterior"
                        className="absolute top-1/2 left-2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition duration-150 ease-linear hover:bg-white/20 md:left-6"
                    >
                        <svg width="14" height="24" viewBox="0 0 8 14" fill="none">
                            <path d="M7 13L1 7L7 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setGaleriaLightbox((i) => (i === null ? i : (i + 1) % galeriaFotos.length));
                        }}
                        aria-label="Próxima foto"
                        className="absolute top-1/2 right-2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition duration-150 ease-linear hover:bg-white/20 md:right-6"
                    >
                        <svg width="14" height="24" viewBox="0 0 8 14" fill="none">
                            <path d="M1 13L7 7L1 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>

                    <img
                        src={galeriaFotos[galeriaLightbox].src}
                        alt={galeriaFotos[galeriaLightbox].alt}
                        onClick={(e) => e.stopPropagation()}
                        className="max-h-[90vh] max-w-[92vw] rounded-2xl object-contain"
                    />

                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-white">
                        {galeriaLightbox + 1} / {galeriaFotos.length}
                    </div>
                </div>
            )}

            <InformacoesSection />

            {/* ===== FAQ ===== */}
            <section id="faq" className="relative overflow-hidden bg-white">
                <div className="relative mx-auto max-w-[1470px]">
                    <div ref={faqMosaicRef} aria-hidden="true" className="pointer-events-none absolute top-0 left-0 hidden md:block" style={{ width: 525, height: 430 }}>
                        {faqMosaicVisible && <AnimatedMosaic viewBox={FAQ_MOSAIC.viewBox} paths={FAQ_MOSAIC.paths} />}
                    </div>
                    <div ref={faqMosaicMobileRef} aria-hidden="true" className="pointer-events-none absolute top-0 left-0 md:hidden" style={{ width: 390, height: 116 }}>
                        {FAQ_MOBILE_SHAPES.map((s) => (
                            <div
                                key={s.key}
                                className="absolute"
                                style={{ left: s.left, top: s.top, width: s.width, height: s.height, backgroundColor: s.color, clipPath: `url(#faqMobilePiece${s.key})` }}
                            />
                        ))}
                    </div>
                    <div className="relative mx-auto flex max-w-[1280px] flex-col gap-16 px-8 pt-40 pb-24">
                        <div className="mx-auto flex max-w-[768px] flex-col items-center gap-5 text-center">
                            <h2 className="text-2xl leading-[1.2] tracking-[-1px] uppercase md:text-[36px]" style={{ fontFamily: TITLE_FONT, fontWeight: 900 }}>
                                Perguntas frequentes
                            </h2>
                            <p className="text-xl leading-[1.4]" style={{ color: MUTED }}>
                                Reunimos aqui algumas respostas para dúvidas que você possa ter. Não encontrou o que precisa?{" "}
                                <a href="mailto:contato@saosilvestre.com.br" className="font-semibold" style={{ color: ACCENT }}>
                                    Fala com a gente
                                </a>
                                .
                            </p>
                        </div>
                        <div className="mx-auto flex w-full max-w-[768px] flex-col gap-4">
                            {FAQ_101.map((f, i) => {
                                const aberto = faqAberto === i;
                                return (
                                    <Reveal key={i} variant="grow" delay={i * 0.04}>
                                        <div className="rounded-2xl p-6" style={aberto ? { backgroundColor: MIST } : undefined}>
                                            <button type="button" onClick={() => setFaqAberto(aberto ? null : i)} className="flex w-full items-start justify-between gap-4 text-left">
                                                <div className="flex flex-1 flex-col">
                                                    <span className="text-base font-semibold" style={{ color: INK }}>
                                                        {f.q}
                                                    </span>
                                                    <div className="grid transition-[grid-template-rows] duration-300 ease-in-out" style={{ gridTemplateRows: aberto ? "1fr" : "0fr" }}>
                                                        <div className="overflow-hidden">
                                                            <span
                                                                className="block pt-1 text-base leading-[1.5] font-normal transition-opacity duration-200 ease-in-out"
                                                                style={{ color: MUTED, opacity: aberto ? 1 : 0 }}
                                                            >
                                                                {f.a}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                {aberto ? (
                                                    <MinusCircle className="size-6 shrink-0" style={{ color: "#A3A3A3" }} />
                                                ) : (
                                                    <PlusCircle className="size-6 shrink-0" style={{ color: "#A3A3A3" }} />
                                                )}
                                            </button>
                                        </div>
                                    </Reveal>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== Footer ===== */}
            <footer className="relative overflow-hidden border-t" style={{ backgroundColor: "#fff", color: INK, borderColor: LINE }}>
                <div aria-hidden="true" className="pointer-events-none absolute top-0 right-0 overflow-hidden md:hidden" style={{ width: 390, height: 252 }}>
                    {FOOTER_MOBILE_SHAPES.map((s) => (
                        <div
                            key={s.key}
                            className="absolute"
                            style={{ left: s.left, top: s.top, width: s.width, height: s.height, backgroundColor: s.color, clipPath: `url(#footerMobile${s.key})` }}
                        />
                    ))}
                </div>
                <div className="relative mx-auto max-w-[1240px] px-6 pt-12 pb-10">
                    <div className="md:min-h-[258px]">
                        <img src={logoTicketsportsColor} alt="Ticket Sports by Ingresse" className="h-auto w-[183px]" />
                        <p className="mt-[18px] max-w-[403px] text-sm leading-[1.7]" style={{ color: MUTED }}>
                            Ticket Sports é líder nacional para organizadores de eventos esportivos, faça parte agora!
                        </p>
                        <div className="mt-[22px] flex gap-3">
                            {[
                                { Icone: InstagramIcon, label: "Instagram" },
                                { Icone: FacebookIcon, label: "Facebook" },
                                { Icone: TiktokIcon, label: "TikTok" },
                                { Icone: YoutubeIcon, label: "YouTube" },
                            ].map(({ Icone, label }) => (
                                <a
                                    key={label}
                                    href="#"
                                    aria-label={label}
                                    className="flex size-[42px] items-center justify-center rounded-xl"
                                    style={{ backgroundColor: MIST, color: INK }}
                                >
                                    <Icone />
                                </a>
                            ))}
                        </div>
                    </div>
                    <div className="mt-11 flex flex-wrap justify-between gap-3 border-t pt-6" style={{ borderColor: LINE }}>
                        <span className="text-sm" style={{ color: MUTED }}>
                            © São Silvestre · Todos os direitos reservados.
                        </span>
                        <span className="text-sm" style={{ color: MUTED }}>
                            São Paulo — Brasil 🇧🇷
                        </span>
                    </div>
                    <div ref={footerMosaicRef} aria-hidden="true" className="pointer-events-none absolute top-0 hidden md:block" style={{ left: 1006, width: 350, height: 435 }}>
                        {footerMosaicVisible && <AnimatedMosaic viewBox={FOOTER_MOSAIC.viewBox} paths={FOOTER_MOSAIC.paths} />}
                    </div>
                </div>
            </footer>

            <GuiaMedidasModal isOpen={guideOpen} onClose={() => setGuideOpen(false)} />
            <PcdDetalhesModal isOpen={pcdModalOpen} onClose={() => setPcdModalOpen(false)} />
            <ComoFuncionaModal isOpen={comoFuncionaModalOpen} onClose={() => setComoFuncionaModalOpen(false)} />
        </div>
    );
}
