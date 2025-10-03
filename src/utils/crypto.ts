// Importar CryptoJS solo si se va a usar
import CryptoJS from 'crypto-js';

export const hashPassword = (password: string): string => {
  return CryptoJS.SHA256(password).toString();
};

export const generateToken = (): string => {
  return CryptoJS.lib.WordArray.random(32).toString();
};

export const generateQRHash = (data: string): string => {
  return CryptoJS.SHA256(data).toString();
};