import { addDays, differenceInCalendarDays, format, isValid, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Datas civis (prazo, revisão, foco) são strings `YYYY-MM-DD` interpretadas no
 * fuso local. Timestamps são ISO 8601 completos. Nunca converta uma data civil
 * com `new Date("YYYY-MM-DD")`: isso a interpreta como UTC e pode mudar o dia.
 */
export type DateKey = string;

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function nowIso(): string {
  return new Date().toISOString();
}

export function toDateKey(date: Date): DateKey {
  return format(date, "yyyy-MM-dd");
}

export function todayKey(now: Date = new Date()): DateKey {
  return toDateKey(now);
}

export function parseDateKey(key: DateKey): Date {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function isValidDateKey(value: unknown): value is DateKey {
  if (typeof value !== "string" || !DATE_KEY_PATTERN.test(value)) return false;
  const date = parseDateKey(value);
  return isValid(date) && toDateKey(date) === value;
}

export function isValidIsoTimestamp(value: unknown): value is string {
  return typeof value === "string" && value.length >= 10 && !Number.isNaN(Date.parse(value));
}

export function addDaysToKey(key: DateKey, days: number): DateKey {
  return toDateKey(addDays(parseDateKey(key), days));
}

/** Diferença em dias civis: positivo quando `a` é depois de `b`. */
export function diffInDays(a: DateKey, b: DateKey): number {
  return differenceInCalendarDays(parseDateKey(a), parseDateKey(b));
}

/** Próxima ocorrência do dia da semana (0 = domingo), sempre no futuro. */
export function nextWeekdayKey(today: DateKey, weekday: number): DateKey {
  const current = parseDateKey(today).getDay();
  const delta = (weekday - current + 7) % 7 || 7;
  return addDaysToKey(today, delta);
}

export function startOfWeekKey(today: DateKey): DateKey {
  return toDateKey(startOfWeek(parseDateKey(today), { weekStartsOn: 1 }));
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** `05/10`, ou `05/10/2027` quando o ano difere do atual. */
export function formatShortDate(key: DateKey, today: DateKey = todayKey()): string {
  const date = parseDateKey(key);
  const sameYear = key.slice(0, 4) === today.slice(0, 4);
  return format(date, sameYear ? "dd/MM" : "dd/MM/yyyy");
}

export function formatFullDate(key: DateKey): string {
  return format(parseDateKey(key), "dd/MM/yyyy");
}

/** `Hoje`, `Amanhã`, `Ontem`, dia da semana para os próximos 6 dias, ou data curta. */
export function formatRelativeDay(key: DateKey, today: DateKey = todayKey()): string {
  const delta = diffInDays(key, today);
  if (delta === 0) return "Hoje";
  if (delta === 1) return "Amanhã";
  if (delta === -1) return "Ontem";
  if (delta > 1 && delta < 7) {
    return capitalize(format(parseDateKey(key), "EEEE", { locale: ptBR }).replace("-feira", ""));
  }
  return formatShortDate(key, today);
}

/** `Seg`, `Ter`… */
export function formatWeekdayShort(key: DateKey): string {
  return capitalize(format(parseDateKey(key), "EEE", { locale: ptBR }));
}

/** `Quinta-feira, 2 de outubro` */
export function formatLongDate(date: Date): string {
  return capitalize(format(date, "EEEE, d 'de' MMMM", { locale: ptBR }));
}

/** `02 OUT · 15:40` */
export function formatTimelineStamp(iso: string): string {
  return format(new Date(iso), "dd MMM · HH:mm", { locale: ptBR }).toUpperCase();
}

/** `02/10/2026 às 18:40` */
export function formatDateTime(iso: string): string {
  return format(new Date(iso), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
}

export function greetingFor(date: Date): string {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return "Bom dia";
  if (hour >= 12 && hour < 18) return "Boa tarde";
  return "Boa noite";
}
