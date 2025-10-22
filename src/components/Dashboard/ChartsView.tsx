// src/components/dashboard/ChartsView.tsx
import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LabelList,
  Cell,
} from 'recharts';
import './dashboard.css';

type FreqItem = { word: string; count: number };

type AnalysisResult = {
  totalWords: number;
  topWords: FreqItem[];
  rareWords: FreqItem[];
  pronouns: string[];
  persons: string[];
  nounsLemma: string[];
  verbsLemma: string[];
  other?: Record<string, any>;
};

type UiLang = 'es' | 'en' | 'ru';

// Traducciones para los títulos de gráficas
const CHART_LABELS: Record<UiLang, any> = {
  es: {
    backButton: '← Volver a Resultados',
    dashboardTitle: 'Dashboard',
    top: 'Top Palabras Más Frecuentes',
    rare: 'Palabras Menos Frecuentes',
    pronouns: 'Distribución de Pronombres',
    persons: 'Personas Detectadas',
    noData: 'Sin datos disponibles',
  },
  en: {
    backButton: '← Back to Results',
    dashboardTitle: 'Visualizations Dashboard',
    top: 'Top Most Frequent Words',
    rare: 'Least Frequent Words',
    pronouns: 'Pronouns Distribution',
    persons: 'Detected Persons',
    noData: 'No data available',
  },
  ru: {
    backButton: '← Назад к результатам',
    dashboardTitle: 'Дашборд визуализаций',
    top: 'Топ частых слов',
    rare: 'Редкие слова',
    pronouns: 'Распределение местоимений',
    persons: 'Обнаруженные персоны',
    noData: 'Нет данных',
  },
};

// Paleta de colores en escala de grises con un toque de negro
const GRAY_PALETTE = {
  dark: '#1a1a1a',
  charcoal: '#2d2d2d',
  steel: '#404040',
  slate: '#525252',
  medium: '#6b7280',
  light: '#9ca3af',
  lighter: '#d1d5db',
  grid: '#e5e7eb',
  bg: '#f9fafb',
};

// Tooltip personalizado con estilo profesional
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
          border: '2px solid #404040',
          borderRadius: '12px',
          padding: '12px 16px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
          color: '#fff',
        }}
      >
        <p style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem', marginBottom: 6 }}>
          {payload[0].payload.name}
        </p>
        <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#e5e7eb' }}>
          Frecuencia: <span style={{ color: '#9ca3af' }}>{payload[0].value}</span>
        </p>
      </div>
    );
  }
  return null;
};

interface ChartsViewProps {
  result: AnalysisResult;
  uiLang: UiLang;
  onBack: () => void;
}

const ChartsView: React.FC<ChartsViewProps> = ({ result, uiLang, onBack }) => {
  const T = CHART_LABELS[uiLang];

  // Preparar datos para las gráficas
  const dataTop = result.topWords.map((item) => ({ name: item.word, value: item.count }));
  const dataRare = result.rareWords.map((item) => ({ name: item.word, value: item.count }));
  
  // Conteo de pronombres
  const pronounCounts = result.pronouns.reduce((acc: Record<string, number>, p) => {
    acc[p] = (acc[p] || 0) + 1;
    return acc;
  }, {});
  const dataPronouns = Object.entries(pronounCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  // Conteo de personas
  const personCounts = result.persons.reduce((acc: Record<string, number>, p) => {
    acc[p] = (acc[p] || 0) + 1;
    return acc;
  }, {});
  const dataPersons = Object.entries(personCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  // Componente de gráfica mejorado con gradientes y animaciones
  const ChartCard: React.FC<{
    title: string;
    data: { name: string; value: number }[];
    baseColor: string;
  }> = ({ title, data, baseColor }) => {
    // Generar array de colores degradados para cada barra
    const colors = data.map((_, index) => {
      const opacity = 1 - (index * 0.08);
      return baseColor === GRAY_PALETTE.dark
        ? `rgba(26, 26, 26, ${opacity})`
        : baseColor === GRAY_PALETTE.charcoal
        ? `rgba(45, 45, 45, ${opacity})`
        : baseColor === GRAY_PALETTE.steel
        ? `rgba(64, 64, 64, ${opacity})`
        : `rgba(82, 82, 82, ${opacity})`;
    });

    return (
      <section className="chart-card">
        <div className="chart-card__header" style={{ background: '#225b56', color: '#fff' }}>
          <h3>{title}</h3>
          <div className="chart-card__badge">{data.length} items</div>
        </div>
        <div className="chart-card__body">
          {data && data.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 20, right: 20, left: 0, bottom: 60 }}
              >
                <defs>
                  <linearGradient id={`gradient-${title}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={baseColor} stopOpacity={1} />
                    <stop offset="95%" stopColor={baseColor} stopOpacity={0.7} />
                  </linearGradient>
                </defs>
                <CartesianGrid 
                  stroke={GRAY_PALETTE.grid} 
                  strokeDasharray="3 3" 
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ fill: GRAY_PALETTE.medium, fontSize: 12, fontWeight: 600 }}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: GRAY_PALETTE.medium, fontSize: 12, fontWeight: 600 }}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(107, 114, 128, 0.1)' }} />
                <Bar
                  dataKey="value"
                  fill={`url(#gradient-${title})`}
                  radius={[8, 8, 0, 0]}
                  animationDuration={800}
                  animationEasing="ease-out"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index]} />
                  ))}
                  <LabelList
                    dataKey="value"
                    position="top"
                    style={{ fill: GRAY_PALETTE.dark, fontWeight: 700, fontSize: 12 }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="no-data">{T.noData}</div>
          )}
        </div>
      </section>
    );
  };

  return (
    <div className="dash charts-dashboard">
      {/* Header con botón de regreso */}
      <header className="charts-dashboard__header">
        <button className="btn btn--back" onClick={onBack}>
          {T.backButton}
        </button>
        <h1 className="charts-dashboard__title">{T.dashboardTitle}</h1>
      </header>

      {/* Grid de gráficas */}
      <div className="charts-dashboard__grid">
        <ChartCard title={T.top} data={dataTop} baseColor={GRAY_PALETTE.dark} />
        <ChartCard title={T.rare} data={dataRare} baseColor={GRAY_PALETTE.charcoal} />
        <ChartCard title={T.pronouns} data={dataPronouns} baseColor={GRAY_PALETTE.steel} />
        <ChartCard title={T.persons} data={dataPersons} baseColor={GRAY_PALETTE.slate} />
      </div>
    </div>
  );
};

export default ChartsView;