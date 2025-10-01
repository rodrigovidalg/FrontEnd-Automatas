import type { AnalisisResumen } from "../types";
import { PDFDownloadLink, Page, Text, View, Document, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 24 },
  title: { fontSize: 18, marginBottom: 12 },
  section: { marginBottom: 10 },
  item: { fontSize: 12, marginBottom: 2 },
});

function ReportDoc({ data }: { data: AnalisisResumen }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Reporte de Análisis Léxico</Text>
        <View style={styles.section}>
          <Text style={styles.item}>Total de palabras: {data.totalPalabras}</Text>
          <Text style={{ marginTop: 6, fontSize: 14 }}>Top palabras:</Text>
          {data.topPalabras.map((t, i) => (
            <Text key={i} style={styles.item}>{t.palabra}: {t.frecuencia}</Text>
          ))}
        </View>
        <View style={styles.section}>
          <Text style={{ fontSize: 14 }}>Pronombres detectados: {data.pronombres.length}</Text>
        </View>
      </Page>
    </Document>
  );
}

export default function ReportBuilder({ data }: { data: AnalisisResumen | null }) {
  if (!data) return null;
  return (
    <div className="card-dark p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-100">Generación de Reporte</h3>
        <PDFDownloadLink document={<ReportDoc data={data} />} fileName="reporte-analisis.pdf">
          {({ loading }) => (
            <button className="btn-success">{loading ? "Generando..." : "Descargar PDF"}</button>
          )}
        </PDFDownloadLink>
      </div>
    </div>
  );
}
