import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage: error?.message || 'Unexpected runtime error',
    };
  }

  componentDidCatch(error, info) {
    console.error('AppErrorBoundary caught:', error, info);
  }

  reset = async () => {
    try {
      await AsyncStorage.multiRemove(['worker_id', 'zone_id', 'worker_name', 'tier']);
    } catch (_e) {
    }
    this.setState({ hasError: false, errorMessage: '' });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <LinearGradient colors={['#08131F', '#10243A', '#16324A']} style={styles.wrap}>
        <Text style={styles.title}>Kavach recovered from a crash</Text>
        <Text style={styles.sub}>The app did not close, and your session is safe.</Text>
        <View style={styles.box}>
          <Text style={styles.errLabel}>Error details</Text>
          <Text style={styles.errText}>{this.state.errorMessage}</Text>
        </View>
        <TouchableOpacity style={styles.btn} onPress={this.reset}>
          <Text style={styles.btnText}>Reset session and continue</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  title: {
    color: '#F4FAFF',
    fontSize: 22,
    fontFamily: 'Outfit_700Bold',
    textAlign: 'center',
  },
  sub: {
    marginTop: 8,
    color: '#B5CBDD',
    fontSize: 13,
    fontFamily: 'Outfit_400Regular',
    textAlign: 'center',
  },
  box: {
    marginTop: 16,
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(220,240,255,0.2)',
    backgroundColor: 'rgba(10, 25, 40, 0.8)',
    padding: 12,
  },
  errLabel: {
    color: '#98E9C5',
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 12,
  },
  errText: {
    marginTop: 6,
    color: '#F4FAFF',
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 11,
  },
  btn: {
    marginTop: 18,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    backgroundColor: '#40D5A0',
  },
  btnText: {
    color: '#05211D',
    fontFamily: 'Outfit_700Bold',
    fontSize: 13,
  },
});
