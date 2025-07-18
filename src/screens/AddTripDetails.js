import React, { use, useContext, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Modal,
  FlatList,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../config/firebase';
// import { doc, setDoc } from 'firebase/firestore';
import { collection, addDoc } from 'firebase/firestore';
import { AppDataContext } from '../context/TripData';


const AddTripDetails = ({ navigation }) => {
  const [tripName,setTripName]=useState('');
  const {loadTrips} = useContext(AppDataContext);

  const [formData, setFormData] = useState({
    type: '',
    tripName: '',
    cities: [''],
    startDate: new Date(),
    endDate: new Date(),
  });

  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const tripTypes = [
    { id: 'conference', name: 'Conference', icon: 'people-outline' },
    { id: 'seminar', name: 'Seminar', icon: 'school-outline' },
    { id: 'workshop', name: 'Workshop', icon: 'construct-outline' },
  ];

  const popularCities = [
    'New Delhi', 'Mumbai', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad',
    'Pune', 'Ahmedabad', 'Jaipur', 'Surat', 'Lucknow', 'Kanpur',
    'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Pimpri-Chinchwad',
    'Patna', 'Vadodara', 'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik',
    'Faridabad', 'Meerut', 'Rajkot', 'Kalyan-Dombivli', 'Vasai-Virar', 'Varanasi'
  ];

  const addCity = () => {
    setFormData({
      ...formData,
      cities: [...formData.cities, '']
    });
  };

  const removeCity = (index) => {
    if (formData.cities.length > 1) {
      const newCities = formData.cities.filter((_, i) => i !== index);
      setFormData({ ...formData, cities: newCities });
    }
  };

  const updateCity = (index, value) => {
    const newCities = [...formData.cities];
    newCities[index] = value;
    setFormData({ ...formData, cities: newCities });
  };

 
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const calculateDuration = () => {
    const diffTime = Math.abs(formData.endDate - formData.startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const renderTypeModal = () => (
    <Modal
      visible={showTypeModal}
      transparent={true}
      animationType="slide"
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Trip Type</Text>
            <TouchableOpacity onPress={() => setShowTypeModal(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={tripTypes}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.typeModalItem}
                onPress={() => {
                  setFormData({ ...formData, type: item.name });
                  setShowTypeModal(false);
                }}
              >
                <View style={styles.typeItemContent}>
                  <Ionicons name={item.icon} size={24} color="#d13a3d" />
                  <Text style={styles.typeItemText}>{item.name}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#666" />
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );


  const handleCreate = async () => {
    if (!tripName.trim()) {
      return Alert.alert('Error','Please enter a trip name.');
    }
    try {
      const pCard = await AsyncStorage.getItem('userPCard');
      await addDoc(collection(db, 'trips', pCard, 'trips'), {
        tripName:   tripName.trim(),
        startDate:  new Date().toISOString(),
        endDate:    new Date().toISOString(),
        // …other fields…
      });

      // 🔄 refresh the list!
      await loadTrips();

      // go back now that trips state is fresh
      navigation.goBack();
    } catch (err) {
      console.error(err);
      Alert.alert('Error','Could not save trip.');
    }
  };



const handleSubmit = async () => {
  if (!formData.type || !formData.tripName || formData.cities.some(city => !city.trim())) {
    Alert.alert('Error', 'Please fill in all required fields');
    return;
  }

  if (formData.startDate >= formData.endDate) {
    Alert.alert('Error', 'End date must be after start date');
    return;
  }

  try {
    const pCard = await AsyncStorage.getItem('userPCard');
    if (!pCard) {
      Alert.alert('Error', 'User ID (PCard) not found. Please log in again.');
      return;
    }

    const tripData = {
      tripName: formData.tripName.trim(),
      type: formData.type,
      cities: formData.cities.filter(city => city.trim()),
      startDate: formData.startDate.toISOString(),
      endDate: formData.endDate.toISOString(),
      createdAt: new Date().toISOString()
    };

    // Generate collection reference: trips/{pCard}/trips
    const tripsCollectionRef = collection(db, 'trips', pCard, 'trips');

    // Add trip data with random ID
    const docRef = await addDoc(tripsCollectionRef, tripData);

    Alert.alert('Success', 'Trip saved successfully!', [
      { text: 'OK', onPress: async () => {
        await loadTrips();
        navigation.goBack() }}
    ]);
  } catch (err) {
    console.error('Trip Save Error:', err);
    Alert.alert('Error', 'Failed to save trip. Please try again.');
  }
};



  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#d13a3d" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trip Details</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

        {/* Trip Type */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Trip Type <Text style={styles.required}>*</Text></Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowTypeModal(true)}
          >
            <Ionicons name="briefcase-outline" size={20} color="#666" style={styles.inputIcon} />
            <Text style={[styles.selectButtonText, !formData.type && styles.placeholder]}>
              {formData.type || 'Select trip type'}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Trip Name */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Trip Name <Text style={styles.required}>*</Text></Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="document-text-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="Enter trip name"
              placeholderTextColor="#999"
              value={formData.tripName}
              onChangeText={(text) => setFormData({ ...formData, tripName: text })}
            />
          </View>
        </View>

        {/* Cities */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Cities <Text style={styles.required}>*</Text></Text>

          {formData.cities.map((city, index) => (
            <View key={index} style={styles.cityInputContainer}>
              <View style={styles.cityInputWrapper}>
                <Ionicons name="location-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder={`City ${index + 1}`}
                  placeholderTextColor="#999"
                  value={city}
                  onChangeText={(text) => updateCity(index, text)}
                />
                {formData.cities.length > 1 && (
                  <TouchableOpacity
                    style={styles.removeCityButton}
                    onPress={() => removeCity(index)}
                  >
                    <Ionicons name="close-circle" size={20} color="#ef4444" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}

          <TouchableOpacity style={styles.addCityButton} onPress={addCity}>
            <Ionicons name="add-circle-outline" size={20} color="#d13a3d" />
            <Text style={styles.addCityButtonText}>Add Another City</Text>
          </TouchableOpacity>
        </View>

        {/* Date Range */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Trip Duration <Text style={styles.required}>*</Text></Text>

          <View style={styles.dateRangeContainer}>
            <View style={styles.dateCard}>
              <Text style={styles.dateLabel}>Departure</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowStartDatePicker(true)}
              >
                <View style={styles.dateContent}>
                  <Ionicons name="calendar-outline" size={18} color="#d13a3d" />
                  <Text style={styles.dateButtonText}>
                    {formatDate(formData.startDate)}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.durationIndicator}>
              <View style={styles.durationLine} />
              <View style={styles.durationBadge}>
                <Text style={styles.durationText}>
                  {calculateDuration()}d
                </Text>
              </View>
              <View style={styles.durationLine} />
            </View>

            <View style={styles.dateCard}>
              <Text style={styles.dateLabel}>Return</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowEndDatePicker(true)}
              >
                <View style={styles.dateContent}>
                  <Ionicons name="calendar-outline" size={18} color="#d13a3d" />
                  <Text style={styles.dateButtonText}>
                    {formatDate(formData.endDate)}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Trip Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View style={styles.summaryIconContainer}>
              <Ionicons name="analytics-outline" size={20} color="#d13a3d" />
            </View>
            <Text style={styles.summaryTitle}>Trip Overview</Text>
          </View>

          <View style={styles.summaryContent}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Ionicons name="briefcase-outline" size={16} color="#666" />
                <Text style={styles.summaryLabel}>Type:</Text>
              </View>
              <Text style={styles.summaryValue}>{formData.type || 'Not selected'}</Text>
            </View>

            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Ionicons name="location-outline" size={16} color="#666" />
                <Text style={styles.summaryLabel}>Cities:</Text>
              </View>
              <Text style={styles.summaryValue}>
                {formData.cities.filter(city => city.trim()).length} {formData.cities.filter(city => city.trim()).length === 1 ? 'city' : 'cities'}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Ionicons name="time-outline" size={16} color="#666" />
                <Text style={styles.summaryLabel}>Duration:</Text>
              </View>
              <Text style={styles.summaryValue}>{calculateDuration()} {calculateDuration() === 1 ? 'day' : 'days'}</Text>
            </View>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Ionicons name="airplane" size={24} color="#fff" />
          <Text style={styles.submitButtonText}>Create Trip</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Date Pickers */}
      {showStartDatePicker && (
        <DateTimePicker
          value={formData.startDate}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowStartDatePicker(false);
            if (selectedDate) {
              setFormData({ ...formData, startDate: selectedDate });
            }
          }}
        />
      )}

      {showEndDatePicker && (
        <DateTimePicker
          value={formData.endDate}
          mode="date"
          display="default"
          minimumDate={formData.startDate}
          onChange={(event, selectedDate) => {
            setShowEndDatePicker(false);
            if (selectedDate) {
              setFormData({ ...formData, endDate: selectedDate });
            }
          }}
        />
      )}

      {/* Modal */}
      {renderTypeModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#d13a3d',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#d13a3d',
    paddingTop: 45,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 28,
    marginTop: 8,
  },
  inputContainer: {
    marginBottom: 28,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  required: {
    color: '#ef4444',
    fontSize: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 14,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  selectButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
    marginLeft: 14,
  },
  placeholder: {
    color: '#94a3b8',
  },
  cityInputContainer: {
    marginBottom: 12,
  },
  cityInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  removeCityButton: {
    marginLeft: 12,
    padding: 4,
  },
  addCityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: '#fecaca',
    borderStyle: 'dashed',
    marginTop: 4,
  },
  addCityButtonText: {
    marginLeft: 8,
    fontSize: 15,
    color: '#d13a3d',
    fontWeight: '600',
  },
  dateRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  dateCard: {
    flex: 1,
    alignItems: 'center',
  },
  dateLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 8,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  dateContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateButtonText: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '600',
    marginLeft: 8,
  },
  durationIndicator: {
    alignItems: 'center',
    marginHorizontal: 20,
    position: 'relative',
  },
  durationLine: {
    width: 2,
    height: 12,
    backgroundColor: '#d13a3d',
    borderRadius: 1,
  },
  durationBadge: {
    backgroundColor: '#d13a3d',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginVertical: 4,
  },
  durationText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#fef2f2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    letterSpacing: 0.3,
  },
  summaryContent: {
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
    marginLeft: 8,
  },
  summaryValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '600',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#d13a3d',
    borderRadius: 20,
    paddingVertical: 18,
    marginTop: 8,
    marginBottom: 40,
    elevation: 6,
    shadowColor: '#d13a3d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  submitButtonText: {
    marginLeft: 12,
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    letterSpacing: 0.3,
  },
  typeModalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  typeItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeItemText: {
    fontSize: 16,
    color: '#1f2937',
    marginLeft: 16,
    fontWeight: '600',
  },
});

export default AddTripDetails;