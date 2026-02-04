import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, X } from "lucide-react";
// Certifique-se que o caminho do import está correto para o seu projeto
import TicketGroup from '../layout/TicketGroup'; 
// Se você não tiver esse hook, pode remover a linha, é apenas para travar o scroll do fundo
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock'; 

interface TicketSelectionSheetProps {
  isOpen: boolean;
  time: string | null;
  onClose: () => void;
  dayIdx?: number;
  tickets: Record<string, number>;
  onUpdateTicket: (dayIdx: number, time: string, ticketId: string, delta: number) => void;
  
  combos?: any[];
  showCombos?: boolean;
  limits?: any;
}

export const TicketSelectionSheet = ({ 
  isOpen, 
  time, 
  onClose, 
  dayIdx = 0, 
  tickets, 
  onUpdateTicket,
  // Defaults
  combos = [],
  limits,
  showCombos = false
}: TicketSelectionSheetProps) => {

    // Trava o scroll da página quando o modal abre (opcional)
    useBodyScrollLock(isOpen);
  
  if (!time) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Escuro */}
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-[90] backdrop-blur-sm"
          />

          {/* Container do Bottom Sheet */}
          <motion.div
            initial={{ y: "100%" }} 
            animate={{ y: 0 }} 
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[32px] z-[200] flex flex-col max-h-[85vh] shadow-2xl"
          >
            
            {/* 1. HEADER (Fixo) */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between shrink-0">
              <div>
                <span className="text-xs font-bold text-gray-400 tracking-widest block mb-0.5 uppercase">
                  Selecionando para
                </span>
                <div className="flex items-center gap-2 text-gray-900">
                  <Clock size={20} className="text-[#ff6101]" />
                  <span className="text-2xl font-black">{time}</span>
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="p-2 bg-gray-50 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* 2. BODY (Scrollável) */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 min-h-0">
              
              {/* Como o TicketGroup já foi atualizado para aceitar 'combos' e 'showCombos'
                  e criar o grupo "Combos & Extras" automaticamente, basta passar as props.
              */}
              <TicketGroup 
                dayIdx={dayIdx} 
                time={time} 
                tickets={tickets} 
                onUpdateTicket={onUpdateTicket}
                hideTimeHeader={true}       // Não precisa repetir o horário no header do grupo
                allowMultipleExpanded={true} // Permite abrir combos e ingressos ao mesmo tempo
                autoExpandFirst={false}
                
                limits={limits}
                combos={combos}
                showCombos={showCombos}
              />
              
            </div>

            {/* 3. FOOTER (Fixo/Flutuante) - Botão de Confirmar */}
            <div className="p-4 border-t border-gray-100 bg-white pb-8 shrink-0 shadow-[0_-5px_15px_rgba(0,0,0,0.02)]">
              <button 
                onClick={onClose}
                className="w-full py-4 bg-[#ff6101] text-white font-bold rounded-md shadow-lg shadow-orange-100 active:scale-[0.98] transition-all uppercase tracking-widest text-sm"
              >
                Confirmar Ingressos
              </button>
            </div>

          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};