import { DEFAULT_SETTINGS, DISPLAY_NAME_MAX_LENGTH, type AppSettings } from "@/domain/settings";
import { cleanText } from "@/lib/utils/text";

import type { AppSliceCreator } from "../types";

export interface SettingsSlice {
  settings: AppSettings;
  updateSettings: (patch: Partial<Omit<AppSettings, "theme">>) => void;
}

export const createSettingsSlice: AppSliceCreator<SettingsSlice> = (set) => ({
  settings: { ...DEFAULT_SETTINGS },

  updateSettings: (patch) =>
    set((state) => {
      const next: AppSettings = { ...state.settings, ...patch };
      if ("displayName" in patch) {
        next.displayName = cleanText(patch.displayName)?.slice(0, DISPLAY_NAME_MAX_LENGTH);
      }
      return { settings: next };
    }),
});
