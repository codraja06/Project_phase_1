import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { AuthNavigator } from './AuthNavigator';
import { CitizenNavigator } from './CitizenNavigator';
import { AuthorityNavigator } from './AuthorityNavigator';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const AppNavigator: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner message="Initializing Civic System..." />;
  }

  if (!user) {
    return (
      <NavigationContainer>
        <AuthNavigator />
      </NavigationContainer>
    );
  }

  const role = (user.role || '').toLowerCase().trim();

  return (
    <NavigationContainer>
      {role === 'authority' ? (
        <AuthorityNavigator />
      ) : (
        <CitizenNavigator />
      )}
    </NavigationContainer>
  );
};
