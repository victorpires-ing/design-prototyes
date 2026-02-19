import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, ShoppingBag, Minus, Plus } from "lucide-react";
import TicketGroup from '../layout/TicketGroup'; 

interface TimeSelectorProps {
  availableTimes: string[];
  selectedTime: string | null;
  onSelectTime: (time: string) => void;
  onClearTime: (time: string) => void;
  tickets: Record<string, number>;
  soldOutTimes?: string[];
  dayIdx: number;
  limits?: any
  onUpdateTicket: (dayIdx: number, time: string, ticketId: string, delta: number) => void;
  combos?: any[];
  showCombos?: boolean;
  variant?: any;
}

export const TimeSelector = ({
  availableTimes,
  selectedTime,
  onSelectTime,
  onClearTime,
  tickets,
  dayIdx,
  limits,
  onUpdateTicket,
  soldOutTimes = [],
  combos = [],
  showCombos = false
}: TimeSelectorProps) => {

  const getBadgeCount = (time: string) => {
    return Object.entries(tickets).reduce((acc, [key, qty]) => {
      if (key.startsWith(`${dayIdx}-${time}-`)) return acc + (qty as number);
      return acc;
    }, 0);
  };

  const renderCombos = (time: string) => {
    if (!showCombos || !combos || combos.length === 0) return null;
    return (
      <div className="mt-4 border-t border-gray-100 pt-4 animate-in fade-in slide-in-from-bottom-2">
        <div className="flex items-center gap-2 mb-3 px-1">
          <ShoppingBag size={14} className="text-purple-500" />
          <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Combos & Extras</span>
        </div>
        <div className="space-y-3">
          {combos.map((item) => {
            const qty = tickets[`${dayIdx}-${time}-combo-${item.id}`] || 0;
            return (
              <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50/80 rounded-md border border-gray-100/80">
                <div className="flex items-center gap-3">
                  <div className="text-2xl w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm pt-1">🎁</div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-900 leading-tight">{item.name}</span>
                    <span className="text-xs font-bold text-[#ff6101] mt-1">R$ {item.price},00</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-white rounded-lg p-1 border border-gray-100 shadow-sm">
                  <button disabled={qty === 0} onClick={() => onUpdateTicket(dayIdx, time, `combo-${item.id}`, -1)} className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-[#ff6101] disabled:opacity-30 transition-colors"><Minus size={14} strokeWidth={3} /></button>
                  <span className="w-5 text-center text-sm font-black text-gray-900">{qty}</span>
                  <button onClick={() => onUpdateTicket(dayIdx, time, `combo-${item.id}`, 1)} className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-[#ff6101] transition-colors"><Plus size={14} strokeWidth={3} /></button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const count = availableTimes.length;

  // ==================================================================================
  // CASO 3: 13+ HORÁRIOS (GRID COM ABAS DE PERÍODO)
  // ==================================================================================
  if (count >= 13) {
    const getTimePeriod = (time: string) => {
      const h = parseInt(time.split(':')[0]);
      if (h < 12) return 'Manhã';
      if (h < 18) return 'Tarde';
      return 'Noite';
    };
    const periods = ['Manhã', 'Tarde', 'Noite'] as const;
    const activePeriods = periods.filter(p => availableTimes.some((t: string) => getTimePeriod(t) === p));
    const [activeTab, setActiveTab] = useState(activePeriods[0]);

    const getPeriodTotalCount = (period: string) => availableTimes.filter((t: string) => getTimePeriod(t) === period).reduce((acc: number, time: string) => acc + getBadgeCount(time), 0);

    return (
      <div className="flex flex-col mt-6 animate-in fade-in duration-500">
        <div className="flex items-center justify-between mb-2 px-1">
          <p className="text-sm h-6 font-medium text-gray-500 tracking-wide">Selecione um horário</p>
          <AnimatePresence>
            {getPeriodTotalCount(activeTab) > 0 && (
              <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => availableTimes.filter(t => getTimePeriod(t) === activeTab).forEach(time => onClearTime(time))} className="flex items-center gap-1.5 text-xs font-bold text-red-500 hover:text-red-700 transition-colors px-2 py-1 rounded-md">
                <Trash2 size={12} /> Limpar período
              </motion.button>
            )}
          </AnimatePresence>
        </div>
        
        {/* ABAS DE PERÍODO (Manhã/Tarde/Noite) */}
        <div className="flex items-center gap-0 w-full border-b border-gray-100 mb-6">
          {activePeriods.map((period) => {
            const isSelected = activeTab === period;
            const totalInPeriod = getPeriodTotalCount(period);
            return (
              <button key={period} onClick={() => setActiveTab(period)} className={`relative flex-1 py-3 flex justify-center items-center gap-2 text-sm transition-all outline-none ${isSelected ? 'font-bold text-[#ff6101] bg-[#ff6101]/5' : 'font-medium text-gray-400 hover:bg-gray-50'}`}>
                <span>{period}</span>
                {totalInPeriod > 0 && <span className="flex items-center justify-center h-4 w-4 rounded-full text-[9px] font-bold bg-[#ff6101] text-white shadow-sm">{totalInPeriod}</span>}
                {/* CORREÇÃO DE ANIMAÇÃO: Usar tween para evitar bounce/scroll */}
                {isSelected && (
                  <motion.div 
                    layoutId="periodLine" 
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#ff6101]" 
                    transition={{ type: "tween", ease: "easeInOut", duration: 0.2 }} 
                  />
                )}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-3">
          {availableTimes.filter(t => getTimePeriod(t) === activeTab).map((time) => {
            const isSoldOut = soldOutTimes.includes(time);
            const count = getBadgeCount(time);
            const isSelected = count > 0;
            return (
              <div key={time} className="relative group">
                <button onClick={() => !isSoldOut && onSelectTime(time)} disabled={isSoldOut} className={`h-12 min-w-[90px] px-3 rounded-lg border flex items-center justify-center text-sm font-bold transition-all relative ${isSoldOut ? 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed decoration-slice line-through' : ''} ${!isSoldOut && isSelected ? 'bg-white border-[#ff6101] text-[#ff6101] pr-10' : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'}`}>
                  {time}
                </button>
                {isSelected && !isSoldOut && (
                  <div className="absolute right-1 top-1 bottom-1 w-8 border-l border-orange-100 flex items-center justify-center">
                     <button onClick={(e) => { e.stopPropagation(); onClearTime(time); }} className="p-1.5 text-[#ff6101] hover:bg-orange-50 rounded-md transition-colors"><Trash2 size={14} /></button>
                  </div>
                )}
                {isSelected && <div className="absolute -top-2 -right-1 bg-[#ff6101] text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full boder-1 border-white shadow-sm z-20">{count}</div>}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ==================================================================================
  // CASO 2: 5 A 12 HORÁRIOS (GRID SIMPLES - SEM ABAS)
  // ==================================================================================
  if (count >= 5 && count <= 12) {
    return (
      <div className="flex flex-col mt-6 animate-in fade-in duration-500">
        <div className="flex items-center justify-between mb-4 px-1">
          <p className="text-sm font-medium text-gray-500 tracking-wide">Horários disponívies</p>
        </div>
        {/* APENAS O GRID, SEM ABAS DE PERÍODO */}
        <div className="flex flex-wrap gap-3">
          {availableTimes.map((time) => {
            const isSoldOut = soldOutTimes.includes(time);
            const count = getBadgeCount(time);
            const isSelected = count > 0;
            
            return (
              <div key={time} className="relative group">
                <button
                  onClick={() => !isSoldOut && onSelectTime(time)}
                  disabled={isSoldOut}
                  className={`
                    h-12 min-w-[90px] px-3 rounded-lg border flex items-center justify-center text-sm font-bold transition-all relative
                    ${isSoldOut ? 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed decoration-slice line-through' : ''}
                    ${!isSoldOut && isSelected ? 'bg-white border-[#ff6101] text-[#ff6101] pr-10' : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'}
                  `}
                >
                  {time}
                </button>

                {isSelected && !isSoldOut && (
                  <div className="absolute right-1 top-1 bottom-1 w-8 border-l border-orange-100 flex items-center justify-center">
                     <button onClick={(e) => { e.stopPropagation(); onClearTime(time); }} className="p-1.5 text-[#ff6101] hover:bg-orange-50 rounded-md transition-colors">
                       <Trash2 size={14} />
                     </button>
                  </div>
                )}

                {isSelected && <div className="absolute -top-2 -right-1 bg-[#ff6101] text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full boder-1 border-white shadow-sm z-20">{count}</div>}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ==================================================================================
  // CASO 1: 1 A 4 HORÁRIOS (LAYOUT HORIZONTAL / ABAS DE SELEÇÃO)
  // ==================================================================================
  return (
    <div className="flex flex-col mt-4 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-3 px-1">
        <p className="text-sm h-6 font-medium text-gray-500 tracking-wide">
          Horários disponíveis
        </p>
        <AnimatePresence>
          {selectedTime && getBadgeCount(selectedTime) > 0 && (
            <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => onClearTime(selectedTime)} className="flex cursor-pointer text-xs font-medium text-red-500 rounded-md transition-colors">
              Limpar seleção
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-0 w-full border-gray-200 overflow-x-auto no-scrollbar">
        {availableTimes.map((time) => {
          const isSelected = selectedTime === time;
          const isSoldOut = soldOutTimes.includes(time);
          const count = getBadgeCount(time);

          return (
            <button key={time} disabled={isSoldOut} onClick={() => onSelectTime(time)} className={`relative flex-1 max-w-[90px] py-3.5 flex justify-center items-center gap-2 text-sm transition-all outline-none whitespace-nowrap ${isSoldOut ? 'text-gray-300 cursor-not-allowed bg-gray-50/50' : ''} ${isSelected && !isSoldOut ? 'font-bold text-[#ff6101] bg-[#ff6101]/5' : 'font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
              <span className={isSoldOut ? 'line-through' : ''}>{time}</span>
              {count > 0 && !isSoldOut && <span className="flex items-center justify-center h-5 w-5 rounded-full text-[10px] font-bold bg-[#ff6101] text-white">{count}</span>}
              {/* CORREÇÃO DE ANIMAÇÃO: Usar tween */}
              {isSelected && !isSoldOut && (
                <motion.div 
                  layoutId="activeTimeTab" 
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#ff6101]" 
                  transition={{ type: "tween", ease: "easeInOut", duration: 0.2 }} 
                />
              )}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode='wait'>
        {selectedTime && (
          <motion.div key={selectedTime} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="pt-6 min-h-[200px]">
            <TicketGroup
              limits={limits}
              dayIdx={dayIdx}
              time={selectedTime} 
              tickets={tickets}
              onUpdateTicket={onUpdateTicket}
              hideTimeHeader={true}
              autoExpandFirst={false}
              allowMultipleExpanded={false} />
            {renderCombos(selectedTime)}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};