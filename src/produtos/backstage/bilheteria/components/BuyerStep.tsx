import type { FormEvent } from "react";
import { AlertCircle } from "@untitledui/icons";
import { Avatar } from "@/components/base/avatar/avatar";
import { Button } from "@/components/base/buttons/button";
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
    /** Botão "Avançar" repetido abaixo do conteúdo no mobile (no desktop ele vive no header). */
    mobileAdvance?: React.ReactNode;
}

/** Passo 1 — identifica o comprador por documento ou e-mail. */
export function BuyerStep({ term, onTermChange, search, onSearch, onSkip, onSelectBuyer, mobileAdvance }: BuyerStepProps) {
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

            {search.status === "found" && <FoundCard buyer={search.buyer} />}

            {search.status === "multiple" && (
                <div className="flex flex-col gap-4 rounded-xl bg-primary p-4 ring-1 ring-border-secondary md:p-5">
                    <div className="flex flex-col gap-0.5">
                        <h2 className="text-md font-semibold text-primary">{search.buyers.length} contas usam esse e-mail</h2>
                        <p className="text-sm text-tertiary">Escolha para qual delas os ingressos vão.</p>
                    </div>
                    <hr className="border-secondary" />
                    <RadioGroup
                        aria-label="Conta do comprador"
                        value={search.selectedId ?? null}
                        onChange={onSelectBuyer}
                        className="gap-2"
                    >
                        {search.buyers.map((buyer) => (
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
            )}

            {search.status === "email-not-found" && (
                <ResultCard title="Conta não encontrada">
                    <p>
                        Ao clicar em <strong className="font-semibold text-secondary">“Avançar”</strong> e os itens serão enviados para{" "}
                        <strong className="font-semibold text-secondary">{search.email}</strong>.
                    </p>
                    <p>Itens com acesso por facial não poderão ser vendidos.</p>
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

            {mobileAdvance && <div className="md:hidden">{mobileAdvance}</div>}

            <div className="flex md:justify-end">
                <Button size="md" color="secondary" onClick={onSkip} className="max-md:w-full">
                    Pular identificação
                </Button>
            </div>
        </div>
    );
}

const ResultCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="flex flex-col gap-1 rounded-xl bg-primary p-4 ring-1 ring-border-secondary md:p-5">
        <h2 className="text-md font-semibold text-primary">{title}</h2>
        <div className="flex flex-col gap-0.5 text-sm text-tertiary">{children}</div>
    </div>
);

export const BuyerIdentity = ({ buyer }: { buyer: Buyer }) => (
    <div className="flex items-center gap-3">
        <Avatar initials={buyer.initials} size="md" alt={buyer.name} />
        <div className="flex min-w-0 flex-col">
            <p className="truncate text-sm font-semibold text-primary">{buyer.name}</p>
            <p className="truncate text-sm text-tertiary">{buyer.email}</p>
            {buyer.maskedDocument && <p className="truncate text-sm text-tertiary">{buyer.maskedDocument}</p>}
        </div>
    </div>
);

const FoundCard = ({ buyer }: { buyer: Buyer }) => (
    <div className="flex flex-col gap-4 rounded-xl bg-primary p-4 ring-1 ring-border-secondary md:p-5">
        <div className="flex flex-col gap-0.5">
            <h2 className="text-md font-semibold text-primary">Conta encontrada</h2>
            <p className="text-sm text-tertiary">Confira o nome e o e-mail antes de continuar.</p>
        </div>
        <hr className="border-secondary" />
        <BuyerIdentity buyer={buyer} />
    </div>
);
