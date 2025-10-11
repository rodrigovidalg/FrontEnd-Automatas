// src/services/facialAuthService.ts
import { api } from './api';
import { API_ROUTES } from '../utils/constants';

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

export async function saveFaceToDB(usuarioId: string, rostroBase64: string) {
  return api(API_ROUTES.FACIAL_SAVE, {
    method: 'POST',
    body: JSON.stringify({ UsuarioId: usuarioId, RostroBase64: rostroBase64 }),
    auth: true, // si tu api.ts ya inserta Authorization cuando auth:true
  });
}

export async function faceLogin(base64Raw: string) {
  return api(API_ROUTES.FACIAL_LOGIN, {
    method: 'POST',
    body: JSON.stringify({ RostroBase64: base64Raw }),
  });
}
