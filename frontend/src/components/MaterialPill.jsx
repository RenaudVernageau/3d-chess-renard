import React from "react";
import { useGameUiStore } from "../store/useGameUiStore";

export default function MaterialPill({ className = "" }) {
  const diff = useGameUiStore((s) => s.materialDiff());
  if (!diff) return null;

  const label = diff > 0 ? `+${diff} Blancs` : `+${-diff} Noirs`;

  return (
    <span
      className={
        "material-pill inline-flex items-center w-auto max-w-max whitespace-nowrap " + // <-- anti-bandeau
        "rounded-full px-3 py-1 text-sm font-medium " +
        "text-gray-900 bg-white/70 backdrop-blur shadow " +
        className
      }
      aria-label={`Material advantage ${label}`}
    >
      {label}
    </span>
  );
}
