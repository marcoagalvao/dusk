type ClassValue = string | false | null | undefined;

/**
 * Junta classes condicionais. Não resolve conflitos entre utilitários: o
 * `className` recebido por componentes base deve só acrescentar (posição,
 * margem, largura), nunca sobrescrever display, cor ou tamanho da base.
 * Para variar estados, use variantes (`aria-pressed:`, `data-[state=...]:`).
 */
export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(" ");
}
