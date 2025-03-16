import { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';

export default function HomeScreen() {
  const [showTips, setShowTips] = useState(true);
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <View style={styles.welcomeContent}>
            <Text style={styles.welcomeText}>Hello, <Text style={styles.nameText}>Alex</Text></Text>
            <Text style={styles.dateText}>Sunday, March 16, 2025</Text>
          </View>
          <Image 
            source={{ uri: 'https://randomuser.me/api/portraits/men/32.jpg' }} 
            style={styles.profileImage} 
          />
        </View>
        
        {/* Call Doctor Section */}
        <View style={styles.callSection}>
          <View style={styles.callContent}>
            <Text style={styles.callTitle}>Need medical advice?</Text>
            <Text style={styles.callSubtitle}>Connect with your pulse healthcare assistant in seconds</Text>
            <TouchableOpacity style={styles.callButton}>
              <Ionicons name="call" size={20} color="#fff" />
              <Text style={styles.callButtonText}>Call Doctor AI</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.doctorImageContainer}>
            <Ionicons name="medical" size={60} color="#0891b2" />
          </View>
        </View>
        
        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsContainer}>
          <Link href="/(tabs)/consultations" asChild>
            <TouchableOpacity style={styles.actionCard}>
              <View style={[styles.actionIconContainer, { backgroundColor: '#e0f2fe' }]}>
                <Ionicons name="document-text" size={24} color="#0891b2" />
              </View>
              <Text style={styles.actionText}>Recent Consultations</Text>
            </TouchableOpacity>
          </Link>
          
          <Link href="/(tabs)/history" asChild>
            <TouchableOpacity style={styles.actionCard}>
              <View style={[styles.actionIconContainer, { backgroundColor: '#f0fdf4' }]}>
                <Ionicons name="fitness" size={24} color="#10b981" />
              </View>
              <Text style={styles.actionText}>Medical History</Text>
            </TouchableOpacity>
          </Link>
          
          <Link href="/(tabs)/treatments" asChild>
            <TouchableOpacity style={styles.actionCard}>
              <View style={[styles.actionIconContainer, { backgroundColor: '#eff6ff' }]}>
                <Ionicons name="medkit" size={24} color="#3b82f6" />
              </View>
              <Text style={styles.actionText}>Treatments</Text>
            </TouchableOpacity>
          </Link>
          
          <TouchableOpacity style={styles.actionCard}>
            <View style={[styles.actionIconContainer, { backgroundColor: '#fef2f2' }]}>
              <Ionicons name="alert-circle" size={24} color="#ef4444" />
            </View>
            <Text style={styles.actionText}>Emergency Info</Text>
          </TouchableOpacity>
        </View>
        
        {/* Health Tips */}
        {showTips && (
          <View style={styles.tipsContainer}>
            <View style={styles.tipsHeader}>
              <Text style={styles.tipsTitle}>Health Tips</Text>
              <TouchableOpacity onPress={() => setShowTips(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tipsScrollView}>
              <View style={styles.tipCard}>
                <View style={[styles.tipIconContainer, { backgroundColor: '#f0fdf4' }]}>
                  <Ionicons name="water" size={24} color="#10b981" />
                </View>
                <Text style={styles.tipTitle}>Stay Hydrated</Text>
                <Text style={styles.tipContent}>Drink at least 8 glasses of water daily for optimal health.</Text>
              </View>
              
              <View style={styles.tipCard}>
                <View style={[styles.tipIconContainer, { backgroundColor: '#eff6ff' }]}>
                  <Ionicons name="bed" size={24} color="#3b82f6" />
                </View>
                <Text style={styles.tipTitle}>Sleep Well</Text>
                <Text style={styles.tipContent}>Aim for 7-9 hours of quality sleep each night.</Text>
              </View>
              
              <View style={styles.tipCard}>
                <View style={[styles.tipIconContainer, { backgroundColor: '#fef2f2' }]}>
                  <Ionicons name="heart" size={24} color="#ef4444" />
                </View>
                <Text style={styles.tipTitle}>Exercise Daily</Text>
                <Text style={styles.tipContent}>Even 30 minutes of moderate activity makes a difference.</Text>
              </View>
            </ScrollView>
          </View>
        )}
        
        {/* Upcoming Appointments */}
        <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
        <View style={styles.appointmentCard}>
          <View style={styles.appointmentHeader}>
            <View style={styles.appointmentDate}>
              <Text style={styles.appointmentDay}>24</Text>
              <Text style={styles.appointmentMonth}>MAY</Text>
            </View>
            <View style={styles.appointmentInfo}>
              <Text style={styles.appointmentTitle}>Annual Physical Exam</Text>
              <Text style={styles.appointmentDoctor}>Dr. Sarah Williams</Text>
              <Text style={styles.appointmentTime}>10:30 AM - 11:30 AM</Text>
            </View>
          </View>
          <View style={styles.appointmentActions}>
            <TouchableOpacity style={styles.appointmentButton}>
              <Ionicons name="calendar-outline" size={16} color="#0891b2" />
              <Text style={styles.appointmentButtonText}>Reschedule</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.appointmentButton, styles.cancelButton]}>
              <Ionicons name="close-circle-outline" size={16} color="#ef4444" />
              <Text style={[styles.appointmentButtonText, styles.cancelButtonText]}>Cancel</Text>
            </TouchableOpacity>
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
  welcomeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  welcomeContent: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 24,
    color: '#1e293b',
    marginBottom: 4,
  },
  nameText: {
    fontWeight: 'bold',
  },
  dateText: {
    fontSize: 14,
    color: '#64748b',
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  callSection: {
    flexDirection: 'row',
    backgroundColor: '#e0f2fe',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    overflow: 'hidden',
  },
  callContent: {
    flex: 1,
  },
  callTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0c4a6e',
    marginBottom: 8,
  },
  callSubtitle: {
    fontSize: 14,
    color: '#0369a1',
    marginBottom: 16,
  },
  callButton: {
    backgroundColor: '#0891b2',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  callButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    marginLeft: 8,
  },
  doctorImageContainer: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  actionCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'center',
  },
  tipsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tipsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  tipsScrollView: {
    marginBottom: 8,
  },
  tipCard: {
    width: 200,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
  },
  tipIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  tipContent: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  appointmentCard: {
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
  appointmentHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  appointmentDate: {
    width: 60,
    height: 60,
    backgroundColor: '#0891b2',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  appointmentDay: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  appointmentMonth: {
    fontSize: 12,
    color: '#e0f2fe',
  },
  appointmentInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  appointmentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  appointmentDoctor: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  appointmentTime: {
    fontSize: 14,
    color: '#64748b',
  },
  appointmentActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  appointmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0891b2',
    marginLeft: 12,
  },
  appointmentButtonText: {
    fontSize: 14,
    color: '#0891b2',
    marginLeft: 4,
  },
  cancelButton: {
    borderColor: '#ef4444',
  },
  cancelButtonText: {
    color: '#ef4444',
  },
});