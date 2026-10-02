import type { AppData } from "@/domain/app-data";
import { backupFileName, createBackup, serializeBackup } from "@/lib/backup";
import { todayKey } from "@/lib/dates";
import { createSampleData } from "@/lib/sample-data";
import { downloadTextFile } from "@/lib/utils/download";
import { eraseAllData, getAppData, useAppStore } from "@/store/app-store";
import { toast } from "@/store/ui-store";

export function loadSampleData(): void {
  useAppStore.getState().replaceData(createSampleData(todayKey()));
  toast.success("Dados de exemplo carregados. Apague-os em Configurações quando quiser.");
}

export function exportBackup(): void {
  try {
    const now = new Date();
    downloadTextFile(backupFileName(now), serializeBackup(createBackup(getAppData(), now)));
    toast.success("Backup exportado");
  } catch {
    toast.error("Não foi possível gerar o arquivo de backup.");
  }
}

export function restoreBackup(data: AppData): void {
  useAppStore.getState().replaceData(data);
  toast.success("Backup importado");
}

export function eraseData(): void {
  eraseAllData();
  toast.show("Todos os dados foram apagados");
}
