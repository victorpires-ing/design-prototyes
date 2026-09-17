import type { CondicaoItem, CondicoesComerciais, ResumoCondicoes } from "../data/cashout";

function Grupo({ titulo, itens }: { titulo: string; itens: CondicaoItem[] }) {
    return (
        <div className="flex flex-col gap-4">
            <span className="text-xs font-semibold tracking-[0.6px] text-quaternary uppercase">{titulo}</span>
            <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4">
                {itens.map((item) => (
                    <div key={item.label} className="flex min-w-0 flex-col gap-0.5">
                        <span className="text-[13px] text-quaternary">{item.label}</span>
                        <span className="text-[15px] font-semibold text-primary">{item.valor}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

/** Condições completas do contrato: bloco ONLINE + bloco PDV OFFLINE. */
export function CondicoesCompletas({ condicoes }: { condicoes: CondicoesComerciais }) {
    return (
        <div className="flex flex-col gap-5">
            <Grupo titulo="Online" itens={condicoes.online} />
            <div className="h-px w-full bg-utility-brand-100" />
            <Grupo titulo="PDV Offline" itens={condicoes.pdvOffline} />
        </div>
    );
}

/** Resumo em caixa cinza exibido antes de expandir as condições. */
export function ResumoComercial({ resumo }: { resumo: ResumoCondicoes }) {
    const itens: CondicaoItem[] = [
        { label: "Crédito", valor: resumo.credito },
        { label: "PIX", valor: resumo.pix },
        { label: "Débito", valor: resumo.debito },
        { label: "Embutida", valor: resumo.embutida },
    ];

    return (
        <div className="flex flex-col gap-3 rounded-lg bg-secondary p-4">
            <span className="text-xs font-semibold tracking-[0.6px] text-quaternary uppercase">Condições comerciais</span>
            <div className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-4">
                {itens.map((item) => (
                    <div key={item.label} className="flex min-w-0 flex-col gap-0.5">
                        <span className="text-[13px] text-quaternary">{item.label}</span>
                        <span className="text-[15px] font-semibold text-primary">{item.valor}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
