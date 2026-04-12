import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Modal,
  TouchableOpacity,
  Pressable,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../theme/colors';
import globalStyles from '../theme/globalStyles';
import api from '../services/api';

export default function ClaimsScreen() {
  const [claims, setClaims] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [workerName, setWorkerName] = useState('Delivery Partner');
  const [selectedProcessedClaim, setSelectedProcessedClaim] = useState(null);

  const loadClaims = useCallback(async (showSpinner = false) => {
    if (showSpinner) {
      setRefreshing(true);
    }

    try {
      const workerId = await AsyncStorage.getItem('worker_id');
      const savedName = await AsyncStorage.getItem('worker_name');
      if (savedName) {
        setWorkerName(savedName);
      }

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
      if (showSpinner) {
        setRefreshing(false);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadClaims(true);

      // Poll while the screen is focused so users can see status move from processing to processed.
      const interval = setInterval(() => {
        loadClaims(false);
      }, 2000);

      return () => clearInterval(interval);
    }, [loadClaims])
  );

  const processingClaims = claims.filter((claim) => claim.status === 'processing');
  const processedClaims = claims.filter((claim) => claim.status === 'paid' || claim.status === 'processed');
  const otherClaims = claims.filter(
    (claim) => claim.status !== 'processing' && claim.status !== 'paid' && claim.status !== 'processed'
  );

  const renderClaimRow = (item) => {
    const isProcessing = item.status === 'processing';
    const isProcessed = item.status === 'paid' || item.status === 'processed';

    const onPress = () => {
      if (isProcessed) {
        setSelectedProcessedClaim(item);
      }
    };

    return (
      <TouchableOpacity
        key={item.claim_id}
        style={styles.claimRow}
        disabled={!isProcessed}
        activeOpacity={isProcessed ? 0.82 : 1}
        onPress={onPress}
      >
        <View style={styles.claimTextWrap}>
          <Text style={styles.claimTitle}>{item.disruption_type || 'Auto claim'}</Text>
          <Text style={styles.claimMeta}>
            {item.created_at ? new Date(item.created_at).toLocaleString() : '-'}
          </Text>
        </View>
        <Text style={styles.claimAmount}>Rs {item.payout_amount || 0}</Text>
        <View style={styles.statusWrap}>
          {isProcessing ? <ActivityIndicator size="small" color={colors.warn} /> : null}
          {isProcessed ? <Ionicons name="checkmark-circle" size={16} color={colors.accent} /> : null}
          {!isProcessing && !isProcessed ? <Ionicons name="alert-circle" size={16} color={colors.info} /> : null}
          <Text style={styles.statusText}>
            {isProcessing ? 'PROCESSING' : isProcessed ? 'PROCESSED' : String(item.status || 'UNKNOWN').toUpperCase()}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const shareReceipt = async () => {
    if (!selectedProcessedClaim) {
      return;
    }
    const txId = selectedProcessedClaim.razorpay_payout_id || selectedProcessedClaim.claim_id;
    const when = new Date(selectedProcessedClaim.paid_at || selectedProcessedClaim.created_at).toLocaleString();
    try {
      await Share.share({
        message:
          `Kavach payout receipt\n` +
          `Amount: Rs ${selectedProcessedClaim.payout_amount || 0}\n` +
          `Paid to: ${workerName}\n` +
          `Time: ${when}\n` +
          `UPI transaction ID: ${txId}`,
      });
    } catch (_e) {
      Alert.alert('Share failed', 'Could not open share sheet.');
    }
  };

  const renderSection = (title, data, emptyMessage) => {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {data.length ? data.map((item) => renderClaimRow(item)) : <Text style={styles.emptyText}>{emptyMessage}</Text>}
      </View>
    );
  };

  return (
    <SafeAreaView style={globalStyles.screen} edges={['top', 'left', 'right']}>
      <LinearGradient colors={['#08131F', '#10243A', '#16324A']} style={globalStyles.gradientBackground}>
        <View style={styles.container}>
          <Text style={styles.title}>Claims</Text>
          <Text style={styles.subtitle}>Auto-payout status updates in real time</Text>

          <ScrollView
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => loadClaims(true)}
                tintColor={colors.accent}
              />
            }
          >
            {renderSection('Processing', processingClaims, 'No claims are processing right now.')}
            {renderSection('Processed', processedClaims, 'No claims have been processed yet.')}
            {otherClaims.length ? renderSection('Other', otherClaims, '') : null}
          </ScrollView>

          <Modal
            visible={!!selectedProcessedClaim}
            transparent
            animationType="fade"
            onRequestClose={() => setSelectedProcessedClaim(null)}
          >
            <View style={styles.modalBackdrop}>
              <Pressable style={styles.modalDismissLayer} onPress={() => setSelectedProcessedClaim(null)} />
              <View style={styles.receiptCard}>
                <View style={styles.receiptTickWrap}>
                  <Ionicons name="checkmark" size={42} color="#FFFFFF" />
                </View>
                <Text style={styles.receiptAmount}>Rs {selectedProcessedClaim?.payout_amount || 0}</Text>
                <Text style={styles.receiptPaidTo}>Paid to {workerName}</Text>
                <Text style={styles.receiptSource}>with Kavach payouts</Text>

                <Text style={styles.receiptDate}>
                  {selectedProcessedClaim
                    ? new Date(selectedProcessedClaim.paid_at || selectedProcessedClaim.created_at).toLocaleString()
                    : '-'}
                </Text>
                <Text style={styles.receiptTxn}>
                  UPI transaction ID: {selectedProcessedClaim?.razorpay_payout_id || selectedProcessedClaim?.claim_id}
                </Text>

                <View style={styles.receiptActions}>
                  <TouchableOpacity style={styles.shareBtn} onPress={shareReceipt}>
                    <Ionicons name="share-social-outline" size={16} color={colors.accentSoft} />
                    <Text style={styles.shareBtnText}>Share receipt</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedProcessedClaim(null)}>
                    <Text style={styles.closeBtnText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
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
  listContent: {
    paddingBottom: 24,
    paddingTop: 8,
  },
  section: {
    marginTop: 12,
  },
  sectionTitle: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
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
  claimTextWrap: {
    flex: 1,
    paddingRight: 8,
  },
  claimTitle: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 13,
    color: colors.textPrimary,
    textTransform: 'capitalize',
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
    marginRight: 10,
  },
  statusWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 110,
    justifyContent: 'flex-end',
  },
  statusText: {
    marginLeft: 6,
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 11,
    color: colors.textPrimary,
  },
  emptyText: {
    marginTop: 4,
    fontFamily: 'Outfit_500Medium',
    fontSize: 13,
    color: colors.textSecondary,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(7, 15, 25, 0.55)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalDismissLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  receiptCard: {
    backgroundColor: '#0C1B2A',
    borderRadius: 22,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(152, 233, 197, 0.3)',
    shadowColor: '#051119',
    shadowOpacity: 0.28,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  receiptTickWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  receiptAmount: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 42,
    color: colors.accentSoft,
  },
  receiptPaidTo: {
    marginTop: 6,
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 21,
    color: colors.textPrimary,
  },
  receiptSource: {
    marginTop: 2,
    fontFamily: 'Outfit_500Medium',
    fontSize: 13,
    color: colors.textSecondary,
  },
  receiptDate: {
    marginTop: 18,
    fontFamily: 'Outfit_500Medium',
    fontSize: 12,
    color: colors.textSecondary,
  },
  receiptTxn: {
    marginTop: 6,
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
  },
  receiptActions: {
    marginTop: 22,
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    gap: 10,
  },
  shareBtn: {
    flex: 1,
    minHeight: 42,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(152, 233, 197, 0.5)',
    backgroundColor: 'rgba(64, 213, 160, 0.12)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareBtnText: {
    marginLeft: 6,
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 14,
    color: colors.accentSoft,
  },
  closeBtn: {
    minWidth: 108,
    minHeight: 42,
    borderRadius: 22,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  closeBtnText: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 14,
    color: '#05211D',
  },
});
