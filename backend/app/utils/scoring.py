from typing import Iterable, Mapping


def _clamp01(value: float) -> float:
    return max(0.0, min(1.0, float(value)))


def compute_severity_entry_score(
    area_ratio: float,
    confidence: float,
    quantity: int,
) -> float:
    """
    Severity formula (exact):
    severity = 100 * (0.45 * area_ratio + 0.30 * confidence + 0.25 * quantity_norm)
    where quantity_norm = min(quantity / 5, 1.0)
    """
    area_term = _clamp01(area_ratio)
    confidence_term = _clamp01(confidence)
    quantity_norm = min(max(int(quantity), 0) / 5.0, 1.0)
    return 100.0 * ((0.45 * area_term) + (0.30 * confidence_term) + (0.25 * quantity_norm))


def severity_band(score: float) -> str:
    rounded = max(0, min(100, int(round(score))))
    if rounded <= 29:
        return "minor"
    if rounded <= 59:
        return "moderate"
    if rounded <= 79:
        return "severe"
    return "critical"


def compute_overall_severity_score(damage_entries: Iterable[Mapping]) -> int | None:
    weighted_sum = 0.0
    total_weight = 0.0

    for entry in damage_entries:
        area_ratio = float(entry.get("area_ratio", 0.0) or 0.0)
        confidence = float(entry.get("confidence", 0.0) or 0.0)
        quantity = int(entry.get("detections_count", 1) or 1)

        entry_score = compute_severity_entry_score(area_ratio, confidence, quantity)
        weight = max(1, quantity)
        weighted_sum += entry_score * weight
        total_weight += weight

    if total_weight <= 0:
        return None

    return max(0, min(100, int(round(weighted_sum / total_weight))))


def compute_fraud_score(
    reuse_score: float,
    ai_gen_score: float,
    metadata_anomaly: float,
) -> int:
    """
    Fraud formula (exact):
    fraud = 100 * (0.50 * reuse_score + 0.30 * ai_gen_score + 0.20 * metadata_anomaly)
    """
    raw = 100.0 * (
        (0.50 * _clamp01(reuse_score))
        + (0.30 * _clamp01(ai_gen_score))
        + (0.20 * _clamp01(metadata_anomaly))
    )
    return max(0, min(100, int(round(raw))))


def fraud_risk_band(score: int) -> str:
    normalized = max(0, min(100, int(score)))
    if normalized <= 24:
        return "low"
    if normalized <= 49:
        return "medium"
    if normalized <= 74:
        return "high"
    return "critical"
