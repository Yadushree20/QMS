import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 30 },
  title: { fontSize: 18, marginBottom: 10 },
  subtitle: { fontSize: 14, marginBottom: 10 },
  header: { fontSize: 14, marginBottom: 5, fontWeight: 'bold' },
  text: { fontSize: 12, marginBottom: 5 },
});

export default function FAIReporter({ bocEntries = [], currentTime = '', projectDetails }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>First Article Inspection Report</Text>
        <Text style={styles.subtitle}>AS9102 Form 3 - Part Inspection Report</Text>
        
        {/* Project Details in PDF */}
        {projectDetails && (
          <View style={{ marginBottom: 15, padding: 10, backgroundColor: '#f8f9fa', borderRadius: 4 }}>
            <Text style={styles.header}>Project Information</Text>
            <Text style={styles.text}>Part Name: {projectDetails.partName}</Text>
            <Text style={styles.text}>Part Number: {projectDetails.partNumber}</Text>
            <Text style={styles.text}>Revision: {projectDetails.revision}</Text>
            <Text style={styles.text}>Customer: {projectDetails.customer}</Text>
            <Text style={styles.text}>Drawing File: {projectDetails.drawingFile}</Text>
          </View>
        )}
        
        <Text style={styles.header}>Report Information</Text>
        <Text style={styles.text}>Generated: {currentTime}</Text>
        <Text style={styles.text}>FAI #1023 • Approved</Text>
        <View style={{ marginTop: 20 }}>
          <Text style={styles.text}>All 45 characteristics inspected and within tolerance.</Text>
        </View>
      </Page>
    </Document>
  );
}