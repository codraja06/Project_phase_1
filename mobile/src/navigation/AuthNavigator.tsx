import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../types/navigation';

import { SplashScreen } from '../screens/auth/SplashScreen';
import { CitizenLoginScreen } from '../screens/auth/CitizenLoginScreen';
import { CitizenRegisterScreen } from '../screens/auth/CitizenRegisterScreen';
import { AuthorityLoginScreen } from '../screens/auth/AuthorityLoginScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export const AuthNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="CitizenLogin" component={CitizenLoginScreen} />
      <Stack.Screen name="CitizenRegister" component={CitizenRegisterScreen} />
      <Stack.Screen name="AuthorityLogin" component={AuthorityLoginScreen} />
    </Stack.Navigator>
  );
};
