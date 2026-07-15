import documentoImg from "./assets/documento-identificacao.png";

/** Conteúdo do anexo "Documento de identificação": imagem do documento enviado. */
export function DocumentoIdentificacaoView() {
    return (
        <img
            src={documentoImg}
            alt="Documento de identificação"
            className="mx-auto h-auto w-full max-w-[720px] rounded-lg object-contain shadow-lg"
        />
    );
}
