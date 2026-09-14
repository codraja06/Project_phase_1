import React, { useCallback, useRef, useState } from 'react';
import { View, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BottomTabBar, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { AuthorityTabParamList, AuthorityStackParamList } from '../types/navigation';
import { COLORS } from '../constants/theme';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { AuthoritySidebar } from '../components/AuthoritySidebar';

import { AuthorityDashboardScreen } from '../screens/authority/AuthorityDashboardScreen';
import { AuthorityComplaintsScreen } from '../screens/authority/AuthorityComplaintsScreen';
import { AuthorityMapScreen } from '../screens/authority/AuthorityMapScreen';
import { AuthorityAnalyticsScreen } from '../screens/authority/AuthorityAnalyticsScreen';
import { AuthorityNotificationsScreen } from '../screens/authority/AuthorityNotificationsScreen';
import { AuthorityProfileScreen } from '../screens/authority/AuthorityProfileScreen';
import { AuthorityDetailScreen } from '../screens/authority/AuthorityDetailScreen';

const Tab = createBottomTabNavigator<AuthorityTabParamList>();
const Stack = createNativeStackNavigator<AuthorityStackParamList>();

// ─── Authority Tabs with Responsive Shell ────────────────────────────────────
const AuthorityTabs = (_props: any) => {
  const { isDesktop } = useBreakpoint();
  const [activeRoute, setActiveRoute] = useState<string>('AuthorityDashboard');

  // Ref to the Tab navigator's navigation object, populated by the custom tab bar
  const tabNavRef = useRef<any>(null);

  // Custom tab bar: on desktop renders nothing (sidebar replaces it),
  // on mobile/tablet renders the standard BottomTabBar.
  const CustomTabBar = useCallback(
    (props: BottomTabBarProps) => {
      tabNavRef.current = props.navigation;

      const currentRoute = props.state.routes[props.state.index]?.name ?? 'AuthorityDashboard';
      if (currentRoute !== activeRoute) {
        setTimeout(() => setActiveRoute(currentRoute), 0);
      }

      if (isDesktop) return null;

      return (
        <BottomTabBar
          {...props}
          insets={{ top: 0, right: 0, bottom: 0, left: 0 }}
        />
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isDesktop]
  );

  const handleSidebarNavigate = useCallback((routeName: string) => {
    tabNavRef.current?.navigate(routeName);
  }, []);

  return (
    <View style={{ flex: 1, flexDirection: isDesktop ? 'row' : 'column' }}>
      {/* Desktop Sidebar — hidden on mobile/tablet */}
      {isDesktop && (
        <AuthoritySidebar
          activeRoute={activeRoute}
          onNavigate={handleSidebarNavigate}
        />
      )}

      {/* Tab Content — takes remaining space */}
      <View style={{ flex: 1 }}>
        <Tab.Navigator
          tabBar={CustomTabBar}
          screenOptions={({ route }: { route: { name: string } }) => ({
            headerStyle: {
              backgroundColor: COLORS.authorityPrimary,
              borderBottomWidth: 0,
            },
            headerShadowVisible: false,
            headerTintColor: '#FFFFFF',
            headerTitleStyle: {
              fontWeight: '700',
              fontSize: 18,
              color: '#FFFFFF',
            },
            tabBarActiveTintColor: COLORS.secondary,
            tabBarInactiveTintColor: 'rgba(255,255,255,0.50)',
            tabBarStyle: {
              backgroundColor: COLORS.authorityPrimary,
              borderTopColor: COLORS.authorityDark,
              borderTopWidth: 1,
              paddingBottom: Platform.OS === 'ios' ? 20 : 8,
              paddingTop: 8,
              height: Platform.OS === 'ios' ? 76 : 62,
            },
            tabBarLabelStyle: {
              fontSize: 11,
              fontWeight: '600',
              marginTop: -2,
            },
            tabBarIcon: ({
              color,
              focused,
            }: {
              color: string;
              focused: boolean;
              size: number;
            }) => {
              let iconName: keyof typeof Ionicons.glyphMap = 'grid-outline';
              if (route.name === 'AuthorityDashboard') {
                iconName = focused ? 'grid' : 'grid-outline';
              } else if (route.name === 'AllComplaints') {
                iconName = focused ? 'document-text' : 'document-text-outline';
              } else if (route.name === 'AuthorityMap') {
                iconName = focused ? 'map' : 'map-outline';
              } else if (route.name === 'AuthorityAnalytics') {
                iconName = focused ? 'bar-chart' : 'bar-chart-outline';
              } else if (route.name === 'AuthorityNotifications') {
                iconName = focused ? 'notifications' : 'notifications-outline';
              } else if (route.name === 'AuthorityProfile') {
                iconName = focused ? 'shield' : 'shield-outline';
              }
              return <Ionicons name={iconName} size={22} color={color} />;
            },
          })}
        >
          <Tab.Screen
            name="AuthorityDashboard"
            component={AuthorityDashboardScreen as any}
            options={{ title: 'Dashboard', headerShown: false }}
          />
          <Tab.Screen
            name="AllComplaints"
            component={AuthorityComplaintsScreen as any}
            options={{ title: 'Complaints', headerShown: false }}
          />
          <Tab.Screen
            name="AuthorityMap"
            component={AuthorityMapScreen as any}
            options={{ title: 'Map', headerShown: false }}
          />
          <Tab.Screen
            name="AuthorityAnalytics"
            component={AuthorityAnalyticsScreen as any}
            options={{ title: 'Analytics', headerShown: false }}
          />
          <Tab.Screen
            name="AuthorityNotifications"
            component={AuthorityNotificationsScreen as any}
            options={{ title: 'Feed', headerShown: false }}
          />
          <Tab.Screen
            name="AuthorityProfile"
            component={AuthorityProfileScreen as any}
            options={{ title: 'Profile', headerShown: false }}
          />
        </Tab.Navigator>
      </View>
    </View>
  );
};

// ─── Authority Stack Navigator ────────────────────────────────────────────────
export const AuthorityNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#FFFFFF',
        },
        headerShadowVisible: false,
        headerTintColor: COLORS.textPrimary,
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 18,
          color: COLORS.textPrimary,
        },
      }}
    >
      <Stack.Screen
        name="AuthorityTabs"
        component={AuthorityTabs as any}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AuthorityComplaintDetail"
        component={AuthorityDetailScreen}
        options={{
          title: 'Complaint Details',
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
};
