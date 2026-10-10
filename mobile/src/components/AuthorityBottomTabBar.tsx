import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform, StyleSheet } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const AuthorityBottomTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, Platform.OS === 'ios' ? 20 : 8) }]}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
        bounces={false}
      >
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
              ? options.title
              : route.name;

          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          let iconName: keyof typeof Ionicons.glyphMap = 'grid-outline';
          if (route.name === 'AuthorityDashboard') {
            iconName = isFocused ? 'grid' : 'grid-outline';
          } else if (route.name === 'AllComplaints') {
            iconName = isFocused ? 'document-text' : 'document-text-outline';
          } else if (route.name === 'AuthorityMap') {
            iconName = isFocused ? 'map' : 'map-outline';
          } else if (route.name === 'AuthorityAnalytics') {
            iconName = isFocused ? 'bar-chart' : 'bar-chart-outline';
          } else if (route.name === 'AuthorityNotifications') {
            iconName = isFocused ? 'notifications' : 'notifications-outline';
          } else if (route.name === 'AuthorityProfile') {
            iconName = isFocused ? 'shield' : 'shield-outline';
          }

          const color = isFocused ? COLORS.secondary : 'rgba(255,255,255,0.6)';

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              style={styles.tabButton}
            >
              <Ionicons name={iconName} size={22} color={color} />
              <Text style={[styles.tabLabel, { color }]}>
                {String(label)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.authorityPrimary,
    borderTopColor: COLORS.authorityDark,
    borderTopWidth: 1,
    paddingTop: 8,
    // Add zIndex to ensure it stays on top of content
    zIndex: 100,
    elevation: 8,
    ...(Platform.OS === 'web' ? { position: 'sticky' as any, bottom: 0, width: '100%' } : {}),
  },
  scrollView: {
    flexGrow: 0,
  },
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    // minWidth allows items to expand if there's space, but forces scrolling if squished
    minWidth: '100%',
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    minWidth: 64, // Touch target width
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
});
