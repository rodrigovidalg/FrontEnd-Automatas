import { User } from './user.types'; // Importar el tipo User

export interface LoginCredentials {
  user: string;
  password: string;
}

export interface RegisterData {
  email: string;
  phone: string;
  nickname: string;
  fullName: string;
  password: string;
  notifications: 'email' | 'whatsapp' | 'both';
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null; // Ahora User está importado
  loading: boolean;
  error: string | null;
}