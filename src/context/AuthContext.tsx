import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { User, UserSession } from '../types/user.types';
import { AuthState } from '../types/auth.types';
import { useUsers } from '../hooks/useLocalStorage';
import { hashPassword, generateToken } from '../utils/crypto';

interface AuthContextType {
  authState: AuthState;
  login: (user: string, password: string) => Promise<boolean>;
  loginWithFace: () => Promise<boolean>;
  loginWithQR: () => Promise<boolean>;
  register: (userData: any) => Promise<boolean>;
  logout: () => void;
  resetPassword: (email: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'REGISTER_START' }
  | { type: 'REGISTER_SUCCESS'; payload: User }
  | { type: 'REGISTER_FAILURE'; payload: string };

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, loading: true, error: null };
    case 'LOGIN_SUCCESS':
      return { 
        ...state, 
        isAuthenticated: true, 
        user: action.payload, 
        loading: false, 
        error: null 
      };
    case 'LOGIN_FAILURE':
      return { 
        ...state, 
        isAuthenticated: false, 
        user: null, 
        loading: false, 
        error: action.payload 
      };
    case 'LOGOUT':
      return { 
        ...state, 
        isAuthenticated: false, 
        user: null, 
        loading: false, 
        error: null 
      };
    case 'REGISTER_START':
      return { ...state, loading: true, error: null };
    case 'REGISTER_SUCCESS':
      return { 
        ...state, 
        isAuthenticated: true, 
        user: action.payload, 
        loading: false, 
        error: null 
      };
    case 'REGISTER_FAILURE':
      return { 
        ...state, 
        isAuthenticated: false, 
        user: null, 
        loading: false, 
        error: action.payload 
      };
    default:
      return state;
  }
};

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  loading: false,
  error: null
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, dispatch] = useReducer(authReducer, initialState);
  const { users, addUser, findUser, findUserByNickname } = useUsers();
  
  useEffect(() => {
    const session = localStorage.getItem('authvision_session');
    if (session) {
      try {
        const sessionData: UserSession = JSON.parse(session);
        if (new Date(sessionData.expiresAt) > new Date()) {
          dispatch({ type: 'LOGIN_SUCCESS', payload: sessionData.user });
        } else {
          localStorage.removeItem('authvision_session');
        }
      } catch (error) {
        console.error('Error parsing session:', error);
        localStorage.removeItem('authvision_session');
      }
    }
  }, []);
  
  const login = async (user: string, password: string): Promise<boolean> => {
    dispatch({ type: 'LOGIN_START' });
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const foundUser = findUser(user) || findUserByNickname(user);
      
      if (foundUser && foundUser.passwordHash === hashPassword(password)) {
        const session: UserSession = {
          user: foundUser,
          token: generateToken(),
          loginMethod: 'password',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        };
        
        localStorage.setItem('authvision_session', JSON.stringify(session));
        dispatch({ type: 'LOGIN_SUCCESS', payload: foundUser });
        return true;
      } else {
        dispatch({ type: 'LOGIN_FAILURE', payload: 'Credenciales incorrectas' });
        return false;
      }
    } catch (error) {
      dispatch({ type: 'LOGIN_FAILURE', payload: 'Error al iniciar sesión' });
      return false;
    }
  };
  
  const loginWithFace = async (): Promise<boolean> => {
    dispatch({ type: 'LOGIN_START' });
    
    try {
      // Simulate face recognition
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (users.length > 0) {
        const randomUser = users[Math.floor(Math.random() * users.length)];
        const session: UserSession = {
          user: randomUser,
          token: generateToken(),
          loginMethod: 'facial',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        };
        
        localStorage.setItem('authvision_session', JSON.stringify(session));
        dispatch({ type: 'LOGIN_SUCCESS', payload: randomUser });
        return true;
      } else {
        dispatch({ type: 'LOGIN_FAILURE', payload: 'No hay usuarios registrados con reconocimiento facial' });
        return false;
      }
    } catch (error) {
      dispatch({ type: 'LOGIN_FAILURE', payload: 'Error en el reconocimiento facial' });
      return false;
    }
  };
  
  const loginWithQR = async (): Promise<boolean> => {
    dispatch({ type: 'LOGIN_START' });
    
    try {
      // Simulate QR scanning
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (users.length > 0) {
        const randomUser = users[Math.floor(Math.random() * users.length)];
        const session: UserSession = {
          user: randomUser,
          token: generateToken(),
          loginMethod: 'qr',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        };
        
        localStorage.setItem('authvision_session', JSON.stringify(session));
        dispatch({ type: 'LOGIN_SUCCESS', payload: randomUser });
        return true;
      } else {
        dispatch({ type: 'LOGIN_FAILURE', payload: 'Código QR no válido' });
        return false;
      }
    } catch (error) {
      dispatch({ type: 'LOGIN_FAILURE', payload: 'Error al escanear código QR' });
      return false;
    }
  };
  
  const register = async (userData: any): Promise<boolean> => {
    dispatch({ type: 'REGISTER_START' });
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const newUser: User = {
        id: generateUserId(),
        email: userData.email,
        phone: userData.phone,
        birthdate: userData.birthdate,
        nickname: userData.nickname,
        passwordHash: hashPassword(userData.password),
        notifications: userData.notifications,
        originalPhoto: userData.originalPhoto,
        processedPhoto: userData.processedPhoto,
        registrationDate: new Date().toISOString(),
        role: 'analista',
        faceData: 'simulated_face_encoding_' + Math.random().toString(36),
        qrCode: generateQRCode(userData)
      };
      
      addUser(newUser);
      
      const session: UserSession = {
        user: newUser,
        token: generateToken(),
        loginMethod: 'password',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      };
      
      localStorage.setItem('authvision_session', JSON.stringify(session));
      dispatch({ type: 'REGISTER_SUCCESS', payload: newUser });
      return true;
    } catch (error) {
      dispatch({ type: 'REGISTER_FAILURE', payload: 'Error al registrar usuario' });
      return false;
    }
  };
  
  const logout = () => {
    localStorage.removeItem('authvision_session');
    dispatch({ type: 'LOGOUT' });
  };
  
  const resetPassword = async (email: string): Promise<boolean> => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const user = findUser(email);
      if (user) {
        // In a real app, this would send an email or WhatsApp message
        console.log(`Password reset link sent to ${email}`);
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      return false;
    }
  };
  
  // Helper functions
  const generateUserId = (): string => {
    return 'AV_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  };
  
  const generateQRCode = (userData: any): string => {
    return JSON.stringify({
      id: generateUserId(),
      email: userData.email,
      timestamp: Date.now()
    });
  };
  
  return (
    <AuthContext.Provider value={{
      authState,
      login,
      loginWithFace,
      loginWithQR,
      register,
      logout,
      resetPassword
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};