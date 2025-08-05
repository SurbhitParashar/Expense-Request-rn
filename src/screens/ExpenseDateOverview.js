import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  FlatList,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import GeneratePDFReportButton from '../components/GenerateReportButton';

// helper to parse ISO date and format
function parseDate(iso) {
  const d = new Date(iso);
  const monthShort = d.toLocaleDateString(undefined, { month: 'short' }); // e.g. "Jul"
  const dayNumber = String(d.getDate());                                   // e.g. "14"
  const key = d.toISOString().split('T')[0];                               // "2025-07-14"
  const displayDate = `${monthShort} ${dayNumber}`;                        // "Jul 14"
  const dayName = d.toLocaleDateString(undefined, { weekday: 'long' });    // "Monday"
  return { key, displayDate, dayName };
}

export default function ExpenseDateOverview({ route, navigation }) {
  const { tripId, tripName, tripCity, tripDuration } = route.params;
  const [rawExpenses, setRawExpenses] = useState([]);
  const [grouped, setGrouped] = useState([]);
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // 1. Load userName for header & filename
        const storedName = await AsyncStorage.getItem('userName');
        setUserName(storedName || 'Unknown');

        // 2. Fetch all expense details for this trip
        const pCard = await AsyncStorage.getItem('userPCard');
        if (!pCard) throw new Error('No P‑Card found');

        const snap = await getDocs(
          collection(db, 'expenses', pCard, 'expenses', tripId, 'details')
        );
        const raw = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setRawExpenses(raw);

        // 3. Group by date for list UI
        const temp = raw.reduce((acc, exp) => {
          const { key, displayDate, dayName } = parseDate(exp.date);
          if (!acc[key]) {
            acc[key] = { key, displayDate, dayName, expenses: [], totalAmount: 0 };
          }
          acc[key].expenses.push(exp);
          acc[key].totalAmount += Number(exp.amount);
          return acc;
        }, {});
        const arr = Object.values(temp)
          .sort((a, b) => new Date(b.key) - new Date(a.key))
          .map(item => ({ ...item, expenseCount: item.expenses.length }));
        setGrouped(arr);
      } catch (e) {
        console.error('Fetch error', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [tripId]);

  const renderDateCard = ({ item }) => (
    <TouchableOpacity
      style={styles.dateCard}
      onPress={() =>
        navigation.navigate('DailyExpenseReceipts', {
          dateData:    item.expenses,
          displayDate: item.key,
          tripName,
          tripCity,
          tripDuration,
          tripId
        })
      }
    >
      <View style={styles.dateCardLeft}>
        <View style={styles.dateCircle}>
          <Text style={styles.dateNumber}>{item.displayDate.split(' ')[1]}</Text>
          <Text style={styles.dateMonth}>{item.displayDate.split(' ')[0]}</Text>
        </View>
        <View style={styles.dateInfo}>
          <Text style={styles.dayName}>{item.dayName}</Text>
          <Text style={styles.expenseCount}>
            {item.expenseCount} expenses · ${item.totalAmount.toFixed(2)}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#666" />
    </TouchableOpacity>
  );

  // Show loader while fetching
  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#d13a3d" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#d13a3d" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trip Expenses</Text>
        <View style={styles.addButton} />
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Trip Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View style={styles.summaryTitleContainer}>
              <Ionicons name="business-outline" size={20} color="#d13a3d" />
              <Text style={styles.summaryTitle}>{tripName}</Text>
            </View>
            <Text style={styles.summaryCity}>{tripCity}</Text>
            <Text style={styles.summaryDuration}>{tripDuration}</Text>
          </View>
        </View>

        {/* Daily Expenses List */}
        <View style={styles.dateListContainer}>
          <Text style={styles.sectionTitle}>Daily Expenses</Text>
          <FlatList
            data={grouped}
            renderItem={renderDateCard}
            keyExtractor={(item) => item.key}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
        </View>

        {/* Generate Report Button */}
        <GeneratePDFReportButton
          tripData={rawExpenses}
          userName={userName}
          tripName={tripName}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#d13a3d' },
  loader: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: 8
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#d13a3d',
    paddingTop: 45, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 4,
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#fff' },
  addButton: { padding: 4 },
  content: {
    flex: 1, backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingTop: 24, marginTop: 8
  },
  summaryCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 24,
    elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 12,
  },
  summaryHeader: { marginBottom: 0 },
  summaryTitleContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  summaryTitle: { fontSize: 18, fontWeight: '600', color: '#333', marginLeft: 8, flex: 1 },
  summaryCity: { fontSize: 16, color: '#555', marginBottom: 4, fontWeight: '500' },
  summaryDuration: { fontSize: 14, color: '#666' },
  dateListContainer: { marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 16 },
  dateCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12,
    flexDirection: 'row', alignItems: 'center', elevation: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8,
  },
  dateCardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  dateCircle: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: '#d13a3d',
    justifyContent: 'center', alignItems: 'center', marginRight: 16
  },
  dateNumber: { fontSize: 18, fontWeight: '700', color: '#fff' },
  dateMonth: { fontSize: 10, color: '#fff', marginTop: -2 },
  dateInfo: { flex: 1 },
  dayName: { fontSize: 16, fontWeight: '600', color: '#333' },
  expenseCount: { fontSize: 14, color: '#666', marginTop: 2 },
});
