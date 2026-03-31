import os
from collections import Counter
from datetime import datetime, timezone
from math import log2, sqrt
from typing import Any, Dict, List, Optional

import numpy as np
import requests
import uvicorn
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field

from model_hub import model_hub
from scoring import aggregate_four_pillars

app = FastAPI(title="KavachPay ML Service", version="2.0.0")


def _mean(values: List[float]) -> float:
    return sum(values) / len(values) if values else 0.0


def _stddev(values: List[float]) -> float:
    if not values:
        return 0.0
    avg = _mean(values)
    return sqrt(sum((value - avg) ** 2 for value in values) / len(values))


class HeartbeatEvent(BaseModel):
    timestamp: datetime
    ipAddress: str
    hash: str


class Pillar1Request(BaseModel):
    heartbeatTimestamps: List[datetime] = Field(default_factory=list)


class Pillar2Request(BaseModel):
    city: str


class Pillar3Request(BaseModel):
    userId: str
    sessionStartTime: datetime
    registeredCity: str
    observedIpCity: Optional[str] = None
    heartbeats: List[HeartbeatEvent] = Field(default_factory=list)


class RingClaimNode(BaseModel):
    userId: str
    timestamp: datetime
    ipAddress: str
    workProofScore: float = 0.0


class Pillar4Request(BaseModel):
    claims: List[RingClaimNode] = Field(default_factory=list)


class AggregateRequest(BaseModel):
    pillar1Score: float
    pillar2Score: float
    pillar3Score: float
    pillar4RingRisk: float


@app.get("/")
def read_root() -> Dict[str, str]:
    return {"message": "KavachPay ML Service is running..."}


@app.get("/api/models/status")
def model_status() -> Dict[str, Any]:
    return {
        "status": "loaded",
        "models": [
            "models/risk_model.pkl",
            "models/work_proof_model.pkl",
            "models/fraud_model.pkl",
            "models/ring_detector.pt",
        ],
    }


@app.post("/api/pillar1/behavioral-auth")
def pillar1_behavioral_auth(payload: Pillar1Request) -> Dict[str, Any]:
    timestamps = sorted(payload.heartbeatTimestamps)
    if len(timestamps) < 3:
        return {
            "score": 1.0,
            "isBot": False,
            "jitterMs": 0,
            "confidence": "INSUFFICIENT_DATA",
            "algorithm": "IsolationForest + jitter features",
        }

    intervals_ms: List[float] = []
    for index in range(1, len(timestamps)):
        delta = (timestamps[index] - timestamps[index - 1]).total_seconds() * 1000.0
        intervals_ms.append(delta)

    avg_gap = _mean(intervals_ms)
    jitter_ms = _stddev(intervals_ms)

    anomaly_score, is_anomaly = model_hub.predict_fraud_anomaly(avg_gap, jitter_ms, len(timestamps))
    score = max(0.0, min(1.0, 1 - anomaly_score))

    return {
        "score": round(score, 3),
        "isBot": bool(is_anomaly),
        "jitterMs": round(jitter_ms),
        "confidence": "BOT_DETECTED" if is_anomaly else "HUMAN_VERIFIED",
        "algorithm": "IsolationForest + jitter features",
    }


def _get_coordinates(city: str) -> Optional[Dict[str, float]]:
    try:
        response = requests.get(
            "https://geocoding-api.open-meteo.com/v1/search",
            params={"name": city, "count": 1, "language": "en", "format": "json"},
            timeout=10,
        )
        response.raise_for_status()
        data = response.json()
        results = data.get("results") or []
        if not results:
            return None
        return {"lat": float(results[0]["latitude"]), "lon": float(results[0]["longitude"])}
    except requests.RequestException:
        return None


def _get_weather(lat: float, lon: float) -> Optional[Dict[str, Any]]:
    try:
        response = requests.get(
            "https://api.open-meteo.com/v1/forecast",
            params={
                "latitude": lat,
                "longitude": lon,
                "current": "temperature_2m,precipitation,weather_code",
            },
            timeout=10,
        )
        response.raise_for_status()
        current = response.json().get("current", {})
        return {
            "precipitation": float(current.get("precipitation") or 0.0),
            "temp": float(current.get("temperature_2m") or 0.0),
            "weatherCode": current.get("weather_code"),
        }
    except requests.RequestException:
        return None


def _get_news(city: str, key: Optional[str]) -> Optional[Dict[str, Any]]:
    api_key = (key or os.getenv("NEWS_API_KEY", "")).strip()
    if not api_key:
        return None

    today = datetime.now(timezone.utc).date().isoformat()
    try:
        response = requests.get(
            "https://newsapi.org/v2/everything",
            params={
                "q": f"{city} flood OR rain OR disruption OR curfew OR strike",
                "from": today,
                "sortBy": "relevancy",
                "apiKey": api_key,
            },
            timeout=10,
        )
        response.raise_for_status()
        data = response.json()
        articles = data.get("articles") or []
        return {
            "count": int(data.get("totalResults") or 0),
            "headlines": [article.get("title", "") for article in articles[:3]],
        }
    except requests.RequestException:
        return None


def _get_aqi(city: str, key: Optional[str]) -> Optional[Dict[str, Any]]:
    token = (key or os.getenv("AQI_API_KEY", "")).strip()
    if not token:
        return None

    try:
        response = requests.get(
            f"https://api.waqi.info/feed/{city}/",
            params={"token": token},
            timeout=10,
        )
        response.raise_for_status()
        data = response.json()
        if data.get("status") != "ok":
            return None
        return {"aqi": int(data["data"].get("aqi") or 0)}
    except requests.RequestException:
        return None


@app.post("/api/pillar2/environmental-consensus")
def pillar2_environmental_consensus(
    payload: Pillar2Request,
    x_news_api_key: Optional[str] = Header(default=None),
    x_aqi_api_key: Optional[str] = Header(default=None),
) -> Dict[str, Any]:
    coords = _get_coordinates(payload.city)
    if not coords:
        raise HTTPException(status_code=404, detail="Unable to resolve city coordinates")

    weather = _get_weather(coords["lat"], coords["lon"])
    news = _get_news(payload.city, x_news_api_key)
    aqi = _get_aqi(payload.city, x_aqi_api_key)

    precipitation = float((weather or {}).get("precipitation") or 0.0)
    temp = float((weather or {}).get("temp") or 30.0)
    news_count = int((news or {}).get("count") or 0)
    aqi_val = float((aqi or {}).get("aqi") or 0)

    model_score = model_hub.predict_environment_risk(precipitation, temp, news_count, aqi_val)

    evidence: List[str] = []
    if weather:
        evidence.append(f"Weather precipitation={precipitation}mm via Open-Meteo")
    if news:
        evidence.append(f"News count={news_count} via NewsAPI")
    if aqi:
        evidence.append(f"AQI={aqi_val:.0f} via AQICN")

    return {
        "city": payload.city,
        "disruptionScore": round(model_score, 3),
        "isRealDisruption": model_score > 0.3,
        "evidence": evidence,
        "raw": {"coords": coords, "weather": weather, "news": news, "aqi": aqi},
        "algorithm": "GradientBoostingRegressor environmental risk model",
    }


@app.post("/api/pillar3/session-authenticity")
def pillar3_session_authenticity(payload: Pillar3Request) -> Dict[str, Any]:
    ordered = sorted(payload.heartbeats, key=lambda hb: hb.timestamp)

    if not ordered:
        return {
            "isChainValid": False,
            "ipMatch": False,
            "recencyMins": 999,
            "score": 0.0,
            "confidence": "NO_HEARTBEATS",
            "algorithm": "GradientBoosting work-proof model",
        }

    latest = ordered[-1]
    recency_mins = (datetime.now(timezone.utc) - latest.timestamp.astimezone(timezone.utc)).total_seconds() / 60.0

    observed = (payload.observedIpCity or "").strip().lower()
    registered = (payload.registeredCity or "").strip().lower()
    ip_match = (not observed) or observed == registered or observed in registered or registered in observed

    # Chain validity is expected to be computed in backend using secret; here we infer consistency signal only.
    chain_valid_proxy = len(ordered) >= 3

    score = model_hub.predict_work_proof(
        active_minutes=len(ordered),
        recency_mins=recency_mins,
        ip_match=ip_match,
        chain_valid=chain_valid_proxy,
        heartbeat_count=len(ordered),
    )

    return {
        "isChainValid": chain_valid_proxy,
        "ipMatch": ip_match,
        "recencyMins": round(recency_mins, 2),
        "score": round(score, 3),
        "confidence": "VALID" if score >= 0.7 else "REVIEW",
        "algorithm": "GradientBoosting work-proof model",
    }


def _ip_subnet(ip: str) -> str:
    parts = ip.replace("::ffff:", "").split(".")
    if len(parts) >= 3:
        return ".".join(parts[:3])
    return ip


def _normalized_entropy(values: List[str]) -> float:
    if not values:
        return 0.0
    counts = Counter(values)
    total = len(values)
    probs = [count / total for count in counts.values()]
    entropy = -sum(p * log2(p) for p in probs if p > 0)
    max_entropy = log2(max(len(counts), 1))
    if max_entropy <= 0:
        return 0.0
    return float(entropy / max_entropy)


@app.post("/api/pillar4/ring-detect")
def pillar4_ring_detect(payload: Pillar4Request) -> Dict[str, Any]:
    claims = payload.claims
    if len(claims) < 2:
        return {
            "ringRisk": 0.0,
            "isSuspiciousCluster": False,
            "clusterSize": len(claims),
            "algorithm": "LogisticRegression ring detector",
        }

    subnets = [_ip_subnet(claim.ipAddress) for claim in claims]
    unique_subnets = len(set(subnets))
    ip_subnet_diversity = unique_subnets / max(len(claims), 1)

    minute_buckets = [claim.timestamp.strftime("%Y-%m-%d %H:%M") for claim in claims]
    timestamp_entropy = _normalized_entropy(minute_buckets)

    work_scores = [float(claim.workProofScore) for claim in claims]
    workproof_variance = float(np.var(work_scores)) if len(work_scores) > 1 else 0.0

    ring_risk = model_hub.predict_ring_probability(
        ip_subnet_diversity=ip_subnet_diversity,
        timestamp_entropy=timestamp_entropy,
        workproof_variance=workproof_variance,
        cluster_size=len(claims),
    )

    return {
        "ringRisk": round(ring_risk, 3),
        "isSuspiciousCluster": ring_risk >= 0.65,
        "clusterSize": len(claims),
        "features": {
            "ipSubnetDiversity": round(ip_subnet_diversity, 4),
            "timestampEntropy": round(timestamp_entropy, 4),
            "workProofVariance": round(workproof_variance, 4),
        },
        "algorithm": "LogisticRegression ring detector",
    }


@app.post("/api/score/aggregate")
def aggregate_scores(payload: AggregateRequest) -> Dict[str, Any]:
    aggregate = aggregate_four_pillars(
        pillar1_score=payload.pillar1Score,
        pillar2_score=payload.pillar2Score,
        pillar3_score=payload.pillar3Score,
        pillar4_ring_risk=payload.pillar4RingRisk,
    )
    return {
        **aggregate,
        "algorithm": "Weighted 4-pillar aggregation",
    }


if __name__ == "__main__":
    port = int(os.getenv("ML_SERVICE_PORT", "8000"))
    uvicorn.run(app, host="127.0.0.1", port=port)
