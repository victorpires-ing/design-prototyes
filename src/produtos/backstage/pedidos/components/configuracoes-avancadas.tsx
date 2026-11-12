import { useEffect, useState } from "react";
import { toCalendarDate } from "@internationalized/date";
import type { DateValue } from "react-aria-components";
import { toast } from "sonner";
import { Dialog, Modal, ModalOverlay, SlideoutMenu } from "@/components/application/slideout-menus/slideout-menu";
import { ButtonGroup, ButtonGroupItem } from "@/components/base/button-group/button-group";
import { Button } from "@/components/base/buttons/button";
import { EVENTO, ate, salvarConfigTrocas, useTroca } from "../data/troca-store";
import { CampoDataHora, dataParaTs, tsParaData } from "./campo-data-hora";

/**
 * Réplica do slideout "Configurações avançadas" de produção. Só muda o bloco de trocas:
 * "Permitir troca de setor" vira "Permitir trocas pós-compra", com o período (TS-1816).
 */
export function ConfiguracoesAvancadas({ aberto, onClose }: { aberto: boolean; onClose: () => void }) {
    const S = useTroca();
    const [grupos, setGrupos] = useState("permitir");
    const [estoque, setEstoque] = useState("manter");
    const [reserva, setReserva] = useState("desativada");
    const [trocas, setTrocas] = useState("sim");
    const [ini, setIni] = useState<DateValue | null>(null);
    const [fim, setFim] = useState<DateValue | null>(null);
    const [sugerido, setSugerido] = useState(false);
    const [erros, setErros] = useState<{ ini?: string; fim?: string }>({});

    // Ao abrir, carrega o que está salvo. Sem período, o fim sugerido é a última sessão.
    useEffect(() => {
        if (!aberto) return;
        setTrocas(S.permitir ? "sim" : "nao");
        setIni(S.permitir ? tsParaData(S.periodo.ini) : null);
        setFim(tsParaData(S.permitir ? S.periodo.fim : EVENTO.ultima));
        setSugerido(!S.permitir);
        setErros({});
    }, [aberto]); // eslint-disable-line react-hooks/exhaustive-deps

    const confirmar = () => {
        const e: { ini?: string; fim?: string } = {};
        if (trocas === "sim") {
            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);
            (
                [
                    ["ini", ini, "Informe a data e a hora do início"],
                    ["fim", fim, "Informe a data e a hora do fim"],
                ] as const
            ).forEach(([k, v, vazio]) => {
                const ts = dataParaTs(v);
                if (ts == null) e[k] = vazio;
                else if (ts < hoje.getTime()) e[k] = "Informe uma data futura para continuar";
                else if (ts < Date.now()) e[k] = "Informe um horário futuro";
                else if (ts > EVENTO.ultima) e[k] = `Não pode ser depois da última sessão (${ate(EVENTO.ultima)})`;
            });
            if (!e.ini && !e.fim && dataParaTs(fim)! <= dataParaTs(ini)!) e.fim = "A data final precisa ser depois da inicial";
        }
        setErros(e);
        if (Object.keys(e).length) return;
        salvarConfigTrocas(trocas === "sim", trocas === "sim" ? { ini: dataParaTs(ini)!, fim: dataParaTs(fim)! } : undefined);
        toast.success("Configurações salvas");
        onClose();
    };

    const ultimoDia = toCalendarDate(tsParaData(EVENTO.ultima)!);

    return (
        // Mesmo slideout do DS, um pouco mais largo para caber os textos do segmentado.
        <ModalOverlay isOpen={aberto} onOpenChange={(o) => !o && onClose()} isDismissable>
            <Modal className="max-w-[560px]">
                <Dialog aria-labelledby="avancadas-h">
            <SlideoutMenu.Header onClose={onClose} className="border-b border-secondary pb-5">
                <h2 id="avancadas-h" className="text-display-xs font-bold text-primary">Configurações avançadas</h2>
            </SlideoutMenu.Header>
            <SlideoutMenu.Content className="gap-0 pt-6">
                <h3 className="pb-4 text-lg font-semibold text-primary">Vendas</h3>

                <Bloco titulo="Compras em diferentes grupos de ingresso">
                    <Segmentado valor={grupos} onChange={setGrupos} opcoes={[["permitir", "Permitir"], ["proibir", "Proibir"]]} />
                </Bloco>

                <Bloco
                    titulo="Estoque devolvido de lotes esgotados"
                    texto="Quando um pedido não pago libera estoque de um lote já esgotado, a quantidade pode ser somada ao limite do lote ativo e voltar a ser vendida pelo preço atual. O lote de origem continua esgotado."
                >
                    <Segmentado valor={estoque} onChange={setEstoque} opcoes={[["manter", "Manter no lote de origem"], ["realocar", "Realocar para o lote ativo"]]} />
                </Bloco>

                <Bloco titulo="Permitir trocas pós-compra" texto="Quando habilitado, o comprador pode trocar os itens comprados pela carteira dentro do período definido.">
                    <Segmentado valor={trocas} onChange={setTrocas} opcoes={[["sim", "Sim"], ["nao", "Não"]]} />
                    {trocas === "sim" && (
                        <div className="mt-2 flex animate-in flex-col gap-4 duration-200 fade-in slide-in-from-top-1">
                            <h4 className="text-md font-semibold text-primary">Período de trocas</h4>
                            <div className="grid gap-4">
                                <CampoDataHora
                                    label="Início"
                                    value={ini}
                                    max={ultimoDia}
                                    erro={erros.ini}
                                    onChange={(v) => {
                                        setIni(v);
                                        setErros((x) => ({ ...x, ini: undefined }));
                                    }}
                                />
                                <CampoDataHora
                                    label="Fim"
                                    value={fim}
                                    max={ultimoDia}
                                    erro={erros.fim}
                                    hint={sugerido ? "Sugerido até a última sessão do evento. Ajuste se precisar." : undefined}
                                    onChange={(v) => {
                                        setFim(v);
                                        setSugerido(false);
                                        setErros((x) => ({ ...x, fim: undefined }));
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </Bloco>

                <Bloco
                    titulo="Reserva de ingressos na compra"
                    texto="Quando ativada, os ingressos escolhidos ficam reservados por tempo limitado enquanto o comprador conclui a compra."
                    ultimo
                >
                    <Segmentado valor={reserva} onChange={setReserva} opcoes={[["desativada", "Desativada"], ["ativada", "Ativada"]]} />
                </Bloco>
            </SlideoutMenu.Content>
            <SlideoutMenu.Footer className="flex justify-end">
                <Button size="md" color="primary" onClick={confirmar}>
                    Confirmar
                </Button>
            </SlideoutMenu.Footer>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
}

function Bloco({ titulo, texto, children, ultimo }: { titulo: string; texto?: string; children: React.ReactNode; ultimo?: boolean }) {
    return (
        <section className={`flex flex-col gap-3 py-5 ${ultimo ? "" : "border-b border-secondary"}`}>
            <h4 className="text-md font-semibold text-primary">{titulo}</h4>
            {texto && <p className="text-sm text-tertiary">{texto}</p>}
            {children}
        </section>
    );
}

function Segmentado({ valor, onChange, opcoes }: { valor: string; onChange: (v: string) => void; opcoes: [string, string][] }) {
    return (
        <ButtonGroup
            size="sm"
            selectedKeys={new Set([valor])}
            disallowEmptySelection
            onSelectionChange={(keys) => {
                const k = [...keys][0];
                if (k) onChange(String(k));
            }}
        >
            {opcoes.map(([id, t]) => (
                <ButtonGroupItem key={id} id={id}>
                    {t}
                </ButtonGroupItem>
            ))}
        </ButtonGroup>
    );
}
