import { useState, useRef, useCallback } from 'react';
import { CameraState } from '../types/user.types';

export const useCamera = () => {
  const [cameraState, setCameraState] = useState<CameraState>({
    stream: null,
    currentCamera: 0,
    isActive: false
  });
  
  const videoRef = useRef<HTMLVideoElement>(null);

  const startCamera = useCallback(async (videoElement?: HTMLVideoElement | null) => {
    try {
      // Detener cámara actual si existe
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
      
      setCameraState(prev => ({
        ...prev,
        stream,
        isActive: true
      }));

      const targetVideo = videoElement || videoRef.current;
      if (targetVideo) {
        targetVideo.srcObject = stream;
        
        // Manejar el error de play() interrumpido
        try {
          await targetVideo.play();
        } catch (error) {
          console.warn('Video play was interrupted:', error);
          // Reintentar después de un breve delay
          setTimeout(() => {
            if (targetVideo.paused) {
              targetVideo.play().catch(e => console.warn('Retry play failed:', e));
            }
          }, 100);
        }
      }

      return stream;
    } catch (error) {
      console.error('Error starting camera:', error);
      throw error;
    }
  }, [cameraState.currentCamera, cameraState.stream]);

  const stopCamera = useCallback(() => {
    if (cameraState.stream) {
      cameraState.stream.getTracks().forEach(track => {
        track.stop();
      });
      setCameraState(prev => ({
        ...prev,
        stream: null,
        isActive: false
      }));
    }
  }, [cameraState.stream]);

  const switchCamera = useCallback(async () => {
    stopCamera();
    setCameraState(prev => ({
      ...prev,
      currentCamera: prev.currentCamera === 0 ? 1 : 0
    }));
    
    await new Promise(resolve => setTimeout(resolve, 100));
    return startCamera();
  }, [stopCamera, startCamera]);

  const capturePhoto = useCallback((videoElement: HTMLVideoElement): string => {
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(videoElement, 0, 0);
    
    return canvas.toDataURL('image/jpeg', 0.9);
  }, []);

  return {
    cameraState,
    videoRef,
    startCamera,
    stopCamera,
    switchCamera,
    capturePhoto
  };
};