import { getSupabase } from "@/lib/supabase/client";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const SERVICE_WORKER_PATH = "/sw.js";

export type PushState = "unsupported" | "not-configured" | "denied" | "off" | "on";

function isSupported(): boolean {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

function decodeKey(base64Url: string): Uint8Array<ArrayBuffer> {
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(base64Url.length / 4) * 4, "=");
  return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
}

export async function getPushState(): Promise<PushState> {
  if (!isSupported()) return "unsupported";
  if (!VAPID_PUBLIC_KEY) return "not-configured";
  if (Notification.permission === "denied") return "denied";
  const registration = await navigator.serviceWorker.getRegistration(SERVICE_WORKER_PATH);
  const subscription = await registration?.pushManager.getSubscription();
  return subscription ? "on" : "off";
}

/** Pede a permissão, assina o aparelho e guarda a assinatura na conta. Devolve o estado final. */
export async function enablePush(): Promise<PushState> {
  if (!isSupported()) return "unsupported";
  if (!VAPID_PUBLIC_KEY) return "not-configured";

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return permission === "denied" ? "denied" : "off";

  const registration = await navigator.serviceWorker.register(SERVICE_WORKER_PATH);
  await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: decodeKey(VAPID_PUBLIC_KEY),
  });

  const { endpoint, keys } = subscription.toJSON();
  const supabase = getSupabase();
  const { data } = await supabase.auth.getUser();
  if (!endpoint || !keys || !data.user) throw new Error("Assinatura de notificação incompleta");

  const { error } = await supabase.from("push_subscriptions").upsert({
    user_id: data.user.id,
    endpoint,
    p256dh: keys.p256dh,
    auth: keys.auth,
    time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
  if (error) {
    await subscription.unsubscribe();
    throw error;
  }
  return "on";
}

/** Tira a assinatura do aparelho e da conta. */
export async function disablePush(): Promise<PushState> {
  if (!isSupported()) return "unsupported";
  const registration = await navigator.serviceWorker.getRegistration(SERVICE_WORKER_PATH);
  const subscription = await registration?.pushManager.getSubscription();
  if (subscription) {
    const { error } = await getSupabase().from("push_subscriptions").delete().eq("endpoint", subscription.endpoint);
    if (error) throw error;
    await subscription.unsubscribe();
  }
  return "off";
}
