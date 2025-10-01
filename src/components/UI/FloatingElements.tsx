import React, { useEffect, useState } from 'react';

interface FloatingElement {
  id: number;
  left: number;
  size: number;
  delay: number;
  duration: number;
}

export const FloatingElements: React.FC = () => {
  const [elements, setElements] = useState<FloatingElement[]>([]);

  useEffect(() => {
    const newElements: FloatingElement[] = [];
    for (let i = 0; i < 15; i++) {
      newElements.push({
        id: i,
        left: Math.random() * 100,
        size: Math.random() * 60 + 20,
        delay: Math.random() * 20,
        duration: Math.random() * 10 + 15
      });
    }
    setElements(newElements);
  }, []);

  return (
    <div className="floating-elements fixed top-0 left-0 w-full h-full pointer-events-none z-1 overflow-hidden">
      {elements.map(element => (
        <div
          key={element.id}
          className="floating-element absolute rounded-full bg-gradient-45 from-teal-500/10 to-gray-400/10"
          style={{
            left: `${element.left}%`,
            width: `${element.size}px`,
            height: `${element.size}px`,
            animationDelay: `${element.delay}s`,
            animationDuration: `${element.duration}s`
          }}
        />
      ))}
    </div>
  );
};