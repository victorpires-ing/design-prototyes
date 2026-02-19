import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';


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
            className="fixed inset-0 bg-black/60 z-[90] backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Modal Content */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.95, y: 20 }} 
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-white rounded-2xl z-[100] shadow-2xl"
          >

            <div className="flex flex-col items-center text-center gap-3">              

              <div className="w-full px-3 pt-4 pb-2 border-b border-[#E6E6E6] flex justify-between items-start sticky top-0 z-10 ">
                  <h2 className="text-base font-bold text-[#181818] mb-1">
                    Remover ingressos {isDate ? 'da data desmarcada' : 'deste horário'}?
                  </h2>
              </div>

              <p className="flex-1 text-left overflow-y-auto p-3 pt-4 text-base text-[#181818]">
                Você desmarcou {isDate ? 'o dia' : 'o horário das'} <span className="font-bold text-gray-800">{targetName}</span>. 
                Os ingressos s elecionados serão removidos da sua seleção.
              </p>

              <div className="p-3 flex w-full border-t border-[#E6E6E6]">
                <button 
                  onClick={onClose}
                  className="w-full py-4 text-sm rounded-lg outline-buttom"
                >
                  Manter itens
                </button>

                <button 
                  onClick={onConfirm}
                  className="w-full py-4 primary-buttom text-sm rounded-lg"
                >
                  Descartar itens
                </button>
              </div>
              
            </div>
            {/* Handle visual (opcional, igual a imagem) */}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};