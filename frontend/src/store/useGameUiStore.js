// src/store/useGameUiStore.js
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export const useGameUiStore = create(
  persist(
    (set, get) => ({
      // UI de partie
      currentRoomId: null,
      myColor: undefined,       // "white" | "black"
      players: [],              // ["alice","bob"]
      isInGame: false,

      setGameUi: (partial) => set({ ...get(), ...partial }),
      // on NE vide plus currentRoomId automatiquement
      clearGameUi: () =>
        set({
          // currentRoomId: null, // ❌ on le laisse pour "Resume game"
          myColor: undefined,
          players: [],
          isInGame: false,
        }),

      // option: quand l'utilisateur QUITTE explicitement la partie
      leaveGame: () =>
        set({
          currentRoomId: null,
          myColor: undefined,
          players: [],
          isInGame: false,
        }),
    }),
    {
      name: "game-ui", // clé localStorage
      storage: createJSONStorage(() => localStorage),
      // ne persiste que ce qui sert à “reprendre”
      partialize: (s) => ({
        currentRoomId: s.currentRoomId,
        myColor: s.myColor,
        players: s.players,
        isInGame: s.isInGame,
      }),
    }
  )
);
