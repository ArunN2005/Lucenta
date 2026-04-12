import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../theme/colors';

const statusStyles = {
  paid: { bg: 'rgba(0,212,170,0.18)', text: colors.status_paid, icon: 'checkmark-circle' },
  processing: { bg: 'rgba(245,158,11,0.18)', text: colors.status_processing, icon: 'sync' },
  flagged: { bg: 'rgba(239,68,68,0.18)', text: colors.status_flagged, icon: 'warning' },
  active: { bg: 'rgba(0,212,170,0.18)', text: colors.status_active, icon: null },
  disrupted: { bg: 'rgba(255,107,53,0.18)', text: colors.status_disruption, icon: null },
};

export default function StatusBadge({ status = 'active', label }) {
  const s = statusStyles[status] || statusStyles.active;
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (status === 'processing') {
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    } else {
      spinValue.setValue(0);
      spinValue.stopAnimation();
    }
  }, [status, spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  return (
    <View style={[styles.badge, { backgroundColor: s.bg, flexDirection: 'row', alignItems: 'center' }]}> 
      {s.icon && status === 'processing' && (
        <Animated.View style={{ transform: [{ rotate: spin }], marginRight: 4 }}>
          <Ionicons name={s.icon} size={12} color={s.text} />
        </Animated.View>
      )}
      {s.icon && status === 'paid' && (
        <Ionicons name={s.icon} size={12} color={s.text} style={{ marginRight: 4 }} />
      )}
      <Text style={[styles.text, { color: s.text }]}>{label || (status === 'paid' ? 'PROCESSED' : status.toUpperCase())}</Text>
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
