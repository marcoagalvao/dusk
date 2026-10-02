import { SCHEMA_VERSION } from "@/domain/app-data";

export type UnknownRecord = Record<string, unknown>;

/** Converte o estado do schema `n` para o schema `n + 1`. */
export type Migration = (state: UnknownRecord) => UnknownRecord;

/**
 * Registro de migrations. A chave é a versão de origem.
 *
 * Exemplo para uma futura versão 2:
 *   1: (state) => ({ ...state, tasks: (state.tasks as unknown[]).map(addNewField) })
 */
export const MIGRATIONS: Readonly<Record<number, Migration>> = {};

export type MigrationResult =
  | { ok: true; state: UnknownRecord; migratedFrom?: number }
  | { ok: false; reason: "invalid" | "newer" | "missing-migration" };

export function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function migrateState(
  raw: unknown,
  migrations: Readonly<Record<number, Migration>> = MIGRATIONS,
  target: number = SCHEMA_VERSION,
): MigrationResult {
  if (!isRecord(raw)) return { ok: false, reason: "invalid" };

  const version = raw.schemaVersion;
  if (typeof version !== "number" || !Number.isInteger(version) || version < 1) {
    return { ok: false, reason: "invalid" };
  }
  if (version > target) return { ok: false, reason: "newer" };

  let state: UnknownRecord = raw;
  for (let current = version; current < target; current++) {
    const migrate = migrations[current];
    if (!migrate) return { ok: false, reason: "missing-migration" };
    state = { ...migrate(state), schemaVersion: current + 1 };
  }

  return { ok: true, state, migratedFrom: version === target ? undefined : version };
}
