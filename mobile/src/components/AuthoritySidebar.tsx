import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { CivicTrackLogo } from './CivicTrackLogo';

interface NavItem {
  label: string;
  route: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
}

const AUTHORITY_NAV_ITEMS: NavItem[] = [
  {
    label: 'Command Center',
    route: 'AuthorityDashboard',
    icon: 'grid-outline',
    iconActive: 'grid',
  },
  {
    label: 'All Complaints',
    route: 'AllComplaints',
    icon: 'document-text-outline',
    iconActive: 'document-text',
  },
  {
    label: 'Incident Map',
    route: 'AuthorityMap',
    icon: 'map-outline',
    iconActive: 'map',
  },
  {
    label: 'Operations Analytics',
    route: 'AuthorityAnalytics',
    icon: 'bar-chart-outline',
    iconActive: 'bar-chart',
  },
  {
    label: 'Alerts & Feed',
    route: 'AuthorityNotifications',
    icon: 'notifications-outline',
    iconActive: 'notifications',
  },
  {
    label: 'Officer Profile',
    route: 'AuthorityProfile',
    icon: 'shield-outline',
    iconActive: 'shield',
  },
];

interface AuthoritySidebarProps {
  activeRoute: string;
  onNavigate: (route: string) => void;
}

export const AuthoritySidebar: React.FC<AuthoritySidebarProps> = ({
  activeRoute,
  onNavigate,
}) => {
  const [hoveredRoute, setHoveredRoute] = useState<string | null>(null);
  const isWeb = Platform.OS === 'web';

  return (
    <View style={styles.sidebar}>
      {/* Brand Header */}
      <View style={styles.logoArea}>
        <CivicTrackLogo size="sm" showText={true} showTagline={false} />
        <View style={styles.portalTag}>
          <Ionicons name="shield" size={11} color={COLORS.accentDark} style={{ marginRight: 4 }} />
          <Text style={styles.portalTagText}>MUNICIPAL OPS</Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Navigation Links */}
      <ScrollView
        style={styles.navScroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.navContent}
      >
        <Text style={styles.navSectionHeader}>OPERATIONS</Text>

        {AUTHORITY_NAV_ITEMS.map((item) => {
          const isActive = activeRoute === item.route;
          const isHovered = hoveredRoute === item.route;

          return (
            <TouchableOpacity
              key={item.route}
              style={[
                styles.navItem,
                isActive && styles.navItemActive,
                isHovered && !isActive && (styles.navItemHovered as any),
              ]}
              onPress={() => onNavigate(item.route)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              accessibilityState={{ selected: isActive }}
              {...({
                onMouseEnter: () => setHoveredRoute(item.route),
                onMouseLeave: () => setHoveredRoute(null),
              } as any)}
            >
              {isActive && <View style={styles.activeBar} />}

              <Ionicons
                name={isActive ? item.iconActive : item.icon}
                size={20}
                color={isActive ? COLORS.accent : isHovered ? COLORS.textPrimary : COLORS.slateMedium}
                style={styles.navIcon}
              />
              <Text
                style={[
                  styles.navLabel,
                  isActive && styles.navLabelActive,
                  isHovered && !isActive && styles.navLabelHovered,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Footer Info Card */}
      <View style={styles.footer}>
        <View style={styles.footerBadge}>
          <Ionicons
            name="shield-checkmark"
            size={14}
            color={COLORS.accent}
            style={{ marginRight: 6 }}
          />
          <Text style={styles.footerText}>Authorized City Officer</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sidebar: {
    width: 260,
    backgroundColor: '#FFFFFF',
    borderRightWidth: 1.5,
    borderRightColor: COLORS.border,
    flexDirection: 'column',
    ...SHADOWS.card,
  },
  logoArea: {
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 16,
    alignItems: 'flex-start',
  },
  portalTag: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: COLORS.accentLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.xs,
  },
  portalTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.accentDark,
    letterSpacing: 0.6,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginHorizontal: 18,
    marginBottom: 12,
  },
  navScroll: {
    flex: 1,
  },
  navContent: {
    paddingTop: 4,
    paddingBottom: 16,
    paddingHorizontal: 14,
  },
  navSectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: 4,
    position: 'relative',
    overflow: 'hidden',
    ...(Platform.OS === 'web' ? {
      cursor: 'pointer' as any,
      transition: 'all 0.16s ease-in-out' as any,
    } : {}),
  },
  navItemActive: {
    backgroundColor: COLORS.accentLight,
  },
  navItemHovered: {
    backgroundColor: COLORS.surface,
  },
  activeBar: {
    position: 'absolute',
    left: 0,
    top: 6,
    bottom: 6,
    width: 3.5,
    borderRadius: 2,
    backgroundColor: COLORS.accent,
  },
  navIcon: {
    marginRight: 12,
    width: 22,
  },
  navLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    flex: 1,
  },
  navLabelActive: {
    fontWeight: '800',
    color: COLORS.accentDark,
  },
  navLabelHovered: {
    color: COLORS.textPrimary,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  footerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accentLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.accentSurface,
  },
  footerText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.accentDark,
    letterSpacing: 0.2,
  },
});
