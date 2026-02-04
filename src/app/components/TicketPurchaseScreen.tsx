import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Map } from "lucide-react"; 

// --- IMPORTS DE COMPONENTES ---
import Header from './layout/Header';
import BiometryWarning from './layout/BiometryWarning';
import { TicketSelectionSheet } from './ui/TicketSelectionSheet';
import { TicketRemovalModal } from './ui/TicketRemovalModal';
import { ScenarioControls } from './ui/ScenarioControls'; // Adicionado para controle total

import { DateSelector } from './selectors/DateSelector';
import { TimeSelector } from './selectors/TimeSelector';

export function TicketPurchaseScreen({ onDatePickerOpen }: any) {

  const passportDatesMock = useMemo(() => {
    const today = new Date();
    const dates = [];
    
    // Gera: Hoje, Amanhã e Depois de Amanhã (3 dias)
    for (let i = 0; i < 3; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      dates.push(d);
    }
    return dates;
  }, []);
  
  // --- 1. CONFIGURAÇÃO (PARAMETRIZAÇÃO) ---
  const [params, setParams] = useState({ 
    // Variantes de Layout
    dates: 'unica', // 'unica' | 'diário' | 'passaporte' | 'intervalo'
    times: 'unico', // 'unico' | 'alguns' | 'varios'
    maps: 'nenhum', // 'nenhum' | 'imagem' | 'io'
    
    // Controle de Datas
    customStartDate: new Date().toISOString().split('T')[0],
    customEndDate: '',
    unavailableDates: [] as string[],
    
    // Regras de Negócio
    hasCombos: false, // Exibe seção de extras?
    limits: {
      global: '',   // Limite total
      perDay: '',   // Limite diário
      perTime: ''   // Limite por slot
    }
  });

  // --- 2. ENGINE DE DADOS (SIMULAÇÃO) ---
  const { dates, availableTimes, soldOutDates, combos } = useMemo(() => {
    
    // A. Geração de Datas
    let generatedDates: Date[] = [];
    const start = new Date(params.customStartDate + 'T00:00:00');

    if (params.customEndDate) {
        // Intervalo Customizado (via DevTools)
        const end = new Date(params.customEndDate + 'T00:00:00');
        const diffDays = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)); 
        generatedDates = Array.from({ length: diffDays + 1 }, (_, i) => {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            return d;
        });
    } else {
        // Gerador Helper
        const gen = (count: number) => Array.from({ length: count }, (_, i) => {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            return d;
        });

        // Mapeamento de Cenários
        const dMap: any = { 
            unica: gen(1),
            avulsas: [gen(1)[0], gen(3)[2], gen(6)[5], gen(10)[9]], 
            // Para cenários múltiplos, geramos 9 dias (Hoje + 8)
            intervalo: gen(9),
            'diário': gen(9),
            passaporte: gen(9),
            infinitas: gen(45)
        };
        
        // Fallback seguro
        generatedDates = dMap[params.dates] || gen(9);
    }

    // B. Geração de Horários
    const tMap: any = { 
        unico: ["19:00"], 
        alguns: ["10:00", "14:00", "18:00"], 
        varios: [
          "08:00", "08:15", "08:30", "08:45", 
          "09:00", "09:15", "09:30", "09:45", 
          "10:00", "10:15", "10:30", "10:45", 
          "11:00", "11:15", "11:30", "11:45",
          "12:00", "12:15", "12:30", "12:45", 
          "13:00", "13:15", "13:30", "13:45", 
          "14:00", "14:15", "14:30", "14:45", 
          "15:00", "15:15", "15:30", "15:45", 
          "16:00", "16:15", "16:30", "16:45", 
          "17:00", "17:15", "17:30", "17:45",
          "18:00", "18:15", "18:30", "18:45", 
          "19:00", "19:15", "19:30", "19:45", 
          "20:00", "20:15", "20:30", "20:45", 
          "21:00", "21:15", "21:30", "21:45", 
          "22:00"
        ]
    };

    // C. Datas Esgotadas
    const soldOutTimestamps = (params.unavailableDates || []).map((dateStr: string) => {
        return new Date(dateStr + 'T00:00:00').getTime();
    });

    // D. Catálogo de Combos (Mock)
    const mockCombos = [
      { 
        id: 'c1', 
        name: 'Combo Pipoca Grande + Refri', 
        description: 'Pipoca salgada ou doce + Refrigerante 500ml',
        price: 55, 
        category: 'food',
        image: '🍿'
      },
      { 
        id: 'c2', 
        name: 'Balde de Cerveja (5 un.)', 
        description: 'Heineken ou Spaten long neck',
        price: 85, 
        category: 'drink',
        image: '🍺'
      },
      { 
        id: 'c3', 
        name: 'Camiseta Oficial do Evento', 
        description: 'Tamanhos P, M, G e GG (Retirar no local)',
        price: 120, 
        category: 'merch',
        image: '👕'
      }
    ];

    return { 
      dates: generatedDates, 
      availableTimes: tMap[params.times] || tMap['unico'],
      soldOutDates: soldOutTimestamps,
      combos: mockCombos
    };
  }, [params]);

  // --- 3. ESTADOS DA TELA ---
  
  // Seleção Atual
  const [activeDate, setActiveDate] = useState<Date | null>(null);
  const [activeTime, setActiveTime] = useState<string | null>(null);
  
  // Carrinho: Chave única "DiaIndex-Horario-TicketId" -> Quantidade
  const [ticketSelection, setTicketSelection] = useState<Record<string, number>>({});
  
  // Controle de Modais
  const [sheetTime, setSheetTime] = useState<string | null>(null);
  const [removalModal, setRemovalModal] = useState<{ isOpen: boolean; dayIdx: number; time: string }>({ isOpen: false, dayIdx: -1, time: '' });

  // Helper para índice da data (usado para gerar chaves únicas)
  const activeDateIdx = useMemo(() => {
      if (!dates || dates.length === 0 || !activeDate) return -1;
      return dates.findIndex((d: Date) => d.toDateString() === activeDate.toDateString());
  }, [dates, activeDate]);

  // --- 4. EFEITOS E REGRAS ---
  useEffect(() => {
    // Regra: Data Única -> Seleciona auto
    if (params.dates === 'unica' && dates.length > 0) {
       setActiveDate(dates[0]);
    } 
    // Regra: Múltiplas -> Reseta se não tiver ingressos (força empty state do calendário)
    else if (params.dates !== 'unica') {
       const hasAnyTicket = Object.keys(ticketSelection).length > 0;
       
       if (!hasAnyTicket) {
         setActiveDate(null); 
       } else {
         // Valida se a data selecionada ainda é válida com a nova configuração
         const isValid = activeDate && dates.some(d => d.getTime() === activeDate.getTime());
         if (!isValid) setActiveDate(null);
       }
    }
    
    // Regra: Resetar horário ao mudar configuração
    setActiveTime(params.times === 'varios' ? null : availableTimes?.[0] || null);
  }, [params.dates, params.times, dates]); 

  // --- 5. HANDLERS ---
  const handleSelectDate = (date: Date) => {
    setActiveDate(date);
    if (params.times === 'varios') {
        setSheetTime(null);
    } else {
        setActiveTime(availableTimes[0]);
    }
  };

  const handleSelectTime = (time: string) => {
    params.times === 'varios' ? setSheetTime(time) : setActiveTime(time);
  };

  const handleClearTime = (time: string) => {
    const hasTickets = Object.entries(ticketSelection).some(([key, qty]) => key.startsWith(`${activeDateIdx}-${time}-`) && qty > 0);
    if (hasTickets) {
      setRemovalModal({ isOpen: true, dayIdx: activeDateIdx, time });
    }
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
    // Validação simples de limites (mock) pode ser adicionada aqui
    const key = `${dayIdx}-${time}-${ticketId}`;
    setTicketSelection(prev => {
      const currentQty = prev[key] || 0;
      const newQty = Math.max(0, currentQty + delta);
      
      const next = { ...prev, [key]: newQty };
      if (newQty === 0) delete next[key];
      return next;
    });
  };

  // Cálculo de Subtotal (Ingressos + Combos)
  const subtotal = Object.entries(ticketSelection).reduce((acc, [key, qty]) => {
     // Lógica Mock de Preços
     let price = 0;
     if (key.includes('combo-c1')) price = 55;
     else if (key.includes('combo-c2')) price = 85;
     else if (key.includes('combo-c3')) price = 120;
     else if (key.includes('t3')) price = 350; // VIP
     else if (key.includes('t1')) price = 150; // Inteira
     else price = 75; // Meia

     return acc + (qty * price);
  }, 0);


  // --- 6. RENDERIZAÇÃO ---
  return (
    <div className="w-full h-screen bg-white overflow-hidden font-sans relative flex flex-col">
      
      {/* DEVTOOLS FLUTUANTE */}
      <ScenarioControls params={params} setParams={setParams} />

      {/* HEADER FIXO */}
      <Header params={params} setParams={setParams} />

      {/* ÁREA DE SCROLL PRINCIPAL */}
      <main className="flex-1 overflow-y-auto mt-[96px] p-4 w-full">
        
        {/* MAPA */}
          {params.maps !== 'nenhum' && (
          <div className="w-full mb-6 animate-in fade-in zoom-in-95 duration-500">
            {params.maps === 'io' ? (
              // 1. MAPA INTERATIVO (SEATS.IO)
              // Aumentei a altura para h-[500px] para ficar utilizável
              <div className="w-full h-[500px] rounded-md overflow-hidden border border-gray-200 shadow-sm bg-white">
                <iframe 
                  src="https://app.seats.io/preview/eu/c5c2b33f-4aaf-4b96-aa5e-6cdc7aa068c9/141002a5-6408-47a0-8fcd-fa7a93dfe0bd"
                  className="w-full h-full border-none"
                  title="Mapa Interativo"
                  allowFullScreen
                />
              </div>
            ) : (
              // 2. IMAGEM ESTÁTICA
              // Certifique-se de que o arquivo 'maps.png' está na pasta 'public' do projeto
              <div className="w-full rounded-md overflow-hidden border border-gray-200 shadow-sm bg-gray-50">
                 <img 
                   src="/maps.webp" 
                   alt="Mapa do Setor"
                   className="w-full h-auto object-cover block"
                 />
              </div>
            )}
          </div>
        )}

        <div className="mt-0 animate-in fade-in duration-500 pb-0">
          
          {/* SELETOR DE DATAS */}
          <DateSelector 
            variant={params.dates}
            dates={dates}
            passportDates={passportDatesMock}
            selectedDate={activeDate}
            onSelectDate={handleSelectDate}
            onConfirmSelection={(selected) => selected.length > 0 && setActiveDate(selected[0])}
            tickets={ticketSelection}
            soldOutDates={soldOutDates}
          />

          {/* ÁREA DE HORÁRIOS / COMBOS */}
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
                  // Props de Combos
                  combos={combos}
                  showCombos={params.hasCombos}
                  limits={params.limits}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </main>

      {/* --- MODAIS --- */}
      
      {/* Bottom Sheet de Ingressos (para variante "vários horários") */}
      <TicketSelectionSheet 
        isOpen={!!sheetTime}
        time={sheetTime}
        onClose={() => setSheetTime(null)}
        tickets={ticketSelection}
        onUpdateTicket={handleUpdateTicket}
        dayIdx={activeDateIdx}
        combos={combos}
        showCombos={params.hasCombos}
        limits={params.limits}
      />

      {/* Modal de Remoção */}
      <TicketRemovalModal 
        isOpen={removalModal.isOpen} 
        targetName={removalModal.time}
        onClose={() => setRemovalModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmRemoval}
      />

      {/* --- FOOTER (SUBTOTAL) --- */}
      <AnimatePresence>
        {subtotal > 0 && (
          <motion.div 
            initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} 
            className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 flex items-center justify-between z-[100] shadow-[0_-10px_30px_rgba(0,0,0,0.08)]"
          >
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest text-left">Subtotal</span>
              <span className="text-lg font-black text-gray-900 leading-none">
                R$ {subtotal.toFixed(2).replace('.', ',')}
              </span>
            </div>
            <button className="bg-[#ff6101] text-white px-10 py-3 rounded-md font-bold shadow-lg active:scale-95 transition-all">
              Continuar
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}