import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ViewStyle,
  StyleProp,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Complaint } from '../types/complaint';
import { COLORS, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { StatusBadge } from './StatusBadge';
import { formatDate } from '../utils/date';
import { Card, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';

interface ComplaintCardProps {
  complaint: Complaint;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  showCitizenInfo?: boolean;
}

export const ComplaintCard: React.FC<ComplaintCardProps> = ({
  complaint,
  onPress,
  style,
  showCitizenInfo = false,
}) => {
  const [imgError, setImgError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const isWeb = Platform.OS === 'web';

  const formattedDate = formatDate(complaint.createdAt);

  const citizenObj = complaint.createdBy || complaint.citizenId;
  const citizenName =
    typeof citizenObj === 'object' && citizenObj
      ? (citizenObj as any).name || 'Citizen'
      : 'Citizen';

  const categoryLabel = complaint.customCategory
    ? `${complaint.customCategory} (Custom)`
    : (complaint.category || 'Issue')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());

  const complaintCode = complaint.complaintId || `#CIV${complaint._id.slice(-5).toUpperCase()}`;
  const priority = complaint.priority || 'medium';
  const isHighPriority = priority === 'urgent' || priority === 'high';

  const locationSummary = complaint.address
    ? complaint.address.split(',')[0].trim() || complaint.address
    : 'GPS Coordinates';

  return (
    <Card
      style={[
        styles.card,
        isHovered && isWeb && (styles.cardHovered as any),
        style,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Complaint ${complaintCode}: ${complaint.title}, Status: ${complaint.status}`}
      {...({
        onMouseEnter: () => setIsHovered(true),
        onMouseLeave: () => setIsHovered(false),
      } as any)}
    >
      <CardContent style={{ padding: 16 }}>
        {/* ─── Top Header: Complaint ID & Status ─── */}
        <View style={styles.headerRow}>
          <View style={styles.codePillGroup}>
            <Text style={styles.complaintCodeText}>{complaintCode}</Text>
            {isHighPriority && <Badge label="HIGH" variant="destructive" />}
          </View>
          <StatusBadge status={complaint.status} size="sm" />
        </View>

        {/* ─── Main Content: Thumbnail + Info ─── */}
        <View style={styles.contentRow}>
          {/* Thumbnail with error fallback */}
          <View style={styles.thumbnailWrapper}>
            {complaint.imageUrl && !imgError ? (
              <Image
                source={{ uri: complaint.imageUrl }}
                style={styles.thumbnail}
                resizeMode="cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <View style={styles.thumbnailPlaceholder}>
                <Ionicons name="image-outline" size={24} color={COLORS.textMuted} />
              </View>
            )}
          </View>

          {/* Text Info */}
          <View style={styles.infoCol}>
            <Text style={styles.categoryTitle} numberOfLines={1}>
              {categoryLabel}
            </Text>
            <Text style={styles.description} numberOfLines={2}>
              {complaint.description || complaint.title || 'Civic issue report submitted.'}
            </Text>
            {showCitizenInfo && (
              <View style={styles.citizenRow}>
                <Ionicons name="person-outline" size={12} color={COLORS.accent} style={{ marginRight: 4 }} />
                <Text style={styles.citizenName} numberOfLines={1}>
                  {citizenName}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* ─── Metadata Footer: Date & Location ─── */}
        <View style={styles.metaFooter}>
          <View style={styles.metaItem}>
            <Text style={styles.metaIcon}>📅</Text>
            <Text style={styles.metaText}>{formattedDate}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaIcon}>📍</Text>
            <Text style={styles.metaText} numberOfLines={1}>
              {locationSummary}
            </Text>
          </View>
        </View>

        {/* ─── Bottom Action Link ─── */}
        <View style={styles.actionRow}>
          <Text style={styles.viewDetailsText}>View Details →</Text>
        </View>
      </CardContent>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    padding: 0,
    ...(Platform.OS === 'web' ? {
      cursor: 'pointer' as any,
      transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)' as any,
    } : {}),
  },
  cardHovered: {
    borderColor: COLORS.primary,
    ...SHADOWS.cardHover,
    transform: [{ translateY: -2 }],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  codePillGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  complaintCodeText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.xs,
    letterSpacing: 0.2,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  thumbnailWrapper: {
    width: 72,
    height: 72,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
    marginRight: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  infoCol: {
    flex: 1,
    justifyContent: 'center',
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 3,
    letterSpacing: -0.2,
  },
  description: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    fontWeight: '400',
  },
  citizenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  citizenName: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.accent,
  },
  metaFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '55%',
  },
  metaIcon: {
    fontSize: 12,
    marginRight: 5,
  },
  metaText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  actionRow: {
    marginTop: 8,
    alignItems: 'flex-end',
  },
  viewDetailsText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
});
