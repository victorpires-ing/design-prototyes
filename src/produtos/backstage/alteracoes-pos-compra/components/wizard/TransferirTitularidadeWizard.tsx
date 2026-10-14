import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { ChevronDown, ChevronRight, Copy01, SearchLg } from "@untitledui/icons";
import { Avatar } from "@/components/base/avatar/avatar";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { cx } from "@/utils/cx";
import { Aviso, CampoMotivo, FOCO, MOTIVO_INICIAL, Miniatura, Regra, ResumoFinanceiro, SetaParaBaixo, iniciaisDe, mascararCPF, mascararEmail } from "../pos-compra-ui";
import {
    OPERADOR_ATUAL,
    TIPO_OPERACAO_LABEL,
    buscarContas,
    calcularTrocaTitularidade,
    criarSolicitacao,
    disponivelPara,
    formatarMoeda,
    getConta,
    getFormulario,
    getItem,
    nominalDoItem,
    getRascunho,
    motivoValido,
    novoRascunhoId,
    removerRascunho,
    salvarRascunho,
    titularDaLinha,
    usePerguntas,
    useRascunhos,
    uuidCurto,
    validarNovoTitular,
    type Conta,
    type Motivo,
    type Pedido,
    type PedidoItem,
    type Pergunta,
    type Rascunho,
} from "../../data/pos-compra-store";
import { WizardShell } from "./WizardShell";
import { ResumoUnidades, SeletorUnidades, avisarRascunhoSalvo, detalheDoItem } from "./seletor-unidades";

/*
  Sem etapa de formulário: a titularidade NÃO altera respostas. O novo possuidor
  herda todas (576978948 §4 e H-23); mudar resposta é a Troca de perguntas, feita
  depois e como operação separada (§10, C12).
*/
type Etapa = "itens" | "destinatario" | "revisao";

const TITULO_ETAPA: Record<Etapa, string> = {
    itens: "Itens",
    destinatario: "Destinatário",
    formularios: "Formulários",
    revisao: "Revisão",
};

/** Teto da lista quando há espaço de sobra, e o respiro até a borda que a recorta. */
const ALTURA_SUGESTOES = 288;
const FOLGA_SUGESTOES = 12;
/** Cerca de duas sugestões. Abaixo disso compensa abrir a lista para cima. */
const MINIMO_SUGESTOES = 132;

/**
 * Até onde a lista pode descer sem ser recortada: a janela, interceptada com todo
 * ancestral que esconde o que passa da borda. O overlay é um desses — a lista nascia
 * com 288px fixos, era pintada para fora dele e as sugestões de baixo não recebiam
 * clique nenhum (elementFromPoint devolvia nada nelas).
 */
const areaVisivel = (no: HTMLElement) => {
    let topo = 0;
    let base = window.innerHeight;
    for (let pai = no.parentElement; pai; pai = pai.parentElement) {
        const estilo = getComputedStyle(pai);
        if (estilo.overflowY === "visible" && estilo.overflowX === "visible") continue;
        const caixa = pai.getBoundingClientRect();
        topo = Math.max(topo, caixa.top);
        base = Math.min(base, caixa.bottom);
    }
    return { topo, base };
};

interface TransferirTitularidadeWizardProps {
    pedido: Pedido;
    linhasIniciais: string[];
    rascunhoInicial?: Rascunho;
    onFechar: () => void;
    /** Cobrança criada: o pedido rola até o cartão novo. */
    onEnviado: (solicitacaoId: string) => void;
}

export function TransferirTitularidadeWizard({ pedido, linhasIniciais, rascunhoInicial, onFechar, onEnviado }: TransferirTitularidadeWizardProps) {
    const perguntas = usePerguntas();
    const rascunhos = useRascunhos(pedido.id);
    const rascunhoId = useState(() => rascunhoInicial?.id ?? novoRascunhoId())[0];

    /* Retomar de verdade: destinatário, busca, respostas e motivo voltam como estavam. Antes a
       retomada restaurava só a seleção e a etapa, e as etapas seguintes abriam em branco. */
    const contaInicial = rascunhoInicial?.titularPorLinha ? getConta(Object.values(rascunhoInicial.titularPorLinha)[0] ?? "") : undefined;
    const linhasDisponiveis = pedido.itens.filter((l) => disponivelPara(pedido, l, "transferir"));
    const pedidas = rascunhoInicial?.linhasSelecionadas ?? linhasIniciais;
    const perdidas = rascunhoInicial ? pedidas.filter((id) => !linhasDisponiveis.some((l) => l.id === id)).length : 0;

    const [indice, setIndice] = useState(() => (linhasDisponiveis.some((l) => linhasIniciais.includes(l.id)) ? 1 : 0));
    const buscaRef = useRef<HTMLDivElement>(null);
    const avisoRef = useRef<HTMLDivElement>(null);
    const [sugerindo, setSugerindo] = useState(false);
    const [encaixe, setEncaixe] = useState({ altura: ALTURA_SUGESTOES, acima: false });
    const [focado, setFocado] = useState(0);
    const [busca, setBusca] = useState(rascunhoInicial?.busca ?? contaInicial?.nome ?? "");
    const [motivo, setMotivo] = useState<Motivo>(rascunhoInicial?.motivo ?? MOTIVO_INICIAL);
    const [selecionada, setSelecionada] = useState<Conta | null>(contaInicial ?? null);
    const [selecao, setSelecao] = useState<Record<string, boolean>>(() => Object.fromEntries(pedidas.map((id) => [id, true])));
    const [aberta, setAberta] = useState<string | null>(null);
    const destino = selecionada?.email ?? "";

    const linhas = linhasDisponiveis.filter((l) => selecao[l.id]);
    const calculo = calcularTrocaTitularidade(linhas.length);
    const titularAtual = linhas[0] ? titularDaLinha(pedido, linhas[0]) : undefined;
    const comprador = getConta(pedido.compradorId);
    const emOutroRascunho = rascunhos.find((r) => r.id !== rascunhoId && r.linhasSelecionadas.some((id) => selecao[id]));

    /* Ingresso nominal é uma unidade por pessoa: duas do mesmo item não cabem num destinatário
       só. O problema é da seleção, então ele para a seleção — sem isso a pessoa só descobria na
       etapa seguinte, quando a busca inteira voltava marcada "Já vinculado". */
    const porItem = new Map<string, number>();
    linhas.forEach((l) => porItem.set(l.itemId, (porItem.get(l.itemId) ?? 0) + 1));
    const repetido = [...porItem.entries()].map(([itemId, quantas]) => ({ item: getItem(itemId), quantas })).find(({ item, quantas }) => quantas > 1 && item && nominalDoItem(item));

    /* ------------------------------------------------------------------ */
    /*  Destinatário: busca por nome, e-mail ou CPF, contra toda a base     */
    /* ------------------------------------------------------------------ */

    const termo = busca.trim();
    const encontradas = buscarContas(termo);
    const bloqueiosDaConta = (conta: Conta) => linhas.map((linha) => ({ linha, bloqueio: validarNovoTitular(pedido, linha, conta, linhas) })).filter((b) => b.bloqueio);
    const sugestoesAbertas = sugerindo && encontradas.length > 0;

    const bloqueiosPorLinha = selecionada ? bloqueiosDaConta(selecionada) : [];

    /* ------------------------------------------------------------------ */
    /*  Formulários                                                        */
    /* ------------------------------------------------------------------ */

    const perguntasDaLinha = (linha: PedidoItem): Pergunta[] => (getFormulario(getItem(linha.itemId)?.formularioId)?.perguntaIds ?? []).map((id) => perguntas.find((p) => p.id === id)).filter(Boolean) as Pergunta[];
    const comFormulario = linhas.filter((linha) => perguntasDaLinha(linha).length > 0);
    /* ------------------------------------------------------------------ */
    /*  Etapas                                                             */
    /* ------------------------------------------------------------------ */

    /* "Itens" é sempre a primeira etapa: vindo de uma linha, ela já nasce concluída e o fluxo
       começa no destinatário, mas "Alterar" e "Voltar" levam até ela sem fechar o overlay. */
    const etapas: Etapa[] = ["itens", "destinatario", "revisao"];
    const etapa = etapas[Math.min(indice, etapas.length - 1)];

    /*
      Semântica de combobox no <input> real. O `Input` do DS espalha os props no
      wrapper do TextField, não no elemento, então `role` e `aria-*` passados por
      prop não chegam ao leitor de tela — conferido: voltavam null. Daí o ref.
    */
    useEffect(() => {
        const campo = buscaRef.current?.querySelector("input");
        if (!campo) return;
        campo.setAttribute("role", "combobox");
        campo.setAttribute("aria-autocomplete", "list");
        campo.setAttribute("aria-controls", "sugestoes-destinatario");
        campo.setAttribute("aria-expanded", String(sugestoesAbertas));
    }, [sugestoesAbertas, etapa]);

    /* A lista só cabe onde o overlay deixa. Mede o espaço livre abaixo do campo,
       vira para cima quando lá embaixo cabe menos, e limita a altura ao que sobrou —
       o resto a lista rola por dentro, com toda sugestão ao alcance do clique.
       Antes era um scrollIntoView("nearest") que não dava conta: a lista continuava
       maior que a área visível e metade dela ficava fora, morta. */
    useLayoutEffect(() => {
        if (!sugestoesAbertas) return;
        const medir = () => {
            const campo = buscaRef.current;
            if (!campo) return;
            const caixa = campo.getBoundingClientRect();
            const { topo, base } = areaVisivel(campo);
            const abaixo = base - caixa.bottom - FOLGA_SUGESTOES;
            const acima = caixa.top - topo - FOLGA_SUGESTOES;
            const paraCima = abaixo < MINIMO_SUGESTOES && acima > abaixo;
            setEncaixe({ altura: Math.max(96, Math.min(ALTURA_SUGESTOES, paraCima ? acima : abaixo)), acima: paraCima });
        };
        medir();
        /* O overlay rola e a janela muda de tamanho: a lista acompanha o campo,
           mas o espaço livre embaixo dele não é o mesmo. Captura pega o scroll
           do container interno, que não borbulha. */
        window.addEventListener("resize", medir);
        document.addEventListener("scroll", medir, true);
        return () => {
            window.removeEventListener("resize", medir);
            document.removeEventListener("scroll", medir, true);
        };
    }, [sugestoesAbertas, encontradas.length]);

    /* Fecha ao clicar fora, como qualquer sugestão de busca. */
    useEffect(() => {
        if (!sugestoesAbertas) return;
        const fora = (e: MouseEvent) => {
            if (!buscaRef.current?.contains(e.target as Node)) setSugerindo(false);
        };
        document.addEventListener("mousedown", fora);
        return () => document.removeEventListener("mousedown", fora);
    }, [sugestoesAbertas]);

    /* Setas percorrem, Enter escolhe, Esc fecha sem perder o que foi digitado. */
    const aoTeclar = (e: ReactKeyboardEvent) => {
        if (!sugestoesAbertas) {
            if (e.key === "ArrowDown" && encontradas.length > 0) setSugerindo(true);
            return;
        }
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setFocado((n) => (n + 1) % encontradas.length);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setFocado((n) => (n - 1 + encontradas.length) % encontradas.length);
        } else if (e.key === "Enter") {
            e.preventDefault();
            const alvo = encontradas[focado];
            if (alvo) escolherDestinatario(alvo);
        } else if (e.key === "Escape") {
            e.preventDefault();
            setSugerindo(false);
        }
    };

    useEffect(() => {
        if (!rascunhoInicial) return;
        const alvo = etapas.indexOf(rascunhoInicial.etapa as Etapa);
        if (alvo >= 0) setIndice(alvo);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const podeAvancar =
        etapa === "itens"
            ? linhas.length > 0 && !repetido
            : etapa === "destinatario"
              ? Boolean(selecionada) && bloqueiosPorLinha.length === 0
              : Boolean(selecionada) && motivoValido(motivo);

    const rotuloAvancar = etapa === "itens" ? "Escolher destinatário" : "Revisar transferência";

    const salvarProgresso = (proximaEtapa: string, destinatario: Conta | null = selecionada) =>
        salvarRascunho({
            id: rascunhoId,
            pedidoId: pedido.id,
            tipo: "troca-titularidade",
            etapa: proximaEtapa,
            linhasSelecionadas: linhas.map((l) => l.id),
            titularPorLinha: destinatario ? Object.fromEntries(linhas.map((l) => [l.id, destinatario.id])) : undefined,
            motivo,
            busca,
            operador: OPERADOR_ATUAL,
        });

    /* Fechar nunca perde trabalho: se já havia algo além da unidade escolhida, guarda o rascunho
       e avisa, com "Descartar". Abrir e fechar sem fazer nada não deixa rastro. */
    const fechar = () => {
        const fezAlgo = Boolean(rascunhoInicial || selecionada || termo || motivo.nota.trim() || motivo.chamado.trim());
        if (fezAlgo && linhas.length > 0) {
            salvarProgresso(etapa);
            avisarRascunhoSalvo(getRascunho(rascunhoId));
        }
        onFechar();
    };

    const avancar = () => {
        salvarProgresso(etapas[Math.min(indice + 1, etapas.length - 1)]);
        setIndice((i) => i + 1);
    };
    const voltar = () => (indice === 0 ? fechar() : setIndice((i) => i - 1));
    const incluir = (ids: string[]) => setSelecao((atual) => ({ ...atual, ...Object.fromEntries(ids.map((id) => [id, true])) }));

    /* Clicar no card já escolhe e avança. Só não avança quando a conta está bloqueada para algum
       item: aí fica na etapa, e o aviso abaixo da lista explica por quê. */
    const escolherDestinatario = (conta: Conta) => {
        setSelecionada(conta);
        setSugerindo(false);
        if (bloqueiosDaConta(conta).length > 0) {
            /* Fica na etapa e leva os olhos até o motivo. Sem isso a lista continuava
               aberta por cima do aviso e o clique parecia não ter feito nada. */
            const suave = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            requestAnimationFrame(() => avisoRef.current?.scrollIntoView({ block: "nearest", behavior: suave ? "smooth" : "auto" }));
            return;
        }
        salvarProgresso(etapas[Math.min(indice + 1, etapas.length - 1)], conta);
        setIndice((i) => i + 1);
    };

    const confirmar = () => {
        if (!selecionada) return;

        /* H-23: o novo possuidor herda as respostas como estão. A titularidade não as altera. */
        const porItem = new Map<string, number>();
        linhas.forEach((l) => porItem.set(l.itemId, (porItem.get(l.itemId) ?? 0) + 1));
        const detalhes = [
            ...[...porItem.entries()].map(([itemId, quantidade]) => {
                const item = getItem(itemId);
                return [`${quantidade}x ${item?.nome}`, detalheDoItem(item)].filter(Boolean).join(" · ");
            }),
            `De ${titularAtual?.nome} para ${selecionada.nome} (${selecionada.email})`,
        ];

        const id = criarSolicitacao({
            pedidoId: pedido.id,
            tipo: "troca-titularidade",
            detalhes,
            linhasAfetadas: linhas.map((l) => l.id),
            resumo: `${linhas.length} ${linhas.length === 1 ? "item transferido" : "itens transferidos"} para ${selecionada.nome}. Comprador original preservado.`,
            calculo,
            /* Só o possuidor muda. As respostas seguem como estão, herdadas (H-23). */
            aplicar: { titularPorLinha: Object.fromEntries(linhas.map((l) => [l.id, selecionada.id])) },
            reservas: [],
            canalEnvio: "email",
            destinatarioEnvio: destino,
            motivo,
        });
        if (!id) {
            toast.error("Uma das unidades entrou em outra alteração enquanto você montava esta. Confira o pedido e tente de novo.");
            return;
        }

        removerRascunho(rascunhoId);
        toast.success(`Cobrança de transferência enviada para ${destino}.`);
        onEnviado(id);
    };

    const colunaEstreita = etapa === "destinatario" || etapa === "revisao";

    return (
        <WizardShell
            isOpen
            onClose={fechar}
            titulo="Transferir"
            subtitulo={`${comprador?.nome ?? "Comprador"} · Pedido ${uuidCurto(pedido.id)}`}
            etapas={etapas.map((e) => TITULO_ETAPA[e])}
            indiceAtual={indice}
            podeAvancar={podeAvancar}
            ocultarRodape={etapa === "destinatario"}
            rotuloAvancar={rotuloAvancar}
            ultimaEtapa={etapa === "revisao"}
            rotuloConfirmar={`Enviar cobrança de ${formatarMoeda(calculo.total)} para ${mascararEmail(destino)}`}
            onVoltar={voltar}
            onAvancar={avancar}
            onConfirmar={confirmar}
        >
            <div className={cx("flex w-full flex-col gap-5", colunaEstreita && "items-center")}>
                {perdidas > 0 && (
                    <div className="w-full">
                        <Aviso tom="warning" titulo={perdidas === 1 ? "1 unidade saiu desta transferência" : `${perdidas} unidades saíram desta transferência`} descricao="Elas já estão em outra alteração ou com outro titular." />
                    </div>
                )}
                {emOutroRascunho && (
                    <div className="w-full">
                        <Aviso tom="warning" titulo={`Unidade também está num rascunho de ${TIPO_OPERACAO_LABEL[emOutroRascunho.tipo].toLowerCase()}`} descricao={`Não enviado, de ${emOutroRascunho.operador}. Rascunho não trava a unidade: quem enviar primeiro vale.`} />
                    </div>
                )}

                {etapa === "itens" && (
                    <div className="flex w-full flex-col gap-4">
                        <SeletorUnidades pedido={pedido} verbo="transferir" selecao={selecao} onChange={setSelecao} />
                        {repetido && (
                            <Aviso
                                tom="warning"
                                titulo={`${repetido.item?.nome} é nominal: uma unidade por pessoa`}
                                descricao={`Você escolheu ${repetido.quantas} unidades e elas não cabem num destinatário só. Deixe uma, ou faça uma transferência para cada pessoa.`}
                            />
                        )}
                    </div>
                )}

                {etapa === "destinatario" && (
                    <>
                        <ResumoUnidades pedido={pedido} linhas={linhas} verbo="transferir" titulo="Transferindo" onAlterar={() => setIndice(0)} onIncluir={incluir} />
                        <SetaParaBaixo />

                        {/*
                              Campo e resultados são UM elemento: a lista é um popover
                              ancorado no input, como busca de site. Antes eram dois cards
                              separados por um vão, e o segundo empurrava o resto da etapa
                              para baixo a cada letra digitada.
                            */}
                            <div ref={buscaRef} className="relative w-full">
                                <Input
                                    icon={SearchLg}
                                    label="Nome, e-mail ou CPF de quem vai receber"
                                    placeholder="Nome completo, e-mail ou CPF"
                                    value={busca}
                                    onChange={(valor) => {
                                        setBusca(valor);
                                        setSelecionada(null);
                                        setSugerindo(true);
                                        setFocado(0);
                                    }}
                                    onKeyDown={aoTeclar}
                                    autoComplete="off"
                                    hint={termo && encontradas.length === 0 ? undefined : "Busque pelo nome, não precisa saber o e-mail ou CPF de cor."}
                                />

                                {sugestoesAbertas && (
                                    <ul
                                        id="sugestoes-destinatario"
                                        role="listbox"
                                        aria-label="Contas encontradas"
                                        style={{ maxHeight: encaixe.altura }}
                                        className={cx(
                                            "absolute right-0 left-0 z-20 overflow-y-auto rounded-xl bg-primary py-1 shadow-lg ring-1 ring-border-secondary",
                                            encaixe.acima ? "bottom-full mb-1" : "top-full mt-1",
                                        )}
                                    >
                                        {encontradas.map((conta, i) => {
                                            const impedida = bloqueiosDaConta(conta)[0]?.bloqueio;
                                            return (
                                            <li key={conta.id} role="option" aria-selected={i === focado}>
                                                <button
                                                    type="button"
                                                    tabIndex={-1}
                                                    onMouseEnter={() => setFocado(i)}
                                                    /* Escolhe ao apertar, não ao soltar: se a lista se mexer entre o
                                                       mousedown e o mouseup — rolagem, reposicionamento — o clique
                                                       nunca chega. É o que o combobox do React Aria também faz. */
                                                    onPointerDown={(e) => {
                                                        e.preventDefault();
                                                        escolherDestinatario(conta);
                                                    }}
                                                    className={cx(
                                                        "flex w-full items-center gap-3 px-4 py-3 text-left transition duration-100 ease-linear",
                                                        i === focado ? "bg-secondary" : "hover:bg-primary_hover",
                                                        impedida && "opacity-60",
                                                    )}
                                                >
                                                    <Avatar size="md" initials={iniciaisDe(conta.nome)} alt={conta.nome} />
                                                    <span className="min-w-0 flex-1">
                                                        <span className="block text-sm font-semibold text-primary">{conta.nome}</span>
                                                        <span className="block truncate text-sm text-tertiary">
                                                            {conta.email}
                                                            {conta.cpf && ` · CPF ${mascararCPF(conta.cpf)}`}
                                                        </span>
                                                    </span>
                                                    {impedida ? (
                                                        <span className="shrink-0 text-sm text-warning-primary">{impedida.curto}</span>
                                                    ) : (
                                                        <ChevronRight className="size-5 shrink-0 text-fg-quaternary" aria-hidden="true" />
                                                    )}
                                                </button>
                                            </li>
                                            );
                                        })}
                                    </ul>
                                )}
                            </div>

                            {/* V08: sem conta a operação é bloqueada. O fluxo NÃO cria conta (§4, C14). */}
                            {termo && encontradas.length === 0 ? (
                                <Aviso
                                    tom="warning"
                                    titulo="Conta não encontrada"
                                    descricao="O novo participante precisa se cadastrar antes da troca. A transferência não cria conta: oriente o cadastro e retome depois."
                                />
                            ) : null}

                            {selecionada && bloqueiosPorLinha.length > 0 && (
                                <div ref={avisoRef}>
                                <Aviso
                                    titulo={bloqueiosPorLinha.length === linhas.length ? `Não dá para transferir assim para ${selecionada.nome}` : `${bloqueiosPorLinha.length} ${bloqueiosPorLinha.length === 1 ? "unidade não pode" : "unidades não podem"} ir para ${selecionada.nome}`}
                                    descricao={bloqueiosPorLinha[0].bloqueio?.descricao}
                                />
                                </div>
                        )}
                    </>
                )}

                {etapa === "revisao" && selecionada && (
                    <>
                        <ResumoUnidades pedido={pedido} linhas={linhas} verbo="transferir" titulo="Transferindo" onAlterar={() => setIndice(0)} onIncluir={incluir} />
                        <SetaParaBaixo />

                        {/* Sem moldura: o destinatário é o resultado da etapa anterior, e um
                            card ao redor dele repetia a borda que o overlay já dá. */}
                        <div className="flex w-full flex-col gap-2">
                            <div className="flex items-center gap-3 rounded-xl bg-secondary p-4">
                                <Avatar size="md" initials={iniciaisDe(selecionada.nome)} alt={selecionada.nome} />
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold text-primary">{selecionada.nome}</p>
                                    <p className="truncate text-sm text-tertiary">{selecionada.email}</p>
                                </div>
                            </div>

                            {/* §8 E4: o resumo declara a herança das respostas. Alterar resposta aqui não existe. */}
                            {comFormulario.length > 0 && (
                                <p className="text-sm text-tertiary">
                                    O destinatário herda as respostas do formulário sem alteração. Para mudar, faça uma troca de perguntas depois que concluir a
                                    transferência.
                                </p>
                            )}
                        </div>

                        <CampoMotivo valor={motivo} onChange={setMotivo} />

                        <div className="w-full">
                            <ResumoFinanceiro linhas={calculo.linhas} />
                        </div>
                    </>
                )}
            </div>
        </WizardShell>
    );
}
