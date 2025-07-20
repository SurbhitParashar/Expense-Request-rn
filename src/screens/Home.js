import React, { useEffect, useState , useContext} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { auth } from '../config/firebase';
import { signOut } from 'firebase/auth';
import { collection, getDocs, doc } from 'firebase/firestore';
import { db } from '../config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppDataContext } from '../context/TripData';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

const ExpenseTrackerApp = ({ navigation }) => {
  const { trips, loadTrips } = useContext(AppDataContext);
  const [userName, setUserName] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadTrips();
    }, [loadTrips])
  );

  useEffect(()=>{
    (async () => {
      const userName=await AsyncStorage.getItem('userName');
      // console.log(userName)
      setUserName(userName);
    })()
  },[])
  
  const formatDateRange = (start, end) => {
    const options = { day: 'numeric', month: 'short' };
    const startDate = new Date(start).toLocaleDateString('en-US', options);
    const endDate = new Date(end).toLocaleDateString('en-US', options);
    return `${startDate} - ${endDate}`;
  };

  const getTripIcon = (type = '') => {
    switch (type.toLowerCase()) {
      case 'conference': return 'monitor';
      case 'workshop': return 'tool';
      case 'seminar': return 'book';
      case 'business': return 'briefcase';
      case 'meeting': return 'users';
      case 'training': return 'book-open';
      case 'exhibition': return 'eye';
      case 'summit': return 'trending-up';
      case 'symposium': return 'mic';
      case 'convention': return 'globe';
      default: return 'map-pin';
    }
  };

  // Render empty state when no trips
  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <View style={styles.emptyStateIconContainer}>
        <Feather name="map-pin" size={48} color="#d13a3d" />
      </View>
      <Text style={styles.emptyStateTitle}>No Trips Added Yet</Text>
      <Text style={styles.emptyStateSubtitle}>
        Start by adding your first conference or business trip to track expenses
      </Text>
      <TouchableOpacity 
        style={styles.emptyStateButton}
        onPress={() => navigation.navigate('AddTripDetails')}
      >
        <Feather name="plus" size={16} color="#fff" />
        <Text style={styles.emptyStateButtonText}>Add First Trip</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView
       style={[
         styles.container,
         { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }
       ]}
     >
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Hi{` ${userName}`}!</Text>
        </View>
        <View style={styles.profileContainer}>
          <TouchableOpacity style={styles.profileIcon} onPress={() => navigation.navigate('Profile')}>
            <Feather name="user" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Budget Card */}
        <TouchableOpacity style={styles.budgetCard} activeOpacity={0.95}>
          <View style={styles.budgetGradient}>
            <View style={styles.budgetHeader}>
              <View style={styles.budgetTitleContainer}>
                <Feather name="credit-card" size={24} color="#fff" />
                <View style={styles.budgetTitleText}>
                  <Text style={styles.budgetTitle}>Total Budget</Text>
                  <Text style={styles.budgetSubtitle}>Annual Conference Fund</Text>
                </View>
              </View>
              <View style={styles.budgetAmountContainer}>
                <Text style={styles.budgetAmount}>$4,000</Text>
                <Text style={styles.budgetPeriod}>2025</Text>
              </View>
            </View>

            <View style={styles.budgetStats}>
              <View style={styles.statItem}>
                <View style={styles.statIcon}>
                  <Feather name="check-circle" size={16} color="#4CAF50" />
                </View>
                <View style={styles.statContent}>
                  <Text style={styles.statLabel}>Reimbursed</Text>
                  <Text style={styles.statValue}>$2,850</Text>
                </View>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statItem}>
                <View style={styles.statIcon}>
                  <Feather name="clock" size={16} color="#FF9800" />
                </View>
                <View style={styles.statContent}>
                  <Text style={styles.statLabel}>Remaining</Text>
                  <Text style={styles.statRemainingValue}>$1,150</Text>
                </View>
              </View>
            </View>

            <View style={styles.progressContainer}>
              <View style={styles.progressInfo}>
                <Text style={styles.progressLabel}>Budget Utilization</Text>
                <Text style={styles.progressPercentage}>71.25%</Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: '71.25%' }]} />
                <View style={styles.progressGlow} />
              </View>
            </View>
          </View>

        </TouchableOpacity>

        {/* Conference Details */}
        <View style={styles.entriesContainer}>
          <View style={styles.entriesHeader}>
            <Text style={styles.entriesTitle}>Conference Details</Text>
            <TouchableOpacity>
              <Feather name="more-horizontal" size={20} color="#999" />
            </TouchableOpacity>
          </View>
          
          {/* Conditional rendering based on trips length */}
          {trips && trips.length > 0 ? (
            trips.map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() =>
                  navigation.navigate('ExpenseDateOverview', {
                    tripId: item.id,
                    tripName: item.title,
                    tripCity: item.location,
                    tripDuration: formatDateRange(item.startDate, item.endDate),
                  })
                }>
                <View style={styles.entryItem}>
                  <View style={styles.entryIconContainer}>
                    <Feather name={getTripIcon(item.type)} size={20} color="#d13a3d" />
                  </View>
                  <View style={styles.entryContent}>
                    <Text style={styles.entryCategory}>{item.title}</Text>
                    <Text style={styles.entryLocation}>{item.location}</Text>
                    <Text style={styles.entryDate}>{formatDateRange(item.startDate, item.endDate)}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            renderEmptyState()
          )}
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.floatingContainer}>
  <View style={styles.floatingNav}>
    <TouchableOpacity 
      style={[styles.navItem, styles.activeNavItem]}
      activeOpacity={0.7}
    >
      <Feather name="home" size={24} color="#d13a3d" />
    </TouchableOpacity>
    
    <TouchableOpacity 
      style={styles.addButton} 
      onPress={() => navigation.navigate('AddExpense')}
      activeOpacity={0.8}
    >
      <Feather name="plus" size={26} color="#fff" />
    </TouchableOpacity>
    
    <TouchableOpacity 
      style={styles.navItem} 
      onPress={() => navigation.navigate('AddTripDetails')}
      activeOpacity={0.7}
    >
      <Feather name="file-text" size={24} color="#999" />
    </TouchableOpacity>
  </View>
</View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  bottomNavContainer: {
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  backgroundColor: 'rgba(255, 255, 255, 0.88)',
  backdropFilter: 'blur(20px)',
  borderTopWidth: 0.5,
  borderTopColor: 'rgba(209, 58, 61, 0.08)',
  paddingBottom: Platform.OS === 'ios' ? 30 : 15,
},
bottomNav: {
  flexDirection: 'row',
  justifyContent: 'space-around',
  alignItems: 'center',
  paddingVertical: 14,
  paddingHorizontal: 24,
  position: 'relative',
},
navItem: {
  alignItems: 'center',
  justifyContent: 'center',
  padding: 14,
  borderRadius: 20,
  minWidth: 52,
  minHeight: 52,
  backgroundColor: 'transparent',
},
activeNavItem: {
  backgroundColor: 'rgba(209, 58, 61, 0.08)',
  borderWidth: 1,
  borderColor: 'rgba(209, 58, 61, 0.15)',
},
addButton: {
  width: 66,
  height: 66,
  borderRadius: 33,
  backgroundColor: '#d13a3d',
  justifyContent: 'center',
  alignItems: 'center',
  elevation: 12,
  shadowColor: '#d13a3d',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.35,
  shadowRadius: 10,
  borderWidth: 4,
  borderColor: 'rgba(255, 255, 255, 0.95)',
  position: 'relative',
  transform: [{ translateY: -3 }],
},
// Alternative floating footer styles
floatingContainer: {
  position: 'absolute',
  bottom: 20,
  left: 24,
  right: 24,
  backgroundColor: 'rgba(255, 255, 255, 0.92)',
  backdropFilter: 'blur(25px)',
  borderRadius: 32,
  borderWidth: 0.5,
  borderColor: 'rgba(209, 58, 61, 0.08)',
  elevation: 15,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.12,
  shadowRadius: 15,
  paddingBottom: Platform.OS === 'ios' ? 8 : 4,
},
floatingNav: {
  flexDirection: 'row',
  justifyContent: 'space-around',
  alignItems: 'center',
  paddingVertical: 12,
  paddingHorizontal: 20,
},
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 22,
    marginBottom:10,
    marginTop:10
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
  },
  profileContainer: {
    alignItems: 'center',
  },
  profileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#d13a3d',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 15,
    minHeight: 90,
  },
  primaryCard: {
    backgroundColor: '#d13a3d',
  },
  statIconContainer: {
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    color: 'white',
    marginBottom: 4,
  },
  primaryStatLabel: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  primaryStatValue: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  actionContainer: {
    flexDirection: 'row',
    marginBottom: 30,
    gap: 12,
  },
  savingsButton: {
    backgroundColor: '#d13a3d',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  savingsButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  actionButton: {
    backgroundColor: '#f8f9fa',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  actionButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  entriesContainer: {
    marginBottom: 120,
  },
  entriesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  entriesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  entryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  entryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    borderWidth: 1,
    borderColor: '#d13a3d',
  },
  entryContent: {
    flex: 1,
  },
  entryCategory: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  entryLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  entryDate: {
    fontSize: 12,
    color: '#999',
  },
  entryAmount: {
    alignItems: 'flex-end',
  },
  entryAmountText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  budgetCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 30,
    elevation: 8,
    shadowColor: '#d13a3d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    overflow: 'hidden',
  },
  budgetGradient: {
    background: 'linear-gradient(135deg, #d13a3d 0%, #b71c1c 100%)',
    backgroundColor: '#d13a3d',
    padding: 24,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  budgetTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  budgetTitleText: {
    marginLeft: 12,
    flex: 1,
  },
  budgetTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  budgetSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  budgetAmountContainer: {
    alignItems: 'flex-end',
  },
  budgetAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    lineHeight: 38,
  },
  budgetPeriod: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  budgetStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 6,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statContent: {
    flex: 1,
  },
  statRemainingValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 16,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  progressPercentage: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 3,
    position: 'relative',
  },
  progressGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
  },
  budgetActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: '#f8f9fa',
  },
  actionText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#d13a3d',
  },
  bottomNavContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 15,
    paddingBottom: 25,
    borderTopWidth: 1,
    borderTopColor: 'rgba(240, 240, 240, 0.8)',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#d13a3d',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  notificationBadge: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#d13a3d',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  
  // Empty State Styles
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    paddingHorizontal: 40,
  },
  emptyStateIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(209, 58, 61, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d13a3d',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    elevation: 2,
    shadowColor: '#d13a3d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  emptyStateButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default ExpenseTrackerApp;