import type { FormEvent } from "react";
import { AlertCircle, CheckCircle } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { InputBase } from "@/components/base/input/input";
import { RadioButton, RadioGroup } from "@/components/base/radio-buttons/radio-buttons";
import type { Buyer } from "../data/catalogo";

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

            {/* Ação principal junto do resultado — "Pular" é saída secundária, não concorre com ela. */}
            <div className="flex flex-col-reverse items-stretch gap-3 md:flex-row md:items-center md:justify-end">
                <Button size="md" color="secondary" onClick={onSkip}>
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
        <FeaturedIcon icon={CheckCircle} color="success" theme="gradient" size="lg" className="shrink-0 rounded-full" />
        <div className="flex min-w-0 flex-col">
            <p className="truncate text-sm font-semibold text-primary">{buyer.name}</p>
            {buyer.maskedDocument && <p className="truncate text-sm text-tertiary">{buyer.maskedDocument}</p>}
            <p className="truncate text-sm text-tertiary">{buyer.email}</p>
            {buyer.phone && (
                <p className="flex items-center gap-1.5 truncate text-sm text-tertiary">
                    <WhatsAppIcon aria-hidden="true" className="size-4 shrink-0 text-[#25d366]" />
                    {buyer.phone}
                </p>
            )}
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
            <RadioGroup aria-label="Conta do comprador" value={selectedId ?? null} onChange={onSelect} className="gap-2">
                {buyers.map((buyer) => (
                    <label
                        key={buyer.id}
                        className="flex cursor-pointer items-center gap-3 rounded-lg bg-secondary p-3 transition duration-100 ease-linear hover:bg-secondary_hover"
                    >
                        <RadioButton value={buyer.id} slot={null} aria-label={buyer.name} />
                        <BuyerIdentity buyer={buyer} />
                    </label>
                ))}
            </RadioGroup>
        </div>
    );
};

/** Glifo de marca do WhatsApp — não existe no @untitledui/icons. */
const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.11.82.83-3.04-.2-.31a8.16 8.16 0 0 1-1.25-4.38c0-4.54 3.7-8.24 8.24-8.24 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.25 8.23Zm4.52-6.17c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.25-.64.8-.79.97-.14.16-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.13-.56-1.35-.77-1.84-.2-.49-.4-.42-.56-.43h-.47c-.17 0-.43.06-.66.31-.23.25-.86.85-.86 2.06 0 1.21.89 2.39 1.01 2.55.12.17 1.75 2.67 4.24 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.14-1.18-.06-.11-.22-.17-.47-.29Z" />
    </svg>
);
