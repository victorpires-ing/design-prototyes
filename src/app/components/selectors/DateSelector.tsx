import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, RectangleEllipsis, Calendar, X } from "lucide-react";

export const DateSelector = ({ dates, selectedDate, onSelectDate, tickets, soldOutDates = [], onConfirmSelection }: any) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const modalScrollRef = useRef<HTMLDivElement>(null);
  
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [tempSelected, setTempSelected] = useState<number[]>([]);
  const [visibleDates, setVisibleDates] = useState<Date[]>([]);
  const [showArrows, setShowArrows] = useState({ left: false, right: false });

  // Helper para contagem de ingressos (Badge) - IGNORA SE DATA ESTIVER ESGOTADA
  const getBadgeCount = (d: Date) => {
    if (soldOutDates.includes(d.getTime())) return 0;

    const dayIdx = dates.findIndex((date: Date) => date.getTime() === d.getTime());
    if (dayIdx === -1) return 0;
    
    return Object.keys(tickets)
      .filter((k: string) => k.startsWith(`${dayIdx}-`))
      .reduce((acc: number, key: string) => acc + tickets[key], 0);
  };

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowArrows({
        left: scrollLeft > 0,
        right: scrollLeft < scrollWidth - clientWidth - 1
      });
    }
  };

  useEffect(() => {
    if (dates.length <= 7) {
      setVisibleDates(dates);
      setIsCalendarOpen(false);
    } else {
      if (visibleDates.length === 0 && !selectedDate) {
         setTimeout(() => setIsCalendarOpen(true), 100);
      }
    }
  }, [dates]);

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) el.addEventListener('scroll', checkScroll);
    window.addEventListener('resize', checkScroll);
    return () => {
      if (el) el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [visibleDates]);

  const calendarStructure = useMemo(() => {
    const s: Record<string, Date[]> = {};
    dates.forEach((d: Date) => {
      const label = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      const formattedLabel = label.charAt(0).toUpperCase() + label.slice(1);
      if (!s[formattedLabel]) s[formattedLabel] = [];
      s[formattedLabel].push(d);
    });
    return s;
  }, [dates]);

  const handleConfirmDates = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    const confirmedSubset = dates.filter((d: Date) => tempSelected.includes(d.getTime()));
    if (confirmedSubset.length > 0) {
      setVisibleDates(confirmedSubset);
      if (onConfirmSelection) onConfirmSelection(confirmedSubset);
      onSelectDate(confirmedSubset[0]);
      setIsCalendarOpen(false);
    }
  };

  const handleCloseModal = () => {
    if (visibleDates.length === 0 && tempSelected.length === 0) {
      const firstValid = dates.find((d: Date) => !soldOutDates.includes(d.getTime())) || dates[0];
      if (firstValid) {
        const initialSet = [firstValid];
        setVisibleDates(initialSet);
        onSelectDate(firstValid);
        setTempSelected([firstValid.getTime()]);
        if (onConfirmSelection) onConfirmSelection(initialSet);
      }
    }
    setIsCalendarOpen(false);
  };

  useEffect(() => {
    if (isCalendarOpen) {
        const initialSelection = visibleDates.length > 0 ? visibleDates.map(d => d.getTime()) : [];
        setTempSelected(initialSelection);
    }
  }, [isCalendarOpen]);

  const scrollModal = (direction: 'left' | 'right') => {
    if (modalScrollRef.current) {
      modalScrollRef.current.scrollBy({ left: direction === 'left' ? -400 : 400, behavior: 'smooth' });
    }
  };

  const scrollList = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: direction === 'left' ? -200 : 200, behavior: 'smooth' });
    }
  };

  if (dates.length === 1) {
    const d = dates[0];
    return (
      <div className="mb-0 animate-in fade-in">
        <p className="text-gray-500 text-base mb-1 lowercase">{d.toLocaleDateString('pt-BR', { weekday: 'long' })}</p>
        <h2 className="text-xl font-bold text-gray-900 leading-tight">
          {d.getDate().toString().padStart(2, '0')} de {d.toLocaleDateString('pt-BR', { month: 'long' })} de {d.getFullYear()}
        </h2>
      </div>
    );
  }

  const showModalArrows = Object.keys(calendarStructure).length > 2;

  // Calculo dinâmico de largura para desktop
  const monthCount = Object.keys(calendarStructure).length;
  // Se tiver apenas 1 mês, usa largura menor. Se tiver 2+, expande.
  const desktopModalWidthClass = monthCount === 1 ? 'md:w-[450px]' : 'md:w-fit md:min-w-[680px] md:max-w-[95vw]';

  return (
    <div className="flex flex-col mb-5">

      {/* LISTA HORIZONTAL */}
      <div className="relative flex items-center gap-2 group">
        {showArrows.left && (
          <button onClick={() => scrollList('left')} className="absolute -left-3 z-10 p-1.5 bg-white border border-gray-100 rounded-full shadow-md text-gray-500 hover:text-gray-900 hover:scale-105 transition-all"><ChevronLeft size={16} /></button>
        )}

        <div ref={scrollRef} className="flex-1 flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden scroll-smooth py-1 px-1">
          {visibleDates.map((date: Date) => {
            const isSoldOut = soldOutDates.includes(date.getTime());
            const isSelected = selectedDate?.getTime() === date.getTime();
            const count = getBadgeCount(date);

            return (
              <button
                key={date.getTime()}
                disabled={isSoldOut}
                onClick={() => onSelectDate(date)}
                className={`relative flex-none w-[92px] h-[78px] flex flex-col items-center justify-center rounded-md border transition-all hover:bg-gray-50 hover:cursor-pointer
                  ${isSelected ? 'bg-[#FFEFE6] border-b-2 border-[#ff6101]' : 'bg-white border-gray-200 text-gray-900'}
                  ${isSoldOut ? 'cursor-not-allowed text-[#B1B1B1]' : ''}`}
              >
                {count > 0 && !isSoldOut && (
                  <div className="absolute -top-2 -right-2 w-5 h-5 bg-[#ff6101] text-white text-[10px] font-bold flex items-center justify-center rounded-full shadow-sm z-10 boder-1 border-white">
                    {count}
                  </div>
                )}

                <span className={`text-[12px] font-medium capitalize ${isSoldOut ? 'text-[#B1B1B1]' : 'text-gray-500'}`}>
                  {date.toLocaleDateString('pt-BR', { weekday: 'short' }).slice(0, 3)}
                </span>
                <span className={`text-base font-medium flex gap-1 p-0 m-0 ${isSoldOut ? 'text-[#B1B1B1]' : ''}`}>
                  <span>{date.getDate()}</span>
                  <span className="uppercase">{date.toLocaleDateString('pt-BR', { month: 'short' }).slice(0, 3)}</span>
                </span>
                <span className={`text-sm font-medium ${isSoldOut ? 'text-[#B1B1B1]' : 'text-gray-500'}`}>de {date.getFullYear()}</span>
                
                {isSoldOut && (
                   <span className="absolute bottom-0 h-[20px] w-[92px] text-[10px] font-medium bg-[#E6E6E6] text-gray-500 rounded-b-sm flex items-center justify-center">
                     Esgotado
                   </span>
                )}
              </button>
            );
          })}

          {dates.length >= 8 && (
            <button onClick={() => setIsCalendarOpen(true)} className="flex-none w-[92px] h-[78px] bg-white flex flex-col items-center justify-center rounded-md border-1 border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-[#EF6C00] hover:border-[#EF6C00] transition-colors hover:bg-gray-50 hover:cursor-pointer">
              <Calendar size={18} color='#EF6C00'/>
              <span className="text-sm font-regular mt-1">Trocar <br /> datas</span>
            </button>
          )}
        </div>

        {showArrows.right && (
          <button onClick={() => scrollList('right')} className="absolute -right-3 z-10 p-1.5 bg-white border border-gray-100 rounded-full shadow-md text-gray-500 hover:text-gray-900 hover:scale-105 transition-all"><ChevronRight size={16} /></button>
        )}
      </div>

      {/* MODAL CALENDÁRIO */}
      <AnimatePresence>
        {isCalendarOpen && (
          <div className="fixed inset-0 z-[1000] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-0 md:p-4">
            <div className="absolute inset-0" onClick={handleCloseModal} />
            
            <motion.div 
              initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              // CORREÇÃO: Mobile 100% width (w-full), Desktop largura dinâmica, max-h-[85vh] mobile
              className={`bg-white w-full ${desktopModalWidthClass} rounded-t-[32px] md:rounded-[32px] flex flex-col max-h-[85vh] md:max-h-[85vh] overflow-hidden relative z-10 shadow-2xl`}
            >
              {/* Header Modal */}
              <div className="p-4 border-b border-gray-50 flex justify-between items-center gap-4 bg-white z-20 shrink-0">
                <div className="flex-1">
                  <h2 className="text-base font-bold text-gray-900 leading-tight">Escolha a data do evento</h2>
                  <p className="text-sm text-gray-400 mt-1">Selecione a data desejada para continuar com a compra.</p>
                </div>

                {/* Setas só aparecem se tiver mais de 2 meses */}
                {showModalArrows && (
                  <div className="hidden md:flex items-center gap-2 mr-4">
                    <button type="button" onClick={() => scrollModal('left')} className="p-2 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors text-gray-600"><ChevronLeft size={20} /></button>
                    <button type="button" onClick={() => scrollModal('right')} className="p-2 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors text-gray-600"><ChevronRight size={20} /></button>
                  </div>
                )}
                <button type="button" onClick={handleCloseModal} className="p-2 -mr-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-full transition-colors"><X size={24} /></button>
              </div>

              {/* Corpo Modal */}
              <div className="relative overflow-hidden overflow-y-auto bg-white flex-1">
                <div ref={modalScrollRef} className="h-full overflow-y-auto md:overflow-y-hidden md:overflow-x-auto md:max-w-[800px] [&::-webkit-scrollbar]:hidden scroll-smooth px-4 py-2">
                  {/* Container dos Meses: Flex Row no Desktop, Flex Col no Mobile (já é padrão se não especificar md:flex-row) */}
                  <div className={`flex flex-col md:flex-row gap-6 w-full md:w-fit mx-auto md:mx-0 pb-4 md:pb-0`}>
                    {Object.entries(calendarStructure).map(([month, monthDates]) => (
                      <div key={month} className={`flex-none w-full ${monthCount === 1 ? 'md:w-[424px]' : 'md:w-[372px]'}`}>
                        <h3 className="text-regular font-semibold text-gray-900 mb-5 text-left">{month}</h3>
                        
                        <div className="grid grid-cols-7 gap-y-4 gap-x-2 text-center">
                          {['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(d => (
                            <span key={d} className="text-sm font-normal text-gray-500">{d}</span>
                          ))}
                          
                          {Array.from({ length: monthDates[0].getDay() }).map((_, i) => <div key={`empty-${i}`} />)}

                          {monthDates.map((date: Date) => {
                            const isSelected = tempSelected.includes(date.getTime());
                            const isSoldOut = soldOutDates.includes(date.getTime());
                            return (
                              <button
                                key={date.getTime()}
                                type="button"
                                disabled={isSoldOut}
                                onClick={() => setTempSelected(prev => prev.includes(date.getTime()) ? prev.filter(t => t !== date.getTime()) : [...prev, date.getTime()])}
                                className={`h-10 w-full flex flex-col items-center justify-center text-base transition-all relative
                                  ${isSoldOut 
                                    ? 'text-gray-300 cursor-not-allowed' 
                                    : isSelected 
                                      ? 'bg-[#E46B26] text-white font-medium rounded-md' 
                                      : 'text-gray-900 hover:bg-gray-100 rounded-md'
                                  }`}
                              >
                                {date.getDate()}
                                {isSoldOut && (
                                  <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gray-200 text-gray-500 text-[9px] px-1 rounded whitespace-nowrap z-10">
                                    Esgotado
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer Modal */}
              <div className="p-4 md:p-6 border-t border-gray-100 bg-white z-30 flex justify-end shrink-0">
                <button 
                  type="button"
                  onClick={handleConfirmDates}
                  className={`px-8 py-3 rounded-md font-bold text-sm text-white transition-all w-full md:w-auto
                    ${tempSelected.length > 0 ? 'bg-[#E46B26] hover:bg-orange-700' : 'bg-gray-200 cursor-not-allowed'}`}
                >
                  {tempSelected.length === 0 ? "Escolha ao menos uma data" : "Confirmar"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};