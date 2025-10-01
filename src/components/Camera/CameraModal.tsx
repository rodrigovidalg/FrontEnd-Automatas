import React from 'react';
import { FaceRecognitionFrame } from './FaceRecognitionFrame';
import { FilterControls } from './FilterControls';
import { EmojiEffects } from './EmojiEffects';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  onCapture: () => void;
  onSwitchCamera: () => void;
  currentFilter: string;
  onFilterChange: (filter: string) => void;
  onEmojiAdd: (emoji: string) => void;
}

export const CameraModal: React.FC<CameraModalProps> = ({
  isOpen,
  onClose,
  videoRef,
  onCapture,
  onSwitchCamera,
  currentFilter,
  onFilterChange,
  onEmojiAdd
}) => {
  if (!isOpen) return null;

  return (
    <div className="camera-modal fixed top-0 left-0 w-full h-full bg-white/95 backdrop-blur-xl z-50 flex justify-center items-center animate-fadeIn p-5">
      <div className="camera-container bg-white/98 backdrop-blur-xl rounded-3xl p-10 max-w-95vw max-h-95vh shadow-2xl relative border border-gray-300/30 w-full max-w-6xl">
        <div className="camera-header flex justify-between items-center mb-8 pb-6 border-b border-gray-300/30">
          <h2 className="camera-title text-2xl font-bold text-gray-900 bg-gradient-45 from-teal-500 to-gray-600 bg-clip-text text-transparent">
            Captura de Foto
          </h2>
          <button 
            className="close-btn w-10 h-10 rounded-full bg-red-50 border border-red-200 text-red-500 flex items-center justify-center text-lg transition-all duration-300 hover:bg-red-100 hover:scale-110"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="camera-workspace flex gap-10 items-start justify-center flex-col lg:flex-row">
          <div className="video-section flex flex-col items-center gap-6">
            <div className="video-container relative w-80 h-80">
              <div className="video-circle w-full h-full rounded-full overflow-hidden relative bg-gradient-45 from-teal-500/10 to-gray-400/10">
                <video 
                  ref={videoRef}
                  autoPlay 
                  muted 
                  playsInline
                  className="w-full h-full object-cover scale-x--1 rounded-full"
                />
                <FaceRecognitionFrame />
              </div>
              <EmojiEffects onEmojiAdd={onEmojiAdd} />
            </div>
            
            <div className="camera-controls flex gap-4">
              <button 
                className="control-btn capture-btn px-6 py-3 bg-gradient-135 from-teal-500 to-teal-700 text-white rounded-xl font-semibold cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                onClick={onCapture}
              >
                📸 Capturar Foto
              </button>
              <button 
                className="control-btn switch-camera-btn px-6 py-3 bg-white/90 backdrop-blur text-gray-700 rounded-xl font-semibold cursor-pointer transition-all duration-300 border border-gray-300/50 hover:bg-teal-50 hover:border-teal-500"
                onClick={onSwitchCamera}
              >
                🔄 Cambiar Cámara
              </button>
            </div>
          </div>

          <FilterControls 
            currentFilter={currentFilter}
            onFilterChange={onFilterChange}
            onEmojiAdd={onEmojiAdd}
          />
        </div>
      </div>
    </div>
  );
};