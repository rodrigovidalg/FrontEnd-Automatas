// src/components/Camera/FilterControls.tsx
// Versión simplificada: solo brillo y contraste.
// Si tu código lo renderiza aparte, lo dejo desacoplado.

import React from "react";

interface Props {
  brightness: number;           // 50..150
  contrast: number;             // 50..150
  onBrightness(v: number): void;
  onContrast(v: number): void;
}

export default function FilterControls({ brightness, contrast, onBrightness, onContrast }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium">Brillo: {brightness}%</label>
        <input
          type="range"
          min={50}
          max={150}
          step={1}
          value={brightness}
          onChange={e => onBrightness(parseInt(e.target.value))}
          className="w-full"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Contraste: {contrast}%</label>
        <input
          type="range"
          min={50}
          max={150}
          step={1}
          value={contrast}
          onChange={e => onContrast(parseInt(e.target.value))}
          className="w-full"
        />
      </div>
    </div>
  );
}
