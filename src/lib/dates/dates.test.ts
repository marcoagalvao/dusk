import { describe, expect, it } from "vitest";

import {
  addDaysToKey,
  formatLongDate,
  formatRelativeDay,
  formatShortDate,
  formatTimelineStamp,
  greetingFor,
  isValidDateKey,
  nextWeekdayKey,
  parseDateKey,
  startOfWeekKey,
  toDateKey,
} from "./index";

describe("datas civis", () => {
  it("parse e format preservam o dia local", () => {
    expect(toDateKey(parseDateKey("2026-10-02"))).toBe("2026-10-02");
    expect(parseDateKey("2026-10-02").getDate()).toBe(2);
  });

  it("valida YYYY-MM-DD reais", () => {
    expect(isValidDateKey("2026-02-28")).toBe(true);
    expect(isValidDateKey("2026-02-30")).toBe(false);
    expect(isValidDateKey("02/10/2026")).toBe(false);
    expect(isValidDateKey(20261002)).toBe(false);
  });

  it("soma dias atravessando mês", () => {
    expect(addDaysToKey("2026-09-30", 2)).toBe("2026-10-02");
  });

  it("próxima segunda-feira é sempre futura", () => {
    expect(nextWeekdayKey("2026-10-02", 1)).toBe("2026-10-05");
    expect(nextWeekdayKey("2026-10-05", 1)).toBe("2026-10-12");
  });

  it("semana começa na segunda", () => {
    expect(startOfWeekKey("2026-10-02")).toBe("2026-09-28");
  });
});

describe("formatação pt-BR", () => {
  it("datas relativas", () => {
    expect(formatRelativeDay("2026-10-02", "2026-10-02")).toBe("Hoje");
    expect(formatRelativeDay("2026-10-03", "2026-10-02")).toBe("Amanhã");
    expect(formatRelativeDay("2026-10-01", "2026-10-02")).toBe("Ontem");
    expect(formatRelativeDay("2026-10-05", "2026-10-02")).toBe("Segunda");
    expect(formatRelativeDay("2026-10-20", "2026-10-02")).toBe("20/10");
    expect(formatShortDate("2027-01-05", "2026-10-02")).toBe("05/01/2027");
  });

  it("data longa e carimbo da timeline", () => {
    expect(formatLongDate(new Date(2026, 9, 2))).toBe("Sexta-feira, 2 de outubro");
    expect(formatTimelineStamp(new Date(2026, 9, 2, 15, 40).toISOString())).toBe("02 OUT · 15:40");
  });

  it("saudação por horário", () => {
    expect(greetingFor(new Date(2026, 9, 2, 9))).toBe("Bom dia");
    expect(greetingFor(new Date(2026, 9, 2, 15))).toBe("Boa tarde");
    expect(greetingFor(new Date(2026, 9, 2, 22))).toBe("Boa noite");
  });
});
