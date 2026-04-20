"""
KavachPay ModelHub — v3.0
=========================
Training strategy:
  Pillar 1 (Fraud / Bot Detection)  — IsolationForest on dual-population data:
    human sessions (messy natural jitter) vs. bot sessions (robotic precision).
  Pillar 2 (Environmental Risk)      — GradientBoostingRegressor trained on REAL
    historical weather fetched from Open-Meteo Historical API for 5 Indian cities.
  Pillar 3 (Work-Proof Validator)    — GradientBoostingClassifier now includes
    login_hour and accepts the backend-computed chain_valid flag.
  Pillar 4 (Fraud Ring Detector)    — PyTorch GCN (Graph Convolutional Network)
    trained on graph-structured synthetic data representing real & fraud clusters.
"""

from __future__ import annotations

import logging
import math
import os
import warnings
from pathlib import Path
from typing import List, Optional, Tuple

import joblib
import numpy as np
import requests

logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent
MODELS_DIR = BASE_DIR / "models"

RISK_MODEL_PATH = MODELS_DIR / "risk_model.pkl"
WORK_PROOF_MODEL_PATH = MODELS_DIR / "work_proof_model.pkl"
FRAUD_MODEL_PATH = MODELS_DIR / "fraud_model.pkl"
RING_GNN_PATH = MODELS_DIR / "ring_gnn.pt"           # PyTorch save — true .pt
RING_META_PATH = MODELS_DIR / "ring_gnn_meta.pkl"    # stores threshold + scaler info

# ─────────────────────────────────────────────
# Historical weather fetch (Open-Meteo — free, no API key)
# ─────────────────────────────────────────────

INDIAN_CITIES = {
    "Bengaluru": (12.9716, 77.5946),
    "Mumbai":    (19.0760, 72.8777),
    "Delhi":     (28.6139, 77.2090),
    "Chennai":   (13.0827, 80.2707),
    "Hyderabad": (17.3850, 78.4867),
}


def _fetch_real_weather_data() -> np.ndarray:
    """
    Fetch 2 years of real daily weather from Open-Meteo Historical API.
    Returns array of shape (N, 3): [daily_precip_mm, daily_max_temp_c, day_of_year]
    Falls back to realistic synthetic if API is unavailable.
    """
    url = "https://archive-api.open-meteo.com/v1/archive"
    all_rows: list = []

    for city, (lat, lon) in INDIAN_CITIES.items():
        try:
            params = {
                "latitude": lat,
                "longitude": lon,
                "start_date": "2023-01-01",
                "end_date": "2024-12-31",
                "daily": "precipitation_sum,temperature_2m_max",
                "timezone": "Asia/Kolkata",
            }
            resp = requests.get(url, params=params, timeout=30)
            resp.raise_for_status()
            data = resp.json().get("daily", {})
            precip_list = data.get("precipitation_sum") or []
            temp_list   = data.get("temperature_2m_max") or []

            for i, (p, t) in enumerate(zip(precip_list, temp_list)):
                if p is None or t is None:
                    continue
                # news_count proxy: more disruption news on heavy rain / heat days
                news_proxy = max(0, int((p / 20) + max(0, (t - 40) / 2)))
                # aqi proxy: higher AQI in winter (Oct–Feb in India)
                day_of_year = (i % 365) + 1
                is_winter = day_of_year < 60 or day_of_year > 300
                aqi_proxy = int(np.random.default_rng(i).uniform(60, 250 if is_winter else 120))
                all_rows.append([float(p), float(t), float(news_proxy), float(aqi_proxy)])

            logger.info("Fetched %d real weather records for %s", len(precip_list), city)
        except Exception as exc:
            logger.warning("Open-Meteo fetch failed for %s: %s", city, exc)

    if len(all_rows) >= 200:
        return np.array(all_rows, dtype=float)

    # ── Fallback: realistic India-calibrated synthetic ──────────────────────
    logger.warning("Using synthetic weather fallback (no network or quota exceeded).")
    rng = np.random.default_rng(99)
    n = 3650  # ~10 city-years
    # India: most rain in monsoon (Jun–Sep), extreme heat Apr–Jun
    day = rng.integers(1, 366, n)
    is_monsoon = ((day > 150) & (day < 270)).astype(float)
    is_heat    = ((day > 90) & (day < 180)).astype(float)
    precip = rng.exponential(5, n) * (1 + is_monsoon * 8) * rng.uniform(0.5, 1.5, n)
    temp   = rng.normal(32, 5, n) + is_heat * 8 - is_monsoon * 4
    temp   = np.clip(temp, 12, 50)
    precip = np.clip(precip, 0, 200)
    news   = (precip / 20 + np.maximum(0, (temp - 40) / 2)).astype(int)
    aqi    = rng.uniform(60, 280, n)
    return np.column_stack([precip, temp, news, aqi])


# ─────────────────────────────────────────────
# PyTorch GNN for Pillar 4
# ─────────────────────────────────────────────

def _build_gnn_model():
    """Lazy-import torch so the service still starts if torch isn't installed yet."""
    try:
        import torch
        import torch.nn as nn
        import torch.nn.functional as F
    except ImportError:
        return None, None

    class GCNConvManual(nn.Module):
        """
        Manual single-layer GCN without torch_geometric dependency.
        Computes: H' = D^{-1/2} A D^{-1/2} H W
        """
        def __init__(self, in_features: int, out_features: int):
            super().__init__()
            self.linear = nn.Linear(in_features, out_features, bias=False)

        def forward(self, x, adj):
            # adj: [N, N] symmetric adjacency (self-loops added externally)
            deg = adj.sum(dim=1, keepdim=True).clamp(min=1)
            d_inv_sqrt = deg.pow(-0.5)
            norm_adj = d_inv_sqrt * adj * d_inv_sqrt.T
            return F.relu(self.linear(norm_adj @ x))

    class FraudRingGNN(nn.Module):
        """
        Graph-level binary classifier for fraud ring detection.
        Input: node feature matrix X [N, 4], adjacency A [N, N]
        Output: [fraud_prob] scalar via global mean pool
        """
        def __init__(self, in_features: int = 4, hidden: int = 32):
            super().__init__()
            self.conv1 = GCNConvManual(in_features, hidden)
            self.conv2 = GCNConvManual(hidden, 16)
            self.classifier = nn.Sequential(
                nn.Linear(16, 8),
                nn.ReLU(),
                nn.Linear(8, 1),
                nn.Sigmoid(),
            )

        def forward(self, x, adj):
            h = self.conv1(x, adj)
            h = self.conv2(h, adj)
            # Global mean pooling → graph-level embedding
            g = h.mean(dim=0, keepdim=True)   # [1, 16]
            return self.classifier(g).squeeze()  # scalar

    return FraudRingGNN, torch


def _generate_ring_graphs(n_graphs: int, is_fraud: bool, rng: np.random.Generator):
    """
    Generate graph-structured training samples for the GNN.

    Each sample = (node_features [N,4], adjacency [N,N], label int)
    Node features: [ip_subnet_norm, minute_bucket_norm, work_proof_score, log_cluster_size]
    """
    graphs = []
    for _ in range(n_graphs):
        if is_fraud:
            # Fraud ring: 8-200 nodes, 1-2 /24 subnets, same minute bucket, identical work scores
            n_nodes = int(rng.integers(8, 80))
            n_subnets = int(rng.integers(1, 3))
            subnet_ids = rng.integers(0, n_subnets, n_nodes)
            ip_subnet_norm = (subnet_ids / max(n_subnets, 1)).astype(float) + rng.uniform(0, 0.02, n_nodes)
            # Coordinated: all within 1-2 minute buckets
            n_minute_buckets = int(rng.integers(1, 3))
            minute_ids = rng.integers(0, n_minute_buckets, n_nodes)
            minute_norm = (minute_ids / max(n_minute_buckets, 1)).astype(float) + rng.uniform(0, 0.01, n_nodes)
            # Nearly identical low work-proof scores (bot-generated)
            base_score = rng.uniform(0.2, 0.5)
            work_proof = np.clip(base_score + rng.normal(0, 0.02, n_nodes), 0, 1)
        else:
            # Organic: 2-15 nodes, diverse IPs, spread timestamps, varied scores
            n_nodes = int(rng.integers(2, 15))
            ip_subnet_norm = rng.uniform(0.1, 1.0, n_nodes)
            minute_norm    = rng.uniform(0.0, 1.0, n_nodes)
            work_proof     = rng.uniform(0.4, 1.0, n_nodes)

        log_size = math.log1p(n_nodes) / math.log1p(200)  # normalized log cluster size
        size_feat = np.full(n_nodes, log_size)

        X = np.column_stack([ip_subnet_norm, minute_norm, work_proof, size_feat]).astype(np.float32)

        # Build adjacency: edge if same /24 subnet OR same minute bucket
        adj = np.zeros((n_nodes, n_nodes), dtype=np.float32)
        for i in range(n_nodes):
            for j in range(n_nodes):
                if i == j:
                    adj[i, j] = 1.0  # self-loop
                    continue
                same_subnet = abs(ip_subnet_norm[i] - ip_subnet_norm[j]) < 0.05
                same_minute = abs(minute_norm[i] - minute_norm[j]) < 0.05
                if same_subnet or same_minute:
                    adj[i, j] = 1.0

        graphs.append((X, adj, int(is_fraud)))
    return graphs


def _train_ring_gnn(FraudRingGNN, torch) -> None:
    """Train the PyTorch GCN on synthetic fraud / organic graph pairs."""
    import torch.nn as nn
    from torch.optim import Adam

    rng = np.random.default_rng(42)
    n_each = 1200   # 1200 fraud + 1200 organic = 2400 total graphs (50% more data)

    fraud_graphs   = _generate_ring_graphs(n_each, is_fraud=True,  rng=rng)
    organic_graphs = _generate_ring_graphs(n_each, is_fraud=False, rng=rng)
    all_graphs     = fraud_graphs + organic_graphs
    rng.shuffle(all_graphs)

    model = FraudRingGNN(in_features=4, hidden=48)   # larger hidden: richer graph representations
    optimizer = Adam(model.parameters(), lr=0.003, weight_decay=1e-4)  # lower lr → smoother convergence
    loss_fn = nn.BCELoss()

    model.train()
    n_epochs = 80   # more epochs with lower lr
    for epoch in range(n_epochs):
        epoch_loss = 0.0
        rng.shuffle(all_graphs)
        for X_np, adj_np, label in all_graphs:
            X   = torch.tensor(X_np, dtype=torch.float32)
            adj = torch.tensor(adj_np, dtype=torch.float32)
            y   = torch.tensor(float(label), dtype=torch.float32)

            optimizer.zero_grad()
            pred = model(X, adj)
            loss = loss_fn(pred, y)
            loss.backward()
            optimizer.step()
            epoch_loss += loss.item()

        if (epoch + 1) % 20 == 0:
            logger.info("GNN training epoch %d/%d  loss=%.4f", epoch + 1, n_epochs, epoch_loss / len(all_graphs))

    torch.save(model.state_dict(), RING_GNN_PATH)
    joblib.dump({"in_features": 4, "hidden": 48}, RING_META_PATH)  # match new hidden dim
    logger.info("GNN saved to %s", RING_GNN_PATH)


# ─────────────────────────────────────────────
# ModelHub
# ─────────────────────────────────────────────

class ModelHub:
    def __init__(self) -> None:
        from sklearn.ensemble import (
            GradientBoostingClassifier,
            GradientBoostingRegressor,
            IsolationForest,
        )
        from sklearn.exceptions import InconsistentVersionWarning

        self._InconsistentVersionWarning = InconsistentVersionWarning

        MODELS_DIR.mkdir(parents=True, exist_ok=True)
        self._ensure_models()

        self.risk_model: GradientBoostingRegressor = self._load_or_retrain(
            RISK_MODEL_PATH,
            self._train_risk_model,
            "Pillar 2 risk",
        )
        self.work_proof_model: GradientBoostingClassifier = self._load_or_retrain(
            WORK_PROOF_MODEL_PATH,
            self._train_work_proof_model,
            "Pillar 3 work-proof",
        )
        self.fraud_model: IsolationForest = self._load_or_retrain(
            FRAUD_MODEL_PATH,
            self._train_fraud_model,
            "Pillar 1 fraud",
        )

        # Load GNN (optional — graceful fallback to heuristics if torch unavailable)
        self._gnn = None
        self._torch = None
        self._load_gnn()

    def _load_or_retrain(self, model_path: Path, train_fn, label: str):
        def _load_once():
            with warnings.catch_warnings(record=True) as captured:
                warnings.simplefilter("always", self._InconsistentVersionWarning)
                loaded = joblib.load(model_path)

            mismatch = any(
                issubclass(w.category, self._InconsistentVersionWarning) for w in captured
            )
            return loaded, mismatch

        try:
            model, has_version_mismatch = _load_once()
        except Exception as exc:
            logger.warning("%s model load failed at %s (%s). Retraining.", label, model_path, exc)
            train_fn()
            model, _ = _load_once()
            return model

        if has_version_mismatch:
            logger.warning("%s model version mismatch at %s. Retraining with current sklearn.", label, model_path)
            train_fn()
            model, _ = _load_once()

        return model

    # ── Model existence checks ──────────────────────────────────────────────

    def _ensure_models(self) -> None:
        if not RISK_MODEL_PATH.exists():
            logger.info("Training Pillar 2 risk model on real weather data…")
            self._train_risk_model()
        if not FRAUD_MODEL_PATH.exists():
            logger.info("Training Pillar 1 bot detection model…")
            self._train_fraud_model()
        if not WORK_PROOF_MODEL_PATH.exists():
            logger.info("Training Pillar 3 work-proof model…")
            self._train_work_proof_model()
        # Avoid expensive Pillar 4 training in the request path.
        # If artifacts are missing, inference will gracefully use heuristic fallback.
        if not RING_GNN_PATH.exists() or not RING_META_PATH.exists():
            logger.warning(
                "Pillar 4 model artifacts missing (ring_gnn.pt/meta). "
                "Using heuristic fallback until artifacts are prepared."
            )

    # ── Pillar 2 — GradientBoostingRegressor on REAL weather ───────────────

    def _train_risk_model(self) -> None:
        from sklearn.ensemble import GradientBoostingRegressor

        data = _fetch_real_weather_data()   # [N, 4]: precip, temp, news_count, aqi
        precip     = data[:, 0]
        temp       = data[:, 1]
        news_count = data[:, 2]
        aqi        = data[:, 3]

        X = data.copy()

        # Label disruption days using actual Indian insurance trigger thresholds
        # Tuned: IMD heavy rain threshold = 80mm/day for severe disruption
        y = np.zeros(len(data))
        y += np.clip(precip / 80, 0, 1) * 0.50          # IMD heavy rain: 80mm+ (raised weight — primary signal)
        y += np.clip((temp - 40) / 10, 0, 1) * 0.15     # Extreme heat: 45°C+ (tightened threshold)
        y += np.clip((aqi - 150) / 150, 0, 1) * 0.20    # Hazardous AQI: 200+ (raised threshold, AQI-only signal)
        y += np.clip(news_count / 6, 0, 1) * 0.15        # Corroborating news (raised weight)
        y = np.clip(y, 0.0, 1.0)

        model = GradientBoostingRegressor(
            n_estimators=300,         # more trees → smoother predictions
            learning_rate=0.04,       # lower lr with more trees = better calibration
            max_depth=5,              # slightly deeper for weather feature interactions
            subsample=0.8,
            min_samples_leaf=4,       # prevents overfitting on outlier days
            random_state=42,
        )
        model.fit(X, y)
        joblib.dump(model, RISK_MODEL_PATH)
        logger.info("Pillar 2 model trained on %d real + synthetic records.", len(data))

    # ── Pillar 1 — IsolationForest with dual-population data ───────────────

    def _train_fraud_model(self) -> None:
        from sklearn.ensemble import IsolationForest

        rng = np.random.default_rng(11)

        # ── Genuine human sessions ──────────────────────────────────────────
        n_human = 5000    # increased: more human variety → better anomaly boundary
        # avg gap ~50-70s with natural variance, realistic jitter distribution
        avg_gap_human    = rng.normal(60_000, 8_000, n_human)
        jitter_human     = np.abs(rng.normal(1_200, 500, n_human)) + 300  # higher realistic jitter
        hb_count_human   = rng.integers(3, 80, n_human)   # low count is OK (short sessions)
        # Peak hour bias for real workers (login during delivery windows)
        login_hour_human = np.concatenate([
            rng.integers(11, 15, n_human // 3),                        # lunch window
            rng.integers(18, 23, n_human // 3),                        # dinner window
            rng.integers(8, 11, n_human - 2 * (n_human // 3)),         # morning deliveries
        ])
        X_human = np.column_stack([avg_gap_human, jitter_human, hb_count_human, login_hour_human])

        # ── Bot / scripted sessions ─────────────────────────────────────────
        n_bot = 800       # increased: more bot variety → harder to game
        # Bots: extremely precise (<60ms jitter), often off-hours, fixed patterns
        avg_gap_bot  = rng.normal(60_000, 150, n_bot)     # robot-precise (tighter variance)
        jitter_bot   = np.abs(rng.normal(20, 15, n_bot))  # near-zero jitter
        hb_count_bot = rng.integers(50, 250, n_bot)        # very high — automated
        login_hour_bot = np.concatenate([
            rng.integers(0, 6, n_bot // 2),                # dead-of-night
            rng.integers(1, 5, n_bot - n_bot // 2),        # 1-5 AM burst
        ])
        X_bot = np.column_stack([avg_gap_bot, jitter_bot, hb_count_bot, login_hour_bot])

        X = np.vstack([X_human, X_bot])
        # contamination = fraction of bots in training set
        contamination = n_bot / (n_human + n_bot)

        model = IsolationForest(
            contamination=round(contamination, 3),
            random_state=11,
            n_estimators=200,          # more trees → more robust anomaly boundary
            max_samples='auto',
            max_features=0.8,          # feature subsampling for diversity
        )
        model.fit(X)
        joblib.dump(model, FRAUD_MODEL_PATH)
        logger.info(
            "Pillar 1 IsolationForest trained on %d human + %d bot sessions (contamination=%.2f).",
            n_human, n_bot, contamination,
        )

    # ── Pillar 3 — GBC with login_hour + chain_valid ───────────────────────

    def _train_work_proof_model(self) -> None:
        from sklearn.ensemble import GradientBoostingClassifier

        rng = np.random.default_rng(7)
        n = 8000    # increased: 8k samples → better decision boundary coverage

        active_minutes  = rng.integers(1, 121, n)
        recency_mins    = rng.uniform(0, 60, n)         # tightened: >60min is very stale
        ip_match        = rng.integers(0, 2, n)
        chain_valid     = rng.integers(0, 2, n)
        heartbeat_count = np.maximum(active_minutes + rng.integers(-5, 6, n), 1)
        # login_hour: bias toward real delivery windows for genuine sessions
        login_hour = np.concatenate([
            rng.integers(10, 15, n // 3),              # lunch-hour genuine workers
            rng.integers(17, 23, n // 3),              # dinner-hour genuine workers
            rng.integers(8, 10, n - 2 * (n // 3)),    # morning deliveries
        ])
        rng.shuffle(login_hour)
        is_peak = ((login_hour >= 10) & (login_hour <= 14)) | ((login_hour >= 17) & (login_hour <= 22))

        X = np.column_stack([active_minutes, recency_mins, ip_match, chain_valid, heartbeat_count, login_hour])

        score = (
            np.clip(active_minutes / 45, 0, 1) * 0.25       # work time (de-weighted slightly)
            + (1 - np.clip(recency_mins / 30, 0, 1)) * 0.15 # recency window tightened to 30
            + ip_match * 0.15                                 # geo-match
            + chain_valid * 0.30                              # RAISED: most tamper-proof signal
            + np.clip(heartbeat_count / 50, 0, 1) * 0.05    # beat count
            + is_peak.astype(float) * 0.10                   # peak hour bonus
        )
        y = (score > 0.60).astype(int)   # slightly lower threshold → more inclusive of genuine

        model = GradientBoostingClassifier(
            n_estimators=300,           # more trees
            learning_rate=0.04,
            max_depth=5,
            subsample=0.8,
            min_samples_leaf=3,
            random_state=7,
        )
        model.fit(X, y)
        joblib.dump(model, WORK_PROOF_MODEL_PATH)
        logger.info("Pillar 3 model trained with login_hour + chain_valid features on %d samples.", n)

    # ── Pillar 4 fallback (if torch not available) ──────────────────────────

    def _train_ring_model_fallback(self) -> None:
        """
        RandomForest fallback for Pillar 4 when PyTorch is unavailable.
        Saved as a .pkl, but RING_GNN_PATH guard will be skipped on load.
        """
        from sklearn.ensemble import RandomForestClassifier

        rng = np.random.default_rng(21)
        n = 6000

        ip_div   = rng.uniform(0.02, 1.0, n)
        ts_ent   = rng.uniform(0.00, 1.0, n)
        wp_var   = rng.uniform(0.00, 0.4, n)
        size     = rng.integers(2, 200, n)
        # Syndicate interaction: all 3 conditions together = strong signal
        syndicate = ((ip_div < 0.25) & (ts_ent < 0.30) & (wp_var < 0.05)).astype(int)
        X = np.column_stack([ip_div, ts_ent, wp_var, size, syndicate])

        suspicious = (
            (ip_div < 0.2).astype(int)
            + (ts_ent < 0.35).astype(int)
            + (wp_var < 0.08).astype(int)
            + (size > 18).astype(int)
            + syndicate * 2
        )
        y = (suspicious >= 2).astype(int)

        model = RandomForestClassifier(n_estimators=150, max_depth=6, class_weight="balanced", random_state=21)
        model.fit(X, y)
        joblib.dump(model, RING_META_PATH)   # store as meta path (not GNN path)
        logger.info("Pillar 4 fallback RandomForest trained.")

    # ── GNN load ────────────────────────────────────────────────────────────

    def _load_gnn(self) -> None:
        if not RING_GNN_PATH.exists() or not RING_META_PATH.exists():
            return
        FraudRingGNN, torch = _build_gnn_model()
        if FraudRingGNN is None:
            logger.warning("torch not installed — Pillar 4 will use heuristic fallback.")
            return
        try:
            meta = joblib.load(RING_META_PATH)
            model = FraudRingGNN(in_features=meta["in_features"], hidden=meta["hidden"])
            model.load_state_dict(torch.load(RING_GNN_PATH, map_location="cpu", weights_only=True))
            model.eval()
            self._gnn = model
            self._torch = torch
            logger.info("Pillar 4 GNN loaded from %s.", RING_GNN_PATH)
        except Exception as exc:
            logger.warning("Failed to load GNN: %s. Falling back to heuristic.", exc)

    # ─────────────────────────────────────────────────────────────────────
    # Public predict methods
    # ─────────────────────────────────────────────────────────────────────

    def predict_environment_risk(self, precipitation: float, temp: float, news_count: int, aqi: float) -> float:
        X = np.array([[precipitation, temp, float(news_count), aqi]])
        return float(np.clip(self.risk_model.predict(X)[0], 0.0, 1.0))

    def predict_work_proof(
        self,
        active_minutes: int,
        recency_mins: float,
        ip_match: bool,
        chain_valid: bool,
        heartbeat_count: int,
        login_hour: int = 12,        # NEW — defaults to noon if not provided
    ) -> float:
        X = np.array([[
            active_minutes,
            recency_mins,
            int(ip_match),
            int(chain_valid),
            heartbeat_count,
            login_hour,              # NEW feature
        ]])
        proba = self.work_proof_model.predict_proba(X)[0][1]
        return float(np.clip(proba, 0.0, 1.0))

    def predict_fraud_anomaly(self, avg_gap_ms: float, jitter_ms: float, heartbeat_count: int, login_hour: int = 12) -> Tuple[float, bool]:
        X = np.array([[avg_gap_ms, jitter_ms, heartbeat_count, float(login_hour)]])
        decision   = float(self.fraud_model.decision_function(X)[0])
        pred       = int(self.fraud_model.predict(X)[0])
        anomaly    = float(np.clip(0.5 - decision, 0.0, 1.0))
        is_anomaly = pred == -1
        return anomaly, is_anomaly

    def predict_ring_probability(
        self,
        ip_subnet_diversity: float,
        timestamp_entropy: float,
        workproof_variance: float,
        cluster_size: int,
        claim_nodes: Optional[List[dict]] = None,   # raw claim list for GNN path
    ) -> float:
        # ── GNN path ────────────────────────────────────────────────────────
        if self._gnn is not None and claim_nodes and len(claim_nodes) >= 2:
            try:
                return self._predict_ring_gnn(claim_nodes)
            except Exception as exc:
                logger.warning("GNN inference failed (%s), using heuristic.", exc)

        # ── Heuristic fallback ──────────────────────────────────────────────
        return self._predict_ring_heuristic(ip_subnet_diversity, timestamp_entropy, workproof_variance, cluster_size)

    def _predict_ring_gnn(self, claim_nodes: List[dict]) -> float:
        """
        Build a claim graph and run the GCN to get a fraud probability.
        claim_nodes: list of dicts with keys: ipSubnet, minuteBucket, workProofScore
        """
        torch = self._torch
        n = len(claim_nodes)

        subnets = [c.get("ipSubnet", "") for c in claim_nodes]
        minutes = [c.get("minuteBucket", 0) for c in claim_nodes]
        scores  = [float(c.get("workProofScore", 0.5)) for c in claim_nodes]

        # Normalize subnet → integer index → 0-1
        unique_subnets = list(set(subnets))
        subnet_idx = [unique_subnets.index(s) / max(len(unique_subnets), 1) for s in subnets]
        unique_minutes = sorted(set(minutes))
        minute_idx = [unique_minutes.index(m) / max(len(unique_minutes), 1) for m in minutes]
        log_size = math.log1p(n) / math.log1p(200)

        X_np = np.array(
            [[subnet_idx[i], minute_idx[i], scores[i], log_size] for i in range(n)],
            dtype=np.float32,
        )

        # Build adjacency
        adj_np = np.eye(n, dtype=np.float32)
        for i in range(n):
            for j in range(n):
                if i == j:
                    continue
                same_subnet = abs(subnet_idx[i] - subnet_idx[j]) < 0.05
                same_minute = abs(minute_idx[i] - minute_idx[j]) < 0.05
                if same_subnet or same_minute:
                    adj_np[i, j] = 1.0

        X   = torch.tensor(X_np, dtype=torch.float32)
        adj = torch.tensor(adj_np, dtype=torch.float32)

        with torch.no_grad():
            prob = float(self._gnn(X, adj))
        return float(np.clip(prob, 0.0, 1.0))

    def _predict_ring_heuristic(
        self,
        ip_subnet_diversity: float,
        timestamp_entropy: float,
        workproof_variance: float,
        cluster_size: int,
    ) -> float:
        """
        Rule-based ring risk when GNN is not available or claim_nodes not passed.
        Checks for the Telegram syndicate signature: 3+ co-occurring flags.
        """
        flags = [
            ip_subnet_diversity < 0.20,     # same /24 subnet block
            timestamp_entropy < 0.30,        # all claimed within same minute
            workproof_variance < 0.05,       # identical scores (bot-generated)
            cluster_size > 18,               # large coordinated group
        ]
        n_flags = sum(flags)
        if n_flags == 0:   return 0.05
        if n_flags == 1:   return 0.20
        if n_flags == 2:   return 0.55
        if n_flags == 3:   return 0.80
        return 0.95    # all 4 = near-certain syndicate


_model_hub_instance = None

def get_model_hub() -> ModelHub:
    global _model_hub_instance
    if _model_hub_instance is None:
        _model_hub_instance = ModelHub()
    return _model_hub_instance

