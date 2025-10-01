import React from 'react';

export const FaceRecognitionFrame: React.FC = () => {
  return (
    <div className="face-recognition-frame">
      <div className="hex-scanner"></div>
      <div className="scan-lines"></div>
      <div className="corner-indicators">
        <div className="corner-indicator top-left"></div>
        <div className="corner-indicator top-right"></div>
        <div className="corner-indicator bottom-left"></div>
        <div className="corner-indicator bottom-right"></div>
      </div>
    </div>
  );
};