import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { User, AuthState } from '../types/user.types';
import { hashPassword, generateUserId } from '../utils/crypto';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: Omit<User, 'id' | 'registrationDate' | 'role'>) => Promise<boolean>;
  logout: () => void;
  updateUser: (user: User) => void;
  quickLogin: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'SET_REGISTERED_USERS'; payload: User[] };

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_USER':
      return { 
        ...state, 
        currentUser: action.payload, 
        isAuthenticated: !!action.payload 
      };
    case 'UPDATE_USER':
      return { ...state, currentUser: action.payload };
    case 'SET_REGISTERED_USERS':
      return { ...state, registeredUsers: action.payload };
    default:
      return state;
  }
};

const getInitialUsers = (): User[] => {
  try {
    return JSON.parse(localStorage.getItem('authvision_users') || '[]');
  } catch {
    return [];
  }
};

const initialState: AuthState = {
  currentUser: null,
  isAuthenticated: false,
  isLoading: false,
  registeredUsers: getInitialUsers()
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const login = async (email: string, password: string): Promise<boolean> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const user = state.registeredUsers.find(u => 
        u.email === email && u.passwordHash === hashPassword(password)
      );

      if (user) {
        dispatch({ type: 'SET_USER', payload: user });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const quickLogin = (user: User) => {
    dispatch({ type: 'SET_USER', payload: user });
  };

  const register = async (userData: Omit<User, 'id' | 'registrationDate' | 'role'>): Promise<boolean> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      if (state.registeredUsers.some((u: User) => u.email === userData.email)) {
        throw new Error('Email already registered');
      }

      const newUser: User = {
        ...userData,
        id: generateUserId(),
        registrationDate: new Date().toISOString(),
        role: 'analista'
      };

      const updatedUsers = [...state.registeredUsers, newUser];
      localStorage.setItem('authvision_users', JSON.stringify(updatedUsers));
      dispatch({ type: 'SET_REGISTERED_USERS', payload: updatedUsers });
      dispatch({ type: 'SET_USER', payload: newUser });
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const logout = () => {
    dispatch({ type: 'SET_USER', payload: null });
  };

  const updateUser = (user: User) => {
    dispatch({ type: 'UPDATE_USER', payload: user });
  };

  return (
    <AuthContext.Provider value={{
      ...state,
      login,
      register,
      logout,
      updateUser,
      quickLogin
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};