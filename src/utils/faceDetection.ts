// src/utils/faceDetection.ts
// ============================================================================
// Detección facial usando @vladmandic/face-api (si está disponible) + fallback
// - Carga perezosa de modelos
// - Obtención de landmarks mínimos (ojos, nariz, boca, mentón)
// - Utilidades para calcular la colocación del efecto (x, y, w, h)
// ============================================================================

import * as faceapi from '@vladmandic/face-api';
import { FaceLandmarks, Effect, Box, Point } from '../types/effects.types';

let modelsLoaded = false;

// Coloca los modelos de face-api en /public/models
const DEFAULT_MODELS_URL = '/models';

/** Carga de modelos de forma segura (una sola vez). */
export async function loadFaceModels(modelsUrl: string = DEFAULT_MODELS_URL) {
  if (modelsLoaded) return;
  try {
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(modelsUrl),
      faceapi.nets.faceLandmark68TinyNet.loadFromUri(modelsUrl),
    ]);
    modelsLoaded = true;
  } catch (e) {
    // Si falla, continuamos con fallback heurístico
    console.warn('[faceDetection] No se pudieron cargar los modelos:', e);
    modelsLoaded = false;
  }
}

/** Convierte la salida de face-api a nuestro formato mínimo. */
function toMinimalLandmarks(
  detection: faceapi.WithFaceLandmarks<{ detection: faceapi.FaceDetection }, faceapi.FaceLandmarks68>
): FaceLandmarks {
  const box = detection.detection.box as unknown as Box;

  const lm = detection.landmarks;
  // puntos claves
  const leftEyePts = lm.getLeftEye();
  const rightEyePts = lm.getRightEye();
  const nosePts = lm.getNose();
  const mouthPts = lm.getMouth();
  const jawPts = lm.getJawOutline();

  const avg = (pts: Point[]) => {
    const s = (pts as any).reduce(
      (a: Point, p: Point) => ({ x: a.x + p.x, y: a.y + p.y }),
      { x: 0, y: 0 }
    );
    return { x: s.x / pts.length, y: s.y / pts.length };
  };

  const leftEye = avg(leftEyePts as unknown as Point[]);
  const rightEye = avg(rightEyePts as unknown as Point[]);
  const noseTip = nosePts[nosePts.length - 1] as unknown as Point; // punta
  const mouth = avg(mouthPts as unknown as Point[]);
  const chin = jawPts[jawPts.length - 1] as unknown as Point;

  return { box, leftEye, rightEye, noseTip, mouth, chin };
}

/**
 * Detección de una sola cara y landmarks.
 * Si no hay modelos o falla la detección, devolvemos un fallback estable.
 */
export async function detectLandmarks(
  input: HTMLImageElement | HTMLCanvasElement
): Promise<FaceLandmarks> {
  // Fallback: caja centrada y puntos relativos
  const fallback = (): FaceLandmarks => {
    const w = (input as any).width;
    const h = (input as any).height;
    const box: Box = { x: w * 0.225, y: h * 0.18, width: w * 0.55, height: h * 0.65 };
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height * 0.5;
    return {
      box,
      leftEye: { x: cx - box.width * 0.18, y: box.y + box.height * 0.38 },
      rightEye: { x: cx + box.width * 0.18, y: box.y + box.height * 0.38 },
      noseTip: { x: cx, y: box.y + box.height * 0.58 },
      mouth: { x: cx, y: box.y + box.height * 0.70 },
      chin: { x: cx, y: box.y + box.height * 0.98 },
    };
  };

  try {
    if (!modelsLoaded) await loadFaceModels();

    if (modelsLoaded) {
      const detection = await faceapi
        .detectSingleFace(
          input,
          new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.4 })
        )
        .withFaceLandmarks(true);

      if (detection) {
        return toMinimalLandmarks(detection);
      }
    }
    return fallback();
  } catch (e) {
    console.warn('[faceDetection] detectLandmarks fallback:', e);
    return fallback();
  }
}

/**
 * Calcula (x, y, w, h) para un efecto, manteniendo proporciones del sticker.
 * - x,y devueltos son el **centro** donde dibujar la imagen.
 * - w,h son el tamaño final en píxeles del sticker.
 * - `naturalAR` = (ancho natural PNG / alto natural PNG).
 */
export function computeEffectPlacement(
  effect: Effect,
  landmarks: FaceLandmarks,
  naturalAR: number
): { x: number; y: number; w: number; h: number } {
  const { box, leftEye, rightEye, noseTip, mouth } = landmarks;

  const faceWidth = box.width;
  let w = faceWidth * effect.position.scale;
  if (effect.position.maxWidthRatio) {
    w = Math.min(w, faceWidth * effect.position.maxWidthRatio);
  }
  let h = w / Math.max(naturalAR, 0.0001);
  if (effect.position.maxHeightRatio) {
    h = Math.min(h, box.height * effect.position.maxHeightRatio);
    w = h * naturalAR;
  }

  // Centro por ancla
  let x = box.x + box.width / 2;
  let y = box.y + box.height / 2;

  switch (effect.position.anchor) {
    case 'forehead': {
      const eyeY = (leftEye.y + rightEye.y) / 2;
      x = (leftEye.x + rightEye.x) / 2;
      y = eyeY - box.height * 0.28;
      break;
    }
    case 'eyes': {
      x = (leftEye.x + rightEye.x) / 2;
      y = (leftEye.y + rightEye.y) / 2;
      break;
    }
    case 'nose': {
      x = noseTip.x;
      y = noseTip.y;
      break;
    }
    case 'mouth':
    case 'whiskers': {
      x = mouth.x;
      y = mouth.y;
      break;
    }
    case 'full': {
      x = box.x + box.width / 2;
      y = box.y + box.height / 2;
      break;
    }
  }

  // Offsets relativos a la cara (si existen)
  if (effect.position.xOffset) x += faceWidth * effect.position.xOffset;
  if (effect.position.yOffset) y += box.height * effect.position.yOffset;

  return { x, y, w, h };
}
