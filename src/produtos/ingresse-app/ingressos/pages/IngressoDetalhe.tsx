import { useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import Lottie, { type LottieRefCurrentProps } from "lottie-react";
import { ArrowLeft, InfoCircle, Send01, Tag01, UserRight01, Wallet02 } from "@untitledui/icons";
import { Toggle } from "@/components/base/toggle/toggle";
import faceIdSuccess from "../assets/face-id-success.json";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { AppShell } from "../../components/AppShell";
import { ActionFab, type FabAction } from "../../components/ActionFab";
import { StatusBar } from "../../components/StatusBar";
import { Zigzag } from "../../components/Zigzag";
import { getEvento, getItem } from "../data/eventos";
import { isTransferido } from "../data/transfer-store";

/** Carinha de reconhecimento facial: toca 2 vezes e congela no último frame. */
function FaceAnimation() {
    const lottieRef = useRef<LottieRefCurrentProps>(null);
    const plays = useRef(1);
    return (
        <Lottie
            lottieRef={lottieRef}
            animationData={faceIdSuccess}
            loop={false}
            autoplay
            onComplete={() => {
                if (plays.current < 2) {
                    plays.current += 1;
                    lottieRef.current?.goToAndPlay(0, true);
                }
            }}
            aria-hidden="true"
            className="size-28"
        />
    );
}

export function IngressoDetalhe() {
    const navigate = useNavigate();
    const { eventId, itemId } = useParams();
    const eventoObj = getEvento(eventId);
    const item = getItem(eventId, itemId);

    const transferido = isTransferido(itemId);
    const evento = eventoObj.title;
    const title = item?.title ?? "Ingresso";
    const tipo = item?.tipo;
    const sessao = eventoObj.sessao;
    const portador = item?.portador ?? "Priscilão Alcantara Raro";
    const cpf = item?.cpf ?? "948.943.130-44";
    const facial = item?.acesso === "facial";

    const [meuIngresso, setMeuIngresso] = useState(true);
    const [showQR, setShowQR] = useState(false);
    // Facial pendente começa não cadastrado; "Cadastrar agora" leva ao estado cadastrado.
    const [registered, setRegistered] = useState(item?.facial !== "pendente");

    const acoes: FabAction[] = [
        {
            icon: Send01,
            label: "Transferir ingresso",
            short: "Transferir",
            onClick: () => navigate(`/ingresse-app/ingressos/transferir/${eventoObj.id}/${itemId}`),
        },
        { icon: Tag01, label: "Revender ingresso", short: "Revender" },
        { icon: Wallet02, label: "Adicionar à Carteira", short: "Carteira", dark: true },
    ];

    return (
        <AppShell showTabBar={false} bottomBar={transferido ? undefined : <ActionFab actions={acoes} />}>
            <div className="flex min-h-full flex-col bg-secondary">
                <StatusBar tone="dark" />

                {/* Top bar */}
                <div className="flex items-center justify-between px-5 pt-2">
                    <button
                        type="button"
                        aria-label="Voltar"
                        onClick={() => navigate(`/ingresse-app/ingressos/evento/${eventoObj.id}`)}
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
                <h1 className="px-5 pt-4 text-xl font-bold text-primary">Ingresso</h1>

                <div className="flex flex-1 flex-col gap-5 px-5 pt-4 pb-8">
                    {/* Modelo de ingresso */}
                    <div className="rounded-3xl bg-primary shadow-sm ring-1 ring-border-secondary">
                        {/* Topo: ingresso + sessão */}
                        <div className="p-5">
                            <p className="text-xs font-medium tracking-wide text-tertiary uppercase">{evento}</p>
                            <p className="mt-1 text-2xl leading-tight font-bold text-primary">{title}</p>
                            {tipo && <p className="mt-1.5 text-sm text-tertiary">{tipo}</p>}

                            {facial && (
                                <div className="mt-3 flex items-center gap-2.5">
                                    <Toggle size="sm" isSelected={meuIngresso} onChange={setMeuIngresso} />
                                    <span className="text-sm font-medium text-primary">Meu ingresso</span>
                                </div>
                            )}

                            <div className="my-4 border-t border-tertiary" />

                            <p className="text-xs font-semibold text-tertiary">Sessão</p>
                            <p className="mt-1 text-sm font-bold text-primary">{sessao}</p>
                        </div>

                        {/* Rasgadinho (zigzag) */}
                        <div className="relative py-1">
                            <div className="absolute top-1/2 -left-2.5 size-5 -translate-y-1/2 rounded-full bg-secondary" />
                            <div className="absolute top-1/2 -right-2.5 size-5 -translate-y-1/2 rounded-full bg-secondary" />
                            <div className="px-3">
                                <Zigzag />
                            </div>
                        </div>

                        {transferido ? (
                            /* Estado: em transferência (sem QR) */
                            <div className="p-5">
                                <div className="flex items-start gap-3">
                                    <FeaturedIcon icon={UserRight01} color="gray" theme="modern" size="lg" />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-md font-bold text-primary">Ingresso transferido</p>
                                        <p className="mt-1 text-sm text-tertiary">Este ingresso foi enviado para outro usuário e não pode ser resgatado.</p>
                                    </div>
                                </div>

                                <div className="my-4 border-t border-tertiary" />

                                <p className="text-sm text-tertiary">Transferido para</p>
                                <p className="mt-0.5 text-md font-bold text-primary">Duny Alves da Silva</p>
                                <p className="mt-1 text-sm text-tertiary">
                                    <span>CPF: </span><span className="font-semibold text-secondary">009.789.568-90</span>
                                </p>

                                <p className="mt-4 text-sm text-tertiary">Data da transferência</p>
                                <p className="mt-0.5 text-md font-bold text-primary">10 de junho • 12:20</p>
                            </div>
                        ) : facial ? (
                            /* Acesso por reconhecimento facial (com troca animada para o QR) */
                            <div className="px-6 pt-6 pb-7">
                                <div className="[perspective:1000px]">
                                    <AnimatePresence mode="wait" initial={false}>
                                        {!registered ? (
                                            /* Facial pendente: cadastrar */
                                            <motion.div
                                                key="pendente"
                                                className="py-1"
                                                initial={{ opacity: 0, rotateY: 90 }}
                                                animate={{ opacity: 1, rotateY: 0 }}
                                                exit={{ opacity: 0, rotateY: -90 }}
                                                transition={{ duration: 0.32, ease: "easeInOut" }}
                                            >
                                                <div className="rounded-2xl border border-error_subtle p-6 text-center">
                                                    <div className="relative mx-auto mb-4 size-16">
                                                        <span className="absolute inset-0 animate-pulse rounded-full border border-error_subtle opacity-40" />
                                                        <span className="absolute inset-2 rounded-full border border-error_subtle opacity-70" />
                                                        <span className="absolute inset-4 flex items-center justify-center text-fg-error-primary">
                                                            <InfoCircle className="size-8" />
                                                        </span>
                                                    </div>
                                                    <h3 className="text-md font-bold text-primary">Cadastre sua facial</h3>
                                                    <p className="mt-1.5 text-sm text-tertiary">
                                                        O acesso a este ingresso é feito por reconhecimento facial. Sem isso, não será possível acessar o evento.
                                                    </p>
                                                    <button
                                                        type="button"
                                                        onClick={() => setRegistered(true)}
                                                        className="mt-5 w-full rounded-lg bg-error-solid px-5 py-3 text-sm font-semibold text-white transition duration-100 ease-linear hover:bg-error-solid_hover active:bg-error-solid_hover"
                                                    >
                                                        Cadastrar agora
                                                    </button>
                                                </div>
                                            </motion.div>
                                        ) : !showQR ? (
                                            /* Facial cadastrada: carinha + abrir QR */
                                            <motion.div
                                                key="cadastrada"
                                                className="flex flex-col items-center py-2 text-center"
                                                initial={{ opacity: 0, rotateY: 90 }}
                                                animate={{ opacity: 1, rotateY: 0 }}
                                                exit={{ opacity: 0, rotateY: -90 }}
                                                transition={{ duration: 0.32, ease: "easeInOut" }}
                                            >
                                                <FaceAnimation />
                                                <p className="mt-5 text-sm text-secondary">Seu acesso será feito por reconhecimento facial.</p>
                                                <p className="text-sm text-secondary">Você já está cadastrado.</p>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowQR(true)}
                                                    className="mt-5 rounded-lg border border-secondary bg-primary px-5 py-2.5 text-sm font-semibold text-primary transition duration-100 ease-linear active:bg-secondary"
                                                >
                                                    Abrir QR code
                                                </button>
                                            </motion.div>
                                        ) : (
                                            /* QR code */
                                            <motion.div
                                                key="qr"
                                                className="flex flex-col items-center py-2 text-center"
                                                initial={{ opacity: 0, rotateY: 90 }}
                                                animate={{ opacity: 1, rotateY: 0 }}
                                                exit={{ opacity: 0, rotateY: -90 }}
                                                transition={{ duration: 0.32, ease: "easeInOut" }}
                                            >
                                                <FakeQR px={220} />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                                <div className="-mx-6 my-5 border-t border-tertiary" />
                                <div className="text-left">
                                    <p className="text-sm text-tertiary">
                                        <span>Titular: </span><span className="font-semibold text-primary">{portador}</span>
                                    </p>
                                    <p className="mt-1 text-sm text-tertiary">
                                        <span>CPF: </span><span className="font-semibold text-primary">{cpf}</span>
                                    </p>
                                </div>
                            </div>
                        ) : (
                            /* QR + portador */
                            <div className="px-6 pt-6 pb-7">
                                <div className="flex justify-center">
                                    <FakeQR px={220} />
                                </div>
                                <div className="-mx-6 my-5 border-t border-tertiary" />
                                <div className="text-left">
                                    <p className="text-sm text-tertiary">
                                        <span>Titular: </span><span className="font-semibold text-primary">{portador}</span>
                                    </p>
                                    <p className="mt-1 text-sm text-tertiary">
                                        <span>CPF: </span><span className="font-semibold text-primary">{cpf}</span>
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppShell>
    );
}

/* QR Code simples (placeholder), sem molduras. */
const FakeQR = ({ px = 200 }: { px?: number }) => {
    const N = 25;
    const isFinder = (r: number, c: number) => (r < 7 && c < 7) || (r < 7 && c >= N - 7) || (r >= N - 7 && c < 7);
    const cells: { x: number; y: number }[] = [];
    for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
            if (isFinder(r, c)) continue;
            if ((r * 3 + c * 7 + ((r * c) % 5)) % 3 === 0) cells.push({ x: c, y: r });
        }
    }
    const Finder = ({ x, y }: { x: number; y: number }) => (
        <>
            <rect x={x} y={y} width={7} height={7} fill="currentColor" />
            <rect x={x + 1} y={y + 1} width={5} height={5} fill="#fff" />
            <rect x={x + 2} y={y + 2} width={3} height={3} fill="currentColor" />
        </>
    );
    return (
        <svg width={px} height={px} viewBox={`0 0 ${N} ${N}`} shapeRendering="crispEdges" className="text-black" aria-label="QR Code">
            <rect width={N} height={N} fill="#fff" />
            {cells.map((cell, i) => (
                <rect key={i} x={cell.x} y={cell.y} width={1} height={1} fill="currentColor" />
            ))}
            <Finder x={0} y={0} />
            <Finder x={N - 7} y={0} />
            <Finder x={0} y={N - 7} />
        </svg>
    );
};
