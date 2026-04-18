import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';
import colors from '../theme/colors';
import globalStyles from '../theme/globalStyles';

function riskMeta(multiplier) {
  const m = Number(multiplier || 1);
  if (m >= 1.1) {
    return { label: 'Low risk', color: colors.accent };
  }
  if (m >= 0.9) {
    return { label: 'Medium risk', color: colors.warn };
  }
  return { label: 'High risk', color: colors.danger };
}

export default function DashboardScreen({ navigation }) {
  const [worker, setWorker] = useState(null);
  const [policy, setPolicy] = useState(null);
  const [claims, setClaims] = useState([]);
  const [activeDisruptions, setActiveDisruptions] = useState([]);
  const [liveContext, setLiveContext] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [errorText, setErrorText] = useState('');
  const loadingRef = useRef(false);

  const loadData = useCallback(async (showSpinner = true) => {
    if (loadingRef.current) {
      return;
    }

    loadingRef.current = true;

    if (showSpinner) {
      setRefreshing(true);
    }
    setErrorText('');

    try {
      const workerId = await AsyncStorage.getItem('worker_id');
      if (!workerId) {
        setErrorText('No worker session found. Please activate coverage again.');
        return;
      }

      const [workerRes, policyRes, claimsRes, disruptionRes] = await Promise.all([
        api.get(`/worker/${workerId}`),
        api.get(`/policy/${workerId}`),
        api.get(`/claims/${workerId}`),
        api.get('/disruptions/active'),
      ]);

      setWorker(workerRes?.data?.data || null);
      setPolicy(policyRes?.data?.data || null);
      setClaims(claimsRes?.data?.data || []);
      setActiveDisruptions(disruptionRes?.data?.data || []);

      const zoneId = workerRes?.data?.data?.zone_id;
      if (zoneId) {
        try {
          const liveRes = await api.get(`/zones/${zoneId}/live-context`);
          setLiveContext(liveRes?.data?.data || null);
        } catch (_err) {
          setLiveContext(null);
        }
      }
    } catch (error) {
      const message =
        error?.response?.data?.error ||
        'Could not refresh dashboard. Check backend and network connectivity.';
      setErrorText(message);
    } finally {
      loadingRef.current = false;
      if (showSpinner) {
        setRefreshing(false);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData(true);

      const interval = setInterval(() => {
        loadData(false);
      }, 30000);

      return () => clearInterval(interval);
    }, [loadData])
  );

  const disruption = useMemo(
    () => activeDisruptions.find((item) => item.zone_id === worker?.zone_id),
    [activeDisruptions, worker]
  );

  const risk = riskMeta(policy?.risk_multiplier);
  const latestClaims = claims.slice(0, 3);
  const protectedThisWeek = Number(worker?.earnings_protected_this_week || 0);
  const coverageCap = Number(policy?.adjusted_coverage_cap || 0);
  const activeCoverageLeft = Math.max(0, coverageCap - protectedThisWeek);

  return (
    <SafeAreaView style={globalStyles.screen} edges={['top', 'left', 'right']}>
      <LinearGradient colors={['#08131F', '#10243A', '#16324A']} style={globalStyles.gradientBackground}>
        <ScrollView
          contentContainerStyle={styles.container}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} tintColor={colors.accent} />}
        >
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.eyebrow}>Coverage Control</Text>
              <Text style={styles.title}>Welcome, {worker?.name || 'Partner'}</Text>
            </View>
            <View style={[styles.statusChip, disruption && styles.statusChipWarn]}>
              <Text style={styles.statusChipText}>{disruption ? 'Zone disrupted' : 'Coverage active'}</Text>
            </View>
          </View>

          {errorText ? (
            <View style={[globalStyles.card, styles.errorCard]}>
              <Text style={styles.errorText}>{errorText}</Text>
            </View>
          ) : null}

          <View style={[globalStyles.card, globalStyles.cardShadow]}>
            <Text style={styles.cardTitle}>Current Plan</Text>
            <Text style={styles.planName}>{String(policy?.tier || 'plus').toUpperCase()}</Text>
            <View style={styles.planRow}>
              <Text style={styles.metaLabel}>Weekly premium</Text>
              <Text style={styles.metaValue}>Rs {policy?.weekly_premium || 0}</Text>
            </View>
            <View style={styles.planRow}>
              <Text style={styles.metaLabel}>Coverage cap</Text>
              <Text style={styles.metaValue}>Rs {policy?.adjusted_coverage_cap || 0}</Text>
            </View>
            <View style={styles.planRow}>
              <Text style={styles.metaLabel}>Risk score</Text>
              <Text style={[styles.metaValue, { color: risk.color }]}>{risk.label}</Text>
            </View>
          </View>

          <View style={[globalStyles.cardSoft, styles.gridCard]}>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Zone</Text>
              <Text style={styles.gridValue}>{worker?.zone_name || '-'}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Tenure</Text>
              <Text style={styles.gridValue}>{worker?.tenure_weeks || 0} weeks</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Claims</Text>
              <Text style={styles.gridValue}>{claims.length}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Days left</Text>
              <Text style={styles.gridValue}>{policy?.days_remaining || 0}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Earnings protected</Text>
              <Text style={styles.gridValue}>Rs {protectedThisWeek.toFixed(0)}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Active weekly coverage</Text>
              <Text style={styles.gridValue}>Rs {activeCoverageLeft.toFixed(0)}</Text>
            </View>
          </View>

          <View style={[globalStyles.card, styles.liveCard]}>
            <Text style={styles.cardTitle}>Live Zone Context</Text>
            <View style={styles.liveGrid}>
              <View style={styles.liveItem}>
                <Text style={styles.gridLabel}>Weather</Text>
                <Text style={styles.gridValue}>{liveContext?.weather?.condition || 'Unknown'}</Text>
              </View>
              <View style={styles.liveItem}>
                <Text style={styles.gridLabel}>Temp</Text>
                <Text style={styles.gridValue}>{liveContext?.weather?.temp_c ?? '-'} C</Text>
              </View>
              <View style={styles.liveItem}>
                <Text style={styles.gridLabel}>AQI</Text>
                <Text style={styles.gridValue}>{liveContext?.weather?.aqi ?? '-'}</Text>
              </View>
              <View style={styles.liveItem}>
                <Text style={styles.gridLabel}>Active strikes</Text>
                <Text style={styles.gridValue}>{liveContext?.active_strikes ?? 0}</Text>
              </View>
            </View>

            <View style={styles.trafficBox}>
              <View style={styles.trafficHeader}>
                <Text style={styles.trafficTitle}>Traffic</Text>
                <View style={styles.disabledPill}>
                  <Text style={styles.disabledPillText}>Disabled</Text>
                </View>
              </View>
              <Text style={styles.trafficMessage}>{liveContext?.traffic?.message || 'Currently inside building'}</Text>
              <Text style={styles.trafficMeta}>
                Road load index: {liveContext?.traffic?.road_load_index ?? '--'}
              </Text>
              <Text style={styles.trafficMeta}>
                Lat/Lng: {liveContext?.latitude ?? worker?.lat ?? '-'}, {liveContext?.longitude ?? worker?.lng ?? '-'}
              </Text>
            </View>
          </View>

          <View style={[globalStyles.card, styles.claimsCard]}>
            <View style={styles.claimHeader}>
              <Text style={styles.cardTitle}>Recent Claims</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Claims')}>
                <Text style={styles.linkText}>View all</Text>
              </TouchableOpacity>
            </View>

            {latestClaims.length > 0 ? (
              latestClaims.map((claim) => (
                <View key={claim.claim_id} style={styles.claimRow}>
                  <View style={styles.claimIconWrap}>
                    <Ionicons name="cash" size={16} color={colors.accentSoft} />
                  </View>
                  <View style={styles.claimTextWrap}>
                    <Text style={styles.claimTitle}>{claim.event_type || 'Auto claim'}</Text>
                    <Text style={styles.claimMeta}>{claim.status || 'processing'}</Text>
                  </View>
                  <Text style={styles.claimAmount}>Rs {claim.payout_amount || 0}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No claims generated yet.</Text>
            )}
          </View>

          <TouchableOpacity style={styles.demoButton} onPress={() => navigation.navigate('Demo')}>
            <Ionicons name="flask" size={17} color="#05211D" />
            <Text style={styles.demoButtonText}>Open demo controls</Text>
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
    paddingBottom: 28,
    gap: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eyebrow: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 11,
    color: colors.textMuted,
  },
  title: {
    marginTop: 4,
    fontFamily: 'Outfit_700Bold',
    fontSize: 22,
    color: colors.textPrimary,
  },
  statusChip: {
    borderRadius: 999,
    backgroundColor: colors.chip,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusChipWarn: {
    backgroundColor: 'rgba(245, 159, 98, 0.25)',
  },
  statusChipText: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 11,
    color: colors.textPrimary,
  },
  cardTitle: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 15,
    color: colors.textPrimary,
  },
  planName: {
    marginTop: 5,
    marginBottom: 8,
    fontFamily: 'Outfit_700Bold',
    fontSize: 24,
    color: colors.accentSoft,
  },
  planRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  metaLabel: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 13,
    color: colors.textSecondary,
  },
  metaValue: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 13,
    color: colors.textPrimary,
  },
  gridCard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48%',
    marginVertical: 5,
  },
  gridLabel: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 12,
    color: colors.textSecondary,
  },
  gridValue: {
    marginTop: 3,
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 15,
    color: colors.textPrimary,
  },
  claimsCard: {
    marginBottom: 2,
  },
  claimHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  linkText: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 12,
    color: colors.accentSoft,
  },
  claimRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: 12,
    padding: 10,
    backgroundColor: colors.bgCardSoft,
  },
  claimIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.overlay,
  },
  claimTextWrap: {
    flex: 1,
    marginLeft: 10,
  },
  claimTitle: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 13,
    color: colors.textPrimary,
  },
  claimMeta: {
    marginTop: 2,
    fontFamily: 'Outfit_400Regular',
    fontSize: 12,
    color: colors.textMuted,
  },
  claimAmount: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 13,
    color: colors.accentSoft,
  },
  emptyText: {
    marginTop: 6,
    fontFamily: 'Outfit_500Medium',
    fontSize: 13,
    color: colors.textSecondary,
  },
  demoButton: {
    marginTop: 2,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  demoButtonText: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 14,
    color: '#05211D',
  },
  errorCard: {
    borderColor: colors.danger,
    backgroundColor: 'rgba(241, 111, 126, 0.2)',
  },
  errorText: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 13,
    color: colors.textPrimary,
  },
  liveCard: {
    marginBottom: 2,
  },
  liveGrid: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  liveItem: {
    width: '48%',
    marginVertical: 4,
  },
  trafficBox: {
    marginTop: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: colors.bgCardSoft,
    padding: 10,
  },
  trafficHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  trafficTitle: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 13,
    color: colors.textPrimary,
  },
  disabledPill: {
    borderRadius: 999,
    backgroundColor: 'rgba(245, 159, 98, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  disabledPillText: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 10,
    color: colors.warn,
  },
  trafficMessage: {
    marginTop: 6,
    fontFamily: 'Outfit_500Medium',
    fontSize: 12,
    color: colors.textSecondary,
  },
  trafficMeta: {
    marginTop: 4,
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 11,
    color: colors.textMuted,
  },
});
