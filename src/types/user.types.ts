export interface User {
  id: string;
  email: string;
  phone: string;
  birthdate: string;
  nickname: string;
  passwordHash: string;
  notifications: boolean;
  originalPhoto?: string;
  processedPhoto?: string;
  registrationDate: string;
  role: 'analista' | 'admin' | 'user';
  faceData?: string;
  qrCode?: string;
}

export interface UserSession {
  user: User;
  token: string;
  loginMethod: 'password' | 'facial' | 'qr';
  expiresAt: Date;
}