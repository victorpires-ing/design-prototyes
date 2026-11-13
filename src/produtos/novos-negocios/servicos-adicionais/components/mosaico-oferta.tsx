import fotoAmigos from "../assets/foto-amigos.jpg";
import fotoCarnaval from "../assets/foto-carnaval.jpg";
import fotoDanca from "../assets/foto-danca.jpg";
import fotoPalco from "../assets/hero-evento.jpg";

/**
 * Lado direito da oferta no desktop: mosaico de fotos com clima de rolê, cada uma no
 * espaço que combina com o formato dela.
 *
 * Grade 2 colunas × 6 linhas:
 *   [ palco ][ amigos  ]   ← amigos é horizontal
 *   [ palco ][ carnaval ]
 *   [ dança ][ carnaval ]
 *   [ dança ][ carnaval ]
 */
export function MosaicoOferta() {
    return (
        <div aria-hidden="true" className="grid aspect-[4/5] grid-cols-2 grid-rows-6 gap-3">
            <Foto src={fotoPalco} className="col-start-1 row-span-3 row-start-1" />
            <Foto src={fotoAmigos} className="col-start-2 row-span-2 row-start-1 object-[center_35%]" />
            <Foto src={fotoCarnaval} className="col-start-2 row-span-4 row-start-3 object-[center_30%]" />
            <Foto src={fotoDanca} className="col-start-1 row-span-3 row-start-4" />
        </div>
    );
}

const Foto = ({ src, className }: { src: string; className: string }) => (
    <img src={src} alt="" className={`size-full min-h-0 rounded-3xl object-cover ${className}`} />
);
