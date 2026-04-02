import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import colors from '../theme/colors';
import globalStyles from '../theme/globalStyles';
import api from '../services/api';

const FILTERS = ['all', 'paid', 'processing', 'flagged'];

export default function ClaimsScreen() {
  const [claims, setClaims] = useState([]);
  const [filter, setFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const loadClaims = useCallback(async () => {
    setRefreshing(true);
    try {
      const workerId = await AsyncStorage.getItem('worker_id');
      if (!workerId) {
        setClaims([]);
        return;
      }

      const response = await api.get(`/claims/${workerId}`);
      setClaims(response?.data?.data || []);
    } catch (error) {
      const message =
        error?.response?.data?.error || 'Could not load claims. Please check API connectivity.';
      Alert.alert('Claims unavailable', message);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadClaims();
    }, [loadClaims])
  );

  const filteredClaims = useMemo(() => {
    if (filter === 'all') {
      return claims;
    }
    return claims.filter((claim) => claim.status === filter);
  }, [claims, filter]);

  const renderClaim = ({ item }) => {
    const tone =
      item.status === 'paid'
        ? colors.accent
        : item.status === 'processing'
        ? colors.warn
        : item.status === 'flagged'
        ? colors.danger
        : colors.info;

    return (
      <View style={styles.claimRow}>
        <View style={[styles.dot, { backgroundColor: tone }]} />
        <View style={styles.claimTextWrap}>
          <Text style={styles.claimTitle}>{item.event_type || 'Auto claim'}</Text>
          <Text style={styles.claimMeta}>
            {item.status || 'processing'} | {item.triggered_at ? new Date(item.triggered_at).toLocaleString() : '-'}
          </Text>
        </View>
        <Text style={styles.claimAmount}>Rs {item.payout_amount || 0}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={globalStyles.screen} edges={['top', 'left', 'right']}>
      <LinearGradient colors={['#08131F', '#10243A', '#16324A']} style={globalStyles.gradientBackground}>
        <View style={styles.container}>
          <Text style={styles.title}>Claims</Text>
          <Text style={styles.subtitle}>Automatically generated payouts</Text>

          <View style={styles.filterRow}>
            {FILTERS.map((item) => {
              const active = item === filter;
              return (
                <TouchableOpacity
                  key={item}
                  onPress={() => setFilter(item)}
                  style={[styles.filterPill, active && styles.filterPillActive]}
                >
                  <Text style={[styles.filterText, active && styles.filterTextActive]}>{item}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <FlatList
            data={filteredClaims}
            keyExtractor={(item) => item.claim_id}
            renderItem={renderClaim}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={loadClaims} tintColor={colors.accent} />
            }
            ListEmptyComponent={<Text style={styles.emptyText}>No claims in this filter yet.</Text>}
          />
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 18,
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
  filterRow: {
    marginTop: 12,
    marginBottom: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: colors.bgCardSoft,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  filterPillActive: {
    backgroundColor: colors.chip,
    borderColor: colors.accent,
  },
  filterText: {
    textTransform: 'uppercase',
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 11,
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: colors.accentSoft,
  },
  listContent: {
    paddingBottom: 24,
  },
  claimRow: {
    marginTop: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: colors.bgCard,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    marginRight: 10,
  },
  claimTextWrap: {
    flex: 1,
    paddingRight: 8,
  },
  claimTitle: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 13,
    color: colors.textPrimary,
  },
  claimMeta: {
    marginTop: 3,
    fontFamily: 'Outfit_400Regular',
    fontSize: 12,
    color: colors.textMuted,
  },
  claimAmount: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 12,
    color: colors.accentSoft,
  },
  emptyText: {
    marginTop: 18,
    fontFamily: 'Outfit_500Medium',
    fontSize: 14,
    color: colors.textSecondary,
  },
});
