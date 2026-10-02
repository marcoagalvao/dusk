import { describe, expect, it } from "vitest";

import { createEmptyAppData } from "@/domain/app-data";
import { buildTask } from "@/domain/task-rules";

import { backupFileName, createBackup, parseBackup, serializeBackup } from "./index";

describe("backup", () => {
  it("nome do arquivo segue dusk-backup-YYYY-MM-DD-HHmm.json", () => {
    expect(backupFileName(new Date(2026, 9, 2, 18, 40))).toBe("dusk-backup-2026-10-02-1840.json");
  });

  it("exporta e reimporta mantendo os dados", () => {
    const data = createEmptyAppData();
    data.tasks.push(buildTask({ title: "Enviar proposta" }, "2026-10-02T12:00:00.000Z"));
    const backup = createBackup(data, new Date("2026-10-02T21:40:00.000Z"));

    expect(backup).toMatchObject({ app: "dusk", schemaVersion: 1, exportedAt: "2026-10-02T21:40:00.000Z" });

    const result = parseBackup(serializeBackup(backup));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.summary).toEqual({ taskCount: 1, projectCount: 0, exportedAt: "2026-10-02T21:40:00.000Z" });
    expect(result.data.tasks[0].title).toBe("Enviar proposta");
  });

  it("rejeita JSON inválido", () => {
    expect(parseBackup("{oops")).toEqual({ ok: false, error: "O arquivo não é um JSON válido." });
  });

  it("rejeita backup de outro app", () => {
    const result = parseBackup(JSON.stringify({ app: "todoist", schemaVersion: 1, tasks: [], projects: [] }));
    expect(result).toEqual({ ok: false, error: "Este arquivo não é um backup do Dusk." });
  });

  it("rejeita backup sem versão, incompleto ou de versão futura", () => {
    expect(parseBackup(JSON.stringify({ app: "dusk", tasks: [], projects: [] })).ok).toBe(false);
    expect(parseBackup(JSON.stringify({ app: "dusk", schemaVersion: 1, tasks: [] })).ok).toBe(false);
    const newer = parseBackup(JSON.stringify({ app: "dusk", schemaVersion: 7, tasks: [], projects: [] }));
    expect(newer).toEqual({ ok: false, error: "Este backup foi criado por uma versão mais nova do Dusk." });
  });
});
