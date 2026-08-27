import type { FormEvent } from "react";
import { AlertCircle, CheckCircle } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { InputBase } from "@/components/base/input/input";
import { RadioButton, RadioGroup } from "@/components/base/radio-buttons/radio-buttons";
import { EVENTO, ingressosPorCpf, type Buyer } from "../data/catalogo";

export type BuyerSearch =
    | { status: "idle" }
    | { status: "searching" }
    | { status: "invalid-email" }
    | { status: "found"; buyer: Buyer }
    | { status: "multiple"; buyers: Buyer[]; selectedId?: string }
    | { status: "email-not-found"; email: string }
    | { status: "document-not-found" };

interface BuyerStepProps {
    term: string;
    onTermChange: (term: string) => void;
    search: BuyerSearch;
    onSearch: () => void;
    onSkip: () => void;
    /** Escolha da conta quando o e-mail pertence a mais de uma. */
    onSelectBuyer: (buyerId: string) => void;
    /** Ação primária do passo — fica ao lado de "Pular identificação", junto do resultado da busca. */
    advanceButton?: React.ReactNode;
}

/** Passo 1 — identifica o comprador por documento ou e-mail. */
export function BuyerStep({ term, onTermChange, search, onSearch, onSkip, onSelectBuyer, advanceButton }: BuyerStepProps) {
    const isSearching = search.status === "searching";
    const isInvalid = search.status === "invalid-email";

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault();
        onSearch();
    };

    return (
        <div className="flex w-full max-w-[800px] flex-col gap-4">
            <form onSubmit={handleSubmit} className="flex flex-col gap-1.5 rounded-xl bg-primary p-4 ring-1 ring-border-secondary md:p-5">
                <label htmlFor="bilheteria-buyer" className="text-sm font-medium text-secondary">
                    Quem está comprando?
                </label>
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:gap-3">
                    <div className="flex flex-1 flex-col gap-1.5">
                        <InputBase
                            id="bilheteria-buyer"
                            size="md"
                            value={term}
                            isInvalid={isInvalid}
                            isDisabled={isSearching}
                            onChange={(event) => onTermChange(event.target.value)}
                            onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                    event.preventDefault();
                                    onSearch();
                                }
                            }}
                            placeholder="Digite o documento ou e-mail do comprador"
                        />
                        {isInvalid && (
                            <p className="flex items-center gap-1.5 text-sm text-error-primary">
                                <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
                                E-mail inválido, confira se o e-mail está digitado corretamente.
                            </p>
                        )}
                    </div>
                    <Button
                        type="submit"
                        size="md"
                        color="secondary"
                        isLoading={isSearching}
                        showTextWhileLoading
                        isDisabled={term.trim().length === 0}
                        className="max-md:w-full"
                    >
                        {isSearching ? "Buscando" : "Buscar"}
                    </Button>
                </div>
                <p className="text-sm text-tertiary">Se não encontrar o comprador pelo documento, busque pelo e-mail.</p>
            </form>

            {search.status === "found" && (
                <ContasEncontradas buyers={[search.buyer]} selectedId={search.buyer.id} onSelect={onSelectBuyer} />
            )}

            {search.status === "multiple" && (
                <ContasEncontradas buyers={search.buyers} selectedId={search.selectedId} onSelect={onSelectBuyer} />
            )}

            {search.status === "email-not-found" && (
                <ResultCard identity={<BuyerNoAccount email={search.email} />}>
                    <p>
                        Pode seguir com a venda normalmente. Itens com acesso por face não poderão ser vendidos, porque dependem de um
                        cadastro Ingresse.
                    </p>
                </ResultCard>
            )}

            {search.status === "document-not-found" && (
                <ResultCard title="Documento não encontrado">
                    <p>
                        Informe o e-mail do comprador para vender com link de pagamento ou pule a identificação e venda apenas com o saldo
                        do produtor.
                    </p>
                </ResultCard>
            )}

            {/*
              O que muda ao pular fica escrito aqui, não só dentro do modal: é
              a diferença entre uma venda nominal e um pré-impresso, e foi o
              ponto que mais gerou dúvida na apresentação.
            */}
            <p className="text-sm text-tertiary">
                {EVENTO.identificacaoObrigatoria ? (
                    <>
                        Este evento exige identificar o comprador — acesso por face ou credenciamento emitem ingresso nominal, então não dá
                        para pular esta etapa.
                    </>
                ) : EVENTO.limitePorCpf > 0 ? (
                    <>
                        Com o comprador identificado, vale o limite do evento:{" "}
                        <strong className="font-semibold text-secondary">{ingressosPorCpf(EVENTO.limitePorCpf)}</strong>. Sem identificação
                        não há limite — é assim que se emite pré-impresso em lote.
                    </>
                ) : (
                    // Sem limite configurado, anunciar um limite seria mentira: sobra o que a identificação muda.
                    <>Sem identificar o comprador, o ingresso não fica nominal — é assim que se emite pré-impresso em lote.</>
                )}
            </p>

            {/* Ação principal junto do resultado — "Pular" é saída secundária, não concorre com ela. */}
            <div className="flex flex-col-reverse items-stretch gap-3 md:flex-row md:items-center md:justify-end">
                <Button size="md" color="secondary" onClick={onSkip} isDisabled={EVENTO.identificacaoObrigatoria}>
                    Pular identificação
                </Button>
                {advanceButton}
            </div>
        </div>
    );
}

/** Quando há `identity`, ela ocupa o lugar do título — o comprador é o cabeçalho do card. */
const ResultCard = ({ title, identity, children }: { title?: string; identity?: React.ReactNode; children: React.ReactNode }) => (
    <div className="flex flex-col gap-3 rounded-xl bg-primary p-4 ring-1 ring-border-secondary md:p-5">
        {identity ?? <h2 className="text-md font-semibold text-primary">{title}</h2>}
        <div className="flex flex-col gap-0.5 text-sm text-tertiary">{children}</div>
    </div>
);

/** Conta encontrada — ícone de sucesso e os dados da conta. */
export const BuyerIdentity = ({ buyer }: { buyer: Buyer }) => (
    <div className="flex items-center gap-3">
        <FeaturedIcon icon={CheckCircle} color="success" theme="dark" size="lg" className="shrink-0 rounded-full" />
        <div className="flex min-w-0 flex-col">
            <p className="truncate text-sm font-semibold text-primary">{buyer.name}</p>
            {/*
              E-mail primeiro: é ele que identifica a conta e para onde os ingressos
              vão. O documento vem depois, como confirmação, na mesma linha.
            */}
            <p className="truncate text-sm text-tertiary">
                {buyer.email}
                {buyer.maskedDocument && (
                    <>
                        <span aria-hidden="true"> • </span>
                        {buyer.maskedDocument}
                    </>
                )}
            </p>
        </div>
    </div>
);

/** Sem conta na Ingresse — mesmo bloco, em tom de atenção. */
export const BuyerNoAccount = ({ email }: { email: string }) => (
    <div className="flex items-center gap-3">
        <FeaturedIcon icon={AlertCircle} color="gray" theme="gradient" size="lg" className="shrink-0 rounded-full" />
        <div className="flex min-w-0 flex-col">
            <p className="truncate text-sm font-semibold text-primary">Comprador ainda sem conta</p>
            <p className="truncate text-sm text-tertiary">{email}</p>
        </div>
    </div>
);

/**
 * Contas encontradas na busca. Uma ou várias, o padrão é o mesmo: radio por
 * conta — com uma só, já vem marcada, mas continua explícito para quem confere.
 */
const ContasEncontradas = ({
    buyers,
    selectedId,
    onSelect,
}: {
    buyers: Buyer[];
    selectedId?: string;
    onSelect: (buyerId: string) => void;
}) => {
    const varias = buyers.length > 1;

    return (
        <div className="flex flex-col gap-4 rounded-xl bg-primary p-4 ring-1 ring-border-secondary md:p-5">
            <div className="flex flex-col gap-0.5">
                <h2 className="text-md font-semibold text-primary">
                    {varias ? `${buyers.length} contas usam esse e-mail` : "Conta encontrada"}
                </h2>
                <p className="text-sm text-tertiary">
                    {varias ? "Escolha para qual delas os ingressos vão." : "Confira os dados antes de continuar."}
                </p>
            </div>
            <hr className="border-secondary" />

            {/* Uma conta só não é uma escolha: o radio ali só pedia um clique a mais. */}
            {varias ? (
                <RadioGroup aria-label="Conta do comprador" value={selectedId ?? null} onChange={onSelect} className="gap-2">
                    {buyers.map((buyer) => (
                        <RadioButton
                            key={buyer.id}
                            value={buyer.id}
                            slot={null}
                            aria-label={buyer.name}
                            label={<BuyerIdentity buyer={buyer} />}
                            className="cursor-pointer items-center gap-3 rounded-lg bg-secondary p-3 transition duration-100 ease-linear hover:bg-secondary_hover"
                        />
                    ))}
                </RadioGroup>
            ) : (
                <BuyerIdentity buyer={buyers[0]} />
            )}
        </div>
    );
};

