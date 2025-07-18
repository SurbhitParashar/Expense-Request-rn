import React, { useEffect, useState , useContext} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
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
  const { userName, trips, signOut, loadTrips } = useContext(AppDataContext);

  useFocusEffect(
    useCallback(() => {
      loadTrips();
    }, [loadTrips])
  );
  
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
      default: return 'calendar';
    }
  };



  



  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Hi{` ${userName}`}!</Text>
        </View>
        <View style={styles.profileContainer}>
          <View style={styles.profileIcon}>
            <Feather name="user" size={20} color="#fff" />
          </View>
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
          {trips.map((item) => (
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('ExpenseDateOverview', {
                  tripId: item.id,
                  tripName: item.title,
                  tripCity: item.location,
                  tripDuration: formatDateRange(item.startDate, item.endDate),
                })
              }>

              <View key={item.id} style={styles.entryItem}>
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
          ))}

          <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNavContainer}>
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem}>
            <Feather name="home" size={24} color="#d13a3d" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('AddExpense')}>
            <Feather name="plus" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('AddTripDetails')}>
            <Feather name="file-text" size={24} color="#999" />
          </TouchableOpacity>

        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
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
    color: '#999',
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
    color: '#333',
  },
  primaryStatValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
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
  statLabel: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
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
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
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
  signOutButton: {
    backgroundColor: '#E74C3C',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 6,
  },
  signOutText: {
    color: 'white',
    fontSize: 16,
  },
});

export default ExpenseTrackerApp;