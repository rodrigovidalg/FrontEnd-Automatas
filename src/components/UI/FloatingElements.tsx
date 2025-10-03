import React, { useEffect, useRef } from 'react';

const FloatingElements: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    
    // Create floating elements
    for (let i = 0; i < 15; i++) {
      const element = document.createElement('div');
      element.className = 'floating-element';
      element.style.left = `${Math.random() * 100}%`;
      element.style.width = `${Math.random() * 60 + 20}px`;
      element.style.height = element.style.width;
      element.style.animationDelay = `${Math.random() * 20}s`;
      element.style.animationDuration = `${Math.random() * 10 + 15}s`;
      container.appendChild(element);
    }

    return () => {
      // Clean up
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
    };
  }, []);

  return <div className="floating-elements" ref={containerRef}></div>;
};

export default FloatingElements;