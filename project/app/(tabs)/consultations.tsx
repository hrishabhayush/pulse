import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system';
import { format } from 'date-fns';

export default function ConsultationsScreen() {
  interface Consultation {
    timestamp: string;
    diagnosis: string;
    symptoms: { name: string; duration: string; severity: string }[];
  }

  const [consultations, setConsultations] = useState<Consultation[]>([]);

  useEffect(() => {
    const loadConsultations = async () => {
      try {
        const dirUri = FileSystem.documentDirectory + 'consultations/';
        const files = await FileSystem.readDirectoryAsync(dirUri);
        const newConsultations = [];
        for (const file of files) {
          if (file.endsWith('.json')) {
            const content = await FileSystem.readAsStringAsync(dirUri + file);
            const data = JSON.parse(content);
            newConsultations.push(data);
          }
        }
        setConsultations(newConsultations);
        console.log(`Loaded ${newConsultations.length} consultations`);
      } catch (error) {
        console.error('Failed to load consultations:', error);
      }
    };
    
    loadConsultations();
    const intervalId = setInterval(loadConsultations, 5000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {consultations.map((consultation, index) => (
          <View key={index} style={styles.consultationCard}>
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
              {consultation.symptoms.map((symptom, idx) => (
                <View key={idx} style={styles.symptomItem}>
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
        ))}
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