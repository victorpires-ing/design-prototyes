import React, { useState } from 'react';
import { 
  Settings, X, Calendar, AlertCircle, Map, 
  Ticket, ShieldAlert, ShoppingBag, Plus, Minus, BookOpen
} from "lucide-react";
import { motion, AnimatePresence } from 'motion/react';

export const ScenarioControls = ({ params, setParams }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Opções de Variantes (Layout)
  const variants = {
    dates: ['unica', 'dia', 'diário', 'minicombo', 'intervalo', 'mix'],
    times: ['unico', 'alguns', 'varios'],
    maps: ['nenhum', 'imagem', 'io']
  };

  // Helper para gerar datas
  const generateDateRange = () => {
    if (!params.customStartDate) return [];
    const start = new Date(params.customStartDate + 'T00:00:00'); 
    const daysToShow = 20; 
    const dates = [];
    let end = params.customEndDate ? new Date(params.customEndDate + 'T00:00:00') : null;
    
    for (let i = 0; i < 60; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      if (end && d > end) break;
      if (!end && i >= daysToShow) break;
      dates.push(d);
    }
    return dates;
  };

  const toggleUnavailableDate = (dateStr: string) => {
    const current = params.unavailableDates || [];
    const updated = current.includes(dateStr)
      ? current.filter((d: string) => d !== dateStr)
      : [...current, dateStr];
    setParams({ ...params, unavailableDates: updated });
  };

  const generatedDates = generateDateRange();

  return (
    <>
      {/* 1. BOTÃO FLUTUANTE */}
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed top-2 right-4 z-[9999] bg-gray-900 text-white p-3 rounded-full shadow-xl hover:bg-[#ff6101] transition-all hover:scale-110 group"
        title="Configurar Cenário"
      >
        <Settings size={20} className="group-hover:rotate-90 transition-transform duration-500" />
      </button>

      {/* 2. PAINEL LATERAL */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/40 z-[9999] backdrop-blur-[2px]"
            />

            <motion.div 
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-white z-[10000] shadow-2xl overflow-y-auto border-l border-gray-100"
            >
              <div className="p-5 flex flex-col gap-6 min-h-screen pb-20">
                
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <div className="flex flex-col">
                    <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                      <Settings size={18} className="text-[#ff6101]" />
                      Configurações
                    </h2>
                    <p className="text-xs text-gray-400">Simule cenários de venda</p>
                  </div>
                  <button onClick={() => setIsOpen(false)} className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                    <X size={18} />
                  </button>
                </div>

                {/* --- GRUPO 1: REGRAS DE NEGÓCIO (LIMITES) --- */}
                <div className="space-y-3 p-4 bg-orange-50/50 rounded-md border border-orange-100">
                  <h3 className="text-[10px] font-black text-orange-400 uppercase tracking-widest flex items-center gap-1.5">
                    <ShieldAlert size={12} /> Limites de Compra
                  </h3>
                  
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-gray-700">Máx. Global (Evento)</label>
                      <input 
                        type="number" 
                        placeholder="∞"
                        value={params.limits?.global || ''}
                        onChange={(e) => setParams({ ...params, limits: { ...params.limits, global: e.target.value } })}
                        className="w-16 p-1.5 bg-white border border-gray-200 rounded-lg text-center text-sm font-bold focus:border-[#ff6101] outline-none"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-gray-700">Máx. Por Dia</label>
                      <input 
                        type="number" 
                        placeholder="∞"
                        value={params.limits?.perDay || ''}
                        onChange={(e) => setParams({ ...params, limits: { ...params.limits, perDay: e.target.value } })}
                        className="w-16 p-1.5 bg-white border border-gray-200 rounded-lg text-center text-sm font-bold focus:border-[#ff6101] outline-none"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-gray-700">Máx. Por Horário</label>
                      <input 
                        type="number" 
                        placeholder="∞"
                        value={params.limits?.perTime || ''}
                        onChange={(e) => setParams({ ...params, limits: { ...params.limits, perTime: e.target.value } })}
                        className="w-16 p-1.5 bg-white border border-gray-200 rounded-lg text-center text-sm font-bold focus:border-[#ff6101] outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* --- GRUPO 2: TIPO DE CONTEÚDO (CATÁLOGO) --- */}
                <div className="space-y-3">
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                    <ShoppingBag size={12} /> Catálogo
                  </h3>
                  
                  {/* TOGGLE COMBOS */}
                  <label className="flex items-center justify-between p-3 border border-gray-200 rounded-md cursor-pointer hover:border-gray-300 transition-all bg-white shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${params.hasCombos ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-400'}`}>
                        <Ticket size={16} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900">Ativar Combos/Extras</span>
                        <span className="text-[10px] text-gray-500">Vender roupas, bebidas e kits</span>
                      </div>
                    </div>
                    <div className={`w-10 h-5 rounded-full relative transition-colors ${params.hasCombos ? 'bg-[#ff6101]' : 'bg-gray-200'}`}>
                      <input 
                        type="checkbox" 
                        className="hidden" 
                        checked={!!params.hasCombos} 
                        onChange={(e) => setParams({ ...params, hasCombos: e.target.checked })}
                      />
                      <div className={`absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm transition-all ${params.hasCombos ? 'left-6' : 'left-1'}`} />
                    </div>
                  </label>

                  {/* TOGGLE PASSAPORTE (NOVO) */}
                  <label className="flex items-center justify-between p-3 border border-gray-200 rounded-md cursor-pointer hover:border-gray-300 transition-all bg-white shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${params.hasPassport ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                        <BookOpen size={16} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900">Ativar Passaporte</span>
                        <span className="text-[10px] text-gray-500">Ingresso único para múltiplas datas</span>
                      </div>
                    </div>
                    <div className={`w-10 h-5 rounded-full relative transition-colors ${params.hasPassport ? 'bg-blue-600' : 'bg-gray-200'}`}>
                      <input 
                        type="checkbox" 
                        className="hidden" 
                        checked={!!params.hasPassport} 
                        onChange={(e) => setParams({ ...params, hasPassport: e.target.checked })}
                      />
                      <div className={`absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm transition-all ${params.hasPassport ? 'left-6' : 'left-1'}`} />
                    </div>
                  </label>
                </div>

                <hr className="border-gray-100" />

                {/* --- GRUPO 3: LAYOUT --- */}
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Layout & Navegação</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(variants).map(([key, values]) => (
                      <div key={key} className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-500 capitalize flex items-center gap-1">
                           {key === 'maps' && <Map size={10}/>} {key}
                        </label>
                        <select 
                          value={params[key]} 
                          onChange={(e) => setParams({ ...params, [key]: e.target.value })}
                          className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 focus:border-[#ff6101] outline-none"
                        >
                          {values.map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>

                {/* --- GRUPO 4: DATAS E INDISPONIBILIDADE --- */}
                <div className="space-y-4 flex-1">
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Calendar size={12} /> Calendário & Bloqueios
                  </h3>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500">Início</label>
                      <input 
                        type="date" 
                        value={params.customStartDate}
                        onChange={(e) => setParams({ ...params, customStartDate: e.target.value })}
                        className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500">Fim</label>
                      <input 
                        type="date" 
                        value={params.customEndDate}
                        onChange={(e) => setParams({ ...params, customEndDate: e.target.value })}
                        className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono"
                        placeholder="Opcional"
                      />
                    </div>
                  </div>
                  
                  {generatedDates.length > 0 ? (
                    <div className="space-y-2">
                        <p className="text-[10px] text-gray-400 font-medium">Toque para marcar como <span className="text-red-500">Esgotado</span>:</p>
                        <div className="grid grid-cols-5 gap-1.5">
                            {generatedDates.map((date) => {
                            const dateStr = date.toISOString().split('T')[0];
                            const isUnavailable = (params.unavailableDates || []).includes(dateStr);

                            return (
                                <button
                                key={dateStr}
                                onClick={() => toggleUnavailableDate(dateStr)}
                                className={`
                                    flex flex-col items-center justify-center py-2 rounded-md border transition-all active:scale-95
                                    ${isUnavailable 
                                    ? 'bg-red-50 border-red-200 text-red-500' 
                                    : 'bg-white border-gray-100 text-gray-600 hover:border-gray-300'
                                    }
                                `}
                                >
                                <span className="text-[8px] font-bold uppercase opacity-70">
                                    {date.toLocaleDateString('pt-BR', { weekday: 'short' }).slice(0, 3)}
                                </span>
                                <span className="text-xs font-black">
                                    {date.getDate()}
                                </span>
                                </button>
                            );
                            })}
                        </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-gray-50 rounded-lg text-center text-xs text-gray-400">
                        Defina uma data de início.
                    </div>
                  )}
                </div>

                {/* Footer Reset */}
                <div className="pt-4 border-t border-gray-100 text-center">
                  <button 
                    onClick={() => setParams({ 
                      dates: 'unica', 
                      times: 'varios', 
                      maps: 'nenhum',
                      customStartDate: new Date().toISOString().split('T')[0],
                      customEndDate: '',
                      unavailableDates: [],
                      limits: { global: '', perDay: '', perTime: '' },
                      hasCombos: false,
                      hasPassport: false // Resetando novo campo
                    })}
                    className="text-xs font-bold text-gray-400 underline hover:text-[#ff6101]"
                  >
                    Restaurar Padrão
                  </button>
                </div>

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};