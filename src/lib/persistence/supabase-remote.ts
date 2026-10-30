import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";

import { emptyRows, SETTINGS_KEY, TABLES, type Row, type RowChanges, type RowSet, type TableName } from "./rows";
import { RemoteError, type RemoteStore } from "./synced-persistence";

const PAGE_SIZE = 1000;
const UPSERT_CHUNK = 500;
const DELETE_CHUNK = 100;

/** Pais antes dos filhos ao gravar, filhos antes dos pais ao apagar (chaves estrangeiras). */
const WRITE_ORDER: readonly TableName[] = TABLES;
const DELETE_ORDER: readonly TableName[] = [...TABLES].reverse();

function toRemoteError(error: PostgrestError): RemoteError {
  // 22xxx (dado inválido) e 23xxx (constraint): reenviar a mesma linha falharia sempre.
  const permanent = /^2[23]/.test(error.code ?? "");
  return new RemoteError(error.message, permanent);
}

function chunks<T>(items: readonly T[], size: number): T[][] {
  const result: T[][] = [];
  for (let start = 0; start < items.length; start += size) result.push(items.slice(start, start + size));
  return result;
}

export class SupabaseRemote implements RemoteStore {
  constructor(
    private readonly supabase: SupabaseClient,
    private readonly userId: string,
  ) {}

  async fetchAll(): Promise<RowSet> {
    const rows = emptyRows();
    await Promise.all(
      TABLES.map(async (table) => {
        for (const row of await this.fetchTable(table)) {
          rows[table][table === "user_settings" ? SETTINGS_KEY : String(row.id)] = row;
        }
      }),
    );
    return rows;
  }

  async apply(changes: RowChanges): Promise<void> {
    for (const table of WRITE_ORDER) {
      const upserts = Object.values(changes[table] ?? {}).filter((row): row is Row => row !== null);
      for (const chunk of chunks(upserts, UPSERT_CHUNK)) {
        const { error } = await this.supabase
          .from(table)
          .upsert(
            chunk.map((row) => ({ ...row, user_id: this.userId })),
            { onConflict: table === "user_settings" ? "user_id" : "user_id,id" },
          );
        if (error) throw toRemoteError(error);
      }
    }

    for (const table of DELETE_ORDER) {
      const ids = Object.entries(changes[table] ?? {})
        .filter(([, row]) => row === null)
        .map(([id]) => id);
      for (const chunk of chunks(ids, DELETE_CHUNK)) {
        const query = this.supabase.from(table).delete().eq("user_id", this.userId);
        const { error } = await (table === "user_settings" ? query : query.in("id", chunk));
        if (error) throw toRemoteError(error);
      }
    }
  }

  /** O PostgREST limita o tamanho da resposta, então lê em páginas. */
  private async fetchTable(table: TableName): Promise<Row[]> {
    const rows: Row[] = [];
    for (let from = 0; ; from += PAGE_SIZE) {
      const { data, error } = await this.supabase
        .from(table)
        .select("*")
        .eq("user_id", this.userId)
        .order(table === "user_settings" ? "user_id" : "id")
        .range(from, from + PAGE_SIZE - 1);
      if (error) throw toRemoteError(error);
      rows.push(...((data ?? []) as Row[]));
      if (!data || data.length < PAGE_SIZE) return rows;
    }
  }
}
