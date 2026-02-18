import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronUp, ChevronDown, ShoppingBag } from 'lucide-react';
import { CartItemList } from './CartItemList';

// Recebe 'handlers'
export function CartFooter({ step, cart, totals, derivedData, onNext, handlers }: any) {
  const [isOpen, setIsOpen] = useState(false);

  if (totals.grandTotal === 0) return null;

  const totalItems = (Object.values(cart.tickets) as number[]).reduce((a, b) => a + b, 0) + 
                     (Object.values(cart.products) as number[]).reduce((a, b) => a + b, 0);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/60 z-[40] lg:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      <motion.div 
        initial={{ y: 100 }} animate={{ y: 0 }}
        className={`fixed bottom-0 left-0 right-0 bg-white z-[50] lg:hidden shadow-[0_-5px_30px_rgba(0,0,0,0.15)] transition-all duration-300 rounded-t-2xl overflow-hidden flex flex-col
          ${isOpen ? 'max-h-[85vh]' : 'max-h-auto'}`}
      >
        
        <div onClick={() => setIsOpen(!isOpen)} className="w-full bg-white p-2 flex flex-col items-center justify-center cursor-pointer border-b border-transparent active:bg-gray-50">
          <div className="w-12 h-1.5 bg-gray-200 rounded-full mb-2" />
          {!isOpen && (
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-wide">
              Detalhes da compra ({totalItems}) <ChevronUp size={14} />
            </div>
          )}
        </div>

        <AnimatePresence>
          {isOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="px-6 pb-6 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6 pt-2">
                <h3 className="font-bold text-lg text-gray-900">Seu Carrinho</h3>
                <button onClick={() => setIsOpen(false)} className="p-1  rounded-full">
                  <ChevronDown size={20} className="text-gray-600"/>
                </button>
              </div>

              {/* --- CONEXÃO FEITA AQUI --- */}
              <CartItemList 
                cart={cart} 
                derivedData={derivedData} 
                onUpdateTicket={handlers.updateTicket}
                onUpdateProduct={handlers.updateProduct}
              />
              
              <div className="border-t border-gray-100 mt-6 pt-4 flex justify-between items-center">
                 <span className="text-gray-500 text-sm font-medium">Total de Itens</span>
                 <span className="text-gray-900 font-bold">{totalItems}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="p-4 bg-white border-t border-gray-100 flex items-center justify-between gap-4 relative z-10">
          <div className="flex flex-col" onClick={() => !isOpen && setIsOpen(true)}>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Total a pagar</span>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-gray-900 leading-none">
                R$ {totals.grandTotal.toFixed(2).replace('.', ',')}
              </span>
              {!isOpen && <ChevronUp size={16} className="text-gray-400" />}
            </div>
          </div>

          <button onClick={onNext} className="bg-[#ff6101] text-white px-8 py-3.5 rounded-md font-black text-sm uppercase shadow-lg shadow-orange-100 active:scale-95 transition-all">
            {step === 1 ? 'Continuar' : 'Pagar'}
          </button>
        </div>

      </motion.div>
    </>
  );
}