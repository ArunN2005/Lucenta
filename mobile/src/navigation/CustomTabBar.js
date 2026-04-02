import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../theme/colors';

const icons = {
  Home: 'shield-checkmark',
  Claims: 'document-text',
  Demo: 'flask',
  Profile: 'person',
};

export default function CustomTabBar({ state, descriptors, navigation }) {
  return (
    <View style={styles.container}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({ type: 'tabLongPress', target: route.key });
        };

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            onLongPress={onLongPress}
            style={[styles.tab, focused && styles.tabFocused]}
          >
            <Ionicons
              name={icons[route.name] || 'ellipse'}
              size={19}
              color={focused ? colors.accent : colors.textMuted}
            />
            <Text style={[styles.label, { color: focused ? colors.accent : colors.textMuted }]}>{route.name}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.bgSecondary,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    height: 68,
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 10,
  },
  tab: {
    flex: 1,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  tabFocused: {
    backgroundColor: colors.chip,
  },
  label: {
    marginTop: 4,
    fontFamily: 'Outfit_500Medium',
    fontSize: 11,
  },
});
