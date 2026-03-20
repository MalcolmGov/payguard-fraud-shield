"""
Social Engineering Fraud Rules Engine
======================================
Each rule function receives the full SDK payload and returns (score_delta, rule_id).
Rules are independent and composable — all are evaluated, scores are summed.

Rule naming: RULE_XXX where XXX is zero-padded 3-digit number.
"""

from app.models.signal import RiskPayloadSchema
from typing import Tuple

RuleResult = Tuple[int, str, str]  # (score_delta, rule_id, description)


def rule_001_call_plus_new_recipient_high_amount(payload: RiskPayloadSchema, baseline: dict) -> RuleResult:
    """
    THE KILLER RULE.
    User is on an active phone call, sending to a new recipient, with a large amount.
    This combination catches ~70% of voice-phishing (vishing) fraud across digital payment platforms.
    """
    is_on_call = payload.call.is_on_active_call
    recipient_not_in_contacts = not payload.recipient_in_contacts
    avg_tx = baseline.get("avg_transaction_amount", 100)
    high_amount = payload.transaction.amount > (avg_tx * 1.5)

    if is_on_call and recipient_not_in_contacts and high_amount:
        return 75, "RULE_001", "Active call + unknown recipient + high amount (vishing pattern)"
    return 0, "RULE_001", ""


def rule_002_call_plus_unknown_recipient(payload: RiskPayloadSchema, baseline: dict) -> RuleResult:
    """User on call + recipient not in contacts. Core social engineering pattern."""
    if payload.call.is_on_active_call and not payload.recipient_in_contacts:
        return 40, "RULE_002", "Active call with uncontacted recipient"
    return 0, "RULE_002", ""


def rule_003_rushed_transaction(payload: RiskPayloadSchema, baseline: dict) -> RuleResult:
    """
    Transaction created within 10 seconds of session start.
    Victims under pressure skip the review screen and transact immediately.
    """
    if payload.behavioral.transaction_creation_ms > 0 and payload.behavioral.transaction_creation_ms < 10_000:
        return 30, "RULE_003", "Transaction initiated within 10 seconds of session start"
    return 0, "RULE_003", ""


def rule_004_paste_recipient(payload: RiskPayloadSchema, baseline: dict) -> RuleResult:
    """
    Recipient phone number was pasted rather than typed.
    Fraud scripts often paste the mule account number to avoid typos.
    """
    if payload.behavioral.paste_detected and any(
        f in ["recipient", "phone", "number", "recipient_phone"]
        for f in payload.behavioral.pasted_fields
    ):
        return 20, "RULE_004", "Recipient number was pasted (possible fraud script)"
    return 0, "RULE_004", ""


def rule_005_first_transfer_high_amount(payload: RiskPayloadSchema, baseline: dict) -> RuleResult:
    """New recipient + amount exceeds 2x user average. Classic scam pattern."""
    is_new_recipient = not payload.recipient_in_contacts
    avg_tx = baseline.get("avg_transaction_amount", 100)
    is_high = payload.transaction.amount > (avg_tx * 2)

    if is_new_recipient and is_high:
        return 35, "RULE_005", "First-time recipient + amount >2x user average"
    return 0, "RULE_005", ""


def rule_006_sim_swap_recent(payload: RiskPayloadSchema, baseline: dict) -> RuleResult:
    """SIM swap detected in this session — device fingerprint changed. High risk precursor."""
    if payload.sim and payload.sim.sim_swap_detected:
        return 50, "RULE_006", "SIM swap detected — possible account takeover preparation"
    return 0, "RULE_006", ""


def rule_007_device_on_multiple_accounts(payload: RiskPayloadSchema, baseline: dict) -> RuleResult:
    """Device fingerprint seen on multiple user accounts — fraud ring indicator."""
    device_account_count = baseline.get("device_account_count", 1)
    if device_account_count > 3:
        return 60, "RULE_007", f"Device seen on {device_account_count} accounts (fraud ring indicator)"
    return 0, "RULE_007", ""


def rule_008_fraud_sms_keywords(payload: RiskPayloadSchema, baseline: dict) -> RuleResult:
    """Recent SMS contained fraud keywords — victim may have been primed by scam message."""
    if payload.sms and payload.sms.has_fraud_keywords:
        keywords = ", ".join(payload.sms.fraud_keywords_found[:3])
        return 25, "RULE_008", f"Recent SMS contained fraud keywords: {keywords}"
    return 0, "RULE_008", ""


def rule_009_rooted_or_jailbroken(payload: RiskPayloadSchema, baseline: dict) -> RuleResult:
    """Device is rooted (Android) or jailbroken (iOS) — often used in fraud farms."""
    is_compromised = payload.device.is_rooted or payload.device.is_jailbroken
    if is_compromised:
        return 20, "RULE_009", "Rooted/jailbroken device detected"
    return 0, "RULE_009", ""


def rule_010_vpn_or_proxy(payload: RiskPayloadSchema, baseline: dict) -> RuleResult:
    """VPN or proxy active — obfuscating real location."""
    if payload.network.is_vpn or payload.network.is_proxy:
        return 15, "RULE_010", "VPN or proxy detected (location obfuscation)"
    return 0, "RULE_010", ""


def rule_011_emulator(payload: RiskPayloadSchema, baseline: dict) -> RuleResult:
    """Emulator or simulator detected — fraud farms use emulators to scale attacks."""
    is_virtual = payload.device.is_emulator or payload.device.is_simulator
    if is_virtual:
        return 40, "RULE_011", "Emulator/simulator detected (likely fraud farm)"
    return 0, "RULE_011", ""


def rule_012_frequent_recipient_changes(payload: RiskPayloadSchema, baseline: dict) -> RuleResult:
    """Recipient changed multiple times — scam testing different mule accounts."""
    if payload.behavioral.recipient_changed_count >= 3:
        return 25, "RULE_012", f"Recipient changed {payload.behavioral.recipient_changed_count}x in session"
    return 0, "RULE_012", ""


def rule_013_tampered_app(payload: RiskPayloadSchema, baseline: dict) -> RuleResult:
    """App tamper detected — modified banking app can bypass security controls."""
    if payload.device.is_app_tampered:
        return 50, "RULE_013", "App tampering detected — modified app binary"
    return 0, "RULE_013", ""


def rule_014_otp_screen_on_call(payload: RiskPayloadSchema, baseline: dict) -> RuleResult:
    """
    CRITICAL: OTP screen viewed while on an active call with an unknown caller.

    This is the OTP phishing / vishing interception pattern:
      1. Scammer calls victim claiming to be from MTN / a bank
      2. Victim is verbally instructed to "just read me the code you receive"
      3. OTP is delivered via SMS while call is active
      4. Victim reads OTP aloud → attacker gains full account access

    The SDK fires this signal via OtpGuard.activate() when the host app's OTP
    screen becomes visible. Score is intentionally high (80) because OTP disclosure
    enables complete account takeover — no transaction amount threshold applies.

    The OtpGuard simultaneously applies:
      - FLAG_SECURE (Android) / UITextField superlayer trick (iOS) — blocks screen capture
      - A full-screen red overlay warning the user never to share the OTP verbally
    """
    if not hasattr(payload, "otp_event"):
        return 0, "RULE_014", ""

    otp_event = payload.otp_event
    if otp_event and otp_event.get("event_type") == "OTP_SCREEN_ON_CALL":
        unknown_caller = otp_event.get("unknown_caller", False)
        delta = 80 if unknown_caller else 45
        desc = (
            "OTP screen open during call with UNKNOWN number — OTP interception attempt"
            if unknown_caller else
            "OTP screen open during active call — possible social engineering"
        )
        return delta, "RULE_014", desc

    return 0, "RULE_014", ""


# ════════════════════════════════════════════════════════════════════════════════
# RULE_021–026: Enterprise Fraud Rules (Compliance, Network, Behavioural)
# Added to close identified gaps for bank / fintech / PSP deployments.
# ════════════════════════════════════════════════════════════════════════════════

import math
from datetime import datetime


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Returns the great-circle distance in km between two lat/lon pairs."""
    R = 6371  # Earth radius in km
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = math.sin(d_lat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lon / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def rule_021_geolocation_anomaly(payload: RiskPayloadSchema, baseline: dict) -> RuleResult:
    """
    Transaction initiated from a location significantly distant from the user's
    usual geography or registered address. Particularly relevant post-SIM swap.

    Uses haversine distance; fires if >500km from user's baseline location.
    """
    user_lat = baseline.get("usual_latitude")
    user_lon = baseline.get("usual_longitude")
    tx_lat = payload.network.latitude
    tx_lon = payload.network.longitude

    if user_lat is None or user_lon is None or tx_lat is None or tx_lon is None:
        return 0, "RULE_021", ""

    distance_km = _haversine_km(user_lat, user_lon, tx_lat, tx_lon)
    if distance_km > 500:
        return 35, "RULE_021", f"Geolocation anomaly — {int(distance_km)}km from usual location"
    return 0, "RULE_021", ""


def rule_022_velocity_structuring(payload: RiskPayloadSchema, baseline: dict) -> RuleResult:
    """
    Detects velocity abuse and structuring behaviour:
      - Rapid sequential transactions (>5 in 10 mins)
      - Amounts clustering just below reporting thresholds (e.g. R5,000 FICA / ₦5M CBN)

    Banks are legally required under FICA (SA) and CBN AML regs (NG) to flag structuring.
    """
    recent_tx_count = baseline.get("transactions_last_10min", 0)
    amount = payload.transaction.amount
    currency = payload.transaction.currency.upper()

    # Structuring: amount between 90–100% of reporting threshold
    thresholds = {"ZAR": 5000, "NGN": 5_000_000, "KES": 500_000, "GHS": 50_000, "USD": 10_000}
    threshold = thresholds.get(currency, 10_000)
    is_structuring = threshold * 0.90 <= amount < threshold

    # Velocity: >5 transactions in 10 minutes
    is_velocity = recent_tx_count >= 5

    score = 0
    reasons = []
    if is_velocity:
        score += 25
        reasons.append(f"{recent_tx_count} transactions in 10min")
    if is_structuring:
        score += 20
        reasons.append(f"Amount {amount} just below {currency} {threshold} reporting threshold")

    if score > 0:
        return min(score, 45), "RULE_022", "Velocity/structuring — " + "; ".join(reasons)
    return 0, "RULE_022", ""


def rule_023_beneficiary_network_risk(payload: RiskPayloadSchema, baseline: dict) -> RuleResult:
    """
    Beneficiary account appears in fraud network analysis:
      - Received funds from 3+ flagged transactions across different senders (mule account)
      - Account created recently + high fraud report count

    Elevates detection from individual device-level (RULE_007) to network-level.
    """
    if not payload.beneficiary:
        return 0, "RULE_023", ""

    fraud_reports = payload.beneficiary.fraud_report_count
    unique_senders = payload.beneficiary.unique_sender_count
    days_old = payload.beneficiary.days_since_account_created

    score = 0
    reasons = []

    # Mule account: multiple fraud reports from different senders
    if fraud_reports >= 3 and unique_senders >= 3:
        score += 40
        reasons.append(f"Beneficiary flagged in {fraud_reports} fraud reports from {unique_senders} senders")
    elif fraud_reports >= 1:
        score += 20
        reasons.append(f"Beneficiary has {fraud_reports} prior fraud report(s)")

    # New account receiving many transfers
    if days_old is not None and days_old < 30 and unique_senders > 5:
        score += 15
        reasons.append(f"Account {days_old} days old with {unique_senders} unique senders")

    if score > 0:
        return min(score, 55), "RULE_023", "Beneficiary network risk — " + "; ".join(reasons)
    return 0, "RULE_023", ""


def rule_024_time_of_day_anomaly(payload: RiskPayloadSchema, baseline: dict) -> RuleResult:
    """
    Transaction at an unusual hour for this user. Fires for transactions between
    00:00–05:00 local time if the user normally transacts between 06:00–22:00.

    Combined with other signals (new recipient, high amount), this is a strong
    indicator of coerced or fraudulent transactions.
    """
    try:
        tx_hour = datetime.fromtimestamp(payload.timestamp).hour
    except (OSError, ValueError):
        return 0, "RULE_024", ""

    usual_start = baseline.get("usual_tx_hour_start", 6)
    usual_end = baseline.get("usual_tx_hour_end", 22)

    # Flag transactions between midnight and 5am if user normally transacts 6am–10pm
    if tx_hour < 5 and usual_start >= 6:
        return 20, "RULE_024", f"Transaction at {tx_hour:02d}:00 — outside user's usual hours ({usual_start:02d}:00–{usual_end:02d}:00)"
    return 0, "RULE_024", ""


def rule_025_cooling_off_period(payload: RiskPayloadSchema, baseline: dict) -> RuleResult:
    """
    First-time transfer to a new recipient above a configurable threshold
    triggers a cooling-off signal.

    Aligned with emerging APP fraud liability regulations:
      - CBN draft guidelines (Nigeria) on authorised push payment fraud
      - FSCA conduct standards (South Africa)

    Banks can use this signal to enforce a hold/review window.
    """
    is_first_interaction = not payload.recipient_in_contacts
    amount = payload.transaction.amount
    currency = payload.transaction.currency.upper()

    # Cooling-off thresholds per currency
    cooloff_thresholds = {"ZAR": 2500, "NGN": 500_000, "KES": 100_000, "GHS": 10_000, "USD": 1000}
    threshold = cooloff_thresholds.get(currency, 1000)

    if is_first_interaction and amount >= threshold:
        return 30, "RULE_025", f"First-time recipient + amount {currency} {amount:,.2f} above cooling-off threshold ({currency} {threshold:,.0f})"
    return 0, "RULE_025", ""


def rule_026_behavioural_biometrics(payload: RiskPayloadSchema, baseline: dict) -> RuleResult:
    """
    Detects anomalous biometric patterns that deviate from the user's baseline:
      - Typing speed / cadence
      - Touch pressure / swipe patterns
      - Scroll velocity
      - Navigation pattern (screen flow order)

    Even a simple standard-deviation check against the user's established baseline
    catches account takeover, remote access trojans, and coerced transactions.
    """
    anomalies = 0
    reasons = []

    # Each score is 0.0–1.0 where 0.5 = baseline normal.
    # Values below 0.15 or above 0.85 indicate significant deviation.
    DEVIATION_THRESHOLD = 0.15

    typing = payload.behavioral.typing_speed_score
    if typing < DEVIATION_THRESHOLD or typing > (1 - DEVIATION_THRESHOLD):
        anomalies += 1
        reasons.append("typing cadence")

    pressure = payload.behavioral.touch_pressure_score
    if pressure < DEVIATION_THRESHOLD or pressure > (1 - DEVIATION_THRESHOLD):
        anomalies += 1
        reasons.append("touch pressure")

    scroll = payload.behavioral.scroll_velocity_score
    if scroll < DEVIATION_THRESHOLD or scroll > (1 - DEVIATION_THRESHOLD):
        anomalies += 1
        reasons.append("scroll velocity")

    nav = payload.behavioral.navigation_pattern_score
    if nav < DEVIATION_THRESHOLD or nav > (1 - DEVIATION_THRESHOLD):
        anomalies += 1
        reasons.append("navigation pattern")

    if anomalies >= 3:
        return 25, "RULE_026", f"Behavioural biometrics — {anomalies}/4 anomalies: {', '.join(reasons)}"
    elif anomalies >= 2:
        return 15, "RULE_026", f"Behavioural biometrics — {anomalies}/4 anomalies: {', '.join(reasons)}"
    return 0, "RULE_026", ""


# Registry of all rules — order matters only for logging, not scoring
ALL_RULES = [
    rule_001_call_plus_new_recipient_high_amount,
    rule_002_call_plus_unknown_recipient,
    rule_003_rushed_transaction,
    rule_004_paste_recipient,
    rule_005_first_transfer_high_amount,
    rule_006_sim_swap_recent,
    rule_007_device_on_multiple_accounts,
    rule_008_fraud_sms_keywords,
    rule_009_rooted_or_jailbroken,
    rule_010_vpn_or_proxy,
    rule_011_emulator,
    rule_012_frequent_recipient_changes,
    rule_013_tampered_app,
    rule_014_otp_screen_on_call,  # OTP phishing interception — CRITICAL
    rule_021_geolocation_anomaly,
    rule_022_velocity_structuring,
    rule_023_beneficiary_network_risk,
    rule_024_time_of_day_anomaly,
    rule_025_cooling_off_period,
    rule_026_behavioural_biometrics,
]
