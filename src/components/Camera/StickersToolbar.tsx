// src/components/Camera/StickersToolbar.tsx
// Barra simple para activar/desactivar stickers. Yo la hago como checkboxes para poder combinar.
// Si quieres dejar uno a la vez, cámbialo a radio-buttons.

import React from "react";
import type { StickerKind } from "./StickersOverlay";

interface Props {
  value: StickerKind[];
  onChange(value: StickerKind[]): void;
}

const ALL: { key: StickerKind; label: string }[] = [
  { key: "bunnyEars", label: "Orejas de conejo" },
  { key: "catWhiskers", label: "Bigotes de gato" },
  { key: "dogNose", label: "Nariz de perro" },
];

export function StickersToolbar({ value, onChange }: Props) {
  const toggle = (k: StickerKind) => {
    if (value.includes(k)) onChange(value.filter(v => v !== k));
    else onChange([...value, k]);
  };

  return (
    <div className="flex gap-3 items-center flex-wrap">
      {ALL.map(it => (
        <label key={it.key} className="flex items-center gap-1 cursor-pointer">
          <input
            type="checkbox"
            checked={value.includes(it.key)}
            onChange={() => toggle(it.key)}
          />
          <span>{it.label}</span>
        </label>
      ))}
    </div>
  );
}
