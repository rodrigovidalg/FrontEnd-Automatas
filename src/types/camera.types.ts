import { FilterOption } from '../utils/constants';

export interface CameraState {
  isActive: boolean;
  currentCamera: number;
  stream: MediaStream | null;
  filter: string;
  brightness: number;
  contrast: number;
}

// Re-exportar FilterOption para mantener compatibilidad
export type { FilterOption };