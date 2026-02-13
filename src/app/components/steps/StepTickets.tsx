import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DateSelector } from '../selectors/DateSelector';
import { TimeSelector } from '../selectors/TimeSelector';
import { TicketSelectionSheet } from '../ui/TicketSelectionSheet';
import { TicketRemovalModal } from '../ui/TicketRemovalModal';

export function StepTickets({ scenario, derivedData, cart, handlers, activeDate, setActiveDate }: any) {
  const [sheetTime, setSheetTime] = useState<string | null>(null); // Para modal (varios)
  const [inlineTime, setInlineTime] = useState<string | null>(null); // Para abas (unico/alguns)
  const [removalModal, setRemovalModal] = useState<{ isOpen: boolean; time: string }>({ isOpen: false, time: '' });

  // Reset do horário inline ao mudar a data ou o cenário
  useEffect(() => {
    if (scenario.times === 'unico' && derivedData.availableTimes.length > 0) {
      setInlineTime(derivedData.availableTimes[0]);
    } else if (scenario.times === 'alguns' && derivedData.availableTimes.length > 0) {
      setInlineTime(derivedData.availableTimes[0]);
    } else {
      setInlineTime(null);
    }
  }, [activeDate, scenario.times, derivedData.availableTimes]);

  const activeDateIdx = useMemo(() => 
    activeDate ? derivedData.dates.findIndex((d: any) => d.toDateString() === activeDate.toDateString()) : -1
  , [derivedData.dates, activeDate]);

  // Handler unificado de seleção
  const handleSelectTime = (time: string) => {
    // Se tiver muitos horários (13+ ou 5-12), abre o modal (sheet)
    // Se tiver poucos (1-4), seleciona na aba (inline)
    const isManyTimes = derivedData.availableTimes.length >= 5;
    
    if (isManyTimes) {
      setSheetTime(time);
    } else {
      setInlineTime(time);
    }
  };

  const handleClearTimeRequest = (time: string) => {
    // Verifica se tem itens antes de abrir modal de confirmação
    const hasItems = Object.keys(cart.tickets).some(key => key.startsWith(`${activeDateIdx}-${time}-`));
    if (hasItems) {
      setRemovalModal({ isOpen: true, time });
    }
  };

  const confirmRemoval = () => {
    if (removalModal.time) {
      handlers.clearTimeTickets(activeDateIdx, removalModal.time);
      setRemovalModal({ isOpen: false, time: '' });
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
      {scenario.maps !== 'nenhum' && (
        <div className="w-full h-48 md:h-96 bg-gray-100 rounded-2xl overflow-hidden border">
           <div className="flex items-center justify-center h-full text-gray-400">Mapa: {scenario.maps}</div>
        </div>
      )}

      <DateSelector 
        dates={derivedData.dates}
        selectedDate={activeDate}
        onSelectDate={setActiveDate}
        onConfirmSelection={(dates: any) => setActiveDate(dates[0])}
        tickets={cart.tickets}
        soldOutDates={derivedData.soldOutDates}
      />

      <AnimatePresence mode="wait">
        {activeDate && (
          <motion.div 
            key={activeDate.toISOString()}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <TimeSelector 
              availableTimes={derivedData.availableTimes}
              // Passa o horário correto dependendo do modo
              selectedTime={derivedData.availableTimes.length >= 5 ? null : inlineTime} 
              onSelectTime={handleSelectTime}
              onClearTime={handleClearTimeRequest} // Conecta o botão limpar
              tickets={cart.tickets}
              dayIdx={activeDateIdx}
              onUpdateTicket={handlers.updateTicket}
              soldOutTimes={[]} // Pode mockar no hook se quiser
              combos={derivedData.combos}
              showCombos={scenario.hasCombos}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <TicketSelectionSheet 
        isOpen={!!sheetTime}
        time={sheetTime}
        onClose={() => setSheetTime(null)}
        tickets={cart.tickets}
        onUpdateTicket={handlers.updateTicket}
        dayIdx={activeDateIdx}
      />

      <TicketRemovalModal 
        isOpen={removalModal.isOpen} 
        targetName={removalModal.time}
        onClose={() => setRemovalModal({ ...removalModal, isOpen: false })}
        onConfirm={confirmRemoval}
      />
    </motion.div>
  );
}