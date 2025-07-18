// AppNavigator.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AuthStack from './AuthStack';
import RegStack  from './RegStack';
import AppStack  from './AppStack';
import { AppDataProvider, AppDataContext } from '../context/TripData';

export default function AppNavigator() {
  return (
    <AppDataProvider>
      <AppDataContext.Consumer>
        {({ hasToken, isRegistered }) => (
          <NavigationContainer>
            {!hasToken ? (
              <AuthStack />
            ) : !isRegistered ? (
              <RegStack />
            ) : (
              <AppStack />
            )}
          </NavigationContainer>
        )}
      </AppDataContext.Consumer>
    </AppDataProvider>
  );
}
