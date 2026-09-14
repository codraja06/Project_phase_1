import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle, StyleProp } from 'react-native';
import { COLORS, BORDER_RADIUS } from '../../constants/theme';

export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';

export interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'default', style, textStyle, icon }) => {
  const getContainerStyle = (): ViewStyle => {
    const base: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: BORDER_RADIUS.full,
      alignSelf: 'flex-start',
    };

    switch (variant) {
      case 'default':
        base.backgroundColor = COLORS.primary;
        break;
      case 'secondary':
        base.backgroundColor = COLORS.borderStrong;
        break;
      case 'destructive':
        base.backgroundColor = COLORS.error;
        break;
      case 'outline':
        base.backgroundColor = 'transparent';
        base.borderWidth = 1;
        base.borderColor = COLORS.borderStrong;
        break;
      case 'success':
        base.backgroundColor = COLORS.resolved;
        break;
      case 'warning':
        base.backgroundColor = COLORS.pending;
        break;
    }

    return base;
  };

  const getTextStyle = (): TextStyle => {
    const base: TextStyle = {
      fontSize: 11,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    };

    switch (variant) {
      case 'default':
      case 'destructive':
      case 'success':
      case 'warning':
        base.color = '#FFFFFF';
        break;
      case 'secondary':
      case 'outline':
        base.color = COLORS.textPrimary;
        break;
    }

    return base;
  };

  return (
    <View style={[getContainerStyle(), style]}>
      {icon && <View style={{ marginRight: 4 }}>{icon}</View>}
      <Text style={[getTextStyle(), textStyle]}>{label}</Text>
    </View>
  );
};
