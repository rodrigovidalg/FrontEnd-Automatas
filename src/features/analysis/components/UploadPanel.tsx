import { useState } from "react";
import type { ArchivoEntrada, Idioma } from "../types";

export default function UploadPanel({ onProcesar }: { onProcesar: (a: ArchivoEntrada) => void }) {
  const [idioma, setIdioma] = useState<Idioma>("ES");
  const [texto, setTexto] = useState("");

  const handle = () => {
    if (!texto.trim()) { alert("Pega un texto de prueba."); return; }
    onProcesar({ nombre: "demo.txt", idioma, contenido: texto });
  };

  return (
    <div className="card-light p-4 mb-6">
      <h2 className="section-title mb-3">Cargar texto y seleccionar idioma</h2>

      <div className="flex flex-col md:flex-row gap-3 mb-3">
        <select
          className="select md:w-56"
          value={idioma}
          onChange={(e) => setIdioma(e.target.value as Idioma)}
        >
          <option value="ES">Español</option>
          <option value="EN">Inglés</option>
          <option value="RU">Ruso</option>
        </select>

        <button onClick={handle} className="btn-primary">Procesar</button>
      </div>

      <textarea
        className="textarea h-40"
        placeholder="Pega aquí texto en ES/EN/RU para el demo…"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
      />
      <div className="text-xs text-slate-400 mt-2">
        Consejo: pega un párrafo de 5 a 10 líneas para ver mejor las gráficas.
      </div>
    </div>
  );
}
