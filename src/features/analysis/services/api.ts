import type { AnalisisResumen, ArchivoEntrada } from "../types";

function norm(w: string) {
  return w.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
}

export async function procesarAnalisis(archivo: ArchivoEntrada): Promise<AnalisisResumen> {
  await new Promise(r => setTimeout(r, 400)); // simular latencia

  const raw = archivo.contenido ?? "";
  const tokens = raw
    .split(/\s+/)
    .map(norm)
    .filter(Boolean);

  const totalPalabras = tokens.length;

  // Frecuencias
  const freq = new Map<string, number>();
  for (const t of tokens) freq.set(t, (freq.get(t) ?? 0) + 1);
  const entries = [...freq.entries()].map(([palabra, frecuencia]) => ({ palabra, frecuencia }));

  const topPalabras = [...entries].sort((a, b) => b.frecuencia - a.frecuencia).slice(0, 10);
  const lowPalabras = [...entries].sort((a, b) => a.frecuencia - b.frecuencia).slice(0, 10);

  const pronES = ["yo","tú","tu","él","ella","nosotros","ustedes","ellos","ellas","me","te","se","nos"];
  const pronEN = ["i","you","he","she","we","they","me","him","her","us","them"];
  const pronRU = ["я","ты","он","она","мы","вы","они","меня","тебя","его","ее","нас","их"];
  const pron = archivo.idioma === "ES" ? pronES : archivo.idioma === "EN" ? pronEN : pronRU;
  const pronombres = tokens.filter(t => pron.includes(t));

  // Nombres propios (heurística): palabras capitalizadas en el texto original
  const nombresPropios = Array.from(new Set(
    raw.split(/\s+/).map(s => s.trim()).filter(s => /^[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+$/.test(s))
  ));

  const sustantivosRaiz = Array.from(new Set(tokens.filter(t => t.length > 4))).slice(0, 10);
  const verbosRaiz = Array.from(new Set(tokens.filter(t => t.endsWith("ar") || t.endsWith("er") || t.endsWith("ir")))).slice(0, 10);

  return { totalPalabras, topPalabras, lowPalabras, pronombres, nombresPropios, sustantivosRaiz, verbosRaiz };
}
