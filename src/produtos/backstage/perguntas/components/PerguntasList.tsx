import { useMemo, useState } from "react";
import { Edit01, SearchLg, Trash01 } from "@untitledui/icons";
import { Input } from "@/components/base/input/input";
import { Toggle } from "@/components/base/toggle/toggle";
import { Tooltip } from "@/components/base/tooltip/tooltip";
import { cx } from "@/utils/cx";
import { TIPO_RESPOSTA, type Pergunta } from "../data/perguntas";

interface PerguntasListProps {
    perguntas: Pergunta[];
    onToggle: (id: string) => void;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
}

const PAGE_SIZES = [10, 25, 50];

export function PerguntasList({ perguntas, onToggle, onEdit, onDelete }: PerguntasListProps) {
    const [query, setQuery] = useState("");
    const [pageSize, setPageSize] = useState(10);
    const [page, setPage] = useState(1);

    const filtered = useMemo(
        () => perguntas.filter((p) => p.titulo.toLowerCase().includes(query.trim().toLowerCase())),
        [perguntas, query],
    );

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const currentPage = Math.min(page, totalPages);
    const start = (currentPage - 1) * pageSize;
    const pageItems = filtered.slice(start, start + pageSize);

    return (
        <section className="flex flex-col rounded-2xl bg-secondary ring-1 ring-border-secondary">
            <header className="px-5 py-4">
                <h2 className="text-lg font-semibold text-primary">Lista de perguntas</h2>
            </header>

            <div className="px-5 pb-4">
                <div className="max-w-sm">
                    <Input
                        icon={SearchLg}
                        placeholder="Pesquise"
                        value={query}
                        onChange={(value) => {
                            setQuery(value);
                            setPage(1);
                        }}
                    />
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] border-collapse">
                    <thead>
                        <tr className="border-t border-secondary">
                            <th className="px-5 py-3 text-left text-xs font-medium text-tertiary">Pergunta</th>
                            <th className="px-5 py-3 text-left text-xs font-medium text-tertiary">Tipo da resposta</th>
                            <th className="px-5 py-3 text-left text-xs font-medium text-tertiary">Status</th>
                            <th className="w-px px-5 py-3" />
                        </tr>
                    </thead>
                    <tbody>
                        {pageItems.map((pergunta) => {
                            const tipo = TIPO_RESPOSTA[pergunta.tipo];
                            return (
                                <tr key={pergunta.id} className="border-t border-secondary">
                                    <td className="px-5 py-4 align-middle">
                                        <span className="text-sm font-medium text-primary">{pergunta.titulo}</span>
                                    </td>
                                    <td className="px-5 py-4 align-middle">
                                        <span className="flex items-center gap-2 text-sm text-secondary">
                                            <tipo.icon className="size-5 text-fg-quaternary" />
                                            {tipo.label}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 align-middle">
                                        <div className="flex items-center gap-2.5">
                                            <Toggle
                                                isSelected={pergunta.ativo}
                                                onChange={() => onToggle(pergunta.id)}
                                                aria-label={`Status de ${pergunta.titulo}`}
                                            />
                                            <span
                                                className={cx(
                                                    "text-sm",
                                                    pergunta.ativo ? "text-primary" : "text-tertiary",
                                                )}
                                            >
                                                {pergunta.ativo ? "Ativo" : "Desativado"}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 align-middle">
                                        <div className="flex items-center justify-end gap-1">
                                            <Tooltip title="Editar">
                                                <button
                                                    type="button"
                                                    onClick={() => onEdit(pergunta.id)}
                                                    aria-label="Editar"
                                                    className="flex size-9 items-center justify-center rounded-lg text-fg-quaternary transition duration-100 ease-linear hover:bg-tertiary hover:text-fg-secondary"
                                                >
                                                    <Edit01 className="size-4.5" />
                                                </button>
                                            </Tooltip>
                                            <Tooltip title="Excluir">
                                                <button
                                                    type="button"
                                                    onClick={() => onDelete(pergunta.id)}
                                                    aria-label="Excluir"
                                                    className="flex size-9 items-center justify-center rounded-lg text-fg-quaternary transition duration-100 ease-linear hover:bg-tertiary hover:text-fg-error-secondary"
                                                >
                                                    <Trash01 className="size-4.5" />
                                                </button>
                                            </Tooltip>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {pageItems.length === 0 && (
                            <tr className="border-t border-secondary">
                                <td colSpan={4} className="px-5 py-10 text-center text-sm text-tertiary">
                                    Nenhuma pergunta encontrada.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <footer className="flex flex-col gap-3 border-t border-secondary px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                    <span className="text-sm text-tertiary">
                        Página {currentPage} de {totalPages}
                    </span>
                    <div className="relative">
                        <select
                            value={pageSize}
                            onChange={(e) => {
                                setPageSize(Number(e.target.value));
                                setPage(1);
                            }}
                            className="appearance-none rounded-lg bg-primary py-2 pl-3 pr-9 text-sm text-primary ring-1 ring-border-primary transition duration-100 ease-linear hover:bg-primary_hover focus:outline-none focus:ring-2 focus:ring-brand"
                            aria-label="Itens por página"
                        >
                            {PAGE_SIZES.map((size) => (
                                <option key={size} value={size}>
                                    {size} por
                                </option>
                            ))}
                        </select>
                        <svg
                            aria-hidden="true"
                            viewBox="0 0 20 20"
                            className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-fg-quaternary"
                            fill="none"
                        >
                            <path d="M5 7.5 10 12.5 15 7.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage <= 1}
                        className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary ring-1 ring-border-primary transition duration-100 ease-linear hover:bg-primary_hover disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Anterior
                    </button>
                    <button
                        type="button"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage >= totalPages}
                        className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary ring-1 ring-border-primary transition duration-100 ease-linear hover:bg-primary_hover disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Próximo
                    </button>
                </div>
            </footer>
        </section>
    );
}
