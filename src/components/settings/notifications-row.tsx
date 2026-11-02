"use client";

import { Bell, BellOff } from "lucide-react";
import { useEffect, useState } from "react";

import { getPushState, turnOffNotifications, turnOnNotifications, type PushState } from "@/actions/notification-actions";
import { Button } from "@/components/ui/button";

import { SettingsRow } from "./settings-layout";

const DESCRIPTIONS: Record<PushState, string> = {
  unsupported: "Este navegador não oferece avisos. No iPhone, adicione o Dusk à tela de início e abra por lá.",
  "not-configured": "Os avisos ainda não foram configurados neste servidor.",
  denied: "O navegador está bloqueando os avisos do Dusk. Libere nas permissões do site para poder ligar.",
  off: "Um resumo pela manhã com o que está atrasado, com prazo hoje e os lembretes, mesmo com o app fechado.",
  on: "Ligados. Você recebe um resumo pela manhã quando houver algo para o dia.",
};

export function NotificationsRow() {
  const [state, setState] = useState<PushState | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    void getPushState().then((next) => {
      if (active) setState(next);
    });
    return () => {
      active = false;
    };
  }, []);

  const change = async (action: () => Promise<PushState>) => {
    setBusy(true);
    setState(await action());
    setBusy(false);
  };

  return (
    <SettingsRow
      title="Avisos neste aparelho"
      description={state ? DESCRIPTIONS[state] : DESCRIPTIONS.off}
      action={
        state === "on" ? (
          <Button variant="secondary" disabled={busy} onClick={() => void change(turnOffNotifications)}>
            <BellOff aria-hidden="true" className="size-4" />
            Desligar
          </Button>
        ) : state === "off" ? (
          <Button variant="secondary" disabled={busy} onClick={() => void change(turnOnNotifications)}>
            <Bell aria-hidden="true" className="size-4" />
            Ligar
          </Button>
        ) : undefined
      }
    />
  );
}
