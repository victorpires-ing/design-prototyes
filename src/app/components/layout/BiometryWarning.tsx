import {ScanFace} from 'lucide-react'

export default function BiometryWarning() {
    return(
        <div className="bg-[#f9f5ef] content-stretch flex gap-[12px] items-center justify-center p-[12px] relative rounded-[16px] shrink-0 w-full">
            <ScanFace color="#ff6101"/>
            <div className="content-stretch flex flex-[1_0_0] items-center min-h-px min-w-px overflow-clip relative">
                <p className="css-4hzbpn flex-[1_0_0] font-['Switzer_Variable:Regular',sans-serif] font-normal leading-[16px] min-h-px min-w-px relative text-[#181818] text-[12px] tracking-[0.24px]">Evento com acesso por biometria facial obrigatória</p>
            </div>
            <button className="content-stretch flex gap-[8px] items-center justify-center overflow-clip p-[8px] relative rounded-[8px] shrink-0 hover:bg-[#efe5df] transition-colors">
                <p className="css-ew64yg font-['Switzer_Variable:Medium',sans-serif] font-medium leading-[16px] relative shrink-0 text-[#ff6101] text-[12px] tracking-[0.24px]">Cadastrar</p>
            </button>
        </div>
    )
}