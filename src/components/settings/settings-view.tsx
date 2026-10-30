"use client";

import { Columns3, LayoutList, LogOut, Trash2 } from "lucide-react";
import { useId, useState } from "react";

import { signOut } from "@/actions/auth-actions";
import { eraseData } from "@/actions/data-actions";
import { useAuthUser } from "@/components/auth/use-auth-user";
import { PageContainer, PageHeader } from "@/components/layout/page";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/form-controls";
import { SegmentedControl } from "@/components/ui/misc";
import { SyncBadge } from "@/components/ui/sync-badge";
import { STATUS_COLOR } from "@/components/ui/tokens";
import { APP_VERSION, SCHEMA_VERSION } from "@/domain/app-data";
import { DISPLAY_NAME_MAX_LENGTH, type TaskView } from "@/domain/settings";
import { TASK_STATUSES } from "@/domain/task";
import { useAppStore } from "@/store/app-store";
import { useSettings } from "@/store/hooks";
import { toast } from "@/store/ui-store";

import { BackupSection } from "./backup-section";
import { SettingsRow, SettingsSection } from "./settings-layout";

const ERASE_CONFIRMATION = "APAGAR";

export function SettingsView() {
  const settings = useSettings();
  const user = useAuthUser();
  const updateSettings = useAppStore((state) => state.updateSettings);
  const nameId = useId();
  const eraseId = useId();
  const [eraseOpen, setEraseOpen] = useState(false);
  const [eraseText, setEraseText] = useState("");

  return (
    <PageContainer width="narrow">
      <PageHeader title="Configurações" />

      <div className="flex flex-col gap-10">
        <SettingsSection id="settings-appearance" title="Aparência">
          <SettingsRow
            title="Tema"
            description="Pastel Dusk: escuro, suave e com cores pastéis. É o único tema desta versão."
            action={
              <span aria-hidden="true" className="flex items-center gap-1">
                {TASK_STATUSES.map((status) => (
                  <span key={status} className="size-4 rounded-full" style={{ backgroundColor: STATUS_COLOR[status] }} />
                ))}
              </span>
            }
          />
          <SettingsRow
            title={<label htmlFor={nameId}>Seu nome</label>}
            description="Usado na saudação da visão geral. Opcional."
            // A key remonta o campo quando o valor salvo muda por fora (backup, outra aba, apagar tudo).
            action={<DisplayNameInput key={settings.displayName ?? ""} id={nameId} saved={settings.displayName ?? ""} />}
          />
          <SettingsRow
            title="Visualização padrão de tarefas"
            description="Como a tela Tarefas abre. Também muda quando você alterna por lá."
            action={
              <SegmentedControl<TaskView>
                label="Visualização padrão"
                value={settings.defaultTaskView}
                onChange={(defaultTaskView) => updateSettings({ defaultTaskView })}
                options={[
                  { value: "list", label: "Lista", icon: <LayoutList aria-hidden="true" className="size-4" /> },
                  { value: "kanban", label: "Kanban", icon: <Columns3 aria-hidden="true" className="size-4" /> },
                ]}
              />
            }
          />
        </SettingsSection>

        <SettingsSection id="settings-data" title="Dados">
          <BackupSection />
          <SettingsRow
            title="Apagar todos os dados"
            description="Remove todas as tarefas, projetos e configurações do banco de dados, em todos os dispositivos. Não dá para desfazer."
            action={
              <Button variant="danger" onClick={() => setEraseOpen(true)}>
                <Trash2 aria-hidden="true" className="size-4" />
                Apagar tudo
              </Button>
            }
          />
        </SettingsSection>

        <SettingsSection id="settings-about" title="Sobre">
          <SettingsRow title="Versão do app" action={<span className="font-mono text-label text-ink-muted">{APP_VERSION}</span>} />
          <SettingsRow
            title="Versão do formato de dados"
            action={<span className="font-mono text-label text-ink-muted">schema {SCHEMA_VERSION}</span>}
          />
          <SettingsRow
            title="Onde seus dados ficam"
            description="No banco de dados, ligados à sua conta: entrando em qualquer dispositivo você vê as mesmas tarefas. Sem conexão, as alterações ficam neste navegador e são enviadas quando ela voltar."
          />
          <SettingsRow title="Sincronização" action={<SyncBadge />} />
          <SettingsRow
            title="Sua conta"
            description={user?.email}
            action={
              <Button variant="secondary" onClick={() => void signOut()}>
                <LogOut aria-hidden="true" className="size-4" />
                Sair
              </Button>
            }
          />
        </SettingsSection>
      </div>

      <ConfirmDialog
        open={eraseOpen}
        onOpenChange={(open) => {
          setEraseOpen(open);
          if (!open) setEraseText("");
        }}
        title="Apagar todos os dados?"
        description="Tarefas, projetos, histórico e configurações serão removidos do banco de dados, em todos os dispositivos. Considere exportar um backup antes."
        confirmLabel="Apagar tudo"
        confirmDisabled={eraseText !== ERASE_CONFIRMATION}
        onConfirm={eraseData}
      >
        <div className="mt-4 flex flex-col gap-1.5">
          <label htmlFor={eraseId} className="text-label text-ink-muted">
            Digite <span className="font-mono font-semibold text-ink">{ERASE_CONFIRMATION}</span> para confirmar.
          </label>
          <Input
            id={eraseId}
            value={eraseText}
            onChange={(event) => setEraseText(event.target.value)}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
          />
        </div>
      </ConfirmDialog>
    </PageContainer>
  );
}

function DisplayNameInput({ id, saved }: { id: string; saved: string }) {
  const updateSettings = useAppStore((state) => state.updateSettings);
  const [name, setName] = useState(saved);

  const save = () => {
    if (name.trim() === saved) return;
    updateSettings({ displayName: name });
    toast.success(name.trim() ? "Nome atualizado" : "Nome removido da saudação");
  };

  return (
    <Input
      id={id}
      value={name}
      onChange={(event) => setName(event.target.value)}
      onBlur={save}
      onKeyDown={(event) => event.key === "Enter" && event.currentTarget.blur()}
      placeholder="Como quer ser chamado"
      maxLength={DISPLAY_NAME_MAX_LENGTH}
      autoComplete="given-name"
      className="sm:w-56"
    />
  );
}
