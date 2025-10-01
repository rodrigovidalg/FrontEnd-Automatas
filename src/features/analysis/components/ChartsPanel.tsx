import type { AnalisisResumen } from "../types";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Cell,
} from "recharts";

const CYAN = "#06b6d4";
const VIOLET = "#a78bfa";
const AXIS = { fontSize: 12, fill: "#cbd5e1" }; // texto de ejes en slate-300

export default function ChartsPanel({ data }: { data: AnalisisResumen | null }) {
  if (!data) return null;

  // Datos para la dona/distribución (ahora en barras)
  const topTotal = data.topPalabras.reduce((s, x) => s + x.frecuencia, 0);
  const resto = Math.max(data.totalPalabras - topTotal, 0);
  const distData = [
    { name: "Top palabras", value: topTotal },
    { name: "Resto", value: resto },
  ];

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {/* TOP PALABRAS - Barras */}
      <div className="card-light p-4">
        <h3 className="font-semibold text-slate-100 mb-2">Palabras más frecuentes</h3>
        <div style={{ width: "100%", height: 300 }}>
          <ResponsiveContainer>
            <BarChart data={data.topPalabras}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="palabra" tick={AXIS} />
              <YAxis tick={AXIS} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0b1220",
                  border: "1px solid #334155",
                  color: "#e2e8f0",
                }}
              />
              <Bar dataKey="frecuencia" fill={CYAN} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* DISTRIBUCIÓN - Barras verticales (Top vs Resto) */}
      <div className="card-dark p-4">
        <h3 className="font-semibold text-slate-100 mb-2">Distribución (Top vs Resto)</h3>
        <div style={{ width: "100%", height: 300 }}>
          <ResponsiveContainer>
            <BarChart
              data={distData}
              margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" tick={AXIS} />
              <YAxis tick={AXIS} />
              <Legend wrapperStyle={{ color: "#cbd5e1" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0b1220",
                  border: "1px solid #334155",
                  color: "#e2e8f0",
                }}
              />
              <Bar dataKey="value" name="Cantidad" radius={[8, 8, 0, 0]}>
                {distData.map((_, idx) => (
                  <Cell
                    key={`cell-${idx}`}
                    fill={idx === 0 ? CYAN : VIOLET}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
