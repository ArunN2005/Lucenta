import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import colors from '../theme/colors';
import globalStyles from '../theme/globalStyles';

export default function DemoPanelScreen() {
  const [zones, setZones] = useState([]);
  const [selectedZoneId, setSelectedZoneId] = useState('');
  const [nextRunSeconds, setNextRunSeconds] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const selectedZone = useMemo(
    () => zones.find((item) => item.zone_id === selectedZoneId),
    [zones, selectedZoneId]
  );

  const loadState = async () => {
    setRefreshing(true);
    try {
      const [zonesRes, statusRes] = await Promise.all([
        api.get('/zones'),
        api.get('/demo/trigger-status').catch(() => null),
      ]);

      const zoneList = zonesRes?.data?.data || [];
      setZones(zoneList);
      if (zoneList.length > 0 && !zoneList.some((z) => z.zone_id === selectedZoneId)) {
        setSelectedZoneId(zoneList[0].zone_id);
      }

      setNextRunSeconds(statusRes?.data?.data?.next_run_in_seconds ?? null);
    } catch (error) {
      const message =
        error?.response?.data?.error || 'Unable to load demo controls. Check backend connection.';
      Alert.alert('Demo unavailable', message);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadState();
  }, []);

  useEffect(() => {
    const timer = setInterval(async () => {
      try {
        const statusRes = await api.get('/demo/trigger-status');
        setNextRunSeconds(statusRes?.data?.data?.next_run_in_seconds ?? null);
      } catch (_error) {
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const runTrigger = async (type) => {
    if (!selectedZoneId) {
      Alert.alert('Select zone', 'Choose a zone before running a demo trigger.');
      return;
    }

    const endpoint =
      type === 'rain' ? 'trigger-rain' : type === 'heat' ? 'trigger-heat' : 'trigger-outage';

    try {
      const result = await api.post(`/demo/${endpoint}/${selectedZoneId}`);
      Alert.alert('Scenario applied', result?.data?.data?.message || 'Trigger was applied.');
    } catch (error) {
      const message = error?.response?.data?.error || 'Unable to apply this scenario.';
      Alert.alert('Action failed', message);
    }
  };

  const forceEngineRun = async () => {
    try {
      await api.post('/demo/force-trigger-check');
      Alert.alert('Done', 'Trigger engine check executed.');
      setNextRunSeconds(300);
    } catch (error) {
      const message = error?.response?.data?.error || 'Unable to execute engine check.';
      Alert.alert('Failed', message);
    }
  };

  const resetZone = async () => {
    if (!selectedZoneId) {
      return;
    }

    try {
      const result = await api.post(`/demo/reset/${selectedZoneId}`);
      Alert.alert('Zone reset', result?.data?.data?.message || 'Zone metrics reset.');
    } catch (error) {
      const message = error?.response?.data?.error || 'Could not reset selected zone.';
      Alert.alert('Reset failed', message);
    }
  };

  const timerText =
    typeof nextRunSeconds === 'number'
      ? `${Math.floor(nextRunSeconds / 60)}m ${String(nextRunSeconds % 60).padStart(2, '0')}s`
      : '--';

  return (
    <SafeAreaView style={globalStyles.screen} edges={['top', 'left', 'right']}>
      <LinearGradient colors={['#08131F', '#10243A', '#16324A']} style={globalStyles.gradientBackground}>
        <ScrollView
          contentContainerStyle={styles.container}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadState} tintColor={colors.accent} />}
        >
          <Text style={styles.title}>Demo Lab</Text>
          <Text style={styles.subtitle}>Manual trigger controls for testing payout flows</Text>

          <View style={[globalStyles.card, styles.zoneCard]}>
            <Text style={styles.sectionTitle}>Select Zone</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.zoneRow}>
              {zones.map((zone) => {
                const active = zone.zone_id === selectedZoneId;
                return (
                  <TouchableOpacity
                    key={zone.zone_id}
                    onPress={() => setSelectedZoneId(zone.zone_id)}
                    style={[styles.zonePill, active && styles.zonePillActive]}
                  >
                    <Text style={[styles.zoneText, active && styles.zoneTextActive]}>{zone.zone_name}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <Text style={styles.selectedZoneText}>{selectedZone?.zone_name || 'No zone selected'}</Text>
          </View>

          <View style={[globalStyles.cardSoft, styles.actionGroup]}>
            <Text style={styles.sectionTitle}>Trigger Scenarios</Text>

            <TouchableOpacity style={[styles.actionButton, styles.rain]} onPress={() => runTrigger('rain')}>
              <Ionicons name="rainy" size={16} color={colors.info} />
              <Text style={styles.actionText}>Trigger Heavy Rain</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionButton, styles.heat]} onPress={() => runTrigger('heat')}>
              <Ionicons name="sunny" size={16} color={colors.warn} />
              <Text style={styles.actionText}>Trigger Extreme Heat</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionButton, styles.outage]} onPress={() => runTrigger('outage')}>
              <Ionicons name="warning" size={16} color={colors.danger} />
              <Text style={styles.actionText}>Trigger Platform Outage</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryAction} onPress={resetZone}>
              <Text style={styles.secondaryActionText}>Reset Selected Zone</Text>
            </TouchableOpacity>
          </View>

          <View style={[globalStyles.card, styles.engineCard]}>
            <Text style={styles.sectionTitle}>Trigger Engine</Text>
            <Text style={styles.timerText}>Next run in {timerText}</Text>
            <TouchableOpacity style={styles.primaryAction} onPress={forceEngineRun}>
              <Text style={styles.primaryActionText}>Force check now</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 24,
    gap: 14,
  },
  title: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 24,
    color: colors.textPrimary,
  },
  subtitle: {
    marginTop: 4,
    fontFamily: 'Outfit_400Regular',
    fontSize: 13,
    color: colors.textSecondary,
  },
  zoneCard: {
    marginTop: 8,
  },
  sectionTitle: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 14,
    color: colors.textPrimary,
  },
  zoneRow: {
    marginTop: 10,
    paddingBottom: 2,
    gap: 8,
  },
  zonePill: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.bgCardSoft,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  zonePillActive: {
    borderColor: colors.accent,
    backgroundColor: colors.chip,
  },
  zoneText: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 12,
    color: colors.textSecondary,
  },
  zoneTextActive: {
    color: colors.accentSoft,
  },
  selectedZoneText: {
    marginTop: 10,
    fontFamily: 'Outfit_500Medium',
    fontSize: 13,
    color: colors.textMuted,
  },
  actionGroup: {
    gap: 10,
  },
  actionButton: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  rain: {
    backgroundColor: 'rgba(101, 184, 255, 0.12)',
    borderColor: 'rgba(101, 184, 255, 0.35)',
  },
  heat: {
    backgroundColor: 'rgba(245, 159, 98, 0.13)',
    borderColor: 'rgba(245, 159, 98, 0.35)',
  },
  outage: {
    backgroundColor: 'rgba(241, 111, 126, 0.13)',
    borderColor: 'rgba(241, 111, 126, 0.35)',
  },
  actionText: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 13,
    color: colors.textPrimary,
  },
  secondaryAction: {
    marginTop: 2,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.divider,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgCard,
  },
  secondaryActionText: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 13,
    color: colors.textSecondary,
  },
  engineCard: {
    gap: 10,
  },
  timerText: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 22,
    color: colors.accentSoft,
  },
  primaryAction: {
    height: 46,
    borderRadius: 12,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionText: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 14,
    color: '#05211D',
  },
});
