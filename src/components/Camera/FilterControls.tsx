import React, { useState } from 'react';
import { FILTERS } from '../../utils/constants';

interface FilterControlsProps {
  onFilterChange: (filter: string) => void;
  onFilterSettingsChange: (brightness: number, contrast: number) => void;
}

const FilterControls: React.FC<FilterControlsProps> = ({
  onFilterChange,
  onFilterSettingsChange
}) => {
  const [activeFilter, setActiveFilter] = useState('normal');
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);

  const handleFilterClick = (filter: string) => {
    setActiveFilter(filter);
    onFilterChange(filter);
  };

  const handleBrightnessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setBrightness(value);
    onFilterSettingsChange(value, contrast);
  };

  const handleContrastChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setContrast(value);
    onFilterSettingsChange(brightness, value);
  };

  return (
    <div className="live-editor">
      {/* Filtros */}
      <div className="editor-section">
        <div className="editor-title">🎨 Filtros</div>
        <div className="filter-grid">
          {FILTERS.map((filter) => (
            <button
              key={filter.value}
              className={`filter-btn ${activeFilter === filter.value ? 'active' : ''}`}
              onClick={() => handleFilterClick(filter.value)}
              title={filter.name}
            >
              {filter.icon}
            </button>
          ))}
        </div>
      </div>
      
      {/* Ajustes */}
      <div className="editor-section">
        <div className="editor-title">⚙️ Ajustes</div>
        
        <div className="slider-container">
          <div className="slider-label">
            <span>Brillo</span>
            <span className="slider-value">{brightness}%</span>
          </div>
          <input
            type="range"
            className="slider"
            min="50"
            max="150"
            value={brightness}
            onChange={handleBrightnessChange}
          />
        </div>
        
        <div className="slider-container">
          <div className="slider-label">
            <span>Contraste</span>
            <span className="slider-value">{contrast}%</span>
          </div>
          <input
            type="range"
            className="slider"
            min="50"
            max="150"
            value={contrast}
            onChange={handleContrastChange}
          />
        </div>
      </div>
      
      {/* Emoji Gallery */}
      <div className="editor-section">
        <div className="editor-title">😊 Efectos Emoji</div>
        <div className="filter-grid">
          <button className="emoji-btn">🌟</button>
          <button className="emoji-btn">💫</button>
          <button className="emoji-btn">🎈</button>
          <button className="emoji-btn">🎭</button>
          <button className="emoji-btn">🦄</button>
          <button className="emoji-btn">🌈</button>
          <button className="emoji-btn">🔥</button>
          <button className="emoji-btn">✨</button>
        </div>
      </div>
    </div>
  );
};

export default FilterControls;