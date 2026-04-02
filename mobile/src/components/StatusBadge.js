import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import colors from '../theme/colors';

const statusStyles = {
  paid: { bg: 'rgba(0,212,170,0.18)', text: colors.status_paid },
  processing: { bg: 'rgba(245,158,11,0.18)', text: colors.status_processing },
  flagged: { bg: 'rgba(239,68,68,0.18)', text: colors.status_flagged },
  active: { bg: 'rgba(0,212,170,0.18)', text: colors.status_active },
  disrupted: { bg: 'rgba(255,107,53,0.18)', text: colors.status_disruption },
};

export default function StatusBadge({ status = 'active', label }) {
  const s = statusStyles[status] || statusStyles.active;
  return (
    <View style={[styles.badge, { backgroundColor: s.bg }]}> 
      <Text style={[styles.text, { color: s.text }]}>{label || status.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignSelf: 'flex-start',
  },
  text: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 11,
  },
});
