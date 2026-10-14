import React, { useEffect } from 'react';
import { View, StyleSheet, TouchableWithoutFeedback, BackHandler, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthoritySidebar } from './AuthoritySidebar';
import { useMobileMenu } from '../contexts/MobileMenuContext';
import { COLORS } from '../constants/theme';
import { useBreakpoint } from '../hooks/useBreakpoint';

export const MobileDrawer: React.FC<{
  activeRoute: string;
  onNavigate: (route: string) => void;
}> = ({ activeRoute, onNavigate }) => {
  const { isMenuOpen, closeMenu } = useMobileMenu();
  const { isDesktop } = useBreakpoint();
  useEffect(() => {
    if (!isMenuOpen || isDesktop) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => { closeMenu(); return true; });
    return () => subscription.remove();
  }, [isMenuOpen, isDesktop, closeMenu]);
  
  // Animation value could be added here for sliding, but for simplicity
  // we can use a conditional render or basic View for now.
  // Actually, let's just make it a simple absolute overlay.

  if (isDesktop || !isMenuOpen) {
    return null;
  }

  return (
    <View style={styles.overlay}>
      <TouchableWithoutFeedback onPress={closeMenu}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>
      <SafeAreaView style={styles.drawerContainer}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <AuthoritySidebar
          activeRoute={activeRoute}
          onNavigate={(route) => {
            onNavigate(route);
            closeMenu();
          }}
        />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    flexDirection: 'row',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  drawerContainer: {
    width: 260,
    height: '100%',
    backgroundColor: '#fff',
    ...(Platform.OS === 'web' ? { boxShadow: '2px 0 8px rgba(0,0,0,0.1)' } : { elevation: 5 }),
  },
});
