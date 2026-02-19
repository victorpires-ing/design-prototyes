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
              w-full bottom-0 rounded-t-[16px] max-h-[85vh] left-0
              md:w-[480px] md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-[16px] md:h-auto md:max-h-[80vh]
            `}
          >
            {/* Header */}
            <div className="px-3 pt-3 pb-2 border-b border-[#E6E6E6]  flex justify-between items-start bg-white sticky top-0 z-10">
              <div>
                <h2 className="text-base font-bold text-[#181818] mb-1">Escolha seus itens</h2>
                <p className="text-sm font-base text-[#909090]">Selecionando para o horário das <b>{time}</b></p>
              </div>
              <button 
                onClick={onClose} 
                className="p-2 text-[#181818] cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Conteúdo com Scroll */}
            <div className="flex-1 overflow-y-auto p-3 pt-4">
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
            <div className="p-3 border-t border-[#E6E6E6] bg-white">
              <button 
                onClick={onClose}
                className="w-full py-4 primary-buttom text-sm rounded-lg"
              >
                Confirmar itens
              </button>
            </div>

          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};