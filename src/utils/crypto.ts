import CryptoJS from 'crypto-js';

export const hashPassword = (password: string): string => {
  return CryptoJS.SHA256(password).toString();
};

export const validatePassword = (password: string, hash: string): boolean => {
  return hashPassword(password) === hash;
};

export const generateUserId = (): string => {
  return `AV_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};