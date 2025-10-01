import React from 'react';

interface FilterControlsProps {
  currentFilter: string;
  onFilterChange: (filter: string) => void;
  onEmojiAdd: (emoji: string) => void;
}

export const FilterControls: React.FC<FilterControlsProps> = ({
  currentFilter,
  onFilterChange,
  onEmojiAdd
}) => {
  const filters = [
    { id: 'normal', label: 'Normal', emoji: '🔍' },
    { id: 'vintage', label: 'Vintage', emoji: '📸' },
    { id: 'bw', label: 'Blanco y Negro', emoji: '⚫' },
    { id: 'sepia', label: 'Sepia', emoji: '🟤' }
  ];

  const emojis = ['🌟', '💫', '🎈', '🎭', '🦄', '🌈', '🔥', '✨'];

  return (
    <div className="live-editor">
      {/* Filtros */}
      <div className="editor-section">
        <div className="editor-title">🎨 Filtros</div>
        <div className="filter-grid">
          {filters.map(filter => (
            <button
              key={filter.id}
              className={`filter-btn ${currentFilter === filter.id ? 'active' : ''}`}
              onClick={() => onFilterChange(filter.id)}
              title={filter.label}
            >
              {filter.emoji}
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
            <span className="slider-value">100%</span>
          </div>
          <input 
            type="range" 
            className="slider"
            min="50" 
            max="150" 
            defaultValue="100"
          />
        </div>

        <div className="slider-container">
          <div className="slider-label">
            <span>Contraste</span>
            <span className="slider-value">100%</span>
          </div>
          <input 
            type="range" 
            className="slider"
            min="50" 
            max="150" 
            defaultValue="100"
          />
        </div>
      </div>

      {/* Emoji Gallery */}
      <div className="editor-section">
        <div className="editor-title">😊 Efectos Emoji</div>
        <div className="filter-grid">
          {emojis.map(emoji => (
            <button
              key={emoji}
              className="emoji-btn"
              onClick={() => onEmojiAdd(emoji)}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};