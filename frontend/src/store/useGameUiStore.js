// src/store/useGameUiStore.js
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const PIECE_VALUES = { p: 1, n: 3, b: 3, r: 5, q: 9 }; // (le roi ne compte pas)

export const useGameUiStore = create()(
  persist(
    (set, get) => ({
      // --- State de partie ---
      currentRoomId: null,
      myColor: undefined,     // "white" | "black"
      players: [],            // ["alice","bob"]
      isInGame: false,

      // Captures locales (par convention: 'w' = blancs, 'b' = noirs → le côté QUI CAPTURE)
      // item: { piece:'p|n|b|r|q', by:'w|b', at:number, from?:string, to?:string }
      captures: { w: [], b: [] },

      // --- Setters sûrs ---
      /**
       * Setter centralisé pour la room.
       * - Si la room change et qu'on ne demande pas explicitement de conserver, on reset les captures.
       */
      setCurrentRoomId: (nextRoomId, opts = { keepCaptures: false }) => {
        const prev = get().currentRoomId;
        if (prev === nextRoomId) return;
        set({
          currentRoomId: nextRoomId ?? null,
          // par défaut on repart propre pour la nouvelle room
          captures: opts.keepCaptures ? get().captures : { w: [], b: [] },
          isInGame: !!nextRoomId,
        });
      },

      setPlayers: (players) => set({ players: Array.isArray(players) ? players : [] }),
      setMyColor: (color) => set({ myColor: color }),

      /**
       * setGameUi: patch utilisateur. Ajoute une protection:
       * - Si currentRoomId change ici, on reset les captures (sauf opts.keepCaptures).
       */
      setGameUi: (partial, opts = { keepCaptures: false }) => {
        const prevRoom = get().currentRoomId;
        const hasRoomChange =
          partial && Object.prototype.hasOwnProperty.call(partial, "currentRoomId") &&
          partial.currentRoomId !== prevRoom;

        if (hasRoomChange && !opts.keepCaptures) {
          set({
            ...get(),
            ...partial,
            captures: { w: [], b: [] },
            isInGame: !!partial.currentRoomId,
          });
        } else {
          set({ ...get(), ...partial });
        }
      },

      /**
       * Nettoyage UI (sans quitter la room pour permettre "Resume game")
       */
      clearGameUi: () =>
        set({
          myColor: undefined,
          players: [],
          isInGame: false,
          captures: { w: [], b: [] },
        }),

      /**
       * Quitter la partie explicitement
       */
      leaveGame: () =>
        set({
          currentRoomId: null,
          myColor: undefined,
          players: [],
          isInGame: false,
          captures: { w: [], b: [] },
        }),

      // --- Captures & matériel ---
      resetCaptures: () => set({ captures: { w: [], b: [] } }),

      applyCapture: (payload) => {
        // payload attendu: { by:'w|b', piece:'p|n|b|r|q', at?:number, from?:string, to?:string }
        if (!payload || (payload.by !== "w" && payload.by !== "b")) return;
        const { captures } = get();
        const entry = {
          ...payload,
          at: typeof payload.at === "number" ? payload.at : Date.now(),
        };
        const next = {
          ...captures,
          [payload.by]: [...(captures[payload.by] || []), entry],
        };
        set({ captures: next });
      },

      // Différentiel de matériel: (points BLANCS) - (points NOIRS)
      materialDiff: () => {
        const { captures } = get();
        const sum = (side) =>
          (captures[side] || []).reduce((acc, c) => acc + (PIECE_VALUES[c.piece] || 0), 0);
        return sum("w") - sum("b");
      },
    }),
    {
      name: "game-ui-v2", // ⚠️ nouvelle clé (v2) pour éviter conflits avec ancien storage
      storage: createJSONStorage(() => sessionStorage), // ← change en localStorage si tu veux persister au-delà de l’onglet
      version: 2,
      // On persiste seulement ce qui est utile à la reprise
      partialize: (s) => ({
        currentRoomId: s.currentRoomId,
        myColor: s.myColor,
        players: s.players,
        isInGame: s.isInGame,
        captures: s.captures, // ✅ on persiste désormais les captures pour survivre à un refresh
      }),
      // Migration des anciennes versions (ex: v1 sans captures)
      migrate: (persistedState, version) => {
        if (!persistedState) return persistedState;
        if (version < 2) {
          // s'assure que 'captures' existe
          return {
            ...persistedState,
            captures: persistedState.captures || { w: [], b: [] },
          };
        }
        return persistedState;
      },
    }
  )
);
