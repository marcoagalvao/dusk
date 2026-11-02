"use client";

import { archiveProject } from "@/actions/project-actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import type { Project } from "@/domain/project";
import { pluralize } from "@/lib/utils/text";

interface ProjectArchiveDialogProps {
  project: Project;
  activeTaskCount: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onArchived: () => void;
}

/** Tarefas soltas de um projeto arquivado confundem: o padrão é arquivar tudo junto. */
export function ProjectArchiveDialog({ project, activeTaskCount, open, onOpenChange, onArchived }: ProjectArchiveDialogProps) {
  const archive = (withTasks: boolean) => {
    archiveProject(project.id, { withTasks });
    onOpenChange(false);
    onArchived();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent placement="bottom" width="md">
        <DialogHeader
          title={`Arquivar "${project.name}"?`}
          description={`O projeto tem ${pluralize(activeTaskCount, "tarefa", "tarefas")} fora do Arquivo. O que fazer com ${activeTaskCount === 1 ? "ela" : "elas"}?`}
        />
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={() => archive(false)}>Manter ativas</Button>
          <Button variant="primary" onClick={() => archive(true)}>
            Arquivar junto
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
