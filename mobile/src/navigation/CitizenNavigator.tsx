import React, { useCallback, useRef, useState } from 'react';
import { View, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BottomTabBar, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { CitizenTabParamList, CitizenStackParamList } from '../types/navigation';
import { COLORS } from '../constants/theme';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { CitizenSidebar } from '../components/CitizenSidebar';

import { CitizenDashboardScreen } from '../screens/citizen/CitizenDashboardScreen';
import { ReportIssueScreen } from '../screens/citizen/ReportIssueScreen';
import { ComplaintHistoryScreen } from '../screens/citizen/ComplaintHistoryScreen';
import { ProfileScreen } from '../screens/citizen/ProfileScreen';
import { NotificationsScreen } from '../screens/citizen/NotificationsScreen';
import { ComplaintDetailScreen } from '../screens/citizen/ComplaintDetailScreen';

const Tab = createBottomTabNavigator<CitizenTabParamList>();
const Stack = createNativeStackNavigator<CitizenStackParamList>();

// ─── Citizen Tabs with Responsive Shell ──────────────────────────────────────
const CitizenTabs = (_props: any) => {
  const insets = useSafeAreaInsets();

  const { isDesktop } = useBreakpoint();
  const [activeRoute, setActiveRoute] = useState<string>('CitizenDashboard');

  // Ref to the Tab navigator's navigation object, populated by the custom tab bar
  const tabNavRef = useRef<any>(null);

  // Custom tab bar: on desktop renders nothing (sidebar replaces it),
  // on mobile/tablet renders the standard BottomTabBar.
  const CustomTabBar = useCallback(
    (props: BottomTabBarProps) => {
      // Keep the tab nav ref updated
      tabNavRef.current = props.navigation;

      // Sync active route state from tab state
      const currentRoute = props.state.routes[props.state.index]?.name ?? 'CitizenDashboard';
      if (currentRoute !== activeRoute) {
        // Use setTimeout to avoid setState-during-render warning
        setTimeout(() => setActiveRoute(currentRoute), 0);
      }

      // Desktop: hide the bottom tab bar entirely
      if (isDesktop) return null;

      // Mobile/Tablet: render the standard bottom tab bar
      return (
        <BottomTabBar
          {...props}
          insets={insets}
        />
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isDesktop, activeRoute, insets.bottom]
  );

  // Navigates between tabs from the sidebar
  const handleSidebarNavigate = useCallback((routeName: string) => {
    tabNavRef.current?.navigate(routeName);
  }, []);

  return (
    <View style={{ flex: 1, flexDirection: isDesktop ? 'row' : 'column' }}>
      {/* Desktop Sidebar — hidden on mobile/tablet */}
      {isDesktop && (
        <CitizenSidebar
          activeRoute={activeRoute}
          onNavigate={handleSidebarNavigate}
        />
      )}

      {/* Tab Content — takes remaining space */}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Tab.Navigator
          tabBar={CustomTabBar}
          screenOptions={({ route }: { route: { name: string } }) => ({
            headerStyle: {
              backgroundColor: '#FFFFFF',
              borderBottomWidth: 1,
              borderBottomColor: COLORS.border,
            },
            headerShadowVisible: false,
            headerTintColor: COLORS.textPrimary,
            headerTitleStyle: {
              fontWeight: '700',
              fontSize: 18,
              color: COLORS.textPrimary,
            },
            tabBarActiveTintColor: COLORS.primary,
            tabBarInactiveTintColor: COLORS.textMuted,
            tabBarStyle: {
              backgroundColor: '#FFFFFF',
              borderTopColor: COLORS.border,
              borderTopWidth: 1,
              paddingBottom: Math.max(insets.bottom, 8),
              paddingTop: 8,
              height: 56 + Math.max(insets.bottom, 8),
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
              let iconName: keyof typeof Ionicons.glyphMap = 'home-outline';
              if (route.name === 'CitizenDashboard') {
                iconName = focused ? 'home' : 'home-outline';
              } else if (route.name === 'ReportIssue') {
                iconName = focused ? 'camera' : 'camera-outline';
              } else if (route.name === 'ComplaintHistory') {
                iconName = focused ? 'document-text' : 'document-text-outline';
              } else if (route.name === 'Notifications') {
                iconName = focused ? 'notifications' : 'notifications-outline';
              } else if (route.name === 'CitizenProfile') {
                iconName = focused ? 'person' : 'person-outline';
              }
              return <Ionicons name={iconName} size={22} color={color} />;
            },
          })}
        >
          <Tab.Screen
            name="CitizenDashboard"
            component={CitizenDashboardScreen as any}
            options={{ title: 'Home', headerShown: false }}
          />
          <Tab.Screen
            name="ReportIssue"
            component={ReportIssueScreen as any}
            options={{ title: 'Report', headerShown: false }}
          />
          <Tab.Screen
            name="ComplaintHistory"
            component={ComplaintHistoryScreen as any}
            options={{ title: 'Complaints', headerShown: false }}
          />
          <Tab.Screen
            name="Notifications"
            component={NotificationsScreen as any}
            options={{ title: 'Alerts', headerShown: false }}
          />
          <Tab.Screen
            name="CitizenProfile"
            component={ProfileScreen as any}
            options={{ title: 'Profile', headerShown: false }}
          />
        </Tab.Navigator>
      </View>
    </View>
  );
};

// ─── Citizen Stack Navigator ──────────────────────────────────────────────────
export const CitizenNavigator: React.FC = () => {
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
        name="CitizenTabs"
        component={CitizenTabs as any}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ComplaintDetail"
        component={ComplaintDetailScreen}
        options={{
          title: 'Complaint Details',
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
};
