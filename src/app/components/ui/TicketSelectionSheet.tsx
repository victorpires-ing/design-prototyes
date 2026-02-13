import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Clock, ShoppingBag } from 'lucide-react';
import TicketGroup from '../layout/TicketGroup';

interface TicketSelectionSheetProps {
  isOpen: boolean;
  time: string | null;
  onClose: () => void;
  tickets: any;
  onUpdateTicket: any;
  dayIdx: number;
  showCombos?: boolean;
  limits?: any;
}

export const TicketSelectionSheet = ({
  isOpen,
  time,
  onClose,
  tickets,
  onUpdateTicket,
  dayIdx,
  showCombos = false,
  limits
}: TicketSelectionSheetProps) => {

  if (!time) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay (Fundo Escuro) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-[999] backdrop-blur-sm"
          />

          {/* MODAL HÍBRIDO:
             - Mobile: fixed bottom-0 (Sheet)
             - Desktop (md+): fixed top-1/2 left-1/2 center (Modal)
          */}
          <motion.div
            initial={{ y: "100%", opacity: 0, x: 0 }} // Mobile start
            animate={{ 
              y: 0, 
              opacity: 1, 
              x: 0,
              // No desktop, centraliza usando transform
              transition: { type: "spring", damping: 25, stiffness: 300 }
            }}
            exit={{ y: "100%", opacity: 0 }}
            // Classes Responsivas:
            // Mobile: w-full bottom-0 rounded-t-2xl
            // Desktop: w-[480px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-2xl
            className={`
              fixed z-[1000] bg-white overflow-hidden shadow-2xl flex flex-col
              w-full bottom-0 rounded-t-[32px] max-h-[85vh]
              md:w-[480px] md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-[32px] md:h-auto md:max-h-[80vh]
            `}
          >
            {/* Header */}
            <div className="p-6 pb-4 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <div>
                <div className="flex items-center gap-2 text-[#ff6101] mb-1">
                  <Clock size={16} />
                  <span className="text-sm font-bold uppercase tracking-wider">Horário Selecionado</span>
                </div>
                <h2 className="text-2xl font-black text-gray-900">{time}</h2>
              </div>
              <button 
                onClick={onClose} 
                className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Conteúdo com Scroll */}
            <div className="flex-1 overflow-y-auto p-6 pt-4">
              <TicketGroup
                limits={limits}
                dayIdx={dayIdx}
                time={time}
                tickets={tickets}
                onUpdateTicket={onUpdateTicket}
                hideTimeHeader={true}
                autoExpandFirst={false}
                allowMultipleExpanded={false}
              />
            </div>

            {/* Footer com Botão de Fechar/Confirmar */}
            <div className="p-6 border-t border-gray-50 bg-white">
              <button 
                onClick={onClose}
                className="w-full bg-gray-900 text-white py-4 rounded-md font-bold text-sm uppercase tracking-widest hover:bg-gray-800 transition-all active:scale-[0.98]"
              >
                Confirmar Seleção
              </button>
            </div>

          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};