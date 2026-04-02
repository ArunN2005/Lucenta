import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import colors from '../theme/colors';

export default function GlassCard({ children, style, intensity = 20 }) {
  return (
    <View style={[styles.glassWrapper, style]}>
      <BlurView intensity={intensity} tint="dark" style={styles.blur}>
        <View style={styles.glassInner}>{children}</View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  glassWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.glass_border,
    backgroundColor: colors.glass_highlight,
  },
  blur: {
    padding: 20,
  },
  glassInner: {
    backgroundColor: colors.glass_bg,
  },
});
