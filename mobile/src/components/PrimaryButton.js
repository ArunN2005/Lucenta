import React, { useRef } from 'react';
import { Animated, Text, TouchableWithoutFeedback, ActivityIndicator, StyleSheet } from 'react-native';
import colors from '../theme/colors';

export default function PrimaryButton({ title, loading, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () => {
    Animated.timing(scale, { toValue: 0.97, duration: 80, useNativeDriver: true }).start();
  };

  const pressOut = () => {
    Animated.timing(scale, { toValue: 1, duration: 80, useNativeDriver: true }).start();
  };

  return (
    <TouchableWithoutFeedback onPress={onPress} onPressIn={pressIn} onPressOut={pressOut} disabled={loading}>
      <Animated.View style={[styles.button, { transform: [{ scale }] }]}>
        {loading ? <ActivityIndicator color={colors.bg_primary} /> : <Text style={styles.text}>{title}</Text>}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.accent_primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: colors.accent_primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  text: {
    color: colors.bg_primary,
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 16,
  },
});
