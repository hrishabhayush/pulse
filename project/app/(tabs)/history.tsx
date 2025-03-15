import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HistoryScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Medical Conditions</Text>
          <View style={styles.card}>
            <View style={styles.conditionItem}>
              <Text style={styles.conditionName}>Pneumonia</Text>
              <Text style={styles.conditionDetails}>Occurred at age 5</Text>
              <Text style={styles.conditionTreatment}>Treatment not specified</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Allergies</Text>
          <View style={styles.card}>
            <Text style={styles.noDataText}>No known allergies</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Family History</Text>
          <View style={styles.card}>
            <Text style={styles.noDataText}>No significant family history reported</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Immunizations</Text>
          <View style={styles.card}>
            <Text style={styles.immunizationItem}>• COVID-19 Vaccination (Complete)</Text>
            <Text style={styles.immunizationItem}>• Flu Shot (Annual)</Text>
            <Text style={styles.immunizationItem}>• Tetanus (Up to date)</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: '#1e293b',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  conditionItem: {
    marginBottom: 16,
  },
  conditionName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#1e293b',
    marginBottom: 4,
  },
  conditionDetails: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#64748b',
    marginBottom: 4,
  },
  conditionTreatment: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#94a3b8',
  },
  noDataText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  immunizationItem: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#1e293b',
    marginBottom: 8,
  },
});