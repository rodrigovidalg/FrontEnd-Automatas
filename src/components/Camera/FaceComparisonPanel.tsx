import React, { useState, useRef, useEffect } from 'react';

interface PhotoData {
  image: string;
  path: string;
  base64: string;
}

interface ComparisonResult {
  success: boolean;
  similarity: number;
  message: string;
  faceA?: string;
  faceB?: string;
}

const FaceComparisonApp: React.FC = () => {
  const [photoA, setPhotoA] = useState<PhotoData | null>(null);
  const [photoB, setPhotoB] = useState<PhotoData | null>(null);
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
  const [isComparingA, setIsComparingA] = useState(false);
  const [isComparingB, setIsComparingB] = useState(false);
  const [activeCamera, setActiveCamera] = useState<'A' | 'B' | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceA, setSelectedDeviceA] = useState<string>('');
  const [selectedDeviceB, setSelectedDeviceB] = useState<string>('');
  const [isComparing, setIsComparing] = useState(false);

  const videoRefA = useRef<HTMLVideoElement | null>(null);
  const videoRefB = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    getDevices();
  }, []);

  const getDevices = async () => {
    try {
      const mediaDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = mediaDevices.filter(device => device.kind === 'videoinput');
      setDevices(videoDevices);
      if (videoDevices.length > 0) {
        setSelectedDeviceA(videoDevices[0].deviceId);
        setSelectedDeviceB(videoDevices[0].deviceId);
      }
    } catch (error) {
      console.error('Error al obtener dispositivos:', error);
    }
  };

  const startCamera = async (side: 'A' | 'B', deviceId: string) => {
    try {
      const videoRef = side === 'A' ? videoRefA : videoRefB;
      if (!videoRef.current) return;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: deviceId ? { exact: deviceId } : undefined },
        audio: false
      });

      videoRef.current.srcObject = stream;
      setActiveCamera(side);
    } catch (error) {
      console.error('Error al iniciar cámara:', error);
      alert('No se pudo acceder a la cámara. Verifica los permisos.');
    }
  };

  const stopCamera = (side: 'A' | 'B') => {
    const videoRef = side === 'A' ? videoRefA : videoRefB;
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    if (activeCamera === side) {
      setActiveCamera(null);
    }
  };

  const capturePhoto = async (side: 'A' | 'B') => {
    const videoRef = side === 'A' ? videoRefA : videoRefB;
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    const imageData = canvas.toDataURL('image/jpeg', 0.9);
    
    const hasFace = await validateFace(imageData);
    
    if (!hasFace) {
      alert('No se detectó un rostro en la imagen. Por favor, intenta de nuevo.');
      return;
    }

    const photoData: PhotoData = {
      image: imageData,
      path: `capture_${side}_${Date.now()}.jpg`,
      base64: imageData.split(',')[1]
    };

    if (side === 'A') {
      setPhotoA(photoData);
      setIsComparingA(false);
    } else {
      setPhotoB(photoData);
      setIsComparingB(false);
    }

    stopCamera(side);
  };

  const validateFace = async (imageData: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(true);
      }, 500);
    });
  };

  const compareFaces = async () => {
    if (!photoA || !photoB) {
      alert('Debes capturar ambas fotografías antes de comparar.');
      return;
    }

    setComparisonResult(null);
    setIsComparing(true);

    const result = await simulateComparison(photoA.base64, photoB.base64);
    
    setIsComparing(false);
    setComparisonResult(result);

    if (result.success && result.similarity >= 70) {
      setTimeout(() => {
        setIsEditing(true);
      }, 1500);
    }
  };

  const simulateComparison = async (base64A: string, base64B: string): Promise<ComparisonResult> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const similarity = Math.floor(Math.random() * 35) + 60;
        
        resolve({
          success: similarity >= 70,
          similarity,
          message: similarity >= 70 
            ? `Verificación exitosa` 
            : `Verificación fallida`,
          faceA: base64A,
          faceB: base64B
        });
      }, 2000);
    });
  };

  const handleFileSelect = async (side: 'A' | 'B', event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const imageData = e.target?.result as string;
      
      const hasFace = await validateFace(imageData);
      if (!hasFace) {
        alert('No se detectó un rostro en la imagen seleccionada.');
        return;
      }

      const photoData: PhotoData = {
        image: imageData,
        path: file.name,
        base64: imageData.split(',')[1]
      };

      if (side === 'A') {
        setPhotoA(photoData);
      } else {
        setPhotoB(photoData);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #090B0D 0%, #51736F 100%)' }}>
      <style>
        {`
          @keyframes scan {
            0% { transform: translateY(-100%); }
            100% { transform: translateY(100vh); }
          }
          .animate-scan {
            animation: scan 2s linear infinite;
          }
        `}
      </style>

      {/* Animated background pattern */}
      <div className="fixed inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, #CCD0D9 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      {/* Header */}
      <header className="relative border-b shadow-2xl" style={{ 
        background: 'linear-gradient(90deg, rgba(102, 105, 115, 0.3) 0%, rgba(81, 115, 111, 0.3) 100%)',
        borderColor: 'rgba(81, 115, 111, 0.3)',
        backdropFilter: 'blur(20px)'
      }}>
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg" style={{
                background: 'linear-gradient(135deg, #51736F 0%, #666973 100%)',
                boxShadow: '0 10px 40px rgba(81, 115, 111, 0.4)'
              }}>
                <svg className="w-10 h-10" style={{ color: '#F2F2F2' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#F2F2F2' }}>
                  Sistema de Reconocimiento Facial
                </h1>
                <p className="text-sm mt-1" style={{ color: '#CCD0D9' }}>Universidad Mariano Gálvez - Consumo de Servicios Web</p>
              </div>
            </div>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg" style={{
              background: 'linear-gradient(135deg, #666973 0%, #51736F 100%)'
            }}>
              <span className="font-bold text-xl" style={{ color: '#F2F2F2' }}>UMG</span>
            </div>
          </div>
        </div>
      </header>

      <canvas ref={canvasRef} className="hidden" />

      {/* Main Content */}
      <main className="relative max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Panel Fotografía A */}
          <div className="transform transition-all duration-300 hover:scale-[1.02]">
            <PhotoPanel
              title="Fotografía de Referencia"
              subtitle="Imagen desde Base de Datos"
              side="A"
              photo={photoA}
              isComparing={isComparingA}
              activeCamera={activeCamera === 'A'}
              videoRef={videoRefA}
              devices={devices}
              selectedDevice={selectedDeviceA}
              onDeviceChange={(deviceId) => setSelectedDeviceA(deviceId)}
              onStartCamera={() => startCamera('A', selectedDeviceA)}
              onStopCamera={() => stopCamera('A')}
              onCapture={() => capturePhoto('A')}
              onFileSelect={(e) => handleFileSelect('A', e)}
              onToggleCamera={() => {
                if (isComparingA) {
                  stopCamera('A');
                  setIsComparingA(false);
                } else {
                  setIsComparingA(true);
                  startCamera('A', selectedDeviceA);
                }
              }}
            />
          </div>

          {/* Panel Comparación */}
          <div className="transform transition-all duration-300 hover:scale-[1.02]">
            <ComparisonPanel
              photoA={photoA}
              photoB={photoB}
              comparisonResult={comparisonResult}
              onCompare={compareFaces}
              isEditing={isEditing}
              isComparing={isComparing}
            />
          </div>

          {/* Panel Fotografía B */}
          <div className="transform transition-all duration-300 hover:scale-[1.02]">
            <PhotoPanel
              title="Fotografía de Captura"
              subtitle="Imagen en Tiempo Real"
              side="B"
              photo={photoB}
              isComparing={isComparingB}
              activeCamera={activeCamera === 'B'}
              videoRef={videoRefB}
              devices={devices}
              selectedDevice={selectedDeviceB}
              onDeviceChange={(deviceId) => setSelectedDeviceB(deviceId)}
              onStartCamera={() => startCamera('B', selectedDeviceB)}
              onStopCamera={() => stopCamera('B')}
              onCapture={() => capturePhoto('B')}
              onFileSelect={(e) => handleFileSelect('B', e)}
              onToggleCamera={() => {
                if (isComparingB) {
                  stopCamera('B');
                  setIsComparingB(false);
                } else {
                  setIsComparingB(true);
                  startCamera('B', selectedDeviceB);
                }
              }}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

interface PhotoPanelProps {
  title: string;
  subtitle: string;
  side: 'A' | 'B';
  photo: PhotoData | null;
  isComparing: boolean;
  activeCamera: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  devices: MediaDeviceInfo[];
  selectedDevice: string;
  onDeviceChange: (deviceId: string) => void;
  onStartCamera: () => void;
  onStopCamera: () => void;
  onCapture: () => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onToggleCamera: () => void;
}

const PhotoPanel: React.FC<PhotoPanelProps> = ({
  title,
  subtitle,
  photo,
  isComparing,
  activeCamera,
  videoRef,
  devices,
  selectedDevice,
  onDeviceChange,
  onCapture,
  onFileSelect,
  onToggleCamera
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="rounded-3xl border shadow-2xl overflow-hidden" style={{
      background: 'linear-gradient(135deg, rgba(102, 105, 115, 0.2) 0%, rgba(9, 11, 13, 0.8) 100%)',
      borderColor: 'rgba(81, 115, 111, 0.3)',
      backdropFilter: 'blur(20px)'
    }}>
      <div className="p-5 border-b" style={{ 
        background: 'linear-gradient(90deg, rgba(102, 105, 115, 0.3) 0%, rgba(81, 115, 111, 0.2) 100%)',
        borderColor: 'rgba(81, 115, 111, 0.2)'
      }}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h2 className="text-xl font-bold tracking-tight" style={{ color: '#F2F2F2' }}>{title}</h2>
            <p className="text-xs mt-1" style={{ color: '#CCD0D9' }}>{subtitle}</p>
          </div>
          <select
            value={selectedDevice}
            onChange={(e) => onDeviceChange(e.target.value)}
            className="text-xs rounded-xl px-3 py-2 focus:outline-none transition-all border"
            style={{ 
              backgroundColor: 'rgba(102, 105, 115, 0.5)',
              borderColor: 'rgba(81, 115, 111, 0.3)',
              color: '#F2F2F2'
            }}
          >
            {devices.map((device) => (
              <option key={device.deviceId} value={device.deviceId} style={{ backgroundColor: '#666973' }}>
                {device.label || `Cámara ${devices.indexOf(device) + 1}`}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="p-6">
        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border-2 shadow-inner group" style={{
          backgroundColor: 'rgba(9, 11, 13, 0.6)',
          borderColor: 'rgba(81, 115, 111, 0.4)'
        }}>
          {/* Scanning animation overlay */}
          {isComparing && activeCamera && (
            <div className="absolute inset-0 pointer-events-none z-10">
              <div className="absolute inset-0 animate-pulse" style={{
                background: 'linear-gradient(to bottom, rgba(81, 115, 111, 0.3), transparent)'
              }}></div>
              <div className="absolute top-0 left-0 right-0 h-1 animate-scan" style={{
                background: 'linear-gradient(to right, transparent, #51736F, transparent)'
              }}></div>
            </div>
          )}

          {isComparing && activeCamera ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {/* Face detection frame overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-4/5 h-4/5 border-4 rounded-3xl shadow-lg relative" style={{
                  borderColor: 'rgba(81, 115, 111, 0.7)',
                  boxShadow: '0 0 30px rgba(81, 115, 111, 0.5)'
                }}>
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 rounded-tl-2xl" style={{ borderColor: '#51736F' }}></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 rounded-tr-2xl" style={{ borderColor: '#51736F' }}></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 rounded-bl-2xl" style={{ borderColor: '#51736F' }}></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 rounded-br-2xl" style={{ borderColor: '#51736F' }}></div>
                </div>
              </div>
            </>
          ) : photo ? (
            <img src={photo.image} alt={title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center" style={{ color: '#666973' }}>
              <svg className="w-20 h-20 mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-sm font-medium">Sin imagen capturada</p>
              <p className="text-xs mt-1 opacity-60">Usa la cámara o carga un archivo</p>
            </div>
          )}
        </div>

        <div className="mt-6 flex gap-3 justify-center">
          {isComparing && activeCamera ? (
            <>
              <button
                onClick={onCapture}
                className="flex-1 px-5 py-3 rounded-xl font-semibold transition-all shadow-lg flex items-center justify-center gap-2"
                style={{
                  background: 'linear-gradient(135deg, #51736F 0%, #666973 100%)',
                  color: '#F2F2F2',
                  boxShadow: '0 10px 30px rgba(81, 115, 111, 0.4)'
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Capturar
              </button>
              <button
                onClick={onToggleCamera}
                className="px-5 py-3 rounded-xl font-semibold transition-all"
                style={{
                  backgroundColor: 'rgba(102, 105, 115, 0.5)',
                  color: '#F2F2F2'
                }}
              >
                ✕
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onToggleCamera}
                className="flex-1 px-5 py-3 rounded-xl font-semibold transition-all shadow-lg flex items-center justify-center gap-2"
                style={{
                  background: 'linear-gradient(135deg, #666973 0%, #51736F 100%)',
                  color: '#F2F2F2'
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Cámara
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 px-5 py-3 rounded-xl font-semibold transition-all shadow-lg flex items-center justify-center gap-2"
                style={{
                  background: 'linear-gradient(135deg, #51736F 0%, #666973 100%)',
                  color: '#F2F2F2',
                  boxShadow: '0 10px 30px rgba(81, 115, 111, 0.3)'
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Archivo
              </button>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={onFileSelect}
            className="hidden"
          />
        </div>

        <div className="mt-6 space-y-3">
          <div className="rounded-xl p-4 border" style={{
            backgroundColor: 'rgba(9, 11, 13, 0.5)',
            borderColor: 'rgba(81, 115, 111, 0.2)'
          }}>
            <label className="block text-xs font-semibold mb-2" style={{ color: '#51736F' }}>Ruta del archivo</label>
            <input
              type="text"
              value={photo?.path || ''}
              readOnly
              placeholder="Sin archivo seleccionado"
              className="w-full px-3 py-2 text-xs rounded-lg border"
              style={{
                backgroundColor: 'rgba(9, 11, 13, 0.4)',
                borderColor: 'rgba(81, 115, 111, 0.3)',
                color: '#CCD0D9'
              }}
            />
          </div>
          <div className="rounded-xl p-4 border" style={{
            backgroundColor: 'rgba(9, 11, 13, 0.5)',
            borderColor: 'rgba(81, 115, 111, 0.2)'
          }}>
            <label className="block text-xs font-semibold mb-2" style={{ color: '#51736F' }}>Base64 Preview</label>
            <textarea
              value={photo?.base64.substring(0, 120) + '...' || ''}
              readOnly
              placeholder="Sin datos disponibles"
              rows={2}
              className="w-full px-3 py-2 text-xs rounded-lg font-mono border"
              style={{
                backgroundColor: 'rgba(9, 11, 13, 0.4)',
                borderColor: 'rgba(81, 115, 111, 0.3)',
                color: '#CCD0D9'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

interface ComparisonPanelProps {
  photoA: PhotoData | null;
  photoB: PhotoData | null;
  comparisonResult: ComparisonResult | null;
  onCompare: () => void;
  isEditing: boolean;
  isComparing: boolean;
}

const ComparisonPanel: React.FC<ComparisonPanelProps> = ({
  photoA,
  photoB,
  comparisonResult,
  onCompare,
  isEditing,
  isComparing
}) => {
  return (
    <div className="rounded-3xl border shadow-2xl overflow-hidden" style={{
      background: 'linear-gradient(135deg, rgba(102, 105, 115, 0.2) 0%, rgba(9, 11, 13, 0.8) 100%)',
      borderColor: 'rgba(81, 115, 111, 0.3)',
      backdropFilter: 'blur(20px)'
    }}>
      <div className="p-5 border-b" style={{
        background: 'linear-gradient(90deg, rgba(81, 115, 111, 0.3) 0%, rgba(102, 105, 115, 0.2) 100%)',
        borderColor: 'rgba(81, 115, 111, 0.3)'
      }}>
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-3" style={{
            backgroundColor: 'rgba(81, 115, 111, 0.3)',
            border: '3px solid rgba(81, 115, 111, 0.2)'
          }}>
            <svg className="w-7 h-7" style={{ color: '#51736F' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold" style={{ color: '#F2F2F2' }}>Análisis de Comparación</h2>
          <p className="text-xs mt-1" style={{ color: '#CCD0D9' }}>Verificación biométrica facial</p>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <span className="text-xs font-bold text-center" style={{ color: '#51736F' }}>Rostro A</span>
          <span className="text-xs font-bold text-center" style={{ color: '#51736F' }}>Rostro B</span>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border-2 shadow-inner" style={{
            backgroundColor: 'rgba(9, 11, 13, 0.6)',
            borderColor: 'rgba(81, 115, 111, 0.4)'
          }}>
            {photoA ? (
              <img src={photoA.image} alt="Rostro A" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <svg className="w-12 h-12" style={{ color: '#666973' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}
          </div>
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border-2 shadow-inner" style={{
            backgroundColor: 'rgba(9, 11, 13, 0.6)',
            borderColor: 'rgba(81, 115, 111, 0.4)'
          }}>
            {photoB ? (
              <img src={photoB.image} alt="Rostro B" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <svg className="w-12 h-12" style={{ color: '#666973' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-center mb-6">
          <button
            onClick={onCompare}
            disabled={!photoA || !photoB || isComparing}
            className="px-8 py-4 rounded-2xl font-bold transition-all shadow-lg flex items-center gap-3"
            style={{
              background: photoA && photoB && !isComparing 
                ? 'linear-gradient(135deg, #51736F 0%, #666973 100%)' 
                : 'rgba(102, 105, 115, 0.3)',
              color: '#F2F2F2',
              cursor: photoA && photoB && !isComparing ? 'pointer' : 'not-allowed',
              boxShadow: photoA && photoB && !isComparing ? '0 10px 40px rgba(81, 115, 111, 0.5)' : 'none'
            }}
          >
            {isComparing ? (
              <>
                <div className="w-5 h-5 border-3 rounded-full animate-spin" style={{
                  borderColor: 'rgba(242, 242, 242, 0.3)',
                  borderTopColor: '#F2F2F2',
                  borderWidth: '3px'
                }}></div>
                Analizando...
              </>
            ) : (
              <>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Iniciar Comparación
              </>
            )}
          </button>
        </div>

        {comparisonResult && (
          <div className="rounded-2xl p-6 border-2 mb-6" style={{
            background: comparisonResult.success 
              ? 'linear-gradient(135deg, rgba(81, 115, 111, 0.3) 0%, rgba(81, 115, 111, 0.1) 100%)'
              : 'linear-gradient(135deg, rgba(204, 208, 217, 0.2) 0%, rgba(102, 105, 115, 0.2) 100%)',
            borderColor: comparisonResult.success ? 'rgba(81, 115, 111, 0.5)' : 'rgba(204, 208, 217, 0.3)'
          }}>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{
                backgroundColor: comparisonResult.success ? 'rgba(81, 115, 111, 0.4)' : 'rgba(204, 208, 217, 0.3)'
              }}>
                {comparisonResult.success ? (
                  <svg className="w-8 h-8" style={{ color: '#51736F' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8" style={{ color: '#CCD0D9' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold mb-1" style={{
                  color: comparisonResult.success ? '#F2F2F2' : '#CCD0D9'
                }}>
                  {comparisonResult.message}
                </h3>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(9, 11, 13, 0.5)' }}>
                    <div 
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${comparisonResult.similarity}%`,
                        background: comparisonResult.success 
                          ? 'linear-gradient(90deg, #51736F 0%, #666973 100%)' 
                          : 'linear-gradient(90deg, #CCD0D9 0%, #666973 100%)'
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-bold" style={{
                    color: comparisonResult.success ? '#51736F' : '#CCD0D9'
                  }}>
                    {comparisonResult.similarity}%
                  </span>
                </div>
              </div>
            </div>
            
            {comparisonResult.success && (
              <div className="rounded-xl p-4 border" style={{
                backgroundColor: 'rgba(81, 115, 111, 0.2)',
                borderColor: 'rgba(81, 115, 111, 0.4)'
              }}>
                <p className="text-sm font-medium" style={{ color: '#F2F2F2' }}>
                  ✓ Verificación biométrica completada exitosamente
                </p>
                <p className="text-xs mt-1" style={{ color: '#CCD0D9' }}>
                  El rostro coincide con los registros del sistema
                </p>
              </div>
            )}
          </div>
        )}

        {isEditing && (
          <div className="rounded-2xl p-6 text-center border-2" style={{
            background: 'linear-gradient(135deg, rgba(81, 115, 111, 0.3) 0%, rgba(81, 115, 111, 0.1) 100%)',
            borderColor: 'rgba(81, 115, 111, 0.5)'
          }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{
              backgroundColor: 'rgba(81, 115, 111, 0.4)',
              border: '4px solid rgba(81, 115, 111, 0.2)'
            }}>
              <svg className="w-10 h-10" style={{ color: '#51736F' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-lg font-bold mb-2" style={{ color: '#F2F2F2' }}>
              Acceso Autorizado
            </p>
            <p className="text-sm" style={{ color: '#CCD0D9' }}>
              Puedes proceder con la edición de foto y registro en el sistema
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mt-6">
          <div className="rounded-xl p-3 border" style={{
            backgroundColor: 'rgba(9, 11, 13, 0.5)',
            borderColor: 'rgba(81, 115, 111, 0.2)'
          }}>
            <label className="block text-xs font-semibold mb-2" style={{ color: '#51736F' }}>Ruta A</label>
            <input
              type="text"
              value={photoA?.path || ''}
              readOnly
              placeholder="Sin archivo"
              className="w-full px-2 py-1 text-xs rounded-lg border"
              style={{
                backgroundColor: 'rgba(9, 11, 13, 0.4)',
                borderColor: 'rgba(81, 115, 111, 0.3)',
                color: '#CCD0D9'
              }}
            />
          </div>
          <div className="rounded-xl p-3 border" style={{
            backgroundColor: 'rgba(9, 11, 13, 0.5)',
            borderColor: 'rgba(81, 115, 111, 0.2)'
          }}>
            <label className="block text-xs font-semibold mb-2" style={{ color: '#51736F' }}>Ruta B</label>
            <input
              type="text"
              value={photoB?.path || ''}
              readOnly
              placeholder="Sin archivo"
              className="w-full px-2 py-1 text-xs rounded-lg border"
              style={{
                backgroundColor: 'rgba(9, 11, 13, 0.4)',
                borderColor: 'rgba(81, 115, 111, 0.3)',
                color: '#CCD0D9'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FaceComparisonApp;