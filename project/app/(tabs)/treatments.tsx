import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Clock, Calendar, CircleAlert as AlertCircle, AlertTriangle } from 'lucide-react-native';
import { format, parseISO } from 'date-fns';

// Define interfaces for the consultation data
interface Patient {
  name: string;
  age: number;
  sex: string;
}

interface ConversationItem {
  user?: string;
  doctor?: string;
  timestamp: string;
}

interface ConsultationData {
  patient: Patient;
  consultation_date: string;
  symptoms: string;
  medical_history: string;
  medications: string;
  conversation_history: ConversationItem[];
  call_duration: number;
}

interface DifferentialDiagnosis {
  primary: string;
  alternative: string[];
  confidence: string;
}

export default function TreatmentsScreen() {
  const [consultation, setConsultation] = useState<ConsultationData | null>(null);
  const [differentialDiagnosis, setDifferentialDiagnosis] = useState<DifferentialDiagnosis | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLatestConsultation = async () => {
    setRefreshing(true);
    try {
      // Update with your actual local server address (including port)
      // If testing on device, use your computer's IP address instead of localhost
      const response = await fetch('http://localhost:5001/consultations/latest');
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("Fetched data:", data); // Add logging to debug
      
      if (!data || !data.patient) {
        throw new Error("Invalid consultation data format");
      }
      
      setConsultation(data);
      
      // Generate a differential diagnosis based on the consultation data
      if (data.symptoms && data.conversation_history) {
        const diagnosis = analyzeSymptomsForDiagnosis(data.symptoms, data.conversation_history);
        setDifferentialDiagnosis(diagnosis);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching consultation:', err);
      setError(`Could not load treatment data: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setRefreshing(false);
    }
  };

  // Fetch data when component mounts and set up polling
  useEffect(() => {
    fetchLatestConsultation();
    
    // Polling every 10 seconds to check for updates
    const intervalId = setInterval(fetchLatestConsultation, 10000);
    
    return () => clearInterval(intervalId);
  }, []);

  const onRefresh = () => {
    fetchLatestConsultation();
  };

  // Analyze symptoms to create a differential diagnosis
  const analyzeSymptomsForDiagnosis = (symptomsText: string, history: ConversationItem[]): DifferentialDiagnosis => {
    // Extract key symptoms from the text
    const symptoms = symptomsText.toLowerCase();
    let primaryDiagnosis = '';
    const alternativeDiagnoses: string[] = [];
    
    // Check for common diagnoses based on symptoms and doctor conversation
    const doctorMessages = history.filter(item => item.doctor && 
      (item.doctor.includes("diagnosis") || 
       item.doctor.includes("Based on what you've told me") || 
       item.doctor.includes("sounds like")));
    
    if (doctorMessages.length > 0) {
      // Extract diagnoses from doctor messages
      const message = doctorMessages[0].doctor || "";
      
      // Try to extract a diagnosis from the message
      if (message.includes("muscle strain") || message.includes("back pain")) {
        primaryDiagnosis = "Muscle Strain (Back)";
        alternativeDiagnoses.push("Lumbar Sprain", "Musculoskeletal Pain");
      } else if (message.includes("cold") || message.includes("respiratory")) {
        primaryDiagnosis = "Upper Respiratory Tract Infection";
        alternativeDiagnoses.push("Common Cold", "Viral Rhinitis");
      } else if (message.includes("headache") || message.includes("migraine")) {
        primaryDiagnosis = "Tension Headache";
        alternativeDiagnoses.push("Migraine", "Stress-related Headache");
      } else {
        // Default diagnosis based on symptoms
        if (symptoms.includes("back pain") || symptoms.includes("leg pain")) {
          primaryDiagnosis = "Musculoskeletal Pain";
          alternativeDiagnoses.push("Muscle Strain", "Lumbar Sprain");
        } else if (symptoms.includes("headache") || symptoms.includes("head pain")) {
          primaryDiagnosis = "Tension Headache";
          alternativeDiagnoses.push("Migraine", "Stress-related Headache");
        } else {
          primaryDiagnosis = "Symptomatic Pain";
          alternativeDiagnoses.push("Generalized Discomfort", "Minor Injury");
        }
      }
    } else {
      // If no doctor messages with diagnosis, make best guess from symptoms
      if (symptoms.includes("back pain") || symptoms.includes("leg pain")) {
        primaryDiagnosis = "Musculoskeletal Pain";
        alternativeDiagnoses.push("Muscle Strain", "Lumbar Sprain");
      } else if (symptoms.includes("headache") || symptoms.includes("head pain")) {
        primaryDiagnosis = "Tension Headache";
        alternativeDiagnoses.push("Migraine", "Stress-related Headache");
      } else {
        primaryDiagnosis = "Symptomatic Pain";
        alternativeDiagnoses.push("Generalized Discomfort", "Minor Injury");
      }
    }
    
    return {
      primary: primaryDiagnosis,
      alternative: alternativeDiagnoses,
      confidence: "Moderate - requires clinical confirmation"
    };
  };

  // Extract appropriate medications based on diagnosis
  const recommendMedications = (diagnosis: DifferentialDiagnosis) => {
    const medications = [];
    
    // For back pain/muscle strain
    if (diagnosis.primary.includes("Muscle") || 
        diagnosis.primary.includes("Back") || 
        diagnosis.primary.includes("Musculoskeletal")) {
      medications.push({
        name: 'Ibuprofen',
        dosage: '400-600mg',
        duration: 'Every 6-8 hours as needed for pain (max 3200mg/day)',
        purpose: 'Pain relief and anti-inflammatory'
      });
      
      medications.push({
        name: 'Muscle Relaxant (Cyclobenzaprine)',
        dosage: '5-10mg',
        duration: 'Every 8 hours as needed for muscle spasm',
        purpose: 'Relieve muscle spasms'
      });
      
      medications.push({
        name: 'Topical Analgesic (Menthol/Camphor)',
        dosage: 'Apply thin layer',
        duration: '3-4 times daily to affected area',
        purpose: 'Local pain relief'
      });
    }
    // For headaches
    else if (diagnosis.primary.includes("Headache") || diagnosis.primary.includes("Migraine")) {
      medications.push({
        name: 'Acetaminophen (Tylenol)',
        dosage: '500-1000mg',
        duration: 'Every 6 hours as needed for headache (max 3000mg/day)',
        purpose: 'Pain relief'
      });
      
      medications.push({
        name: 'Ibuprofen',
        dosage: '400mg',
        duration: 'Every 6-8 hours as needed for pain (max 3200mg/day)',
        purpose: 'Pain relief and anti-inflammatory'
      });
    }
    // For respiratory issues
    else if (diagnosis.primary.includes("Cold") || diagnosis.primary.includes("Respiratory")) {
      medications.push({
        name: 'Acetaminophen (Tylenol)',
        dosage: '500-1000mg',
        duration: 'Every 6 hours as needed for fever/pain (max 3000mg/day)',
        purpose: 'Fever and pain relief'
      });
      
      medications.push({
        name: 'Guaifenesin (Mucinex)',
        dosage: '400-600mg',
        duration: 'Every 12 hours',
        purpose: 'Expectorant for congestion'
      });
      
      medications.push({
        name: 'Saline Nasal Spray',
        dosage: '2 sprays per nostril',
        duration: '4 times daily as needed',
        purpose: 'Nasal congestion relief'
      });
    }
    // Default for general pain
    else {
      medications.push({
        name: 'Acetaminophen (Tylenol)',
        dosage: '500-1000mg',
        duration: 'Every 6 hours as needed (max 3000mg/day)',
        purpose: 'Pain relief'
      });
      
      medications.push({
        name: 'Ibuprofen',
        dosage: '400mg',
        duration: 'Every 6-8 hours as needed (max 3200mg/day)',
        purpose: 'Pain relief and anti-inflammatory'
      });
    }
    
    return medications;
  };

  // Extract follow-up instructions
  const extractFollowUp = (history: ConversationItem[], diagnosis: DifferentialDiagnosis | null) => {
    const instructions = [];
    
    // Add diagnosis-specific follow-up instructions
    if (diagnosis) {
      if (diagnosis.primary.includes("Muscle") || diagnosis.primary.includes("Back")) {
        instructions.push('Consult with a physician if pain persists beyond 7 days');
        instructions.push('Seek immediate care if you develop numbness, tingling, or severe pain');
      } else if (diagnosis.primary.includes("Headache")) {
        instructions.push('Consult with a physician if headaches become more frequent or severe');
        instructions.push('Seek immediate care if headache is accompanied by fever, stiff neck, or confusion');
      } else if (diagnosis.primary.includes("Respiratory") || diagnosis.primary.includes("Cold")) {
        instructions.push('Consult with a physician if symptoms persist beyond 10 days');
        instructions.push('Seek immediate care if you develop high fever, shortness of breath, or chest pain');
      }
    }
    
    // Extract any follow-up instructions from conversation
    const doctorMessages = history.filter(item => 
      item.doctor && (
        item.doctor.toLowerCase().includes('follow up') || 
        item.doctor.toLowerCase().includes('see a doctor') ||
        item.doctor.toLowerCase().includes('gets worse')
      )
    );
    
    if (doctorMessages.length > 0) {
      const message = doctorMessages[0].doctor || "";
      if (message.toLowerCase().includes('if the pain gets worse')) {
        instructions.push('Return if pain worsens or new symptoms develop');
      }
      if (message.toLowerCase().includes('follow up')) {
        instructions.push('Follow up with your primary care provider');
      }
    }
    
    return instructions.length > 0 ? instructions : ['Follow up if symptoms worsen or persist beyond one week'];
  };

  // Extract general advice
  const extractAdvice = (history: ConversationItem[], diagnosis: DifferentialDiagnosis | null) => {
    const advice = [];
    
    // Add diagnosis-specific advice
    if (diagnosis) {
      if (diagnosis.primary.includes("Muscle") || diagnosis.primary.includes("Back")) {
        advice.push('Apply ice for 15-20 minutes every 2-3 hours for the first 48-72 hours');
        advice.push('Rest the affected area but maintain gentle movement');
        advice.push('Avoid activities that worsen the pain');
      } else if (diagnosis.primary.includes("Headache")) {
        advice.push('Rest in a quiet, dark room during episodes');
        advice.push('Identify and avoid headache triggers (stress, certain foods, lack of sleep)');
        advice.push('Maintain regular sleep schedule');
      } else if (diagnosis.primary.includes("Respiratory") || diagnosis.primary.includes("Cold")) {
        advice.push('Rest and stay hydrated');
        advice.push('Use a humidifier to ease congestion');
        advice.push('Gargle with warm salt water for sore throat');
      }
    }
    
    // Extract advice from conversation
    const doctorMessages = history.filter(item => 
      item.doctor && (
        item.doctor.toLowerCase().includes('recommend') || 
        item.doctor.toLowerCase().includes('advise') ||
        item.doctor.toLowerCase().includes('advice')
      )
    );
    
    if (doctorMessages.length > 0) {
      const message = doctorMessages[0].doctor || "";
      
      if (message.toLowerCase().includes('rest')) {
        advice.push('Rest as needed and avoid overexertion');
      }
      
      if (message.toLowerCase().includes('hydrate') || message.toLowerCase().includes('fluid')) {
        advice.push('Stay well-hydrated');
      }
      
      if (message.toLowerCase().includes('ice')) {
        advice.push('Apply ice to affected area to reduce inflammation');
      }
      
      if (message.toLowerCase().includes('warm up')) {
        advice.push('Warm up properly before physical activity');
      }
    }
    
    return advice;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : consultation ? (
          <>
            <View style={styles.patientCard}>
              <Text style={styles.patientName}>{consultation.patient.name}'s Treatment Plan</Text>
              <Text style={styles.consultationDate}>
                {format(parseISO(consultation.consultation_date), 'MMMM d, yyyy')}
              </Text>
            </View>
          
            {differentialDiagnosis && (
              <View style={styles.diagnosisCard}>
                <Text style={styles.diagnosisTitle}>Differential Diagnosis</Text>
                <Text style={styles.primaryDiagnosis}>{differentialDiagnosis.primary}</Text>
                
                <Text style={styles.alternativeLabel}>Alternative considerations:</Text>
                {differentialDiagnosis.alternative.map((alt, index) => (
                  <Text key={index} style={styles.alternativeDiagnosis}>• {alt}</Text>
                ))}
                
                <Text style={styles.confidenceLevel}>Confidence: {differentialDiagnosis.confidence}</Text>
                
                <View style={styles.warningContainer}>
                  <AlertTriangle size={20} color="#b91c1c" />
                  <Text style={styles.warningText}>
                    This is a preliminary diagnosis. Please consult a licensed healthcare professional for a complete evaluation.
                  </Text>
                </View>
              </View>
            )}
          
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recommended Medications</Text>
              {differentialDiagnosis ? (
                recommendMedications(differentialDiagnosis).map((med, index) => (
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
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No medications recommended</Text>
                </View>
              )}
              
              <View style={styles.disclaimerContainer}>
                <Text style={styles.disclaimerText}>
                  These medication recommendations are for informational purposes only. 
                  Please consult with a qualified healthcare provider before starting any new medication.
                </Text>
              </View>
            </View>
    
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Follow-up Instructions</Text>
              <View style={styles.card}>
                {differentialDiagnosis && 
                  extractFollowUp(consultation.conversation_history, differentialDiagnosis).map((item, index) => (
                    <Text key={index} style={styles.listItem}>• {item}</Text>
                  ))}
              </View>
            </View>
            
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>General Advice</Text>
              <View style={styles.card}>
                {differentialDiagnosis && 
                  extractAdvice(consultation.conversation_history, differentialDiagnosis).map((item, index) => (
                    <Text key={index} style={styles.listItem}>• {item}</Text>
                  ))}
              </View>
            </View>
          </>
        ) : (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>No treatment data available</Text>
          </View>
        )}
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
  patientCard: {
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
  patientName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  consultationDate: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  diagnosisCard: {
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
  diagnosisTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  primaryDiagnosis: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  alternativeLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#475569',
    marginBottom: 8,
  },
  alternativeDiagnosis: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 4,
    paddingLeft: 8,
  },
  confidenceLevel: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#64748b',
    marginTop: 8,
    marginBottom: 16,
  },
  warningContainer: {
    flexDirection: 'row',
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  warningText: {
    fontSize: 14,
    color: '#b91c1c',
    marginLeft: 8,
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
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
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  medicationName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 16,
    color: '#64748b',
    marginLeft: 8,
  },
  disclaimerContainer: {
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  disclaimerText: {
    fontSize: 14,
    color: '#1e40af',
    fontStyle: 'italic',
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
    fontSize: 16,
    color: '#1e293b',
    marginBottom: 8,
  },
  emptyState: {
    padding: 20,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#64748b',
  },
  errorContainer: {
    padding: 20,
    backgroundColor: '#fee2e2',
    borderRadius: 12,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#b91c1c',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#888',
  },
});