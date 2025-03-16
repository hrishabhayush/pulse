import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format, parseISO } from 'date-fns';

// Interface for the consultation data structure from your JSON file
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

export default function ConsultationsScreen() {
  const [consultation, setConsultation] = useState<ConsultationData | null>(null);
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
      setError(null);
    } catch (err) {
      console.error('Error fetching consultation:', err);
      setError(`Could not load consultation data: ${err instanceof Error ? err.message : 'Unknown error'}`);
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

  // Extract diagnosis from doctor's final assessment
  const extractDiagnosis = (history: ConversationItem[]) => {
    // Get the doctor's messages that are likely to contain assessments
    const doctorMessages = history.filter(item => item.doctor && item.doctor.includes("Based on what you've told me"));
    
    if (doctorMessages.length > 0) {
      // Take the first paragraph as a brief diagnosis
      const message = doctorMessages[0].doctor || "";
      const firstParagraph = message.split('\n\n')[0];
      return firstParagraph.replace("Based on what you've told me, ", "");
    }
    return "No diagnosis available";
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
          <View>
            <View style={styles.patientCard}>
              <Text style={styles.patientName}>{consultation.patient.name}</Text>
              <View style={styles.patientDetails}>
                <Text style={styles.patientDetail}>Age: {consultation.patient.age}</Text>
                <Text style={styles.patientDetail}>Sex: {consultation.patient.sex}</Text>
              </View>
              <Text style={styles.consultationDate}>
                {format(parseISO(consultation.consultation_date), 'MMMM d, yyyy')}
              </Text>
              <Text style={styles.callDuration}>Call duration: {Math.floor(consultation.call_duration / 60)}m {Math.floor(consultation.call_duration % 60)}s</Text>
            </View>
            
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Diagnosis</Text>
              <Text style={styles.sectionContent}>
                {extractDiagnosis(consultation.conversation_history)}
              </Text>
            </View>
            
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Reported Symptoms</Text>
              <Text style={styles.sectionContent}>{consultation.symptoms}</Text>
            </View>
            
            {consultation.medical_history && consultation.medical_history !== "Nope, not really." && (
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Medical History</Text>
                <Text style={styles.sectionContent}>{consultation.medical_history}</Text>
              </View>
            )}
            
            {consultation.medications && consultation.medications !== "No, I'm not." && (
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Current Medications</Text>
                <Text style={styles.sectionContent}>{consultation.medications}</Text>
              </View>
            )}
            
            <View style={styles.conversationCard}>
              <Text style={styles.sectionTitle}>Consultation Summary</Text>
              {consultation.conversation_history
                .filter(item => (item.user && item.user.length > 0) || (item.doctor && item.doctor.length > 0))
                .map((item, index) => (
                  <View key={index} style={item.user ? styles.userMessage : styles.doctorMessage}>
                    <Text style={styles.messageSender}>{item.user ? 'You' : 'Doctor'}</Text>
                    <Text style={styles.messageContent}>{item.user || item.doctor}</Text>
                    <Text style={styles.messageTime}>
                      {format(parseISO(item.timestamp), 'h:mm a')}
                    </Text>
                  </View>
                ))}
            </View>
          </View>
        ) : (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>No consultation data available</Text>
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
  patientDetails: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  patientDetail: {
    fontSize: 16,
    color: '#64748b',
    marginRight: 16,
  },
  consultationDate: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  callDuration: {
    fontSize: 14,
    color: '#64748b',
  },
  sectionCard: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  sectionContent: {
    fontSize: 16,
    color: '#334155',
    lineHeight: 24,
  },
  conversationCard: {
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
  userMessage: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    alignSelf: 'flex-end',
    maxWidth: '80%',
  },
  doctorMessage: {
    backgroundColor: '#e0f2fe',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    alignSelf: 'flex-start',
    maxWidth: '80%',
  },
  messageSender: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#475569',
    marginBottom: 4,
  },
  messageContent: {
    fontSize: 16,
    color: '#334155',
    lineHeight: 22,
  },
  messageTime: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 8,
    alignSelf: 'flex-end',
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