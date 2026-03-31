from __future__ import annotations

from pathlib import Path
from typing import Dict, Tuple

import joblib
import numpy as np
from sklearn.ensemble import GradientBoostingClassifier, GradientBoostingRegressor, IsolationForest
from sklearn.linear_model import LogisticRegression

BASE_DIR = Path(__file__).resolve().parent
MODELS_DIR = BASE_DIR / "models"

RISK_MODEL_PATH = MODELS_DIR / "risk_model.pkl"
WORK_PROOF_MODEL_PATH = MODELS_DIR / "work_proof_model.pkl"
FRAUD_MODEL_PATH = MODELS_DIR / "fraud_model.pkl"
RING_DETECTOR_PATH = MODELS_DIR / "ring_detector.pt"


class ModelHub:
    def __init__(self) -> None:
        MODELS_DIR.mkdir(parents=True, exist_ok=True)
        self._ensure_models()
        self.risk_model: GradientBoostingRegressor = joblib.load(RISK_MODEL_PATH)
        self.work_proof_model: GradientBoostingClassifier = joblib.load(WORK_PROOF_MODEL_PATH)
        self.fraud_model: IsolationForest = joblib.load(FRAUD_MODEL_PATH)
        self.ring_model: LogisticRegression = joblib.load(RING_DETECTOR_PATH)

    def _ensure_models(self) -> None:
        if not RISK_MODEL_PATH.exists():
            self._train_risk_model()
        if not WORK_PROOF_MODEL_PATH.exists():
            self._train_work_proof_model()
        if not FRAUD_MODEL_PATH.exists():
            self._train_fraud_model()
        if not RING_DETECTOR_PATH.exists():
            self._train_ring_model()

    def _train_risk_model(self) -> None:
        rng = np.random.default_rng(42)
        n = 5000
        precipitation = rng.uniform(0, 120, n)
        temperature = rng.uniform(12, 48, n)
        news_count = rng.integers(0, 20, n)
        aqi = rng.integers(20, 420, n)

        X = np.column_stack([precipitation, temperature, news_count, aqi])

        # Synthetic target: weather + heat + pollution + corroborating news.
        y = (
            np.clip(precipitation / 80, 0, 1) * 0.45
            + np.clip((temperature - 38) / 10, 0, 1) * 0.2
            + np.clip((aqi - 120) / 220, 0, 1) * 0.25
            + np.clip(news_count / 8, 0, 1) * 0.1
        )
        y = np.clip(y, 0, 1)

        model = GradientBoostingRegressor(random_state=42)
        model.fit(X, y)
        joblib.dump(model, RISK_MODEL_PATH)

    def _train_work_proof_model(self) -> None:
        rng = np.random.default_rng(7)
        n = 4500
        active_minutes = rng.integers(1, 121, n)
        recency_mins = rng.uniform(0, 120, n)
        ip_match = rng.integers(0, 2, n)
        chain_valid = rng.integers(0, 2, n)
        heartbeat_count = np.maximum(active_minutes + rng.integers(-3, 4, n), 1)

        X = np.column_stack([active_minutes, recency_mins, ip_match, chain_valid, heartbeat_count])

        score = (
            np.clip(active_minutes / 45, 0, 1) * 0.35
            + (1 - np.clip(recency_mins / 40, 0, 1)) * 0.2
            + ip_match * 0.15
            + chain_valid * 0.2
            + np.clip(heartbeat_count / 60, 0, 1) * 0.1
        )
        y = (score > 0.62).astype(int)

        model = GradientBoostingClassifier(random_state=7)
        model.fit(X, y)
        joblib.dump(model, WORK_PROOF_MODEL_PATH)

    def _train_fraud_model(self) -> None:
        rng = np.random.default_rng(11)
        n = 3500

        # Mostly normal sessions around 60s heartbeat with natural jitter.
        avg_gap = rng.normal(60000, 5000, n)
        jitter = np.abs(rng.normal(900, 450, n))
        heartbeat_count = rng.integers(5, 70, n)
        X = np.column_stack([avg_gap, jitter, heartbeat_count])

        model = IsolationForest(contamination=0.12, random_state=11)
        model.fit(X)
        joblib.dump(model, FRAUD_MODEL_PATH)

    def _train_ring_model(self) -> None:
        rng = np.random.default_rng(21)
        n = 6000

        ip_subnet_diversity = rng.uniform(0.02, 1.0, n)
        timestamp_entropy = rng.uniform(0.0, 1.0, n)
        workproof_variance = rng.uniform(0.0, 0.4, n)
        size = rng.integers(2, 120, n)

        X = np.column_stack([ip_subnet_diversity, timestamp_entropy, workproof_variance, size])

        suspicious = (
            (ip_subnet_diversity < 0.2).astype(int)
            + (timestamp_entropy < 0.35).astype(int)
            + (workproof_variance < 0.08).astype(int)
            + (size > 18).astype(int)
        )
        y = (suspicious >= 2).astype(int)

        model = LogisticRegression(max_iter=300, random_state=21)
        model.fit(X, y)
        joblib.dump(model, RING_DETECTOR_PATH)

    def predict_environment_risk(self, precipitation: float, temp: float, news_count: int, aqi: float) -> float:
        X = np.array([[precipitation, temp, news_count, aqi]])
        return float(np.clip(self.risk_model.predict(X)[0], 0, 1))

    def predict_work_proof(self, active_minutes: int, recency_mins: float, ip_match: bool, chain_valid: bool, heartbeat_count: int) -> float:
        X = np.array([[active_minutes, recency_mins, int(ip_match), int(chain_valid), heartbeat_count]])
        proba = self.work_proof_model.predict_proba(X)[0][1]
        return float(np.clip(proba, 0, 1))

    def predict_fraud_anomaly(self, avg_gap_ms: float, jitter_ms: float, heartbeat_count: int) -> Tuple[float, bool]:
        X = np.array([[avg_gap_ms, jitter_ms, heartbeat_count]])
        decision = float(self.fraud_model.decision_function(X)[0])
        pred = int(self.fraud_model.predict(X)[0])

        # Convert isolation score to 0..1 anomaly scale
        anomaly = float(np.clip(0.5 - decision, 0, 1))
        is_anomaly = pred == -1
        return anomaly, is_anomaly

    def predict_ring_probability(
        self,
        ip_subnet_diversity: float,
        timestamp_entropy: float,
        workproof_variance: float,
        cluster_size: int,
    ) -> float:
        X = np.array([[ip_subnet_diversity, timestamp_entropy, workproof_variance, cluster_size]])
        proba = self.ring_model.predict_proba(X)[0][1]
        return float(np.clip(proba, 0, 1))


model_hub = ModelHub()
