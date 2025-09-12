import React from "react";
import { useGameUiStore } from "../store/useGameUiStore";

export default function MaterialPill() {
  const diff = useGameUiStore((s) => s.materialDiff());
  if (!diff) return null;

  const label = diff > 0 ? `+${diff} Blancs` : `+${-diff} Noirs`;

  // Aligne avec le bouton "Quitter la partie" (top-2) + safe area iOS
  const topSafe = "calc(env(safe-area-inset-top, 0px) + 0.5rem)"; // 0.5rem ≈ top-2

  return (
    <div
      className="
        fixed z-40 select-none rounded-full px-3 py-1 text-sm font-medium
        text-gray-900 bg-white/70 backdrop-blur shadow
        right-2 md:right-auto md:left-4
      "
      style={{ top: topSafe }}
      aria-label={`Material advantage ${label}`}
    >
      {label}
    </div>
  );
}
