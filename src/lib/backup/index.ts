import { format } from "date-fns";

import { SCHEMA_VERSION, type AppData } from "@/domain/app-data";
import { BACKUP_APP_ID, type BackupSummary, type DuskBackup } from "@/domain/backup";
import { isValidIsoTimestamp } from "@/lib/dates";
import { isRecord } from "@/lib/persistence/migrations";
import { parsePersistedState } from "@/lib/persistence/schema";

/** Limite defensivo: um backup real do Dusk fica muito abaixo disso. */
export const MAX_BACKUP_BYTES = 10 * 1024 * 1024;

export function createBackup(data: AppData, now: Date = new Date()): DuskBackup {
  return {
    app: BACKUP_APP_ID,
    schemaVersion: SCHEMA_VERSION,
    exportedAt: now.toISOString(),
    tasks: data.tasks,
    projects: data.projects,
    settings: data.settings,
  };
}

/** `dusk-backup-YYYY-MM-DD-HHmm.json` */
export function backupFileName(now: Date = new Date()): string {
  return `dusk-backup-${format(now, "yyyy-MM-dd-HHmm")}.json`;
}

export function serializeBackup(backup: DuskBackup): string {
  return `${JSON.stringify(backup, null, 2)}\n`;
}

export type BackupParseResult =
  | { ok: true; data: AppData; summary: BackupSummary; droppedItems: number }
  | { ok: false; error: string };

const fail = (error: string): BackupParseResult => ({ ok: false, error });

export function parseBackup(text: string): BackupParseResult {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return fail("O arquivo não é um JSON válido.");
  }

  if (!isRecord(json) || json.app !== BACKUP_APP_ID) {
    return fail("Este arquivo não é um backup do Dusk.");
  }
  if (typeof json.schemaVersion !== "number") {
    return fail("O backup não informa a versão do formato.");
  }
  if (!Array.isArray(json.tasks) || !Array.isArray(json.projects)) {
    return fail("O backup está incompleto: faltam as listas de tarefas ou projetos.");
  }

  const result = parsePersistedState({
    schemaVersion: json.schemaVersion,
    tasks: json.tasks,
    projects: json.projects,
    settings: json.settings,
  });

  if (!result.ok) {
    return fail(
      result.reason === "newer"
        ? "Este backup foi criado por uma versão mais nova do Dusk."
        : "A estrutura do backup é inválida.",
    );
  }

  const { tasks, projects, settings } = result.state;
  const data: AppData = { tasks, projects, settings };
  return {
    ok: true,
    data,
    droppedItems: result.droppedItems,
    summary: {
      taskCount: data.tasks.length,
      projectCount: data.projects.length,
      exportedAt: isValidIsoTimestamp(json.exportedAt) ? json.exportedAt : "",
    },
  };
}
