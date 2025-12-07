import { create } from "zustand";
import type { TimePeriod } from "./dateUtils";

interface ChartSettingsState {
    // Sync settings
    syncEnabled: boolean;
    setSyncEnabled: (enabled: boolean) => void;

    // Global chart settings (used when sync is enabled - applies to ALL charts)
    globalTimePeriod: TimePeriod;
    setGlobalTimePeriod: (period: TimePeriod) => void;
    globalUseSmoothed: boolean;
    setGlobalUseSmoothed: (enabled: boolean) => void;
}

export const useChartSettingsStore = create<ChartSettingsState>((set) => ({
    // Sync defaults to false (independent charts)
    syncEnabled: false,
    setSyncEnabled: (enabled) => set({ syncEnabled: enabled }),

    // Default global settings (used by all charts when sync is enabled)
    globalTimePeriod: "max",
    setGlobalTimePeriod: (period) => set({ globalTimePeriod: period }),
    globalUseSmoothed: false,
    setGlobalUseSmoothed: (enabled) => set({ globalUseSmoothed: enabled }),
}));

