"""
Device Binding Rules (RULE_015 – RULE_020)
==========================================
Evaluates device trust signals returned by the device-binding-service
and maps them to weighted risk score deltas.

Integrated into the Risk Engine aggregator alongside the existing 14 rules.
The device-binding-service is queried internally; in the transaction hot-path
the SDK sends the device_trust_status directly in the signal payload so the
risk engine does NOT need to make a synchronous HTTP call (avoiding latency).
"""
from __future__ import annotations
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# ── Rule thresholds ────────────────────────────────────────────────────────────
MULTI_ACCOUNT_THRESHOLD = 3   # RULE_017: device linked to > N accounts


class DeviceBindingResult:
    """Accumulates risk score and rule firings from device binding evaluation."""

    def __init__(
        self,
        score_delta: int = 0,
        triggered_rules: Optional[list[str]] = None,
        requires_step_up: bool = False,
        step_up_method:   Optional[str] = None,
    ):
        self.score_delta      = score_delta
        self.triggered_rules  = triggered_rules or []
        self.requires_step_up = requires_step_up
        self.step_up_method   = step_up_method


def evaluate_device_binding_rules(signal: dict) -> DeviceBindingResult:
    """
    Main entry point called by the Risk Engine aggregator.

    Expected signal keys (injected by the SDK into the fraud signal payload):
        device_trust_status (str)  : 'trusted' | 'new_device' | 'suspicious_device'
        device_classification (str): 'trusted' | 'unknown' | 'high_risk' | 'blacklisted'
        device_account_count (int) : number of accounts linked to this device
        device_is_emulator (bool)  : True if emulator detected
        device_is_rooted (bool)    : True if device is rooted/jailbroken
        device_country_mismatch (bool): True if SIM country ≠ IP country
        device_rapid_switch (bool) : True if < 30min since device change
        device_binding_rules (list): rules already fired by device-binding-service
    """
    result   = DeviceBindingResult()
    score    = 0
    rules: list[str] = []

    trust_status      = signal.get("device_trust_status",      "unknown")
    classification    = signal.get("device_classification",    "unknown")
    account_count     = int(signal.get("device_account_count",  0))
    is_emulator       = bool(signal.get("device_is_emulator",   False))
    is_rooted         = bool(signal.get("device_is_rooted",     False))
    country_mismatch  = bool(signal.get("device_country_mismatch", False))
    rapid_switch      = bool(signal.get("device_rapid_switch",  False))

    # Pre-computed risk delta from device-binding-service (avoid double counting)
    binding_delta = int(signal.get("device_binding_risk_delta", 0))

    # ── RULE_015: New / unrecognised device ───────────────────────────────────
    if trust_status == "new_device":
        score += 55
        rules.append("RULE_015")
        result.requires_step_up = True
        result.step_up_method   = "otp_verification"
        logger.info("RULE_015 fired: new device for user — +55 pts, step-up required")

    # ── RULE_016: Blacklisted / suspicious device ─────────────────────────────
    if trust_status == "suspicious_device" or classification == "blacklisted":
        score += 80
        rules.append("RULE_016")
        result.requires_step_up = True
        result.step_up_method   = "support_confirmation"
        logger.warning("RULE_016 fired: blacklisted/suspicious device — +80 pts")

    # ── RULE_017: Device linked to multiple accounts (mule ring signal) ───────
    if account_count > MULTI_ACCOUNT_THRESHOLD:
        score += 60
        rules.append("RULE_017")
        logger.warning(
            "RULE_017 fired: device linked to %d accounts (threshold %d) — +60 pts",
            account_count, MULTI_ACCOUNT_THRESHOLD,
        )

    # ── RULE_018: Emulator detected ───────────────────────────────────────────
    if is_emulator:
        score += 40
        rules.append("RULE_018")
        logger.warning("RULE_018 fired: emulator detected — +40 pts")

    # ── RULE_019: Device country mismatch (SIM ≠ IP geo) ─────────────────────
    if country_mismatch:
        score += 35
        rules.append("RULE_019")
        logger.info("RULE_019 fired: device country mismatch — +35 pts")

    # ── RULE_020: Rapid device switching (< 30min) ────────────────────────────
    if rapid_switch:
        score += 45
        rules.append("RULE_020")
        logger.warning("RULE_020 fired: rapid device switching detected — +45 pts")

    # Subtract any score already applied by device-binding-service to avoid double-counting
    score = max(0, score - binding_delta)

    result.score_delta     = score
    result.triggered_rules = rules
    return result
