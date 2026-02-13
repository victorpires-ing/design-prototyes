import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, ChevronLeft, ChevronRight, Edit3, Plus, Minus, Info } from "lucide-react";
import { ProductModal } from '../ui/ProductModal';

// --- CARD DE PRODUTO OTIMIZADO ---
const ProductCard = ({ product, totalQty, onOpenModal, onQuickUpdate }: any) => {
  // Lógica de Variação
  const hasVariations = product.name.toLowerCase().includes('camisa') || product.name.toLowerCase().includes('shirt');

  // --- LÓGICA DO CARROSSEL NO CARD ---
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  
  // Garante que temos um array, mesmo se vier só uma imagem string
  const images = product.images && product.images.length > 0 
    ? product.images 
    : [product.image];

  const nextImage = (e: any) => {
    e.stopPropagation();
    setCurrentImgIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: any) => {
    e.stopPropagation();
    setCurrentImgIndex((prev) => (prev - 1 + images.length) % images.length);
  };
  // ------------------------------------

  const handlePrimaryAction = (e: any) => {
    e.stopPropagation();
    if (hasVariations) {
      onOpenModal();
    } else {
      onQuickUpdate(1);
    }
  };

  const handleQuickRemove = (e: any) => {
    e.stopPropagation();
    onQuickUpdate(-1);
  };

  return (
    <div 
      className={`
        relative flex flex-col rounded-md boder-1 transition-all duration-200 bg-white h-full cursor-pointer group overflow-hidden
        ${totalQty > 0 
          ? 'border-orange-500 shadow-md ring-1 ring-orange-500/10' 
          : 'border-gray-100 hover:border-gray-300 hover:shadow-lg'}
      `}
    >
      <div className="absolute top-3 right-3 bg-blue-600 text-white text-[10px] uppercase font-medium px-2.5 py-1 rounded-full shadow-sm z-10 animate-in zoom-in">
          Acabando rápido
        </div>
      {/* {totalQty > 0 && (
        <div className="absolute top-3 right-3 bg-[#ff6101] text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm z-10 animate-in zoom-in">
          {totalQty} no carrinho
        </div>
      )} */}
      

      {/* --- ÁREA DA IMAGEM (CARROSSEL) --- */}
      <div className="relative h-44 bg-gray-50 flex items-center justify-center p-4 overflow-hidden">
        
        <motion.img 
          key={currentImgIndex} // A chave força o re-render animado
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          src={images[currentImgIndex]} 
          alt={product.name} 
          className="h-full w-full object-contain mix-blend-multiply transition-transform group-hover:scale-105 duration-500" 
        />
        
        {/* Controles do Carrossel (Só aparece se tiver + de 1 imagem) */}
        {images.length > 1 && (
          <>
            {/* Seta Esquerda */}
            <button 
              onClick={prevImage}
              className="absolute left-1 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/80 text-gray-600 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white z-20"
            >
              <ChevronLeft size={16} />
            </button>

            {/* Seta Direita */}
            <button 
              onClick={nextImage}
              className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/80 text-gray-600 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white z-20"
            >
              <ChevronRight size={16} />
            </button>

            {/* Indicadores (Dots) */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-20">
              {images.map((_: any, idx: number) => (
                <div 
                  key={idx} 
                  className={`w-1.5 h-1.5 rounded-full transition-colors shadow-sm ${idx === currentImgIndex ? 'bg-[#ff6101]' : 'bg-gray-300'}`} 
                />
              ))}
            </div>
          </>
        )}

        {/* Indicador de Variação (Mantido) */}
        {hasVariations && (
          <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur px-2 py-0.5 rounded text-[10px] font-bold text-gray-600 uppercase tracking-wide border border-gray-200 shadow-sm z-10">
            + Opções
          </div>
        )}
      </div>

      {/* Conteúdo (Inalterado) */}
      <div className="flex flex-col flex-1 p-4">
        <div className="flex-1">
          <h3 className="font-bold text-gray-900 text-sm leading-snug mb-1.5 line-clamp-2">
            {product.name}
          </h3>
          <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-3">
            {product.description}
          </p>
        </div>
        
        <div className="mb-4">
          <span className="text-lg font-black text-gray-900 tracking-tight">
            R$ {product.price.toFixed(2).replace('.', ',')}
          </span>
        </div>

        {/* --- ÁREA DE AÇÃO (Inalterada) --- */}
        <div className="mt-auto pt-3 border-t border-gray-50">
          {!hasVariations && totalQty > 0 ? (
            <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-1" onClick={(e) => e.stopPropagation()}>
              <button 
                onClick={handleQuickRemove} 
                className="w-9 h-9 flex items-center justify-center bg-white rounded-md shadow-sm text-gray-600 active:scale-90 transition-transform hover:text-red-500"
              >
                <Minus size={16} strokeWidth={2.5} />
              </button>
              <span className="font-bold text-sm text-gray-900 min-w-[20px] text-center">{totalQty}</span>
              <button 
                onClick={handlePrimaryAction} 
                className="w-9 h-9 flex items-center justify-center bg-[#ff6101] text-white rounded-md shadow-sm shadow-orange-200 active:scale-90 transition-transform hover:bg-orange-600"
              >
                <Plus size={16} strokeWidth={2.5} />
              </button>
            </div>
          ) : (
            totalQty === 0 ? (
              <button 
                onClick={handlePrimaryAction}
                className="w-full py-3 bg-gray-900 hover:bg-black text-white rounded-md text-xs font-bold uppercase tracking-wider transition-all active:scale-[0.98] shadow-sm flex items-center justify-center gap-2"
              >
                <Plus size={16} /> {hasVariations ? 'Selecionar' : 'Adicionar'}
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={(e) => { e.stopPropagation(); onOpenModal(); }}
                  className="py-2.5 bg-white border border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50 rounded-md text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                >
                  <Edit3 size={14} /> Editar
                </button>
                
                <button 
                  onClick={(e) => { e.stopPropagation(); onOpenModal(); }}
                  className="py-2.5 bg-[#ff6101] text-white rounded-md text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-orange-100 hover:bg-orange-600 transition-all active:scale-95"
                >
                  <Plus size={14} /> Adicionar
                </button>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

// --- TELA PRINCIPAL (Inalterada) ---
export function StepProducts({ combos, productSelection, onUpdate, onBack }: any) {
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const getProductTotalQty = (baseId: string) => {
    return Object.entries(productSelection).reduce((acc: number, [key, qty]: any) => {
      if (key === baseId || key.startsWith(`${baseId}-`)) return acc + qty;
      return acc;
    }, 0);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      <div className="flex items-center justify-between">
        <div className="flex flex-col items-start">
          <button 
            onClick={onBack} 
            className="flex cursor-pointer items-center gap-1 text-sm font-medium text-[#ff6101] hover:text-[#ff6101] hover:underline transition-colors mb-3 group"
          >
            <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            Voltar para seleção de ingressos
          </button>

          <div>
            <h2 className="text-2xl font-black text-gray-900 leading-none">Turbine sua experiência</h2>
            <p className="text-sm text-gray-500 mt-1">Personalize sua experiência com produtos oficiais.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {combos.map((product: any) => (
          <ProductCard 
            key={product.id} 
            product={product} 
            totalQty={getProductTotalQty(product.id)}
            onOpenModal={() => setSelectedProduct(product)}
            onQuickUpdate={(delta: number) => onUpdate(product.id, delta)}
          />
        ))}
      </div>

      <ProductModal 
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        product={selectedProduct}
        productSelection={productSelection}
        onUpdate={onUpdate}
      />
    </motion.div>
  );
}