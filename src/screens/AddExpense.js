import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Image,
  Modal,
  FlatList,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { collection, getDocs, addDoc, doc, setDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImageManipulator from 'expo-image-manipulator';
import { db } from '../config/firebase';

const AddExpense = ({ navigation, route }) => {

  const editingExpense = route.params?.expense;


  const [tripOptions, setTripOptions] = useState([]);      // { id, tripName }[]
  const [selectedTripId, setSelectedTripId] = useState(null);

  useEffect(() => {
    (async () => {
      const pCard = await AsyncStorage.getItem('userPCard');
      if (!pCard) return;

      const q = collection(db, 'trips', pCard, 'trips');
      const snap = await getDocs(q);
      const trips = snap.docs.map(d => ({
        id: d.id,
        tripName: d.data().tripName
      }));
      setTripOptions(trips);
    })();
  }, []);

  useEffect(() => {
    if (editingExpense) {
      setSelectedTripId(route.params.tripId);
      setFormData({
        conferenceName: editingExpense.conferenceName,
        category: editingExpense.category,
        subCategory: editingExpense.subCategory,
        amount: editingExpense.amount.toString(),
        receiptPhoto: editingExpense.receiptPhoto,
        date: new Date(editingExpense.date),
        paymentMethod: editingExpense.paymentMethod,
      });
    }
  }, [editingExpense]);


  const [formData, setFormData] = useState({
    conferenceName: '',
    category: '',
    subCategory: '',
    amount: '',
    receiptPhoto: null,
    date: new Date(),
    paymentMethod: 'personal', // 'college' or 'personal'
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSubCategoryModal, setShowSubCategoryModal] = useState(false);
  const [showConferenceModal, setShowConferenceModal] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);

  const categories = [
    'Travel',
    'Meals',
    'MISC',
  ];



  const subCategories = {
    Travel: ['Airfare and Baggage Fees', 'Auto Rental & Fuel', 'Ground Transportation', 'Parking & Tolls', 'Hotel & Lodging', 'Internet, Fax, and Telephone', 'Tips (non-meal)'],
    Meals: ['Breakfast', 'Lunch', 'Dinner', 'Entertainment'],
    MISC: ['Conference Registration', 'Incidentals'],
  };

  const handleImagePicker = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert('Permission required', 'Please allow access to photo library');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      // aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      const originalUri = result.assets[0].uri;
      const { uri: compressedUri } = await ImageManipulator.manipulateAsync(
        originalUri,
        [{ resize: { width: 800 } }],    // resize to max‑width of 800px
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );

      setFormData({ ...formData, receiptPhoto: compressedUri });
    }
  };

  const handleCameraCapture = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert('Permission required', 'Please allow access to camera');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      // aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      const originalUri = result.assets[0].uri;
      const { uri: compressedUri } = await ImageManipulator.manipulateAsync(
        originalUri,
        [{ resize: { width: 800 } }],    // resize to max‑width of 800px
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );

      setFormData({ ...formData, receiptPhoto: compressedUri });
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      'Select Image',
      'Choose an option',
      [
        { text: 'Camera', onPress: handleCameraCapture },
        { text: 'Gallery', onPress: handleImagePicker },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };



  const handleSubmit = async () => {
    // 1) Validation
    if (!selectedTripId) {
      Alert.alert('Error', 'Please select a trip before submitting.');
      return;
    }
    if (!formData.category || !formData.amount) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }


    // 2) Get the P‑Card
    const pCard = await AsyncStorage.getItem('userPCard');
    if (!pCard || !selectedTripId) {
      Alert.alert('Error', 'User ID (PCard) not found. Please log in again.');
      return;
    }

    // 3) Build your expense object
    const expenseData = {
      conferenceName: formData.conferenceName,
      category: formData.category,
      subCategory: formData.subCategory,
      amount: formData.amount,
      receiptPhoto: formData.receiptPhoto,
      date: formData.date.toISOString(),
      paymentMethod: formData.paymentMethod,
      createdAt: new Date().toISOString(),
    };

    try {
      const detailsPath = ['expenses', pCard, 'expenses', selectedTripId, 'details'];
      if (editingExpense) {
        // overwrite existing document
        const docRef = doc(db, ...detailsPath, editingExpense.id);
        await setDoc(docRef, expenseData);
      } else {
        // create new
        const colRef = collection(db, ...detailsPath);
        await addDoc(colRef, { ...expenseData, createdAt: new Date().toISOString() });
      }
      Alert.alert(
        'Success',
        editingExpense ? 'Expense updated! \n (updates will show when you reopen the trip)' : 'Expense created!',
        [{ text: 'OK', onPress: () => navigation.navigate('Home') }]
      );

    } catch (err) {
      console.error('Expense Save Error:', err);
      Alert.alert('Error', 'Could not save expense.');
    }
  };


  const renderConferenceModal = () => (
    <Modal
      visible={showConferenceModal}
      transparent={true}
      animationType="slide"
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Conference</Text>
            <TouchableOpacity onPress={() => setShowConferenceModal(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={tripOptions}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => {
                  setFormData({ ...formData, conferenceName: item.tripName });
                  setSelectedTripId(item.id);
                  setShowConferenceModal(false);
                }}
              >
                <Text style={styles.modalItemText}>{item.tripName}</Text>
              </TouchableOpacity>
            )}
          />

        </View>
      </View>
    </Modal>
  );

  const renderCategoryModal = () => (
    <Modal
      visible={showCategoryModal}
      transparent={true}
      animationType="slide"
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Category</Text>
            <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={categories}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => {
                  setFormData({ ...formData, category: item, subCategory: '' });
                  setShowCategoryModal(false);
                }}
              >
                <Text style={styles.modalItemText}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );

  const renderSubCategoryModal = () => (
    <Modal
      visible={showSubCategoryModal}
      transparent={true}
      animationType="slide"
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Sub Category</Text>
            <TouchableOpacity onPress={() => setShowSubCategoryModal(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={subCategories[formData.category] || []}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => {
                  setFormData({ ...formData, subCategory: item });
                  setShowSubCategoryModal(false);
                }}
              >
                <Text style={styles.modalItemText}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#d13a3d" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('Home')}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Expense Request</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

        {/* Receipt Photo - Moved to Top */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Receipt Photo</Text>
          {formData.receiptPhoto ? (
            <View style={styles.imageContainer}>
              <Image source={{ uri: formData.receiptPhoto }} style={styles.receiptImage} />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => setFormData({ ...formData, receiptPhoto: null })}
              >
                <Ionicons name="close-circle" size={24} color="#d13a3d" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.uploadButton} onPress={showImageOptions}>
              <View style={styles.uploadIconContainer}>
                <Ionicons name="image-outline" size={32} color="#d13a3d" />
                <View style={styles.plusIcon}>
                  <Ionicons name="add" size={16} color="#fff" />
                </View>
              </View>
              <Text style={styles.uploadButtonText}>Add Receipt</Text>
              <Text style={styles.uploadButtonSubtext}>Tap to capture or select image</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Conference Name */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Conference Name *</Text>
          <TouchableOpacity
            disabled={!!editingExpense}
            style={[
              styles.selectButton,
              formData.conferenceName && styles.filledInput
            ]}
            onPress={() => !editingExpense && setShowConferenceModal(true)}
          >
            <View style={styles.iconContainer}>
              <Ionicons
                name="business-outline"
                size={20}
                color={editingExpense ? "#ccc" : "#666"}
              />
            </View>
            <Text style={[
              styles.selectButtonText,
              !formData.conferenceName && styles.placeholder,
              formData.conferenceName && styles.filledText
            ]}>
              {formData.conferenceName || 'Select conference'}
            </Text>
            {!editingExpense && (
              <Ionicons name="chevron-down" size={20} color="#666" />
            )}          </TouchableOpacity>
        </View>

        {/* Category */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Category *</Text>
          <TouchableOpacity
            style={[
              styles.selectButton,
              formData.category && styles.filledInput
            ]}
            onPress={() => setShowCategoryModal(true)}
          >
            <View style={styles.iconContainer}>
              <Ionicons name="folder-outline" size={20} color={formData.category ? "#d13a3d" : "#666"} />
            </View>
            <Text style={[
              styles.selectButtonText,
              !formData.category && styles.placeholder,
              formData.category && styles.filledText
            ]}>
              {formData.category || 'Select category'}
            </Text>
            <Ionicons name="chevron-down" size={20} color={formData.category ? "#d13a3d" : "#666"} />
          </TouchableOpacity>
        </View>

        {/* Sub Category */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Sub Category</Text>
          <TouchableOpacity
            style={[
              styles.selectButton,
              !formData.category && styles.disabledButton,
              formData.subCategory && styles.filledInput
            ]}
            onPress={() => formData.category && setShowSubCategoryModal(true)}
            disabled={!formData.category}
          >
            <View style={styles.iconContainer}>
              <Ionicons
                name="folder-open-outline"
                size={20}
                color={!formData.category ? "#999" : (formData.subCategory ? "#d13a3d" : "#666")}
              />
            </View>
            <Text style={[
              styles.selectButtonText,
              !formData.subCategory && styles.placeholder,
              formData.subCategory && styles.filledText
            ]}>
              {formData.subCategory || 'Select sub category'}
            </Text>
            <Ionicons
              name="chevron-down"
              size={20}
              color={!formData.category ? "#999" : (formData.subCategory ? "#d13a3d" : "#666")}
            />
          </TouchableOpacity>
        </View>

        {/* Amount */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Amount (in dollars)*</Text>
          <View style={[
            styles.inputWrapper,
            focusedInput === 'amount' && styles.focusedInput,
            formData.amount && styles.filledInput
          ]}>
            <View style={styles.iconContainer}>
              <Ionicons
                name="cash-outline"
                size={20}
                color={formData.amount ? "#d13a3d" : (focusedInput === 'amount' ? "#d13a3d" : "#666")}
              />
            </View>
            <TextInput
              style={[styles.textInput, formData.amount && styles.filledText]}
              placeholder="Enter amount"
              placeholderTextColor="#999"
              value={formData.amount}
              onChangeText={(text) => setFormData({ ...formData, amount: text })}
              keyboardType="numeric"
              onFocus={() => setFocusedInput('amount')}
              onBlur={() => setFocusedInput(null)}
            />
          </View>
        </View>

        {/* Date */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Date *</Text>
          <TouchableOpacity
            style={[styles.selectButton, styles.filledInput]}
            onPress={() => setShowDatePicker(true)}
          >
            <View style={styles.iconContainer}>
              <Ionicons name="calendar-outline" size={20} color="#d13a3d" />
            </View>
            <Text style={[styles.selectButtonText, styles.filledText]}>
              {formData.date.toLocaleDateString()}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#d13a3d" />
          </TouchableOpacity>
        </View>

        {/* Payment Method */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Payment Method *</Text>
          <View style={styles.paymentMethodContainer}>
            <TouchableOpacity
              style={[
                styles.paymentMethodButton,
                formData.paymentMethod === 'college' && styles.selectedPaymentMethod,
              ]}
              onPress={() => setFormData({ ...formData, paymentMethod: 'college' })}
            >
              <View style={styles.paymentIconContainer}>
                <Ionicons
                  name="school-outline"
                  size={20}
                  color={formData.paymentMethod === 'college' ? '#fff' : '#666'}
                />
              </View>
              <Text
                style={[
                  styles.paymentMethodText,
                  formData.paymentMethod === 'college' && styles.selectedPaymentMethodText,
                ]}
              >
                College Credit Card
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.paymentMethodButton,
                formData.paymentMethod === 'personal' && styles.selectedPaymentMethod,
              ]}
              onPress={() => setFormData({ ...formData, paymentMethod: 'personal' })}
            >
              <View style={styles.paymentIconContainer}>
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={formData.paymentMethod === 'personal' ? '#fff' : '#666'}
                />
              </View>
              <Text
                style={[
                  styles.paymentMethodText,
                  formData.paymentMethod === 'personal' && styles.selectedPaymentMethodText,
                ]}
              >
                Personal Payment
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Ionicons name="checkmark-circle-outline" size={24} color="#fff" />
          <Text style={styles.submitButtonText}>Submit Expense</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={formData.date}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              setFormData({ ...formData, date: selectedDate });
            }
          }}
        />
      )}

      {/* Modals */}
      {renderConferenceModal()}
      {renderCategoryModal()}
      {renderSubCategoryModal()}
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
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  headerRight: {
    width: 32,
  },
  content: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 24,
    marginTop: 8,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  focusedInput: {
    borderColor: '#d13a3d',
    backgroundColor: '#fff',
    shadowColor: '#d13a3d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  filledInput: {
    borderColor: '#d13a3d',
    backgroundColor: '#fff',
    shadowColor: '#d13a3d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  iconContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  filledText: {
    color: '#d13a3d',
    fontWeight: '500',
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  disabledButton: {
    backgroundColor: '#f5f5f5',
    opacity: 0.6,
  },
  selectButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  placeholder: {
    color: '#999',
  },
  uploadButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    paddingVertical: 40,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: '#d13a3d',
    borderStyle: 'dashed',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  uploadIconContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  plusIcon: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    backgroundColor: '#d13a3d',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  uploadButtonText: {
    fontSize: 18,
    color: '#d13a3d',
    fontWeight: '600',
    marginBottom: 4,
  },
  uploadButtonSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  imageContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  receiptImage: {
    width: '100%',
    height: 220,
    borderRadius: 20,
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 6,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  paymentMethodContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  paymentMethodButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  selectedPaymentMethod: {
    backgroundColor: '#d13a3d',
    borderColor: '#d13a3d',
    shadowColor: '#d13a3d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  paymentIconContainer: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  paymentMethodText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    textAlign: 'center',
  },
  selectedPaymentMethodText: {
    color: '#fff',
    fontWeight: '600',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#d13a3d',
    borderRadius: 16,
    paddingVertical: 18,
    marginTop: 32,
    marginBottom: 40,
    elevation: 8,
    shadowColor: '#d13a3d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  submitButtonText: {
    marginLeft: 8,
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  modalItemText: {
    fontSize: 16,
    color: '#333',
  },
});

export default AddExpense;