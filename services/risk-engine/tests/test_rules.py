"""
Unit tests for the Fraud Shield Risk Engine.
Tests each fraud rule individually, aggregation logic, edge cases, score capping,
and all 6 device binding rules (RULE_015-020).
"""
import pytest
from app.rules.social_engineering import SocialEngineeringRules
from app.rules.device_intelligence import evaluate_device_intelligence, DEVICE_BLACKLIST
from app.rules.device_binding import evaluate_device_binding_rules
from app.scoring.aggregator import aggregate_score

# ── Fixtures ──────────────────────────────────────────────────────────────────

def base_signal(**overrides) -> dict:
    """Returns a minimal valid signal with all flags off."""
    defaults = {
        "device_fingerprint": "test-device-abc123",
        "build_fingerprint": "generic/sdk_gphone",
        "is_rooted": False,
        "is_emulator": False,
        "on_call": False,
        "call_duration_s": 0,
        "unknown_caller": False,
        "new_recipient": False,
        "recipient_not_in_contacts": False,
        "amount": 100.0,
        "user_avg_tx_amount": 200.0,
        "session_elapsed_s": 60,
        "paste_detected": False,
        "sim_swapped_last_48h": False,
        "sms_fraud_keywords": [],
        "vpn_active": False,
        "associated_accounts": [],
    }
    defaults.update(overrides)
    return defaults


def db_signal(**overrides) -> dict:
    """Minimal device-binding signal with all flags off (trusted, known device)."""
    defaults = {
        "device_trust_status":       "trusted",
        "device_classification":     "trusted",
        "device_account_count":      1,
        "device_is_emulator":        False,
        "device_is_rooted":          False,
        "device_country_mismatch":   False,
        "device_rapid_switch":       False,
        "device_binding_risk_delta": 0,
    }
    defaults.update(overrides)
    return defaults


# ── RULE_001: On call + new recipient + high amount ───────────────────────────

def test_rule_001_triggered():
    signal = base_signal(on_call=True, new_recipient=True, amount=5000.0, user_avg_tx_amount=500.0)
    rules = SocialEngineeringRules(signal)
    result = rules.evaluate()
    assert "RULE_001" in result.triggered_rules
    assert result.score_delta >= 75


def test_rule_001_not_triggered_no_call():
    signal = base_signal(on_call=False, new_recipient=True, amount=5000.0, user_avg_tx_amount=500.0)
    rules = SocialEngineeringRules(signal)
    result = rules.evaluate()
    assert "RULE_001" not in result.triggered_rules


# ── RULE_002: On call + recipient not in contacts ─────────────────────────────

def test_rule_002_triggered():
    signal = base_signal(on_call=True, recipient_not_in_contacts=True)
    rules = SocialEngineeringRules(signal)
    result = rules.evaluate()
    assert "RULE_002" in result.triggered_rules


def test_rule_002_not_triggered_known_recipient():
    signal = base_signal(on_call=True, recipient_not_in_contacts=False)
    rules = SocialEngineeringRules(signal)
    result = rules.evaluate()
    assert "RULE_002" not in result.triggered_rules


# ── RULE_003: Transaction < 10s of session start ──────────────────────────────

def test_rule_003_triggered():
    signal = base_signal(session_elapsed_s=5)
    rules = SocialEngineeringRules(signal)
    result = rules.evaluate()
    assert "RULE_003" in result.triggered_rules


def test_rule_003_not_triggered_long_session():
    signal = base_signal(session_elapsed_s=120)
    rules = SocialEngineeringRules(signal)
    result = rules.evaluate()
    assert "RULE_003" not in result.triggered_rules


# ── RULE_004: Paste detected ──────────────────────────────────────────────────

def test_rule_004_triggered():
    signal = base_signal(paste_detected=True)
    rules = SocialEngineeringRules(signal)
    result = rules.evaluate()
    assert "RULE_004" in result.triggered_rules


# ── RULE_005: New recipient + amount > 2× avg ─────────────────────────────────

def test_rule_005_triggered():
    signal = base_signal(new_recipient=True, amount=1000.0, user_avg_tx_amount=400.0)
    rules = SocialEngineeringRules(signal)
    result = rules.evaluate()
    assert "RULE_005" in result.triggered_rules


def test_rule_005_not_triggered_normal_amount():
    signal = base_signal(new_recipient=True, amount=300.0, user_avg_tx_amount=400.0)
    rules = SocialEngineeringRules(signal)
    result = rules.evaluate()
    assert "RULE_005" not in result.triggered_rules


# ── RULE_006: SIM swap ────────────────────────────────────────────────────────

def test_rule_006_triggered():
    signal = base_signal(sim_swapped_last_48h=True)
    rules = SocialEngineeringRules(signal)
    result = rules.evaluate()
    assert "RULE_006" in result.triggered_rules


# ── RULE_008: SMS fraud keywords ──────────────────────────────────────────────

def test_rule_008_triggered():
    signal = base_signal(sms_fraud_keywords=["OTP", "winner"])
    rules = SocialEngineeringRules(signal)
    result = rules.evaluate()
    assert "RULE_008" in result.triggered_rules


# ── RULE_009: Rooted device ───────────────────────────────────────────────────

def test_rule_009_triggered():
    signal = base_signal(is_rooted=True)
    rules = SocialEngineeringRules(signal)
    result = rules.evaluate()
    assert "RULE_009" in result.triggered_rules


# ── RULE_010: VPN/proxy ───────────────────────────────────────────────────────

def test_rule_010_triggered():
    signal = base_signal(vpn_active=True)
    rules = SocialEngineeringRules(signal)
    result = rules.evaluate()
    assert "RULE_010" in result.triggered_rules


# ── Device Intelligence: Blacklist ────────────────────────────────────────────

def test_device_blacklist():
    fp = "blacklisted-device-fp-xyz"
    DEVICE_BLACKLIST.add(fp)
    result = evaluate_device_intelligence({"device_fingerprint": fp, "associated_accounts": []})
    assert result.is_blacklisted is True
    assert result.score_delta >= 80
    DEVICE_BLACKLIST.discard(fp)


def test_device_emulator_pattern():
    result = evaluate_device_intelligence({
        "device_fingerprint": "clean-fp",
        "build_fingerprint": "generic/sdk_gphone_x86/sdk_gphone_x86",
        "is_emulator": False,
        "associated_accounts": [],
    })
    assert result.is_emulator is True


def test_device_velocity_threshold():
    accounts = [f"+2782100{i:04d}" for i in range(5)]
    result = evaluate_device_intelligence({
        "device_fingerprint": "velocity-device-fp",
        "build_fingerprint": "normal_build",
        "associated_accounts": accounts,
    })
    assert result.velocity_flag is True
    assert "RULE_007" in result.triggered_rules


# ── Score Aggregation ─────────────────────────────────────────────────────────

def test_score_capped_at_100():
    """Aggregate should never return a score > 100."""
    signal = base_signal(
        on_call=True,
        new_recipient=True,
        amount=5000.0,
        user_avg_tx_amount=200.0,
        recipient_not_in_contacts=True,
        session_elapsed_s=3,
        paste_detected=True,
        sim_swapped_last_48h=True,
        sms_fraud_keywords=["OTP"],
        is_rooted=True,
        vpn_active=True,
    )
    decision = aggregate_score(signal)
    assert decision.risk_score <= 100


def test_clean_signal_low_score():
    """A completely clean signal should score near 0."""
    signal = base_signal()
    decision = aggregate_score(signal)
    assert decision.risk_score < 10
    assert decision.risk_level == "LOW"
    assert decision.recommended_action == "ALLOW"


def test_high_risk_triggers_block():
    signal = base_signal(
        on_call=True,
        new_recipient=True,
        amount=10000.0,
        user_avg_tx_amount=300.0,
        sim_swapped_last_48h=True,
    )
    decision = aggregate_score(signal)
    assert decision.risk_level in ("HIGH",)
    assert decision.recommended_action in ("BLOCK", "WARN_USER")


# ── Device Binding Rules (RULE_015-020) ───────────────────────────────────────

def test_rule_015_new_device():
    """New device triggers RULE_015 and requires step-up."""
    result = evaluate_device_binding_rules(db_signal(device_trust_status="new_device"))
    assert "RULE_015" in result.triggered_rules
    assert result.score_delta >= 55
    assert result.requires_step_up is True
    assert result.step_up_method == "otp_verification"


def test_rule_015_trusted_device_clean():
    """Trusted known device should fire no rules."""
    result = evaluate_device_binding_rules(db_signal())
    assert result.triggered_rules == []
    assert result.score_delta == 0


def test_rule_016_blacklisted_device():
    """Blacklisted device triggers RULE_016 with +80 score."""
    result = evaluate_device_binding_rules(
        db_signal(device_trust_status="suspicious_device", device_classification="blacklisted")
    )
    assert "RULE_016" in result.triggered_rules
    assert result.score_delta >= 80
    assert result.step_up_method == "support_confirmation"


def test_rule_017_multi_account_device():
    """Device linked to > 3 accounts triggers RULE_017 (+60 pts)."""
    result = evaluate_device_binding_rules(db_signal(device_account_count=5))
    assert "RULE_017" in result.triggered_rules
    assert result.score_delta >= 60


def test_rule_017_threshold_boundary():
    """Exactly 3 accounts should NOT trigger RULE_017."""
    result = evaluate_device_binding_rules(db_signal(device_account_count=3))
    assert "RULE_017" not in result.triggered_rules


def test_rule_018_emulator():
    """Emulator detected triggers RULE_018 (+40 pts)."""
    result = evaluate_device_binding_rules(db_signal(device_is_emulator=True))
    assert "RULE_018" in result.triggered_rules
    assert result.score_delta >= 40


def test_rule_019_country_mismatch():
    """Device/SIM country mismatch triggers RULE_019 (+35 pts)."""
    result = evaluate_device_binding_rules(db_signal(device_country_mismatch=True))
    assert "RULE_019" in result.triggered_rules
    assert result.score_delta >= 35


def test_rule_020_rapid_switch():
    """Rapid device switching triggers RULE_020 (+45 pts)."""
    result = evaluate_device_binding_rules(db_signal(device_rapid_switch=True))
    assert "RULE_020" in result.triggered_rules
    assert result.score_delta >= 45


def test_device_binding_no_double_counting():
    """Score already applied by device-binding-service is subtracted to prevent double-counting."""
    result = evaluate_device_binding_rules(
        db_signal(device_trust_status="new_device", device_binding_risk_delta=55)
    )
    # RULE_015 fires (+55), then 55 is subtracted -> net 0
    assert result.score_delta == 0
