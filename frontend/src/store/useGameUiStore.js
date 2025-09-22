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
      hasQuit: false,         // ← NEW: indicateur qu’on a explicitement quitté

      // Captures locales (par convention: 'w' = blancs, 'b' = noirs → le côté QUI CAPTURE)
      // item: { piece:'p|n|b|r|q', by:'w|b', at:number, from?:string, to?:string }
      captures: { w: [], b: [] },

      // --- Nonce pour forcer un rerender des UIs liées à la session ---
      sessionNonce: 0,

      // --- Setters sûrs ---
      /**
       * Setter centralisé pour la room.
       * - Si la room change et qu'on ne demande pas explicitement de conserver, on reset les captures.
       * - En (re)entrant dans une room, on remet hasQuit à false.
       */
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

      /**
       * setGameUi: patch utilisateur.
       * - Si currentRoomId change ici, on reset les captures (sauf opts.keepCaptures).
       * - Si on fournit un currentRoomId truthy, on remet hasQuit à false.
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
            hasQuit: !!partial.currentRoomId ? false : get().hasQuit,
          });
        } else {
          // Si on passe un currentRoomId truthy dans partial, on annule hasQuit
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
       * - Purge les traces persistées susceptibles d'afficher la session (roomId, flags temporaires)
       * - Bump sessionNonce pour forcer le rerender des composants abonnés (NavBar)
       * - Marque hasQuit = true pour bloquer tout auto-rejoin
       */
      leaveGame: () => {
        try {
          localStorage.removeItem("ignoreRoomEventsUntil");
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

      // Différentiel de matériel: (points BLANCS) - (points NOIRS)
      materialDiff: () => {
        const { captures } = get();
        const sum = (side) =>
          (captures[side] || []).reduce((acc, c) => acc + (PIECE_VALUES[c.piece] || 0), 0);
        return sum("w") - sum("b");
      },
    }),
    {
      name: "game-ui-v2",
      storage: createJSONStorage(() => sessionStorage),
      version: 2,
      partialize: (s) => ({
        currentRoomId: s.currentRoomId,
        myColor: s.myColor,
        players: s.players,
        isInGame: s.isInGame,
        captures: s.captures,
        // on NE persiste PAS hasQuit ni sessionNonce
      }),
      migrate: (persistedState, version) => {
        if (!persistedState) return persistedState;
        if (version < 2) {
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
