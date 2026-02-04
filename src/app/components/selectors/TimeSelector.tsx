import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, Trash2, ChevronDown, ShoppingBag, Minus, Plus } from "lucide-react";
import TicketGroup from '../layout/TicketGroup'; // Importamos o TicketGroup aqui dentro

interface TimeSelectorProps {
  variant: string; // 'unico' | 'alguns' | 'varios'
  availableTimes: string[];
  selectedTime: string | null;
  onSelectTime: (time: string) => void;
  onClearTime: (time: string) => void;
  tickets: Record<string, number>;
  soldOutTimes?: string[];
  dayIdx: number;
  limits?: any
  onUpdateTicket: (dayIdx: number, time: string, ticketId: string, delta: number) => void;
  
  // --- NOVAS PROPS PARA COMBOS ---
  combos?: any[];
  showCombos?: boolean;
}

export const TimeSelector = ({
  variant,
  availableTimes,
  selectedTime,
  onSelectTime,
  onClearTime,
  tickets,
  dayIdx,
  limits,
  onUpdateTicket,
  soldOutTimes = ["14:00", "17:00", "20:00"],
  // Defaults para não quebrar se não passar
  combos = [],
  showCombos = false
}: TimeSelectorProps) => {

  // Helper de badge
  const getBadgeCount = (time: string) => {
    return Object.entries(tickets).reduce((acc, [key, qty]) => {
      if (key.startsWith(`${dayIdx}-${time}-`)) return acc + (qty as number);
      return acc;
    }, 0);
  };

  // --- HELPER: RENDERIZAR COMBOS (NOVA FUNÇÃO) ---
  const renderCombos = (time: string) => {
    if (!showCombos || !combos || combos.length === 0) return null;

    return (
      <div className="mt-4 border-t border-gray-100 pt-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="flex items-center gap-2 mb-3 px-1">
          <ShoppingBag size={14} className="text-purple-500" />
          <span className="text-xs font-black text-gray-400 uppercase tracking-widest">
            Combos & Extras
          </span>
        </div>

        <div className="space-y-3">
          {combos.map((item) => {
            // Chave única para o combo: dia-horario-combo-id
            const qty = tickets[`${dayIdx}-${time}-combo-${item.id}`] || 0;

            return (
              <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50/80 rounded-md border border-gray-100/80">
                <div className="flex items-center gap-3">
                  <div className="text-2xl w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    {item.image}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-900 leading-tight">{item.name}</span>
                    <span className="text-[10px] font-medium text-gray-400 mt-0.5 max-w-[150px] leading-tight">
                      {item.description}
                    </span>
                    <span className="text-xs font-bold text-[#ff6101] mt-1">
                      R$ {item.price},00
                    </span>
                  </div>
                </div>

                {/* Stepper */}
                <div className="flex items-center gap-2 bg-white rounded-lg p-1 border border-gray-100 shadow-sm">
                  <button 
                    disabled={qty === 0}
                    onClick={() => onUpdateTicket(dayIdx, time, `combo-${item.id}`, -1)}
                    className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-[#ff6101] disabled:opacity-30 transition-colors active:scale-90"
                  >
                    <Minus size={14} strokeWidth={3} />
                  </button>
                  <span className="w-5 text-center text-sm font-black text-gray-900">{qty}</span>
                  <button 
                    onClick={() => onUpdateTicket(dayIdx, time, `combo-${item.id}`, 1)}
                    className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-[#ff6101] transition-colors active:scale-90"
                  >
                    <Plus size={14} strokeWidth={3} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // =========================================================
  // VARIANTE 1: ÚNICO
  // Exibe o horário estático e lista os ingressos imediatamente
  // =========================================================
  if (variant === 'unico') {
    const time = availableTimes[0];
    return (
      <div className="mb-6 mt-2 animate-in fade-in duration-500">
        <TicketGroup
          limits={limits}
          dayIdx={dayIdx}
          time={time}
          tickets={tickets}
          onUpdateTicket={onUpdateTicket}
          hideTimeHeader={false}
          autoExpandFirst={false}
          allowMultipleExpanded={true}
        />
        {/* Adicionado renderização de combos aqui */}
        {renderCombos(time)}
      </div>
    );
  }

  // =========================================================
  // VARIANTE 2: VÁRIOS (Grid/Flex por Períodos)
  // Exibe os botões agrupados. O clique deve abrir o BottomSheet (gerenciado pelo Pai)

  if (variant === 'varios') {
    // Helper para classificar o período
    const getTimePeriod = (time: string) => {
      const h = parseInt(time.split(':')[0]);
      if (h < 12) return 'Manhã';
      if (h < 18) return 'Tarde';
      return 'Noite';
    };

    const periods = ['Manhã', 'Tarde', 'Noite'] as const;
    type Period = typeof periods[number];

    // Filtra apenas períodos que possuem horários disponíveis
    const activePeriods = periods.filter(p =>
      availableTimes.some((t: string) => getTimePeriod(t) === p)
    );

    // Estado da Tab (inicializa com o primeiro período que tem dados)
    const [activeTab, setActiveTab] = useState<Period>(activePeriods[0]);

    // Soma total de ingressos selecionados no período para o badge da Tab
    const getPeriodTotalCount = (period: Period) => {
      return availableTimes
        .filter((t: string) => getTimePeriod(t) === period)
        .reduce((acc: number, time: string) => acc + getBadgeCount(time), 0);
    };

    const periodColors: Record<Period, string> = {
      'Manhã': 'bg-yellow-400',
      'Tarde': 'bg-orange-500',
      'Noite': 'bg-indigo-900'
    };

    return (
      <div className="flex flex-col mt-6 animate-in fade-in duration-500">
        {/* --- NAVEGAÇÃO DE TABS (PERÍODOS) --- */}
        <div className="mt-0 z-10 bg-white mx-0 p-0 overflow-x-auto no-scrollbar mb-6">
          
          <div className="flex items-center justify-between mb-2">

          <p className="text-sm font-medium text-gray-500 tracking-wide mb-2 px-1">Ingressos para a</p>
          <AnimatePresence>
          {getPeriodTotalCount(activeTab) > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <button
                onClick={() => {
                  // Filtra todos os horários do período atual e limpa um por um
                  availableTimes
                    .filter(t => getTimePeriod(t) === activeTab)
                    .forEach(time => onClearTime(time));
                }}
                className="flex items-center gap-2 text-xs font-bold text-red-500 hover:text-red-700 transition-colors tracking-wider"
              >
                <Trash2 size={14} />
                Limpar
              </button>
     
            </motion.div>
            )}
          </AnimatePresence>

          </div>
          <div className="flex items-center gap-0 min-w-full border-b border-gray-100">
            {activePeriods.map((period) => {
              const isSelected = activeTab === period;
              const totalInPeriod = getPeriodTotalCount(period);

              return (
                <button
                  key={period}
                  onClick={() => setActiveTab(period)}
                  className={`
                    relative py-4 flex w-full justify-center items-center gap-2 text-sm transition-all outline-none
                    ${isSelected ? 'font-bold text-[#ff6101] bg-[#ff6101]/5' : 'font-medium text-gray-400 hover:bg-gray-50'}
                  `}
                >
                  <span className={isSelected ? 'text-[#ff6101]' : 'text-gray-600'}>{period}</span>

                  <AnimatePresence>
                    {totalInPeriod > 0 && (
                      <motion.span
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="flex items-center justify-center h-5 w-5 rounded-full text-[11px] font-bold bg-[#ff6101] text-white shadow-sm"
                      >
                        {totalInPeriod}
                      </motion.span>
                    )}
                  </AnimatePresence>

                  {/* Barra Animada */}
                  {isSelected && (
                    <motion.div
                      layoutId="activePeriodIndicator"
                      className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#ff6101] rounded-t-full"
                      transition={{ type: "tween", ease: "easeInOut", duration: 0.2 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* --- GRID DE HORÁRIOS (FILTRADO) --- */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="flex flex-wrap gap-3"
          >
            {availableTimes
              .filter(t => getTimePeriod(t) === activeTab)
              .map((time) => {
                const isSelected = selectedTime === time;
                const count = getBadgeCount(time);
                const hasSelection = count > 0;
                const isSoldOut = soldOutTimes.includes(time);
                const showTrash = hasSelection && !isSoldOut;

                return (
                  <div
                    key={time}
                    className={`relative transition-all duration-300`}
                  >
                    <button
                      onClick={() => !isSoldOut && onSelectTime(time)}
                      disabled={isSoldOut}
                      className={`
                        w-[110px] w-contain h-14 px-3 rounded-md border-2 flex items-center justify-center text-sm font-bold transition-all gap-2 relative overflow-hidden
                        ${isSoldOut
                          ? 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed'
                          : isSelected
                            ? 'bg-gray-900 border-gray-900 text-white shadow-md scale-[1.02]'
                            : hasSelection
                              ? 'bg-orange-50 border-[#ff6101] text-[#ff6101]'
                              : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                        }
                      `}
                    >
                      <span className={isSoldOut ? 'line-through decoration-2' : ''}>{time}</span>

                      {/* Botão de Remover (Trash) integrado */}
                      <AnimatePresence>
                        {showTrash && (
                          <motion.div
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: "auto", opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            className="flex items-center gap-2 overflow-hidden border-l border-l-[#ff6101]/50"
                          >
                            <div className={`w-px h-4 ${isSelected ? 'bg-white/30' : 'bg-[#ff6101]/30'}`} />
                            <div
                              role="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onClearTime(time);
                              }}
                              className={`p-1.5 rounded-lg transition-colors ${isSelected ? 'hover:bg-white/20' : 'hover:bg-red-100 text-red-500'}`}
                            >
                              <Trash2 size={16} />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </button>

                    {/* Badge flutuante (Contagem individual do horário) */}
                    <AnimatePresence>
                      {hasSelection && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          className="absolute -top-2 -right-1 w-5 h-5 bg-[#ff6101] text-white text-[12px] font-bold flex items-center justify-center rounded-full z-20"
                        >
                          {count}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }


  // =========================================================
  // VARIANTE 3: ALGUNS (Abas/Pills Horizontais)
  // Exibe a lista horizontal e o TicketGroup ABAIXO das abas
  // =========================================================
  return (
    <div className="flex flex-col">
      {/* 1. Lista de Abas (Sticky) */}
      <div className="mt-6 z-10 bg-white mx-0 p-0 overflow-x-auto no-scrollbar mb-6 ">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-gray-500 tracking-wide mb-1">Ingressos para às</p>
            {/* Botão de Limpar Inline */}
            <button
              onClick={() => onClearTime(selectedTime)}
              className="text-xs font-bold text-red-500 flex items-center gap-1 hover:bg-red-50 px-2 py-1 rounded-md transition-colors disabled:opacity-0"
              disabled={getBadgeCount(selectedTime) === 0}
            >
              <Trash2 size={14} /> Limpar
            </button>
          </div>
        <div className="flex items-center gap-0 min-w-full border-b">
          {availableTimes.map((time) => {
            const isSelected = selectedTime === time;
            const count = getBadgeCount(time); 
            const hasSelection = count > 0;

            return (
              <button
                key={time}
                onClick={() => onSelectTime(time)}
                className={`
                  relative py-3 flex w-full justify-center items-center gap-1 text-sm transition-colors whitespace-nowrap outline-none
                  ${isSelected
                    ? 'font-bold text-[#ff6101] bg-[#ff6101]/10'
                    : 'font-medium text-gray-400 hover:text-gray-600'
                  }
                `}
              >
                <span className='text-gray-800'>{time}</span>

                <AnimatePresence>
                  {hasSelection && (
                    <motion.span
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className={`
                        ml-0.5 pt-1 h-5 w-5 rounded-full text-[12px] leading-none font-regular
                        bg-[#ff6101] text-white
                      `}
                    >
                      {count}
                    </motion.span>
                  )}
                </AnimatePresence>

                {isSelected && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#ff6101] rounded-t-full"
                    transition={{ type: "tween", ease: "easeInOut", duration: 0.2 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Área de Ingressos (Renderiza TicketGroup aqui dentro) */}
      <AnimatePresence mode='wait'>
        {selectedTime && (
          <motion.div
            key={selectedTime}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
            className="min-h-[300px]"
          >

            <TicketGroup
              limits={limits}
              dayIdx={dayIdx}
              time={selectedTime}
              tickets={tickets}
              onUpdateTicket={onUpdateTicket}
              hideTimeHeader={true}
              autoExpandFirst={false}
              allowMultipleExpanded={true}
            />
            {/* Adicionado renderização de combos aqui também */}
            {renderCombos(selectedTime)}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};