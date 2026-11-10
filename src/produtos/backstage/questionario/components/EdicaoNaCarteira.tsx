import { useDeferredValue, useMemo, useState } from "react";
import { toast } from "sonner";
import { SearchLg } from "@untitledui/icons";
import { parseDateTime } from "@internationalized/date";
import { DateTimePicker } from "@/components/application/date-picker/date-time-picker";
import { SlideoutMenu } from "@/components/application/slideout-menus/slideout-menu";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { InputBase } from "@/components/base/input/input";
import { Surgir } from "@/components/foundations/transicao";
import type { EdicaoNaCarteira, Evento, Pergunta } from "@/plataforma";
import { LIMIAR_FERRAMENTAS, paraBusca } from "../../itens/components/escala";
import { salvarEdicaoNaCarteira } from "../../itens/data/catalogo";
import { formatar, useTextosItens } from "../../itens/data/textos-itens";

/* ------------------------------------------------------------------ */
/*  Edição na carteira (QST-10 a QST-12)                               */
/*                                                                     */
/*  Configuração geral do questionário: uma janela de datas e quais    */
/*  perguntas a pessoa pode mudar na Carteira depois da compra.        */
/*  Cartão no topo da lista; editar abre um slideout com as datas e a  */
/*  lista de perguntas dentro dele (um overlay só, UI-NAV-002).        */
/* ------------------------------------------------------------------ */

const T = {
    titulo: "Edição na carteira",
    desligada: "Desligada. Depois da compra, as respostas não mudam.",
    configurar: "Configurar",
    editar: "Editar",
    desligar: "Desligar",
    estados: { aberta: "Aberta agora", agendada: "Agendada", encerrada: "Encerrada" },
    periodo: "De {inicio} até {fim}",
    perguntas: { one: "{n} pergunta pode mudar", other: "{n} perguntas podem mudar" },
    desligou: "Edição na carteira desligada.",
    desfazer: "Desfazer",
    salvo: "Edição na carteira salva.",
    erro: "Tente de novo: não foi possível salvar.",
    slideout: {
        titulo: "Edição na carteira",
        descricao: "Na janela escolhida, quem comprou muda na Carteira as respostas das perguntas marcadas.",
        inicio: "Começa em",
        fim: "Termina em",
        dataErro: "Escolha data e hora.",
        fimErro: "Escolha um fim depois do começo.",
        perguntas: "Perguntas que podem mudar",
        semPerguntas: "Marque pelo menos uma pergunta.",
        buscar: "Buscar pergunta",
        contagem: "{visiveis} de {total}",
        todas: "Marcar todas as {n}",
        nada: "Nenhuma pergunta com esse texto.",
        selecionadas: { one: "{n} pergunta marcada", other: "{n} perguntas marcadas" },
        cancelar: "Cancelar",
        salvar: "Salvar",
    },
};

type Estado = keyof typeof T.estados;
const COR: Record<Estado, "success" | "blue" | "gray"> = { aberta: "success", agendada: "blue", encerrada: "gray" };
const estadoDa = (e: EdicaoNaCarteira, agora = new Date()): Estado =>
    new Date(e.inicio) > agora ? "agendada" : new Date(e.fim) < agora ? "encerrada" : "aberta";

const paraData = (v?: string) => {
    if (!v) return null;
    try {
        return parseDateTime(v.slice(0, 16));
    } catch {
        return null;
    }
};

/** Só as perguntas que ainda existem (excluir uma pergunta a tira daqui). */
const perguntasValidas = (e: EdicaoNaCarteira, perguntas: Pergunta[]) => e.perguntas.filter((id) => perguntas.some((p) => p.id === id));

/** Perguntas que podem mudar na carteira agora (para o rótulo da linha). */
export const editaveisNaCarteira = (evento: Evento | undefined) => new Set(evento?.edicaoNaCarteira ? perguntasValidas(evento.edicaoNaCarteira, evento.perguntas ?? []) : []);

export function CartaoEdicaoNaCarteira({ evento }: { evento: Evento }) {
    const { quando, plural, locale } = useTextosItens();
    const [aberto, setAberto] = useState(false);
    const perguntas = evento.perguntas ?? [];
    const edicao = evento.edicaoNaCarteira ?? null;

    const gravar = async (valor: EdicaoNaCarteira | null, mensagem: string, desfazer?: EdicaoNaCarteira) => {
        try {
            await salvarEdicaoNaCarteira(evento, valor);
            toast.success(mensagem, desfazer ? { action: { label: T.desfazer, onClick: () => void gravar(desfazer, T.salvo) } } : undefined);
            return true;
        } catch {
            toast.error(T.erro);
            return false;
        }
    };

    const ids = edicao ? perguntasValidas(edicao, perguntas) : [];
    const nomes = ids.map((id) => perguntas.find((p) => p.id === id)?.titulo ?? "").filter(Boolean);
    const estado = edicao ? estadoDa(edicao) : null;

    return (
        <section aria-labelledby="edicao-carteira" className="flex flex-col gap-3 rounded-2xl bg-primary p-5 ring-1 ring-secondary md:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <h2 id="edicao-carteira" className="flex flex-wrap items-center gap-2">
                        <span className="text-lg font-semibold text-primary">{T.titulo}</span>
                        {estado && (
                            <Badge size="sm" type="pill-color" color={COR[estado]}>
                                {T.estados[estado]}
                            </Badge>
                        )}
                    </h2>
                    {edicao ? (
                        <>
                            <p className="text-sm text-tertiary">{formatar(T.periodo, { inicio: quando(edicao.inicio), fim: quando(edicao.fim) })}</p>
                            <p className="text-sm text-tertiary">
                                {plural(T.perguntas, ids.length)}
                                {nomes.length > 0 && nomes.length <= 3 && `: ${new Intl.ListFormat(locale, { style: "long", type: "conjunction" }).format(nomes)}`}
                            </p>
                        </>
                    ) : (
                        <p className="text-sm text-tertiary">{T.desligada}</p>
                    )}
                </div>
                <div className="flex shrink-0 gap-2">
                    {edicao && (
                        <Button color="tertiary" size="sm" onClick={() => void gravar(null, T.desligou, edicao)}>
                            {T.desligar}
                        </Button>
                    )}
                    <Button color="secondary" size="sm" onClick={() => setAberto(true)}>
                        {edicao ? T.editar : T.configurar}
                    </Button>
                </div>
            </div>

            {aberto && (
                <SlideoutEdicao
                    inicial={edicao}
                    perguntas={perguntas}
                    onFechar={() => setAberto(false)}
                    onSalvar={async (valor) => {
                        if (await gravar(valor, T.salvo)) setAberto(false);
                    }}
                />
            )}
        </section>
    );
}

function SlideoutEdicao({
    inicial,
    perguntas,
    onFechar,
    onSalvar,
}: {
    inicial: EdicaoNaCarteira | null;
    perguntas: Pergunta[];
    onFechar: () => void;
    onSalvar: (valor: EdicaoNaCarteira) => Promise<void>;
}) {
    const { plural, numero } = useTextosItens();
    const S = T.slideout;
    const [inicio, setInicio] = useState(inicial?.inicio);
    const [fim, setFim] = useState(inicial?.fim);
    const [marcadas, setMarcadas] = useState(() => new Set(inicial ? perguntasValidas(inicial, perguntas) : []));
    const [busca, setBusca] = useState("");
    const [tentou, setTentou] = useState(false);
    const [salvando, setSalvando] = useState(false);
    const termo = paraBusca(useDeferredValue(busca).trim());
    const filtradas = useMemo(() => (termo ? perguntas.filter((p) => paraBusca(p.titulo).includes(termo)) : perguntas), [perguntas, termo]);

    const erros = {
        inicio: !inicio ? S.dataErro : undefined,
        fim: !fim ? S.dataErro : inicio && fim <= inicio ? S.fimErro : undefined,
        perguntas: marcadas.size === 0 ? S.semPerguntas : undefined,
    };

    const salvar = async () => {
        setTentou(true);
        if (erros.inicio || erros.fim || erros.perguntas || !inicio || !fim) return;
        setSalvando(true);
        // Mantém a ordem do questionário.
        await onSalvar({ inicio, fim, perguntas: perguntas.filter((p) => marcadas.has(p.id)).map((p) => p.id) });
        setSalvando(false);
    };

    const alternar = (id: string, on: boolean) =>
        setMarcadas((a) => {
            const p = new Set(a);
            if (on) p.add(id);
            else p.delete(id);
            return p;
        });

    return (
        <SlideoutMenu isOpen isDismissable onOpenChange={(v) => !v && onFechar()} className="z-50 pl-0" dialogClassName="gap-0">
            <SlideoutMenu.Header onClose={onFechar} className="flex flex-col gap-1 pb-4">
                <h2 className="pr-8 text-lg font-semibold text-primary">{S.titulo}</h2>
                <p className="text-sm text-tertiary">{S.descricao}</p>
            </SlideoutMenu.Header>

            <SlideoutMenu.Content className="gap-5 pb-4">
                <DateTimePicker
                    label={S.inicio}
                    granularity="minute"
                    hourCycle={24}
                    isRequired
                    value={paraData(inicio)}
                    onChange={(d) => setInicio(d ? d.toString().slice(0, 16) : undefined)}
                    isInvalid={tentou && !!erros.inicio}
                    hint={tentou ? erros.inicio : undefined}
                />
                <DateTimePicker
                    label={S.fim}
                    granularity="minute"
                    hourCycle={24}
                    isRequired
                    value={paraData(fim)}
                    onChange={(d) => setFim(d ? d.toString().slice(0, 16) : undefined)}
                    isInvalid={tentou && !!erros.fim}
                    hint={tentou ? erros.fim : undefined}
                />

                {/* Perguntas dentro do próprio slideout: sem abrir outro overlay por cima (UI-NAV-002). */}
                <fieldset className="flex flex-col gap-3">
                    <legend className="mb-1 text-sm font-medium text-secondary">{S.perguntas}</legend>
                    <Surgir visivel={tentou && !!erros.perguntas}>
                        <p role="status" className="text-sm text-error-primary">
                            {S.semPerguntas}
                        </p>
                    </Surgir>
                    {perguntas.length > LIMIAR_FERRAMENTAS && (
                        <div className="flex flex-col gap-2">
                            <InputBase
                                size="sm"
                                icon={SearchLg}
                                aria-label={S.buscar}
                                placeholder={S.buscar}
                                value={busca}
                                onChange={(v: unknown) => setBusca(typeof v === "string" ? v : ((v as { target?: { value?: string } })?.target?.value ?? ""))}
                            />
                            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                                <span className="text-tertiary tabular-nums" role="status">
                                    {formatar(S.contagem, { visiveis: numero(filtradas.length), total: numero(perguntas.length) })}
                                </span>
                                {filtradas.length > 0 && (
                                    <Button color="link-color" size="sm" onClick={() => setMarcadas((a) => new Set([...a, ...filtradas.map((p) => p.id)]))}>
                                        {formatar(S.todas, { n: numero(filtradas.length) })}
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                    <ul className="flex flex-col gap-1">
                        {filtradas.map((p) => (
                            <li key={p.id} className="rounded-lg px-2 py-2 hover:bg-primary_hover">
                                <Checkbox label={p.titulo} isSelected={marcadas.has(p.id)} onChange={(on) => alternar(p.id, on)} />
                            </li>
                        ))}
                    </ul>
                    {filtradas.length === 0 && <p className="text-sm text-tertiary">{S.nada}</p>}
                </fieldset>
            </SlideoutMenu.Content>

            <SlideoutMenu.Footer className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm text-tertiary" role="status">
                    {plural(S.selecionadas, marcadas.size)}
                </span>
                <div className="flex flex-col-reverse gap-3 sm:flex-row">
                    <Button color="secondary" size="md" onClick={onFechar}>
                        {S.cancelar}
                    </Button>
                    <Button color="primary" size="md" isLoading={salvando} onClick={() => void salvar()}>
                        {S.salvar}
                    </Button>
                </div>
            </SlideoutMenu.Footer>
        </SlideoutMenu>
    );
}
