"use client";

import { useSyncExternalStore } from "react";

import { todayKey } from "@/lib/dates";

const TICK_MS = 30_000;

/** Reavalia periodicamente e quando a aba volta ao foco (ex.: app aberto de um dia para o outro). */
function subscribe(onChange: () => void): () => void {
  const interval = setInterval(onChange, TICK_MS);
  document.addEventListener("visibilitychange", onChange);
  window.addEventListener("focus", onChange);
  return () => {
    clearInterval(interval);
    document.removeEventListener("visibilitychange", onChange);
    window.removeEventListener("focus", onChange);
  };
}

const getMinute = () => Math.floor(Date.now() / 60_000);

/**
 * Data local atual (`YYYY-MM-DD`). Muda sozinha à meia-noite, o que faz o foco
 * de hoje expirar sem alterar dados. Use no nível da página e passe adiante.
 */
export function useToday(): string {
  return useSyncExternalStore(subscribe, todayKey, todayKey);
}

/** Instante atual com resolução de minuto, para saudação e linha do dia. */
export function useNow(): Date {
  const minute = useSyncExternalStore(subscribe, getMinute, getMinute);
  return new Date(minute * 60_000);
}
