import { describe, expect, it, vi } from "vitest";

import { sendDailyDigests, type DigestDeps, type PushSubscriptionRow } from "./send-digests";

const subscription = (endpoint: string, overrides: Partial<PushSubscriptionRow> = {}): PushSubscriptionRow => ({
  user_id: "u1",
  endpoint,
  p256dh: "p",
  auth: "a",
  time_zone: "America/Sao_Paulo",
  ...overrides,
});

const deps = (overrides: Partial<DigestDeps>): DigestDeps => ({
  listSubscriptions: async () => [subscription("e1")],
  listTasks: async () => [{ status: "todo", dueDate: "2026-11-02" }],
  send: async () => undefined,
  removeSubscription: async () => undefined,
  ...overrides,
});

// 02:00 UTC do dia 3 ainda é dia 2 em São Paulo.
const NOW = new Date("2026-11-03T02:00:00Z");

describe("resumo diário", () => {
  it("usa o dia do fuso do aparelho", async () => {
    const send = vi.fn(async () => undefined);
    const result = await sendDailyDigests(deps({ send }), NOW);

    expect(result.sent).toBe(1);
    expect(send.mock.calls[0]).toContainEqual(expect.stringContaining("com prazo hoje"));
  });

  it("sem nada para o dia, não envia", async () => {
    const send = vi.fn(async () => undefined);
    const result = await sendDailyDigests(deps({ send, listTasks: async () => [] }), NOW);

    expect(send).not.toHaveBeenCalled();
    expect(result.skipped).toBe(1);
  });

  it("remove a assinatura que deixou de existir", async () => {
    const removeSubscription = vi.fn(async () => undefined);
    const send = async () => {
      throw Object.assign(new Error("gone"), { statusCode: 410 });
    };
    const result = await sendDailyDigests(deps({ send, removeSubscription }), NOW);

    expect(removeSubscription).toHaveBeenCalledOnce();
    expect(result.removed).toBe(1);
  });

  it("uma falha não impede os outros aparelhos", async () => {
    const send = vi.fn(async (target: PushSubscriptionRow) => {
      if (target.endpoint === "e1") throw new Error("rede");
    });
    const result = await sendDailyDigests(
      deps({ listSubscriptions: async () => [subscription("e1"), subscription("e2")], send }),
      NOW,
    );

    expect(result).toEqual({ sent: 1, skipped: 0, removed: 0, failed: 1 });
  });

  it("fuso desconhecido não interrompe o envio", async () => {
    const result = await sendDailyDigests(deps({ listSubscriptions: async () => [subscription("e1", { time_zone: "Marte/Olimpo" })], listTasks: async () => [{ status: "todo", dueDate: "2026-11-03" }] }), NOW);
    expect(result.sent).toBe(1);
  });
});
