import os
import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI
import uvicorn
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Kavach ML Service")

ZONE_TYPE_MAP = {
    "residential_dense": 0,
    "commercial": 1,
    "mixed": 2,
    "industrial": 3,
}

DARK_STORE_MAP = {
    "zepto_gold": 0,
    "zepto_standard": 1,
    "blinkit_express": 2,
}

MODEL_PATH = "model/risk_model.pkl"
model = None

if os.path.exists(MODEL_PATH):
  model = joblib.load(MODEL_PATH)

class RiskProfileRequest(BaseModel):
    zone_disruption_count_12m: int
    zone_disruption_count_24m: int
    zone_type: str
    dark_store_tier: str
    seasonal_week_index: int
    worker_income_variance: float
    worker_tenure_weeks: int
    historical_claim_rate: float

@app.get('/health')
def health():
    return {"status": "ok", "model_loaded": model is not None}

@app.post('/risk/profile')
def risk_profile(payload: RiskProfileRequest):
    zt = ZONE_TYPE_MAP.get(payload.zone_type, 2)
    dst = DARK_STORE_MAP.get(payload.dark_store_tier, 1)

    row = pd.DataFrame([
        {
            "zone_disruption_count_12m": payload.zone_disruption_count_12m,
            "zone_disruption_count_24m": payload.zone_disruption_count_24m,
            "zone_type": zt,
            "dark_store_tier": dst,
            "seasonal_week_index": max(1, min(52, payload.seasonal_week_index)),
            "worker_income_variance": payload.worker_income_variance,
            "worker_tenure_weeks": payload.worker_tenure_weeks,
            "historical_claim_rate": payload.historical_claim_rate,
        }
    ])

    if model is None:
        multiplier = 0.90
    else:
        multiplier = float(model.predict(row)[0])

    multiplier = float(np.clip(multiplier, 0.70, 1.40))

    if multiplier > 1.1:
        description = "Low-risk zone. Bonus coverage applied."
    elif multiplier >= 0.9:
        description = "Moderate risk zone. Standard coverage."
    else:
        description = "Higher-risk zone. Coverage cap adjusted."

    return {"multiplier": round(multiplier, 4), "description": description}


if __name__ == "__main__":
    port = int(os.getenv("PORT", "5000"))
    uvicorn.run("main:app", host="0.0.0.0", port=port)
