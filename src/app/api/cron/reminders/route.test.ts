import { afterEach, describe, expect, it, vi } from "vitest";

import { GET } from "./route";

const request = (authorization?: string) =>
  new Request("http://localhost/api/cron/reminders", { headers: authorization ? { authorization } : {} });

afterEach(() => vi.unstubAllEnvs());

describe("rota do resumo diário", () => {
  it("recusa quem não tem o segredo", async () => {
    vi.stubEnv("CRON_SECRET", "segredo");
    expect((await GET(request())).status).toBe(401);
    expect((await GET(request("Bearer errado"))).status).toBe(401);
  });

  it("sem segredo configurado, não aceita ninguém", async () => {
    vi.stubEnv("CRON_SECRET", "");
    expect((await GET(request("Bearer "))).status).toBe(401);
  });

  it("com o segredo e sem as chaves, responde que não está configurada", async () => {
    vi.stubEnv("CRON_SECRET", "segredo");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    expect((await GET(request("Bearer segredo"))).status).toBe(503);
  });
});
