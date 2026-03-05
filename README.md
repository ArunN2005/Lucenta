# GigShield — Parametric Income Insurance for India's Q-Commerce Delivery Workers

**Guidewire DEVTrails 2026 | Phase 1**

---

We've been thinking about this problem for a while — not just as a hackathon prompt, but as something we've genuinely observed. One of our team members spent time talking to Zepto delivery partners near our college campus during last year's monsoon. The thing that stuck with us: these guys were losing ₹600–₹800 on a single bad-weather day, and their only "backup plan" was to not eat out that week.

That's the gap GigShield is trying to close.

---

## Table of Contents

1. [The Problem We're Actually Solving](#the-problem-were-actually-solving)
2. [Why We Picked Q-Commerce](#why-we-picked-q-commerce)
3. [Meet Arjun — Our Primary Persona](#meet-arjun--our-primary-persona)
4. [How GigShield Works](#how-gigshield-works)
5. [Real Scenarios We Designed For](#real-scenarios-we-designed-for)
6. [The Weekly Premium Model](#the-weekly-premium-model)
7. [Parametric Triggers — The Two-Key Rule](#parametric-triggers--the-two-key-rule)
8. [AI/ML: What We're Actually Building](#aiml-what-were-actually-building)
9. [Why Mobile, Not Web](#why-mobile-not-web)
10. [Tech Stack](#tech-stack)
11. [Adversarial Defense & Anti-Spoofing Strategy](#adversarial-defense--anti-spoofing-strategy)

---

## The Problem We're Actually Solving

India has roughly 5 million platform-based gig delivery workers. The ones we care about — Q-Commerce riders on Zepto and Blinkit — are working 10–12 hour days to enable our "10-minute grocery" habit. When it rains hard enough, or when Section 144 drops on a zone without warning, they go home with nothing.

The existing "solutions" are either nonexistent (no product targets this segment at all) or completely misaligned — monthly health insurance plans that cost ₹300+/month and cover hospitalisation, not a day's lost wages. That's not what a rider needs when a flood shuts his zone for 6 hours on a Tuesday evening.

What he needs is: **₹400 in his UPI account by the time the rain stops.** No forms. No agent calls. No waiting.

That's the only thing GigShield does. We think doing one thing right matters more than doing five things badly.

---

## Why We Picked Q-Commerce

We went back and forth on this. Food delivery (Zomato/Swiggy) was the obvious choice — bigger market, more visible. But the more we dug in, the more we realized Q-Commerce riders have a fundamentally worse disruption problem:

A Zomato rider working a bad-weather shift can switch zones, take fewer orders, or hop to another app. A Zepto rider is **zone-locked**. He's tied to one dark store. When that zone gets flooded or shut down, there's nowhere to go. It's binary — working or not working.

That total-loss dynamic is exactly what parametric insurance is designed for. Partial losses are messy to verify. Binary losses are clean to confirm and clean to pay.

| | Food Delivery | Q-Commerce (our segment) |
|---|---|---|
| Delivery radius | 3–8 km | 1–3 km |
| Orders/hour (normal day) | 2–3 | 5–8 |
| Can shift to another zone? | Yes | No |
| Disruption = partial or total loss? | Usually partial | Almost always total |
| Income lost in a 3-hour disruption | ₹150–200 | ₹300–500 |

The math made the choice for us.

---

## Meet Arjun — Our Primary Persona

**Arjun, 27. Zepto delivery partner, HSR Layout, Bengaluru.**

Arjun has been doing this for 14 months. He earns about ₹650/day on a good day, ₹4,500 in a normal week. He works 10 AM to 11 PM, with his real money coming in between 6–10 PM — the dinner rush window. He doesn't have a vehicle loan, which is unusual, but he's supporting his wife and a toddler on this income.

During the November 2023 Bengaluru floods, he lost around ₹3,200 across four disrupted days. He found out about it the same way he finds out about everything — from the Zepto rider WhatsApp group. There was no notification, no compensation, no acknowledgement. He just lost that money.

That's who we're building for.

**What Arjun needs from insurance:**
- Costs less than a samosa per day (our ₹7/day baseline does this)
- Pays without him doing anything — he doesn't have time to file claims during a storm
- Shows up in his UPI history, not a promise letter
- Doesn't cover things he doesn't need (he has his own mechanic; he doesn't want health cover he can't use)

---

## How GigShield Works

The core loop: **Detect → Decide → Disburse**

We monitor external disruption signals continuously. When a threshold is crossed and confirmed by a second independent signal (our "Two-Key Rule"), the system classifies it as a covered disruption, calculates what Arjun would have earned in that window based on his 4-week income average, and pushes the payout to his UPI. He gets a notification. The money is there.

He never filed anything. He never called anyone.

**Covered:** Income lost from weather (heavy rain, floods, extreme heat), civic disruptions (curfews, strikes, zone closures), platform-level outages that stop order assignment.

**Not covered — and we mean it:** Health. Accidents. Vehicle damage. Life cover. This is in the product design, not the fine print.

### Onboarding (target: under 5 minutes)

```
1. Phone number → OTP
2. Scan Zepto/Blinkit partner QR (verifies platform identity)
3. Zone auto-detected from dark store affiliation
4. Income baseline: from platform API if available, manual entry fallback
5. Risk tier shown → weekly premium confirmed
6. UPI ID entered → ₹1 test deposit to verify
7. Policy live
```

No documents. No selfie-with-ID. No agent visit.

### Weekly Cycle

```
Monday 00:00  →  Premium auto-deducted (₹29 / ₹49 / ₹79 by tier)
               →  7-day coverage begins
Sunday 23:59  →  Week closes
Monday 00:00  →  Premium re-evaluated, new week starts
```

Monday start isn't random — most Q-Commerce platform payouts settle Monday/Tuesday. The worker has money in hand when the premium comes out.

---

## Real Scenarios We Designed For

These aren't hypothetical. These situations have happened.

### Scenario 1 — The HSR Layout Cloudburst

Wednesday evening, 7:30 PM. IMD red alert for South Bengaluru. Rainfall hits 68mm/hour in HSR Layout. The Zepto dark store goes offline — their rider app stops assigning orders.

**GigShield's response:**
1. IMD API flags red-alert threshold crossed for the zone's PIN cluster
2. Order assignment volume in the zone drops >75% over 25 minutes — confirmed
3. Arjun's app: *"Zone disruption detected. Coverage active. No action needed."*
4. Payout calculated: his average 7–10 PM weekday earnings = ₹320, disruption = 2.5 hrs → ₹320
5. UPI transfer initiated

Time from trigger to payout initiation: under 90 seconds.

### Scenario 2 — The Sudden Section 144

A political rally turns tense. Section 144 imposed across three PIN codes at 6 PM, 15 minutes' notice. Riders physically cannot enter the zone.

**GigShield's response:**
1. News NLP feed and government alert API detect zone-specific movement restriction
2. Platform order data shows zero pickups in the affected cluster
3. System confirms Arjun was active (app open, accepting orders) in the 30 minutes before curfew
4. Coverage triggered. Payout for blocked hours, capped at 6 hrs/incident.

### Scenario 3 — Extreme Heat

May in Delhi. 44°C. AQI at 425 (Severe). Riders can't safely work outdoors. Customer volumes also drop.

We treat this as a **partial disruption** — 50% payout. Some riders do work. Demand doesn't fully collapse. Paying full coverage here would wreck our loss ratio and isn't honest to the product. The 50% rule is a deliberate design decision, not a gap.

---

## The Weekly Premium Model

### How We Thought About Pricing

We kept prices fixed and visible. Arjun doesn't need a premium that fluctuates weekly based on weather forecasts — that creates anxiety and erodes trust. What changes is the **coverage cap**, not the price. Same ₹49, but if his zone has a low disruption history, his cap is higher that week. If monsoon season is peaking and his zone floods regularly, the cap adjusts down slightly.

He always knows exactly what he's paying. The risk-adjusted part is visible in the app, not buried.

### The Three Tiers

| Tier | Weekly Premium | Coverage Cap | Who It's For |
|---|---|---|---|
| Shield Basic | ₹29/week | Up to ₹800 | Part-time or new riders |
| Shield Plus | ₹49/week | Up to ₹1,500 | Most full-time riders — our anchor product |
| Shield Max | ₹79/week | Up to ₹2,500 | High-earning, long-tenure riders |

Shield Plus at ₹49/week is ₹7/day. Less than an auto ride to the dark store.

### Financial Viability

We're targeting a 60–65% loss ratio — standard for parametric products. Our actuarial inputs:
- Historical IMD disruption frequency by zone (public data, downloadable)
- Platform downtime frequency (estimated from public incident reports)
- Max 2 payout events per worker per week — prevents stacking

We haven't run a full actuarial model yet — that's Phase 2. But the unit economics hold at these numbers. We'll stress-test in Phase 2 with simulated disruption scenarios.

---

## Parametric Triggers — The Two-Key Rule

**No single data source can trigger a payout.**

This is the most important design decision in GigShield. Every covered disruption needs two independent signals confirmed simultaneously. It eliminates false triggers from mild weather, and it makes GPS spoofing attacks completely insufficient on their own.

| Trigger | Primary Signal | Secondary Signal | Payout |
|---|---|---|---|
| Heavy rain / flood | IMD red alert (>50mm/hr) | Zone order volume drop >70% | 100% |
| Extreme heat / AQI | IMD temp >42°C OR AQI >400 | Zone-wide active rider drop >50% | 50% |
| Civic disruption | Govt/news NLP: curfew or strike | Zero order assignments in PIN cluster | 100% |
| Waterlogging | IMD flood warning + BBMP data | Worker GPS cluster static >45 min | 100% |
| Platform outage | API heartbeat failure >20 min | Worker app showing 0 available orders | 70% |

Using **platform order volume as a secondary signal** is something we haven't seen done elsewhere. Most parametric systems just use weather APIs. But if Zepto orders are flowing despite bad weather, riders are working — no payout needed. The demand signal closes the loop weather data alone can't.

---

## AI/ML: What We're Actually Building

Honest about this: we're not claiming a fully trained production ML system in 6 weeks. We're committing to a working implementation with real logic and real training where possible, with clearly labelled mocks where we hit API walls.

### Risk Profiling (XGBoost)

Assigns a risk multiplier to each worker's zone at onboarding, re-evaluated weekly.

Features: historical IMD disruption frequency for the zone, zone type (residential/commercial/mixed), seasonal risk patterns, dark store type.

Output: multiplier (0.7x–1.4x) applied to coverage cap. Zone in Andheri East with waterlogging history → cap adjusts for monsoon. Zone in Koramangala that rarely floods → cap gets a bonus.

### Trigger Validation (Rules + Isolation Forest)

Rule-based at the top level — thresholds are explicit and auditable. Isolation Forest running in parallel to catch unusual claim distributions, like 40% of riders claiming while 60% are still completing orders in the same zone.

```
If weather_signal AND platform_volume_drop AND worker_was_active_before:
    Is disruption zone-wide or individual?
    Zone-wide → trigger payout
    Individual → flag for review
```

### Payout Calculation

```
Payout = min(
    worker's 4-week avg hourly income × disrupted hours,
    tier coverage cap
) × severity multiplier

Severity: full zone shutdown = 1.0x, partial disruption = 0.5x, platform outage = 0.7x
```

### Fraud Detection

Three ML components (Phase 2 build targets): device sensor fusion model (accelerometer + gyroscope + network signal patterns), social graph anomaly detector (graph clustering on worker connections), and historical behavioral comparator. Full design in the adversarial defense section.

---

## Why Mobile, Not Web

Q-Commerce delivery partners live in their apps. Zepto's rider app is open 10+ hours a day. If GigShield lives in a browser tab, it's already dead — they'll never look at it.

We need push notifications for disruption alerts. We need device sensor access for fraud detection. We need UPI deep links for frictionless payment. All of this requires mobile.

React Native, Android-first — roughly 85% of the riders we've spoken to are on Android. PWA fallback for iOS. The insurer/admin side is a web dashboard — those users are desk-based, so that's fine.

---

## Tech Stack

What we're actually going to use — not an aspirational list.

**Mobile:** React Native + Expo (we've all used it, which matters when you have 6 weeks)

**Backend:** Node.js + Express for the API layer. Python + FastAPI as a separate ML inference microservice — separated because ML iteration speed differs from API iteration speed.

**Database:** PostgreSQL for policies, workers, zones, claims. Redis for real-time trigger state and session management.

**Event streaming:** Kafka for disruption signal ingestion. We looked at simpler queues, but disruption events need to fan out to multiple consumers (trigger engine, fraud engine, notification service) and can't be lost.

**ML:** scikit-learn + XGBoost for risk profiling. Isolation Forest for anomaly detection. Both as lightweight FastAPI endpoints.

**External APIs:**
- IMD — public data feeds + mocks where rate limits bite
- OpenWeatherMap as backup
- AQICN for air quality
- Razorpay test mode (sandbox through Phase 2)
- Zepto/Blinkit — simulated mock; no partner API access yet

**Infrastructure:** AWS EC2 + S3, Docker, GitHub Actions. Nothing exotic.

| Phase | What We're Doing |
|---|---|
| Phase 1 (now) | Architecture design, persona research, this README, initial tech spikes |
| Phase 2 (Weeks 3–4) | Working app: onboarding, policy management, premium calc, claims flow |
| Phase 3 (Weeks 5–6) | Fraud detection, payout simulation, insurer dashboard, demo |

---

## Adversarial Defense & Anti-Spoofing Strategy

*This section responds to the Market Crash scenario — a coordinated ring of 500 delivery workers using GPS-spoofing apps to fake locations inside red-alert weather zones and drain a platform's liquidity pool.*

---

Let's be direct: if your entire fraud defense is "check GPS coordinates," you deserve to get drained. GPS is a single signal from the device itself. Any app with mock location enabled beats it trivially. We knew this before the Market Crash scenario — it's why the Two-Key Rule exists. But the scenario raises a harder problem: **coordinated** fraud, which is different from individual fraud. Here's how we handle both.

---

### 1. Telling the Real Worker from the Spoofer

A delivery partner genuinely stranded in a flood zone looks very different from someone sitting at home with a spoofing app — not on GPS, but on everything else.

**Device sensor behavior**

A phone sitting still at home during a "storm" tells a completely different physical story than one carried by someone actually caught outdoors:

| Signal | Genuinely Stranded | GPS Spoofer at Home |
|---|---|---|
| Accelerometer | Irregular micro-movement — walking to shelter, rain vibration, bike leaning | Near-zero variance. Phone on a table. |
| Gyroscope | Frequent orientation changes — checking app, looking around | Flat. No rotation. |
| Barometric sensor | Pressure drop matching the storm system | Normal indoor pressure |
| Network signal strength | Degraded or fluctuating (towers get interference in heavy rain) | Full bars, stable |
| Battery drain | Elevated (GPS + network retries under bad signal) | Normal baseline |

We build a "stranded behavioral fingerprint" from these signals. No single sensor is conclusive — but the combination is very hard to fake without actually being in the disruption.

**Platform activity timeline**

This is the signal we're most confident about. A genuine disruption produces a specific sequence in the worker's platform log:

*Was active → disruption hit → activity went silent*

GPS spoofers tend to activate their app *before* the weather event triggers — they're watching the forecast. Our system sees the location "enter the flood zone" before disruption-level weather is even confirmed. Genuine workers show activity right up until conditions became impossible. The ordering matters.

**Cell tower triangulation vs GPS**

GPS spoofing apps fake the coordinates sent to our server. They cannot change which cell tower the phone is physically connected to. We run a parallel location estimate using cell tower IDs (available in Android network info) and Wi-Fi network positioning. If GPS says "Koramangala flood zone" but cell tower says the phone is in Whitefield, that's a hard flag. This isn't exotic technology — it's using what's already there.

---

### 2. Detecting the Ring, Not Just the Individual

Individual fraudsters are manageable. A coordinated ring of 500 people has a statistical signature that's hard to suppress.

**Temporal clustering**

When a real disruption hits, riders stop working *gradually*. Rain gets heavier. Some zones flood before others. Claim initiation timestamps spread across 20–40 minutes as conditions worsen progressively.

A fraud ring coordinates via Telegram: "red alert issued, everyone activate." Fifty people trigger simultaneously. We run a Poisson distribution test on claim initiation times per zone. A burst that deviates significantly from expected arrival rates gets flagged as coordinated. The only countermeasure is to not coordinate — which defeats the point of a ring.

**Social graph density**

We maintain an anonymized worker graph built from dark store co-affiliation, overlapping zone history, and (with consent) device proximity logs from Bluetooth/WiFi fingerprints in the app. When a fraud ring forms on Telegram, those workers already have social graph connections — they've worked the same zones.

When a spike in claims comes from a densely connected subgraph, that's statistically anomalous. In real disruptions, affected workers are geographically spread across the zone — not socially connected to each other. The pattern is distinct.

**Zone claim penetration asymmetry**

In a genuine flood, 80–95% of active workers in the zone are affected and claim. In coordinated fraud, a specific subset claims while others keep working. You see 30 claiming out of 90 active, with the 30 all linked to each other. The 60 who are still completing orders make the fraud visible.

Fraudsters can't know who else in the zone is or isn't claiming. This asymmetry is invisible to them.

**Tier-upgrade timing**

Fraudsters want maximum payout. We flag workers who upgrade from Shield Basic to Shield Max within 48–72 hours of a major storm appearing in the IMD forecast. That behavioral pattern doesn't show up in legitimate usage.

---

### 3. Flagging Without Punishing Honest Workers

This is the hardest part. Bad weather causes real network problems — dropped GPS lock, degraded signal, unreliable sensor readings. A genuine worker in a flood zone shouldn't lose his ₹320 because his phone's GPS was spotty.

```
AUTO-APPROVED   All signals consistent → payout in <90 seconds

SOFT FLAGGED    1–2 signals anomalous, rest consistent
                → Payout held 4 hours, then auto-releases
                   if no new anomalies appear
                → Worker sees: "Verifying your coverage —
                   you'll receive your payout within 4 hours"

HARD FLAGGED    Multiple signals inconsistent
                → Payout withheld
                → Worker gets a calm message asking for a
                   10-second geo-tagged video from their location
                → 48-hour review window
```

The 4-hour hold is intentional. A genuine worker in a storm has patchy GPS and weak signal — those signals look anomalous initially. But over 4 hours, his phone stays in the flood zone, his accelerometer shows movement, his battery drains. The genuine signature compounds.

A spoofer sitting at home shows the opposite: no movement, stable battery, full signal, no platform activity. Over 4 hours, the fraud signature gets stronger, not weaker. The hold punishes fraudsters more than honest workers.

**When a ring is detected:**

We don't punish the whole zone — we isolate the subgraph. Claims from the connected ring → Hard Flag. Claims from everyone else in the zone → continue processing normally. The ops team is alerted. Zepto/Blinkit are notified to cross-reference their own data. Ring members' renewals are blocked pending investigation.

---

### Why the Market Crash Syndicate Fails Against GigShield

The 500 GPS spoofers fail on five independent dimensions simultaneously:

1. Their accelerometers show a phone on a table, not a rider in a storm
2. Their cell towers place them at home, not in the flood zone
3. Their claim timestamps cluster unnaturally — Poisson test flags it
4. Their social graph is densely connected — ring detection fires
5. Legitimate workers in the same zone are still completing orders — the penetration asymmetry is obvious

Any one of these is a soft flag. Three or more is a hard flag. Five is a ring detection with ops escalation.

They beat GPS. They don't beat physics, cell towers, statistics, and graph theory simultaneously.

---

*We'll keep this updated as we build. Phase 2 code will be in this same repo.*

**Team:** [Your Team Name]
**Demo Video:** [Link]
