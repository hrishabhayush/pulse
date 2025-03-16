import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function HistoryScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Medical History</Text>
          <Text style={styles.headerSubtitle}>Alex Johnson, 20 years old</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="medical" size={24} color="#0891b2" />
            <Text style={styles.sectionTitle}>Medical Conditions</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.conditionItem}>
              <Text style={styles.conditionName}>Asthma</Text>
              <Text style={styles.conditionDetails}>Diagnosed at age 7</Text>
              <Text style={styles.conditionTreatment}>Well-controlled with albuterol inhaler as needed</Text>
              <View style={styles.statusContainer}>
                <View style={styles.statusIndicator}>
                  <Text style={styles.statusText}>Controlled</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="warning" size={24} color="#f59e0b" />
            <Text style={styles.sectionTitle}>Allergies</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.allergyItem}>
              <Text style={styles.allergyName}>Pollen</Text>
              <Text style={styles.allergyReaction}>Mild seasonal rhinitis</Text>
              <Text style={styles.allergyManagement}>Managed with OTC antihistamines</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="people" size={24} color="#8b5cf6" />
            <Text style={styles.sectionTitle}>Family History</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.familyItem}>
              <Text style={styles.familyRelation}>Father</Text>
              <Text style={styles.familyCondition}>Hypertension (diagnosed at age 45)</Text>
            </View>
            <View style={[styles.familyItem, styles.lastItem]}>
              <Text style={styles.familyRelation}>Maternal Grandmother</Text>
              <Text style={styles.familyCondition}>Type 2 Diabetes (diagnosed at age 60)</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="shield-checkmark" size={24} color="#10b981" />
            <Text style={styles.sectionTitle}>Immunizations</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.immunizationGrid}>
              <View style={styles.immunizationItem}>
                <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                <Text style={styles.immunizationText}>COVID-19</Text>
                <Text style={styles.immunizationDate}>Last dose: 03/2023</Text>
              </View>
              <View style={styles.immunizationItem}>
                <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                <Text style={styles.immunizationText}>Flu Shot</Text>
                <Text style={styles.immunizationDate}>Last dose: 10/2023</Text>
              </View>
              <View style={styles.immunizationItem}>
                <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                <Text style={styles.immunizationText}>Tdap</Text>
                <Text style={styles.immunizationDate}>Last dose: 05/2021</Text>
              </View>
              <View style={styles.immunizationItem}>
                <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                <Text style={styles.immunizationText}>HPV</Text>
                <Text style={styles.immunizationDate}>Completed: 2019</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="fitness" size={24} color="#ec4899" />
            <Text style={styles.sectionTitle}>Lifestyle</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.lifestyleGrid}>
              <View style={styles.lifestyleItem}>
                <Text style={styles.lifestyleLabel}>Exercise</Text>
                <Text style={styles.lifestyleValue}>3-4 times weekly</Text>
              </View>
              <View style={styles.lifestyleItem}>
                <Text style={styles.lifestyleLabel}>Smoking</Text>
                <Text style={styles.lifestyleValue}>Non-smoker</Text>
              </View>
              <View style={styles.lifestyleItem}>
                <Text style={styles.lifestyleLabel}>Alcohol</Text>
                <Text style={styles.lifestyleValue}>Occasional</Text>
              </View>
              <View style={styles.lifestyleItem}>
                <Text style={styles.lifestyleLabel}>Diet</Text>
                <Text style={styles.lifestyleValue}>Balanced</Text>
              </View>
            </View>
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
  header: {
    marginBottom: 24,
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
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
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
  conditionItem: {
    marginBottom: 8,
  },
  conditionName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  conditionDetails: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 4,
  },
  conditionTreatment: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row',
  },
  statusIndicator: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    color: '#10b981',
    fontWeight: '600',
    fontSize: 14,
  },
  allergyItem: {
    marginBottom: 8,
  },
  allergyName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  allergyReaction: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 4,
  },
  allergyManagement: {
    fontSize: 16,
    color: '#64748b',
  },
  familyItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  lastItem: {
    marginBottom: 0,
    paddingBottom: 0,
    borderBottomWidth: 0,
  },
  familyRelation: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  familyCondition: {
    fontSize: 16,
    color: '#64748b',
  },
  immunizationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  immunizationItem: {
    width: '48%',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'column',
  },
  immunizationText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 6,
    marginBottom: 2,
  },
  immunizationDate: {
    fontSize: 14,
    color: '#64748b',
  },
  lifestyleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  lifestyleItem: {
    width: '48%',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  lifestyleLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  lifestyleValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
});