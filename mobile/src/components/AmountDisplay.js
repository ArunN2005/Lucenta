import React from 'react';
import { Text, StyleSheet } from 'react-native';
import colors from '../theme/colors';

export default function AmountDisplay({ amount, context = 'default', style }) {
  const colorMap = {
    paid: colors.status_paid,
    processing: colors.status_processing,
    flagged: colors.status_flagged,
    disruption: colors.status_disruption,
    default: colors.text_primary,
    accent: colors.accent_primary,
  };

  return <Text style={[styles.amount, { color: colorMap[context] || colorMap.default }, style]}>₹{amount}</Text>;
}

const styles = StyleSheet.create({
  amount: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 18,
  },
});
