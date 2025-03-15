import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format } from 'date-fns';

export default function ConsultationsScreen() {
  const consultation = {
    diagnosis: "Upper Respiratory Tract Infection (Common Cold)",
    timestamp: "2025-03-13T23:35:18.868507",
    symptoms: [
      {
        name: "feeling cold",
        duration: "2 days",
        severity: "mild"
      },
      {
        name: "headaches",
        duration: "2 days",
        severity: "mild"
      },
      {
        name: "sneezing",
        duration: "2 days",
        severity: "moderate"
      }
    ]
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.consultationCard}>
          <Text style={styles.date}>
            {format(new Date(consultation.timestamp), 'MMMM d, yyyy')}
          </Text>
          <Text style={styles.time}>
            {format(new Date(consultation.timestamp), 'h:mm a')}
          </Text>
          
          <View style={styles.diagnosisContainer}>
            <Text style={styles.diagnosisLabel}>Diagnosis</Text>
            <Text style={styles.diagnosis}>{consultation.diagnosis}</Text>
          </View>

          <View style={styles.symptomsContainer}>
            <Text style={styles.symptomsTitle}>Reported Symptoms</Text>
            {consultation.symptoms.map((symptom, index) => (
              <View key={index} style={styles.symptomItem}>
                <Text style={styles.symptomName}>{symptom.name}</Text>
                <View style={styles.symptomDetails}>
                  <Text style={styles.symptomDuration}>Duration: {symptom.duration}</Text>
                  <Text style={[
                    styles.symptomSeverity,
                    { color: symptom.severity === 'mild' ? '#10b981' : 
                            symptom.severity === 'moderate' ? '#f59e0b' : '#ef4444' }
                  ]}>
                    Severity: {symptom.severity}
                  </Text>
                </View>
              </View>
            ))}
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
  consultationCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  date: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: '#1e293b',
    marginBottom: 4,
  },
  time: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#64748b',
    marginBottom: 16,
  },
  diagnosisContainer: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
  },
  diagnosisLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  diagnosis: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#1e293b',
  },
  symptomsContainer: {
    marginTop: 8,
  },
  symptomsTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#1e293b',
    marginBottom: 16,
  },
  symptomItem: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
  },
  symptomName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#1e293b',
    marginBottom: 8,
    textTransform: 'capitalize',
  },
  symptomDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  symptomDuration: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#64748b',
  },
  symptomSeverity: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
  },
});