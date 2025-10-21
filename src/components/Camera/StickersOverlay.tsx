// src/components/Camera/StickersOverlay.tsx
// Componente que dibuja stickers (PNG con transparencia) en un canvas overlay,
// posicionados según landmarks (orejas, bigotes, nariz, etc.).
// Yo expongo un método exportWithEffects() para que CameraModal capture con los efectos ya pintados.

import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from "react";

type Landmark = { x: number; y: number; z?: number };

export type StickerKind = "bunnyEars" | "catWhiskers" | "dogNose";

export interface StickersOverlayHandle {
  resizeTo(width: number, height: number): void;
  render(landmarks: Landmark[] | null): void;
  exportWithEffects(baseElement: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement): string; // dataURL
}

interface Props {
  active: StickerKind[];                 // stickers activos
  assets?: Partial<Record<StickerKind, string>>; // paths opcionales
}

const DEFAULT_ASSETS: Record<StickerKind, string> = {
  bunnyEars: "/stickers/bunny-ears.png",
  catWhiskers: "/stickers/cat-whiskers.png",
  dogNose: "/stickers/dog-nose.png",
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`No pude cargar ${src}`));
    img.src = src;
  });
}

export const StickersOverlay = forwardRef<StickersOverlayHandle, Props>(function StickersOverlay(
  { active, assets },
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  const assetPaths = useMemo(() => ({ ...DEFAULT_ASSETS, ...(assets || {}) }), [assets]);

  // Cargo imágenes solo una vez
  const imagesRef = useRef<Partial<Record<StickerKind, HTMLImageElement>>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        for (const k of Object.keys(assetPaths) as StickerKind[]) {
          if (imagesRef.current[k]) continue;
          const img = await loadImage(assetPaths[k]!);
          if (!cancelled) imagesRef.current[k] = img;
        }
      } catch (e) {
        console.error("Error cargando stickers:", e);
      }
    })();
    return () => { cancelled = true; };
  }, [assetPaths]);

  useEffect(() => {
    if (!canvasRef.current) return;
    ctxRef.current = canvasRef.current.getContext("2d");
  }, []);

  // Helpers de geometría usando índices FaceMesh (468 pts)
  const point = (lm: Landmark[], idx: number) => lm[idx];
  // Ojos: 33 (izq), 263 (der) — distancia útil para escala
  // Entrecejo: 168
  // Nariz: 1
  // Sienes: 127 (izq), 356 (der) — para ancho de orejas
  const eyeDistance = (lm: Landmark[]) => {
    const L = point(lm, 33), R = point(lm, 263);
    return Math.hypot(R.x - L.x, R.y - L.y);
  };

  // Render básico: limpio canvas y pinto stickers seleccionados
  const render = (landmarks: Landmark[] | null) => {
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!landmarks || active.length === 0) return;

    const distEyes = eyeDistance(landmarks);

    for (const kind of active) {
      const img = imagesRef.current[kind];
      if (!img) continue;

      switch (kind) {
        case "bunnyEars": {
          // Coloco orejas arriba del entrecejo (168) y ancho según distancia sien-sien
          const brow = point(landmarks, 168);
          const templeL = point(landmarks, 127);
          const templeR = point(landmarks, 356);
          const width = Math.hypot(templeR.x - templeL.x, templeR.y - templeL.y) * 1.4;
          const height = width; // orejas casi cuadradas
          const x = brow.x - width / 2;
          const y = Math.min(brow.y, templeL.y, templeR.y) - height * 0.9;
          ctx.drawImage(img, x, y, width, height);
          break;
        }
        case "catWhiskers": {
          // Bigotes centrados en la nariz (1), ancho relativo a distEyes
          const nose = point(landmarks, 1);
          const w = distEyes * 2.0;
          const h = distEyes * 0.7;
          const x = nose.x - w / 2;
          const y = nose.y - h / 2 + distEyes * 0.2;
          ctx.drawImage(img, x, y, w, h);
          break;
        }
        case "dogNose": {
          // Nariz perrito centrada en nariz (1), tamaño pequeño
          const nose = point(landmarks, 1);
          const w = distEyes * 0.8;
          const h = distEyes * 0.6;
          const x = nose.x - w / 2;
          const y = nose.y - h / 2;
          ctx.drawImage(img, x, y, w, h);
          break;
        }
      }
    }
  };

  // Exporto un PNG del frame base + overlay de stickers
  const exportWithEffects = (baseElement: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement) => {
    const w = (baseElement as any).videoWidth || (baseElement as any).naturalWidth || (baseElement as HTMLCanvasElement).width;
    const h = (baseElement as any).videoHeight || (baseElement as any).naturalHeight || (baseElement as HTMLCanvasElement).height;
    const out = document.createElement("canvas");
    out.width = w;
    out.height = h;
    const octx = out.getContext("2d")!;

    // Dibujo frame base
    octx.drawImage(baseElement as any, 0, 0, w, h);
    // Dibujo overlay ya preparado (lo reescaleo si el overlay es distinto en tamaño)
    if (canvasRef.current) {
      octx.drawImage(canvasRef.current, 0, 0, w, h);
    }
    return out.toDataURL("image/png");
  };

  const resizeTo = (width: number, height: number) => {
    if (!canvasRef.current) return;
    canvasRef.current.width = width;
    canvasRef.current.height = height;
  };

  useImperativeHandle(ref, () => ({ render, exportWithEffects, resizeTo }), []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
      }}
    />
  );
});
