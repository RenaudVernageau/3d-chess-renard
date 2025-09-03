// src/store/useGameUiStore.js
import { create } from "zustand";

/**
 * Stocke les infos d'UI liées à la partie en cours pour la NavBar.
 * - currentRoomId: string|null
 * - myColor: "white"|"black"|null
 */
export const useGameUiStore = create((set) => ({
  currentRoomId: null,
  myColor: null,

  setGameUi: (partial) => set((s) => ({ ...s, ...partial })),
  clearGameUi: () => set({ currentRoomId: null, myColor: null }),
}));
