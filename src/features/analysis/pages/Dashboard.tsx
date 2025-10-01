import { useState } from "react";
import UploadPanel from "../components/UploadPanel";
import ResultsSummary from "../components/ResultsSummary";
import ChartsPanel from "../components/ChartsPanel";
import TokensTable from "../components/TokensTable";
import ReportBuilder from "../components/ReportBuilder";
import type { AnalisisResumen, ArchivoEntrada } from "../types";
import { procesarAnalisis } from "../services/api";

export default function Dashboard() {
  const [data, setData] = useState<AnalisisResumen | null>(null);
  const [loading, setLoading] = useState(false);

  const onProcesar = async (archivo: ArchivoEntrada) => {
    setLoading(true);
    try {
      const res = await procesarAnalisis(archivo);
      setData(res);
    } catch {
      alert("Error procesando el análisis");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
        {/* Header */}
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">
            Demo: Análisis &amp; Reportes
          </h1>
          <p className="text-gray-500 mt-2">
            Frontend • Visualización • Reportes • Dashboard
          </p>
        </header>

        {/* Panel de carga */}
        <UploadPanel onProcesar={onProcesar} />

        {/* Estado de carga */}
        {loading && (
          <div className="card-light p-3 mb-6 text-sm text-gray-600">
            Procesando…
          </div>
        )}

        {/* KPIs */}
        <ResultsSummary data={data} />

        {/* Gráficas */}
        <section className="mb-6">
          <h2 className="section-title mb-2">Gráficas</h2>
          <ChartsPanel data={data} />
        </section>

        {/* Tabla */}
        <section className="mb-6">
          <h2 className="section-title mb-2">Detalle</h2>
          <TokensTable data={data} />
        </section>

        {/* PDF */}
        <ReportBuilder data={data} />
      </div>
    </div>
  );
}
