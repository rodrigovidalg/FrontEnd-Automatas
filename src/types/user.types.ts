export interface User {
  id: string;
  email: string;
  phone: string;
  // birthdate eliminado
  nickname: string;
  fullName: string;
  passwordHash: string;
  notifications: 'email' | 'whatsapp' | 'both';
  originalPhoto: string;
  processedPhoto: string;
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