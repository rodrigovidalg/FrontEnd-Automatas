import React from 'react';

interface TabNavigationProps {
  activeTab: 'login' | 'register';
  onTabChange: (tab: 'login' | 'register') => void;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  onTabChange
}) => {
  const tabs = [
    { id: 'login' as const, label: 'Iniciar Sesión' },
    { id: 'register' as const, label: 'Registrarse' }
  ];

  const activeIndex = tabs.findIndex(tab => tab.id === activeTab);

  return (
    <div className="nav-container bg-gray-200/20 rounded-2xl p-1.5 mb-10 backdrop-blur relative">
      <div className="nav-tabs flex relative">
        <div 
          className="nav-indicator absolute bg-white rounded-xl h-[calc(100%-12px)] top-1.5 transition-all duration-400 ease-in-out shadow-lg"
          style={{
            width: '50%',
            left: `${activeIndex * 50}%`,
            transform: `translateX(${activeIndex * 100}%)`
          }}
        />
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            className={`nav-tab flex-1 bg-transparent border-none px-6 py-4 rounded-xl font-semibold cursor-pointer transition-all duration-300 relative z-2 text-base ${
              activeTab === tab.id 
                ? 'text-gray-900' 
                : 'text-gray-600'
            }`}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};