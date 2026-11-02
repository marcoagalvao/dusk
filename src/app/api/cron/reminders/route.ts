import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

import { sendDailyDigests, type PushSubscriptionRow } from "@/lib/push/send-digests";

/**
 * Chamada uma vez por dia pelo Cron da Vercel (`vercel.json`), que envia o
 * CRON_SECRET no cabeçalho. É o único trecho do app que usa a chave secreta do
 * Supabase, porque precisa ler as assinaturas de todos os aparelhos.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Não autorizado" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  const vapidSubject = process.env.VAPID_SUBJECT;
  if (!supabaseUrl || !serviceRoleKey || !vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
    return Response.json({ error: "Avisos não configurados" }, { status: 503 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

  const result = await sendDailyDigests({
    listSubscriptions: async () => {
      const { data, error } = await supabase.from("push_subscriptions").select("user_id, endpoint, p256dh, auth, time_zone");
      if (error) throw error;
      return data as PushSubscriptionRow[];
    },
    listTasks: async (userId) => {
      const { data, error } = await supabase
        .from("tasks")
        .select("status, due_date, review_date")
        .eq("user_id", userId)
        .is("archived_at", null);
      if (error) throw error;
      return data.map((row) => ({ status: row.status, dueDate: row.due_date ?? undefined, reviewDate: row.review_date ?? undefined }));
    },
    send: async (subscription, payload) => {
      await webpush.sendNotification(
        { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
        payload,
      );
    },
    removeSubscription: async ({ user_id, endpoint }) => {
      await supabase.from("push_subscriptions").delete().eq("user_id", user_id).eq("endpoint", endpoint);
    },
  });

  return Response.json(result);
}
