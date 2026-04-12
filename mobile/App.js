import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StatusBar, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import {
  useFonts,
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
} from '@expo-google-fonts/outfit';
import { SpaceMono_400Regular } from '@expo-google-fonts/space-mono';
import OnboardingScreen from './src/screens/OnboardingScreen';
import MainTabs from './src/navigation/MainTabs';
import AppErrorBoundary from './src/components/AppErrorBoundary';
import colors from './src/theme/colors';

const Stack = createStackNavigator();

export default function App() {
  const [ready, setReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState('Onboarding');
  const mountedRef = useRef(true);

  const [fontsLoaded] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
    SpaceMono_400Regular,
  });

  useEffect(() => {
    mountedRef.current = true;

    if (fontsLoaded && mountedRef.current) {
      // Always start in onboarding for deterministic demo flow and to avoid stale-session launch issues.
      setInitialRoute('Onboarding');
      setReady(true);
    }

    return () => {
      mountedRef.current = false;
    };
  }, [fontsLoaded]);

  if (!fontsLoaded || !ready) {
    return (
      <LinearGradient
        colors={['#0D1B2A', '#102A43', '#1B4332']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.bootWrap}
      >
        <StatusBar barStyle="light-content" />
        <Text style={styles.bootTitle}>Kavach</Text>
        <Text style={styles.bootSub}>Loading your protection desk</Text>
      </LinearGradient>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <AppErrorBoundary>
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName={initialRoute}
            screenOptions={{
              headerShown: false,
              cardStyle: { backgroundColor: colors.bgPrimary },
            }}
          >
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="MainTabs" component={MainTabs} />
          </Stack.Navigator>
        </NavigationContainer>
      </AppErrorBoundary>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  bootWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bootTitle: {
    color: '#F6FAFF',
    fontFamily: 'Outfit_700Bold',
    fontSize: 36,
    letterSpacing: 0.8,
  },
  bootSub: {
    marginTop: 8,
    color: '#D5E7F7',
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
  },
});
