<!--
  ╔══════════════════════════════════════════════════════════╗
  ║            LUCENTA — DEVTRAILS 2026 | PHASE 1            ║
  ║     Parametric Income Insurance · Q-Commerce Workers     ║
  ╚══════════════════════════════════════════════════════════╝
-->

<div align="center">

```
██╗     ██╗   ██╗ ██████╗███████╗███╗   ██╗████████╗ █████╗
██║     ██║   ██║██╔════╝██╔════╝████╗  ██║╚══██╔══╝██╔══██╗
██║     ██║   ██║██║     █████╗  ██╔██╗ ██║   ██║   ███████║
██║     ██║   ██║██║     ██╔══╝  ██║╚██╗██║   ██║   ██╔══██║
███████╗╚██████╔╝╚██████╗███████╗██║ ╚████║   ██║   ██║  ██║
╚══════╝ ╚═════╝  ╚═════╝╚══════╝╚═╝  ╚═══╝   ╚═╝   ╚═╝  ╚═╝
```

### Parametric Income Insurance for India's Q-Commerce Delivery Workers

**Guidewire DEVTrails 2026 · Phase 1 · Ideation & Foundation**

---

*When it rains in Bengaluru, 10-minute delivery still shows up at your door.*  
*The person who brought it? He went home empty-handed.*

---

</div>

---

We've been thinking about this problem for a while — not just as a hackathon prompt, but as something we've genuinely observed. One of our team members spent time talking to Zepto delivery partners near our college campus during last year's monsoon. The thing that stuck with us: these guys were losing ₹600–₹800 on a single bad-weather day, and their only "backup plan" was to not eat out that week.

That conversation is what Lucenta is built from.

---

## Table of Contents

1. [Background Research — What We Studied First](#background-research--what-we-studied-first)
2. [The Problem We're Actually Solving](#the-problem-were-actually-solving)
3. [Why We Picked Q-Commerce](#why-we-picked-q-commerce)
4. [Meet Arjun — Our Primary Persona](#meet-arjun--our-primary-persona)
5. [How Lucenta Works](#how-lucenta-works)
6. [Real Scenarios We Designed For](#real-scenarios-we-designed-for)
7. [The Weekly Premium Model](#the-weekly-premium-model)
8. [Parametric Triggers — The Two-Key Rule](#parametric-triggers--the-two-key-rule)
9. [AI/ML: What We're Actually Building](#aiml-what-were-actually-building)
10. [System Architecture](#system-architecture)
11. [Why Mobile, Not Web](#why-mobile-not-web)
12. [Tech Stack](#tech-stack)
13. [Adversarial Defense & Anti-Spoofing Strategy](#adversarial-defense--anti-spoofing-strategy)

---

## Background Research — What We Studied First

Before writing a single line of code or drawing a single diagram, we spent Week 1 trying to actually understand the problem space. Here's what we found — and what it changed about our thinking.

### The Gig Economy Income Volatility Problem

We started with the NITI Aayog's 2022 report on gig workers in India, which estimates **7.7 million gig workers** currently, projected to grow to **23.5 million by 2030**. Platform-based delivery workers represent the fastest-growing segment. The report also flags what it calls the "income volatility gap" — the absence of any financial protection for income disruptions that are external and uncontrollable.

We then looked at IWWAGE's 2021 survey of platform delivery workers, which found:
- Average monthly income of ₹14,000–₹18,000, with **20–30% monthly variance** due to disruptions
- Only **4% of workers** have any form of income insurance
- **67% reported losing income** due to weather in the past 6 months
- When asked what would most improve their financial security, **"some income when I can't work due to rain/floods"** ranked higher than health benefits

This last point is what started shaping our product direction. The instinct is to build health insurance for gig workers — that's what most proposals in this space do. But the workers themselves are telling us they want income protection first.

### How Parametric Insurance Actually Works

We spent time understanding the mechanics before assuming we could apply them here. Parametric insurance (also called index insurance) works differently from traditional insurance:

**Traditional:** You suffer a loss → you file a claim → an adjuster verifies → payout (weeks/months later)

**Parametric:** A pre-defined external trigger is crossed → automatic payout (minutes/hours later)

The key insight is that the payout isn't tied to your *actual* loss — it's tied to a *verified external event* that correlates strongly with loss. This eliminates the biggest costs in traditional insurance: claims processing, fraud investigation, and payout delay.

We looked at real-world parametric insurance deployments:
- **AXA's Fizzy** (flight delay insurance): pays automatically when FlightStats API confirms a delay >2 hours. No claims. No paperwork.
- **IBISA** (smallholder crop insurance in Africa): uses satellite rainfall data. Farmers get paid when rainfall index drops below threshold. Zero claim filing.
- **The Kenya Livestock Insurance Program**: uses satellite imagery of vegetation cover as a proxy for livestock mortality. Automatic payouts to herders.

The pattern across all of these: **parametric works best when the loss is highly correlated with a measurable external event, and when the payout population shares similar loss profiles.** Delivery workers in a flood zone fit this exactly — when the zone floods, *everyone* in it loses income, and the income loss is roughly proportional to hours lost.

### Why Existing Products Don't Fit

We looked at every insurance product currently marketed to gig workers in India:

| Product | Premium | Coverage | Why It Doesn't Fit |
|---|---|---|---|
| Digit Gig Worker Cover | ₹299/month | Accident, death, hospitalisation | Covers events that are rare. Ignores daily income disruption. |
| Bajaj Allianz Gig Shield | ₹399/month | Vehicle damage, hospitalisation | Worker already has own mechanic. Not his first worry. |
| ICICI Lombard Delivery Partner Plan | ₹249/month | Personal accident | Monthly model misaligns with weekly income cycle. |
| Platform self-insurance (Swiggy/Zomato) | Varies | Accident only during delivery | Doesn't cover weather disruptions at all. |

Not one of these covers income lost due to rain. Not one uses a parametric trigger. Not one is priced weekly. This told us the space is genuinely empty.

### The Q-Commerce Angle

We specifically studied Q-Commerce (Zepto, Blinkit, Swiggy Instamart) because it's the fastest-growing and most disruption-exposed segment. A few findings that shaped our product:

- Q-Commerce dark stores operate on **hyper-local zones of 1.5–2.5 km radius**. Riders are registered to exactly one dark store. There is no "switch to another zone" option.
- A single dark store going offline affects **30–80 registered riders** simultaneously — making zone-level parametric triggers highly accurate.
- Q-Commerce order frequency (5–8 orders/hour) means a 3-hour disruption at peak time costs a rider 15–24 orders — a significant and measurable loss.
- Zepto and Blinkit platform APIs expose **order assignment data in near-real-time** (or can be mocked accurately), making platform-side signal verification feasible.

### What We Decided Not to Build (and Why)

Understanding what not to build was as important as knowing what to build.

**Health insurance:** Workers already have fragmented access to government schemes (PMJAY, ESIC). Adding another health layer creates confusion, not value.

**Accident insurance:** Rare but catastrophic events need fundamentally different actuarial models. We don't have the expertise to do this responsibly in 6 weeks.

**Vehicle insurance:** This is already a competitive market. Riders have existing relationships with mechanics and informal repair networks. They don't want our version.

**Long-tail coverage:** Monthly or annual policies require upfront capital from workers who operate week-to-week. The premium timing alone kills adoption.

What's left — daily income protection from external disruptions, priced weekly, paid automatically — is narrow. But it's the only thing these workers are actually asking for. And narrowness, done well, is a product strategy.

---

## The Problem We're Actually Solving

India has roughly 5 million platform-based gig delivery workers. The ones we care about — Q-Commerce riders on Zepto and Blinkit — are working 10–12 hour days to enable our "10-minute grocery" habit. When it rains hard enough, or when Section 144 drops on a zone without warning, they go home with nothing.

The existing "solutions" are either nonexistent or completely misaligned — monthly health insurance plans that cost ₹300+/month and cover hospitalisation, not a day's lost wages. That's not what a rider needs when a flood shuts his zone for 6 hours on a Tuesday evening.

What he needs is: **₹400 in his UPI account by the time the rain stops.** No forms. No agent calls. No waiting.

That's the only thing Lucenta does. We think doing one thing right matters more than doing five things badly.

---

## Why We Picked Q-Commerce

We went back and forth on this. Food delivery (Zomato/Swiggy) was the obvious choice — bigger market, more visible. But the more we dug in, the more we realized Q-Commerce riders have a fundamentally worse disruption problem.

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

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│   ARJUN, 27                              Zepto · HSR Layout         │
│   Delivery Partner                       Bengaluru, Karnataka       │
│                                                                     │
│   ₹650 / day avg          10 AM – 11 PM shift                      │
│   ₹4,500 / week           Peak earning: 6 – 10 PM                  │
│   Supports family of 3    14 months on platform                     │
│                                                                     │
│   ────────────────────────────────────────────────────────────      │
│                                                                     │
│   "November 2023 floods. Lost ₹3,200 in four days.                 │
│    Found out from the WhatsApp group. No notification,              │
│    no compensation, nothing. I just had less money."                │
│                                                                     │
│   ────────────────────────────────────────────────────────────      │
│                                                                     │
│   WHAT HE NEEDS           WHAT HE DOESN'T NEED                     │
│   · ₹7/day or less        · Monthly premiums                       │
│   · Zero-touch payout     · Health/accident cover                  │
│   · UPI, not promises     · Agent calls or forms                   │
│   · Income protection     · Vehicle repair cover                   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

Arjun is not an abstraction. He's a composite of conversations we had with actual riders near our campus. The ₹3,200 number, the WhatsApp group detail, the "no notification" — these are real.

---

## How Lucenta Works

The entire product can be described in three words:

```
  ┌──────────────┐       ┌──────────────┐       ┌──────────────┐
  │              │       │              │       │              │
  │    DETECT    │ ───▶  │    DECIDE    │ ───▶  │   DISBURSE   │
  │              │       │              │       │              │
  │  Real-time   │       │  AI validates│       │  UPI payout  │
  │  disruption  │       │  claim in    │       │  in < 90s    │
  │  monitoring  │       │  < 90 secs   │       │  No action   │
  │              │       │              │       │  from worker │
  └──────────────┘       └──────────────┘       └──────────────┘
```

We monitor external disruption signals continuously. When a threshold is crossed and confirmed by a second independent signal (our Two-Key Rule), the system classifies it as a covered disruption, calculates what Arjun would have earned in that window based on his 4-week income average, and pushes the payout to his UPI.

He never filed anything. He never called anyone.

**Covered:** Income lost from weather (heavy rain, floods, extreme heat), civic disruptions (curfews, strikes, zone closures), platform-level outages that stop order assignment.

**Not covered — and we mean it:** Health. Accidents. Vehicle damage. Life cover. This is in the product design, not the fine print.

### Onboarding — Target: Under 5 Minutes

```
  STEP 1          STEP 2          STEP 3          STEP 4
  ┌──────┐        ┌──────┐        ┌──────┐        ┌──────┐
  │      │        │  QR  │        │ Zone │        │ Risk │
  │Phone │ ──▶    │ Scan │ ──▶    │ Auto │ ──▶    │ Tier │
  │+ OTP │        │      │        │ Det. │        │ Pick │
  └──────┘        └──────┘        └──────┘        └──────┘
   ~45s            ~30s            instant         ~60s

  STEP 5          STEP 6          STEP 7
  ┌──────┐        ┌──────┐        ┌──────┐
  │Income│        │ UPI  │        │      │
  │ Base │ ──▶    │  ₹1  │ ──▶    │ LIVE │
  │ line │        │Test  │        │      │
  └──────┘        └──────┘        └──────┘
   ~60s            ~30s            Done
```

No documents. No selfie-with-ID. No agent visit.

### Weekly Cycle

```
   MON          TUE — SUN           SUN             MON
  00:00                            23:59           00:00
    │                                │               │
    ▼                                ▼               ▼
  Premium ─────── Coverage Active ─────── Week   Premium
  deducted        ₹29 / ₹49 / ₹79         Closes  re-eval
  auto                                             + new week
```

Monday start is deliberate — Q-Commerce platform payouts settle Monday/Tuesday. The worker has money in hand when the premium comes out.

---

## Real Scenarios We Designed For

These aren't hypothetical. These situations have happened.

### Scenario 1 — The HSR Layout Cloudburst

> Wednesday evening, 7:30 PM. IMD red alert for South Bengaluru. Rainfall hits 68mm/hour. The Zepto dark store goes offline — their app stops assigning orders.

```
  7:30 PM   IMD flags red-alert rainfall in HSR Layout PIN cluster
     │
     ▼
  7:32 PM   Order volume in zone drops 78% — Two-Key confirmed
     │
     ▼
  7:33 PM   Arjun's phone: "Zone disruption detected. Coverage active."
     │         (He doesn't need to do anything)
     ▼
  7:34 PM   Payout calc: avg 7–10 PM earnings = ₹320 · 2.5 hrs disrupted
     │
     ▼
  7:35 PM   UPI transfer initiated  ←  90 seconds from trigger
```

### Scenario 2 — The Sudden Section 144

> A political rally turns tense. Section 144 imposed across three PIN codes at 6 PM with 15 minutes' notice.

System confirms: news NLP flags zone restriction → zero order assignments in PIN cluster → Arjun had the app open 30 minutes before. All three confirm. Payout for blocked hours, capped at 6 hrs/incident.

### Scenario 3 — Extreme Heat (Partial Disruption)

> May. Delhi. 44°C. AQI 425. Some riders still work. Customer volumes drop but don't collapse.

We classify this as a **partial disruption — 50% payout**. Some work is still possible, just risky and reduced. We don't pay full coverage for a situation that isn't a total shutdown. The 50% rule is a deliberate design decision, not a gap — it keeps our loss ratio honest.

---

## The Weekly Premium Model

### Why Weekly Pricing

We looked at this from Arjun's perspective. He gets paid daily or weekly. A monthly premium of ₹249 sounds small on paper. But for someone operating week-to-week without savings, it means paying ₹249 upfront from money he hasn't earned yet. It doesn't work.

Weekly pricing means the premium comes out of money he already has, covering the week he's about to work. It matches his financial rhythm exactly.

### The Three Tiers

| Tier | Weekly Premium | Daily Cost | Coverage Cap | Best For |
|---|---|---|---|---|
| **Lucenta Basic** | ₹29 / week | ₹4.14 / day | ₹800 | Part-time or new riders |
| **Lucenta Plus** ◄ TARGET | ₹49 / week | ₹7.00 / day | ₹1,500 | Full-time daily riders |
| **Lucenta Max** | ₹79 / week | ₹11.28 / day | ₹2,500 | High-earning, long-tenure riders |

Lucenta Plus at ₹7/day = less than one auto ride to the dark store.

### How AI Adjusts Coverage (Not Price)

We kept prices fixed and visible. Arjun doesn't need a premium that fluctuates — that creates anxiety and erodes trust. What the AI adjusts is the **coverage cap**, not the price.

```
  BASE TIER (₹49)  ──▶  Risk Model  ──▶  ADJUSTED CAP

  Low-disruption zone history    →  Cap × 1.15  (bonus)
  Stable income (low variance)   →  Cap × 1.0   (unchanged)
  Monsoon season, flood-prone    →  Cap × 0.85  (reduced)
  New worker, no history         →  Cap × 0.90  (conservative)
```

Same ₹49 every week. The risk-adjusted cap is visible in the app. No surprises.

**Financial targets:** Loss ratio 60–65% (parametric insurance standard). Max 2 payout events per worker per week. We'll stress-test the actuarial model in Phase 2 with simulated disruption scenarios against historical IMD data.

---

## Parametric Triggers — The Two-Key Rule

The single most important architectural decision we made:

> **No single data source can trigger a payout.**

We call this the Two-Key Rule. Every covered disruption requires two independent signals confirmed simultaneously. It eliminates false triggers from mild weather, and — critically — it makes GPS spoofing completely insufficient on its own.

| Trigger Type | Signal A — Primary | Signal B — Secondary | Payout |
|---|---|---|---|
| Heavy rain / flood | IMD red alert > 50mm/hr | Zone order volume drop > 70% | 100% |
| Extreme heat / AQI | IMD temp > 42°C OR AQI > 400 | Active rider drop in zone > 50% | 50% |
| Civic disruption | Govt/news NLP: curfew or strike keyword | Zero order assignments in PIN zone | 100% |
| Waterlogging | IMD flood warning + BBMP data | GPS cluster static > 45 min in zone | 100% |
| Platform outage | API heartbeat failure > 20 min | Worker app showing 0 available orders | 70% |

**Why platform order volume as Signal B?** This is the part we haven't seen done elsewhere. Traditional parametric systems only use weather APIs. But if Zepto orders are flowing despite bad weather, riders are clearly still working. The demand signal closes the loop that weather data alone can't — and it also makes GPS spoofing ineffective. You can fake a GPS location. You can't fake Zepto's order volume being down 75%.

---

## AI/ML: What We're Actually Building

Honest about this: we're not claiming a fully trained production ML system in 6 weeks. We're committing to a working implementation with real logic and real training where possible, clearly labeled mocks where we hit API walls.

### 1. Risk Profiling Model

**Algorithm:** XGBoost classifier  
**Training data:** Historical IMD disruption frequency by zone (public, downloadable), zone demographic data, seasonal patterns  
**Input features at inference:** zone disruption history (24 months), zone type, seasonal week index, dark store tier  
**Output:** Coverage multiplier 0.7x–1.4x applied to the worker's cap

### 2. Trigger Validation Engine

Rule-based at the top level (auditable, explainable), with an Isolation Forest running in parallel to catch anomalous claim distributions:

```
  IF   weather_signal_A == CONFIRMED
  AND  platform_volume_drop >= threshold    ← Signal B
  AND  worker_was_active_before_event       ← Prevents opportunistic claims
  THEN
       IF disruption is zone-wide (not individual)
            → TRIGGER PAYOUT FLOW
       ELSE → FLAG FOR REVIEW
```

### 3. Payout Calculation

```
  Payout = min(
      worker_avg_hourly_income × disrupted_hours,
      tier_coverage_cap
  ) × severity_multiplier

  Severity multipliers:
      Full zone shutdown   →  1.0×
      Platform outage      →  0.7×
      Partial disruption   →  0.5×
```

### 4. Fraud Detection (Phase 2 Build)

Three ML components — full design in the adversarial section:
- Device sensor fusion model (accelerometer + gyroscope + barometric + network)
- Social graph anomaly detector (ring detection via graph clustering)
- Historical behavioral comparator (baseline deviation detection)

---

## System Architecture

> The full system, from signal ingestion to payout disbursement.

```
╔══════════════════════════════════════════════════════════════════════╗
║                    EXTERNAL SIGNAL SOURCES                          ║
╠══════════════╦═══════════╦════════════════╦══════════╦══════════════╣
║  IMD Weather ║  AQICN    ║  Govt/News NLP ║ Platform ║ Device       ║
║  Rain·Heat   ║  Air Qual ║  Curfew·Strike ║ API Mock ║ Sensors      ║
║  Flood alerts║  Index    ║  Zone closures ║ Zepto/   ║ GPS·Accel    ║
║              ║           ║                ║ Blinkit  ║ Gyro·Baro    ║
╚══════╤═══════╩═════╤═════╩════════╤═══════╩════╤═════╩══════╤═══════╝
       │             │              │             │            │
       └─────────────┴──────────────┴─────────────┘            │ (sensor
                             │                                  │  stream)
                             ▼                                  │
╔══════════════════════════════════════════════════════════════╗│
║         APACHE KAFKA — Event Bus                             ║│
║  weather-signals · platform-signals · civic-signals          ║│
╚══════════════════════════════╤═══════════════════════════════╝│
                               │                                │
       ┌───────────────────────┼───────────────────────┐        │
       ▼                       ▼                       ▼        │
╔══════════════╗  ╔════════════════════╗  ╔════════════════╗    │
║   Trigger    ║  ║  Policy & Premium  ║  ║    Claims      ║    │
║  Validation  ║  ║     Engine         ║  ║    Engine      ║    │
║  Engine      ║  ║                    ║  ║                ║    │
║              ║  ║  XGBoost risk      ║  ║  Auto claim    ║    │
║  Two-Key     ║  ║  profiler          ║  ║  initiation    ║    │
║  Rule logic  ║  ║  Weekly tier calc  ║  ║  Payout calc   ║    │
║  Isolation   ║  ║  Coverage cap adj  ║  ║  Routes to:    ║    │
║  Forest check║  ║                    ║  ║  ✓ Approve     ║    │
║              ║  ║                    ║  ║  ~ Soft Hold   ║    │
║              ║  ║                    ║  ║  ✗ Hard Flag   ║    │
╚══════╤═══════╝  ╚═════════╤══════════╝  ╚═══════╤════════╝    │
       │                    │                      │             │
       └────────────────────┼──────────────────────┘            │
                            │                    ◄──────────────┘
                            ▼                   (sensor stream feeds
╔══════════════════════════════════════════════════════════════════════╗
║              ML INFERENCE LAYER  (Python · FastAPI)                 ║
╠══════════════════════════╦═══════════════════╦════════════════════╗ ║
║   FRAUD DETECTION ENGINE ║  RISK PROFILER    ║  PAYOUT CALC       ║ ║
║  ─────────────────────── ║  ──────────────── ║  ──────────────── ║ ║
║  Sensor fusion model     ║  XGBoost          ║  4-wk income avg  ║ ║
║  Social graph anomaly    ║  Zone history      ║  × disrupted hrs  ║ ║
║  Poisson clustering test ║  Seasonal risk    ║  Capped at tier   ║ ║
║  Zone penetration check  ║  → 0.7x–1.4x cap ║  × severity mult  ║ ║
║  → AUTO/SOFT/HARD FLAG   ║  multiplier       ║  Target: <90s     ║ ║
╚══════════════════════════╩═══════════════════╩════════════════════╝
                            │
       ┌────────────────────┴───────────────────────────┐
       ▼                    ▼                           ▼
╔════════════╗   ╔═══════════════════════╗   ╔══════════════════════╗
║ PostgreSQL ║   ║       Redis           ║   ║   Worker Social      ║
║ Workers    ║   ║  Real-time trigger    ║   ║   Graph              ║
║ Policies   ║   ║  state · Sessions     ║   ║  Zone co-affiliation ║
║ Claims     ║   ║  Rate limiting        ║   ║  Ring detection      ║
║ Zones      ║   ║                       ║   ║  Cluster anomaly     ║
║ Audit log  ║   ╚═══════════════════════╝   ╚══════════════════════╝
╚════════════╝
       │
       ▼
╔════════════════════════════════════════╗
║         PAYOUT & NOTIFICATION          ║
╠══════════════════════╦═════════════════╣
║  Razorpay Test Mode  ║  Push Service   ║
║  UPI Sandbox         ║  "Disruption    ║
║  ₹1 verification     ║   detected.     ║
║  Instant disburse    ║   Payout sent." ║
╚══════════════════════╩═════════════════╝
       │
       ▼
╔═══════════════════════════════════════════════════════╗
║                  CLIENT APPLICATIONS                  ║
╠═══════════════════════════╦═══════════════════════════╣
║     WORKER APP            ║    INSURER DASHBOARD      ║
║  React Native (Android)   ║    React (Web)            ║
║  Onboarding · Policy view ║    Live disruption map    ║
║  Disruption alerts        ║    Loss ratios · Claims   ║
║  Payout history           ║    Fraud ring alerts      ║
║  Sensor data stream       ║    Predictive risk view   ║
╚═══════════════════════════╩═══════════════════════════╝
```

### The Two-Key Rule — Visualized

```
  SIGNAL A            SIGNAL B
  (Weather/Civic)     (Platform Demand)
       │                    │
       ▼                    ▼
   IMD alerts          Zepto order
   cross threshold     volume drops
       │                70%+ in zone
       │                    │
       └────────┬───────────┘
                │
                ▼
         BOTH CONFIRMED?
          /            \
        YES              NO
         │                │
         ▼                ▼
    Disruption         No trigger.
    classified         Log signal,
         │             watch for
         ▼             second key.
    Fraud check
    (sensor + graph)
         │
    ┌────┴─────────────────────────┐
    │           │                  │
    ▼           ▼                  ▼
  AUTO        SOFT              HARD
 APPROVE      HOLD              FLAG
  <90s        4hrs              Review
  UPI out    then auto          + geo
             release            video
```

---

## Why Mobile, Not Web

Q-Commerce delivery partners live in their apps. Zepto's rider app is open 10+ hours a day. If Lucenta lives in a browser tab, it's already dead — they'll never look at it.

Three non-negotiable reasons for mobile:
1. **Push notifications** — the only way to reach a rider mid-shift about a disruption in real time
2. **Device sensor access** — accelerometer, gyroscope, barometric pressure, cell tower IDs — all needed for fraud detection, all only accessible from a native/PWA app
3. **UPI deep links** — frictionless payment confirmation is a native-mobile pattern

We're building React Native, Android-first. Roughly 85% of the riders we've spoken to are on Android. PWA fallback for iOS. The insurer/admin dashboard is web-only — those users are desk-based, so that's fine.

---

## Tech Stack

What we're actually going to use — not an aspirational list.

| Layer | Technology | Reason |
|---|---|---|
| Mobile App | React Native + Expo | Team familiarity — matters at hackathon pace. |
| Backend API | Node.js + Express | Fast iteration, JSON-native. |
| ML Inference | Python + FastAPI (microservice) | Separate service — ML and API iteration speeds differ. |
| Primary DB | PostgreSQL | Policies, workers, claims, zones, audit logs. |
| Cache / State | Redis | Real-time trigger state, session management, rate limiting. |
| Event Stream | Apache Kafka | Disruption signals fan out to multiple consumers and can't be dropped. |
| ML Models | XGBoost + Isolation Forest (scikit-learn) | Risk profiling + anomaly detection. Both deployed as FastAPI endpoints. |
| Weather APIs | IMD + OpenWeatherMap + AQICN | IMD primary. OWM backup. Mocked where rate-limited. |
| Platform APIs | Zepto / Blinkit mock | No partner API access yet. Simulated accurately. |
| Payments | Razorpay test mode + UPI sandbox | Sandbox through Phase 2. |
| Infrastructure | AWS EC2 + S3, Docker, GitHub Actions | Standard. Nothing exotic. |

### Development Timeline

| Phase | Timeline | What We're Doing |
|---|---|---|
| **Phase 1** | Weeks 1–2 (now) | Persona research, market study, architecture design, Two-Key Rule definition, this README, initial tech spikes |
| **Phase 2** | Weeks 3–4 | Working React Native app — onboarding, policy management, dynamic premium calc, claims engine, 3–5 disruption triggers with mock APIs |
| **Phase 3** | Weeks 5–6 | Fraud detection (sensor fusion + social graph), payout simulation via Razorpay sandbox, insurer dashboard, 5-min demo video, final pitch deck |

---

## Adversarial Defense & Anti-Spoofing Strategy

> **The Market Crash scenario:** A coordinated ring of 500 delivery workers organizes via Telegram. Using GPS-spoofing apps, they fake their locations inside a red-alert weather zone while sitting safely at home. They trigger mass false payouts, draining the platform's liquidity pool.

---

Let's be direct: if your entire fraud defense is "check GPS coordinates," you deserve to get drained. GPS is a single signal from the device itself. Any app with mock location enabled beats it trivially.

We knew this before the Market Crash scenario — it's why the Two-Key Rule exists. But a coordinated ring is a harder problem than individual fraud. The spoofed GPS still fails against our architecture, but for reasons that go deeper than the Two-Key Rule. Here's the full picture.

---

### 1. Telling the Real Worker from the Spoofer

A delivery partner genuinely stranded in a flood zone looks very different from someone sitting at home with a spoofing app — not on GPS, but on **everything else**.

**Device sensor behavior**

| Signal | Genuinely Stranded | GPS Spoofer at Home |
|---|---|---|
| **Accelerometer** | Irregular micro-movement — rain vibration, sheltering, bike leaning | Near-zero variance. Phone sitting still on a table. |
| **Gyroscope** | Frequent orientation shifts — checking app, looking around | Flat. No rotation at all. |
| **Barometric sensor** | Pressure drop matching the storm system | Normal indoor pressure. |
| **Network signal strength** | Degraded or fluctuating (tower interference in heavy rain) | Full bars, stable. No interference. |
| **Battery drain** | Elevated — GPS + network retries under bad signal | Normal baseline drain rate. |

We build a "stranded behavioral fingerprint" from the combination. No single sensor is conclusive — the combination is what's very hard to fake without actually being outside in the disruption.

**Platform activity timeline**

This is the signal we're most confident about. A genuine disruption produces a specific sequence in the worker's platform log:

```
  GENUINE WORKER                    GPS SPOOFER
  ─────────────────────────────────────────────────
  6:00 PM  Active, accepting orders  Spoofing app ON
  6:30 PM  Still active              "Enters" flood zone
  7:00 PM  RED ALERT issued          RED ALERT issued
  7:05 PM  Activity drops — can't    Claim triggered
           reach dark store
  7:10 PM  Claim auto-triggered

  KEY: Activity drops AFTER alert.  KEY: Location moves
  Sequence is: active → disruption  BEFORE alert. Sequence
  → silent.                         is: spoof → alert → claim.

  The ordering is different. Our system checks it.
```

**Cell tower triangulation vs GPS**

GPS spoofing apps fake the coordinates sent to our server. They cannot change which cell tower the phone is physically connected to. We run a parallel location estimate using cell tower IDs (available in Android network info) and Wi-Fi network positioning.

```
  GPS says:        "Koramangala flood zone"
  Cell tower says: "Whitefield"  ← phone is physically here

  → HARD FRAUD FLAG. Immediate.
```

This isn't exotic technology. It's using what's already there.

---

### 2. Detecting the Ring, Not Just the Individual

Individual fraudsters are manageable. A coordinated ring of 500 people has a **statistical signature** that's very hard to suppress.

**Temporal clustering — the Telegram problem**

When a real disruption hits, riders stop working gradually. Rain gets heavier. Some zones flood before others. Claim initiation timestamps spread across 20–40 minutes as conditions worsen progressively.

A fraud ring gets a Telegram message: *"red alert issued, everyone activate."* Fifty people trigger almost simultaneously.

```
  GENUINE DISRUPTION               COORDINATED FRAUD
  Claim timestamps:                Claim timestamps:

  7:02 ─ claim                    7:01 ─────────────── 12 claims
  7:06 ─ claim                    7:02 ─────────────────────── 23 claims
  7:11 ─ claim                    7:03 ──── 8 claims
  7:14 ─ claim                    7:31 ─ 1 claim (straggler)
  7:18 ─ claim
  7:22 ─ claim                    Poisson distribution test: FAIL
  7:29 ─ claim                    Burst anomaly: FLAGGED

  Poisson distribution: normal
```

The only countermeasure is to not coordinate — which defeats the point of a ring.

**Social graph density**

We maintain an anonymized worker graph built from dark store co-affiliation, overlapping zone history, and (with consent) device proximity logs from Bluetooth/WiFi fingerprints.

```
  GENUINE DISRUPTION               FRAUD RING
  Claims from workers in zone:     Claims from workers in zone:

    ○ — ○   ○   ○ — ○               ●—●—●—●
        |       |                   |   |   |
        ○   ○   ○ — ○               ●—●—●—●—●
                                    |       |
  Sparse connections.               ●———————●
  Geographically distributed.
                                  Dense subgraph.
  This is what random workers      They all know each other —
  affected by the same storm       worked the same dark store,
  look like. Low graph density.    met via Telegram group.
```

When a spike in claims comes from a densely connected subgraph, that's statistically anomalous. We flag the cluster.

**Zone claim penetration asymmetry**

In a genuine flood: 80–95% of active workers in the zone are affected and claim.

In coordinated fraud: a specific subset claims while others keep working. You see 30 claiming out of 90 active — and the 30 are all connected to each other, while the 60 who are completing orders are not.

Fraudsters can't know who else in the zone is or isn't claiming. This asymmetry is invisible to them, and obvious to us.

**Tier-upgrade timing**

Fraudsters want maximum payout. We flag workers who upgrade from Lucenta Basic to Lucenta Max within 48–72 hours of a major storm appearing in the IMD 5-day forecast. That pattern doesn't appear in legitimate usage.

---

### 3. Flagging Without Punishing Honest Workers

This is the hardest part. Bad weather causes real network problems — dropped GPS lock, degraded signal, unreliable sensor readings. A genuine worker in a flood zone shouldn't lose his ₹320 because his phone's GPS was spotty.

```
  ┌─────────────────────────────────────────────────────────────────┐
  │                  THREE-TIER CLAIM STATUS                        │
  ├─────────────────────────────────────────────────────────────────┤
  │                                                                 │
  │  ✓  AUTO-APPROVED                                               │
  │     All signals consistent.                                     │
  │     UPI payout in < 90 seconds.                                 │
  │                                                                 │
  ├─────────────────────────────────────────────────────────────────┤
  │                                                                 │
  │  ~  SOFT HOLD                                                   │
  │     1–2 signals anomalous, rest consistent.                     │
  │     Payout held for 4 hours, then auto-released                 │
  │     if no new anomalies appear.                                 │
  │     Worker sees: "Verifying your coverage —                     │
  │     you'll receive your payout within 4 hours."                 │
  │     (Not "suspected of fraud." Just "verifying.")               │
  │                                                                 │
  ├─────────────────────────────────────────────────────────────────┤
  │                                                                 │
  │  ✗  HARD FLAG                                                   │
  │     Multiple signals inconsistent.                              │
  │     Payout withheld.                                            │
  │     Worker gets a calm, non-accusatory message:                 │
  │     "We couldn't automatically verify your location.            │
  │      Please record a quick 10-second video from                 │
  │      where you are. We'll review within 2 hours."              │
  │     Geo-tagged video is the final verification layer.           │
  │                                                                 │
  └─────────────────────────────────────────────────────────────────┘
```

**Why the 4-hour hold works against fraudsters more than honest workers:**

A genuine worker in a storm has patchy GPS and weak signal — those signals look anomalous initially. But over 4 hours, his phone stays in the flood zone, his accelerometer keeps showing movement, his battery keeps draining. The genuine signature compounds. Signal resolves to "real."

A spoofer sitting at home shows the opposite: no movement, stable battery, full signal, no platform activity. Over 4 hours, the fraud signature gets stronger, not weaker. The hold punishes fraudsters proportionally more.

**When a ring is detected:**

We don't punish the whole zone. We isolate the subgraph. Claims from the connected ring → Hard Flag. Claims from everyone else in the same zone → continue processing normally. Ops team gets alerted. Zepto/Blinkit get notified to cross-reference their data. Ring members' renewals are blocked pending investigation.

---

### Why the Market Crash Syndicate Fails Against Lucenta

```
  THE 500-PERSON GPS SPOOFING RING FAILS ON 5 INDEPENDENT DIMENSIONS:

  [1] Accelerometers   →  Phones on tables, not riders in storms
                          Sensor fusion model catches it

  [2] Cell towers      →  Physical location is home, not flood zone
                          Triangulation catches it

  [3] Timestamps       →  50 simultaneous claims breaks Poisson
                          Temporal clustering catches it

  [4] Social graph     →  Dense ring = anomalous subgraph
                          Graph detector catches it

  [5] Zone penetration →  30 claiming while 60 are still delivering
                          Asymmetry is obvious

  Any 1 of these  →  Soft Hold
  Any 3 of these  →  Hard Flag
  All 5           →  Ring detection + ops escalation
```

They beat GPS. They don't beat physics, cell towers, statistics, and graph theory simultaneously.

The syndicates exploited a system that trusted a single signal. We never did.

---

<div align="center">

```
  ─────────────────────────────────────────────────────────
  Built for the last mile. Defended against those who'd
  exploit the people who work it.
  ─────────────────────────────────────────────────────────
```

*Phase 2 code will be in this same repo. This README will grow with the build.*

**Team:** [Your Team Name]  
**Demo Video:** [Link]

</div>
