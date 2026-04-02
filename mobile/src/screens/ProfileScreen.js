import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';
import colors from '../theme/colors';
import globalStyles from '../theme/globalStyles';

function InfoRow({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || '-'}</Text>
    </View>
  );
}

export default function ProfileScreen({ navigation }) {
  const [worker, setWorker] = useState(null);
  const [policy, setPolicy] = useState(null);
  const [renewing, setRenewing] = useState(false);

  const loadProfile = useCallback(async () => {
    const workerId = await AsyncStorage.getItem('worker_id');
    if (!workerId) {
      setWorker(null);
      setPolicy(null);
      return;
    }

    try {
      const [workerRes, policyRes] = await Promise.all([
        api.get(`/worker/${workerId}`),
        api.get(`/policy/${workerId}`),
      ]);
      setWorker(workerRes?.data?.data || null);
      setPolicy(policyRes?.data?.data || null);
    } catch (_error) {
      Alert.alert('Profile unavailable', 'Could not load profile data from backend.');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  const renewPolicy = async () => {
    if (!worker?.worker_id) {
      return;
    }

    setRenewing(true);
    try {
      await api.post(`/policy/renew/${worker.worker_id}`);
      await loadProfile();
      Alert.alert('Renewed', 'Coverage renewed for next cycle.');
    } catch (error) {
      const message = error?.response?.data?.error || 'Policy renewal failed.';
      Alert.alert('Renew failed', message);
    } finally {
      setRenewing(false);
    }
  };

  const resetSession = async () => {
    await AsyncStorage.multiRemove(['worker_id', 'zone_id', 'worker_name', 'tier']);
    navigation.replace('Onboarding');
  };

  return (
    <SafeAreaView style={globalStyles.screen} edges={['top', 'left', 'right']}>
      <LinearGradient colors={['#08131F', '#10243A', '#16324A']} style={globalStyles.gradientBackground}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={[globalStyles.card, globalStyles.cardShadow]}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{(worker?.name || 'K').slice(0, 1).toUpperCase()}</Text>
            </View>
            <Text style={styles.name}>{worker?.name || 'No active account'}</Text>
            <Text style={styles.phone}>{worker?.phone || 'Add account from onboarding'}</Text>

            <View style={styles.divider} />
            <InfoRow label="Zone" value={worker?.zone_name} />
            <InfoRow label="UPI" value={worker?.upi_id} />
            <InfoRow
              label="Member since"
              value={worker?.created_at ? new Date(worker.created_at).toLocaleDateString() : '-'}
            />
            <InfoRow label="Tenure" value={`${worker?.tenure_weeks || 0} weeks`} />
          </View>

          <View style={[globalStyles.cardSoft, styles.policyCard]}>
            <Text style={styles.policyTitle}>Policy</Text>
            <Text style={styles.policyLine}>
              {String(policy?.tier || 'plus').toUpperCase()} | Rs {policy?.weekly_premium || 0}/week
            </Text>
            <Text style={styles.policyLine}>Coverage Cap: Rs {policy?.adjusted_coverage_cap || 0}</Text>
            <Text style={styles.policyLine}>
              {policy?.week_start || '-'} to {policy?.week_end || '-'}
            </Text>
          </View>

          <TouchableOpacity
            onPress={renewPolicy}
            disabled={renewing}
            style={[styles.primaryButton, renewing && styles.buttonDisabled]}
          >
            <Text style={styles.primaryButtonText}>{renewing ? 'Renewing...' : 'Renew Policy'}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={resetSession} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Reset Account Session</Text>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 26,
    gap: 14,
  },
  avatarCircle: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: colors.chip,
    borderWidth: 1,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  avatarText: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 30,
    color: colors.accentSoft,
  },
  name: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 21,
    color: colors.textPrimary,
  },
  phone: {
    marginTop: 3,
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 12,
    color: colors.textMuted,
  },
  divider: {
    marginVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 5,
  },
  infoLabel: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 13,
    color: colors.textSecondary,
  },
  infoValue: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 13,
    color: colors.textPrimary,
  },
  policyCard: {
    gap: 5,
  },
  policyTitle: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 15,
    color: colors.textPrimary,
  },
  policyLine: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 13,
    color: colors.textSecondary,
  },
  primaryButton: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
  },
  primaryButtonText: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 14,
    color: '#05211D',
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  secondaryButton: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.divider,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgCard,
  },
  secondaryButtonText: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 13,
    color: colors.textSecondary,
  },
});
