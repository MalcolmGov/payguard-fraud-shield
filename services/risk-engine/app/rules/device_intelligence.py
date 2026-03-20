"""
Device Intelligence Rules
Checks device reputation, emulator flags, and behavioral velocity.
"""
from __future__ import annotations
from typing import Optional
import logging

logger = logging.getLogger(__name__)

# Simulated in-memory blacklists (replace with DB lookups via postgres.py)
DEVICE_BLACKLIST: set[str] = set()
EMULATOR_FINGERPRINT_PATTERNS = [
    "generic",
    "sdk_gphone",
    "emulator",
    "android_sdk_built_for_x86",
    "goldfish",
    "ranchu",
]


class DeviceIntelligenceResult:
    def __init__(
        self,
        is_blacklisted: bool = False,
        is_emulator: bool = False,
        account_count: int = 1,
        velocity_flag: bool = False,
        score_delta: int = 0,
        triggered_rules: list[str] | None = None,
    ):
        self.is_blacklisted = is_blacklisted
        self.is_emulator = is_emulator
        self.account_count = account_count
        self.velocity_flag = velocity_flag
        self.score_delta = score_delta
        self.triggered_rules = triggered_rules or []


def check_device_blacklist(device_fingerprint: str) -> bool:
    """
    Returns True if the device fingerprint is on the global fraud blacklist.
    In production this queries the PostgreSQL device_blacklist table.
    """
    return device_fingerprint in DEVICE_BLACKLIST


def check_emulator_pattern(build_fingerprint: str) -> bool:
    """
    Returns True if the build fingerprint matches known emulator patterns.
    Used to flag automated fraud operations running on emulators.
    """
    fingerprint_lower = build_fingerprint.lower()
    return any(pattern in fingerprint_lower for pattern in EMULATOR_FINGERPRINT_PATTERNS)


def check_device_velocity(
    device_fingerprint: str,
    associated_accounts: Optional[list[str]] = None,
    threshold: int = 3,
) -> tuple[bool, int]:
    """
    Returns (is_flagged, account_count).
    Flags if a single device is associated with more than `threshold` distinct accounts.
    In production, queries Redis velocity counters updated by the graph engine.
    """
    if associated_accounts is None:
        associated_accounts = []
    count = len(associated_accounts)
    return count > threshold, count


def evaluate_device_intelligence(signal: dict) -> DeviceIntelligenceResult:
    """
    Main entry point for device intelligence evaluation.
    Accepts a signal dict (subset of RiskPayload) and returns a DeviceIntelligenceResult.
    
    Expected signal keys:
      - device_fingerprint (str)
      - build_fingerprint (str)
      - is_rooted (bool)
      - is_emulator (bool)
      - associated_accounts (list[str])
    """
    result = DeviceIntelligenceResult()
    score = 0
    rules: list[str] = []

    device_fingerprint: str = signal.get("device_fingerprint", "")
    build_fingerprint: str = signal.get("build_fingerprint", "")
    is_rooted: bool = signal.get("is_rooted", False)
    is_emulator_flag: bool = signal.get("is_emulator", False)
    associated_accounts: list[str] = signal.get("associated_accounts", [])

    # ── Blacklist check ─────────────────────────────────────────────────────
    if check_device_blacklist(device_fingerprint):
        result.is_blacklisted = True
        score += 80
        rules.append("DEVICE_BLACKLIST")
        logger.warning("Device %s is blacklisted", device_fingerprint)

    # ── Emulator detection ───────────────────────────────────────────────────
    if is_emulator_flag or check_emulator_pattern(build_fingerprint):
        result.is_emulator = True
        # RULE_009 overlap handled in aggregator; separate delta here
        score += 15
        rules.append("DEVICE_EMULATOR_PATTERN")
        logger.info("Emulator detected: %s", build_fingerprint)

    # ── Velocity check: 1 device → many accounts ────────────────────────────
    flagged, account_count = check_device_velocity(device_fingerprint, associated_accounts)
    result.account_count = account_count
    if flagged:
        result.velocity_flag = True
        score += 60
        rules.append("RULE_007")
        logger.warning(
            "Device %s linked to %d accounts (threshold exceeded)",
            device_fingerprint,
            account_count,
        )

    result.score_delta = score
    result.triggered_rules = rules
    return result


def add_to_blacklist(device_fingerprint: str) -> None:
    """
    Adds a device fingerprint to the in-memory blacklist.
    Called by the fraud analyst dashboard 'block device' action.
    In production this writes to PostgreSQL and invalidates the Redis cache.
    """
    DEVICE_BLACKLIST.add(device_fingerprint)
    logger.info("Device %s added to blacklist", device_fingerprint)
