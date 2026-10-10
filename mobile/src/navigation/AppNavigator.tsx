import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { AuthNavigator } from './AuthNavigator';
import { CitizenNavigator } from './CitizenNavigator';
import { AuthorityNavigator } from './AuthorityNavigator';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Root = createNativeStackNavigator();

export const AppNavigator: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner message="Authenticating..." />;
  }

  return (
    <Root.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <Root.Screen name="AuthRoot" component={AuthNavigator} />
      ) : user.role === 'authority' ? (
        <Root.Screen name="AuthorityRoot" component={AuthorityNavigator} />
      ) : (
        <Root.Screen name="CitizenRoot" component={CitizenNavigator} />
      )}
    </Root.Navigator>
  );
};
