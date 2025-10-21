// src/types/effects.types.ts
// ============================================================================
// Tipos compartidos para efectos (stickers) y detección facial
// ============================================================================

/** Punto 2D en coordenadas de imagen/canvas */
export interface Point {
  x: number;
  y: number;
}

/** Caja delimitadora en coordenadas de imagen/canvas */
export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Landmarks mínimos que usamos para colocar efectos.
 * Si alguna lib devuelve más puntos, puedes mapear a estos.
 */
export interface FaceLandmarks {
  /** Bounding box general de la cara */
  box: Box;

  /** Ojo izquierdo (centro aproximado) */
  leftEye: Point;

  /** Ojo derecho (centro aproximado) */
  rightEye: Point;

  /** Punta de la nariz */
  noseTip: Point;

  /** Centro de la boca (labio superior aprox.) */
  mouth: Point;

  /** Mentón (para referencias verticales) */
  chin: Point;
}

/** Anclas soportadas para posicionar efectos respecto al rostro */
export type EffectAnchor =
  | 'forehead'   // frente (por encima de ojos) → ej. orejas
  | 'eyes'       // centrado entre ojos        → ej. gafas
  | 'nose'       // sobre la nariz             → ej. nariz perro
  | 'mouth'      // sobre boca                 → ej. bigotes
  | 'whiskers'   // bigotes (altura boca)      → ej. cat-whiskers
  | 'full';      // cubre gran parte del rostro

/**
 * Parámetros de posicionamiento relativos a la cara.
 * - scale: multiplicador del ancho de la cara usado como base.
 * - xOffset/yOffset: desplazamientos relativos (0.1 = 10% del ancho/alto cara).
 * - maxWidthRatio/HeightRatio: límites respecto al tamaño de la cara.
 */
export interface EffectPosition {
  anchor: EffectAnchor;
  scale: number;
  xOffset?: number;
  yOffset?: number;
  maxWidthRatio?: number;
  maxHeightRatio?: number;
}

/** Definición de un efecto disponible en el UI. PNG con transparencia. */
export interface Effect {
  id: string;
  name: string;
  src: string;              // /public/stickers/...
  position: EffectPosition; // heurística por defecto
}
