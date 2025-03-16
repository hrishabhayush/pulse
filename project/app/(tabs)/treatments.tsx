import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, RefreshControl } from 'react-native';
import { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

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

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  timeOfDay: string[];
  refillDate?: string;
  instructions: string;
  image: string;
}

export default function TreatmentsScreen() {
  const [activeTab, setActiveTab] = useState('current');
  const [consultation, setConsultation] = useState<ConsultationData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiGeneratedMeds, setAiGeneratedMeds] = useState<Medication[]>([]);
  
  // Default medications as fallback
  const defaultMedications: Medication[] = [
    {
      id: '1',
      name: 'Albuterol Inhaler',
      dosage: '90mcg',
      frequency: 'As needed',
      timeOfDay: ['As needed for shortness of breath'],
      instructions: 'Use 2 puffs every 4-6 hours as needed for shortness of breath or wheezing.',
      image: 'https://www.drugs.com/images/pills/nlm/167140101.jpg'
    },
    {
      id: '2',
      name: 'Cetirizine',
      dosage: '10mg',
      frequency: 'Once daily',
      timeOfDay: ['Morning'],
      refillDate: '2024-06-15',
      instructions: 'Take one tablet daily in the morning for seasonal allergies.',
      image: 'https://www.drugs.com/images/pills/fio/ABR06090.JPG'
    }
  ];
  
  const pastMedications: Medication[] = [
    {
      id: '3',
      name: 'Amoxicillin',
      dosage: '500mg',
      frequency: 'Three times daily',
      timeOfDay: ['Morning', 'Afternoon', 'Evening'],
      instructions: 'Take with food. Completed full course for strep throat in January 2024.',
      image: 'https://www.drugs.com/images/pills/fio/STA04230.JPG'
    }
  ];
  
  // Helper function to get API URL based on environment
  const getApiUrl = () => {
    // For an iOS simulator, localhost works
    // For Android emulator, use 10.0.2.2
    // For physical devices, use your computer's IP address
    return 'http://localhost:5001'; // Modify as needed
  };
  
  const fetchLatestConsultation = async () => {
    setRefreshing(true);
    try {
      console.log("Fetching from:", `${getApiUrl()}/consultations/latest`);
      const response = await fetch(`${getApiUrl()}/consultations/latest`);
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Successfully fetched consultation data");
      setConsultation(data);
      
      // Generate medications based on the consultation
      const generatedMeds = generateMedicationsFromConsultation(data);
      setAiGeneratedMeds(generatedMeds);
      
      setError(null);
    } catch (err) {
      console.error('Error fetching consultation:', err);
      setError(`Network issue. Please check your connection.`);
      // Fall back to default medications
      setAiGeneratedMeds(defaultMedications);
    } finally {
      setRefreshing(false);
    }
  };
  
  // Fetch data when component mounts
  useEffect(() => {
    fetchLatestConsultation();
  }, []);
  
  const onRefresh = () => {
    fetchLatestConsultation();
  };
  
  // Function to analyze consultation and generate medication recommendations
  const generateMedicationsFromConsultation = (data: ConsultationData): Medication[] => {
    const medications: Medication[] = [];
    const symptoms = data.symptoms.toLowerCase();
    const conversations = data.conversation_history;
    
    // Find doctor recommendations in conversation
    const doctorMessages = conversations.filter(item => item.doctor && 
      (item.doctor.toLowerCase().includes('recommend') || 
       item.doctor.toLowerCase().includes('take') ||
       item.doctor.toLowerCase().includes('medication')));
    
    // Check for common conditions based on symptoms and conversation
    
    // For back pain
    if (symptoms.includes('back pain') || 
        doctorMessages.some(msg => msg.doctor?.toLowerCase().includes('back pain'))) {
      
      medications.push({
        id: 'ai-1',
        name: 'Ibuprofen',
        dosage: '400-600mg',
        frequency: 'Every 6-8 hours as needed',
        timeOfDay: ['As needed for pain'],
        instructions: 'Take with food to minimize stomach upset. Use for back pain relief and reduce inflammation.',
        image: 'https://www.drugs.com/images/pills/nlm/006035401.jpg'
      });
      
      medications.push({
        id: 'ai-2',
        name: 'Muscle Relaxant (OTC)',
        dosage: 'As directed',
        frequency: 'As needed',
        timeOfDay: ['As needed for muscle spasm'],
        instructions: 'Use as directed for muscle spasms. Apply ice packs for 15-20 minutes at a time to reduce pain and swelling.',
        image: 'https://www.drugs.com/images/pills/mmx/t110118f/muscle-relaxant.jpg'
      });
    }
    
    // For headaches
    else if (symptoms.includes('headache') || 
             doctorMessages.some(msg => msg.doctor?.toLowerCase().includes('headache'))) {
      
      medications.push({
        id: 'ai-1',
        name: 'Acetaminophen (Tylenol)',
        dosage: '500-1000mg',
        frequency: 'Every 6 hours as needed',
        timeOfDay: ['As needed for pain'],
        instructions: 'Do not exceed 3000mg in 24 hours. Use for headache relief.',
        image: 'https://www.drugs.com/images/pills/mtm/004904011.jpg'
      });
    }
    
    // For respiratory issues
    else if (symptoms.includes('cough') || symptoms.includes('congestion') || 
             doctorMessages.some(msg => msg.doctor?.toLowerCase().includes('cold'))) {
      
      medications.push({
        id: 'ai-1',
        name: 'Guaifenesin (Mucinex)',
        dosage: '400mg',
        frequency: 'Every 12 hours',
        timeOfDay: ['Morning', 'Evening'],
        instructions: 'Take with a full glass of water to help loosen congestion.',
        image: 'https://www.drugs.com/images/pills/fio/RBX02610.JPG'
      });
      
      medications.push({
        id: 'ai-2',
        name: 'Acetaminophen (Tylenol)',
        dosage: '500mg',
        frequency: 'Every 6 hours as needed',
        timeOfDay: ['As needed for fever/pain'],
        instructions: 'Do not exceed 3000mg in 24 hours. Use for fever and pain relief.',
        image: 'https://www.drugs.com/images/pills/mtm/004904011.jpg'
      });
    }
    
    // For leg pain/sports injury (based on your sample conversation)
    else if (symptoms.includes('leg pain') || 
             doctorMessages.some(msg => msg.doctor?.toLowerCase().includes('football'))) {
      
      medications.push({
        id: 'ai-1',
        name: 'Ibuprofen',
        dosage: '400-600mg',
        frequency: 'Every 6-8 hours as needed',
        timeOfDay: ['As needed for pain'],
        instructions: 'Take with food. Use for pain relief and to reduce inflammation from sports injury.',
        image: 'https://www.drugs.com/images/pills/nlm/006035401.jpg'
      });
      
      medications.push({
        id: 'ai-2',
        name: 'Cold Pack Therapy',
        dosage: '15-20 minutes',
        frequency: 'Several times daily',
        timeOfDay: ['As needed for swelling'],
        instructions: 'Apply ice packs for 15-20 minutes at a time to reduce pain and swelling. Rest the affected area.',
        image: 'https://www.drugs.com/otc/113825/cold-therapy-pack.jpg'
      });
    }
    
    // If no specific condition detected, or as a default
    if (medications.length === 0) {
      medications.push({
        id: 'ai-1',
        name: 'Acetaminophen (Tylenol)',
        dosage: '500mg',
        frequency: 'Every 6 hours as needed',
        timeOfDay: ['As needed for pain/fever'],
        instructions: 'Do not exceed 3000mg in 24 hours. General pain reliever and fever reducer.',
        image: 'https://www.drugs.com/images/pills/mtm/004904011.jpg'
      });
    }
    
    // Add a disclaimer medication card
    medications.push({
      id: 'disclaimer',
      name: 'IMPORTANT: Consult a Doctor',
      dosage: '',
      frequency: '',
      timeOfDay: [''],
      instructions: 'These recommendations are based on AI analysis of your symptoms. Always consult with a healthcare professional before starting any medication.',
      image: 'https://www.drugs.com/images/pills/mmx/t110118f/caution.jpg'
    });
    
    return medications;
  };
  
  const renderMedicationList = (meds: Medication[]) => {
    if (meds.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="medical" size={48} color="#cbd5e1" />
          <Text style={styles.emptyStateText}>No medications to display</Text>
        </View>
      );
    }
    
    return meds.map(med => (
      <View key={med.id} style={[styles.medicationCard, med.id === 'disclaimer' && styles.disclaimerCard]}>
        <View style={styles.medicationHeader}>
          <Image 
            source={{ uri: med.image }} 
            style={styles.medicationImage} 
            onError={() => console.log(`Failed to load image for ${med.name}`)}
          />
          <View style={styles.medicationInfo}>
            <Text style={[
              styles.medicationName, 
              med.id === 'disclaimer' && styles.disclaimerText
            ]}>
              {med.name}
            </Text>
            {med.dosage && (
              <Text style={styles.medicationDosage}>{med.dosage} • {med.frequency}</Text>
            )}
            {med.refillDate && (
              <View style={styles.refillContainer}>
                <Ionicons name="calendar" size={14} color="#64748b" />
                <Text style={styles.refillText}>Refill by {new Date(med.refillDate).toLocaleDateString()}</Text>
              </View>
            )}
          </View>
        </View>
        
        {med.id !== 'disclaimer' && <View style={styles.divider} />}
        
        {(med.timeOfDay[0] !== '' && med.id !== 'disclaimer') && (
          <View style={styles.scheduleContainer}>
            <Text style={styles.scheduleTitle}>Schedule</Text>
            <View style={styles.scheduleItems}>
              {med.timeOfDay.map((time, index) => (
                <View key={index} style={styles.scheduleItem}>
                  <Ionicons name="time" size={16} color="#64748b" />
                  <Text style={styles.scheduleText}>{time}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
        
        <View style={styles.instructionsContainer}>
          {med.id !== 'disclaimer' && (
            <Text style={styles.instructionsTitle}>Instructions</Text>
          )}
          <Text style={[
            styles.instructionsText,
            med.id === 'disclaimer' && styles.disclaimerInstructions
          ]}>
            {med.instructions}
          </Text>
        </View>
        
        {activeTab === 'current' && med.id !== 'disclaimer' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="notifications" size={16} color="#0891b2" />
              <Text style={styles.actionButtonText}>Set Reminder</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="refresh" size={16} color="#0891b2" />
              <Text style={styles.actionButtonText}>Request Refill</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    ));
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Treatments</Text>
        <Text style={styles.headerSubtitle}>
          {consultation?.patient?.name || 'Patient'}, 
          {consultation?.patient?.age || '20'} years old
        </Text>
      </View>
      
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'current' && styles.activeTab]} 
          onPress={() => setActiveTab('current')}
        >
          <Text style={[styles.tabText, activeTab === 'current' && styles.activeTabText]}>Current</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'past' && styles.activeTab]} 
          onPress={() => setActiveTab('past')}
        >
          <Text style={[styles.tabText, activeTab === 'past' && styles.activeTabText]}>Past</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        
        {activeTab === 'current' ? renderMedicationList(aiGeneratedMeds.length > 0 ? aiGeneratedMeds : defaultMedications) : renderMedicationList(pastMedications)}
        
        {activeTab === 'current' && (
          <TouchableOpacity style={styles.addButton}>
            <Ionicons name="add" size={24} color="#ffffff" />
            <Text style={styles.addButtonText}>Add Medication</Text>
          </TouchableOpacity>
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
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#64748b',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#0891b2',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  activeTabText: {
    color: '#0891b2',
  },
  scrollContent: {
    padding: 16,
    paddingTop: 0,
  },
  medicationCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
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
  disclaimerCard: {
    backgroundColor: '#fff8f1',
    borderLeftWidth: 4,
    borderLeftColor: '#f97316',
  },
  medicationHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  medicationImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 16,
    backgroundColor: '#f1f5f9',
  },
  medicationInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  medicationName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  disclaimerText: {
    color: '#b45309',
    fontWeight: '700',
  },
  medicationDosage: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 4,
  },
  refillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refillText: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginBottom: 16,
  },
  scheduleContainer: {
    marginBottom: 16,
  },
  scheduleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  scheduleItems: {
    flexDirection: 'column',
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  scheduleText: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 8,
  },
  instructionsContainer: {
    marginBottom: 16,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
  },
  disclaimerInstructions: {
    fontWeight: '500',
    color: '#b45309',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0891b2',
    marginLeft: 12,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#0891b2',
    marginLeft: 4,
  },
  addButton: {
    backgroundColor: '#0891b2',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#94a3b8',
    marginTop: 16,
  },
  errorContainer: {
    padding: 15,
    backgroundColor: '#fee2e2',
    borderRadius: 10,
    marginBottom: 15,
  },
  errorText: {
    color: '#b91c1c',
    fontWeight: '500',
  },
});