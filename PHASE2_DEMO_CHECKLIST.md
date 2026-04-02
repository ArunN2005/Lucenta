# Phase 2 Demo Checklist (Automation & Protection)

## What You Already Have (Code Coverage)

- Registration Process:
  - Mobile onboarding + backend worker registration
  - Endpoint: `POST /api/auth/register`
- Insurance Policy Management:
  - Policy fetch and renewal flow
  - Endpoints: `GET /api/policy/:worker_id`, `POST /api/policy/renew/:worker_id`
- Dynamic Premium Calculation:
  - ML risk multiplier adjusts cap/premium outcome at registration/renewal
  - Backend fields: `risk_multiplier`, `adjusted_coverage_cap`
- Claims Management:
  - Auto-claim creation, listing, and payout simulation/mark-paid
  - Endpoint: `GET /api/claims/:worker_id`

## Trigger Automation (3-5 required)

Current implemented automated triggers:
- Heavy rain + high order-load signal
- Extreme heat + low acceptance signal
- Platform outage + drop signal

Trigger engine:
- Runs every 5 minutes (`node-cron`)
- Supports instant demo via `POST /api/demo/force-trigger-check`

## Zero-Touch UX Flow (What To Show)

1. Worker registers once.
2. App periodically sends activity heartbeat.
3. Disruption auto-detected by Two-Key Rule.
4. Claim auto-created with payout amount.
5. Payout auto-simulated/processed.
6. Worker only sees status updates in Dashboard/Claims.

No manual claim form needed.

## 2-Minute Video Script (Exact Sequence)

0:00-0:15
- Show app onboarding.
- Enter worker details and choose zone/tier.
- Tap "Activate Coverage".

0:15-0:35
- Show Dashboard: active policy, cap, risk level, days remaining.
- Mention dynamic pricing/risk-based protection.

0:35-0:55
- Tap logo 5 times to open Demo Panel.
- Select zone.
- Trigger one event (Rain or Heat or Outage).

0:55-1:15
- Tap "Force check now".
- Explain: Two independent signals are validated before claim creation.

1:15-1:40
- Open Claims tab.
- Show new claim record with status and amount.
- Mention automatic payout simulation.

1:40-2:00
- Return to Dashboard/Profile and show policy + activity continuity.
- Close with: "Kavach protects income with zero-touch disruption payouts."

## Recording Tips

- Keep backend + mock API running during recording.
- Use one clean scenario only (fast and clear).
- Zoom text if recording on high-resolution emulator.
- Include one short architecture slide at end (optional).

## Submission Pack

- Public video link (YouTube unlisted / Drive public link)
- Source code repo/folder
- This checklist + README
- Optional: one-page architecture summary screenshot
