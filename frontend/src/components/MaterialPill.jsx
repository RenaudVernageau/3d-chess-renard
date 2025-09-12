// frontend/src/components/MaterialPill.jsx
import React from "react";
import { useGameUiStore } from "../store/useGameUiStore";

export default function MaterialPill() {
  const diff = useGameUiStore((s) => s.materialDiff());

  if (!diff) return null; // caché si égalité
  const label = diff > 0 ? `+${diff} White` : `+${-diff} Black`;

  return (
    <div
      className="fixed left-4 top-4 z-40 select-none rounded-full px-3 py-1
                 text-sm font-medium text-gray-900 bg-white/70 backdrop-blur shadow"
      aria-label={`Material advantage ${label}`}
    >
      {label}
    </div>
  );
}
