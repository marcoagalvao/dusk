import { dailyDigest, type DigestTask } from "@/domain/daily-digest";
import { dateKeyInTimeZone } from "@/lib/dates";

export interface PushSubscriptionRow {
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  time_zone: string;
}

export interface SendResult {
  sent: number;
  skipped: number;
  removed: number;
  failed: number;
}

export interface DigestDeps {
  listSubscriptions: () => Promise<PushSubscriptionRow[]>;
  listTasks: (userId: string) => Promise<DigestTask[]>;
  send: (subscription: PushSubscriptionRow, payload: string) => Promise<void>;
  removeSubscription: (subscription: PushSubscriptionRow) => Promise<void>;
}

/** O serviço do navegador avisa com 404 ou 410 que a assinatura não existe mais. */
const isGone = (error: unknown) => {
  const status = (error as { statusCode?: number } | null)?.statusCode;
  return status === 404 || status === 410;
};

/** Manda o resumo do dia para cada aparelho, no fuso dele. Uma falha não impede os demais. */
export async function sendDailyDigests(deps: DigestDeps, now: Date = new Date()): Promise<SendResult> {
  const result: SendResult = { sent: 0, skipped: 0, removed: 0, failed: 0 };
  const tasksByUser = new Map<string, DigestTask[]>();

  for (const subscription of await deps.listSubscriptions()) {
    try {
      let tasks = tasksByUser.get(subscription.user_id);
      if (!tasks) {
        tasks = await deps.listTasks(subscription.user_id);
        tasksByUser.set(subscription.user_id, tasks);
      }
      const digest = dailyDigest(tasks, dateKeyInTimeZone(subscription.time_zone, now));
      if (!digest) {
        result.skipped += 1;
        continue;
      }
      await deps.send(subscription, JSON.stringify(digest));
      result.sent += 1;
    } catch (error) {
      if (isGone(error)) {
        await deps.removeSubscription(subscription).catch(() => undefined);
        result.removed += 1;
      } else {
        result.failed += 1;
      }
    }
  }
  return result;
}
