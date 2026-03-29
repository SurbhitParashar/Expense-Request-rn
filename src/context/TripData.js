import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, getDocs } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { View, ActivityIndicator, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { signOut } from 'firebase/auth';

const { width, height } = Dimensions.get('window');

export const AppDataContext = createContext({
  hasToken: false,
  isRegistered: false,
  userName: '',
  trips: [],
  login: () => { },
  completeRegistration: () => { },
  loadTrips: async () => { },
  signOut: () => { },
});

const LoadingScreen = () => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    // Initial fade and scale animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous pulse animation for the loading indicator
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();

    return () => pulseAnimation.stop();
  }, []);

  return (
    <View style={styles.loadingContainer}>
      {/* Background gradient effect */}
      <View style={styles.gradientOverlay} />

      {/* Floating background elements */}
      <View style={styles.floatingElement1} />
      <View style={styles.floatingElement2} />
      <View style={styles.floatingElement3} />

      <Animated.View
        style={[
          styles.contentContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        {/* Logo Section */}
        <View style={styles.logoContainer}>
          <View style={styles.logoBackground}>
            <Text style={styles.logoText}>💰</Text>
          </View>
          <View style={styles.logoShadow} />
        </View>

        {/* App Title */}
        <Text style={styles.appTitle}>Expense Request</Text>
        <Text style={styles.appSubtitle}>Professional Expense Management</Text>

        {/* Loading Animation */}
        <Animated.View
          style={[
            styles.loadingSection,
            { transform: [{ scale: pulseAnim }] }
          ]}
        >
          <View style={styles.loadingRing}>
            <ActivityIndicator size="large" color="#d13a3d" />
          </View>
          <Text style={styles.loadingText}>Initializing Application...</Text>
        </Animated.View>

        {/* Feature Icons */}
        <View style={styles.featuresContainer}>
          <View style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <Text style={styles.featureEmoji}>📊</Text>
            </View>
            <Text style={styles.featureLabel}>Analytics</Text>
          </View>

          <View style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <Text style={styles.featureEmoji}>🧾</Text>
            </View>
            <Text style={styles.featureLabel}>Receipts</Text>
          </View>

          <View style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <Text style={styles.featureEmoji}>✈️</Text>
            </View>
            <Text style={styles.featureLabel}>Travel</Text>
          </View>
        </View>

        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={styles.progressFill} />
          </View>
          <Text style={styles.progressText}>Setting up your workspace</Text>
        </View>
      </Animated.View>

      
    </View>
  );
};

export function AppDataProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [hasToken, setHasToken] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [userName, setUserName] = useState('');
  const [trips, setTrips] = useState([]);

  const login = () => {
    setHasToken(true);
  };
  // new: immediate registration callback
  const completeRegistration = () => {
    setIsRegistered(true);
  };

  useEffect(() => {
    async function bootstrap() {
      try {
        // 1️⃣ auth flags
        const token = await AsyncStorage.getItem('userToken');
        setHasToken(!!token);

        if (!token) {
          return;
        }

        const pCard = await AsyncStorage.getItem('userPCard');
        setIsRegistered(!!pCard);

        // 2️⃣ only if fully registered do we fetch userName & trips
        if (pCard) {
          const name = await AsyncStorage.getItem('userName');
          setUserName(name || '');

          await loadTrips();
        }
      } catch (err) {
        console.error('App bootstrap error', err);
      } finally {
        setLoading(false);
      }
    }

    bootstrap();
  }, []);

  const loadTrips = async () => {
    try {
      const pCard = await AsyncStorage.getItem('userPCard');
      if (!pCard) return;
      const snap = await getDocs(collection(db, 'trips', pCard, 'trips'));
      const data = snap.docs.map(d => ({
        id: d.id,
        title: d.data().tripName,
        location: d.data().cities?.[0] ?? 'Unknown',
        type: d.data().type,
        startDate: d.data().startDate,
        endDate: d.data().endDate,
      }));
      setTrips(data);
    } catch (err) {
      console.error('Error loading trips', err);
    }
  };

  const signOut = async () => {
    try {
      // a) Firebase sign out
      await auth.signOut();
      // b) Clear all persisted keys
      await AsyncStorage.multiRemove(['userToken', 'userPCard', 'userName']);
      // c) Reset context state
      setHasToken(false);
      setIsRegistered(false);
      setUserName('');
      setTrips([]);
    } catch (err) {
      console.error('Error during signOut:', err);
    }
  };

  // while ANY of the above is loading, show the enhanced loading screen
  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <AppDataContext.Provider value={{
      hasToken,
      isRegistered,
      userName,
      trips,
      login,
      completeRegistration,
      loadTrips,
      signOut
    }}>
      {children}
    </AppDataContext.Provider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(209, 58, 61, 0.03)',
  },
  floatingElement1: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(209, 58, 61, 0.1)',
    top: height * 0.15,
    right: -60,
  },
  floatingElement2: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(209, 58, 61, 0.08)',
    bottom: height * 0.25,
    left: -40,
  },
  floatingElement3: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(209, 58, 61, 0.1)',
    top: height * 0.3,
    left: width * 0.1,
  },
  contentContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 1,
  },
  logoContainer: {
    position: 'relative',
    marginBottom: 32,
  },
  logoBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#d13a3d',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#d13a3d',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    zIndex: 2,
  },
  logoShadow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(209, 58, 61, 0.2)',
    top: 4,
    left: 4,
    zIndex: 1,
  },
  logoText: {
    fontSize: 48,
    color: '#fff',
  },
  appTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#d13a3d',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  appSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 48,
    textAlign: 'center',
    fontWeight: '500',
  },
  loadingSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  loadingRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  loadingText: {
    fontSize: 16,
    color: '#d13a3d',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 280,
    marginBottom: 40,
  },
  featureCard: {
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    flex: 1,
    marginHorizontal: 4,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fef2f2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureEmoji: {
    fontSize: 20,
  },
  featureLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
    textAlign: 'center',
  },
  progressContainer: {
    width: '100%',
    maxWidth: 240,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#f3f4f6',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    width: '60%',
    backgroundColor: '#d13a3d',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500',
  },
});