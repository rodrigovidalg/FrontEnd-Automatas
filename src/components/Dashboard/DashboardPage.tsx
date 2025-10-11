// src/components/dashboard/DashboardPage.tsx
import React, { useMemo, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import './dashboard.css';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LabelList,
} from 'recharts';

type LangISO = 'es' | 'en' | 'ru';
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

/** =======================
 *  Utilidades existentes
 *  ======================= */
const PRONOUNS: Record<LangISO, string[]> = {
  es: ['yo','tú','vos','usted','él','ella','nosotros','nosotras','ustedes','vosotros','vosotras','ellos','ellas','me','te','se','mi','tu','su','nos','les','lo','la','los','las'],
  en: ['i','you','he','she','we','they','me','him','her','us','them','my','your','his','our','their','its'],
  ru: ['я','ты','вы','он','она','оно','мы','они','меня','тебя','вас','его','её','нас','их','мой','твой','ваш','наш','их']
};
const NON_WORD = /[^0-9A-Za-z\u00C0-\u024F\u0400-\u04FF'’-]+/g;
const TRIM_PUNCT = /^[’'\-]+|[’'\-]+$/g;

function toWords(text: string): string[] {
  return text.split(NON_WORD).map(w => w.replace(TRIM_PUNCT, '')).filter(Boolean);
}
function freqMap(words: string[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const w of words) m.set(w, (m.get(w) ?? 0) + 1);
  return m;
}
function topNFreq(m: Map<string, number>, n = 10): FreqItem[] {
  return Array.from(m.entries()).sort((a,b)=>b[1]-a[1]).slice(0,n).map(([word,count])=>({word,count}));
}
function rareNFreq(m: Map<string, number>, n = 10): FreqItem[] {
  return Array.from(m.entries()).sort((a,b)=>a[1]-b[1] || a[0].localeCompare(b[0])).slice(0,n).map(([word,count])=>({word,count}));
}
function guessPersons(text: string, lang: LangISO): string[] {
  const persons = new Set<string>();
  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    const tokens = line.split(NON_WORD);
    tokens.forEach(t => {
      const clean = t.replace(TRIM_PUNCT, '');
      if (!clean) return;
      if (lang === 'ru') {
        if (/^[А-ЯЁ][а-яё]+$/.test(clean)) persons.add(clean);
      } else {
        if (/^[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+$/.test(clean)) persons.add(clean);
      }
    });
  }
  return Array.from(persons).slice(0, 20);
}
function fakeLemmaNouns(words: string[], lang: LangISO): string[] {
  if (lang === 'es') return words.filter(w=>/ción$|dad$|sión$|tad$|ez$|umbre$/i.test(w)).slice(0,20);
  if (lang === 'en') return words.filter(w=>/tion$|ness$|ment$|ity$|ship$|ance$|ence$/i.test(w)).slice(0,20);
  return words.filter(w=>/ие$|ия$|ость$|ение$/i.test(w)).slice(0,20);
}
function fakeLemmaVerbs(words: string[], lang: LangISO): string[] {
  if (lang === 'es') return words.filter(w=>/ar$|er$|ir$/i.test(w)).slice(0,20);
  if (lang === 'en') return words.filter(w=>/ing$|ed$|ize$|ise$/i.test(w)).slice(0,20);
  return words.filter(w=>/ать$|ить$|ять$/i.test(w)).slice(0,20);
}

/** =======================
 *  Análisis local (fallback)
 *  ======================= */
function analyzeLocally(text: string, lang: LangISO): AnalysisResult {
  const words = toWords(text);
  const normalized = words.map((w) => w.toLowerCase());
  const fm = freqMap(normalized);
  const pronounsSet = new Set(PRONOUNS[lang].map((p) => p.toLowerCase()));
  const pronounsFound = Array.from(new Set(normalized.filter((w) => pronounsSet.has(w))));
  return {
    totalWords: normalized.length,
    topWords: topNFreq(fm, 10),
    rareWords: rareNFreq(fm, 10),
    pronouns: pronounsFound.slice(0, 30),
    persons: guessPersons(text, lang),
    nounsLemma: Array.from(new Set(fakeLemmaNouns(normalized, lang))),
    verbsLemma: Array.from(new Set(fakeLemmaVerbs(normalized, lang))),
    other: { note: 'Resultados heurísticos locales (demo) cuando no hay endpoint.' }
  };
}

const LANG_LABELS: Record<LangISO, string> = { es: 'Español', en: 'Inglés', ru: 'Ruso' };

/** =======================
 *  API (con .env + proxy)
 *  ======================= */
const API_BASE = 'https://lexicoreapi-production.up.railway.app';
const API = {
  upload: `${API_BASE}/api/documentos`,
  analyze: (id: number | string) => `${API_BASE}/api/analisis/${id}`,
  health: `${API_BASE}/api/health`
};

const Icon = {
  Upload: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M12 16V4m0 0l-4 4m4-4l4 4M4 20h16" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Globe: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M12 21a9 9 0 100-18 9 9 0 000 18zm0 0c3.866 0 7-4.03 7-9s-3.134-9-7-9-7 4.03-7 9 3.134 9 7 9zm-7-9h14" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
    </svg>
  ),
  Play: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7-11-7z"/>
    </svg>
  ),
  Broom: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M3 21l6-6m0 0l3-3m-3 3l3 3m3-9l3-3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Refresh: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M20 7h-5m5 0l-3-3m3 3l-3 3M4 17h5m-5 0l3-3m-3 3l3 3M7 7a7 7 0 1110 10" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Download: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M12 4v12m0 0l4-4m-4 4l-4-4M4 20h16" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Doc: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M7 3h7l5 5v13a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M14 3v5h5" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),
  Power: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M12 2v8m6.364-4.364A8 8 0 1 1 5.636 5.636" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )

};

/** =======================
 *  Llamadas a la API
 *  ======================= */
async function uploadDocumento(file: File, usuarioId: number, codigoIso: LangISO): Promise<number> {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('usuarioId', String(usuarioId ?? 1));
  fd.append('codigoIso', codigoIso);

  const res = await fetch(API.upload, { method: 'POST', body: fd });
  if (!res.ok) throw new Error('Error al subir documento');
  const data: any = await res.json();
  const id =
    data?.id ??
    data?.documentoId ??
    data?.documentId ??
    data?.data?.id ??
    data?.data?.documentoId;

  if (typeof id !== 'number' && typeof id !== 'string') {
    throw new Error('La API no devolvió el id del documento');
  }
  return Number(id);
}

async function analizarDocumento(documentoId: number | string): Promise<any> {
  const res = await fetch(API.analyze(documentoId), { method: 'POST' });
  if (!res.ok) throw new Error('Error en análisis del documento');
  return res.json();
}

function coerceToAnalysisResult(apiResp: any, fallbackText: string, lang: LangISO): AnalysisResult {
  const totalWords =
    apiResp?.totalWords ?? apiResp?.totalPalabras ?? apiResp?.conteoPalabras ?? null;

  const topWords: FreqItem[] =
    (apiResp?.topWords ?? apiResp?.palabrasFrecuentes ?? apiResp?.masFrecuentes)?.map((x: any) => ({
      word: x?.word ?? x?.palabra ?? x?.token ?? '',
      count: Number(x?.count ?? x?.frecuencia ?? x?.freq ?? 0)
    })) ?? [];

  const rareWords: FreqItem[] =
    (apiResp?.rareWords ?? apiResp?.menosFrecuentes)?.map((x: any) => ({
      word: x?.word ?? x?.palabra ?? x?.token ?? '',
      count: Number(x?.count ?? x?.frecuencia ?? x?.freq ?? 0)
    })) ?? [];

  const pronouns: string[] =
    apiResp?.pronouns ?? apiResp?.pronombres ?? apiResp?.linguistics?.pronouns ?? [];

  const persons: string[] =
    apiResp?.persons ?? apiResp?.nombresPropios ?? apiResp?.entidades?.personas ?? [];

  const nounsLemma: string[] =
    apiResp?.nounsLemma ?? apiResp?.sustantivos ?? apiResp?.lemmas?.nouns ?? [];

  const verbsLemma: string[] =
    apiResp?.verbsLemma ?? apiResp?.verbos ?? apiResp?.lemmas?.verbs ?? [];

  if (
    totalWords === null ||
    !topWords.length ||
    !rareWords.length ||
    !pronouns.length ||
    !persons.length ||
    !nounsLemma.length ||
    !verbsLemma.length
  ) {
    const localResult = analyzeLocally(fallbackText, lang);
    return {
      totalWords: totalWords ?? localResult.totalWords,
      topWords: topWords.length ? topWords : localResult.topWords,
      rareWords: rareWords.length ? rareWords : localResult.rareWords,
      pronouns: pronouns.length ? pronouns : localResult.pronouns,
      persons: persons.length ? persons : localResult.persons,
      nounsLemma: nounsLemma.length ? nounsLemma : localResult.nounsLemma,
      verbsLemma: verbsLemma.length ? verbsLemma : localResult.verbsLemma,
      other: { ...(apiResp ?? {}), note: 'Combinado API + heurística local' }
    };
  }

  return {
    totalWords: Number(totalWords),
    topWords,
    rareWords,
    pronouns,
    persons,
    nounsLemma,
    verbsLemma,
    other: apiResp
  };
}

// Colores del tema (verdes)
const GREEN = {
  dark:  '#2e5e54', // --primary-700
  mid:   '#3a6f64', // --primary-600
  light: '#447c6f', // --primary-500
  grid:  '#e5e7eb'  // --border aprox para la cuadrícula
};

/** =======================
 *  Componente
 *  ======================= */
const DashboardPage: React.FC = () => {
  const auth: any = useAuth();
const { authState } = auth;
const logoutFn: undefined | (() => Promise<void> | void) =
  auth?.logout || auth?.signOut || auth?.logOut;

const handleLogout = async () => {
  try {
    if (typeof logoutFn === 'function') {
      await logoutFn();
    } else {
      localStorage.clear();
      sessionStorage.clear();
    }
  } finally {
    // Ajusta esta ruta si tu pantalla de login es otra
    window.location.href = '/login';
  }
};

  const [lang, setLang] = useState<LangISO>('es');
  const [rawText, setRawText] = useState<string>('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayName = useMemo(
    () => authState.user?.fullName || authState.user?.nickname || authState.user?.email || 'Usuario',
    [authState.user]
  );

  // Palabras normalizadas del texto (para contar pronombres y personas)
  const normalizedWords = useMemo(() => toWords(rawText).map(w => w.toLowerCase()), [rawText]);

  const handleFile = async (file?: File | null) => {
    if (!file) return;
    if (!/\.txt$/i.test(file.name)) { alert('Solo se admite formato .txt'); return; }
    setSelectedFile(file);
    const text = await file.text();
    setRawText(text);
    setResult(null);
    setErrorMsg(null);
  };

  const onProcess = async () => {
    if (!selectedFile) { alert('Primero carga un archivo .txt'); return; }
    try {
      setLoading(true); setErrorMsg(null);

      const usuarioIdNumeric = Number((authState.user?.id as any) ?? 1) || 1;
      const docId = await uploadDocumento(selectedFile, usuarioIdNumeric, lang);

      const apiResp = await analizarDocumento(docId);

      const normalized = coerceToAnalysisResult(apiResp, rawText, lang);
      setResult(normalized);
    } catch (err: any) {
      const localResult = analyzeLocally(rawText, lang);
      setResult(localResult);
      setErrorMsg(err?.message || 'No se pudo contactar la API — mostrando análisis local de demostración.');
    } finally {
      setLoading(false);
    }
  };

  const topOrEmpty = (arr?: FreqItem[]) => (arr ?? []).map(({ word, count }) => `${word} (${count})`).join(', ') || '—';
  const listOrEmpty = (arr?: string[]) => (arr && arr.length ? arr.join(', ') : '—');

  /** ====== Datos para gráficos ====== */
  // Top / Rare
  const dataTop = useMemo(() =>
    (result?.topWords ?? []).map(x => ({ name: x.word, value: x.count })), [result]);
  const dataRare = useMemo(() =>
    (result?.rareWords ?? []).map(x => ({ name: x.word, value: x.count })), [result]);

  // Pronombres: contamos frecuencia real en el texto
  const dataPronouns = useMemo(() => {
    if (!result) return [];
    const set = new Set(PRONOUNS[lang].map(p => p.toLowerCase()));
    const counts = new Map<string, number>();
    for (const w of normalizedWords) if (set.has(w)) counts.set(w, (counts.get(w) ?? 0) + 1);
    return Array.from(counts.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a,b)=>b.value-a.value)
      .slice(0, 15);
  }, [result, lang, normalizedWords]);

  // Personas: contamos apariciones (case-insensitive)
  const dataPersons = useMemo(() => {
    if (!result) return [];
    const set = new Set(result.persons.map(p => p.toLowerCase()));
    if (set.size === 0) return [];
    const counts = new Map<string, number>();
    for (const w of normalizedWords) if (set.has(w)) counts.set(w, (counts.get(w) ?? 0) + 1);
    return Array.from(counts.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a,b)=>b.value-a.value)
      .slice(0, 15);
  }, [result, normalizedWords]);

  // Otras clasificaciones: resumen por categorías
  const dataOther = useMemo(() => {
    if (!result) return [];
    const items = [
      { name: 'Pronombres', value: result.pronouns.length || 0 },
      { name: 'Personas', value: result.persons.length || 0 },
      { name: 'Sustantivos (raíz)', value: result.nounsLemma.length || 0 },
      { name: 'Verbos (raíz)', value: result.verbsLemma.length || 0 },
      { name: 'Top (Únicas)', value: (result.topWords || []).length },
      { name: 'Raras (Únicas)', value: (result.rareWords || []).length },
    ];
    return items;
  }, [result]);

  /** ====== Exportar a CSV ====== */
  const canExport = !!result && (result.totalWords ?? 0) > 0;

  const handleExport = () => {
    if (!canExport || !result) return;
    const csvLines: string[] = [];

    csvLines.push('Sección,Item,Valor');

    csvLines.push('Resumen,TotalPalabras,' + result.totalWords);

    csvLines.push('TopWords,Palabra,Frecuencia');
    for (const x of result.topWords) csvLines.push(`TopWords,${x.word},${x.count}`);

    csvLines.push('RareWords,Palabra,Frecuencia');
    for (const x of result.rareWords) csvLines.push(`RareWords,${x.word},${x.count}`);

    csvLines.push('Pronombres,Pronombre,Frecuencia');
    for (const x of dataPronouns) csvLines.push(`Pronombres,${x.name},${x.value}`);

    csvLines.push('Personas,Nombre,Frecuencia');
    for (const x of dataPersons) csvLines.push(`Personas,${x.name},${x.value}`);

    csvLines.push('Otras,Clasificación,Conteo');
    for (const x of dataOther) csvLines.push(`Otras,${x.name},${x.value}`);

    const blob = new Blob(['\uFEFF' + csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'analisis_lexico.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  /** ====== Componente gráfico genérico ====== */
const ChartCard: React.FC<{
  title: string;
  data: { name: string; value: number }[];
  color?: string;
}> = ({ title, data, color = GREEN.dark }) => (
  <section className="card">
    <div className="card__header">{title}</div>
    <div className="card__body" style={{ height: 300 }}>
      {data && data.length ? (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid stroke={GREEN.grid} strokeDasharray="3 3" />
            <XAxis dataKey="name" interval={0} angle={-20} textAnchor="end" height={60} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="value" fill={color}>
              <LabelList dataKey="value" position="top" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="muted">—</div>
      )}
    </div>
  </section>
);


  return (
    <div className="dash">
      {/* Header */}
      <header className="dash__header">
        <div>
          <h1>Análisis y Dashboard Léxico</h1>
          <p className="dash__subtitle">Frontend · Visualización · Reportes · Dashboard</p>
        </div>
        <div className="dash__actions">
          <span className="welcome">Bienvenido: <strong>{displayName}</strong></span>
          <button
            className="btn btn--primary"
            onClick={handleExport}
            disabled={!canExport}
            aria-disabled={!canExport}
            title={canExport ? 'Exportar resultados' : 'Exportar (deshabilitado)'}
          >
            <span style={{display:'inline-flex',gap:8,alignItems:'center'}}><Icon.Download/>Exportar</span>
          </button>
          <button className="btn btn--green-soft">
            <span style={{display:'inline-flex',gap:8,alignItems:'center'}}><Icon.Refresh/>Actualizar</span>
          </button>

          <button className="btn btn--danger" onClick={handleLogout} title="Cerrar sesión">
           <span style={{display:'inline-flex',gap:8,alignItems:'center'}}>
            <Icon.Power/> Cerrar sesión
           </span>
          </button>


        </div>
      </header>

      {/* Barra superior */}
      <section className="bar">
        {/* Cargar TXT */}
        <div className="file-picker">
        <button
            type="button"
            className="btn btn--primary"   // <<-- ANTES estaba con estilos inline
            onClick={() => fileInputRef.current?.click()}
            aria-label="Cargar archivo .txt"
>
            <span style={{display:'inline-flex',gap:10,alignItems:'center'}}>
            <Icon.Upload/> Cargar .txt
            </span>
        </button>

          <input
            ref={fileInputRef}
            id="txtFile"
            type="file"
            accept=".txt"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            hidden
          />
          <span className="hint" style={{display:'inline-flex',gap:6,alignItems:'center',color:'#6b7280'}}>
            <Icon.Doc/> Formato: .txt
          </span>
        </div>

        {/* Idioma */}
        <div className="lang-select" style={{alignItems:'stretch'}}>
          <label htmlFor="langSelect" className="btn lang-label" style={{display:'inline-flex',gap:10,alignItems:'center'}}>
            <Icon.Globe/> Idioma
          </label>
          <select
            id="langSelect"
            value={lang}
            onChange={(e) => setLang(e.target.value as LangISO)}
            className="btn"
            style={{
              minWidth: 180, background:'#fff', borderColor:'#e5e7eb',
              fontWeight:600, color:'#1f2937'
            }}
          >
            <option value="es">Español (es)</option>
            <option value="en">Inglés (en)</option>
            <option value="ru">Ruso (ru)</option>
          </select>
        </div>

        {/* Acciones */}
        <div className="actions">
          <button className="btn btn--primary" onClick={onProcess} disabled={!selectedFile || loading}>
            <span style={{display:'inline-flex',gap:10,alignItems:'center'}}>
              <Icon.Play/>{loading ? 'Procesando…' : 'Procesar'}
            </span>
          </button>
          <button
            className="btn btn--warning"
            onClick={() => {
              setSelectedFile(null);
              setRawText('');
              setResult(null);
              setErrorMsg(null);
              if (fileInputRef.current) fileInputRef.current.value = '';
            }}
            disabled={!selectedFile}
          >
            <span style={{display:'inline-flex',gap:10,alignItems:'center'}}>
              <Icon.Broom/>Limpiar
            </span>
          </button>
        </div>
      </section>

      {/* Contenido del TXT */}
      <section className="card">
        <div className="card__header">Contenido del documento cargado</div>
        <div className="card__body">
          <div
            className="raw-view raw-view--readonly"
            style={{
              border: '2.5px solid #dfe7e5',
              borderRadius: 14,
              padding: 12,
              background: '#fff',
              maxHeight: 420,
              overflowY: 'auto',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <pre style={{margin:0, whiteSpace:'pre-wrap', wordBreak:'break-word', fontFamily:'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace', color:'#111827'}}>
              {rawText || 'Aquí se mostrará el contenido del archivo .txt'}
            </pre>
          </div>
        </div>
      </section>

      {/* Resultados */}
      <section className="card" style={{borderWidth:2.5, borderStyle:'solid', borderColor:'#dfe7e5', borderRadius:18}}>
        <div className="card__header">Resultados del análisis léxico</div>
        <div className="card__body">
          {errorMsg && <div className="alert">{errorMsg}</div>}
          {!result ? (
            <div className="muted">Carga un .txt, elige un idioma y pulsa <strong>Procesar</strong>.</div>
          ) : (
            <>
              <div className="grid-2">
                <div>
                  <div className="metric"><span>Total de palabras</span><strong>{result.totalWords}</strong></div>
                  <div className="metric"><span>Más repetidas</span><div>{topOrEmpty(result.topWords)}</div></div>
                  <div className="metric"><span>Menos repetidas</span><div>{topOrEmpty(result.rareWords)}</div></div>
                  <div className="metric"><span>Pronombres personales</span><div>{listOrEmpty(result.pronouns)}</div></div>
                </div>
                <div>
                  <div className="metric"><span>Nombres de personas</span><div>{listOrEmpty(result.persons)}</div></div>
                  <div className="metric"><span>Sustantivos (forma raíz)</span><div>{listOrEmpty(result.nounsLemma)}</div></div>
                  <div className="metric"><span>Verbos (forma raíz)</span><div>{listOrEmpty(result.verbsLemma)}</div></div>
                  <div className="metric"><span>Otras clasificaciones</span><div>{result.other ? JSON.stringify(result.other) : '—'}</div></div>
                </div>
              </div>

              {/* Gráficos */}
              <div className="charts-grid">
                  <ChartCard title="Palabras más repetidas"    data={dataTop}      color={GREEN.dark} />
                  <ChartCard title="Palabras menos repetidas"   data={dataRare}     color={GREEN.light} />
                  <ChartCard title="Pronombres personales (frecuencia)" data={dataPronouns} color={GREEN.mid} />
                  <ChartCard title="Nombres de personas (frecuencia)"   data={dataPersons}  color={GREEN.dark} />
                  <ChartCard title="Otras clasificaciones (resumen)"    data={dataOther}    color={GREEN.mid} />
              </div>

            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;
