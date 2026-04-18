# Week 6 Final Submission Package

This file consolidates all final artefacts needed for judging submission.

## 1. Demo Video (5 minutes)

Upload target:
- Public YouTube (Unlisted) or Drive link with public viewer access

Mandatory scenes to include:
1. Worker onboarding and weekly policy activation.
2. Live disruption simulation from Demo Panel (heavy rain, heat, or outage).
3. Trigger engine run and automatic claim creation.
4. Fraud defense demo:
- Click Simulate GPS Spoof (Fraud Test).
- Trigger a disruption and show claim moved to fraud_blocked or fraud_review.
5. Instant payout simulation:
- Show processing to paid transition in Claims.
- Highlight simulated payment rails: razorpay_test, stripe_sandbox, upi_simulator.
6. Dashboard walkthrough:
- Worker dashboard: earnings protected, active weekly coverage.
- Admin dashboard: loss ratio, disruption mix, next-week forecast.

Suggested timeline:
- 0:00-0:45: Problem and worker persona
- 0:45-1:45: Worker onboarding and policy
- 1:45-2:45: Disruption trigger and claim automation
- 2:45-3:30: Instant payout status movement
- 3:30-4:10: Fraud detection (GPS spoof + weather anomaly narration)
- 4:10-5:00: Admin intelligence and business summary

## 2. Final Pitch Deck (PDF)

Output format:
- Exported PDF named Week6_Kavach_PitchDeck.pdf

Minimum slide structure:
1. Title and team
2. Delivery persona and pain point
3. Product concept and user journey
4. Parametric trigger architecture (Two-Key Rule)
5. Advanced fraud architecture
- GPS spoof detection via telemetry and impossible jump checks
- Fake weather claim defense with historical anomaly scoring
6. Instant payout architecture
- Simulated gateway strategy and payout lifecycle
7. Intelligent dashboard outputs
- Worker value metrics
- Insurer risk and forecasting metrics
8. Weekly pricing model and business viability
9. Traction, demo outcomes, and roadmap
10. Ask and closing

## 3. Repository Artefacts to Include

- Backend + mobile source code
- README with setup and architecture
- PHASE2_DEMO_CHECKLIST.md
- WEEK6_FINAL_SUBMISSION_PACKAGE.md (this file)
- Any architecture diagrams and screenshots used in the deck

## 4. Final Verification Checklist

- Backend starts and /health returns success.
- Mobile app connects to backend from emulator/Expo Go.
- Demo trigger generates claim automatically.
- Paid claim appears after simulated async payout.
- Fraud simulation can produce a blocked/review claim.
- Admin dashboard loads insights and forecast.
- All links in submission are publicly accessible.
