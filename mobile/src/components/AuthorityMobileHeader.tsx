import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMobileMenu } from '../contexts/MobileMenuContext';
import { TYPOGRAPHY } from '../theme/typography';
import { COLORS } from '../theme/colors';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface Props {
  title: string;
  subtitle?: string;
  rightNode?: React.ReactNode;
}

export const AuthorityMobileHeader: React.FC<Props> = ({ title, subtitle, rightNode }) => {
  const { toggleMenu } = useMobileMenu();
  const insets = useSafeAreaInsets();
  
  return (
    <Animated.View 
      entering={FadeInDown.duration(400)} 
      style={[
        styles.header, 
        { 
          paddingTop: Math.max(insets.top, Platform.OS === 'android' ? 16 : 0) + 12 
        }
      ]}
    > 
      <TouchableOpacity onPress={toggleMenu} style={styles.menuBtn} accessibilityLabel="Open Menu">
        <Ionicons name="menu" size={24} color="#FFFFFF" />
      </TouchableOpacity>
      
      <View style={styles.textContainer}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
      </View>
      
      <View style={styles.rightSection}>
        {rightNode}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    zIndex: 100,
  },
  menuBtn: {
    width: 40, height: 40, borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    minWidth: 0,
  },
  title: { 
    ...TYPOGRAPHY.h3, 
    color: '#F8FAFC', 
    fontSize: 18, 
    lineHeight: 24 
  },
  subtitle: { 
    ...TYPOGRAPHY.caption, 
    color: '#94A3B8',
    marginTop: 2,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    flexShrink: 0,
  }
});
