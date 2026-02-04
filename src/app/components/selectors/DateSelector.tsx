import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, ChevronDown, Plus, Check, AlertCircle, RectangleEllipsis, Calendar, Tag
} from "lucide-react";

// ============================================================================
// 1. UI COMPONENTS
// ============================================================================

interface DateBoxProps {
  date: Date;
  isSelected?: boolean;
  count?: number;
  onClick: () => void;
  disabled?: boolean;
  isBlocked?: boolean;
  isDimmed?: boolean;
  variantStyle?: 'default' | 'orange';
}

const DateBox = ({ 
  date, isSelected, count = 0, onClick, disabled, isBlocked, isDimmed, variantStyle = 'default' 
}: DateBoxProps) => {
  
  const getColors = () => {
    if (disabled) return 'text-gray-200 border-transparent bg-gray-50';
    if (isBlocked) return 'text-gray-200 border-transparent bg-transparent opacity-30 cursor-default';
    if (isDimmed) return 'bg-white border-gray-100 text-gray-300';
    
    if (isSelected) {
      return variantStyle === 'orange' 
        ? 'bg-[#ff6101] border-[#ff6101] text-white shadow-lg shadow-orange-100 scale-105'
        : 'bg-gray-900 border-gray-900 text-white shadow-md';
    }
    return 'bg-white border-gray-100 text-gray-900 hover:border-gray-200';
  };

  return (
    <button
      onClick={disabled || isBlocked ? undefined : onClick}
      disabled={disabled || isBlocked}
      className={`relative flex-none min-w-[45px] aspect-square flex flex-col items-center justify-center rounded-md border transition-all duration-200 ${getColors()}`}
    >
      <span className="text-[10px] font-black">{date.getDate()}</span>
      {count > 0 && (
        <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold 
          ${isSelected ? (variantStyle === 'orange' ? 'bg-white text-[#ff6101]' : 'bg-[#ff6101] text-white') : 'bg-gray-100 text-gray-600'}`}>
          {count}
        </div>
      )}
    </button>
  );
};

interface PassportCardProps {
  dates: Date[];
  isSelected: boolean;
  onClick: () => void;
  tag?: string;
}

const PassportCard = ({ dates, isSelected, onClick, tag }: PassportCardProps) => {
  const dateRange = useMemo(() => {
    if (!dates.length) return '';
    const f = (d: Date) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.','');
    return dates.length === 1 ? f(dates[0]) : `${f(dates[0])} – ${f(dates[dates.length-1])}`;
  }, [dates]);

  return (
    <button
      onClick={onClick}
      className={`flex-none w-[160px] p-4 pt-6 rounded-3xl flex flex-col items-center justify-center transition-all border-2 relative group
        ${isSelected 
          ? 'bg-orange-50 border-[#ff6101] text-gray-900 shadow-xl shadow-orange-100 ring-1 ring-[#ff6101]' 
          : 'bg-white border-gray-100 text-gray-400 hover:border-gray-300 hover:bg-gray-50'}`}
    >
      {tag && (
        <div className={`absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide shadow-sm z-10 whitespace-nowrap
          ${isSelected ? 'bg-[#ff6101] text-white' : 'bg-gray-800 text-white'}`}>
          {tag}
        </div>
      )}

      <span className={`text-[10px] font-black uppercase tracking-widest mb-2 ${isSelected ? 'text-[#ff6101]' : 'text-gray-400'}`}>
        Passaporte
      </span>
      <span className={`text-lg font-black leading-tight text-center mb-1 ${isSelected ? 'text-gray-900' : 'text-gray-500'}`}>
        {dateRange}
      </span>
      <span className="text-[10px] font-medium text-gray-400 bg-gray-100/50 px-2 py-1 rounded-full mt-1">
        {dates.length} dias inclusos
      </span>
      
      {isSelected && (
        <div className="absolute -top-3 -right-3 bg-[#ff6101] text-white p-1.5 rounded-full shadow-md border-2 border-white">
          <Check size={14} strokeWidth={4} />
        </div>
      )}
    </button>
  );
};

const PassportCardCompact = ({ dates, isSelected, onClick, tag }: PassportCardProps) => {
  return (
    <button onClick={onClick} className={`flex-none h-[85px] px-4 rounded-md flex flex-col items-center justify-center transition-all border-2 relative ${isSelected ? 'bg-orange-50 border-[#ff6101] text-gray-900 shadow-lg' : 'bg-white border-gray-100 text-gray-400 grayscale'}`}>
      {tag && isSelected && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-[#ff6101] text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full shadow-sm z-10">
          {tag}
        </div>
      )}
      <span className={`text-[9px] font-bold uppercase tracking-widest mb-0.5 ${isSelected ? 'text-[#ff6101]' : 'text-gray-400'}`}>Passaporte</span>
      <span className="text-xs font-black leading-tight text-center">{dates.length} Dias</span>
      {isSelected && <div className="absolute -top-2 -right-2 bg-[#ff6101] text-white p-1 rounded-full shadow-sm"><Check size={10} strokeWidth={4}/></div>}
    </button>
  );
};

const ActionButton = ({ onClick, label }: { onClick: () => void, label: React.ReactNode }) => (
  <button 
    onClick={onClick} 
    className="flex-none w-[85px] h-[85px] rounded-md border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-[#ff6101] hover:text-[#ff6101] hover:bg-orange-50 transition-all bg-white gap-1"
  >
    <Calendar size={20} />
    <span className="text-[9px] font-bold uppercase text-center leading-tight">{label}</span>
  </button>
);

const PassportTabs = ({ activePreset, onSelect }: { activePreset: number | 'all' | null, onSelect: (v: number | 'all') => void }) => {
  const presets = [3, 5];
  return (
    <div className="flex bg-gray-100 p-1 rounded-md mb-6">
      {presets.map(val => (
        <button key={val} onClick={() => onSelect(val)} className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${activePreset === val ? 'bg-white shadow-sm text-[#ff6101]' : 'text-gray-500 hover:text-gray-700'}`}>
          {val} Dias {activePreset === val && <Check size={12} />}
        </button>
      ))}
      <button onClick={() => onSelect('all')} className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${activePreset === 'all' ? 'bg-white shadow-sm text-[#ff6101]' : 'text-gray-500 hover:text-gray-700'}`}>
        Todos {activePreset === 'all' && <Check size={12} />}
      </button>
    </div>
  );
};

// ============================================================================
// 2. RENDERIZADOR DO GRID
// ============================================================================

const CalendarGridRenderer = ({ 
  calendarStructure, dates, soldOutDates, tempSelectedTs, activePassPreset, variant, handleDateClick, tickets 
}: any) => {
  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const isToday = (d: Date) => new Date().toDateString() === new Date().toDateString();

  const getBadgeCount = (d: Date) => {
    const dayIdx = dates.findIndex((date: Date) => date.getTime() === d.getTime());
    if (dayIdx === -1) return 0;
    return Object.keys(tickets).filter((k: string) => k.startsWith(`${dayIdx}-`)).reduce((a: number, b: string) => a + tickets[b], 0);
  };

  return (
    <>
      {Object.entries(calendarStructure).map(([monthName, monthDates]: [string, any]) => (
        <div key={monthName} className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h3 className="text-sm font-black text-gray-900 capitalize mb-4 px-1">{monthName}</h3>
          <div className="grid grid-cols-7 gap-2 mb-2">
            {weekDays.map(day => <span key={day} className="text-[10px] font-bold text-gray-300 uppercase text-center tracking-wider">{day}</span>)}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {monthDates.map((date: Date, idx: number) => {
              const ts = date.getTime();
              const isValidDate = dates.some((d: Date) => d.toDateString() === date.toDateString());
              const isSelected = tempSelectedTs.includes(ts);
              const isSoldOut = isValidDate && soldOutDates.includes(ts);
              const isBlocked = !isValidDate;

              let isDimmed = false;
              if (variant === 'minicombo' && !isSelected && !isSoldOut && !isBlocked) {
                   const limit = typeof activePassPreset === 'number' ? activePassPreset : dates.filter((d:Date) => !soldOutDates.includes(d.getTime())).length;
                   if (tempSelectedTs.length >= limit) isDimmed = true;
              }

              const useOrange = variant === 'minicombo' || variant === 'intervalo' || variant === 'mix';

              return (
                <div key={idx} style={idx === 0 ? { gridColumnStart: date.getDay() + 1 } : {}}>
                  <DateBox 
                    date={date} 
                    isSelected={isSelected} 
                    disabled={isSoldOut} 
                    isBlocked={isBlocked} 
                    isDimmed={isDimmed}
                    count={isValidDate ? getBadgeCount(date) : 0}
                    onClick={() => handleDateClick(date)}
                    variantStyle={useOrange ? 'orange' : 'default'}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
};

// ============================================================================
// 3. COMPONENTE PRINCIPAL
// ============================================================================

interface DateSelectorProps {
  variant: string; 
  dates: Date[];
  passportDates?: Date[];
  passportTag?: string; 
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  tickets: Record<string, number>;
  soldOutDates?: number[];
  onConfirmSelection: (selectedDates: Date[]) => void;
}

export const DateSelector = ({ 
  variant, dates, passportDates = [], passportTag, selectedDate, onSelectDate, tickets, soldOutDates = [], onConfirmSelection
}: DateSelectorProps) => {
  
  // --- Estados ---
  const [isPicking, setIsPicking] = useState(false);
  const [tempSelectedTs, setTempSelectedTs] = useState<number[]>([]);
  const [confirmedDatesTs, setConfirmedDatesTs] = useState<number[]>([]);
  const [activePassPreset, setActivePassPreset] = useState<number | 'all' | null>(null);

  // --- Memos ---
  const isToday = (d: Date) => new Date().toDateString() === new Date().toDateString();
  const formatDate = (d: Date) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });
  const availableDatesCount = useMemo(() => dates.filter(d => !soldOutDates.includes(d.getTime())).length, [dates, soldOutDates]);
  
  const getBadgeCount = (d: Date) => {
    const dayIdx = dates.findIndex(date => date.getTime() === d.getTime());
    if (dayIdx === -1) return 0;
    return Object.keys(tickets).filter(k => k.startsWith(`${dayIdx}-`)).reduce((a, b) => a + tickets[b], 0);
  };

  const checkPassportActive = (targetList: number[]) => {
    if (!passportDates.length || targetList.length !== passportDates.length) return false;
    const pts = passportDates.map(d => d.getTime());
    return targetList.every(ts => pts.includes(ts));
  };

  const isPassportSelectedTemp = checkPassportActive(tempSelectedTs);
  const isPassportConfirmed = checkPassportActive(confirmedDatesTs);

  const activeDates = useMemo(() => 
    dates.filter(d => confirmedDatesTs.includes(d.getTime()) || getBadgeCount(d) > 0 || d.getTime() === selectedDate?.getTime())
  , [dates, confirmedDatesTs, tickets, selectedDate]);

  const calendarStructure = useMemo(() => {
    const s: Record<string, Date[]> = {};
    if (!dates.length) return s;
    const months = new Set<string>();
    dates.forEach(d => months.add(`${d.getFullYear()}-${d.getMonth()}`));
    months.forEach(key => {
      const [y, m] = key.split('-').map(Number);
      const days = new Date(y, m + 1, 0).getDate();
      const arr = [];
      for (let i = 1; i <= days; i++) arr.push(new Date(y, m, i));
      s[new Date(y, m, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })] = arr;
    });
    return s;
  }, [dates]);

  // --- Efeito Auto-seleção (< 9 dias) ---
  useEffect(() => {
    if (variant === 'mix' || variant === 'unica') return;
    
    if (dates.length > 0 && dates.length < 9) {
      const allTs = dates.map(d => d.getTime());
      const alreadyConfirmed = confirmedDatesTs.length === allTs.length && confirmedDatesTs.every(ts => allTs.includes(ts));
      if (!alreadyConfirmed) {
        setConfirmedDatesTs(allTs);
        onConfirmSelection(dates);
        if (!selectedDate) {
          const firstAvailable = dates.find(d => !soldOutDates.includes(d.getTime()));
          onSelectDate(firstAvailable || dates[0]);
        }
      }
    }
  }, [dates, variant, confirmedDatesTs, selectedDate, soldOutDates]);

  // --- Handlers ---
  const applyPreset = (count: number | 'all') => {
    const avail = dates.filter(d => !soldOutDates.includes(d.getTime()));
    const toSel = count === 'all' ? avail : avail.slice(0, count);
    setTempSelectedTs(toSel.map(d => d.getTime()));
    setActivePassPreset(count);
  };

  // Confirmação Imediata (Para tela inicial)
  const selectPassportImmediate = () => {
    const pts = passportDates.map(d => d.getTime());
    setTempSelectedTs(pts);
    setConfirmedDatesTs(pts);
    onConfirmSelection(passportDates);
    if (passportDates.length > 0) onSelectDate(passportDates[0]);
  };

  // Toggle Temporário (Para dentro do Modal)
  const togglePassportTemp = () => {
    const pts = passportDates.map(d => d.getTime());
    if (isPassportSelectedTemp) {
        setTempSelectedTs([]);
    } else {
        setTempSelectedTs(pts);
    }
  };

  const handleDateClick = (date: Date) => {
    const ts = date.getTime();
    if (variant === 'dia') {
      setTempSelectedTs([ts]);
    } else if (variant === 'diário' || variant === 'mix') {
      setTempSelectedTs(prev => prev.includes(ts) ? prev.filter(t => t !== ts) : [...prev, ts]);
    } else if (variant === 'intervalo') {
      if (tempSelectedTs.length === 0 || tempSelectedTs.length >= 2) setTempSelectedTs([ts]);
      else {
        const [s, e] = [Math.min(tempSelectedTs[0], ts), Math.max(tempSelectedTs[0], ts)];
        const rng = dates.map(d => d.getTime()).filter(t => t >= s && t <= e && !soldOutDates.includes(t));
        setTempSelectedTs(rng);
      }
    } else if (variant === 'minicombo') {
      const isSel = tempSelectedTs.includes(ts);
      let newSel = isSel ? tempSelectedTs.filter(t => t !== ts) : [...tempSelectedTs];
      if (!isSel) {
        const lim = typeof activePassPreset === 'number' ? activePassPreset : availableDatesCount;
        if (newSel.length < lim) newSel = [...tempSelectedTs, ts];
        else newSel = tempSelectedTs;
      }
      if (newSel.length === availableDatesCount) setActivePassPreset('all');
      else if ([3, 5].includes(newSel.length)) setActivePassPreset(newSel.length as number);
      setTempSelectedTs(newSel);
    }
  };

  const confirmSelection = () => {
    setConfirmedDatesTs(tempSelectedTs);
    const confirmed = dates.filter(d => tempSelectedTs.includes(d.getTime()));
    onConfirmSelection(confirmed);
    if (confirmed.length > 0) onSelectDate(confirmed[0]);
    setIsPicking(false);
  };

  const getButtonState = () => {
    if (!tempSelectedTs.length) return { disabled: true, text: 'Selecione as datas' };
    if (variant === 'minicombo') {
      if (!activePassPreset) return { disabled: true, text: 'Selecione um pacote' };
      const limit = typeof activePassPreset === 'number' ? activePassPreset : availableDatesCount;
      if (tempSelectedTs.length < limit) return { disabled: true, text: `Faltam ${limit - tempSelectedTs.length} dias` };
    }
    return { disabled: false, text: 'Confirmar datas' };
  };

  const buttonState = getButtonState();

  // --- CONTROLES DO MODAL ---
  const renderModalControls = () => {
    if (variant === 'minicombo') {
      return <PassportTabs activePreset={activePassPreset} onSelect={applyPreset} />;
    }
    // --- NOVO: Exibe o PassportCard dentro do Modal se for Mix ---
    if (variant === 'mix' && passportDates.length > 0) {
      return (
        <div className="mb-6 flex gap-3 overflow-x-auto no-scrollbar pb-2">
           <PassportCard 
              dates={passportDates} 
              isSelected={isPassportSelectedTemp} // Usa o estado temporário
              onClick={togglePassportTemp} // Toggle temporário (não fecha modal)
              tag={passportTag}
           />
        </div>
      );
    }
    return null;
  };

  // ============================================================================
  // 4. RENDERIZAÇÃO FINAL
  // ============================================================================

  // 1. DATA ÚNICA
  if (variant === 'unica') {
    const s = dates[0];
    const e = dates[dates.length - 1];
    const same = s?.toDateString() === e?.toDateString();
    return (
      <div className='flex items-end w-full justify-between mb-3 animate-in fade-in duration-500'>
        <div className="flex flex-col">
          <p className="text-sm font-regular text-gray-600 tracking-wide mb-1">{same ? (isToday(s) ? "Hoje" : s.toLocaleDateString('pt-BR', { weekday: 'long' })) : "Período do Evento"}</p>
          <div className="flex flex-col font-bold text-gray-900 text-lg leading-tight capitalize">
            <span className='mb-1'>{!same ? <>De <span className='text-[#ff6101]'>{formatDate(s)}</span></> : formatDate(s)}</span>
            {!same && <span>até <span className='text-[#ff6101]'>{formatDate(e)}</span></span>}
          </div>
        </div>
        <button className="flex items-center gap-2 h-[40px] bg-white border border-gray-300 text-gray-900 px-2 py-2 text-sm rounded-md font-bold active:scale-95 transition-all shadow-sm"><RectangleEllipsis size={20} />Código</button>
      </div>
    );
  }

  // 2. EMPTY STATE ESPECÍFICO PARA MIX
  if (!selectedDate && variant === 'mix') {
    return (
      <div className="mb-0 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex items-start justify-between mb-6">
           <div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Selecione as datas</h2>
              <p className="text-sm font-medium text-gray-500">Escolha o passaporte ou dias avulsos</p>
           </div>
           <button className="flex items-center gap-2 h-[40px] bg-white border border-gray-300 text-gray-900 px-4 py-2 text-xs rounded-md font-bold active:scale-95 transition-all shadow-sm"><RectangleEllipsis size={16} />Código</button>
        </div>

        {/* ÁREA DE PASSAPORTE */}
        {passportDates.length > 0 && (
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-6 pl-1">
             <PassportCard 
                dates={passportDates} 
                isSelected={isPassportSelectedTemp} 
                onClick={selectPassportImmediate} // Confirma e avança
                tag={passportTag} 
             />
          </div>
        )}

        {/* CALENDÁRIO INLINE */}
        <div className="mb-8 max-h-[400px] overflow-y-auto no-scrollbar">
            <CalendarGridRenderer 
                calendarStructure={calendarStructure}
                dates={dates}
                soldOutDates={soldOutDates}
                tempSelectedTs={tempSelectedTs}
                activePassPreset={activePassPreset}
                variant={variant}
                handleDateClick={handleDateClick}
                tickets={tickets}
            />
        </div>

        <button disabled={buttonState.disabled} onClick={confirmSelection} className="w-full bg-gray-900 text-white py-5 rounded-md font-black text-sm uppercase tracking-[0.2em] transition-all active:scale-95 disabled:opacity-50 disabled:bg-gray-300 disabled:text-gray-500 shadow-xl flex items-center justify-center gap-2">
            {buttonState.disabled && <AlertCircle size={16} />} {buttonState.text}
        </button>
      </div>
    );
  }

  // 3. EMPTY STATE GENÉRICO
  if (!selectedDate && activeDates.length === 0) {
    return (
      <div className="mb-0 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex items-start justify-between mb-6">
           <div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">{variant === 'minicombo' ? 'Monte seu combo' : 'Selecione as datas'}</h2>
              <p className="text-sm font-medium text-gray-500">Datas disponíveis</p>
           </div>
           <button className="flex items-center gap-2 h-[40px] bg-white border border-gray-300 text-gray-900 px-4 py-2 text-xs rounded-md font-bold active:scale-95 transition-all shadow-sm"><RectangleEllipsis size={16} />Código</button>
        </div>
        
        {variant === 'minicombo' && <PassportTabs activePreset={activePassPreset} onSelect={applyPreset} />}
        
        <div className="mb-8 max-h-[400px] overflow-y-auto no-scrollbar">
            <CalendarGridRenderer 
                calendarStructure={calendarStructure}
                dates={dates}
                soldOutDates={soldOutDates}
                tempSelectedTs={tempSelectedTs}
                activePassPreset={activePassPreset}
                variant={variant}
                handleDateClick={handleDateClick}
                tickets={tickets}
            />
        </div>
        
        <button disabled={buttonState.disabled} onClick={confirmSelection} className="w-full bg-gray-900 text-white py-5 rounded-md font-black text-sm uppercase tracking-[0.2em] transition-all active:scale-95 disabled:opacity-50 disabled:bg-gray-300 disabled:text-gray-500 shadow-xl flex items-center justify-center gap-2">
            {buttonState.disabled && <AlertCircle size={16} />} {buttonState.text}
        </button>
      </div>
    );
  }

  // 4. NAVEGAÇÃO HORIZONTAL
  return (
    <div className="flex flex-col mb-0 animate-in fade-in duration-500">
      
      <AnimatePresence>
        {isPicking && (
          <div className="fixed inset-0 z-[2000] bg-black/60 flex flex-col justify-end backdrop-blur-sm">
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="bg-white w-full max-h-[92vh] rounded-t-[40px] flex flex-col overflow-hidden shadow-2xl">
              <div className="p-6 pb-0">
                <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6" />
                <div className="flex justify-between items-start mb-6">
                  <div>
                      <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                        {variant === 'minicombo' ? 'Monte seu combo' : 'Selecione os dias'}
                      </h2>
                      <p className="text-sm font-medium text-gray-500">
                        {variant === 'minicombo' ? 'Selecione a quantidade de dias' : 'Datas disponíveis'}
                      </p>
                  </div>
                  <button onClick={() => setIsPicking(false)} className="p-2 bg-gray-100 rounded-full text-gray-900"><X size={20}/></button>
                </div>
                {/* --- RENDERIZA CONTROLES (PASSAPORTE) DENTRO DO MODAL --- */}
                {renderModalControls()}
              </div>
              <div className="flex-1 overflow-y-auto px-6 pb-32 no-scrollbar pt-4">
                <CalendarGridRenderer 
                    calendarStructure={calendarStructure}
                    dates={dates}
                    soldOutDates={soldOutDates}
                    tempSelectedTs={tempSelectedTs}
                    activePassPreset={activePassPreset}
                    variant={variant}
                    handleDateClick={handleDateClick}
                    tickets={tickets}
                />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t border-gray-100">
                <button disabled={buttonState.disabled} onClick={confirmSelection} className="w-full bg-gray-900 text-white py-5 rounded-md font-black text-sm uppercase tracking-[0.2em] transition-all active:scale-95 disabled:opacity-50 disabled:bg-gray-300 disabled:text-gray-500 shadow-xl flex items-center justify-center gap-2">
                  {buttonState.disabled && <AlertCircle size={16} />} {buttonState.text}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      <div className="flex items-end w-full justify-between mb-6">
        <div className="flex flex-col flex-1">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Data em foco</p>
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-gray-900 text-xl capitalize">{selectedDate ? formatDate(selectedDate) : "Selecione..."}</h2>
          </div>
        </div>
        <button className="flex items-center gap-2 h-[48px] bg-white border border-gray-300 text-gray-900 px-4 py-2 text-sm rounded-md font-bold shadow-sm active:scale-95 transition-all"><RectangleEllipsis size={20} />Código</button>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar [&::-webkit-scrollbar]:hidden pb-4 border-b border-gray-100">
        
        {/* MIX: Mostra Passaporte Compacto se confirmado */}
        {variant === 'mix' && isPassportConfirmed && passportDates.length > 0 && (
          <PassportCardCompact 
            dates={passportDates} 
            isSelected={true} 
            onClick={() => { setIsPicking(true); setTempSelectedTs(confirmedDatesTs); }} 
            tag={passportTag} 
          />
        )}

        {/* Datas Individuais */}
        {(!isPassportConfirmed || variant !== 'mix') && activeDates.map(date => (
          <DateBox 
            key={date.getTime()} 
            date={date} 
            isSelected={selectedDate?.getTime() === date.getTime()} 
            count={getBadgeCount(date)} 
            onClick={() => onSelectDate(date)} 
            variantStyle={(variant === 'minicombo' || variant === 'intervalo' || variant === 'mix') ? 'orange' : 'default'}
          />
        ))}

        {/* Botão Alterar */}
        <ActionButton 
            onClick={() => { setIsPicking(true); setTempSelectedTs(confirmedDatesTs); }} 
            label={variant === 'mix' ? "Escolher\noutras datas" : "Alterar"}
        />
      </div>
    </div>
  );
};