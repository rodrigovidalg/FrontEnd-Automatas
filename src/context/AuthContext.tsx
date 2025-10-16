// src/context/AuthContext.tsx
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { User, UserSession } from '../types/user.types';
import { AuthState } from '../types/auth.types';
import * as AuthAPI from '../services/authService';

interface AuthContextType {
  authState: AuthState;
  login: (user: string, password: string) => Promise<boolean>;
  loginWithFace: () => Promise<boolean>;
  loginWithQR: (codigoQr: string) => Promise<boolean>;
  register: (userData: any) => Promise<boolean>;
  logout: () => void;
  resetPassword: (email: string) => Promise<boolean>;
  adoptSession: (session: UserSession) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'REGISTER_START' }
  | { type: 'REGISTER_SUCCESS'; payload: User | null }
  | { type: 'REGISTER_FAILURE'; payload: string };

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, loading: true, error: null };
    case 'LOGIN_SUCCESS':
      return { ...state, isAuthenticated: true, user: action.payload, loading: false, error: null };
    case 'LOGIN_FAILURE':
      return { ...state, isAuthenticated: false, user: null, loading: false, error: action.payload };
    case 'LOGOUT':
      return { ...state, isAuthenticated: false, user: null, loading: false, error: null };
    case 'REGISTER_START':
      return { ...state, loading: true, error: null };
    case 'REGISTER_SUCCESS':
      return {
        ...state,
        isAuthenticated: action.payload ? true : state.isAuthenticated,
        user: action.payload ?? state.user,
        loading: false,
        error: null
      };
    case 'REGISTER_FAILURE':
      return { ...state, loading: false, error: action.payload };
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

/** Adaptador: BackendUser -> User (tipo del front) */
function mapBackendUserToUser(bu: any): User {
  const mapped: Partial<User> = {
    id: bu?.id ?? bu?.userId ?? bu?.guid ?? `user_${Date.now()}`,
    email: bu?.email ?? '',
    phone: bu?.telefono ?? bu?.phone ?? '',
    nickname: bu?.usuario ?? bu?.username ?? bu?.nickname ?? '',
    fullName: bu?.nombreCompleto ?? bu?.fullName ?? '',
    role: bu?.role ?? 'analista'
  };
  return mapped as User;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, dispatch] = useReducer(authReducer, initialState);

  // Restaurar sesión al cargar la app
  useEffect(() => {
    const restore = async () => {
      const token = localStorage.getItem('auth_token');

      // 1) Si hay token, intenta /me SOLO si existe (evita crashear si no está implementado)
      if (token && (AuthAPI as any).me) {
        try {
          const backendUser = await (AuthAPI as any).me(token);
          const profile = mapBackendUserToUser(backendUser);
          const session: UserSession = {
            user: profile,
            token,
            loginMethod: 'password',
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
          };
          localStorage.setItem('authvision_session', JSON.stringify(session));
          dispatch({ type: 'LOGIN_SUCCESS', payload: profile });
          return;
        } catch {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('authvision_session');
        }
      }

      // 2) Si no hay /me o falló, intenta levantar desde authvision_session
      const sessionStr = localStorage.getItem('authvision_session');
      if (sessionStr) {
        try {
          const sessionData: UserSession = JSON.parse(sessionStr);
          if (new Date(sessionData.expiresAt) > new Date()) {
            dispatch({ type: 'LOGIN_SUCCESS', payload: sessionData.user });
          } else {
            localStorage.removeItem('authvision_session');
          }
        } catch {
          localStorage.removeItem('authvision_session');
        }
      }
    };

    restore();
  }, []);

  // Login con usuario/contraseña
  const login = async (userOrEmail: string, password: string): Promise<boolean> => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const { token, user: backendUser } = await AuthAPI.login(userOrEmail, password);
      const user = mapBackendUserToUser(backendUser);

      localStorage.setItem('auth_token', token);
      const session: UserSession = {
        user,
        token,
        loginMethod: 'password',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      };
      localStorage.setItem('authvision_session', JSON.stringify(session));

      dispatch({ type: 'LOGIN_SUCCESS', payload: user });
      return true;
    } catch (err: any) {
      dispatch({ type: 'LOGIN_FAILURE', payload: err?.message || 'Credenciales incorrectas' });
      return false;
    }
  };

  // Placeholder facial (no implementado)
  const loginWithFace = async (): Promise<boolean> => {
    dispatch({ type: 'LOGIN_START' });
    try {
      await new Promise((r) => setTimeout(r, 300));
      dispatch({ type: 'LOGIN_FAILURE', payload: 'Login por rostro no implementado aún' });
      return false;
    } catch (err: any) {
      dispatch({ type: 'LOGIN_FAILURE', payload: err?.message || 'Error en login facial' });
      return false;
    }
  };

  // ✅ Login con QR (usa el servicio y guarda sesión como el login normal)
  const loginWithQR = async (codigoQr: string): Promise<boolean> => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const resp = await AuthAPI.loginByQr(codigoQr); // { token, user }
      const user = mapBackendUserToUser(resp.user);

      localStorage.setItem('auth_token', resp.token);
      const session: UserSession = {
        user,
        token: resp.token,
        loginMethod: 'qr',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      };
      localStorage.setItem('authvision_session', JSON.stringify(session));

      dispatch({ type: 'LOGIN_SUCCESS', payload: user });
      return true;
    } catch (err: any) {
      console.error('Error loginWithQR:', err);
      dispatch({ type: 'LOGIN_FAILURE', payload: err?.message || 'Error en login QR' });
      return false;
    }
  };

  // Registro + inicio de sesión
  const register = async (userData: any): Promise<boolean> => {
    dispatch({ type: 'REGISTER_START' });
    try {
      await AuthAPI.register(userData);
      const identifier = userData.email || userData.nickname || userData.usuario;
      const ok = await login(identifier, userData.password);
      if (!ok) dispatch({ type: 'REGISTER_SUCCESS', payload: null });
      return true;
    } catch (err: any) {
      dispatch({ type: 'REGISTER_FAILURE', payload: err?.message || 'Error al registrar usuario' });
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('authvision_session');
    dispatch({ type: 'LOGOUT' });
  };

  const adoptSession = (session: UserSession) => {
    localStorage.setItem('auth_token', session.token);
    localStorage.setItem('authvision_session', JSON.stringify(session));
    dispatch({ type: 'LOGIN_SUCCESS', payload: session.user });
  };

  const resetPassword = async (email: string): Promise<boolean> => {
    try {
      await new Promise((r) => setTimeout(r, 300));
      console.log(`Reset password solicitado para: ${email}`);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        authState,
        login,
        loginWithFace,
        loginWithQR,
        register,
        logout,
        resetPassword,
        adoptSession
      }}
    >
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
