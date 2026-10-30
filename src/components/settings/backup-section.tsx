"use client";

import { Download, Upload } from "lucide-react";
import { useRef, useState, type ChangeEvent } from "react";

import { exportBackup, restoreBackup } from "@/actions/data-actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import type { AppData } from "@/domain/app-data";
import type { BackupSummary } from "@/domain/backup";
import { MAX_BACKUP_BYTES, parseBackup } from "@/lib/backup";
import { formatDateTime } from "@/lib/dates";
import { pluralize } from "@/lib/utils/text";
import { toast } from "@/store/ui-store";

import { SettingsRow } from "./settings-layout";

interface PendingRestore {
  data: AppData;
  summary: BackupSummary;
  droppedItems: number;
}

export function BackupSection() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<PendingRestore | null>(null);

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Permite escolher o mesmo arquivo de novo depois de cancelar.
    event.target.value = "";
    if (!file) return;

    if (file.size > MAX_BACKUP_BYTES) {
      toast.error("O arquivo é grande demais para ser um backup do Dusk.");
      return;
    }

    let text: string;
    try {
      text = await file.text();
    } catch {
      toast.error("Não foi possível ler o arquivo selecionado.");
      return;
    }

    const result = parseBackup(text);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setPending({ data: result.data, summary: result.summary, droppedItems: result.droppedItems });
  };

  return (
    <>
      <SettingsRow
        title="Exportar backup"
        description="Baixa um arquivo .json com todas as tarefas, projetos e configurações. Uma cópia sua, fora do banco, para guardar onde quiser."
        action={
          <Button onClick={exportBackup}>
            <Download aria-hidden="true" className="size-4" />
            Exportar
          </Button>
        }
      />
      <SettingsRow
        title="Importar backup"
        description="Restaura um arquivo exportado pelo Dusk. Você vê um resumo antes de confirmar."
        action={
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFile}
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
            />
            <Button onClick={() => fileInputRef.current?.click()}>
              <Upload aria-hidden="true" className="size-4" />
              Importar
            </Button>
          </>
        }
      />

      <Dialog open={pending !== null} onOpenChange={(open) => !open && setPending(null)}>
        <DialogContent placement="bottom" width="sm">
          <DialogHeader title="Backup encontrado" />
          {pending && (
            <>
              <dl className="flex flex-col gap-1 text-compact">
                <div className="flex gap-2">
                  <dt className="sr-only">Tarefas</dt>
                  <dd className="text-ink">{pluralize(pending.summary.taskCount, "tarefa", "tarefas")}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="sr-only">Projetos</dt>
                  <dd className="text-ink">{pluralize(pending.summary.projectCount, "projeto", "projetos")}</dd>
                </div>
                {pending.summary.exportedAt && (
                  <div className="flex gap-2">
                    <dt className="sr-only">Data de exportação</dt>
                    <dd className="text-ink-muted">Exportado em {formatDateTime(pending.summary.exportedAt)}</dd>
                  </div>
                )}
              </dl>
              {pending.droppedItems > 0 && (
                <p className="mt-3 text-label text-status-waiting">
                  {pluralize(pending.droppedItems, "item inválido será ignorado", "itens inválidos serão ignorados")}.
                </p>
              )}
              <p className="mt-4 rounded-control border border-status-waiting/30 bg-status-waiting/8 px-3 py-2 text-compact text-ink">
                Isso substituirá os dados atuais.
              </p>
            </>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPending(null)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                if (pending) restoreBackup(pending.data);
                setPending(null);
              }}
            >
              Restaurar backup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
