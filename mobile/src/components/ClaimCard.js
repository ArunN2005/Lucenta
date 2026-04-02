import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from './GlassCard';
import StatusBadge from './StatusBadge';
import AmountDisplay from './AmountDisplay';
import colors from '../theme/colors';

function iconMeta(type) {
  if (type === 'heavy_rain') return { icon: 'rainy', color: '#4488FF', label: 'Heavy Rain' };
  if (type === 'extreme_heat') return { icon: 'sunny', color: colors.status_disruption, label: 'Extreme Heat' };
  return { icon: 'warning', color: colors.status_processing, label: 'Platform Outage' };
}

export default function ClaimCard({ claim, zoneName, index = 0, compact = false }) {
  const a = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(a, {
      toValue: 1,
      duration: 350,
      delay: index * 80,
      useNativeDriver: true,
    }).start();
  }, [a, index]);

  const meta = iconMeta(claim.disruption_type);

  return (
    <Animated.View style={{ opacity: a, transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }}>
      <GlassCard style={styles.card}>
        <View style={styles.rowTop}>
          <View style={styles.iconCircle}>
            <Ionicons name={meta.icon} size={18} color={meta.color} />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.type}>{meta.label}</Text>
            <Text style={styles.sub}>{zoneName || 'Zone monitored'}</Text>
          </View>
          <AmountDisplay amount={claim.payout_amount} context={claim.status} />
        </View>
        {!compact ? <View style={styles.divider} /> : null}
        <View style={styles.bottomRow}>
          <View>
            <Text style={styles.label}>Hours disrupted</Text>
            <Text style={styles.value}>{claim.hours_disrupted}</Text>
          </View>
          <View>
            <Text style={styles.label}>Triggered at</Text>
            <Text style={styles.value}>{new Date(claim.created_at).toLocaleString()}</Text>
          </View>
          <View>
            <Text style={styles.label}>Status</Text>
            <StatusBadge status={claim.status} label={claim.status} />
          </View>
        </View>
        {claim.status === 'paid' && claim.razorpay_payout_id ? (
          <Text style={styles.payoutId}>Payout ID: {String(claim.razorpay_payout_id).slice(0, 16)}...</Text>
        ) : null}
      </GlassCard>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.glass_bg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.glass_border,
  },
  type: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 15,
    color: colors.text_primary,
  },
  sub: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 12,
    color: colors.text_secondary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: 10,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  label: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 10,
    color: colors.text_disabled,
  },
  value: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 12,
    color: colors.text_primary,
    marginTop: 2,
  },
  payoutId: {
    marginTop: 10,
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 10,
    color: colors.text_disabled,
  },
});
