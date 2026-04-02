# Kavach

Kavach is a parametric income insurance platform for Q-commerce delivery workers, built for automatic disruption payouts. It uses a Two-Key Rule where two independent signals confirm a disruption before any payout is initiated. Riders do not file claims; policy checks, disruption detection, claim creation, payout simulation, and notifications are all automated.

## Folder Structure

- mobile: React Native + Expo app (Android-first)
- backend: Node.js + Express API + trigger engine
- ml-service: FastAPI + XGBoost risk multiplier service
- mock-platform-api: Simulated platform telemetry API for Zepto/Blinkit demo triggers
- docker-compose.yml: Local PostgreSQL + Redis

## How To Run

1. `docker-compose up -d`
2. `cd backend && npm install && npm run dev`
3. `cd ml-service && pip install -r requirements.txt && python train.py && uvicorn main:app --port 8001`
4. `cd mock-platform-api && npm install && node index.js`
5. `cd mobile && npm install && npx expo start`

## One-Command Local Startup (Windows)

To run the full local stack (postgres, redis, backend, ml-service, mock-platform-api, and mobile) in one shot:

1. `cd kavach`
2. `./start-dev.ps1`

Note: Docker Desktop must be running before `./start-dev.ps1`. The script now exits early if Redis is not reachable.

To stop all processes started by that script:

1. `cd kavach`
2. `./stop-dev.ps1`

## Environment Variables

### backend/.env

- DATABASE_URL
- REDIS_URL
- OWM_API_KEY
- RAZORPAY_KEY_ID
- RAZORPAY_KEY_SECRET
- MOCK_PLATFORM_API_URL
- ML_SERVICE_URL
- PORT
- DEMO_MODE

Notes:
- The included backend env is preconfigured for Supabase PostgreSQL with SSL handling enabled in code.
- Docker PostgreSQL is optional if using Supabase directly.

### ml-service/.env

- PORT=8001

### mobile/app.json extra

- API_BASE_URL (must be LAN IP reachable from Android device)
- MOCK_PLATFORM_API_URL (must be LAN IP reachable from Android device)

## Demo Walkthrough (90 sec)

1. Open mobile app and register worker in any zone with tier.
2. On Dashboard, tap Kavach logo 5 times to open Demo Panel.
3. Select zone and trigger one scenario (Rain/Heat/Outage).
4. Tap Force check now.
5. Backend trigger engine validates Two-Key signals, creates disruption, finds active workers, creates claim, simulates payout, updates claim as paid, and sends push notification.
6. Return to Dashboard/Claims and show payout reflected in UI.

## Key Endpoints

- POST /api/auth/register
- GET /api/worker/:worker_id
- GET /api/policy/:worker_id
- POST /api/policy/renew/:worker_id
- GET /api/claims/:worker_id
- GET /api/disruptions/active
- POST /api/worker/activity
- GET /api/zones
- POST /api/demo/force-trigger-check
- GET /api/demo/trigger-status

## Notes

- Trigger engine runs every 5 minutes (node-cron) and supports force-run endpoint for demo.
- Duplicate disruptions are prevented for same zone and type within a 2-hour window.
- Payout is capped at adjusted policy cap and rounded to nearest integer.
- If Razorpay payout API is not available in test mode, payout is simulated and claim is marked paid.
