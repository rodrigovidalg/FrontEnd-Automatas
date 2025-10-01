import type { AnalisisResumen } from "../types";

export default function ResultsSummary({ data }: { data: AnalisisResumen | null }) {
  if (!data) return null;
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      <KPI title="Total palabras" value={data.totalPalabras} />
      <KPI title="Top únicas" value={data.topPalabras.length} />
      <KPI title="Pronombres" value={data.pronombres.length} />
      <KPI title="Nombres propios" value={data.nombresPropios.length} />
    </div>
  );
}

function KPI({ title, value }: { title: string; value: number }) {
  return (
    <div className="card-light p-4">
      <div className="text-xs uppercase tracking-wide text-slate-400">{title}</div>
      <div className="mt-1 text-2xl font-bold text-slate-100">{value}</div>
    </div>
  );
}
