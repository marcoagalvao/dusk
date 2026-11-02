import { disablePush, enablePush, getPushState, type PushState } from "@/lib/push/client";
import { toast } from "@/store/ui-store";

export { getPushState, type PushState };

export async function turnOnNotifications(): Promise<PushState> {
  try {
    const state = await enablePush();
    if (state === "on") toast.success("Avisos ligados neste aparelho");
    return state;
  } catch {
    toast.error("Não foi possível ligar os avisos. Verifique sua conexão e tente de novo.");
    return getPushState();
  }
}

export async function turnOffNotifications(): Promise<PushState> {
  try {
    const state = await disablePush();
    toast.show("Avisos desligados neste aparelho");
    return state;
  } catch {
    toast.error("Não foi possível desligar os avisos. Verifique sua conexão e tente de novo.");
    return getPushState();
  }
}
