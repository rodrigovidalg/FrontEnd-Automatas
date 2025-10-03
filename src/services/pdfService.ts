import { jsPDF } from 'jspdf';
import { User } from '../types/user.types';

export const generateCredentialPDF = async (user: User): Promise<void> => {
  const doc = new jsPDF();
  
  // Configuración
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, 210, 297, 'F');
  
  // Título
  doc.setTextColor(81, 115, 111);
  doc.setFontSize(20);
  doc.text('AuthVision Pro', 105, 30, { align: 'center' });
  doc.setFontSize(14);
  doc.text('Credencial de Identificación', 105, 45, { align: 'center' });
  
  // Información del usuario
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(`Nombre: ${user.nickname}`, 30, 80);
  doc.text(`Email: ${user.email}`, 30, 95);
  doc.text(`Teléfono: ${user.phone}`, 30, 110);
  doc.text(`Rol: ${user.role}`, 30, 125);
  doc.text(`ID: ${user.id}`, 30, 140);
  doc.text(`Fecha: ${new Date(user.registrationDate).toLocaleDateString()}`, 30, 155);
  
  // Generar QR
  try {
    // En un entorno real, usaría una librería QR adecuada
    // Por ahora, solo agregamos un placeholder
    doc.text('Código QR', 155, 95);
    doc.rect(130, 70, 50, 50);
  } catch (error) {
    console.error('Error generando QR:', error);
  }
  
  // Guardar PDF
  doc.save(`AuthVision_${user.nickname}_${user.id}.pdf`);
};