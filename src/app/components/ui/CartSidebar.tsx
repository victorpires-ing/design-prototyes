import React from 'react';
import { ShoppingBag, FileText } from 'lucide-react';
import { CartItemList } from './CartItemList';

export function CartSidebar({ step, cart, totals, derivedData, onNext, handlers }: any) {
  const isEmpty = totals.grandTotal === 0;

  const totalItems = (Object.values(cart.tickets) as number[]).reduce((a, b) => a + b, 0) + 
                     (Object.values(cart.products) as number[]).reduce((a, b) => a + b, 0);

  return (
    <aside className="hidden lg:flex flex-col w-[380px] shrink-0 z-40">
      {/* 1. sticky top-28: Fixa o elemento ao rolar a página.
          2. max-h-[calc(100vh-140px)]: Garante que o card nunca seja maior que a tela (menos margens).
          3. flex flex-col: Habilita o layout flexível vertical.
      */}
      <div className="sticky top-28 flex flex-col bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden max-h-[calc(100vh-240px)]">
        
        {/* HEADER: Fixo (shrink-0) */}
        <div className="p-5 border-b border-gray-100 flex items-center gap-2 bg-gray-50/50 shrink-0">
          <FileText size={18} className="text-gray-500" />
          <h3 className="font-bold text-gray-900 text-base tracking-wide">Resumo do Pedido</h3>
        </div>

        {/* CORPO: Rolagem (flex-1 overflow-y-auto) */}
        {/* Removemos max-h fixo aqui, agora ele obedece o pai */}
        <div className="p-6 bg-white flex-1 overflow-y-auto custom-scrollbar min-h-[150px]">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 py-10 opacity-60">
               <div className="relative w-20 h-20">
                  <div className="absolute inset-0 bg-gray-100 rounded-full animate-pulse" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-gray-300">
                    <ShoppingBag size={40} strokeWidth={1.5} />
                  </div>
               </div>
               <p className="text-sm text-gray-400 font-medium text-center px-8">
                 Seu carrinho está vazio. Escolha seus ingressos.
               </p>
            </div>
          ) : (
            <CartItemList 
              cart={cart} 
              derivedData={derivedData} 
              onUpdateTicket={handlers.updateTicket}
              onUpdateProduct={handlers.updateProduct}
            />
          )}
        </div>

        {/* FOOTER: Fixo (shrink-0) */}
        <div className="p-6 bg-gray-50 border-t border-gray-100 space-y-4 shrink-0">
          <div className="flex justify-between items-center text-sm">
            <span className="font-medium text-gray-500">Qtd. Itens</span>
            <span className="font-bold text-gray-900">{totalItems}</span>
          </div>
          
          <div className="flex justify-between items-end">
            <span className="text-sm font-medium text-gray-500 pb-1">Total Geral</span>
            <span className="text-2xl font-black text-gray-900 leading-none">
              R$ {totals.grandTotal.toFixed(2).replace('.',',')}
            </span>
          </div>

          <button
            onClick={isEmpty ? undefined : onNext}
            disabled={isEmpty}
            className={`w-full py-4 rounded-md font-medium text-sm tracking-wider transition-all shadow-lg
              ${isEmpty 
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' 
                : 'bg-[#ff6101] text-white hover:bg-orange-600 active:scale-[0.98]'
              }`}
          >
            {step === 1 ? 'Continuar' : 'Continuar'}
          </button>
        </div>

      </div>
    </aside>
  );
}