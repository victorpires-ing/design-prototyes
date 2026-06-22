import { cx } from "@/utils/cx";

/**
 * Preenchimento da "foto" do evento. Como as ferramentas HTML→Figma não exportam
 * degradês (CSS, SVG ou data-URI saem em branco), usamos COR SÓLIDA (a primeira
 * cor do degradê), que é exportada como os demais fundos sólidos. O fallback
 * `bg-secondary` garante um bloco visível mesmo se o estilo inline for ignorado.
 */
export function GradientFill({ gradient, className = "size-full" }: { gradient: string; className?: string }) {
    const cor = gradient.match(/#[0-9a-fA-F]{3,8}/)?.[0] ?? "#9ca3af";
    return <div className={cx("bg-secondary", className)} style={{ backgroundColor: cor }} aria-hidden="true" />;
}
