// src/store/useGameUiStore.js
import { create } from "zustand";

/** Infos d’UI liées à la partie courante, lisibles par NavBar */
export const useGameUiStore = create((set) => ({
  currentRoomId: null,      // string | null
  myColor: null,            // "white" | "black" | null
  setGameUi: (partial) => set((s) => ({ ...s, ...partial })),
  clearGameUi: () => set({ currentRoomId: null, myColor: null }),
}));
