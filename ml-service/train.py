import os
import joblib
import numpy as np
import pandas as pd
from xgboost import XGBRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error

np.random.seed(42)

N = 2000

zone_disruption_count_12m = np.random.randint(0, 16, N)
zone_disruption_count_24m = zone_disruption_count_12m + np.random.randint(0, 11, N)
zone_type = np.random.randint(0, 4, N)
dark_store_tier = np.random.randint(0, 3, N)
seasonal_week_index = np.random.randint(1, 53, N)
worker_income_variance = np.random.uniform(0.05, 0.45, N)
worker_tenure_weeks = np.random.randint(0, 201, N)
historical_claim_rate = np.random.uniform(0, 0.8, N)

multiplier = 1.0
multiplier -= (zone_disruption_count_12m / 15.0) * 0.25
multiplier += (worker_tenure_weeks / 200.0) * 0.15
multiplier -= worker_income_variance * 0.2
multiplier += (1 - historical_claim_rate) * 0.1
multiplier += np.random.normal(0, 0.03, N)
multiplier = np.clip(multiplier, 0.70, 1.40)

df = pd.DataFrame(
    {
        "zone_disruption_count_12m": zone_disruption_count_12m,
        "zone_disruption_count_24m": zone_disruption_count_24m,
        "zone_type": zone_type,
        "dark_store_tier": dark_store_tier,
        "seasonal_week_index": seasonal_week_index,
        "worker_income_variance": worker_income_variance,
        "worker_tenure_weeks": worker_tenure_weeks,
        "historical_claim_rate": historical_claim_rate,
    }
)

y = multiplier

X_train, X_test, y_train, y_test = train_test_split(df, y, test_size=0.2, random_state=42)

model = XGBRegressor(
    n_estimators=180,
    max_depth=5,
    learning_rate=0.05,
    subsample=0.9,
    colsample_bytree=0.9,
    objective="reg:squarederror",
    random_state=42,
)

model.fit(X_train, y_train)
preds = model.predict(X_test)
mae = mean_absolute_error(y_test, preds)
print(f"Training complete. MAE: {mae:.4f}")

os.makedirs("model", exist_ok=True)
joblib.dump(model, "model/risk_model.pkl")
print("Saved model/risk_model.pkl")
