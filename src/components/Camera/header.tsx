import React from 'react';

const Header: React.FC = () => {
  return (
    <header>
      <img className="logo" src="logo-umg-izq.png" alt="Logo UMG izquierdo" />
      <div className="brand">
        <div>
          <h1>UNIVERSIDAD MARIANO GÁLVEZ</h1>
          <div className="subtitle">Consumo de Servicios Web</div>
        </div>
      </div>
      <img className="logo" src="logo-umg-der.png" alt="Logo UMG derecho" />
    </header>
  );
};

export default Header;