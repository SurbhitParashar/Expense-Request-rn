// src/config/firebase.js

import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey:            'AIzaSyBlJUztxYGiTNMZGYtod_0CIyecUgY7dQo',
  authDomain:        'expense-request-rn.firebaseapp.com',
  projectId:         'expense-request-rn',
  storageBucket:     'expense-request-rn.appspot.com',
  messagingSenderId: '898714859127',
  appId:             '1:898714859127:android:80ba28a15363e8cad77872',
};

// initialize the Firebase app
const app  = initializeApp(firebaseConfig);



let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (e) {
  // auth was already initialized
  auth = getAuth(app);
}

export { auth };

// Firestore
export const db = getFirestore(app);