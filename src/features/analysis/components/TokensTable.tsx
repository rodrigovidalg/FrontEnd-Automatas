import type { AnalisisResumen } from "../types";

export default function TokensTable({ data }: { data: AnalisisResumen | null }) {
  if (!data) return null;
  const rows = data.topPalabras;

  return (
    <div className="card-dark p-4 overflow-x-auto">
      <table className="table">
        <thead>
          <tr>
            <th className="th">Palabra</th>
            <th className="th">Frecuencia</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="hover:bg-slate-900/60">
              <td className="td">{r.palabra}</td>
              <td className="td">{r.frecuencia}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
