import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { ButtonGroup, ButtonGroupItem } from "@/components/base/button-group/button-group";
import { Input } from "@/components/base/input/input";
import { Select } from "@/components/base/select/select";
import { Toggle } from "@/components/base/toggle/toggle";
import { Surgir } from "@/components/foundations/transicao";
import type { CategoriaLimite, ConfiguracoesAvancadas, Evento, LimitesPorUsuario } from "@/plataforma";
import { AVANCADO_PADRAO, CATEGORIAS_DE_LIMITE } from "../../eventos/data/configuracoes-avancadas";
import { useOpcoesEvento } from "../../eventos/data/opcoes-evento";
import { salvarConfiguracoes, salvarLimites } from "../data/catalogo";

/*
 * Configurações de ingressos do evento (ITM-66): as configurações avançadas que saíram da criação
 * de evento (EVT-84). Valem para o evento todo e gravam na hora, como o resto de Itens.
 * A política continua na criação e aparece aqui também, para ser trocada depois.
 */

interface Opcao {
    id: string;
    label: string;
}

const Linha = ({ titulo, descricao, children }: { titulo: string; descricao?: string; children: ReactNode }) => (
    <div className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 md:flex-row md:items-center md:justify-between md:gap-8">
        <div className="flex min-w-0 flex-col gap-0.5 md:max-w-md">
            <span className="text-sm font-semibold text-primary">{titulo}</span>
            {descricao && <span className="text-sm text-tertiary">{descricao}</span>}
        </div>
        <div className="shrink-0">{children}</div>
    </div>
);

const Escolha = ({ rotulo, valor, opcoes, onChange }: { rotulo: string; valor: string; opcoes: Opcao[]; onChange: (v: string) => void }) => (
    <ButtonGroup
        size="sm"
        aria-label={rotulo}
        selectedKeys={new Set([valor])}
        onSelectionChange={(keys) => {
            const v = [...keys][0];
            if (v && v !== valor) onChange(String(v));
        }}
        disallowEmptySelection
    >
        {opcoes.map((o) => (
            <ButtonGroupItem key={o.id} id={o.id}>
                {o.label}
            </ButtonGroupItem>
        ))}
    </ButtonGroup>
);

const Lista = ({ rotulo, valor, opcoes, carregando, onChange }: { rotulo: string; valor: string; opcoes: Opcao[]; carregando: boolean; onChange: (v: string) => void }) => (
    <Select
        aria-label={rotulo}
        size="sm"
        className="w-full md:w-72"
        placeholder={carregando ? "Carregando…" : "Selecione"}
        isDisabled={carregando}
        items={opcoes}
        selectedKey={valor || null}
        onSelectionChange={(k) => k != null && String(k) !== valor && onChange(String(k))}
    >
        {(o) => <Select.Item id={o.id}>{o.label}</Select.Item>}
    </Select>
);

export function ConfiguracoesDeIngressos({ evento }: { evento: Evento }) {
    const opcoes = useOpcoesEvento();
    const carregando = opcoes.status === "carregando";
    // Eventos antigos, sem o campo, usam o padrão da criação.
    const atual: ConfiguracoesAvancadas = { ...AVANCADO_PADRAO, ...evento.avancado };
    // Troca de setor só existe no futebol com assento marcado; acesso por face, só no futebol (ITM-88).
    const futebol = evento.tipo === "futebol";
    const assentoMarcado = futebol && evento.mapa?.tipo === "assentos";

    const mudar = async <K extends keyof ConfiguracoesAvancadas>(k: K, v: ConfiguracoesAvancadas[K], _titulo?: string) => {
        try {
            await salvarConfiguracoes(evento, { ...atual, [k]: v });
            toast.success("Configuração salva.");
        } catch {
            toast.error("Não foi possível salvar. Tente de novo.");
        }
    };

    const limites: LimitesPorUsuario = evento.limites ?? { geral: null, porCategoria: {} };
    const mudarLimite = async (c: CategoriaLimite, v: number | null) => {
        try {
            await salvarLimites(evento, { ...limites, porCategoria: { ...limites.porCategoria, [c]: v } });
            toast.success("Limite salvo.");
        } catch {
            toast.error("Não foi possível salvar. Tente de novo.");
        }
    };

    return (
        <div className="flex flex-col gap-6">
        <section aria-labelledby="regras-de-compra" className="flex flex-col gap-5 rounded-2xl bg-primary p-5 ring-1 ring-secondary md:p-6">
        <h2 id="regras-de-compra" className="text-lg font-semibold text-primary">Compra e acesso</h2>
        <div className="flex flex-col divide-y divide-secondary">
            <Linha titulo="Compras em diferentes grupos de ingressos" descricao="Um mesmo pedido pode ter ingressos de grupos diferentes.">
                <Escolha
                    rotulo="Compras em diferentes grupos de ingressos"
                    valor={atual.comprasEntreGrupos ? "sim" : "nao"}
                    opcoes={[
                        { id: "sim", label: "Permitir" },
                        { id: "nao", label: "Proibir" },
                    ]}
                    onChange={(v) => mudar("comprasEntreGrupos", v === "sim", "Compras em diferentes grupos")}
                />
            </Linha>
            <Linha
                titulo="Estoque devolvido de lotes esgotados"
                descricao="Quando um pedido não pago libera estoque de um lote já esgotado. Realocar soma a quantidade ao lote ativo, vendida pelo preço atual; o lote de origem continua esgotado."
            >
                <Escolha
                    rotulo="Estoque devolvido de lotes esgotados"
                    valor={atual.estoqueDevolvido}
                    opcoes={[
                        { id: "lote-origem", label: "Manter no lote de origem" },
                        { id: "lote-ativo", label: "Realocar para o lote ativo" },
                    ]}
                    onChange={(v) => mudar("estoqueDevolvido", v as ConfiguracoesAvancadas["estoqueDevolvido"], "Estoque devolvido")}
                />
            </Linha>
            {assentoMarcado && (
                <Linha titulo="Permitir troca de setor">
                    <Toggle aria-label="Permitir troca de setor" isSelected={atual.trocaDeSetor} onChange={(v) => mudar("trocaDeSetor", v, "Troca de setor")} />
                </Linha>
            )}
            <Linha titulo="Reserva de ingressos na compra">
                <Toggle aria-label="Reserva de ingressos na compra" isSelected={atual.reservaNaCompra} onChange={(v) => mudar("reservaNaCompra", v, "Reserva na compra")} />
            </Linha>
            <Linha titulo="Limite por comprador na Bilheteria online">
                <Escolha
                    rotulo="Limite por comprador na Bilheteria online"
                    valor={atual.limiteBilheteriaOnline}
                    opcoes={[
                        { id: "sem-limite", label: "Sem limite" },
                        { id: "aplicar", label: "Aplicar limites" },
                    ]}
                    onChange={(v) => mudar("limiteBilheteriaOnline", v as ConfiguracoesAvancadas["limiteBilheteriaOnline"], "Limite na Bilheteria online")}
                />
            </Linha>
            <Linha titulo="Política">
                <Lista rotulo="Política" valor={atual.politicaId ?? ""} opcoes={opcoes.dados?.politicas ?? []} carregando={carregando} onChange={(v) => mudar("politicaId", v, "Política")} />
            </Linha>
            {futebol && (
                <Linha titulo="Acesso por face" descricao="Serviço de gestão facial.">
                    <Lista rotulo="Acesso por face" valor={atual.acessoFacialId ?? ""} opcoes={opcoes.dados?.acessoFacial ?? []} carregando={carregando} onChange={(v) => mudar("acessoFacialId", v, "Acesso por face")} />
                </Linha>
            )}
            <Linha titulo="QR code no e-mail de confirmação">
                <Escolha
                    rotulo="QR code no e-mail de confirmação"
                    valor={atual.qrCodeNoEmail ? "sim" : "nao"}
                    opcoes={[
                        { id: "sim", label: "Incluir" },
                        { id: "nao", label: "Não incluir" },
                    ]}
                    onChange={(v) => mudar("qrCodeNoEmail", v === "sim", "QR code no e-mail")}
                />
            </Linha>
        </div>
        </section>

        {/* Limites saíram da criação do evento (EVT-57): nascem ilimitados e se definem aqui (ITM-67). */}
        <section aria-labelledby="limites-por-pessoa" className="flex flex-col gap-5 rounded-2xl bg-primary p-5 ring-1 ring-secondary md:p-6">
            <div className="flex flex-col gap-0.5">
                <h2 id="limites-por-pessoa" className="text-lg font-semibold text-primary">Limites por pessoa</h2>
                <p className="text-sm text-tertiary">Quantos itens de cada categoria uma pessoa pode comprar no evento.</p>
            </div>
            <div className="flex flex-col divide-y divide-secondary">
                {/* Sócio torcedor só existe no futebol (programa de membros, EVT-85). */}
                {CATEGORIAS_DE_LIMITE.filter((c) => c.id !== "socio-torcedor" || futebol).map((c) => (
                    <LimiteDaCategoria
                        key={c.id}
                        titulo={evento.tipo === "esportivo" && c.esportivo ? c.esportivo : c.label}
                        valor={limites.porCategoria[c.id] ?? null}
                        onSalvar={(v) => mudarLimite(c.id, v)}
                    />
                ))}
            </div>
        </section>
        </div>
    );
}

/**
 * Uma linha por categoria (ITM-67): "Sem limite" (padrão) ou "Limitar", que mostra a quantidade
 * deslizando. A quantidade grava ao sair do campo, só com número maior que zero; sem número, o erro
 * fica na tela e nada é gravado. "Sem limite" grava na hora.
 */
function LimiteDaCategoria({ titulo, valor, onSalvar }: { titulo: string; valor: number | null; onSalvar: (v: number | null) => void }) {
    const [limitado, setLimitado] = useState(valor !== null);
    const [texto, setTexto] = useState(valor ? String(valor) : "");
    const [tocado, setTocado] = useState(false);
    const quantidade = Number(texto);
    const invalido = tocado && limitado && !(quantidade > 0);

    return (
        <div className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 md:flex-row md:items-start md:justify-between md:gap-6">
            {/* Mesmo degrau dos títulos de linha da seção de cima (UI-VIS-018); a altura acompanha os botões. */}
            <span className="text-sm font-semibold text-primary md:leading-9">{titulo}</span>
            <div className="flex flex-col gap-3 md:items-end">
                {/* O nome do controle leva a categoria: no leitor de tela, cada linha se distingue (UI-A11Y-002). */}
                <Escolha
                    rotulo={`Limite de ${titulo}`}
                    valor={limitado ? "limitar" : "sem-limite"}
                    opcoes={[
                        { id: "sem-limite", label: "Sem limite" },
                        { id: "limitar", label: "Limitar" },
                    ]}
                    onChange={(v) => {
                        const limitar = v === "limitar";
                        setLimitado(limitar);
                        setTocado(false);
                        if (!limitar && valor !== null) onSalvar(null);
                    }}
                />
                <Surgir visivel={limitado} gap={12} className="w-full md:w-56">
                    <Input
                        label={`Máximo de ${titulo} por pessoa`}
                        inputMode="numeric"
                        placeholder="Ex.: 4"
                        value={texto}
                        // Só dígitos, até 6: sem as setas e a rolagem do campo numérico do navegador.
                        onChange={(v) => setTexto(v.replace(/\D/g, "").slice(0, 6))}
                        onBlur={() => {
                            setTocado(true);
                            if (quantidade > 0 && quantidade !== valor) onSalvar(quantidade);
                        }}
                        isInvalid={invalido}
                        hint={invalido ? "Informe um número para salvar o limite." : undefined}
                    />
                </Surgir>
            </div>
        </div>
    );
}
