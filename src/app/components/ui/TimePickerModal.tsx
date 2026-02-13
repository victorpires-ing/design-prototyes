import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check } from "lucide-react";

interface TimePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableTimes: string[];
  activeTimes: string[];
  onToggleTime: (time: string) => void;
}

const getTimePeriod = (time: string) => {
  const h = parseInt(time.split(':')[0]);
  if (h < 12) return 'Manhã';
  if (h < 18) return 'Tarde';
  return 'Noite';
};

export const TimePickerModal = ({ isOpen, onClose, availableTimes, activeTimes, onToggleTime }: TimePickerModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
            onClick={onClose} 
            className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" 
          />
          <motion.div 
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} 
            transition={{ type: 'spring', damping: 25, stiffness: 200 }} 
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[32px] z-[60] p-6 shadow-2xl max-h-[85vh] flex flex-col"
          >
            <div className="flex items-center justify-between mb-6 shrink-0">
              <div className="flex flex-col">
                <h3 className="font-bold text-lg text-gray-900">Todos os horários</h3>
                <p className="text-xs text-gray-500">Selecione para adicionar à tela</p>
              </div>
              <button onClick={onClose} className="p-2 bg-gray-100 rounded-full text-gray-500"><X size={20}/></button>
            </div>
            
            <div className="overflow-y-auto space-y-8 pb-6 pr-1 custom-scrollbar">
              {['Manhã', 'Tarde', 'Noite'].map(period => {
                const timesInPeriod = availableTimes.filter(t => getTimePeriod(t) === period);
                if (timesInPeriod.length === 0) return null;

                return (
                  <div key={period} className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{period}</span>
                      <div className="h-px flex-1 bg-gray-100" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {timesInPeriod.map((time) => {
                        const isActive = activeTimes.includes(time);
                        return (
                          <button 
                            key={time} 
                            onClick={() => onToggleTime(time)} 
                            className={`p-4 rounded-md boder-1 font-bold text-sm transition-all flex items-center justify-between 
                              ${isActive ? 'border-[#ff6101] bg-orange-50 text-[#ff6101]' : 'border-gray-100 text-gray-500 bg-white'}`}
                          >
                            {time} {isActive && <Check size={16} />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="pt-4 border-t mt-auto">
              <button onClick={onClose} className="w-full py-4 bg-[#ff6101] text-white font-bold rounded-md shadow-lg active:scale-[0.98] transition-all">
                Confirmar Seleção
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};