import React from 'react';

interface EmojiEffectsProps {
  onEmojiAdd: (emoji: string) => void;
}

const EmojiEffects: React.FC<EmojiEffectsProps> = ({ onEmojiAdd }) => {
  const emojis = ['😊', '😎', '🤔', '😂', '❤️', '👍'];

  return (
    <div className="photo-effects">
      {emojis.map((emoji, index) => (
        <button
          key={index}
          className="emoji-btn"
          onClick={() => onEmojiAdd(emoji)}
          title={`Agregar ${emoji}`}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
};

export default EmojiEffects;