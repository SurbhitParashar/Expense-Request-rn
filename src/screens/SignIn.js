import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  StyleSheet,
  TouchableOpacity,
  Alert, ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db } from '../config/firebase';
import {
  signInWithEmailAndPassword,
  fetchSignInMethodsForEmail,
} from 'firebase/auth';
import { AppDataContext } from '../context/TripData';
import {
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';


export default function SignIn({ navigation }) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]       = useState(false);

  const { login, completeRegistration, loadTrips } = useContext(AppDataContext);

  const handleSignIn = async () => {
    if (!email || !password) {
      return Alert.alert('Missing fields', 'Please enter both email and password.');
    }

    try {
      setLoading(true)

      // 1️⃣ Sign in
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email.trim().toLowerCase(),
        password
      );

      // 2️⃣ Grab their Firebase ID token
      const idToken = await userCredential.user.getIdToken();
      await AsyncStorage.setItem('userToken', idToken);


      const uid = userCredential.user.uid;
      const q = query(collection(db, 'users'), where('uid', '==', uid));
      const snaps = await getDocs(q);

      let storedPCard = null
      let storedName = null
      
      if (!snaps.empty) {
        // assuming exactly one match:
        const docSnap = snaps.docs[0]
        storedPCard = docSnap.id   // this is your pCard
        const userData = docSnap.data();
        storedName = userData.name || '';

        // console.log('storedPCard', storedPCard)
        await AsyncStorage.setItem('userPCard', storedPCard)
        await AsyncStorage.setItem('userName', storedName);
      }

      login();


      if (storedPCard) {
        completeRegistration();
        await loadTrips();
        navigation.replace('Home')
      }else{
      navigation.replace('RegistrationForm');
      }

    } catch (err) {
      setLoading(false)
      // Friendly error messages
      if (err.code === 'auth/user-not-found') {
        return Alert.alert('No account found', 'Please register first.');
      }
      if (err.code === 'auth/wrong-password') {
        return Alert.alert('Invalid Password', 'The password is incorrect.');
      }
      Alert.alert('Sign In Error', err.message);
    }
  };



  return (
    
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" />
        </View>
      )}
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Image source={require('../../assets/images/logo.png')} style={styles.logo} />
        <Text style={styles.uniName}>GRINNELL</Text>
        <Text style={styles.uniSub}>COLLEGE</Text>
      </View>

      {/* Welcome */}
      <Text style={styles.welcomeTitle}>Welcome!</Text>
      <Text style={styles.welcomeDesc}>Access your expense request portal!</Text>

      {/* Inputs */}
      <View style={styles.inputGroup}>
        <View style={styles.inputContainer}>
          <Feather name="user" size={20} color="#999" style={styles.icon} />
          <TextInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
          />
        </View>

        <View style={styles.inputContainer}>
          <Feather name="lock" size={20} color="#999" style={styles.icon} />
          <TextInput
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            style={styles.input}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
            <Feather name={showPassword ? 'eye-off' : 'eye'} size={20} color="#999" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Button */}
      <TouchableOpacity style={styles.button} onPress={handleSignIn}>
        <Text style={styles.buttonText}>SIGN IN</Text>
      </TouchableOpacity>

      {/* Footer */}
      <TouchableOpacity onPress={() => navigation.navigate('SignUp')} style={styles.link}>
        <Text style={styles.linkText}>New User? Create Account</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.link2}>
        <Text style={[styles.linkText, { fontSize: 12, color: '#888' }]}>Forgot Password?</Text>
      </TouchableOpacity>
    
    </ScrollView>
   </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    color:"#d13a3d"
  },
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 140,
    height: 160,
    borderRadius: 20,
  },
  uniName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'serif',
  },
  uniSub: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'serif',
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    color: '#333',
    marginBottom: 6,
  },
  welcomeDesc: {
    textAlign: 'center',
    color: '#888',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    position: 'relative',
  },
  icon: {
    marginRight: 8,
  },
  eyeIcon: {
    position: 'absolute',
    right: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  button: {
    backgroundColor: '#d13a3d',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  link: {
    alignItems: 'center',
    marginTop: 15,
  },
  link2: {
    alignItems: 'center',
    marginTop: 5,
  },
  linkText: {
    color: '#d13a3d',
    fontWeight: '500',
  },
});
