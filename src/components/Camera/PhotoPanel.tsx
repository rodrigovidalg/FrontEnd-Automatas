import React from 'react';

interface PhotoPanelProps {
  side: 'A' | 'B';
  photoData: string;
  title: string;
}

const PhotoPanel: React.FC<PhotoPanelProps> = ({ side, photoData, title }) => {
  const base64Data = photoData ? photoData.substring(0, 100) + '...' : '';
  
  return (
    <section className="panel panel--photo" aria-labelledby={`photo${side}-title`}>
      <div className="panel__header">
        <h2 id={`photo${side}-title`} className="panel__title">{title}</h2>
        <select className="panel__device" aria-label={`Dispositivo de cámara ${side}`}>
          <option>HP HD Webcam</option>
        </select>
      </div>

      <div className="panel__preview" role="img" aria-label={`Vista previa ${title}`}>
        {photoData ? (
          <img src={photoData} alt={`Vista previa ${side}`} />
        ) : (
          <div className="preview-placeholder">Esperando imagen...</div>
        )}
      </div>

      <div className="panel__actions">
        <button type="button" className="btn">Seleccionar...</button>
      </div>

      <div className="panel__meta">
        <label>
          Ruta:
          <input 
            type="text" 
            readOnly 
            value={`C:\\ruta\\archivo${side}.jpg`} 
          />
        </label>
        <label>
          String Base64:
          <textarea 
            rows={3} 
            readOnly 
            value={base64Data}
            placeholder={`...base64 de ${side}...`}
          />
        </label>
      </div>
    </section>
  );
};

export default PhotoPanel;