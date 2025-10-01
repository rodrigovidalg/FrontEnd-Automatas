import React from 'react';

interface EmojiEffectsProps {
  onEmojiAdd: (emoji: string) => void;
}

export const EmojiEffects: React.FC<EmojiEffectsProps> = ({ onEmojiAdd }) => {
  const emojis = ['😊', '🎉', '❤️', '⭐', '🚀'];

  return (
    <div className="photo-effects">
      {emojis.map(emoji => (
        <button
          key={emoji}
          className="emoji-btn"
          onClick={() => onEmojiAdd(emoji)}
          title={`Añadir ${emoji}`}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
};