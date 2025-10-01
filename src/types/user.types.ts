export interface User {
  id: string;
  email: string;
  phone: string;
  birthdate: string;
  nickname: string;
  passwordHash: string;
  notifications: 'email' | 'whatsapp' | 'both';
  originalPhoto?: string;
  processedPhoto?: string;
  registrationDate: string;
  role: string;
  faceData?: string;
}

export interface CameraState {
  stream: MediaStream | null;
  currentCamera: number;
  isActive: boolean;
}

export interface FilterState {
  type: 'normal' | 'vintage' | 'bw' | 'sepia';
  brightness: number;
  contrast: number;
}

export interface AuthState {
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  registeredUsers: User[];
}

export interface ProcessStatus {
  isVisible: boolean;
  title: string;
  description: string;
  progress: number;
  icon: string;
}

export interface QRData {
  id: string;
  email: string;
  timestamp: number;
}

export {};