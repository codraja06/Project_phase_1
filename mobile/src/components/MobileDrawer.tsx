import React from 'react';
import { View, StyleSheet, TouchableWithoutFeedback, Animated, Platform } from 'react-native';
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
      <View style={styles.drawerContainer}>
        <AuthoritySidebar
          activeRoute={activeRoute}
          onNavigate={(route) => {
            onNavigate(route);
            closeMenu();
          }}
        />
      </View>
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
