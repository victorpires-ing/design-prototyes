import Flag from '../../../assets/Brazil flag.svg';
import Logo from '../../../assets/logo-ingresse.svg';
import Cover from '../../../assets/event-cover.png';
import { MapPin, ChevronDown } from 'lucide-react';


export default function Header() {

  return (
    <header className=" top-0 left-0 right-0 z-[1] flex flex-col items-center w-full bg-white border-b border-gray-200">
      {/* Barra superior preta */}
      <div className="w-full bg-black  py-3 flex justify-center">
        <div className="w-full max-w-[1440px] px-4 flex justify-between items-center text-white">
          <img src={Logo} className="h-6" alt="Logo Ingresse" />
          <div className="flex items-center gap-2 font-medium text-sm">
            <img src={Flag} alt="Brasil" />
            PT-BR
            <ChevronDown size={16} />
          </div>
        </div>
      </div>

      {/* Info do Evento */}
      <div className="w-full max-w-[1440px] text-gray-900 px-4 py-3 flex items-center">
          <img src={Cover} className="h-22 w-18 rounded-md object-cover" alt="Capa do evento" />

        <div className="flex flex-col pl-4 gap-1">
          <h1 className="font-bold text-lg leading-tight text-gray-900">
            Pagode da Vitória Carnaval 2026
          </h1>
          
            <div className="flex items-center text-gray-500">
              <MapPin size={14} className="mr-1 text-red-500" />
              <p className="text-sm">Mogi das Cruzes, SP</p>
            </div>
            
            <button className="mt-0 w-fit mt-1 px-3 py-1 border border-gray-200 rounded-full text-[10px] font-bold uppercase tracking-wider text-gray-600 hover:bg-gray-50 transition-colors">
              Ativar código
            </button>
        </div>
      </div>
    </header>
  );
}