import { ChevronDown, EllipsisVertical } from "lucide-react";
import { ScenarioControls } from '../ui/ScenarioControls';


function UserContent() {
  return (
    <div className="flex flex-1 items-center justify-end gap-4" data-name="content">
      <div className="flex items-center gap-1 shrink-0" data-name="User">
        <p className="font-['Switzer_Variable',sans-serif] font-medium text-[12px] leading-4 text-[#f8f8f8] tracking-[0.24px]">
          Luciana Santos
        </p>
        <ChevronDown color='#fff' size={16} />
      </div>
      <img src='/Brazil flag.svg' alt="BR" className="w-5 h-5" />
    </div>
  );
}

function Brand() {
  return (
    <div className="h-[48px] relative w-full shrink-0" data-name="brand">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <img alt="" className="absolute w-full h-[330%] left-0 top-0 object-cover" src="/event-cover.png" />
        <div 
          className="absolute backdrop-blur-[32px] inset-0" 
          data-name="gradient-blur" 
          style={{ backgroundImage: "linear-gradient(180deg, rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0.59) 100%)" }} 
        />
      </div>
      <div className="relative z-10 flex items-center h-full px-5">
        <img src="/logo-ingresse.svg" alt="Logo Ingresse" className='h-5' />
        <UserContent />
      </div>
    </div>
  );
}

function Tile() {
  return (
    <div className="bg-white py-3 px-4 flex items-center justify-between w-full border-b border-gray-100 shrink-0" data-name="tile">
      <p className="min-w-0 flex-1 truncate font-bold text-[#181818] text-[15px]">
        Bahia x EC Vitória - Campeonato Baiano 2026
      </p>
      <EllipsisVertical size={20} className="shrink-0 ml-2 text-gray-400" />
    </div>
  );
}

// --- HEADER UNIFICADO ---
export default function Header({ params, setParams }: any) {
  return (
    <header className="fixed top-0 left-0 w-full flex flex-col shadow-sm z-[50]" data-name="header">
      <ScenarioControls params={params} setParams={setParams} />
      <Brand />
      <Tile />
    </header>
  );
}