import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  StatusBar,
  SafeAreaView,
  Image,
  Dimensions,
  Platform,
} from 'react-native';

const { width, height } = Dimensions.get('window');

const C = {
  navy:      '#0D1B2A',
  accent:    '#E8871E',
  success:   '#22C55E',
  white:     '#FFFFFF',
  bg:        '#F7F8FA',
  line:      '#EBEBEB',
  muted:     '#9098A3',
  successBg: '#F0FDF4',
};

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState(1);
  const [step, setStep]     = useState(0);
  const fade = useRef(new Animated.Value(1)).current;

  const go = (s) => {
    Animated.timing(fade, { toValue: 0, duration: 120, useNativeDriver: true }).start(() => {
      setScreen(s);
      if (s === 1) setStep(0);
      Animated.timing(fade, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    });
  };

  return (
    <Animated.View style={{ flex: 1, opacity: fade }}>
      {screen === 1 && <S1 go={go} />}
      {screen === 2 && <S2 go={go} step={step} setStep={setStep} />}
      {screen === 3 && <S3 go={go} />}
    </Animated.View>
  );
}

// ─── Screen 1: Dashboard ──────────────────────────────────────────────────────
function S1({ go }) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.4, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,   duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.white }}>
      <StatusBar barStyle="dark-content" backgroundColor={C.white} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.pad}>

        {/* Top bar */}
        <View style={s.topbar}>
          <Image source={require('./assets/kavachlogo.png')} style={s.logo} />
          <View style={s.pill}>
            <Animated.View style={[s.dot, { transform: [{ scale: pulse }] }]} />
            <Text style={s.pillTxt}>Active</Text>
          </View>
        </View>

        <Text style={s.dateChip}>Fri 20 Mar 2026  ·  HSR Layout, Bengaluru</Text>

        {/* Worker */}
        <View style={[s.row, { marginTop: 28, marginBottom: 28 }]}>
          <View style={s.avatar}><Text style={s.avatarTxt}>AK</Text></View>
          <View style={{ marginLeft: 14 }}>
            <Text style={s.name}>Arjun Kumar</Text>
            <Text style={s.sub}>Zepto Delivery Partner · 14 months</Text>
          </View>
        </View>

        <View style={s.divider} />

        {/* Plan */}
        <View style={{ marginTop: 22, marginBottom: 24 }}>
          <View style={s.rowBetween}>
            <Text style={s.label}>Plan</Text>
            <Text style={s.badge}>Kavach Plus</Text>
          </View>
          <View style={[s.rowBetween, { marginTop: 16 }]}>
            <Text style={s.bigNum}>₹1,500</Text>
            <Text style={s.muted}>weekly cap</Text>
          </View>
          <View style={s.track}>
            <View style={[s.fill, { width: '0%' }]} />
          </View>
          <View style={s.rowBetween}>
            <Text style={s.micro}>₹0 used</Text>
            <Text style={s.micro}>₹49 / week · renews Mon 23 Mar</Text>
          </View>
        </View>

        <View style={s.divider} />

        {/* Earnings */}
        <View style={{ marginTop: 22, marginBottom: 24 }}>
          <Text style={s.label}>Earnings baseline</Text>
          <View style={[s.row, { marginTop: 18, gap: 32 }]}>
            <View>
              <Text style={s.statNum}>₹650</Text>
              <Text style={s.micro}>daily avg</Text>
            </View>
            <View>
              <Text style={s.statNum}>₹4,500</Text>
              <Text style={s.micro}>weekly avg</Text>
            </View>
            <View>
              <Text style={s.statNum}>6–10 PM</Text>
              <Text style={s.micro}>peak window</Text>
            </View>
          </View>
        </View>

        <View style={s.divider} />

        {/* Zone */}
        <View style={{ marginTop: 22, marginBottom: 36 }}>
          <Text style={s.label}>Zone status</Text>
          <View style={[s.row, { marginTop: 14, gap: 10 }]}>
            <View style={s.zoneDot} />
            <View>
              <Text style={[s.name, { fontSize: 15 }]}>Clear — no disruptions</Text>
              <Text style={s.micro}>🌤  28°C · Humidity 64%</Text>
            </View>
          </View>
        </View>

        {/* CTA */}
        <TouchableOpacity style={s.btn} onPress={() => go(2)} activeOpacity={0.82}>
          <Text style={s.btnTxt}>Simulate disruption</Text>
        </TouchableOpacity>
        <Text style={[s.micro, { textAlign: 'center', marginTop: 10 }]}>
          Demo: trigger rainfall event in HSR Layout
        </Text>
        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Screen 2: Disruption ─────────────────────────────────────────────────────
function S2({ go, step, setStep }) {
  const rainAnims = useRef(Array.from({ length: 8 }, () => new Animated.Value(0))).current;
  const aA  = useRef(new Animated.Value(0)).current;
  const aAo = useRef(new Animated.Value(0)).current;
  const aB  = useRef(new Animated.Value(0)).current;
  const aBo = useRef(new Animated.Value(0)).current;
  const aP  = useRef(new Animated.Value(0)).current;
  const aPo = useRef(new Animated.Value(0)).current;
  const bar = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    rainAnims.forEach((a, i) => {
      const loop = Animated.loop(
        Animated.timing(a, { toValue: 1, duration: 1600 + i * 150, useNativeDriver: true })
      );
      setTimeout(() => loop.start(), i * 190);
    });
  }, []);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 900),
      setTimeout(() => setStep(2), 2000),
      setTimeout(() => setStep(3), 3200),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (step >= 1) slideIn(aA, aAo);
    if (step >= 2) { slideIn(aB, aBo); Animated.timing(bar, { toValue: 1, duration: 800, useNativeDriver: false, delay: 200 }).start(); }
    if (step >= 3) slideIn(aP, aPo);
  }, [step]);

  function slideIn(translateAnim, opacityAnim) {
    Animated.parallel([
      Animated.spring(translateAnim, { toValue: 1, friction: 6, useNativeDriver: true }),
      Animated.timing(opacityAnim,   { toValue: 1, duration: 350, useNativeDriver: true }),
    ]).start();
  }

  const ty = (a) => a.interpolate({ inputRange: [0, 1], outputRange: [30, 0] });
  const barW = bar.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.navy }}>
      <StatusBar barStyle="light-content" backgroundColor={C.accent} />

      {/* Rain */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        {rainAnims.map((a, i) => {
          const ty2 = a.interpolate({ inputRange: [0, 1], outputRange: [-50, height + 50] });
          return (
            <Animated.View key={i} style={{
              position: 'absolute',
              left: (i * (width / 8)) + (i % 2 ? 6 : -6),
              top: 0, width: 1, height: 36,
              backgroundColor: C.white,
              opacity: 0.06,
              transform: [{ translateY: ty2 }, { rotate: '12deg' }],
            }} />
          );
        })}
      </View>

      {/* Header strip */}
      <View style={s.disruptHead}>
        <TouchableOpacity onPress={() => go(1)}>
          <Text style={s.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.disruptTitle}>Disruption detected</Text>
        <Text style={s.disruptSub}>HSR Layout · 7:32 PM · Verifying signals...</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.pad}>

        {/* Signal A */}
        {step >= 1 && (
          <Animated.View style={[s.signalRow, { opacity: aAo, transform: [{ translateY: ty(aA) }] }]}>
            <View style={s.signalLeft}>
              <Text style={s.signalTag}>Signal A</Text>
              <Text style={s.signalTitle}>IMD Weather API</Text>
              <Text style={s.signalDetail}>Red Alert · Rainfall 68 mm/hr  (threshold 50)</Text>
            </View>
            <View style={s.checkCircle}><Text style={s.checkMark}>✓</Text></View>
          </Animated.View>
        )}

        {step >= 1 && step < 2 && (
          <Text style={[s.micro, { color: 'rgba(255,255,255,0.4)', marginTop: 10 }]}>Checking signal B...</Text>
        )}

        {/* Signal B */}
        {step >= 2 && (
          <Animated.View style={[s.signalRow, { opacity: aBo, transform: [{ translateY: ty(aB) }], marginTop: 14 }]}>
            <View style={s.signalLeft}>
              <Text style={s.signalTag}>Signal B</Text>
              <Text style={s.signalTitle}>Platform demand drop</Text>
              <Text style={s.signalDetail}>Zone orders down 79% in 12 min  (threshold 70%)</Text>
            </View>
            <View style={s.checkCircle}><Text style={s.checkMark}>✓</Text></View>
          </Animated.View>
        )}

        {/* Progress */}
        {step >= 2 && (
          <View style={{ marginTop: 28 }}>
            <View style={s.darkTrack}>
              <Animated.View style={[s.darkFill, { width: barW }]} />
            </View>
            {step >= 3 && (
              <Text style={[s.signalDetail, { color: C.success, marginTop: 10, fontWeight: '600' }]}>
                ✓ Both signals confirmed — payout triggered
              </Text>
            )}
          </View>
        )}

        {/* Payout box */}
        {step >= 3 && (
          <Animated.View style={[s.payoutBox, { opacity: aPo, transform: [{ translateY: ty(aP) }] }]}>
            <Text style={s.payoutLabel}>Payout amount</Text>
            <Text style={s.payoutNum}>₹320</Text>
            <Text style={s.payoutSub}>Avg peak earnings · 2.5 hr window · Kavach Plus</Text>
            <Text style={[s.payoutSub, { marginTop: 4 }]}>→ arjun.zepto@upi</Text>
          </Animated.View>
        )}

        {step >= 3 && (
          <TouchableOpacity style={[s.btn, { backgroundColor: C.success, marginTop: 24 }]} onPress={() => go(3)} activeOpacity={0.82}>
            <Text style={s.btnTxt}>View confirmation</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Screen 3: Confirmed ──────────────────────────────────────────────────────
function S3({ go }) {
  const scale = useRef(new Animated.Value(0)).current;
  const fade  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 4, tension: 90, useNativeDriver: true }),
      Animated.timing(fade,  { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const timeline = [
    { time: '7:30 PM', text: 'IMD Red Alert issued · HSR Layout' },
    { time: '7:32 PM', text: 'Order volume drop detected · 79%' },
    { time: '7:32 PM', text: 'Two-Key Rule confirmed ✓' },
    { time: '7:33 PM', text: 'Payout approved · ₹320' },
    { time: '7:35 PM', text: '₹320 → arjun.zepto@upi', green: true },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.white }}>
      <StatusBar barStyle="dark-content" backgroundColor={C.white} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[s.pad, { alignItems: 'center' }]}>

        {/* Check */}
        <Animated.View style={[s.successRing, { transform: [{ scale }], opacity: fade }]}>
          <Text style={s.checkBig}>✓</Text>
        </Animated.View>

        <Animated.View style={{ alignItems: 'center', width: '100%', opacity: fade }}>
          <Text style={s.sentAmt}>₹320 sent</Text>
          <Text style={s.sentUpi}>arjun.zepto@upi</Text>
          <Text style={[s.micro, { marginTop: 4 }]}>Fri 20 Mar 2026 · 7:35 PM</Text>

          {/* Pill */}
          <View style={s.autoPill}>
            <Text style={s.autoPillTxt}>No claim · No form · No call · Automatic</Text>
          </View>

          <View style={s.divider} />

          {/* Coverage bar */}
          <View style={{ width: '100%', marginBottom: 28 }}>
            <View style={s.rowBetween}>
              <Text style={s.label}>Coverage used</Text>
              <Text style={s.badge}>₹1,180 left</Text>
            </View>
            <View style={[s.track, { marginTop: 14 }]}>
              <View style={[s.fill, { width: '21%' }]} />
            </View>
            <View style={s.rowBetween}>
              <Text style={s.micro}>₹320 used</Text>
              <Text style={s.micro}>21% of ₹1,500 cap</Text>
            </View>
          </View>

          <View style={s.divider} />

          {/* Timeline */}
          <View style={{ width: '100%', marginTop: 24, marginBottom: 36 }}>
            <Text style={s.label}>How it happened</Text>
            {timeline.map((item, i) => (
              <View key={i} style={s.tlRow}>
                <View style={[s.tlDot, item.green && { backgroundColor: C.success }]} />
                <Text style={s.tlTime}>{item.time}</Text>
                <Text style={[s.tlText, item.green && { color: C.success, fontWeight: '700' }]}>
                  {item.text}
                </Text>
              </View>
            ))}
          </View>

          <Text style={[s.micro, { marginBottom: 14, textAlign: 'center' }]}>
            Kavach Plus · Week of 17–23 March 2026
          </Text>

          <TouchableOpacity style={s.btn} onPress={() => go(1)} activeOpacity={0.82}>
            <Text style={s.btnTxt}>Back to dashboard</Text>
          </TouchableOpacity>
          <View style={{ height: 30 }} />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  pad:      { paddingHorizontal: 22, paddingTop: 20 },
  row:      { flexDirection: 'row', alignItems: 'center' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  divider:  { height: 1, backgroundColor: C.line },

  // Top bar
  topbar:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  logo:     { width: 100, height: 38, resizeMode: 'contain' },
  pill:     { flexDirection: 'row', alignItems: 'center', gap: 6,
              backgroundColor: '#EEF8F1', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  dot:      { width: 7, height: 7, borderRadius: 4, backgroundColor: C.success },
  pillTxt:  { fontSize: 12, fontWeight: '700', color: C.success },
  dateChip: { fontSize: 12, color: C.muted, marginTop: 4 },

  // Worker
  avatar:    { width: 48, height: 48, borderRadius: 24, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { color: C.navy, fontSize: 16, fontWeight: '800' },
  name:      { fontSize: 17, fontWeight: '700', color: C.navy },
  sub:       { fontSize: 13, color: C.muted, marginTop: 2 },

  // Typography
  label:    { fontSize: 11, fontWeight: '600', color: C.muted, letterSpacing: 0.8, textTransform: 'uppercase' },
  badge:    { fontSize: 13, fontWeight: '700', color: C.navy },
  bigNum:   { fontSize: 30, fontWeight: '800', color: C.navy },
  statNum:  { fontSize: 20, fontWeight: '700', color: C.navy },
  micro:    { fontSize: 11, color: C.muted },
  muted:    { fontSize: 13, color: C.muted },

  // Progress
  track: { height: 5, backgroundColor: '#EBEBEB', borderRadius: 3, marginVertical: 10, overflow: 'hidden' },
  fill:  { height: 5, backgroundColor: C.accent, borderRadius: 3 },

  // Zone
  zoneDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#22C55E', marginTop: 1 },

  // Button
  btn:     { backgroundColor: C.navy, borderRadius: 10, paddingVertical: 16, alignItems: 'center', width: '100%' },
  btnTxt:  { color: C.white, fontSize: 15, fontWeight: '700', letterSpacing: 0.2 },

  // Screen 2
  disruptHead: { backgroundColor: C.accent, paddingHorizontal: 22,
    paddingTop: Platform.OS === 'android' ? 44 : 18, paddingBottom: 18 },
  back:         { color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: '600', marginBottom: 14 },
  disruptTitle: { fontSize: 22, fontWeight: '800', color: C.white },
  disruptSub:   { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 4 },

  signalRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  signalLeft:  { flex: 1, paddingRight: 16 },
  signalTag:   { fontSize: 10, fontWeight: '700', color: C.accent, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  signalTitle: { fontSize: 15, fontWeight: '700', color: C.white },
  signalDetail:{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 3 },

  checkCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.success, alignItems: 'center', justifyContent: 'center' },
  checkMark:   { color: C.white, fontSize: 17, fontWeight: '800' },

  darkTrack: { height: 4, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 2, overflow: 'hidden' },
  darkFill:  { height: 4, backgroundColor: C.success, borderRadius: 2 },

  payoutBox: { marginTop: 28, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', paddingTop: 24 },
  payoutLabel: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1 },
  payoutNum:   { fontSize: 44, fontWeight: '800', color: C.accent, marginTop: 4, marginBottom: 6 },
  payoutSub:   { fontSize: 12, color: 'rgba(255,255,255,0.45)' },

  // Screen 3
  successRing: { width: 96, height: 96, borderRadius: 48, backgroundColor: C.successBg,
    alignItems: 'center', justifyContent: 'center', marginTop: 24, marginBottom: 20 },
  checkBig:    { fontSize: 42, color: C.success, lineHeight: 50 },
  sentAmt:     { fontSize: 30, fontWeight: '800', color: C.navy, marginBottom: 6 },
  sentUpi:     { fontSize: 14, color: C.muted },

  autoPill:    { backgroundColor: C.accent, borderRadius: 20, paddingHorizontal: 18, paddingVertical: 9,
    marginTop: 18, marginBottom: 24 },
  autoPillTxt: { color: C.navy, fontWeight: '700', fontSize: 12 },

  // Timeline
  tlRow:  { flexDirection: 'row', alignItems: 'flex-start', marginTop: 14 },
  tlDot:  { width: 7, height: 7, borderRadius: 4, backgroundColor: C.accent, marginTop: 5, marginRight: 10 },
  tlTime: { fontSize: 11, color: C.muted, width: 58, marginTop: 2 },
  tlText: { fontSize: 13, color: C.navy, flex: 1, lineHeight: 19 },
});
