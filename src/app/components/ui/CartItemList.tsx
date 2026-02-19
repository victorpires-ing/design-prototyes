import React, { useState } from 'react';
import { Ticket, Minus, Plus, Trash2, X, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- SUBCOMPONENTE: MODAL DE REMOÇÃO ---
const RemovalConfirmModal = ({ isOpen, onClose, onConfirm, itemName }: any) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm "
            onClick={onClose}
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-sm shadow-2xl relative z-10 bg-white rounded-xl"
          >
            <div className="flex flex-col items-center text-center gap-3">              

              <div className="w-full px-3 pt-3 pb-2 border-b border-[#E6E6E6] flex justify-between items-start sticky top-0 z-10 ">
                  <h2 className="text-base font-bold text-[#181818] mb-1">Remover item</h2>
              </div>

              <p className="flex-1 text-left overflow-y-auto p-3 pt-4 text-base text-[#181818]">
              Deseja remover o item <strong>{itemName}</strong> do seu carrinho?
              </p>

              <div className="p-3 flex w-full border-t border-[#E6E6E6]">
                <button 
                  onClick={onClose}
                  className="w-full py-4 text-sm rounded-lg outline-buttom"
                >
                  Manter item
                </button>

                <button 
                  onClick={onConfirm}
                  className="w-full py-4 primary-buttom text-sm rounded-lg"
                >
                  Remover item
                </button>
              </div>
              
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// --- COMPONENTE PRINCIPAL ---
export const CartItemList = ({ cart, derivedData, onUpdateTicket, onUpdateProduct }: any) => {
  const [itemToRemove, setItemToRemove] = useState<{ type: 'ticket' | 'product', id: string, args?: any, name: string } | null>(null);

  const formatPrice = (val: number) => `R$ ${val.toFixed(2).replace('.', ',')}`;

  // Helper de Variantes (Ex: "Masc. - G")
  const getVariantLabel = (key: string) => {
    const parts = key.split('-');
    // Se o ID tiver 3 partes (id-genero-tamanho), é uma variação
    if (parts.length === 2) {
      // Verifica se a segunda parte parece um tamanho válido para exibir
      const size = parts[1];
      if (['P', 'M', 'G', 'GG'].includes(size)) {
        return `Tamanho ${size}`;
      }
    }
    return null;
  };

  // --- HANDLERS COM PROTEÇÃO ---
  
  const handleTicketChange = (key: string, currentQty: number, change: number, name: string, args: any) => {
    if (currentQty === 1 && change === -1) {
      setItemToRemove({ type: 'ticket', id: key, args, name });
    } else {
      onUpdateTicket(...args, change);
    }
  };

  const handleProductChange = (id: string, currentQty: number, change: number, name: string) => {
    if (currentQty === 1 && change === -1) {
      setItemToRemove({ type: 'product', id, name });
    } else {
      onUpdateProduct(id, change);
    }
  };

  const confirmRemoval = () => {
    if (!itemToRemove) return;
    if (itemToRemove.type === 'ticket') {
      onUpdateTicket(...itemToRemove.args, -1);
    } else {
      onUpdateProduct(itemToRemove.id, -1);
    }
    setItemToRemove(null);
  };

  const hasTickets = Object.keys(cart.tickets).length > 0;
  const hasProducts = Object.keys(cart.products).length > 0;

  if (!hasTickets && !hasProducts) return null;

  return (
    <>
      <div className="space-y-4 w-full">
        
        {/* --- SEÇÃO INGRESSOS --- */}
        {hasTickets && Object.entries(cart.tickets).map(([key, qty]: any) => {
          const [dayIdx, time, ticketId] = key.split('-');
          const date = derivedData.dates[parseInt(dayIdx)];
          const name = ticketId.includes('t3') ? 'Passaporte VIP' : 'Pista Premium';
          const price = ticketId.includes('t3') ? 350 : 150;
          
          return (
            <div key={key} className="flex gap-3 items-start w-full animate-in slide-in-from-bottom-2">
              <div className="flex-none w-8 h-8 rounded-sm bg-orange-50 text-[#ff6101] flex items-center justify-center mt-1">
                <Ticket size={18} />
              </div>

              <div className="flex-1 min-w-0 flex flex-col">
                <span className="font-bold text-sm text-gray-900 mb-1 leading-tight w-full line-clamp-1">{name}</span>
                
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[12px] font-medium text-[#909090] tracking-wide">
                    {date ? date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : 'Data'} - {time}h
                  </span>
                </div>

                <span className="font-medium text-sm text-gray-900 whitespace-nowrap shrink-0">{formatPrice(price * qty)}</span>
              </div>

              {/* Stepper Ingresso */}
              <div className="flex items-center bg-[#F4F4F4] rounded-md px-1 py-1 w-fit gap-0">
                <button 
                  onClick={() => handleTicketChange(key, qty, -1, name, [parseInt(dayIdx), time, ticketId])}
                  className="w-10 h-10 md:w-7 md:h-7 flex items-center justify-center text-gray-500 hover:text-[#FF6101] rounded-md transition-all active:scale-90"
                >
                  {qty === 1 ? <Trash2 size={14} /> : <Minus size={14} />}
                </button>
                <span className="w-4 text-center text-sm font-semibold text-[#181818]">{qty}</span>
                <button 
                  onClick={() => onUpdateTicket(parseInt(dayIdx), time, ticketId, 1)}
                  className="w-10 h-10 md:w-7 md:h-7 flex items-center justify-center text-gray-500 hover:text-[#FF6101] rounded-md transition-all active:scale-90"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          );
        })}

        {hasTickets && hasProducts && <div className="border-t border-dashed border-gray-200 my-4" />}

        {/* --- SEÇÃO PRODUTOS --- */}
        {hasProducts && Object.entries(cart.products).map(([fullId, qty]: any) => {
          // Extrai o ID base para buscar a imagem/nome original
          // Ex: "prod_shirt-M-G" -> baseId: "prod_shirt"
          const baseId = fullId.split('-')[0]; 
          const product = derivedData.combos.find((c: any) => c.id === baseId);
          
          if (!product) return null;

          const variantLabel = getVariantLabel(fullId);

          return (
            <div key={fullId} className="flex gap-3 items-start w-full animate-in slide-in-from-bottom-2 justify-between">
              <img 
                src={product.image} 
                alt={product.name} 
                className="flex-none w-12 h-12 rounded-sm object-cover border border-gray-100 bg-white mt-1"
              />

              <div className='w-full'>
                <span className="font-bold text-sm text-gray-900 leading-tight w-full line-clamp-1">{product.name}</span>

                {/* Mostra a Variante se existir, senão a descrição curta */}
                {variantLabel ? (
                  <p className="text-sm font-medium text-[#909090] mb-1">{variantLabel}</p>
                ) : (
                  <p className="text-sm text-gray-400 mb-0 line-clamp-1">{product.description}</p>
                )}

                <span className="font-medium text-sm text-gray-900 whitespace-nowrap shrink-0">{formatPrice(product.price * qty)}</span>
              </div>

              <div className="flex items-center bg-[#F4F4F4] rounded-md px-1 py-1 w-fit gap-0">
                <button 
                  onClick={() => handleProductChange(fullId, qty, -1, product.name)}
                  className="w-10 h-10 md:w-7 md:h-7 flex items-center justify-center text-gray-500 hover:text-[#FF6101] rounded-md transition-all active:scale-90"
                >
                  {qty === 1 ? <Trash2 size={15} /> : <Minus size={18} />}
                </button>
                <span className="w-4 text-center text-sm font-semibold text-[#181818]">{qty}</span>
                <button 
                  onClick={() => onUpdateProduct(fullId, 1)}
                  className="w-10 h-10 md:w-7 md:h-7 flex items-center justify-center text-gray-500 hover:text-[#FF6101] rounded-md transition-all active:scale-90"
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <RemovalConfirmModal 
        isOpen={!!itemToRemove}
        itemName={itemToRemove?.name}
        onClose={() => setItemToRemove(null)}
        onConfirm={confirmRemoval}
      />
    </>
  );
};