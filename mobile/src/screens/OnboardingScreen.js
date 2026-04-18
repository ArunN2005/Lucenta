import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RazorpayCheckout from 'react-native-razorpay';
import Constants from 'expo-constants';
import api from '../services/api';
import colors from '../theme/colors';
import globalStyles from '../theme/globalStyles';

const TIERS = [
  { key: 'basic', name: 'Basic', premium: 29, cap: 800 },
  { key: 'plus', name: 'Plus', premium: 49, cap: 1500 },
  { key: 'max', name: 'Max', premium: 79, cap: 2500 },
];

const COMMERCE_APPS = ['Swiggy', 'Blinkit', 'Instamart', 'Zepto', 'Zomato'];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function Field({ label, value, onChangeText, placeholder, keyboardType = 'default' }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        keyboardType={keyboardType}
        style={styles.input}
      />
    </View>
  );
}

export default function OnboardingScreen({ navigation }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [upiId, setUpiId] = useState('');
  const [tier, setTier] = useState('plus');
  const [commerceApp, setCommerceApp] = useState('');
  const [userCode, setUserCode] = useState('');
  const [codeValidated, setCodeValidated] = useState(false);
  const [validatingCode, setValidatingCode] = useState(false);
  const [zones, setZones] = useState([]);
  const [zoneId, setZoneId] = useState('');
  const [loadingZones, setLoadingZones] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activationStage, setActivationStage] = useState('idle');

  const selectedTier = useMemo(() => TIERS.find((item) => item.key === tier), [tier]);

  const loadZones = async () => {
    setLoadingZones(true);
    try {
      const response = await api.get('/zones');
      const list = response?.data?.data || [];
      setZones(list);
      if (list.length > 0) {
        setZoneId(list[0].zone_id);
      }
    } catch (_error) {
      Alert.alert(
        'Could not load zones',
        'Make sure backend is running and phone/laptop are on the same network.'
      );
    } finally {
      setLoadingZones(false);
    }
  };

  useEffect(() => {
    loadZones();
  }, []);

  const validate = () => {
    if (!name.trim() || !phone.trim() || !upiId.trim() || !zoneId || !selectedTier || !commerceApp) {
      Alert.alert('Missing details', 'Please complete all onboarding fields.');
      return false;
    }

    if (!userCode.trim()) {
      Alert.alert('Missing user code', 'Please enter your unique user code from the selected quick-commerce app.');
      return false;
    }

    if (!codeValidated) {
      Alert.alert('Code not validated', 'Please validate your unique user code before activating coverage.');
      return false;
    }

    if (phone.trim().length < 10) {
      Alert.alert('Invalid phone', 'Phone number should be at least 10 digits.');
      return false;
    }

    if (!upiId.includes('@')) {
      Alert.alert('Invalid UPI', 'Please enter a valid UPI ID like name@upi.');
      return false;
    }

    return true;
  };

  const validateUserCode = async () => {
    if (!userCode.trim()) {
      Alert.alert('Missing code', 'Enter your unique user code first.');
      return;
    }

    setValidatingCode(true);
    try {
      await sleep(900);
      setCodeValidated(true);
      Alert.alert('Code validated', 'Your quick-commerce user code is verified for this demo.');
    } finally {
      setValidatingCode(false);
    }
  };

  const createCoverage = async () => {
    const response = await api.post('/auth/register', {
      name: name.trim(),
      phone: phone.trim(),
      upi_id: upiId.trim(),
      zone_id: zoneId,
      tier,
      commerce_app: commerceApp,
      unique_user_code: userCode.trim(),
    });

    const worker = response?.data?.data;
    if (!worker?.worker_id || !worker?.zone_id) {
      throw new Error('Registration response is missing worker details.');
    }

    await AsyncStorage.multiSet([
      ['worker_id', worker.worker_id],
      ['zone_id', worker.zone_id],
      ['worker_name', name.trim()],
      ['tier', selectedTier.name],
      ['commerce_app', commerceApp],
      ['unique_user_code', userCode.trim()],
    ]);

    await api.post('/worker/activity', {
      worker_id: worker.worker_id,
      zone_id: worker.zone_id,
    });
  };

  const activateCoverage = async () => {
    if (!validate()) {
      return;
    }

    setSubmitting(true);
    try {
      setActivationStage('verifying');
      await sleep(1800);
      setActivationStage('verified');
      await sleep(1200);
      setActivationStage('payment');
    } catch (error) {
      const message = error?.response?.data?.error || error?.message || 'Activation failed. Please try again.';
      Alert.alert('Activation failed', message);
      setActivationStage('idle');
      setSubmitting(false);
    }
  };

  const completePaymentAfterCheckout = async () => {
    setActivationStage('processing_payment');
    try {
      await sleep(1500);
      await createCoverage();
      setActivationStage('success');
      await sleep(1600);
      setActivationStage('idle');
      navigation.replace('MainTabs');
    } catch (error) {
      setActivationStage('idle');
      const message = error?.response?.data?.error || error?.message || 'Activation failed after payment.';
      Alert.alert('Activation failed', message);
    } finally {
      setSubmitting(false);
    }
  };

  const openRazorpayCheckout = async () => {
    try {
      if (Constants.appOwnership === 'expo') {
        Alert.alert(
          'Razorpay requires dev build',
          'Razorpay native checkout is not available in Expo Go. Please run a development build (expo run:android) and open the app again.'
        );
        return;
      }

      const orderRes = await api.post('/payments/checkout-order', {
        amount_rupees: selectedTier?.premium || 0,
        plan_tier: tier,
      });

      const order = orderRes?.data?.data;
      if (!order?.key_id || !order?.order_id) {
        throw new Error('Payment order details are missing from backend.');
      }

      const checkoutOptions = {
        name: order.name || 'Kavach',
        description: order.description || `${selectedTier?.name || 'Plan'} weekly coverage`,
        currency: order.currency || 'INR',
        amount: String(order.amount_paise || Math.round((selectedTier?.premium || 0) * 100)),
        order_id: order.order_id,
        key: order.key_id,
        prefill: {
          contact: phone.trim(),
          email: `${userCode.trim().replace(/\s+/g, '').toLowerCase()}@kavach.demo`,
        },
        theme: { color: colors.accent },
      };

      await RazorpayCheckout.open(checkoutOptions);
      await completePaymentAfterCheckout();
    } catch (error) {
      const cancelled =
        typeof error?.description === 'string' &&
        error.description.toLowerCase().includes('cancel');

      if (cancelled) {
        Alert.alert('Payment cancelled', 'Razorpay checkout was cancelled. You can try payment again.');
      } else {
        const msg = error?.description || error?.message || 'Razorpay checkout failed.';
        Alert.alert('Payment failed', msg);
      }
    }
  };

  return (
    <SafeAreaView style={globalStyles.screen} edges={['top', 'left', 'right']}>
      <LinearGradient colors={['#0D1B2A', '#102A43', '#1B4332']} style={globalStyles.gradientBackground}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.hero}>
            <MaterialCommunityIcons name="shield-account" size={44} color={colors.accentSoft} />
            <Text style={styles.brand}>Kavach</Text>
            <Text style={styles.tagline}>A proper build. Fast claims. Real protection.</Text>
          </View>

          <View style={[globalStyles.card, globalStyles.cardShadow]}>
            <Field
              label="Full Name"
              value={name}
              onChangeText={setName}
              placeholder="Your full name"
            />
            <Field
              label="Phone"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="9876543210"
            />
            <Field
              label="UPI ID"
              value={upiId}
              onChangeText={setUpiId}
              placeholder="name@upi"
            />

            <Text style={styles.fieldLabel}>Zone</Text>
            <View style={styles.zoneListWrap}>
              {zones.length > 0 ? (
                zones.map((zone) => {
                  const isSelected = zone.zone_id === zoneId;
                  return (
                    <TouchableOpacity
                      key={zone.zone_id}
                      onPress={() => setZoneId(zone.zone_id)}
                      disabled={loadingZones}
                      style={[styles.zoneItem, isSelected && styles.zoneItemSelected]}
                    >
                      <Text style={[styles.zoneItemText, isSelected && styles.zoneItemTextSelected]}>
                        {zone.zone_name} ({zone.pin_code})
                      </Text>
                    </TouchableOpacity>
                  );
                })
              ) : (
                <Text style={styles.zoneEmptyText}>
                  {loadingZones ? 'Loading zones...' : 'No zones available. Check backend connection.'}
                </Text>
              )}
            </View>

            <Text style={styles.tierHeader}>Choose Plan</Text>
            <View style={styles.tierRow}>
              {TIERS.map((item) => {
                const isActive = item.key === tier;
                return (
                  <TouchableOpacity
                    key={item.key}
                    onPress={() => setTier(item.key)}
                    style={[styles.tierCard, isActive && styles.tierCardActive]}
                  >
                    <Text style={[styles.tierName, isActive && styles.tierNameActive]}>{item.name}</Text>
                    <Text style={styles.tierMeta}>Rs {item.premium}/wk</Text>
                    <Text style={styles.tierMeta}>Cap Rs {item.cap}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              onPress={activateCoverage}
              disabled={submitting}
              style={[styles.primaryButton, submitting && styles.primaryButtonDisabled]}
            >
              <Text style={styles.primaryButtonText}>
                {submitting ? 'Activating...' : 'Activate Coverage'}
              </Text>
            </TouchableOpacity>

            <Text style={[styles.tierHeader, { marginTop: 14 }]}>Connect Quick-Commerce App</Text>
            <View style={styles.appRow}>
              {COMMERCE_APPS.map((app) => {
                const active = commerceApp === app;
                return (
                  <TouchableOpacity
                    key={app}
                    style={[styles.appChip, active && styles.appChipActive]}
                    onPress={() => {
                      setCommerceApp(app);
                      setCodeValidated(false);
                    }}
                  >
                    <Text style={[styles.appChipText, active && styles.appChipTextActive]}>{app}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {commerceApp ? (
              <View style={{ marginTop: 10 }}>
                <Field
                  label="Enter Unique User Code"
                  value={userCode}
                  onChangeText={(text) => {
                    setUserCode(text);
                    setCodeValidated(false);
                  }}
                  placeholder={`Code from ${commerceApp}`}
                />
                <TouchableOpacity
                  style={[styles.validateBtn, validatingCode && styles.primaryButtonDisabled]}
                  onPress={validateUserCode}
                  disabled={validatingCode}
                >
                  <Text style={styles.validateBtnText}>{validatingCode ? 'Validating...' : 'Validate User Code'}</Text>
                </TouchableOpacity>
                {codeValidated ? <Text style={styles.validatedText}>Code validated successfully.</Text> : null}
              </View>
            ) : null}
          </View>
        </ScrollView>
      </LinearGradient>

      <Modal visible={activationStage !== 'idle'} transparent animationType="fade" onRequestClose={() => {}}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            {activationStage === 'verifying' ? (
              <>
                <View style={styles.bigSpinnerWrap}>
                  <ActivityIndicator size="large" color={colors.accent} style={{ transform: [{ scale: 2.1 }] }} />
                </View>
                <Text style={styles.modalTitle}>Verifying account</Text>
                <Text style={styles.modalSub}>Connecting to {commerceApp} and checking your profile.</Text>
              </>
            ) : null}

            {activationStage === 'verified' ? (
              <>
                <MaterialCommunityIcons name="check-circle" size={68} color={colors.accent} />
                <Text style={styles.modalTitle}>Account validated</Text>
                <Text style={styles.modalSub}>Profile verification complete.</Text>
              </>
            ) : null}

            {activationStage === 'payment' ? (
              <>
                <MaterialCommunityIcons name="bank-transfer" size={62} color={colors.accentSoft} />
                <Text style={styles.modalTitle}>Razorpay Test Checkout</Text>
                <Text style={styles.modalSub}>Pay Rs {selectedTier?.premium || 0} for {selectedTier?.name || 'Plan'} weekly coverage.</Text>
                <TouchableOpacity style={styles.payBtn} onPress={openRazorpayCheckout}>
                  <Text style={styles.payBtnText}>Open Razorpay & Pay Rs {selectedTier?.premium || 0}</Text>
                </TouchableOpacity>
              </>
            ) : null}

            {activationStage === 'processing_payment' ? (
              <>
                <View style={styles.bigSpinnerWrap}>
                  <ActivityIndicator size="large" color={colors.accent} style={{ transform: [{ scale: 1.9 }] }} />
                </View>
                <Text style={styles.modalTitle}>Processing payment</Text>
                <Text style={styles.modalSub}>Finalizing your weekly coverage activation.</Text>
              </>
            ) : null}

            {activationStage === 'success' ? (
              <>
                <MaterialCommunityIcons name="check-decagram" size={72} color={colors.accent} />
                <Text style={styles.modalTitle}>You are all set for the week!</Text>
                <Text style={styles.modalSub}>Coverage is active. Redirecting you to dashboard.</Text>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 30,
  },
  hero: {
    marginBottom: 22,
  },
  brand: {
    marginTop: 10,
    fontFamily: 'Outfit_700Bold',
    fontSize: 34,
    color: colors.textPrimary,
  },
  tagline: {
    marginTop: 6,
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    color: colors.textSecondary,
  },
  fieldWrap: {
    marginBottom: 12,
  },
  fieldLabel: {
    marginBottom: 6,
    fontFamily: 'Outfit_500Medium',
    fontSize: 12,
    color: colors.textSecondary,
  },
  input: {
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: colors.bgCardSoft,
    borderWidth: 1,
    borderColor: colors.divider,
    color: colors.textPrimary,
    fontFamily: 'Outfit_500Medium',
    fontSize: 14,
  },
  zoneListWrap: {
    borderRadius: 12,
    backgroundColor: colors.bgCardSoft,
    borderWidth: 1,
    borderColor: colors.divider,
    marginBottom: 14,
    padding: 8,
  },
  zoneItem: {
    borderRadius: 9,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: colors.bgCard,
    paddingVertical: 9,
    paddingHorizontal: 10,
    marginVertical: 4,
  },
  zoneItemSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.chip,
  },
  zoneItemText: {
    color: colors.textPrimary,
    fontFamily: 'Outfit_500Medium',
    fontSize: 13,
  },
  zoneItemTextSelected: {
    color: colors.accentSoft,
  },
  zoneEmptyText: {
    color: colors.textMuted,
    fontFamily: 'Outfit_400Regular',
    fontSize: 12,
    paddingVertical: 4,
  },
  tierHeader: {
    marginBottom: 8,
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 14,
    color: colors.textPrimary,
  },
  tierRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  tierCard: {
    width: '32%',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: colors.bgCardSoft,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  tierCardActive: {
    borderColor: colors.accent,
    backgroundColor: colors.chip,
  },
  tierName: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 14,
    color: colors.textPrimary,
  },
  tierNameActive: {
    color: colors.accentSoft,
  },
  tierMeta: {
    marginTop: 2,
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 11,
    color: colors.textMuted,
  },
  primaryButton: {
    marginTop: 4,
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
  },
  primaryButtonDisabled: {
    opacity: 0.65,
  },
  primaryButtonText: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 15,
    color: '#06231D',
  },
  appRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  appChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: colors.bgCardSoft,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  appChipActive: {
    borderColor: colors.accent,
    backgroundColor: colors.chip,
  },
  appChipText: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 12,
    color: colors.textPrimary,
  },
  appChipTextActive: {
    color: colors.accentSoft,
  },
  validateBtn: {
    marginTop: 2,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: colors.bgCardSoft,
  },
  validateBtnText: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 13,
    color: colors.textPrimary,
  },
  validatedText: {
    marginTop: 8,
    fontFamily: 'Outfit_500Medium',
    fontSize: 12,
    color: colors.accent,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.48)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: colors.bgSecondary,
    paddingHorizontal: 18,
    paddingVertical: 20,
    alignItems: 'center',
  },
  bigSpinnerWrap: {
    width: 94,
    height: 94,
    borderRadius: 47,
    borderWidth: 1,
    borderColor: colors.divider,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    backgroundColor: 'rgba(152,233,197,0.08)',
  },
  modalTitle: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 21,
    color: colors.textPrimary,
    marginTop: 8,
    textAlign: 'center',
  },
  modalSub: {
    marginTop: 6,
    fontFamily: 'Outfit_400Regular',
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  payBtn: {
    marginTop: 14,
    height: 46,
    width: '100%',
    borderRadius: 12,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payBtnText: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 14,
    color: '#05211D',
  },
});
