// src/hooks/useFaceLandmarks.ts
// Hook para obtener landmarks faciales (MediaPipe FaceMesh vía CDN).
// Yo cargo los scripts solo cuando se usan (lazy) para no inflar el bundle ni tocar tu build.
// Expongo un método estimateLandmarks(element) que me devuelve las landmarks y un bounding box.
// Está pensado para usarse con <video> en vivo o <img>/<canvas> ya renderizados.

import { useCallback, useEffect, useRef, useState } from "react";

// Tipos mínimos para no romper TS (sin instalar tipos externos)
type Landmark = { x: number; y: number; z?: number };
type FaceResult = {
  landmarks: Landmark[];      // 468 puntos
  box: { x: number; y: number; width: number; height: number }; // en pixeles del element
};

// MediaPipe (global) shims:
declare global {
  interface Window {
    FaceMesh?: any;
    drawingUtils?: any;
  }
}

const MP_FACEMESH_SRC = "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js";
const MP_SOLUTIONS_SRC = "https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js"; // opcional si usas Camera
const MP_CONTROL_SRC = "https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js"; // opcional (aquí no dibujo con utils)

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const exists = document.querySelector(`script[src="${src}"]`);
    if (exists) { resolve(); return; }
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`No se pudo cargar: ${src}`));
    document.head.appendChild(s);
  });
}

export function useFaceLandmarks() {
  const [ready, setReady] = useState(false);
  const faceMeshRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // Cargo FaceMesh + utils (por si luego quieres debug visual)
        await loadScript(MP_FACEMESH_SRC);
        await loadScript(MP_CONTROL_SRC);
        // @ts-ignore
        const FaceMesh = window.FaceMesh;
        if (!FaceMesh) throw new Error("FaceMesh no disponible");

        // Instancio FaceMesh con configuración simple
        const fm = new FaceMesh({
          locateFile: (file: string) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
        });

        fm.setOptions({
          maxNumFaces: 1,
          refineLandmarks: true, // ojos/labios más precisos
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        faceMeshRef.current = fm;
        if (!cancelled) setReady(true);
      } catch (e) {
        console.error(e);
        if (!cancelled) setReady(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  // Dado un elemento fuente (video/img/canvas), yo corro MediaPipe una vez y devuelvo landmarks + box
  const estimateLandmarks = useCallback(async (element: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement): Promise<FaceResult | null> => {
    const fm = faceMeshRef.current;
    if (!fm || !ready) return null;

    // MediaPipe FaceMesh es async via callbacks; aquí lo envuelvo en Promise para un solo frame
    const result = await new Promise<any>((resolve) => {
      fm.onResults((res: any) => resolve(res));
      fm.send({ image: element });
    });

    const multi = result?.multiFaceLandmarks as Landmark[][] | undefined;
    if (!multi || multi.length === 0) return null;

    const landmarks = multi[0];
    // Calculo una caja en pixeles del element (MediaPipe da valores normalizados [0..1])
    const xs = landmarks.map(p => p.x);
    const ys = landmarks.map(p => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const width = (element as any).videoWidth || (element as any).naturalWidth || element.clientWidth;
    const height = (element as any).videoHeight || (element as any).naturalHeight || element.clientHeight;

    return {
      landmarks: landmarks.map(p => ({ x: p.x * width, y: p.y * height, z: p.z })),
      box: { x: minX * width, y: minY * height, width: (maxX - minX) * width, height: (maxY - minY) * height },
    };
  }, [ready]);

  return { ready, estimateLandmarks };
}
