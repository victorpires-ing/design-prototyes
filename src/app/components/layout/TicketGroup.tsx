import { useState, useMemo } from 'react';
import { ChevronDown, Plus, Minus, Clock, ShoppingBag, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from 'motion/react';

interface TicketGroupProps {
  dayIdx: number;
  time: string;
  tickets: Record<string, number>; // Objeto completo de ingressos selecionados
  onUpdateTicket: (dayIdx: number, time: string, ticketId: string, delta: number) => void;
  hideTimeHeader?: boolean;
  hideBorders?: boolean;
  autoExpandFirst?: boolean;
  allowMultipleExpanded?: boolean;
  
  // Props de Conteúdo
  combos?: any[];
  showCombos?: boolean;

  // --- NOVA PROP: LIMITES ---
  limits?: {
    global?: string | number;
    perDay?: string | number;
    perTime?: string | number;
  };
}

interface Ticket {
  id: string;
  name: string;
  batch: string;
  description?: string;
  price: number;
  image?: string;
}

interface Group {
  id: string;
  name: string;
  accessTag?: string;
  icon?: React.ReactNode;
  items: Ticket[];
}

export default function TicketGroup({ 
  dayIdx, 
  time, 
  tickets, 
  onUpdateTicket, 
  hideTimeHeader = false,
  hideBorders = false,
  autoExpandFirst = false,
  allowMultipleExpanded = false,
  combos = [],
  showCombos = false,
  limits = {} // Default vazio
}: TicketGroupProps) {
  
  // 1. Grupos Estáticos
  const staticGroups: Group[] = [
    {
      id: 'g1',
      name: 'Grupo padrão',
      accessTag: 'tag acesso',
      items: [
        { id: 't1', name: 'Nome primeiro', batch: 'nome lote 1', description: 'Lorem ipsum dolor sit amet.', price: 150 },
        { id: 't2', name: 'Nome segundo', batch: 'nome lote 1', price: 80 }
      ]
    },
    {
      id: 'g2',
      name: 'Camarotes',
      items: [
        { id: 't3', name: 'Camarote Open Bar', batch: 'lote único', description: 'Acesso exclusivo com bebidas.', price: 350 }
      ]
    }
  ];

  // 2. Grupo de Combos
  const allGroups = useMemo(() => {
    const groups = [...staticGroups];
    if (showCombos && combos.length > 0) {
      groups.push({
        id: 'g-combos',
        name: 'Combos & Extras',
        icon: <ShoppingBag size={16} className="text-purple-500" />,
        items: combos.map(c => ({
          id: `combo-${c.id}`,
          name: c.name,
          batch: 'Opcional',
          description: c.description,
          price: c.price,
          image: c.image
        }))
      });
    }
    return groups;
  }, [staticGroups, combos, showCombos]);

  const [expandedGroupIds, setExpandedGroupIds] = useState<string[]>(() => {
    return autoExpandFirst && allGroups.length > 0 ? [allGroups[0].id] : [];
  });

  const toggleGroup = (groupId: string) => {
    setExpandedGroupIds(prevIds => {
      const isExpanded = prevIds.includes(groupId);
      if (allowMultipleExpanded) return isExpanded ? prevIds.filter(id => id !== groupId) : [...prevIds, groupId];
      return isExpanded ? [] : [groupId];
    });
  };

  // ==================================================================================
  // LÓGICA DE LIMITES (Aqui acontece a mágica)
  // ==================================================================================
  
  // Calcula totais atuais baseados no objeto `tickets`
  const { currentGlobal, currentDay, currentTime } = useMemo(() => {
    let global = 0;
    let day = 0;
    let timeTotal = 0;

    Object.entries(tickets).forEach(([key, qty]) => {
      global += qty;
      if (key.startsWith(`${dayIdx}-`)) day += qty;
      if (key.startsWith(`${dayIdx}-${time}-`)) timeTotal += qty;
    });

    return { currentGlobal: global, currentDay: day, currentTime: timeTotal };
  }, [tickets, dayIdx, time]);

  // Converte limites para número (trata string vazia como infinito)
  const maxGlobal = limits.global ? Number(limits.global) : Infinity;
  const maxDay = limits.perDay ? Number(limits.perDay) : Infinity;
  const maxTime = limits.perTime ? Number(limits.perTime) : Infinity;

  // Verifica se o bloqueio está ativo (Adicionar +1 quebraria a regra?)
  const isLocked = currentGlobal >= maxGlobal || currentDay >= maxDay || currentTime >= maxTime;

  // Define qual mensagem exibir (Prioridade: Global > Dia > Horário)
  let lockMessage = '';
  if (currentGlobal >= maxGlobal) lockMessage = 'Limite total atingido';
  else if (currentDay >= maxDay) lockMessage = 'Limite diário atingido';
  else if (currentTime >= maxTime) lockMessage = 'Limite por horário atingido';

  // ==================================================================================

  return (
    <div className="flex flex-col gap-4 mt-0 pl-0">
      
      {!hideTimeHeader && (
        <div className="flex items-center gap-2 bg-gray-100 px-2 py-2 w-29 rounded-full">
          <Clock size={18} color='#585858'/>
          <span className="text-sm font-medium text-gray-700 uppercase tracking-widest">
            Às <span className='text-[#ff6101]'> {time}</span>
          </span>
        </div>
      )}

      {/* AVISO DE LIMITE ATINGIDO (Opcional, mas boa UX) */}
      <AnimatePresence>
        {isLocked && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: 'auto' }} 
            exit={{ opacity: 0, height: 0 }}
            className="bg-red-50 text-red-600 text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-2 border border-red-100"
          >
            <AlertCircle size={14} />
            {lockMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`flex flex-col ${hideBorders ? 'gap-0' : 'gap-4'}`}>

      {allGroups.map((group, index) => {
        const isExpanded = expandedGroupIds.includes(group.id);
        const isLastItem = index === allGroups.length - 1;
        const isComboGroup = group.id === 'g-combos';

        // Soma total do grupo visualmente
        const groupTotal = group.items.reduce((acc, ticket) => {
          return acc + (tickets[`${dayIdx}-${time}-${ticket.id}`] || 0);
        }, 0);

        const containerClasses = hideBorders
          ? `bg-white overflow-hidden transition-all`
          : `border rounded-md bg-white overflow-hidden transition-all ${isExpanded ? 'border-gray-200' : 'border-gray-200'}`;

        const buttonPadding = hideBorders ? 'py-4 px-0' : 'p-4';

        return (
          <div key={group.id} className="flex flex-col">
            <div className={containerClasses}>
              
              {/* HEADER DO GRUPO */}
              <button 
                onClick={() => toggleGroup(group.id)}
                className={`w-full ${buttonPadding} flex items-start justify-between bg-white hover:bg-gray-50 transition-colors rounded-lg cursor-pointer`}
              >
                <div className="flex flex-col items-start gap-1.5">
                  <div className="flex items-center gap-2">
                    {group.icon && <div>{group.icon}</div>}
                    <h3 className={`font-bold text-base leading-none ${isComboGroup ? 'text-purple-700' : 'text-gray-900'}`}>
                        {group.name}
                    </h3>
                    {groupTotal > 0 && (
                      <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className={`text-white text-[12px] font-bold px-2 py-0.5 rounded-full flex items-center justify-center min-w-[20px] ${isComboGroup ? 'bg-purple-600' : 'bg-[#ff6101]'}`}>
                        {groupTotal}
                      </motion.span>
                    )}
                  </div>
                  {group.accessTag && <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md text-[12px] font-medium tracking-wide">{group.accessTag}</span>}
                </div>
                <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }} className="mt-1">
                  <ChevronDown size={20} color={isComboGroup ? '#9333ea' : '#ff6101'}/>
                </motion.div>
              </button>

              {/* LISTA DE ITENS */}
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <div className={`${hideBorders ? '' : 'border-t border-gray-100'}`}>
                      {group.items.map((ticket, idx) => {
                        const qty = tickets[`${dayIdx}-${time}-${ticket.id}`] || 0;
                        const isLastTicket = idx === group.items.length - 1;

                        return (
                          <div key={ticket.id} className={`flex flex-col gap-3 ${hideBorders ? 'py-4 px-0' : 'p-4'} ${!isLastTicket ? 'border-b border-gray-100' : ''}`}>
                            <div className="flex items-start gap-3">
                              {ticket.image && <div className="text-2xl w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center shrink-0">{ticket.image}</div>}
                              <div className="flex flex-col gap-1 w-full">
                                <p className="font-bold text-gray-900 text-[15px]">{ticket.name}</p>
                                <p className={`text-xs font-medium ${isComboGroup ? 'text-purple-500' : 'text-gray-400'}`}>{ticket.batch}</p>
                                {ticket.description && <p className="text-gray-500 text-sm leading-relaxed mt-1">{ticket.description}</p>}
                              </div>
                            </div>

                            <div className="flex items-center justify-between mt-1 pl-0">
                              <span className="font-bold text-sm text-gray-900">{ticket.price === 0 ? 'Grátis' : `R$ ${ticket.price.toFixed(2).replace('.', ',')}`}</span>

                              <div className="flex items-center gap-3">
                                {/* Botão Menos: Só desabilita se qty for 0 */}
                                <button 
                                  onClick={() => onUpdateTicket(dayIdx, time, ticket.id, -1)}
                                  className={`w-10 h-10 flex items-center justify-center transition-all active:scale-90 ${qty > 0 ? 'text-gray-400 hover:text-[#ff6101] cursor-pointer' : 'opacity-0 pointer-events-none'}`}
                                  disabled={qty === 0}
                                >
                                  <Minus size={18} />
                                </button>
                                
                                <span className={`text-sm font-bold w-4 text-center ${qty > 0 ? 'text-gray-900' : 'text-gray-300'}`}>{qty}</span>
                                
                                {/* Botão Mais: Desabilita se isLocked for true */}
                                <button 
                                  onClick={() => onUpdateTicket(dayIdx, time, ticket.id, 1)}
                                  // BLOQUEIO AQUI:
                                  disabled={isLocked}
                                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-white active:scale-95 transition-transform transition-colors
                                    ${isComboGroup ? 'bg-purple-600' : 'bg-[#ff6101]'}
                                    ${isLocked ? 'opacity-50 cursor-not-allowed bg-gray-300' : 'hover:brightness-110 cursor-pointer'}
                                  `}
                                >
                                  <Plus size={18} />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {hideBorders && !isLastItem && <hr className="border-gray-200" />}
          </div>
        );
      })}
      </div>
    </div>
  );
}