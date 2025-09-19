// frontend/src/components/CapturedStrip.jsx
import React, { useMemo } from "react";
import { useGameUiStore } from "../store/useGameUiStore";

const glyph = { p:'♟', n:'♞', b:'♝', r:'♜', q:'♛' };
const order = ['q','r','b','n','p'];

export default function CapturedStrip() {
  const captures = useGameUiStore((s) => s.captures);

  const wCounts = useMemo(() => {
    const m = {};
    (captures?.w || []).forEach(c => { m[c.piece] = (m[c.piece]||0) + 1; });
    return m;
  }, [captures]);

  const bCounts = useMemo(() => {
    const m = {};
    (captures?.b || []).forEach(c => { m[c.piece] = (m[c.piece]||0) + 1; });
    return m;
  }, [captures]);

  if (!(Object.keys(wCounts).length || Object.keys(bCounts).length)) return null;

  const Row = ({ title, counts }) => (
    <div className="flex items-center gap-2">
      <span className="text-[10px] uppercase text-gray-600">{title}</span>
      <div className="flex gap-1 text-sm">
        {order.filter(k => counts[k]).map(k => (
          <span key={k} className="px-2 py-0.5 rounded bg-white/70 backdrop-blur shadow-sm">
            {glyph[k]}{counts[k] > 1 ? `×${counts[k]}` : ""}
          </span>
        ))}
      </div>
    </div>
  );

  return (
    // 🔒 caché sur mobile, visible à partir de md
    <div className="hidden md:flex fixed left-4 bottom-4 z-40 p-2 rounded-2xl bg-white/40 backdrop-blur-sm shadow
                    flex-col gap-1 text-black">
      {Object.keys(wCounts).length ? <Row title="BLANCS" counts={wCounts} /> : null}
      {Object.keys(bCounts).length ? <Row title="NOIRS" counts={bCounts} /> : null}
    </div>
  );
}
