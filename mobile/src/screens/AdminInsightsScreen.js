import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';
import colors from '../theme/colors';
import globalStyles from '../theme/globalStyles';

function StatCard({ label, value, subtle }) {
  return (
    <View style={[styles.statCard, subtle && styles.statCardSubtle]}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

export default function AdminInsightsScreen() {
  const [insights, setInsights] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [errorText, setErrorText] = useState('');
  const loadingRef = useRef(false);

  const load = useCallback(async (spinner = true) => {
    if (loadingRef.current) {
      return;
    }

    loadingRef.current = true;

    if (spinner) {
      setRefreshing(true);
    }
    setErrorText('');

    try {
      const response = await api.get('/admin/insights');
      setInsights(response?.data?.data || null);
    } catch (error) {
      const message = error?.response?.data?.error || 'Could not load insurer analytics right now.';
      setErrorText(message);
    } finally {
      loadingRef.current = false;
      if (spinner) {
        setRefreshing(false);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(true);
      const interval = setInterval(() => load(false), 30000);
      return () => clearInterval(interval);
    }, [load])
  );

  const overview = insights?.overview || {};
  const disruptionMix = useMemo(() => insights?.disruption_mix_last_28d || [], [insights]);
  const forecast = useMemo(() => (insights?.next_week_forecast || []).slice(0, 5), [insights]);

  return (
    <SafeAreaView style={globalStyles.screen} edges={['top', 'left', 'right']}>
      <LinearGradient colors={['#08131F', '#10243A', '#16324A']} style={globalStyles.gradientBackground}>
        <ScrollView
          contentContainerStyle={styles.container}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor={colors.accent} />}
        >
          <Text style={styles.title}>Insurer Intelligence</Text>
          <Text style={styles.subtitle}>Loss ratios, fraud controls, and next-week claim prediction</Text>

          {errorText ? (
            <View style={[globalStyles.card, styles.errorCard]}>
              <Text style={styles.errorText}>{errorText}</Text>
            </View>
          ) : null}

          <View style={styles.gridRow}>
            <StatCard label="Premium (active week)" value={`Rs ${Number(overview.premium_collected || 0).toFixed(0)}`} />
            <StatCard label="Payouts (this week)" value={`Rs ${Number(overview.payout_disbursed || 0).toFixed(0)}`} />
          </View>

          <View style={styles.gridRow}>
            <StatCard label="Loss ratio" value={`${Number(overview.loss_ratio_percent || 0).toFixed(2)}%`} subtle />
            <StatCard label="Flagged claims" value={`${Number(overview.flagged_claims || 0)}`} subtle />
          </View>

          <View style={[globalStyles.card, styles.sectionCard]}>
            <Text style={styles.sectionTitle}>Disruption Mix (28d)</Text>
            {disruptionMix.length ? (
              disruptionMix.map((item) => (
                <View key={item.disruption_type} style={styles.rowItem}>
                  <Text style={styles.rowLabel}>{String(item.disruption_type || '').replace(/_/g, ' ')}</Text>
                  <Text style={styles.rowValue}>{item.count}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No disruptions recorded yet.</Text>
            )}
          </View>

          <View style={[globalStyles.card, styles.sectionCard]}>
            <Text style={styles.sectionTitle}>Next Week Forecast</Text>
            {forecast.length ? (
              forecast.map((item) => (
                <View key={item.zone_id} style={styles.forecastItem}>
                  <View>
                    <Text style={styles.zoneName}>{item.zone_name}</Text>
                    <Text style={styles.zoneMeta}>7d: {item.claims_last_7d} | 14d: {item.claims_last_14d}</Text>
                  </View>
                  <View style={styles.forecastRight}>
                    <Text style={styles.forecastClaims}>{item.predicted_claims_next_week.toFixed(2)}</Text>
                    <Text style={styles.forecastPayout}>Rs {item.predicted_payout_next_week.toFixed(0)}</Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>Need more disruption history for forecasting.</Text>
            )}
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
    paddingBottom: 26,
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
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: colors.bgCard,
    padding: 12,
  },
  statCardSubtle: {
    backgroundColor: colors.bgCardSoft,
  },
  statLabel: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 12,
    color: colors.textSecondary,
  },
  statValue: {
    marginTop: 6,
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 19,
    color: colors.accentSoft,
  },
  sectionCard: {
    gap: 8,
  },
  sectionTitle: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 14,
    color: colors.textPrimary,
  },
  rowItem: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.divider,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: colors.bgCardSoft,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowLabel: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 13,
    color: colors.textPrimary,
    textTransform: 'capitalize',
  },
  rowValue: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 13,
    color: colors.accent,
  },
  forecastItem: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.divider,
    paddingHorizontal: 10,
    paddingVertical: 9,
    backgroundColor: colors.bgCardSoft,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  zoneName: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 13,
    color: colors.textPrimary,
  },
  zoneMeta: {
    marginTop: 2,
    fontFamily: 'Outfit_400Regular',
    fontSize: 11,
    color: colors.textMuted,
  },
  forecastRight: {
    alignItems: 'flex-end',
  },
  forecastClaims: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 13,
    color: colors.accentSoft,
  },
  forecastPayout: {
    marginTop: 1,
    fontFamily: 'Outfit_500Medium',
    fontSize: 12,
    color: colors.textSecondary,
  },
  emptyText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 13,
    color: colors.textMuted,
  },
  errorCard: {
    borderColor: 'rgba(241, 111, 126, 0.35)',
  },
  errorText: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 13,
    color: colors.danger,
  },
});
