// src/screens/RegistrationForm.js
import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { FontAwesome, MaterialIcons, Feather } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { auth, db } from '../config/firebase';
import { doc, setDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useContext } from 'react';
import { AppDataContext } from '../context/TripData';


export default function RegistrationForm({ navigation }) {
  const [formData, setFormData] = useState({
    name: '',
    pCard: '',
    department: '',           // dropdown
    managerName: '',
    managerEmail: '',
    selectedAvatar: null,
  });

  const { completeRegistration } = useContext(AppDataContext);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    const { name, pCard, department, managerName, managerEmail, selectedAvatar } = formData;

    if (!name || !pCard || !department || !managerName || !managerEmail || !selectedAvatar) {
      return Alert.alert('Error', 'Please fill out all fields.');
    }

    try {
      await AsyncStorage.setItem('userPCard', formData.pCard);  // when user logs in or registers
      await AsyncStorage.setItem('userName', formData.name);
      await AsyncStorage.setItem('department', formData.department);

      // Write to Firestore under collection 'users', doc ID = pCard
      await setDoc(doc(db, 'users', pCard), {
        uid: auth.currentUser.uid,
        email: auth.currentUser.email,
        avatar: selectedAvatar,
        name,
        department,
        managerName,
        managerEmail,
        createdAt: new Date().toISOString(),
        hasRegistered: true
      });

      completeRegistration();

      Alert.alert('Success', 'Profile saved! Moving to home page...',
        [
          { text: 'OK', onPress: () => navigation.replace('Home') }
        ]
      );

    } catch (err) {
      console.error(err);
      Alert.alert('Save Error', err.message);
    }
  };

  const avatarOptions = [
    { id: 'male', label: 'Male', image: require('../../assets/images/male-avatar.png') },
    { id: 'female', label: 'Female', image: require('../../assets/images/female-avatar.png') },
  ];

  const departmentOptions = [
    'ITS (information technology services)',
    'Accounting',
    'Registrar',
    'HR (human Resources)',
  ];

  return (
     <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.select({ ios: 0, android: 20 })}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}> */}
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.welcomeContainer}>
            <Text style={styles.title}>Register!</Text>
            <Text style={styles.subtitle}>
              One more step to Access your expense request portal!
            </Text>
          </View>
        </View>

        {/* Avatar Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose Avatar</Text>
          <View style={styles.avatarContainer}>
            {avatarOptions.map(av => (
              <TouchableOpacity
                key={av.id}
                style={styles.avatarOption}
                onPress={() => handleInputChange('selectedAvatar', av.id)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.avatarImageContainer,
                  formData.selectedAvatar === av.id && styles.avatarSelected,
                ]}>
                  <Image source={av.image} style={styles.avatarImage} />
                </View>
                <Text style={[
                  styles.avatarLabel,
                  formData.selectedAvatar === av.id && styles.avatarLabelSelected
                ]}>
                  {av.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Core Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Details</Text>

          {/* Full Name */}
          <View style={styles.inputContainer}>
            <View style={styles.inputRow}>
              <View style={styles.iconContainer}>
                <FontAwesome name="user" size={20} color="#d13a3d" />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor="#9ca3af"
                value={formData.name}
                onChangeText={t => handleInputChange('name', t)}
              />
            </View>
          </View>

          {/* P‑Card Number */}
          <View style={styles.inputContainer}>
            <View style={styles.inputRow}>
              <View style={styles.iconContainer}>
                <FontAwesome name="credit-card" size={20} color="#d13a3d" />
              </View>
              <TextInput
                style={styles.input}
                placeholder="P‑Card Number"
                placeholderTextColor="#9ca3af"
                value={formData.pCard}
                onChangeText={t => handleInputChange('pCard', t)}
              />
            </View>
          </View>

          {/* Department Dropdown */}
          {/* Department (styled like the other fields) */}
          <View style={styles.inputContainer}>
            <View style={styles.inputRow}>
              {/* Icon on the left */}
              <View style={styles.iconContainer}>
                <MaterialIcons name="business" size={20} color="#d13a3d" />
              </View>

              {/* Picker wrapper matching your TextInput style */}
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={formData.department}
                  onValueChange={val => handleInputChange('department', val)}
                  style={{ flex: 1 }}
                >
                  {/* Placeholder item */}
                  <Picker.Item label="Choose Department" value="" color="#9ca3af" />
                  {departmentOptions.map(dep => (
                    <Picker.Item key={dep} label={dep} value={dep} />
                  ))}
                </Picker>
              </View>
            </View>
          </View>
        </View>




        {/* Manager Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Manager Information</Text>

          {/* Manager Name */}
          <View style={styles.inputContainer}>
            <View style={styles.inputRow}>
              <View style={styles.iconContainer}>
                <FontAwesome name="user-circle" size={20} color="#d13a3d" />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Manager Name"
                placeholderTextColor="#9ca3af"
                value={formData.managerName}
                onChangeText={t => handleInputChange('managerName', t)}
              />
            </View>
          </View>

          {/* Manager Email */}
          <View style={styles.inputContainer}>
            <View style={styles.inputRow}>
              <View style={styles.iconContainer}>
                <MaterialIcons name="email" size={20} color="#d13a3d" />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Manager Email"
                placeholderTextColor="#9ca3af"
                keyboardType="email-address"
                autoCapitalize="none"
                value={formData.managerEmail}
                onChangeText={t => handleInputChange('managerEmail', t)}
              />
            </View>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={styles.button}
          onPress={handleSave}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Save & Continue</Text>
          <Feather name="chevron-right" size={20} color="white" />
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>

  );
}


const styles = StyleSheet.create({
  pickerWrapper: {
    flex: 1,
    height: 56,                         // match your inputRow height
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    paddingHorizontal: 8,
  },

  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 140,
    height: 160,
    borderRadius: 20,
    marginBottom: 12,
  },
  universityText: {
    alignItems: 'center',
  },
  universityName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    letterSpacing: 2,
    marginBottom: 2,
  },
  welcomeContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#d13a3d',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
    color: '#1f2937',
  },
  avatarContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
  },
  avatarOption: {
    alignItems: 'center',
    padding: 12,
  },
  avatarImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#e5e7eb',
    padding: 3,
    backgroundColor: '#f9fafb',
  },
  avatarSelected: {
    borderColor: '#d13a3d',
    backgroundColor: '#fef2f2',
    shadowColor: '#d13a3d',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 34,
  },
  avatarLabel: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  avatarLabelSelected: {
    color: '#d13a3d',
    fontWeight: '700',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  iconContainer: {
    width: 24,
    alignItems: 'center',
    marginRight: 12,
  },
  input: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#d13a3d',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    marginVertical: 24,
    shadowColor: '#d13a3d',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    marginRight: 8,
  },
});