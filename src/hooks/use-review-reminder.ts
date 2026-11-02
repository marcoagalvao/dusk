"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { DEFAULT_TASK_FILTERS, getDueReviews } from "@/domain/task-queries";
import { useTasks } from "@/store/hooks";
import { toast, useUiStore } from "@/store/ui-store";

import { useToday } from "./use-clock";

/**
 * Aviso dentro do app quando chega o dia de um lembrete; com o app fechado,
 * quem avisa é a notificação diária. Avaliado uma vez por dia: ao abrir o app e,
 * se ele ficar aberto, quando o dia vira. Lembretes marcados para hoje ao longo
 * do dia não disparam o aviso de novo; eles já aparecem na Home.
 */
export function useReviewReminder(): void {
  const router = useRouter();
  const today = useToday();
  const tasks = useTasks();
  const hydrated = useUiStore((state) => state.hydrated);
  const remindedOn = useUiStore((state) => state.reviewReminderDate);

  useEffect(() => {
    if (!hydrated || remindedOn === today) return;
    const { markReviewReminder, setTaskFilters } = useUiStore.getState();
    markReviewReminder(today);

    const due = getDueReviews(tasks, today);
    if (due.length === 0) return;

    toast.show(due.length === 1 ? `Lembrete: "${due[0].title}".` : `${due.length} lembretes para hoje.`, {
      duration: 8000,
      action: {
        label: "Ver",
        onAction: () => {
          if (due.length === 1) {
            router.push(`/tasks/${due[0].id}`);
            return;
          }
          // "Todas": lembretes de tarefas concluídas também precisam aparecer.
          setTaskFilters({ ...DEFAULT_TASK_FILTERS, reviewDue: true, completion: "all" });
          router.push("/tasks?view=list");
        },
      },
    });
  }, [hydrated, remindedOn, today, tasks, router]);
}
