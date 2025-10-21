// src/components/dashboard/DashboardPage.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
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
type UiLang = 'es' | 'en' | 'ru';
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

/* =======================
 *  i18n simple (interfaz)
 * ======================= */
const UI_STR: Record<UiLang, any> = {
  es: {
    title: 'Análisis y Dashboard Léxico',
    subtitle: 'Frontend · Visualización · Reportes · Dashboard',
    welcome: 'Bienvenido',
    uiLangLabel: 'Interfaz',
    analysisLangLabel: 'Idioma',
    uploadTxt: 'Cargar .txt',
    format: 'Formato',
    process: 'Procesar',
    processing: 'Procesando…',
    clear: 'Limpiar',
    export: 'Exportar',
    exportTipOK: 'Exportar resultados',
    exportTipNO: 'Exportar (deshabilitado)',
    refresh: 'Actualizar',
    logout: 'Cerrar sesión',
    contentHeader: 'Contenido del documento cargado',
    placeholder: 'Aquí se mostrará el contenido del archivo .txt',
    resultsHeader: 'Resultados del análisis léxico',
    preProcessHint: 'Carga un .txt, elige un idioma y pulsa ',
    metrics: {
      total: 'Total de palabras',
      pronouns: 'Pronombres distintos',
      persons: 'Personas distintas',
      nouns: 'Sustantivos (raíz)',
      verbs: 'Verbos (raíz)',
      topUnique: 'Top únicas',
    },
    charts: {
      top: 'Top palabras',
      rare: 'Palabras raras',
      pronouns: 'Pronombres',
      persons: 'Personas detectadas',
    },
  },
  en: {
    title: 'Lexical Analysis Dashboard',
    subtitle: 'Frontend · Visualization · Reports · Dashboard',
    welcome: 'Welcome',
    uiLangLabel: 'Interface',
    analysisLangLabel: 'Language',
    uploadTxt: 'Upload .txt',
    format: 'Format',
    process: 'Process',
    processing: 'Processing…',
    clear: 'Clear',
    export: 'Export',
    exportTipOK: 'Export results',
    exportTipNO: 'Export (disabled)',
    refresh: 'Refresh',
    logout: 'Sign out',
    contentHeader: 'Loaded document content',
    placeholder: 'The contents of the .txt file will appear here',
    resultsHeader: 'Lexical analysis results',
    preProcessHint: 'Upload a .txt, choose a language and click ',
    metrics: {
      total: 'Total words',
      pronouns: 'Distinct pronouns',
      persons: 'Distinct persons',
      nouns: 'Nouns (lemma)',
      verbs: 'Verbs (lemma)',
      topUnique: 'Top unique',
    },
    charts: {
      top: 'Top words',
      rare: 'Rare words',
      pronouns: 'Pronouns',
      persons: 'Detected persons',
    },
  },
  ru: {
    title: 'Лексический анализ — Дашборд',
    subtitle: 'Фронтенд · Визуализация · Отчёты · Дашборд',
    welcome: 'Добро пожаловать',
    uiLangLabel: 'Интерфейс',
    analysisLangLabel: 'Язык',
    uploadTxt: 'Загрузить .txt',
    format: 'Формат',
    process: 'Обработать',
    processing: 'Обработка…',
    clear: 'Очистить',
    export: 'Экспорт',
    exportTipOK: 'Экспортировать результаты',
    exportTipNO: 'Экспорт (выключен)',
    refresh: 'Обновить',
    logout: 'Выйти',
    contentHeader: 'Содержимое загруженного документа',
    placeholder: 'Здесь появится содержимое файла .txt',
    resultsHeader: 'Результаты лексического анализа',
    preProcessHint: 'Загрузите .txt, выберите язык и нажмите ',
    metrics: {
      total: 'Всего слов',
      pronouns: 'Местоимения (разные)',
      persons: 'Персоны (разные)',
      nouns: 'Существительные (лемма)',
      verbs: 'Глаголы (лемма)',
      topUnique: 'Топ (уникальные)',
    },
    charts: {
      top: 'Топ слова',
      rare: 'Редкие слова',
      pronouns: 'Местоимения',
      persons: 'Обнаруженные персоны',
    },
  },
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

const LANG_LABELS: Record<LangISO, string> = { es: 'Español', en: 'English', ru: 'Русский' };

/** =======================
 *  API (con .env + proxy)
 *  ======================= */
const API_BASE = 'https://lexicoreapi-production.up.railway.app';
const API = {
  upload: `${API_BASE}/api/documentos`,
  analyze: (id: number | string) => `${API_BASE}/api/analisis/${id}`,
  reportPdf: (id: number | string) => `${API_BASE}/api/reportes/analisis/${id}`,
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
  // clave más común
  fd.append('file', file);
  // alias frecuente en backends .NET hispanos
  fd.append('archivo', file);

  fd.append('usuarioId', String(usuarioId ?? 1));

  // muchos backends esperan "lang"
  fd.append('lang', codigoIso);
  // tu front además usa "codigoIso"; deja ambos por si acaso
  fd.append('codigoIso', codigoIso);

  // si hay token en localStorage, lo mandamos (por si PROD exige auth)
  const token = localStorage.getItem('token') || '';

  const res = await fetch(API.upload, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: fd
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Error al subir documento (${res.status}): ${text || res.statusText}`);
  }

  const data: any = await res.json().catch(() => ({}));
  const id =
    data?.id ?? data?.documentoId ?? data?.documentId ?? data?.data?.id ?? data?.data?.documentoId;

  if (typeof id !== 'number' && typeof id !== 'string') {
    throw new Error('La API no devolvió el id del documento');
  }
  return Number(id);
}


async function analizarDocumento(documentoId: number | string): Promise<any> {
  const token = localStorage.getItem('token') || '';
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

  // 1) intenta POST (muchas APIs lo esperan así)
  let res = await fetch(API.analyze(documentoId), { method: 'POST', headers });
  if (!res.ok) {
    // 2) si POST falla por método/ruta (405/404), intenta GET
    if (res.status === 405 || res.status === 404) {
      res = await fetch(API.analyze(documentoId), { method: 'GET', headers });
    }
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Error en análisis (${res.status}): ${text || res.statusText}`);
  }
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
  dark:  '#2e5e54',
  mid:   '#3a6f64',
  light: '#447c6f',
  grid:  '#e5e7eb'
};

/** =======================
 *  Componente
 *  ======================= */
const DashboardPage: React.FC = () => {
  const [documentId, setDocumentId] = useState<number | null>(null);
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
      window.location.href = '/login';
    }
  };

  // Idioma de la INTERFAZ (nuevo)
  const [uiLang, setUiLang] = useState<UiLang>(() => {
    const saved = localStorage.getItem('ui_lang') as UiLang | null;
    return saved || 'es';
  });
  useEffect(() => {
    localStorage.setItem('ui_lang', uiLang);
  }, [uiLang]);
  const T = UI_STR[uiLang];

  // Idioma del ANÁLISIS (ya existente)
  const [lang, setLang] = useState<LangISO>('es');

  const [rawText, setRawText] = useState<string>('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayName = useMemo(
    () => authState.user?.fullName || authState.user?.nickname || authState.user?.email || (uiLang === 'en' ? 'User' : uiLang === 'ru' ? 'Пользователь' : 'Usuario'),
    [authState.user, uiLang]
  );

  // Palabras normalizadas del texto (para contar pronombres y personas)
  const normalizedWords = useMemo(() => toWords(rawText).map(w => w.toLowerCase()), [rawText]);

  const handleFile = async (file?: File | null) => {
    if (!file) return;
    if (!/\.txt$/i.test(file.name)) { alert('.txt only'); return; }
    setSelectedFile(file);
    const text = await file.text();
    setRawText(text);
    setResult(null);
    setErrorMsg(null);
  };

  const onProcess = async () => {
  if (!selectedFile) { alert('.txt required'); return; }
  try {
    setLoading(true); setErrorMsg(null);

    const usuarioIdNumeric = Number((authState.user?.id as any) ?? 1) || 1;

    // 1) Subir documento
    const docId = await uploadDocumento(selectedFile, usuarioIdNumeric, lang);

    // 2) Normalizar ID y guardarlo en estado
    const normalizedId =
      typeof docId === 'object' && docId !== null && 'id' in docId
        ? Number((docId as any).id)
        : Number(docId);

    if (!Number.isFinite(normalizedId)) {
      throw new Error('El backend no devolvió un documentoId válido.');
    }
    setDocumentId(normalizedId);

    // 3) Analizar en backend con ese ID
    const apiResp = await analizarDocumento(normalizedId);

    // 4) Normalizar respuesta para la UI
    const normalized = coerceToAnalysisResult(apiResp, rawText, lang);
    setResult(normalized);

  } catch (err: any) {
    // Fallback local: mostrará resultados pero NO se habilitará Exportar si no se subió el doc
    const localResult = analyzeLocally(rawText, lang);
    setResult(localResult);
    setErrorMsg(err?.message || 'Falling back to local analysis.');
  } finally {
    setLoading(false);
  }
};


  const dataTop = useMemo(() =>
    (result?.topWords ?? []).map(x => ({ name: x.word, value: x.count })), [result]);
  const dataRare = useMemo(() =>
    (result?.rareWords ?? []).map(x => ({ name: x.word, value: x.count })), [result]);

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

  const dataOther = useMemo(() => {
    if (!result) return [];
    return [
      { name: (T.metrics?.pronouns ?? 'Pronombres'), value: result.pronouns.length || 0 },
      { name: (T.metrics?.persons ?? 'Personas'), value: result.persons.length || 0 },
      { name: (T.metrics?.nouns ?? 'Sustantivos (raíz)'), value: result.nounsLemma.length || 0 },
      { name: (T.metrics?.verbs ?? 'Verbos (raíz)'), value: result.verbsLemma.length || 0 },
      { name: (T.metrics?.topUnique ?? 'Top únicas'), value: (result.topWords || []).length },
      { name: (T.charts?.rare ?? 'Palabras raras'), value: (result.rareWords || []).length },
    ];
  }, [result, T]);

  const canExport = !!result && (result.totalWords ?? 0) > 0 && documentId !== null;


  const handleExport = async () => {
  if (!canExport || !result || documentId == null) return;

  try {
    const token = localStorage.getItem('token') || '';
    const res = await fetch(API.reportPdf(documentId), {
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`No se pudo generar el PDF (${res.status}): ${text || res.statusText}`);
    }

    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('application/pdf')) {
      const text = await res.text().catch(() => '');
      throw new Error(`La API no devolvió un PDF. Content-Type=${ct}. ${text}`);
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `analisis_lexico_doc_${documentId}.pdf`;
    a.click();

    URL.revokeObjectURL(url);
  } catch (e: any) {
    alert(e?.message || 'Error al exportar PDF');
  }
};
;


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
          <h1>{T.title}</h1>
          <p className="dash__subtitle">{T.subtitle}</p>
        </div>

        <div className="dash__actions">
          {/* Selector de idioma de la INTERFAZ */}
          <div className="lang-select" style={{alignItems:'stretch'}}>
            <label htmlFor="uiLang" className="btn lang-label" style={{display:'inline-flex',gap:10,alignItems:'center'}}>
              <Icon.Globe/> {T.uiLangLabel}
            </label>
            <select
              id="uiLang"
              value={uiLang}
              onChange={(e) => setUiLang(e.target.value as UiLang)}
              className="btn"
              style={{ minWidth: 160 }}
            >
              <option value="es">Español</option>
              <option value="en">English</option>
              <option value="ru">Русский</option>
            </select>
          </div>

          <span className="welcome">{T.welcome}: <strong>{displayName}</strong></span>

          <button
            className="btn btn--primary"
            onClick={handleExport}
            disabled={!canExport}
            aria-disabled={!canExport}
            title={canExport ? T.exportTipOK : T.exportTipNO}
          >
            <span style={{display:'inline-flex',gap:8,alignItems:'center'}}>{T.export}</span>
          </button>

          <button className="btn btn--green-soft">
            <span style={{display:'inline-flex',gap:8,alignItems:'center'}}>{T.refresh}</span>
          </button>

          <button className="btn btn--danger" onClick={handleLogout} title={T.logout}>
            <span style={{display:'inline-flex',gap:8,alignItems:'center'}}>{T.logout}</span>
          </button>
        </div>
      </header>

      {/* Barra superior */}
      <section className="bar">
        {/* Cargar TXT */}
        <div className="file-picker">
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => fileInputRef.current?.click()}
            aria-label={T.uploadTxt}
          >
            <span style={{display:'inline-flex',gap:10,alignItems:'center'}}>
              {T.uploadTxt}
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
            {T.format}: .txt
          </span>
        </div>

        {/* Idioma del análisis */}
        <div className="lang-select" style={{alignItems:'stretch'}}>
          <label htmlFor="langSelect" className="btn lang-label" style={{display:'inline-flex',gap:10,alignItems:'center'}}>
            {T.analysisLangLabel}
          </label>
          <select
            id="langSelect"
            value={lang}
            onChange={(e) => setLang(e.target.value as LangISO)}
            className="btn"
            style={{ minWidth: 180, background:'#fff', borderColor:'#e5e7eb', fontWeight:600, color:'#1f2937' }}
          >
            <option value="es">{LANG_LABELS.es}</option>
            <option value="en">{LANG_LABELS.en}</option>
            <option value="ru">{LANG_LABELS.ru}</option>
          </select>
        </div>

        {/* Acciones */}
        <div className="actions">
          <button className="btn btn--primary" onClick={onProcess} disabled={!selectedFile || loading}>
            <span style={{display:'inline-flex',gap:10,alignItems:'center'}}>
              {loading ? T.processing : T.process}
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
              {T.clear}
            </span>
          </button>
        </div>
      </section>

      {/* Dos columnas principales */}
      <div className="grid-2">
        {/* Contenido del TXT */}
        <section className="card">
          <div className="card__header">{T.contentHeader}</div>
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
                {rawText || T.placeholder}
              </pre>
            </div>
          </div>
        </section>

        {/* Resultados */}
        <section className="card" style={{borderWidth:2.5, borderStyle:'solid', borderColor:'#dfe7e5', borderRadius:18}}>
          <div className="card__header">{T.resultsHeader}</div>
          <div className="card__body">
            {errorMsg && <div className="alert">{errorMsg}</div>}
            {!result ? (
              <div className="muted">
                {T.preProcessHint}<strong>{T.process}</strong>.
              </div>
            ) : (
              <>
                {/* Métricas rápidas */}
                <div className="grid-2">
                  <div className="metric"><span>{T.metrics.total}</span><strong>{result.totalWords}</strong></div>
                  <div className="metric"><span>{T.metrics.pronouns}</span><strong>{result.pronouns.length}</strong></div>
                  <div className="metric"><span>{T.metrics.persons}</span><strong>{result.persons.length}</strong></div>
                  <div className="metric"><span>{T.metrics.nouns}</span><strong>{result.nounsLemma.length}</strong></div>
                  <div className="metric"><span>{T.metrics.verbs}</span><strong>{result.verbsLemma.length}</strong></div>
                  <div className="metric"><span>{T.metrics.topUnique}</span><strong>{result.topWords.length}</strong></div>
                </div>

                {/* Gráficos */}
                <div className="charts-grid">
                  <ChartCard title={T.charts.top} data={dataTop} />
                  <ChartCard title={T.charts.rare} data={dataRare} color={GREEN.mid} />
                  <ChartCard title={T.charts.pronouns} data={dataPronouns} color={GREEN.light} />
                  <ChartCard title={T.charts.persons} data={dataPersons} color={GREEN.dark} />
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default DashboardPage;
