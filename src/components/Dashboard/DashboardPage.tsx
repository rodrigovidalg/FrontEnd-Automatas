// src/components/dashboard/DashboardPage.tsx
import React, { useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import './dashboard.css';
import ChartsView from './ChartsView';

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
    title: 'Análisis Léxico',
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
    goToDashboard: 'Ir al Dashboard 📊',
    metrics: {
      total: 'Total de palabras',
      pronouns: 'Pronombres distintos',
      persons: 'Personas distintas',
      nouns: 'Sustantivos (raíz)',
      verbs: 'Verbos (raíz)',
      topUnique: 'Top únicas',
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
    goToDashboard: 'Go to Dashboard 📊',
    metrics: {
      total: 'Total words',
      pronouns: 'Distinct pronouns',
      persons: 'Distinct persons',
      nouns: 'Nouns (lemma)',
      verbs: 'Verbs (lemma)',
      topUnique: 'Top unique',
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
    goToDashboard: 'Перейти к дашборду 📊',
    metrics: {
      total: 'Всего слов',
      pronouns: 'Местоимения (разные)',
      persons: 'Персоны (разные)',
      nouns: 'Существительные (лемма)',
      verbs: 'Глаголы (лемма)',
      topUnique: 'Топ (уникальные)',
    },
  },
};

// Iconos simplificados
const Icon = {
  Globe: () => <span>🌐</span>,
};

const LANG_LABELS: Record<LangISO, string> = { es: 'Español', en: 'English', ru: 'Русский' };

/** =======================
 *  Utilidades existentes
 *  ======================= */
const PRONOUNS: Record<LangISO, string[]> = {
  es: ['yo','tú','vos','usted','él','ella','nosotros','nosotras','ustedes','vosotros','vosotras','ellos','ellas','me','te','se','mi','tu','su','nos','les','lo','la','los','las'],
  en: ['i','you','he','she','we','they','me','him','her','us','them','my','your','his','our','their','its'],
  ru: ['я','ты','вы','он','она','оно','мы','они','меня','тебя','вас','его','её','нас','их','мой','твой','ваш','наш','их']
};
const NON_WORD = /[^0-9A-Za-z\u00C0-\u024F\u0400-\u04FF''-]+/g;
const TRIM_PUNCT = /^[''\-]+|[''\-]+$/g;

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

/** =======================
 *  Exportar a JSON
 *  ======================= */
function exportJSON(data: any, filename = 'lexical_analysis.json') {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// === API ===
const API_BASE = 'https://lexicoreapi-production.up.railway.app';
const API = {
  upload: `${API_BASE}/api/documentos`,
  analyze: (id: number | string) => `${API_BASE}/api/analisis/${id}`,
  reportPdf: (id: number | string) => `${API_BASE}/api/reportes/analisis/${id}`,
  reportEmail: (id: number | string, to?: string) =>
    `${API_BASE}/api/reportes/analisis/${id}/enviar${to ? `?to=${encodeURIComponent(to)}` : ''}`,
};

async function uploadDocumento(file: File, usuarioId: number, codigoIso: 'es'|'en'|'ru') {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('archivo', file);
  fd.append('usuarioId', String(usuarioId ?? 1));
  fd.append('lang', codigoIso);
  fd.append('codigoIso', codigoIso);

  const token = localStorage.getItem('token') || '';
  const res = await fetch(API.upload, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: fd,
  });
  if (!res.ok) throw new Error(`Error al subir documento (${res.status})`);
  const data = await res.json().catch(() => ({} as any));
  const id = data?.id ?? data?.documentoId ?? data?.data?.id ?? data?.data?.documentoId;
  if (id == null) throw new Error('La API no devolvió documentoId');
  return Number(id);
}

async function analizarDocumento(documentoId: number | string) {
  const token = localStorage.getItem('token') || '';
  let resp = await fetch(API.analyze(documentoId), { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : undefined });
  if (!resp.ok && (resp.status === 404 || resp.status === 405)) {
    resp = await fetch(API.analyze(documentoId), { method: 'GET', headers: token ? { Authorization: `Bearer ${token}` } : undefined });
  }
  if (!resp.ok) throw new Error(`Error en análisis (${resp.status})`);
  return resp.json();
}


/** =======================
 *  COMPONENTE PRINCIPAL
 *  ======================= */
const DashboardPage: React.FC = () => {
  const { authState, logout } = useAuth();
  
  const displayName = 
    authState.user?.fullName || 
    authState.user?.nickname || 
    authState.user?.email?.split('@')[0] ||
    'Usuario';

  const [documentId, setDocumentId] = useState<number | null>(null);
  const [uiLang, setUiLang] = useState<UiLang>('es');
  const [lang, setLang] = useState<LangISO>('es');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState<string>('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showCharts, setShowCharts] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const T = UI_STR[uiLang];

  /** Leer archivo .txt */
  const handleFile = (file: File | null) => {
    if (!file) return;
    setSelectedFile(file);
    setResult(null);
    setErrorMsg(null);
    setShowCharts(false);

    const reader = new FileReader();
    reader.onload = () => {
      const content = reader.result as string;
      setRawText(content);
    };
    reader.onerror = () => {
      setErrorMsg('Error al leer el archivo.');
    };
    reader.readAsText(file, 'UTF-8');
  };

  /** Procesar análisis */
  const onProcess = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setErrorMsg(null);
    setResult(null);
    setShowCharts(false);

    try {
      const usuarioId = Number((authState?.user?.id as any) ?? 1) || 1;
      const docId = await uploadDocumento(selectedFile, usuarioId, lang);
      setDocumentId(docId);

      const apiResp = await analizarDocumento(docId);
      const normalized = analyzeLocally(rawText, lang);
      normalized.totalWords = apiResp?.totalWords ?? apiResp?.totalPalabras ?? normalized.totalWords;

      setResult(normalized);
    } catch (err: any) {
      setResult(analyzeLocally(rawText, lang));
      setErrorMsg(err?.message || 'Falling back to local analysis.');
    } finally {
      setLoading(false);
    }
  };

  /** Exportar resultados */
  const handleExport = async () => {
    if (!result || documentId == null) return;
    const userMail = authState?.user?.email || 'tu correo';
    const send = window.confirm(`¿Quieres ENVIAR el PDF al correo ${userMail}? 
Pulsa "Aceptar" para ENVIARLO por correo o "Cancelar" para DESCARGARLO.`);
    
    if (send) {
      await handleSendEmail();
      return;
    }
    
    // Descarga PDF
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

  /** ✅ Enviar email MEJORADO */
  const handleSendEmail = async () => {
    if (!result || documentId == null) return;
    
    try {
      const token = localStorage.getItem('token') || '';
      const userEmail = authState?.user?.email?.trim() || '';
      
      // ✅ Validación del email
      if (!userEmail) {
        alert('❌ No se encontró un email válido en tu sesión.');
        return;
      }

      console.log('📧 Enviando email a:', userEmail);
      console.log('📄 Documento ID:', documentId);
      console.log('🔗 URL:', API.reportEmail(documentId, userEmail));

      const res = await fetch(API.reportEmail(documentId, userEmail), {
        method: 'POST',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          'Content-Type': 'application/json'  // ✅ Agregado
        }
      });

      console.log('📊 Response status:', res.status);

      if (res.status === 401) {
        alert('🔐 Sesión expirada. Por favor, inicia sesión nuevamente.');
        logout();
        return;
      }

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        console.error('❌ Error response:', text);
        
        let errorMsg = `Error ${res.status}: ${res.statusText}`;
        
        try {
          const errorJson = JSON.parse(text);
          errorMsg = errorJson?.mensaje || errorJson?.message || errorMsg;
        } catch {
          // Si no es JSON, usar el texto tal cual
          errorMsg = text || errorMsg;
        }
        
        throw new Error(errorMsg);
      }

      const data = await res.json().catch(() => ({}));
      console.log('✅ Response data:', data);
      
      alert(`✅ ${data?.mensaje || 'Reporte enviado correctamente'}\n📧 Destinatario: ${userEmail}`);
      
    } catch (e: any) {
      console.error('❌ Error completo:', e);
      alert(`❌ Error al enviar el PDF por correo:\n\n${e?.message || 'Error desconocido'}`);
    }
  };

  /** Cerrar sesión */
  const handleLogout = () => {
    if (window.confirm('¿Seguro que quieres cerrar sesión?')) {
      logout();
    }
  };

  const canExport = !!result && documentId !== null;

  // Si el usuario está viendo las gráficas
  if (showCharts && result) {
    return (
      <ChartsView
        result={result}
        uiLang={uiLang}
        onBack={() => setShowCharts(false)}
      />
    );
  }

  // Vista principal
  return (
    <div className="dash">
      {/* Header */}
      <header className="dash__header">
        <div>
          <h1>{T.title}</h1>
          <p className="dash__subtitle">{T.subtitle}</p>
        </div>

        <div className="dash__actions">
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

          <button className="btn btn--danger" onClick={handleLogout} title={T.logout}>
            <span style={{display:'inline-flex',gap:8,alignItems:'center'}}>{T.logout}</span>
          </button>
        </div>
      </header>

      {/* Barra superior */}
      <section className="bar">
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
              setShowCharts(false);
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
                <div className="grid-2">
                  <div className="metric"><span>{T.metrics.total}</span><strong>{result.totalWords}</strong></div>
                  <div className="metric"><span>{T.metrics.pronouns}</span><strong>{result.pronouns.length}</strong></div>
                  <div className="metric"><span>{T.metrics.persons}</span><strong>{result.persons.length}</strong></div>
                  <div className="metric"><span>{T.metrics.nouns}</span><strong>{result.nounsLemma.length}</strong></div>
                  <div className="metric"><span>{T.metrics.verbs}</span><strong>{result.verbsLemma.length}</strong></div>
                  <div className="metric"><span>{T.metrics.topUnique}</span><strong>{result.topWords.length}</strong></div>
                </div>

                <button
                  className="btn btn--dashboard"
                  onClick={() => setShowCharts(true)}
                  style={{
                    marginTop: 20,
                    width: '100%',
                    fontSize: '1.05rem',
                    fontWeight: 700,
                    padding: '14px 20px',
                  }}
                >
                  {T.goToDashboard}
                </button>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default DashboardPage;