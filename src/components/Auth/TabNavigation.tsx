import React from 'react';

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange }) => {
  const handleTabClick = (tab: string, index: number) => {
    onTabChange(tab);
    
    // Update indicator position
    const indicator = document.getElementById('navIndicator');
    if (indicator) {
      indicator.style.left = `${index * 50}%`;
    }
    
    // Update active tab
    document.querySelectorAll('.nav-tab').forEach((t, i) => {
      t.classList.toggle('active', i === index);
    });
  };

  return (
    <div className="nav-container">
      <div className="nav-tabs">
        <div className="nav-indicator" id="navIndicator"></div>
        <button 
          className={`nav-tab ${activeTab === 'login' ? 'active' : ''}`}
          onClick={() => handleTabClick('login', 0)}
        >
          Iniciar Sesión
        </button>
        <button 
          className={`nav-tab ${activeTab === 'register' ? 'active' : ''}`}
          onClick={() => handleTabClick('register', 1)}
        >
          Registrarse
        </button>
      </div>
    </div>
  );
};

export default TabNavigation;