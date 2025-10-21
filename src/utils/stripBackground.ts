// src/utils/stripBackground.ts
// -----------------------------------------------------------------------------
// Quita el "checkerboard" (fondo ajedrezado) de un PNG si éste fue guardado
// por error SIN canal alfa real. Mantiene colores del sticker y solo hace
// transparentes los píxeles que coinciden (dentro de una tolerancia) con los
// dos tonos del patrón de fondo.
// -----------------------------------------------------------------------------

/** Distancia euclídea simple entre 2 colores RGB */
function dist([r1, g1, b1]: number[], [r2, g2, b2]: number[]) {
  const dr = r1 - r2, dg = g1 - g2, db = b1 - b2;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

/** Toma muestras de color en las 4 esquinas para detectar los dos colores del patrón */
function sampleCorners(img: HTMLImageElement | HTMLCanvasElement) {
  const w = (img as HTMLImageElement).width || (img as HTMLCanvasElement).width;
  const h = (img as HTMLImageElement).height || (img as HTMLCanvasElement).height;

  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const cx = c.getContext('2d')!;
  cx.drawImage(img as any, 0, 0);

  const pick = (x: number, y: number) => {
    const d = cx.getImageData(x, y, 1, 1).data;
    return [d[0], d[1], d[2]];
  };

  // Muestras en varias esquinas/bordes
  const samples = [
    pick(2, 2),
    pick(w - 3, 2),
    pick(2, h - 3),
    pick(w - 3, h - 3),
    pick(Math.floor(w * 0.33), 2),
    pick(Math.floor(w * 0.66), 2),
  ];

  // Agrupamos en 2 centros (k=2) de forma muy simple
  let c1 = samples[0], c2 = samples[1];
  for (let i = 0; i < 6; i++) {
    const s = samples[i];
    if (dist(s, c1) < dist(s, c2)) c1 = s; else c2 = s;
  }
  return { c1, c2, canvas: c, ctx: cx };
}

/**
 * Devuelve un canvas con el mismo sticker pero con el fondo ajedrezado
 * hecho transparente. Si el PNG ya venía con alfa correcto, no modifica nada.
 *
 * @param src ruta del sticker (PNG)
 * @param tolerance tolerancia de color (10–40 suele ir bien)
 */
export async function loadStickerWithoutBG(src: string, tolerance = 24): Promise<HTMLCanvasElement> {
  // Cargar imagen
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const im = new Image();
    im.crossOrigin = 'anonymous';
    im.onload = () => resolve(im);
    im.onerror = reject;
    im.src = src;
  });

  const w = img.naturalWidth, h = img.naturalHeight;

  const off = document.createElement('canvas');
  off.width = w; off.height = h;
  const ctx = off.getContext('2d', { willReadFrequently: true })!;
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0);

  // Si ya hay alfa real (hay píxeles con alpha < 255), no hacemos nada.
  const probe = ctx.getImageData(0, 0, Math.min(32, w), Math.min(32, h)).data;
  let hasAlpha = false;
  for (let i = 3; i < probe.length; i += 4) {
    if (probe[i] < 255) { hasAlpha = true; break; }
  }
  if (hasAlpha) return off;

  // Detectar dos colores del checkerboard y eliminarlo por tolerancia
  const { c1, c2 } = sampleCorners(img);
  const data = ctx.getImageData(0, 0, w, h);
  const px = data.data;

  for (let i = 0; i < px.length; i += 4) {
    const r = px[i], g = px[i + 1], b = px[i + 2];
    const d1 = dist([r, g, b], c1 as number[]);
    const d2 = dist([r, g, b], c2 as number[]);
    if (Math.min(d1, d2) <= tolerance) {
      // Píxel de fondo → hacer transparente
      px[i + 3] = 0;
    }
  }
  ctx.putImageData(data, 0, 0);
  return off;
}
