// components/ui/TimeSelector.tsx
import { motion } from 'motion/react';
import { Clock, PlusIcon, Check, X } from "lucide-react";

export const TimeSelector = ({ times, activeTimes, onToggle, onOpenModal }: any) => (
  <div className="flex flex-wrap gap-2 py-1">
    {times.slice(0, 3).map((time: string, idx: number) => (
      <motion.button
        key={time}
        initial={{ scale: 0.3 }}
        animate={{ scale: 1 }}
        transition={{ delay: idx * 0.05, duration: 0.3, ease: "circOut"}}
        onClick={() => onToggle(time)}
        className={`px-5 py-2 rounded-full text-xs font-bold border transition-all flex items-center gap-2
          ${activeTimes.includes(time) 
            ? 'bg-black text-white border-black shadow-md' 
            : 'bg-white border border-dashed border-gray-200 text-gray-500'}`}
      >
        {time}

        {activeTimes.includes(time) ? <X size={16} /> : <PlusIcon size={16}/>}
      </motion.button>
    ))}
    {times.length > 3 && (
      <button 
        onClick={onOpenModal}
        className="px-4 py-2 rounded-full text-xs font-bold border border-dashed border-gray-300 text-gray-400 flex items-center gap-2 hover:bg-gray-50"
      >
        <Clock size={14} /> Outros
      </button>
    )}
  </div>
);
