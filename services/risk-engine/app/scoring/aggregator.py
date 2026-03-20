"""
Score Aggregator
=================
Runs all fraud rules, aggregates the scores, applies caps, and returns a RiskDecision.
"""

import uuid
from app.models.signal import RiskPayloadSchema, RiskDecision, RiskLevel, RecommendedAction
from app.rules.social_engineering import ALL_RULES
from app.rules.device_binding import evaluate_device_binding_rules
from app.rules.ip_geolocation import (
    lookup_ip,
    rule_027_ip_country_mismatch,
    rule_028_hosting_ip,
    rule_029_ip_device_distance,
)
from app.rules.ai_fraud_rules import ALL_AI_FRAUD_RULES

# Warning messages for each risk level — shown in the banking/payment app
WARNING_MESSAGES = {
    RiskLevel.CRITICAL: (
        "🚨 STOP — High Fraud Risk Detected\n\n"
        "This transaction shows multiple signs of a scam. "
        "You are likely being manipulated by a fraudster. "
        "Please hang up the phone and do NOT send money."
    ),
    RiskLevel.HIGH: (
        "⚠️ Possible Scam Warning\n\n"
        "You are sending money to a number not in your contacts while on a phone call. "
        "Fraudsters often pressure victims during calls. "
        "Are you sure you trust this recipient?"
    ),
    RiskLevel.MEDIUM: (
        "ℹ️ Transaction Review Recommended\n\n"
        "This transaction has some unusual characteristics. "
        "Please verify that you know the recipient before proceeding."
    ),
    RiskLevel.LOW: None
}


async def score_payload(payload: RiskPayloadSchema, baseline: dict) -> RiskDecision:
    """
    Core scoring function. Evaluates all rules and returns a composite RiskDecision.
    Each rule is independent — all run regardless of others.
    Includes social engineering rules (RULE_001–014, RULE_021–026),
    device binding rules (RULE_015–020),
    IP geolocation rules (RULE_027–029),
    and AI fraud rules (RULE_030–035).
    """
    total_score = 0
    triggered_rules = []
    score_breakdown = {}

    # ── Social engineering rules (original 14) ────────────────────────────────
    for rule_fn in ALL_RULES:
        delta, rule_id, _ = rule_fn(payload, baseline)
        score_breakdown[rule_id] = delta
        if delta > 0:
            triggered_rules.append(rule_id)
            total_score += delta

    # ── Device binding rules (RULE_015–020) ───────────────────────────────────
    device_signal = payload.dict().get("device", {})
    db_result = evaluate_device_binding_rules(device_signal)
    for rule_id in db_result.triggered_rules:
        score_breakdown[rule_id] = db_result.score_delta
        triggered_rules.append(rule_id)
    total_score += db_result.score_delta

    # ── IP geolocation rules (RULE_027–029) ───────────────────────────────────
    ip_address = payload.network.ip_address if payload.network else None
    ip_geo = await lookup_ip(ip_address) if ip_address else {}

    if ip_geo:
        # RULE_027 — IP country vs SIM country
        sim_country = ""
        if payload.sim:
            sim_country = payload.sim.country_iso or ""
        delta, rule_id, _ = rule_027_ip_country_mismatch(ip_geo, sim_country)
        score_breakdown[rule_id] = delta
        if delta > 0:
            triggered_rules.append(rule_id)
            total_score += delta

        # RULE_028 — Hosting/datacenter IP
        delta, rule_id, _ = rule_028_hosting_ip(ip_geo)
        score_breakdown[rule_id] = delta
        if delta > 0:
            triggered_rules.append(rule_id)
            total_score += delta

        # RULE_029 — IP vs device GPS distance
        dev_lat = payload.network.latitude if payload.network else None
        dev_lon = payload.network.longitude if payload.network else None
        delta, rule_id, _ = rule_029_ip_device_distance(ip_geo, dev_lat, dev_lon)
        score_breakdown[rule_id] = delta
        if delta > 0:
            triggered_rules.append(rule_id)
            total_score += delta

    # ── AI fraud detection rules (RULE_030–035) ───────────────────────────────
    for rule_fn in ALL_AI_FRAUD_RULES:
        delta, rule_id, _ = rule_fn(payload, baseline)
        score_breakdown[rule_id] = delta
        if delta > 0:
            triggered_rules.append(rule_id)
            total_score += delta

    # Cap at 100
    final_score = min(total_score, 100)

    # Determine risk level
    risk_level = _score_to_level(final_score)

    # Determine action
    action = _level_to_action(risk_level)

    return RiskDecision(
        transaction_id=payload.payload_id,
        user_id=payload.user_id,
        risk_score=final_score,
        risk_level=risk_level,
        recommended_action=action,
        triggered_rules=triggered_rules,
        score_breakdown=score_breakdown,
        warning_message=WARNING_MESSAGES.get(risk_level)
    )


def _score_to_level(score: int) -> RiskLevel:
    if score >= 85:
        return RiskLevel.CRITICAL
    elif score >= 65:
        return RiskLevel.HIGH
    elif score >= 35:
        return RiskLevel.MEDIUM
    else:
        return RiskLevel.LOW


def _level_to_action(level: RiskLevel) -> RecommendedAction:
    mapping = {
        RiskLevel.CRITICAL: RecommendedAction.BLOCK,
        RiskLevel.HIGH: RecommendedAction.WARN_USER,
        RiskLevel.MEDIUM: RecommendedAction.SOFT_WARNING,
        RiskLevel.LOW: RecommendedAction.APPROVE,
    }
    return mapping[level]
