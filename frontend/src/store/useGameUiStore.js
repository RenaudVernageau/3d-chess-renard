// src/store/useGameUiStore.js
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const PIECE_VALUES = { p: 1, n: 3, b: 3, r: 5, q: 9 }; // k n'est pas compté

export const useGameUiStore = create(
  persist(
    (set, get) => ({
      // UI de partie
      currentRoomId: null,
      myColor: undefined,       // "white" | "black"
      players: [],              // ["alice","bob"]
      isInGame: false,

      // Captures locales (V1 100% front)
      // par convention: 'w' = blancs, 'b' = noirs (côté qui CAPTURE)
      captures: { w: [], b: [] }, // items: { piece:'p|n|b|r|q', by:'w|b', at, from, to }

      setGameUi: (partial) => set({ ...get(), ...partial }),

      // on NE vide plus currentRoomId automatiquement
      clearGameUi: () =>
        set({
          // currentRoomId: null, // ❌ on le laisse pour "Resume game"
          myColor: undefined,
          players: [],
          isInGame: false,
          captures: { w: [], b: [] },
        }),

      // option: quand l'utilisateur QUITTE explicitement la partie
      leaveGame: () =>
        set({
          currentRoomId: null,
          myColor: undefined,
          players: [],
          isInGame: false,
          captures: { w: [], b: [] },
        }),

      // === Captures & matériel ===

      resetCaptures: () => set({ captures: { w: [], b: [] } }),

      applyCapture: (payload) => {
        // payload: { by:'w|b', piece:'p|n|b|r|q', at?:number, from?:string, to?:string }
        const { captures } = get();
        const next = {
          ...captures,
          [payload.by]: [...captures[payload.by], { ...payload, at: payload.at ?? Date.now() }],
        };
        set({ captures: next });
      },

      // Différentiel de matériel (blancs - noirs)
      materialDiff: () => {
        const { captures } = get();
        const sum = (side) =>
          (captures[side] || []).reduce((acc, c) => acc + (PIECE_VALUES[c.piece] || 0), 0);
        return sum('w') - sum('b');
      },
    }),
    {
      name: "game-ui", // clé localStorage
      storage: createJSONStorage(() => localStorage),
      // on ne persiste que ce qui sert à “reprendre” proprement
      partialize: (s) => ({
        currentRoomId: s.currentRoomId,
        myColor: s.myColor,
        players: s.players,
        isInGame: s.isInGame,
        // on ne persiste PAS les captures pour éviter les résidus entre parties
      }),
    }
  )
);
