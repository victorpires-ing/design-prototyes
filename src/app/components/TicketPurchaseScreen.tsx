import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, ChevronLeft, Ticket } from "lucide-react"; 

// --- IMPORTS DOS SEUS COMPONENTES ---
import Header from './layout/Header';
import { TicketSelectionSheet } from './ui/TicketSelectionSheet';
import { TicketRemovalModal } from './ui/TicketRemovalModal';
import { ScenarioControls } from './ui/ScenarioControls';
import { DateSelector } from './selectors/DateSelector';
import { TimeSelector } from './selectors/TimeSelector';

export function TicketPurchaseScreen({ onDatePickerOpen }: any) {

  // --- 0. ESTADOS DE NAVEGAÇÃO (STEPPER) ---
  const [step, setStep] = useState<1 | 2>(1); // 1: Ingressos, 2: Produtos
  const [productSelection, setProductSelection] = useState<Record<string, number>>({});

  // --- 1. MOCK ENGINE (Seu código original) ---
  const passportDatesMock = useMemo(() => {
    const today = new Date();
    const dates = [];
    for (let i = 0; i < 3; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      dates.push(d);
    }
    return dates;
  }, []);
  
  const [params, setParams] = useState({ 
    dates: 'unica', 
    times: 'unico', 
    maps: 'nenhum', 
    customStartDate: new Date().toISOString().split('T')[0],
    customEndDate: '',
    unavailableDates: [] as string[],
    hasCombos: false,
    limits: { global: '', perDay: '', perTime: '' }
  });

  const { dates, availableTimes, soldOutDates, combos } = useMemo(() => {
    let generatedDates: Date[] = [];
    const start = new Date(params.customStartDate + 'T00:00:00');

    if (params.customEndDate) {
        const end = new Date(params.customEndDate + 'T00:00:00');
        const diffDays = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)); 
        generatedDates = Array.from({ length: diffDays + 1 }, (_, i) => {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            return d;
        });
    } else {
        const gen = (count: number) => Array.from({ length: count }, (_, i) => {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            return d;
        });
        const dMap: any = { 
            unica: gen(1),
            avulsas: [gen(1)[0], gen(3)[2], gen(6)[5], gen(10)[9]], 
            intervalo: gen(9),
            'diário': gen(9),
            passaporte: gen(9),
            infinitas: gen(45)
        };
        generatedDates = dMap[params.dates] || gen(9);
    }

    const tMap: any = { 
        unico: ["19:00"], 
        alguns: ["10:00", "14:00", "18:00"], 
        varios: ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00"]
    };

    const soldOutTimestamps = (params.unavailableDates || []).map((dateStr: string) => new Date(dateStr + 'T00:00:00').getTime());

    // MOCK DE PRODUTOS (Para Step 2)
    const mockCombos = [
      { id: 'c1', name: 'Combo Pipoca + Refri', description: 'Pipoca média e refrigerante', price: 55, image: '🍿' },
      { id: 'c2', name: 'Cerveja (Lata)', description: 'Pilsen 350ml', price: 15, image: '🍺' },
      { id: 'c3', name: 'Camiseta Oficial', description: 'Tamanhos diversos', price: 120, image: '👕' },
      { id: 'c4', name: 'Copo Eco', description: 'Reutilizável do evento', price: 10, image: '🥤' }
    ];

    return { 
      dates: generatedDates, 
      availableTimes: tMap[params.times] || tMap['unico'],
      soldOutDates: soldOutTimestamps,
      combos: mockCombos
    };
  }, [params]);

  // --- 3. ESTADOS DE SELEÇÃO (Passo 1) ---
  const [activeDate, setActiveDate] = useState<Date | null>(null);
  const [activeTime, setActiveTime] = useState<string | null>(null);
  const [ticketSelection, setTicketSelection] = useState<Record<string, number>>({});
  const [sheetTime, setSheetTime] = useState<string | null>(null);
  const [removalModal, setRemovalModal] = useState<{ isOpen: boolean; dayIdx: number; time: string }>({ isOpen: false, dayIdx: -1, time: '' });

  const activeDateIdx = useMemo(() => {
      if (!dates || dates.length === 0 || !activeDate) return -1;
      return dates.findIndex((d: Date) => d.toDateString() === activeDate.toDateString());
  }, [dates, activeDate]);

  // --- 4. EFEITOS E REGRAS ---
  useEffect(() => {
    if (params.dates === 'unica' && dates.length > 0) {
       setActiveDate(dates[0]);
    } else if (params.dates !== 'unica') {
       const hasAnyTicket = Object.keys(ticketSelection).length > 0;
       if (!hasAnyTicket) setActiveDate(null); 
       else {
         const isValid = activeDate && dates.some(d => d.getTime() === activeDate.getTime());
         if (!isValid) setActiveDate(null);
       }
    }
    setActiveTime(params.times === 'varios' ? null : availableTimes?.[0] || null);
  }, [params.dates, params.times, dates]); 

  // --- 5. HANDLERS ---
  const handleSelectDate = (date: Date) => {
    setActiveDate(date);
    if (params.times === 'varios') setSheetTime(null);
    else setActiveTime(availableTimes[0]);
  };

  const handleSelectTime = (time: string) => {
    params.times === 'varios' ? setSheetTime(time) : setActiveTime(time);
  };

  const handleClearTime = (time: string) => {
    const hasTickets = Object.entries(ticketSelection).some(([key, qty]) => key.startsWith(`${activeDateIdx}-${time}-`) && qty > 0);
    if (hasTickets) setRemovalModal({ isOpen: true, dayIdx: activeDateIdx, time });
  };

  const confirmRemoval = () => {
    const { dayIdx, time } = removalModal;
    setTicketSelection(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(key => { if (key.startsWith(`${dayIdx}-${time}-`)) delete next[key]; });
      return next;
    });
    setRemovalModal({ isOpen: false, dayIdx: -1, time: '' });
  };

  const handleUpdateTicket = (dayIdx: number, time: string, ticketId: string, delta: number) => {
    const key = `${dayIdx}-${time}-${ticketId}`;
    setTicketSelection(prev => {
      const currentQty = prev[key] || 0;
      const newQty = Math.max(0, currentQty + delta);
      const next = { ...prev, [key]: newQty };
      if (newQty === 0) delete next[key];
      return next;
    });
  };

  // Handler de Produtos (Step 2)
  const handleUpdateProduct = (productId: string, delta: number) => {
    setProductSelection(prev => {
      const current = prev[productId] || 0;
      const newVal = Math.max(0, current + delta);
      const next = { ...prev, [productId]: newVal };
      if (newVal === 0) delete next[productId];
      return next;
    });
  };

  // --- 7. CÁLCULO DE TOTAL ---
  const ticketsTotal = Object.entries(ticketSelection).reduce((acc, [key, qty]) => {
     let price = 0;
     // Mock simples de preço
     if (key.includes('t3')) price = 350; else if (key.includes('t1')) price = 150; else price = 75;
     return acc + (qty * price);
  }, 0);

  const productsTotal = Object.entries(productSelection).reduce((acc, [id, qty]) => {
    const product = combos.find(c => c.id === id);
    return acc + (qty * (product?.price || 0));
  }, 0);

  const grandTotal = ticketsTotal + productsTotal;
  const hasTickets = ticketsTotal > 0;

  // --- RENDERIZADORES DE ETAPAS ---

  // STEP 1: Ingressos (Visual Antigo)
  const renderStep1 = () => (
    <motion.div 
      key="step1"
      initial={{ x: -20, opacity: 0 }} 
      animate={{ x: 0, opacity: 1 }} 
      exit={{ x: -20, opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="pb-32"
    >
      {/* MAPA */}
      {params.maps !== 'nenhum' && (
        <div className="w-full mb-6 animate-in fade-in zoom-in-95 duration-500">
          {params.maps === 'io' ? (
            <div className="w-full h-[500px] rounded-md overflow-hidden border border-gray-200 shadow-sm bg-white">
              <iframe src="https://app.seats.io/preview/eu/c5c2b33f-4aaf-4b96-aa5e-6cdc7aa068c9/141002a5-6408-47a0-8fcd-fa7a93dfe0bd" className="w-full h-full border-none" title="Mapa" allowFullScreen />
            </div>
          ) : (
            <div className="w-full rounded-md overflow-hidden border border-gray-200 shadow-sm bg-gray-50">
                <img src="/maps.webp" alt="Mapa" className="w-full h-auto object-cover block" />
            </div>
          )}
        </div>
      )}

      <div className="mt-0 animate-in fade-in duration-500 pb-0">
        <DateSelector 
          variant={params.dates}
          dates={dates}
          passportDates={passportDatesMock}
          passportTag="20% OFF"
          selectedDate={activeDate}
          onSelectDate={handleSelectDate}
          onConfirmSelection={(selected) => selected.length > 0 && setActiveDate(selected[0])}
          tickets={ticketSelection}
          soldOutDates={soldOutDates}
        />

        <AnimatePresence mode="wait">
          {activeDate && (
            <motion.div
              key={activeDate.toISOString()} 
              initial={{ opacity: 0, x: 20, filter: 'blur(4px)' }} 
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }} 
              exit={{ opacity: 0, x: -20, filter: 'blur(4px)', transition: { duration: 0.15 } }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="w-full"
            >
              <TimeSelector 
                variant={params.times}
                availableTimes={availableTimes}
                selectedTime={activeTime}
                onSelectTime={handleSelectTime}
                onClearTime={handleClearTime}
                tickets={ticketSelection}
                dayIdx={activeDateIdx}
                onUpdateTicket={handleUpdateTicket}
                showCombos={false} // Combos removidos daqui
                limits={params.limits}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );

  // STEP 2: Produtos (Nova tela)
  const renderStep2 = () => (
    <motion.div 
      key="step2"
      initial={{ x: 20, opacity: 0 }} 
      animate={{ x: 0, opacity: 1 }} 
      exit={{ x: 20, opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="pb-32 space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-gray-900">Turbine seu evento</h2>
          <p className="text-sm text-gray-500">Adicione bebidas e extras ao pedido</p>
        </div>
        <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
          <ShoppingBag size={20} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {combos.map((product) => {
          const qty = productSelection[product.id] || 0;
          return (
            <div key={product.id} className={`flex flex-col p-4 rounded-xl border-2 transition-all ${qty > 0 ? 'border-purple-500 bg-purple-50' : 'border-gray-100 bg-white'}`}>
              <div className="text-3xl mb-2">{product.image}</div>
              <span className="text-xs font-bold text-gray-900 leading-tight min-h-[32px] block mb-1">
                {product.name}
              </span>
              <span className="text-xs text-gray-500 font-medium mb-3">
                R$ {product.price.toFixed(2).replace('.',',')}
              </span>
              
              {qty === 0 ? (
                <button 
                  onClick={() => handleUpdateProduct(product.id, 1)}
                  className="w-full py-2 bg-gray-900 text-white rounded-lg text-xs font-bold uppercase hover:bg-purple-600 transition-colors"
                >
                  Adicionar
                </button>
              ) : (
                <div className="flex items-center justify-between bg-white rounded-lg p-1 border border-gray-200">
                  <button onClick={() => handleUpdateProduct(product.id, -1)} className="w-8 h-8 flex items-center justify-center text-gray-500 font-bold">-</button>
                  <span className="text-xs font-black">{qty}</span>
                  <button onClick={() => handleUpdateProduct(product.id, 1)} className="w-8 h-8 flex items-center justify-center text-purple-600 font-bold">+</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );

  // --- RENDERIZAÇÃO PRINCIPAL ---
  return (
    <div className="w-full h-screen bg-white overflow-hidden font-sans relative flex flex-col">
      
      <ScenarioControls params={params} setParams={setParams} />
      <Header params={params} setParams={setParams} />

      <main className="flex-1 overflow-y-auto mt-[96px] p-4 w-full">
        <AnimatePresence mode="wait">
          {step === 1 ? renderStep1() : renderStep2()}
        </AnimatePresence>
      </main>

      {/* --- MODAIS (Step 1) --- */}
      <TicketSelectionSheet 
        isOpen={!!sheetTime}
        time={sheetTime}
        onClose={() => setSheetTime(null)}
        tickets={ticketSelection}
        onUpdateTicket={handleUpdateTicket}
        dayIdx={activeDateIdx}
        showCombos={false} 
        limits={params.limits}
      />

      <TicketRemovalModal 
        isOpen={removalModal.isOpen} 
        targetName={removalModal.time}
        onClose={() => setRemovalModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmRemoval}
      />

      {/* --- FOOTER RESTAURADO (ESTILO ORIGINAL) --- */}
      <AnimatePresence>
        {grandTotal > 0 && (
          <motion.div 
            initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} 
            className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 flex items-center justify-between z-[100] shadow-[0_-10px_30px_rgba(0,0,0,0.08)]"
          >
            <div className="flex items-center gap-3">
              {/* Botão Voltar Sutil (Apenas no Step 2) */}
              {step === 2 && (
                <button 
                  onClick={() => setStep(1)} 
                  className="p-2 -ml-2 text-gray-400 hover:text-gray-900 transition-colors"
                >
                  <ChevronLeft size={24} />
                </button>
              )}
              
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest text-left">
                  {step === 1 ? 'Subtotal' : 'Total Final'}
                </span>
                <span className="text-lg font-black text-gray-900 leading-none">
                  R$ {grandTotal.toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>

            <button 
              onClick={() => {
                if (step === 1) setStep(2);
                else alert("Ir para Checkout");
              }}
              className="bg-[#ff6101] text-white px-10 py-3 rounded-md font-bold shadow-lg active:scale-95 transition-all"
            >
              {step === 1 ? 'Continuar' : 'Pagar'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}