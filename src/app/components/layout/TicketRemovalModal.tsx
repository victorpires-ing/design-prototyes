import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface TicketRemovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  targetName: string; // Ex: "19:00" ou "01/02"
  isDate?: boolean; // Se é data ou horário para ajustar o texto
}

export const TicketRemovalModal = ({ isOpen, onClose, onConfirm, targetName, isDate = false }: TicketRemovalModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
            className="fixed inset-0 bg-black/60 z-[90] backdrop-blur-sm "
            onClick={onClose}
          />
          
          {/* Modal Content */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.95, y: 20 }} 
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-white rounded-md z-[100] p-6 shadow-2xl"
          >
            {/* Handle visual (opcional, igual a imagem) */}
            <div className="w-8 h-1 bg-gray-200 rounded-full mx-auto mb-4" />

            <h3 className="text-lg font-bold text-gray-900 text-center mb-4 leading-tight">
              Remover ingressos {isDate ? 'da data desmarcada' : 'deste horário'}?
            </h3>

            <p className="text-sm text-gray-600 text-center mb-8 leading-relaxed">
              Você desmarcou {isDate ? 'o dia' : 'o horário'} <span className="font-bold text-gray-800">{targetName}</span>. 
              Os ingressos selecionados serão removidos da sua seleção.
            </p>

            <div className="flex gap-3">
              <button 
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-md bg-orange-50 text-[#ff6101] font-bold text-sm hover:bg-orange-100 transition-colors"
              >
                Manter ingressos
              </button>
              <button 
                onClick={onConfirm}
                className="flex-1 py-3 px-4 rounded-md bg-[#e65a00] text-white font-bold text-sm hover:bg-[#cc5000] transition-colors shadow-lg shadow-orange-200"
              >
                Descartar ingressos
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};