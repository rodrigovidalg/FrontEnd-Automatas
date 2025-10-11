import { useState, useRef, useCallback, useEffect } from 'react';
import { CameraState } from '../types/camera.types';

export const useCamera = () => {
  const [cameraState, setCameraState] = useState<CameraState>({
    isActive: false,
    currentCamera: 0,
    stream: null,
    filter: 'normal',
    brightness: 100,
    contrast: 100
  });
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const currentVideoId = useRef<string>('');
  
  const startCamera = useCallback(async (videoElementId: string) => {
    try {
      // Detener el stream anterior si existe
      if (cameraState.stream) {
        cameraState.stream.getTracks().forEach(track => track.stop());
      }
      
      const constraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: cameraState.currentCamera === 0 ? 'user' : 'environment'
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      const video = document.getElementById(videoElementId) as HTMLVideoElement;
      
      if (video) {
        video.srcObject = stream;
        currentVideoId.current = videoElementId;
        
        await new Promise<void>((resolve, reject) => {
          video.onloadedmetadata = () => {
            video.play()
              .then(() => resolve())
              .catch(reject);
          };
          video.onerror = () => reject(new Error('Error loading video'));
        });
      }
      
      setCameraState(prev => ({
        ...prev,
        isActive: true,
        stream
      }));
      
      return true;
    } catch (error) {
      console.error('Error accessing camera:', error);
      setCameraState(prev => ({
        ...prev,
        isActive: false,
        stream: null
      }));
      return false;
    }
  }, [cameraState.currentCamera, cameraState.stream]);
  
  const stopCamera = useCallback(() => {
    if (cameraState.stream) {
      cameraState.stream.getTracks().forEach(track => track.stop());
      
      // Limpiar el video element
      if (currentVideoId.current) {
        const video = document.getElementById(currentVideoId.current) as HTMLVideoElement;
        if (video) {
          (video as HTMLVideoElement).srcObject = null;
        }
      }
      
      setCameraState(prev => ({
        ...prev,
        isActive: false,
        stream: null
      }));
      
      currentVideoId.current = '';
    }
  }, [cameraState.stream]);
  
  const switchCamera = useCallback(async () => {
    const currentVideoElementId = currentVideoId.current;
    
    // Cambiar la cámara
    setCameraState(prev => ({
      ...prev,
      currentCamera: prev.currentCamera === 0 ? 1 : 0
    }));
    
    // Si hay una cámara activa, reiniciarla con la nueva configuración
    if (cameraState.isActive && currentVideoElementId) {
      setTimeout(async () => {
        await startCamera(currentVideoElementId);
      }, 100);
    }
  }, [cameraState.isActive, startCamera]);
  
  const applyFilter = useCallback((filter: string) => {
    setCameraState(prev => ({
      ...prev,
      filter
    }));
  }, []);
  
  const updateFilterSettings = useCallback((brightness: number, contrast: number) => {
    setCameraState(prev => ({
      ...prev,
      brightness,
      contrast
    }));
  }, []);
  
  const capturePhoto = useCallback((): string | null => {
    if (!currentVideoId.current) return null;
    
    const video = document.getElementById(currentVideoId.current) as HTMLVideoElement;
    if (!video) return null;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return null;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Aplicar filtros
    ctx.filter = `brightness(${cameraState.brightness}%) contrast(${cameraState.contrast}%)`;
    
    // Dibujar la imagen del video en el canvas
    ctx.drawImage(video, 0, 0);
    
    // Convertir a base64 (dataURL)
    return canvas.toDataURL('image/jpeg', 0.9);
  }, [cameraState.brightness, cameraState.contrast]);
  
  // Limpiar el stream cuando el componente se desmonte
  useEffect(() => {
    return () => {
      if (cameraState.stream) {
        cameraState.stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraState.stream]);
  
  return {
    cameraState,
    startCamera,
    stopCamera,
    switchCamera,
    applyFilter,
    updateFilterSettings,
    capturePhoto,
    videoRef
  };
};

/** Helper: convierte dataURL -> base64 (sin prefijo) */
export const dataUrlToBase64 = (d: string) => {
  const i = d.indexOf(',');
  return i >= 0 ? d.slice(i + 1) : d;
};
