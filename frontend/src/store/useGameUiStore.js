// src/store/useGameUiStore.js
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const PIECE_VALUES = { p: 1, n: 3, b: 3, r: 5, q: 9 }; // (le roi ne compte pas)

export const useGameUiStore = create()(
  persist(
    (set, get) => ({
      // --- State de partie (VOLATILE: non persisté) ---
      currentRoomId: null,
      myColor: undefined,     // "white" | "black"
      players: [],            // ["alice","bob"]
      isInGame: false,
      hasQuit: false,         // indicateur qu’on a explicitement quitté

      // Captures locales (VOLATILE aussi)
      // item: { piece:'p|n|b|r|q', by:'w|b', at:number, from?:string, to?:string }
      captures: { w: [], b: [] },

      // --- Nonce pour forcer un rerender des UIs liées à la session ---
      sessionNonce: 0,

      // --- Setters sûrs ---
      setCurrentRoomId: (nextRoomId, opts = { keepCaptures: false }) => {
        const prev = get().currentRoomId;
        if (prev === nextRoomId) return;
        set({
          currentRoomId: nextRoomId ?? null,
          captures: opts.keepCaptures ? get().captures : { w: [], b: [] },
          isInGame: !!nextRoomId,
          hasQuit: !!nextRoomId ? false : get().hasQuit,
        });
      },

      setPlayers: (players) => set({ players: Array.isArray(players) ? players : [] }),
      setMyColor: (color) => set({ myColor: color }),

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
            hasQuit: !!partial.currentRoomId ? false : get().hasQuit,
          });
        } else {
          const updates = { ...partial };
          if (partial && partial.currentRoomId) updates.hasQuit = false;
          set({ ...get(), ...updates });
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
       * - Vide l'état mémoire
       * - Purge les traces persistées susceptibles d'afficher la session (clé custom éventuelle)
       * - Bump sessionNonce pour forcer le rerender des composants abonnés (NavBar)
       * - Marque hasQuit = true pour bloquer tout auto-rejoin côté client
       */
      leaveGame: () => {
        try {
          localStorage.removeItem("ignoreRoomEventsUntil");
          // Nettoyage défensif de vieilles clés custom si tu en as eu
          localStorage.removeItem("currentRoomId");
          localStorage.removeItem("lastRoomId");
        } catch (_) {}
        try {
          sessionStorage.removeItem("currentRoomId");
          sessionStorage.removeItem("lastRoomId");
        } catch (_) {}

        const nextNonce = Date.now();

        set({
          currentRoomId: null,
          myColor: undefined,
          players: [],
          isInGame: false,
          hasQuit: true,
          captures: { w: [], b: [] },
          sessionNonce: nextNonce,
        });
      },

      // --- Captures & matériel ---
      resetCaptures: () => set({ captures: { w: [], b: [] } }),

      applyCapture: (payload) => {
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

      materialDiff: () => {
        const { captures } = get();
        const sum = (side) =>
          (captures[side] || []).reduce((acc, c) => acc + (PIECE_VALUES[c.piece] || 0), 0);
        return sum("w") - sum("b");
      },
    }),
    {
      name: "game-ui-v3", // ⬅️ bump version
      storage: createJSONStorage(() => sessionStorage),

      /**
       * ❗️On NE persiste plus rien lié à la session de jeu.
       * Laisse vide pour empêcher de restaurer currentRoomId/isInGame/etc.
       */
      partialize: (_s) => ({}),

      version: 3,
      migrate: (persistedState, version) => {
        // Purge toute vieille forme persistée (v1/v2) qui contenait la session
        if (!persistedState) return persistedState;
        if (version < 3) {
          return {}; // on jette tout l'ancien snapshot
        }
        return persistedState;
      },
    }
  )
);
