// src/services/facialAuthService.ts
import { api } from './api';
import { API_ROUTES } from '../utils/constants';

/**
 * SEGMENTACIÓN — ya existía (no tocar)
 */
export async function segmentFace(base64Raw: string) {
  const j = await api(API_ROUTES.FACIAL_SEGMENT, {
    method: 'POST',
    body: JSON.stringify({ RostroBase64: base64Raw }),
  });

  // Acepta nombres alternos que podría devolver tu API
  const rostro: string =
    j.rostro || j.rostroSegmentado || j.RostroSegmentado || j.imagen || j.Image;

  if (!rostro) throw new Error('Respuesta sin imagen segmentada');
  return rostro; // base64 SIN prefijo data:
}

/**
 * GUARDAR EN BD — ya existía (no tocar)
 */
export async function saveFaceToDB(usuarioId: string, rostroBase64: string) {
  return api(API_ROUTES.FACIAL_SAVE, {
    method: 'POST',
    body: JSON.stringify({ UsuarioId: usuarioId, RostroBase64: rostroBase64 }),
    auth: true, // si tu api.ts ya inserta Authorization cuando auth:true
  });
}

/**
 * LOGIN FACIAL — ya existía (no tocar)
 */
export async function faceLogin(base64Raw: string) {
  return api(API_ROUTES.FACIAL_LOGIN, {
    method: 'POST',
    body: JSON.stringify({ RostroBase64: base64Raw }),
  });
}

/* ============================================================
 * NUEVO: utilidades para leer/limpiar imágenes pendientes
 * ============================================================
 * - pendingFaceB64:   rostro SEGMENTADO (guardar BD)
 * - pendingCardFaceB64: foto CON EFECTOS (para carnet)
 */

export function getPendingFaceB64(): string | null {
  return localStorage.getItem('pendingFaceB64');
}

export function getPendingCardFaceB64(): string | null {
  return localStorage.getItem('pendingCardFaceB64');
}

/**
 * Limpia uno o ambos valores pendientes del localStorage
 */
export function clearPendingFaces(opts?: { face?: boolean; card?: boolean }) {
  const { face = true, card = true } = opts || {};
  if (face) localStorage.removeItem('pendingFaceB64');
  if (card) localStorage.removeItem('pendingCardFaceB64');
}

/* ============================================================
 * NUEVO: sendCardNow — wrapper defensivo
 * ============================================================
 * Algunos backends aceptan POST sin body; otros esperan {UsuarioId}.
 * Yo intento con body y, si falla con 4xx típico, reintento sin body.
 */

export async function sendCardNow(usuarioId?: string) {
  // intento #1: con body (más explícito)
  try {
    return await api(API_ROUTES.SEND_CARD_NOW, {
      method: 'POST',
      body: usuarioId ? JSON.stringify({ UsuarioId: usuarioId }) : undefined,
      auth: true,
    });
  } catch (e: any) {
    // Si el back no acepta body o formato → intento sin body
    const msg = (e?.message || '').toLowerCase();
    const isFormatErr = msg.includes('415') || msg.includes('unsupported') || msg.includes('bad request') || msg.includes('400');
    if (!isFormatErr) throw e;

    // intento #2: sin body
    return api(API_ROUTES.SEND_CARD_NOW, {
      method: 'POST',
      auth: true,
    });
  }
}

/* ============================================================
 * NUEVO (core): sendCardWithOptionalEffects
 * ============================================================
 * Orquesta el flujo:
 *  1) Lee pendingFaceB64 (requerido). Si no hay, lanza error claro.
 *  2) Si hay pendingCardFaceB64 (opcional):
 *      - Sube temporalmente la foto con efectos.
 *      - Invoca sendCardNow().
 *      - Restaura el segmentado en BD.
 *  3) Si NO hay pendingCardFaceB64:
 *      - Simplemente invoca sendCardNow().
 *
 * No borro nada del storage por default (para que el flujo siguiente pueda reutilizar),
 * pero dejo flags para limpiar si lo deseas.
 */

export async function sendCardWithOptionalEffects(options: {
  usuarioId: string;
  clearAfter?: boolean; // si true → limpia ambos pending* al terminar OK
}) {
  const { usuarioId, clearAfter = false } = options;

  // 1) Segmentado es obligatorio (BD debe quedar con esta foto)
  const segmentedB64 = getPendingFaceB64();
  if (!segmentedB64) {
    throw new Error(
      'No hay pendingFaceB64. Captura y guarda desde la cámara (segmentación) antes de enviar el carnet.'
    );
  }

  // 2) Con efectos es opcional (para carnet)
  const withFxB64 = getPendingCardFaceB64();

  if (withFxB64) {
    // a) Subo temporalmente efectos
    await saveFaceToDB(usuarioId, withFxB64);
    // b) Envío el carnet (PDF/QR) con la foto con efectos
    await sendCardNow(usuarioId);
    // c) Restaura la foto segmentada en BD (estado deseado)
    await saveFaceToDB(usuarioId, segmentedB64);
  } else {
    // Sin efectos: solo envío el carnet
    await sendCardNow(usuarioId);
  }

  // 3) Limpieza opcional
  if (clearAfter) clearPendingFaces();
}
