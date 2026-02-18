import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trash2, Plus, Minus, ShoppingBag, Tag, ChevronLeft, ChevronRight, Check } from "lucide-react";

export const ProductModal = ({ isOpen, onClose, product, productSelection, onUpdate }: any) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const [size, setSize] = useState<'P' | 'M' | 'G' | 'GG' | null>(null);

  // --- MOCK PARA CARROSSEL ---
  // Se o produto não tiver array de imagens, duplicamos a única imagem para simular o carrossel
  const images = product?.images || [product?.image, product?.image, product?.image].filter(Boolean);

  const hasVariations = product?.name.toLowerCase().includes('camisa') || product?.name.toLowerCase().includes('shirt');

  // --- LÓGICA DE CARRINHO ---
  const selectedVariants = useMemo(() => {
    if (!product) return [];
    return Object.entries(productSelection)
      .filter(([key, qty]: any) => key.startsWith(`${product.id}-`) && qty > 0)
      .map(([key, qty]: any) => {
        const parts = key.split('-');
        return { id: key, size: parts[1], qty };
      })
      .sort((a, b) => a.size.localeCompare(b.size));
  }, [productSelection, product?.id]);

  const simpleQty = product ? (productSelection[product.id] || 0) : 0;

  const handleAddVariant = () => {
    if (size) {
      onUpdate(`${product.id}-${size}`, 1);
      setSize(null);
    }
  };

  const getLabel = (s: string) => {
    const labels: Record<string, string> = { 'P': 'Pequeno', 'M': 'Médio', 'G': 'Grande', 'GG': 'Extra Grande' };
    return labels[s] ? `${s} (${labels[s]})` : `Tamanho ${s}`;
  };

  const nextImage = () => setCurrentImgIndex((prev) => (prev + 1) % images.length);
  const prevImage = () => setCurrentImgIndex((prev) => (prev - 1 + images.length) % images.length);

  if (!product || !mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-[9999] backdrop-blur-sm"
          />

          <motion.div 
            initial={{ y: "100%", opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`
              fixed z-[10000] bg-white shadow-2xl overflow-hidden flex flex-col md:flex-row
              w-full bottom-0 rounded-t-[32px] max-h-[95vh]
              md:w-[900px] md:h-[600px] md:max-h-[90vh] md:rounded-[32px]
              md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:bottom-auto
            `}
          >
            {/* --- CARROSSEL DESKTOP (COLUNA ESQUERDA) --- */}
            <div className="hidden md:flex w-5/12 bg-gray-50 items-center justify-center relative overflow-hidden group">
                <AnimatePresence mode='wait'>
                  <motion.img 
                    key={currentImgIndex}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    src={images[currentImgIndex]} 
                    alt={product.name} 
                    className="w-full h-full object-contain mix-blend-multiply p-8" 
                  />
                </AnimatePresence>
                
                {/* Controles Desktop */}
                {images.length > 1 && (
                  <>
                    <button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronLeft size={20} />
                    </button>
                    <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronRight size={20} />
                    </button>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {images.map((_, idx) => (
                        <div key={idx} className={`w-1.5 h-1.5 rounded-full transition-colors ${idx === currentImgIndex ? 'bg-gray-800' : 'bg-gray-300'}`} />
                      ))}
                    </div>
                  </>
                )}
            </div>

            {/* --- COLUNA DIREITA (CONTEÚDO) --- */}
            <div className="flex-1 flex flex-col h-full bg-white relative min-h-0 pt-10">
              
              <button onClick={onClose} className="absolute right-4 top-3 bg-white z-40 cursor-pointer p-3 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-900 transition-colors">
                <X size={20} />
              </button>

              {/* Corpo com Scroll */}
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                
                {/* --- CARROSSEL MOBILE (NO TOPO DO SCROLL) --- */}
                <div className="md:hidden w-full h-64 bg-gray-50 relative mb-6">
                   <motion.img 
                      key={currentImgIndex}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      src={images[currentImgIndex]} 
                      alt="Product View" 
                      className="w-full h-full object-contain mix-blend-multiply p-6"
                   />
                   {images.length > 1 && (
                     <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 bg-white/50 px-2 py-1 rounded-full backdrop-blur-sm">
                       {images.map((_, idx) => (
                         <button key={idx} onClick={() => setCurrentImgIndex(idx)} className={`w-1.5 h-1.5 rounded-full transition-colors ${idx === currentImgIndex ? 'bg-gray-900' : 'bg-gray-400'}`} />
                       ))}
                     </div>
                   )}
                </div>

                <div className="px-5 pb-6 space-y-2">
                  <h2 className="text-xlg font-black text-gray-900 leading-tight line-clamp-2">{product.name}</h2>
                  <p className="text-base font-bold text-gray-800 mt-1">R$ {product.price.toFixed(2)}</p>
                  <p className="text-sm text-gray-500 leading-relaxed mt-6">
                    {product.description || "Sem descrição."}
                  </p>

                  {hasVariations ? (
                    <>
                      {/* SELETOR DE TAMANHO */}
                      <div className="space-y-3 mt-10">
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-900 uppercase tracking-wide">
                          <Tag size={14} /> Selecione o Tamanho
                        </div>
                        <div className="flex gap-2">
                          {['P', 'M', 'G', 'GG'].map(s => {
                            const isSelected = size === s;
                            return (
                              <button
                                key={s}
                                onClick={() => setSize(s as any)}
                                className={`
                                  h-12 w-15 rounded-md text-sm font-medium boder-1 transition-all flex items-center justify-center
                                  ${isSelected 
                                    ? 'primary-buttom' 
                                    : 'secondary-buttom'}
                                `}
                              >
                                {s}
                              </button>
                            );
                          })}
                        </div>
                        
                        {/* BOTÃO ADICIONAR (Largura fixa desktop, altura fixa 44px) */}
                        <div className="pt-2">
                          <button 
                            onClick={handleAddVariant}
                            disabled={!size}
                            className={`
                              h-[44px] bg-gray-900 text-white rounded-md font-medium text-sm uppercase tracking-wider
                              disabled:opacity-50 disabled:shadow-none transition-all active:scale-[0.98] flex items-center justify-center gap-2
                              w-full md:w-50 secondary-buttom
                            `}
                          >
                            <Plus size={16} /> Adicionar {size ? `Tam. ${size}` : ''}
                          </button>
                        </div>
                      </div>

                      {/* LISTA DE ITENS */}
                      <AnimatePresence>
                        {selectedVariants.length > 0 && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                            className="pt-2"
                          >
                            <div className="flex items-center gap-2 text-xs font-semibold text-[#464646] uppercase tracking-wide mb-3 border-t border-gray-100 pt-4">
                              Itens Selecionados ({selectedVariants.reduce((a:any,b:any)=>a+b.qty,0)})
                            </div>
                            
                            <div className="space-y-2">
                              {selectedVariants.map((item: any) => (
                                <motion.div 
                                  key={item.id} layout
                                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                                  className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-md"
                                >
                                  <div className="flex flex-col">
                                    <span className="text-sm font-semibold pb-1 text-gray-900">{getLabel(item.size)}</span>
                                    <span className="text-xs text-gray-400">R$ {(item.qty * product.price).toFixed(2)}</span>
                                  </div>
                                  <div className="flex items-center bg-[#F4F4F4] rounded-md p-1">
                                    <button onClick={() => onUpdate(item.id, -1)} className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-[#FF6101] rounded-md transition-all active:scale-90">
                                      {item.qty === 1 ? <Trash2 size={14} /> : <Minus size={14} />}
                                    </button>
                                    <span className="w-8 text-center text-sm font-semibold text-[#181818]">{item.qty}</span>
                                    <button onClick={() => onUpdate(item.id, 1)} className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-[#FF6101] rounded-md transition-all active:scale-90">
                                      <Plus size={14} />
                                    </button>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  ) : (
                    /* PRODUTO SIMPLES */
                    <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100 flex flex-col items-center justify-center mt-4">
                      <span className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Quantidade</span>
                      <div className="flex items-center gap-8">
                        <button onClick={() => onUpdate(product.id, -1)} disabled={simpleQty === 0} className="w-14 h-14 rounded-2xl bg-white boder-1 border-gray-200 flex items-center justify-center text-gray-400 shadow-sm hover:border-gray-300 hover:text-gray-900 disabled:opacity-50 active:scale-90 transition-all">
                          <Minus size={24} />
                        </button>
                        <span className="text-4xl font-black text-gray-900 w-20 text-center">{simpleQty}</span>
                        <button onClick={() => onUpdate(product.id, 1)} className="w-14 h-14 rounded-2xl bg-[#ff6101] text-white flex items-center justify-center shadow-lg shadow-orange-200 hover:bg-orange-600 active:scale-90 transition-all">
                          <Plus size={24} />
                        </button>
                      </div>
                      <div className="mt-6 text-sm font-medium text-gray-500">
                        Total: <span className="font-bold text-gray-900">R$ {(simpleQty * product.price).toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* --- BARRA FIXA "CONCLUIR" (Footer) --- */}
              <div className="p-4 border-t border-gray-100 bg-white shrink-0 safe-area-pb z-20">
                <button onClick={onClose} className="w-full py-4 font-bold rounded-md tracking-wide text-sm transition-colors primary-buttom">
                  Concluir Seleção
                </button>
              </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};