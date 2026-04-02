import React, { useEffect, useRef } from 'react';
import { Animated, Text, TouchableOpacity, StyleSheet, View } from 'react-native';
import colors from '../theme/colors';

export default function TierCard({ tier, selected, onPress, popular }) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(scale, {
      toValue: selected ? 1.03 : 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  }, [selected, scale]);

  return (
    <TouchableOpacity style={styles.wrap} onPress={onPress} activeOpacity={0.9}>
      <Animated.View
        style={[
          styles.card,
          selected && styles.selected,
          { transform: [{ scale }] },
        ]}
      >
        {popular ? <View style={styles.badge}><Text style={styles.badgeText}>POPULAR</Text></View> : null}
        <Text style={styles.name}>{tier.name}</Text>
        <Text style={[styles.price, { color: selected ? colors.accent_primary : colors.text_secondary }]}>₹{tier.price}</Text>
        <Text style={styles.week}>/week</Text>
        <Text style={styles.cap}>up to ₹{tier.cap}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, marginHorizontal: 4 },
  card: {
    borderWidth: 1,
    borderColor: colors.glass_border,
    borderRadius: 12,
    padding: 12,
    backgroundColor: colors.glass_bg,
    minHeight: 120,
  },
  selected: {
    borderColor: colors.accent_primary,
    backgroundColor: 'rgba(0,212,170,0.08)',
  },
  badge: {
    alignSelf: 'flex-end',
    backgroundColor: colors.accent_primary,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 4,
  },
  badgeText: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 8,
    color: colors.bg_primary,
  },
  name: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 13,
    color: colors.text_primary,
  },
  price: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 18,
    marginTop: 6,
  },
  week: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 10,
    color: colors.text_secondary,
  },
  cap: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 10,
    color: colors.text_secondary,
    marginTop: 8,
  },
});
