"""
USSD Fraud Rules Engine
========================
Server-side rules for USSD / feature phone channels.
No SDK required — all signals come from the institution's backend.

Rule naming: USSD_XXX (zero-padded 3-digit).
These rules mirror the subset of SDK rules that work server-side,
plus USSD-specific patterns.
"""
import math
from datetime import datetime
from typing import Tuple

from app.models.ussd_signal import UssdPayloadSchema

UssdRuleResult = Tuple[int, str, str]  # (score_delta, rule_id, description)


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance between two lat/lon pairs in km."""
    R = 6371
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = math.sin(d_lat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lon / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


# ── USSD_001: SIM Swap + High Value Transaction ──────────────────────────────

def ussd_001_sim_swap_high_value(payload: UssdPayloadSchema, baseline: dict) -> UssdRuleResult:
    """
    SIM swap detected within 72 hours + transaction above user's average.
    This is the #1 fraud vector on USSD: attacker performs SIM swap, then
    initiates USSD transfers from the hijacked line.
    """
    if not payload.subscriber.sim_swap_detected:
        return 0, "USSD_001", ""

    swap_hours = payload.subscriber.sim_swap_age_hours or 999
    avg_tx = baseline.get("avg_transaction_amount", 100)
    is_high = payload.transaction.amount > avg_tx * 1.5

    if swap_hours <= 72 and is_high:
        return 70, "USSD_001", f"SIM swap {swap_hours}h ago + high-value transaction (CRITICAL)"
    elif swap_hours <= 72:
        return 45, "USSD_001", f"SIM swap detected {swap_hours}h ago"
    return 0, "USSD_001", ""


# ── USSD_002: Velocity / Structuring ──────────────────────────────────────────

def ussd_002_velocity_structuring(payload: UssdPayloadSchema, baseline: dict) -> UssdRuleResult:
    """
    Rapid sequential USSD transactions or amounts clustering below
    reporting thresholds (FICA R5,000 / CBN ₦5M / KRA KES 500K).
    """
    recent_tx_count = baseline.get("transactions_last_10min", 0)
    amount = payload.transaction.amount
    currency = payload.transaction.currency.upper()

    thresholds = {"ZAR": 5000, "NGN": 5_000_000, "KES": 500_000, "GHS": 50_000, "USD": 10_000}
    threshold = thresholds.get(currency, 10_000)
    is_structuring = threshold * 0.90 <= amount < threshold

    is_velocity = recent_tx_count >= 5

    score = 0
    reasons = []
    if is_velocity:
        score += 25
        reasons.append(f"{recent_tx_count} USSD transactions in 10min")
    if is_structuring:
        score += 20
        reasons.append(f"Amount {amount} near {currency} {threshold} threshold")

    if score > 0:
        return min(score, 45), "USSD_002", "Velocity/structuring — " + "; ".join(reasons)
    return 0, "USSD_002", ""


# ── USSD_003: Beneficiary Network Risk ────────────────────────────────────────

def ussd_003_beneficiary_network_risk(payload: UssdPayloadSchema, baseline: dict) -> UssdRuleResult:
    """
    Beneficiary flagged in fraud network: mule account detection,
    blacklisted recipient, or new account with suspicious activity.
    """
    if not payload.beneficiary:
        return 0, "USSD_003", ""

    score = 0
    reasons = []

    if payload.beneficiary.is_blacklisted:
        return 55, "USSD_003", "Beneficiary is BLACKLISTED — block recommended"

    fraud_reports = payload.beneficiary.fraud_report_count
    unique_senders = payload.beneficiary.unique_sender_count
    days_old = payload.beneficiary.days_since_account_created

    if fraud_reports >= 3 and unique_senders >= 3:
        score += 40
        reasons.append(f"Beneficiary in {fraud_reports} fraud reports from {unique_senders} senders")
    elif fraud_reports >= 1:
        score += 20
        reasons.append(f"Beneficiary has {fraud_reports} prior fraud report(s)")

    if days_old is not None and days_old < 30 and unique_senders > 5:
        score += 15
        reasons.append(f"Account {days_old} days old with {unique_senders} unique senders")

    if score > 0:
        return min(score, 55), "USSD_003", "Beneficiary risk — " + "; ".join(reasons)
    return 0, "USSD_003", ""


# ── USSD_004: Time-of-Day Anomaly ────────────────────────────────────────────

def ussd_004_time_of_day_anomaly(payload: UssdPayloadSchema, baseline: dict) -> UssdRuleResult:
    """
    USSD transaction during unusual hours (midnight–5am).
    Feature phone fraud often occurs while victims are asleep (post SIM swap).
    """
    try:
        tx_hour = datetime.fromtimestamp(payload.timestamp).hour
    except (OSError, ValueError):
        return 0, "USSD_004", ""

    usual_start = baseline.get("usual_tx_hour_start", 6)
    usual_end = baseline.get("usual_tx_hour_end", 22)

    if tx_hour < 5 and usual_start >= 6:
        return 25, "USSD_004", f"USSD transaction at {tx_hour:02d}:00 — outside user's usual hours"
    return 0, "USSD_004", ""


# ── USSD_005: Cooling-Off Period ─────────────────────────────────────────────

def ussd_005_cooling_off_period(payload: UssdPayloadSchema, baseline: dict) -> UssdRuleResult:
    """
    First-time transfer to a new recipient above threshold.
    Aligned with APP fraud liability regulations (CBN / FSCA).
    Institution can enforce a hold/review window.
    """
    is_new = payload.recipient_in_contacts is False
    amount = payload.transaction.amount
    currency = payload.transaction.currency.upper()

    cooloff_thresholds = {"ZAR": 2500, "NGN": 500_000, "KES": 100_000, "GHS": 10_000, "USD": 1000}
    threshold = cooloff_thresholds.get(currency, 1000)

    if is_new and amount >= threshold:
        return 30, "USSD_005", f"First-time recipient + {currency} {amount:,.2f} above cooling-off threshold"
    return 0, "USSD_005", ""


# ── USSD_006: Geolocation Anomaly (Cell Tower) ──────────────────────────────

def ussd_006_geolocation_anomaly(payload: UssdPayloadSchema, baseline: dict) -> UssdRuleResult:
    """
    Cell tower location significantly distant from user's usual location.
    Less precise than GPS but still catches cross-city or cross-country attacks.
    """
    if not payload.geolocation:
        return 0, "USSD_006", ""

    user_lat = baseline.get("usual_latitude")
    user_lon = baseline.get("usual_longitude")
    tx_lat = payload.geolocation.cell_tower_lat
    tx_lon = payload.geolocation.cell_tower_lon

    if user_lat is None or user_lon is None or tx_lat is None or tx_lon is None:
        return 0, "USSD_006", ""

    distance_km = _haversine_km(user_lat, user_lon, tx_lat, tx_lon)
    accuracy = payload.geolocation.cell_tower_accuracy_km or 5

    # Account for cell tower imprecision — only fire if distance exceeds
    # threshold + accuracy margin
    effective_distance = max(0, distance_km - accuracy)
    if effective_distance > 200:
        return 30, "USSD_006", f"Cell tower {int(distance_km)}km from usual location (±{int(accuracy)}km)"
    return 0, "USSD_006", ""


# ── USSD_007: New Subscriber + High Value ────────────────────────────────────

def ussd_007_new_subscriber_high_value(payload: UssdPayloadSchema, baseline: dict) -> UssdRuleResult:
    """
    Subscriber account is very new (<30 days old) and already initiating
    high-value transfers. Common pattern for freshly-activated mule SIMs.
    """
    age_days = payload.subscriber.subscriber_age_days
    if age_days is None:
        return 0, "USSD_007", ""

    avg_tx = baseline.get("avg_transaction_amount", 100)
    is_high = payload.transaction.amount > avg_tx * 2

    if age_days < 30 and is_high:
        return 35, "USSD_007", f"Subscriber {age_days} days old + high-value transfer (potential mule SIM)"
    elif age_days < 7:
        return 20, "USSD_007", f"Subscriber only {age_days} days old"
    return 0, "USSD_007", ""


# ── USSD_008: Rapid Session / Automation Detection ──────────────────────────

def ussd_008_rapid_session(payload: UssdPayloadSchema, baseline: dict) -> UssdRuleResult:
    """
    USSD session completed abnormally fast — possible automated SIM toolkit
    exploit or scripted USSD attack.

    Normal USSD transaction: 45–120 seconds (menu navigation + PIN entry).
    Automated attack: <15 seconds.
    """
    duration = payload.session.session_duration_seconds
    steps = payload.session.menu_steps_count

    if duration > 0 and duration < 10 and steps >= 3:
        return 30, "USSD_008", f"USSD session completed in {duration:.0f}s with {steps} steps (automation suspected)"
    elif duration > 0 and duration < 20 and steps >= 4:
        return 15, "USSD_008", f"Unusually fast USSD session ({duration:.0f}s, {steps} steps)"
    return 0, "USSD_008", ""


# ── Rule Registry ─────────────────────────────────────────────────────────────

ALL_USSD_RULES = [
    ussd_001_sim_swap_high_value,       # THE KILLER USSD RULE
    ussd_002_velocity_structuring,
    ussd_003_beneficiary_network_risk,
    ussd_004_time_of_day_anomaly,
    ussd_005_cooling_off_period,
    ussd_006_geolocation_anomaly,
    ussd_007_new_subscriber_high_value,
    ussd_008_rapid_session,
]
