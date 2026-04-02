import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import colors from '../theme/colors';
import globalStyles from '../theme/globalStyles';

const TIERS = [
  { key: 'basic', name: 'Basic', premium: 29, cap: 800 },
  { key: 'plus', name: 'Plus', premium: 49, cap: 1500 },
  { key: 'max', name: 'Max', premium: 79, cap: 2500 },
];

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
  const [zones, setZones] = useState([]);
  const [zoneId, setZoneId] = useState('');
  const [loadingZones, setLoadingZones] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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
    if (!name.trim() || !phone.trim() || !upiId.trim() || !zoneId || !selectedTier) {
      Alert.alert('Missing details', 'Please complete all onboarding fields.');
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

  const activateCoverage = async () => {
    if (!validate()) {
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post('/auth/register', {
        name: name.trim(),
        phone: phone.trim(),
        upi_id: upiId.trim(),
        zone_id: zoneId,
        tier,
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
      ]);

      await api.post('/worker/activity', {
        worker_id: worker.worker_id,
        zone_id: worker.zone_id,
      });

      navigation.replace('MainTabs');
    } catch (error) {
      const message = error?.response?.data?.error || error?.message || 'Activation failed. Please try again.';
      Alert.alert('Activation failed', message);
    } finally {
      setSubmitting(false);
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
            <View style={styles.pickerWrap}>
              <Picker
                enabled={!loadingZones}
                selectedValue={zoneId}
                onValueChange={setZoneId}
                dropdownIconColor={colors.textSecondary}
                style={styles.picker}
              >
                {zones.map((zone) => (
                  <Picker.Item
                    key={zone.zone_id}
                    label={`${zone.zone_name} (${zone.pin_code})`}
                    value={zone.zone_id}
                    color={colors.textPrimary}
                  />
                ))}
              </Picker>
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
          </View>
        </ScrollView>
      </LinearGradient>
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
  pickerWrap: {
    borderRadius: 12,
    backgroundColor: colors.bgCardSoft,
    borderWidth: 1,
    borderColor: colors.divider,
    marginBottom: 14,
  },
  picker: {
    color: colors.textPrimary,
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
});
