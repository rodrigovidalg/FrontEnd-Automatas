import React from 'react';
import { useAuth } from '../../context/AuthContext';
import Button from '../UI/Button';
import UserCredential from './UserCredential';

const Dashboard: React.FC = () => {
  const { authState, logout } = useAuth();
  const [showCredential, setShowCredential] = React.useState(false);

  if (!authState.user) {
    return <div>Cargando...</div>;
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, ' +
        'rgba(81, 115, 111, 0.05) 0%, ' +
        'rgba(204, 208, 217, 0.1) 25%,' +
        'rgba(102, 105, 115, 0.08) 50%,' +
        'rgba(81, 115, 111, 0.03) 75%,' +
        'rgba(242, 242, 242, 0.1) 100%)',
      minHeight: '100vh',
      padding: '40px',
      color: 'var(--color-black)',
      textAlign: 'center'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{
          fontSize: '2.5em',
          marginBottom: '20px',
          background: 'linear-gradient(135deg, #51736F, #666973)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          ¡Bienvenido, {authState.user.nickname}! 🎉
        </h1>
        
        <div style={{
          background: 'rgba(255, 255, 255, 0.9)',
          borderRadius: '16px',
          padding: '30px',
          margin: '30px 0',
          boxShadow: '0 5px 20px rgba(0,0,0,0.1)',
          border: '1px solid rgba(204, 208, 217, 0.3)'
        }}>
          <h2>Dashboard - AuthVision Pro</h2>
          <p>Has ingresado exitosamente al sistema de autenticación avanzada.</p>
          
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '20px',
            marginTop: '30px',
            flexWrap: 'wrap'
          }}>
            <div style={{
              background: 'rgba(81, 115, 111, 0.1)',
              padding: '20px',
              borderRadius: '12px',
              minWidth: '200px',
              border: '1px solid rgba(81, 115, 111, 0.2)'
            }}>
              <h3>👤 Perfil</h3>
              <p>Email: {authState.user.email}</p>
              <p>Rol: {authState.user.role}</p>
            </div>
            
            <div style={{
              background: 'rgba(81, 115, 111, 0.1)',
              padding: '20px',
              borderRadius: '12px',
              minWidth: '200px',
              border: '1px solid rgba(81, 115, 111, 0.2)'
            }}>
              <h3>⚡ Estado</h3>
              <p>✅ Sesión Activa</p>
              <p>🔒 Verificado</p>
            </div>
            
            <div style={{
              background: 'rgba(81, 115, 111, 0.1)',
              padding: '20px',
              borderRadius: '12px',
              minWidth: '200px',
              border: '1px solid rgba(81, 115, 111, 0.2)'
            }}>
              <h3>📊 Estadísticas</h3>
              <p>Login: Exitoso</p>
              <p>Tiempo: &lt;15s</p>
            </div>
          </div>
          
          <div style={{ marginTop: '30px' }}>
            <Button 
              variant="primary"
              onClick={() => setShowCredential(true)}
              style={{ marginRight: '15px' }}
            >
              Ver Credencial
            </Button>
            
            <Button 
              variant="secondary"
              onClick={logout}
            >
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </div>
      
      {showCredential && (
        <UserCredential 
          user={authState.user}
          onClose={() => setShowCredential(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;