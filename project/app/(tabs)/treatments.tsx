import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Clock, Calendar, CircleAlert as AlertCircle } from 'lucide-react-native';

export default function TreatmentsScreen() {
  const medications = [
    {
      name: "Acetaminophen (Tylenol)",
      dosage: "500mg every 6 hours as needed",
      duration: "5 days",
      purpose: "For fever and headache"
    },
    {
      name: "Dextromethorphan",
      dosage: "10-20mg every 4-6 hours as needed",
      duration: "5 days",
      purpose: "For cough"
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Medications</Text>
          {medications.map((med, index) => (
            <View key={index} style={styles.medicationCard}>
              <Text style={styles.medicationName}>{med.name}</Text>
              <View style={styles.infoRow}>
                <Clock size={16} color="#64748b" />
                <Text style={styles.infoText}>{med.dosage}</Text>
              </View>
              <View style={styles.infoRow}>
                <Calendar size={16} color="#64748b" />
                <Text style={styles.infoText}>{med.duration}</Text>
              </View>
              <View style={styles.infoRow}>
                <AlertCircle size={16} color="#64748b" />
                <Text style={styles.infoText}>{med.purpose}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Required Tests</Text>
          <View style={styles.card}>
            <Text style={styles.listItem}>• Rapid COVID-19 test</Text>
            <Text style={styles.listItem}>• Rapid strep test if sore throat persists</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Follow-up Instructions</Text>
          <View style={styles.card}>
            <Text style={styles.listItem}>• Return if symptoms worsen or persist beyond 7 days</Text>
            <Text style={styles.listItem}>• Seek immediate care if fever exceeds 103°F (39.4°C)</Text>
            <Text style={styles.listItem}>• Virtual check-up in 3 days if no improvement</Text>
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
  medicationCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  medicationName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#1e293b',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#64748b',
    marginLeft: 8,
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
  listItem: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#1e293b',
    marginBottom: 8,
  },
});