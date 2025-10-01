export type Idioma = "ES" | "EN" | "RU";

export interface TokenFreq {
  palabra: string;
  frecuencia: number;
}

export interface AnalisisResumen {
  totalPalabras: number;
  topPalabras: Array<{ palabra: string; frecuencia: number }>;
  lowPalabras: Array<{ palabra: string; frecuencia: number }>;
  pronombres: string[];
  nombresPropios: string[];
  sustantivosRaiz: string[];
  verbosRaiz: string[];
}

export interface ArchivoEntrada {
  nombre: string;
  idioma: "ES" | "EN" | "RU";
  contenido: string;
}