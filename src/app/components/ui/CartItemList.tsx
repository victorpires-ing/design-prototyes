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
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl relative z-10"
          >
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-1">
                <Trash2 size={24} />
              </div>
              <h3 className="text-lg font-black text-gray-900 leading-tight">Remover item?</h3>
              <p className="text-sm text-gray-500">
                Deseja remover <strong>{itemName}</strong> do seu carrinho?
              </p>
              <div className="grid grid-cols-2 gap-3 w-full mt-4">
                <button onClick={onClose} className="py-3 rounded-md font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">
                  Cancelar
                </button>
                <button onClick={onConfirm} className="py-3 rounded-md font-bold text-white bg-red-500 hover:bg-red-600 transition-colors shadow-lg shadow-red-200">
                  Remover
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
              <div className="flex-none w-10 h-10 rounded-lg bg-orange-50 text-[#ff6101] flex items-center justify-center mt-1">
                <Ticket size={18} />
              </div>

              <div className="flex-1 min-w-0 flex flex-col">
                <div className="flex justify-between items-start gap-2 mb-1">
                  <span className="font-bold text-sm text-gray-900 leading-tight truncate">{name}</span>
                  <span className="font-bold text-sm text-gray-900 whitespace-nowrap shrink-0">{formatPrice(price * qty)}</span>
                </div>
                
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-medium bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded uppercase tracking-wide">
                    {date ? date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : 'Data'}
                  </span>
                  <span className="text-[10px] font-medium border border-gray-200 text-gray-500 px-1.5 py-0.5 rounded">
                    {time}h
                  </span>
                </div>

                {/* Stepper Ingresso */}
                <div className="flex items-center gap-3 bg-gray-50 w-fit rounded-lg px-1 border border-gray-100">
                  <button 
                    onClick={() => handleTicketChange(key, qty, -1, name, [parseInt(dayIdx), time, ticketId])}
                    className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors active:scale-90"
                  >
                    {qty === 1 ? <Trash2 size={14} /> : <Minus size={14} />}
                  </button>
                  <span className="text-xs font-bold text-gray-900 w-4 text-center">{qty}</span>
                  <button 
                    onClick={() => onUpdateTicket(parseInt(dayIdx), time, ticketId, 1)}
                    className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-[#ff6101] transition-colors active:scale-90"
                  >
                    <Plus size={14} />
                  </button>
                </div>
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
                className="flex-none w-12 h-12 rounded-lg object-cover border border-gray-100 bg-white mt-1"
              />

              <div className='w-full'>
                <span className="font-bold text-sm text-gray-900 leading-tight w-full line-clamp-1">{product.name}</span>

                {/* Mostra a Variante se existir, senão a descrição curta */}
                {variantLabel ? (
                  <p className="text-sm font-medium text-gray-400 mb-1">{variantLabel}</p>
                ) : (
                  <p className="text-sm text-gray-400 mb-1 line-clamp-1">{product.description}</p>
                )}

                <span className="font-medium text-sm text-gray-900 whitespace-nowrap shrink-0">{formatPrice(product.price * qty)}</span>
              </div>

              <div className="flex items-center border-1 border-gray-200  gap-2 bg-gray-50 w-fit rounded-sm px-0">
                <button 
                  onClick={() => handleProductChange(fullId, qty, -1, product.name)}
                  className="w-7 h-7 flex items-center cursor-pointer justify-center text-gray-400 hover:text-red-500 transition-colors active:scale-90"
                >
                  {qty === 1 ? <Trash2 size={15} /> : <Minus size={18} />}
                </button>
                <span className="text-xm font-semibold text-gray-900 w-4 text-center">{qty}</span>
                <button 
                  onClick={() => onUpdateProduct(fullId, 1)}
                  className="w-7 h-7 flex cursor-pointer items-center justify-center text-gray-400 hover:text-[#ff6101] transition-colors active:scale-90"
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