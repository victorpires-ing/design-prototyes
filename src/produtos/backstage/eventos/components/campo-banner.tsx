import { useRef, useState, useSyncExternalStore, type SyntheticEvent } from "react";
import { Crop01, ImageUp, RefreshCw01, Trash01 } from "@untitledui/icons";
import { Heading as AriaHeading } from "react-aria-components";
import { centerCrop, makeAspectCrop, type PercentCrop } from "react-image-crop";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { CloseButton } from "@/components/base/buttons/close-button";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { Cropper } from "@/components/shared-assets/image-cropper/cropper";
import { cx } from "@/utils/cx";
import { CampoDeParticulas, useCorDeParticulas } from "../../components/campo-de-particulas";

/*
 * Banner do evento (EVT-79 a EVT-82). Enviar abre o modal de recorte do DS (o `Cropper` de
 * shared-assets/image-cropper, no layout do exemplo `image-crop-modal` do Untitled UI) com a
 * proporção fixa do banner, 4:5. A prévia mostra só a parte recortada; "Ajustar recorte" reabre.
 */

/** Proporção do banner: largura ÷ altura (1080 × 1350). */
export const PROPORCAO_BANNER = 1080 / 1350;
const SAIDA = { largura: 1080, altura: 1350, qualidade: 0.85 };

export interface ImagemDoBanner {
    nome: string;
    url: string;
}

/** Recorte em % da imagem original (formato do react-image-crop, usado pelo Cropper do DS). */
export type Recorte = PercentCrop;

/** Desktop (a partir de 1024 px): o banner ocupa a coluna da esquerda da página do evento (EVT-79). */
const CONSULTA_DESKTOP = "(min-width: 1024px)";
export function useBannerNaColuna(): boolean {
    return useSyncExternalStore(
        (fn) => {
            const m = window.matchMedia(CONSULTA_DESKTOP);
            m.addEventListener("change", fn);
            return () => m.removeEventListener("change", fn);
        },
        () => window.matchMedia(CONSULTA_DESKTOP).matches,
        () => false,
    );
}

/** Gera o banner recortado (JPEG 1080 × 1350) para gravar no evento. */
export async function exportarRecorte(img: ImagemDoBanner, r: Recorte): Promise<string> {
    const imagem = new Image();
    imagem.src = img.url;
    await imagem.decode();
    const iw = imagem.naturalWidth;
    const ih = imagem.naturalHeight;
    const canvas = document.createElement("canvas");
    canvas.width = SAIDA.largura;
    canvas.height = SAIDA.altura;
    canvas
        .getContext("2d")
        ?.drawImage(imagem, (r.x / 100) * iw, (r.y / 100) * ih, (r.width / 100) * iw, (r.height / 100) * ih, 0, 0, SAIDA.largura, SAIDA.altura);
    return canvas.toDataURL("image/jpeg", SAIDA.qualidade);
}

/** A parte recortada, preenchendo uma moldura 4:5 (a moldura e o recorte têm a mesma proporção). */
function ImagemRecortada({ imagem, recorte, className }: { imagem: ImagemDoBanner; recorte: Recorte; className?: string }) {
    return (
        <div className={cx("relative aspect-[4/5] overflow-hidden bg-primary_alt", className)}>
            <img
                src={imagem.url}
                alt=""
                draggable={false}
                className="absolute max-w-none"
                style={{
                    width: `${10000 / recorte.width}%`,
                    height: `${10000 / recorte.height}%`,
                    left: `${(-recorte.x / recorte.width) * 100}%`,
                    top: `${(-recorte.y / recorte.height) * 100}%`,
                }}
            />
        </div>
    );
}

interface CampoBannerProps {
    imagem: ImagemDoBanner | null;
    recorte: Recorte | null;
    /** Imagem e recorte confirmados no modal. */
    onAplicar: (imagem: ImagemDoBanner, recorte: Recorte) => void;
    onRemover: () => void;
    /** Recusa formatos fora de PNG e JPG (EVT-63). */
    validar: (file: File) => boolean;
}

/** Imagem em edição no modal. Cancelar uma imagem nova descarta; cancelar um ajuste mantém o anterior. */
interface Edicao {
    imagem: ImagemDoBanner;
    recorte?: Recorte;
}

function useEdicaoDoBanner({ imagem, recorte, onAplicar, validar }: CampoBannerProps) {
    const [edicao, setEdicao] = useState<Edicao | null>(null);
    const escolher = (file: File) => {
        if (!validar(file)) return;
        setEdicao({ imagem: { nome: file.name, url: URL.createObjectURL(file) } });
    };
    const ajustar = () => {
        if (imagem && recorte) setEdicao({ imagem, recorte });
    };
    const modal = edicao && (
        <ModalDeRecorte
            key={edicao.imagem.url}
            imagem={edicao.imagem}
            recorteInicial={edicao.recorte}
            onCancelar={() => setEdicao(null)}
            onAplicar={(r) => {
                onAplicar(edicao.imagem, r);
                setEdicao(null);
            }}
        />
    );
    return { escolher, ajustar, modal };
}

/** Desktop: bloco 4:5 sem rótulo visível. Vazio, é o botão de envio sobre as partículas. */
export function CampoBanner(props: CampoBannerProps) {
    const { imagem, recorte, onRemover } = props;
    const { escolher, ajustar, modal } = useEdicaoDoBanner(props);
    const entrada = useRef<HTMLInputElement>(null);
    const abrirSeletor = () => entrada.current?.click();

    return (
        <div className="flex flex-col gap-3">
            {/* Sem rótulo visível na coluna: o bloco já diz o que é; o nome fica para leitor de tela. */}
            <span className="sr-only" id="banner-rotulo">
                Banner
            </span>
            <input
                ref={entrada}
                type="file"
                accept="image/png,image/jpeg"
                className="sr-only"
                tabIndex={-1}
                aria-hidden="true"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) escolher(file);
                    e.target.value = "";
                }}
            />
            {imagem && recorte ? (
                <>
                    {/* A prévia também abre o ajuste: é o alvo maior. */}
                    <button
                        type="button"
                        onClick={ajustar}
                        aria-label="Ajustar recorte do banner"
                        className="cursor-pointer overflow-hidden rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                    >
                        <ImagemRecortada imagem={imagem} recorte={recorte} />
                    </button>
                    <div className="flex items-center justify-between gap-2">
                        <span className="min-w-0 truncate text-sm text-tertiary">{imagem.nome}</span>
                        <div className="flex shrink-0 items-center gap-1">
                            <ButtonUtility icon={Crop01} color="tertiary" size="sm" tooltip="Ajustar recorte" onClick={ajustar} />
                            <ButtonUtility icon={RefreshCw01} color="tertiary" size="sm" tooltip="Trocar imagem" onClick={abrirSeletor} />
                            <ButtonUtility icon={Trash01} color="tertiary" size="sm" tooltip="Remover banner" onClick={onRemover} />
                        </div>
                    </div>
                </>
            ) : (
                <AreaDeEnvio onClique={abrirSeletor} onSoltar={escolher} />
            )}
            {modal}
        </div>
    );
}

/** Estado vazio: o bloco inteiro é o botão de envio, sobre o campo de partículas. Aceita arrastar. */
function AreaDeEnvio({ onClique, onSoltar }: { onClique: () => void; onSoltar: (file: File) => void }) {
    const [sobre, setSobre] = useState(false);
    const [emFoco, setEmFoco] = useState(false);
    // 40% menos opacas que o valor anterior do banner (0,22 e 0,2), para o texto ler melhor.
    const corPadrao = useCorDeParticulas({ escuro: 0.132, claro: 0.12 });
    // No hover, as partículas ficam no vermelho da marca. Os tokens `brand` deste tema são neutros, então vai o
    // valor do sólido de marca do AFTER DS (#ff271a), o mesmo que a proteção de compra usa.
    const cor = emFoco || sobre ? "#ff271a" : corPadrao;

    return (
        <button
            type="button"
            onClick={onClique}
            onPointerEnter={() => setEmFoco(true)}
            onPointerLeave={() => setEmFoco(false)}
            onDragOver={(e) => {
                e.preventDefault();
                setSobre(true);
            }}
            onDragLeave={() => setSobre(false)}
            onDrop={(e) => {
                e.preventDefault();
                setSobre(false);
                const file = e.dataTransfer.files[0];
                if (file) onSoltar(file);
            }}
            aria-labelledby="banner-rotulo"
            aria-describedby="banner-dica"
            className={cx(
                "group relative isolate flex aspect-[4/5] w-full cursor-pointer flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl bg-primary_alt p-6 text-center transition-colors duration-250 ease-out motion-reduce:transition-none",
                "hover:bg-primary_hover/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
                sobre && "bg-primary_hover/10 ring-2 ring-brand",
            )}
        >
            <CampoDeParticulas cor={cor} densidade={1.5} escala={2} className="absolute inset-0 -z-10 size-full" />
            <span className="flex size-12 items-center justify-center rounded-full bg-primary shadow-xs ring-1 ring-secondary ring-inset">
                <ImageUp className="size-6 text-fg-secondary" aria-hidden="true" />
            </span>
            <span className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-primary">Clique para enviar o banner</span>
                <span className="text-sm text-tertiary">ou arraste a imagem para cá</span>
            </span>
            <span id="banner-dica" className="flex flex-col text-sm text-tertiary">
                <span>PNG ou JPG</span>
                <span>1080 × 1350 px</span>
            </span>
        </button>
    );
}

/**
 * Celular e telas médias (EVT-80): a versão do desktop, enxuta. Uma caixa sem padding, com o banner
 * pequeno (4:5) à esquerda e o texto à direita, centralizado na altura. Vazia, a caixa inteira é o
 * botão de envio, sobre o mesmo campo de partículas do desktop.
 */
export function CampoBannerCompacto(props: CampoBannerProps) {
    const { imagem, recorte, onRemover } = props;
    const { escolher, ajustar, modal } = useEdicaoDoBanner(props);
    const entrada = useRef<HTMLInputElement>(null);
    const abrirSeletor = () => entrada.current?.click();
    const [sobre, setSobre] = useState(false);
    const [emFoco, setEmFoco] = useState(false);
    const corPadrao = useCorDeParticulas({ escuro: 0.132, claro: 0.12 });
    const cor = emFoco || sobre ? "#ff271a" : corPadrao;
    const caixa = "relative isolate flex w-full items-stretch overflow-hidden rounded-2xl bg-primary_alt ring-1 ring-secondary ring-inset";

    return (
        <div className="flex flex-col">
            <span className="sr-only" id="banner-rotulo-compacto">
                Banner
            </span>
            <input
                ref={entrada}
                type="file"
                accept="image/png,image/jpeg"
                className="sr-only"
                tabIndex={-1}
                aria-hidden="true"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) escolher(file);
                    e.target.value = "";
                }}
            />
            {imagem && recorte ? (
                <div className={caixa}>
                    <button
                        type="button"
                        onClick={ajustar}
                        aria-label="Ajustar recorte do banner"
                        className="w-24 shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus-ring"
                    >
                        <ImagemRecortada imagem={imagem} recorte={recorte} />
                    </button>
                    <div className="flex min-w-0 flex-1 items-center gap-1 px-4">
                        <span className="flex min-w-0 flex-1 flex-col">
                            <span className="text-sm font-semibold text-primary">Banner</span>
                            <span className="truncate text-sm text-tertiary">{imagem.nome}</span>
                        </span>
                        <ButtonUtility icon={Crop01} color="tertiary" size="sm" tooltip="Ajustar recorte" onClick={ajustar} />
                        <ButtonUtility icon={RefreshCw01} color="tertiary" size="sm" tooltip="Trocar imagem" onClick={abrirSeletor} />
                        <ButtonUtility icon={Trash01} color="tertiary" size="sm" tooltip="Remover banner" onClick={onRemover} />
                    </div>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={abrirSeletor}
                    onPointerEnter={() => setEmFoco(true)}
                    onPointerLeave={() => setEmFoco(false)}
                    onDragOver={(e) => {
                        e.preventDefault();
                        setSobre(true);
                    }}
                    onDragLeave={() => setSobre(false)}
                    onDrop={(e) => {
                        e.preventDefault();
                        setSobre(false);
                        const file = e.dataTransfer.files[0];
                        if (file) escolher(file);
                    }}
                    aria-labelledby="banner-rotulo-compacto"
                    aria-describedby="banner-dica-compacto"
                    className={cx(
                        caixa,
                        "cursor-pointer text-left transition-colors duration-250 ease-out hover:bg-primary_hover/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring motion-reduce:transition-none",
                        sobre && "bg-primary_hover/10 ring-2 ring-brand",
                    )}
                >
                    {/* Partículas na caixa toda, sumindo para a direita, onde fica o texto. */}
                    <CampoDeParticulas
                        cor={cor}
                        densidade={1.5}
                        escala={2}
                        className="absolute inset-0 -z-10 size-full [mask-image:linear-gradient(to_right,black_0%,black_25%,transparent_80%)]"
                    />
                    <span className="flex aspect-[4/5] w-24 shrink-0 items-center justify-center">
                        <span className="flex size-10 items-center justify-center rounded-full bg-primary shadow-xs ring-1 ring-secondary ring-inset">
                            <ImageUp className="size-5 text-fg-secondary" aria-hidden="true" />
                        </span>
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 px-4">
                        <span className="text-sm font-semibold text-primary">Enviar o banner</span>
                        <span id="banner-dica-compacto" className="text-sm text-tertiary">
                            PNG ou JPG, 1080 × 1350 px
                        </span>
                    </span>
                </button>
            )}
            {modal}
        </div>
    );
}

/** Modal de recorte do DS (layout de `image-crop-modal`), com a proporção travada em 4:5. */
function ModalDeRecorte({
    imagem,
    recorteInicial,
    onCancelar,
    onAplicar,
}: {
    imagem: ImagemDoBanner;
    recorteInicial?: Recorte;
    onCancelar: () => void;
    onAplicar: (r: Recorte) => void;
}) {
    const [recorte, setRecorte] = useState<Recorte | undefined>(recorteInicial);

    // Imagem nova: começa no maior recorte 4:5 possível, centralizado.
    const aoCarregar = (e: SyntheticEvent<HTMLImageElement>) => {
        if (recorteInicial) return;
        const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
        setRecorte(centerCrop(makeAspectCrop({ unit: "%", width: 100 }, PROPORCAO_BANNER, w, h), w, h));
    };

    return (
        <ModalOverlay isOpen onOpenChange={(aberto) => !aberto && onCancelar()} isDismissable>
            <Modal className="sm:max-w-140">
                <Dialog>
                    <div className="relative w-full overflow-hidden rounded-2xl bg-primary shadow-xl ring-1 ring-border-secondary">
                        <CloseButton theme="light" size="sm" label="Fechar" onPress={onCancelar} className="absolute top-3 right-3 sm:top-4 sm:right-4" />
                        <div className="flex gap-4 px-4 pt-5 sm:px-6 sm:pt-6">
                            <FeaturedIcon color="gray" size="md" theme="modern" icon={Crop01} className="max-sm:hidden" />
                            <div className="z-10 flex flex-col gap-0.5 pr-8">
                                <AriaHeading slot="title" className="text-md font-semibold text-primary">
                                    Recortar banner
                                </AriaHeading>
                                <p className="text-sm text-tertiary">Arraste a área para escolher o que aparece. O banner fica em 1080 × 1350 px.</p>
                            </div>
                        </div>
                        <div className="h-5 w-full" />
                        <div className="flex justify-center px-4 sm:px-6">
                            <Cropper aspect={PROPORCAO_BANNER} crop={recorte} keepSelection minWidth={40} onChange={(_pixel, percent) => setRecorte(percent)}>
                                <Cropper.Img src={imagem.url} alt={imagem.nome} onLoad={aoCarregar} className="max-h-[55vh] w-auto" />
                            </Cropper>
                        </div>
                        <div className="z-10 flex flex-col pt-6 pb-4 sm:pt-8 sm:pb-6">
                            <div className="w-full border-t border-secondary max-md:hidden" />
                            <div className="h-4 w-full max-md:hidden sm:h-6" />
                            <div className="flex flex-1 flex-col-reverse gap-3 px-4 sm:flex-row sm:justify-end sm:px-6">
                                <Button color="secondary" size="md" onClick={onCancelar}>
                                    Cancelar
                                </Button>
                                <Button color="primary" size="md" isDisabled={!recorte} onClick={() => recorte && onAplicar(recorte)}>
                                    Aplicar recorte
                                </Button>
                            </div>
                        </div>
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
}
