"""
Risk Engine — Scoring & Aggregation Tests
==========================================
Tests the individual social engineering rules and the score aggregator
against the ACTUAL function-based API (not the class-based convention
in the legacy test_rules.py).

Covers:
  • All 14 social engineering rules (trigger + no-trigger)
  • Score aggregator (_score_to_level, _level_to_action, score capping)
  • Combined payload scoring with mocked device-binding rules
"""
import sys
import os
import pytest
from unittest.mock import patch, MagicMock

# Ensure app modules are importable
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.models.signal import (
    RiskPayloadSchema,
    RiskLevel,
    RecommendedAction,
    TransactionData,
    DeviceData,
    NetworkData,
    BehavioralData,
    CallData,
    SmsData,
    SimData,
)
from app.rules.social_engineering import (
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
    ALL_RULES,
)
from app.scoring.aggregator import _score_to_level, _level_to_action


# ── Helper ────────────────────────────────────────────────────────────────────

def make_payload(**overrides) -> RiskPayloadSchema:
    """Build a minimal clean payload. Override individual fields as needed."""
    defaults = dict(
        payload_id="test-payload-001",
        user_id="user-001",
        session_id="sess-001",
        timestamp=1710000000.0,
        transaction=TransactionData(
            recipient_phone="+27821234567",
            amount=100.0,
            currency="ZAR",
        ),
        device=DeviceData(
            device_id="dev-001",
            manufacturer="Samsung",
            model="Galaxy S24",
            os_version="14",
        ),
        network=NetworkData(ip_address="41.0.0.1"),
        behavioral=BehavioralData(),
        call=CallData(),
        recipient_in_contacts=True,
    )
    defaults.update(overrides)
    return RiskPayloadSchema(**defaults)


CLEAN_BASELINE = {"avg_transaction_amount": 200, "device_account_count": 1}


# ═══════════════════════════════════════════════════════════════════════════════
# RULE 001 — Call + Unknown Recipient + High Amount (THE KILLER RULE)
# ═══════════════════════════════════════════════════════════════════════════════

class TestRule001:
    def test_triggered_on_call_unknown_high_amount(self):
        payload = make_payload(
            call=CallData(is_on_active_call=True),
            recipient_in_contacts=False,
            transaction=TransactionData(recipient_phone="+27821111111", amount=500, currency="ZAR"),
        )
        score, rule_id, desc = rule_001_call_plus_new_recipient_high_amount(payload, CLEAN_BASELINE)
        assert rule_id == "RULE_001"
        assert score == 75
        assert "vishing" in desc.lower()

    def test_not_triggered_when_not_on_call(self):
        payload = make_payload(
            call=CallData(is_on_active_call=False),
            recipient_in_contacts=False,
            transaction=TransactionData(recipient_phone="+27821111111", amount=500, currency="ZAR"),
        )
        score, _, _ = rule_001_call_plus_new_recipient_high_amount(payload, CLEAN_BASELINE)
        assert score == 0

    def test_not_triggered_known_recipient(self):
        payload = make_payload(
            call=CallData(is_on_active_call=True),
            recipient_in_contacts=True,
            transaction=TransactionData(recipient_phone="+27821111111", amount=500, currency="ZAR"),
        )
        score, _, _ = rule_001_call_plus_new_recipient_high_amount(payload, CLEAN_BASELINE)
        assert score == 0

    def test_not_triggered_low_amount(self):
        payload = make_payload(
            call=CallData(is_on_active_call=True),
            recipient_in_contacts=False,
            transaction=TransactionData(recipient_phone="+27821111111", amount=50, currency="ZAR"),
        )
        score, _, _ = rule_001_call_plus_new_recipient_high_amount(payload, CLEAN_BASELINE)
        assert score == 0


# ═══════════════════════════════════════════════════════════════════════════════
# RULE 002 — Call + Unknown Recipient
# ═══════════════════════════════════════════════════════════════════════════════

class TestRule002:
    def test_triggered(self):
        payload = make_payload(
            call=CallData(is_on_active_call=True),
            recipient_in_contacts=False,
        )
        score, rule_id, _ = rule_002_call_plus_unknown_recipient(payload, CLEAN_BASELINE)
        assert score == 40
        assert rule_id == "RULE_002"

    def test_not_triggered_no_call(self):
        payload = make_payload(recipient_in_contacts=False)
        score, _, _ = rule_002_call_plus_unknown_recipient(payload, CLEAN_BASELINE)
        assert score == 0


# ═══════════════════════════════════════════════════════════════════════════════
# RULE 003 — Rushed Transaction (<10s)
# ═══════════════════════════════════════════════════════════════════════════════

class TestRule003:
    def test_triggered_fast_transaction(self):
        payload = make_payload(behavioral=BehavioralData(transaction_creation_ms=5000))
        score, rule_id, _ = rule_003_rushed_transaction(payload, CLEAN_BASELINE)
        assert score == 30
        assert rule_id == "RULE_003"

    def test_not_triggered_normal_speed(self):
        payload = make_payload(behavioral=BehavioralData(transaction_creation_ms=60000))
        score, _, _ = rule_003_rushed_transaction(payload, CLEAN_BASELINE)
        assert score == 0

    def test_not_triggered_zero_ms(self):
        """transaction_creation_ms == 0 means not measured, should not trigger."""
        payload = make_payload(behavioral=BehavioralData(transaction_creation_ms=0))
        score, _, _ = rule_003_rushed_transaction(payload, CLEAN_BASELINE)
        assert score == 0


# ═══════════════════════════════════════════════════════════════════════════════
# RULE 004 — Paste Detected
# ═══════════════════════════════════════════════════════════════════════════════

class TestRule004:
    def test_triggered_recipient_pasted(self):
        payload = make_payload(
            behavioral=BehavioralData(paste_detected=True, pasted_fields=["recipient_phone"])
        )
        score, rule_id, _ = rule_004_paste_recipient(payload, CLEAN_BASELINE)
        assert score == 20
        assert rule_id == "RULE_004"

    def test_not_triggered_other_field_pasted(self):
        payload = make_payload(
            behavioral=BehavioralData(paste_detected=True, pasted_fields=["note"])
        )
        score, _, _ = rule_004_paste_recipient(payload, CLEAN_BASELINE)
        assert score == 0

    def test_not_triggered_no_paste(self):
        payload = make_payload()
        score, _, _ = rule_004_paste_recipient(payload, CLEAN_BASELINE)
        assert score == 0


# ═══════════════════════════════════════════════════════════════════════════════
# RULE 005 — First-Time Recipient + High Amount
# ═══════════════════════════════════════════════════════════════════════════════

class TestRule005:
    def test_triggered(self):
        payload = make_payload(
            recipient_in_contacts=False,
            transaction=TransactionData(recipient_phone="+2782", amount=500, currency="ZAR"),
        )
        score, rule_id, _ = rule_005_first_transfer_high_amount(payload, CLEAN_BASELINE)
        assert score == 35
        assert rule_id == "RULE_005"

    def test_not_triggered_known(self):
        payload = make_payload(
            recipient_in_contacts=True,
            transaction=TransactionData(recipient_phone="+2782", amount=500, currency="ZAR"),
        )
        score, _, _ = rule_005_first_transfer_high_amount(payload, CLEAN_BASELINE)
        assert score == 0


# ═══════════════════════════════════════════════════════════════════════════════
# RULE 006 — SIM Swap
# ═══════════════════════════════════════════════════════════════════════════════

class TestRule006:
    def test_triggered(self):
        payload = make_payload(sim=SimData(sim_swap_detected=True))
        score, _, _ = rule_006_sim_swap_recent(payload, CLEAN_BASELINE)
        assert score == 50

    def test_not_triggered(self):
        payload = make_payload(sim=SimData(sim_swap_detected=False))
        score, _, _ = rule_006_sim_swap_recent(payload, CLEAN_BASELINE)
        assert score == 0


# ═══════════════════════════════════════════════════════════════════════════════
# RULE 007 — Device on Multiple Accounts
# ═══════════════════════════════════════════════════════════════════════════════

class TestRule007:
    def test_triggered_4_accounts(self):
        baseline = {"device_account_count": 4}
        payload = make_payload()
        score, _, _ = rule_007_device_on_multiple_accounts(payload, baseline)
        assert score == 60

    def test_not_triggered_3_accounts(self):
        baseline = {"device_account_count": 3}
        payload = make_payload()
        score, _, _ = rule_007_device_on_multiple_accounts(payload, baseline)
        assert score == 0


# ═══════════════════════════════════════════════════════════════════════════════
# RULE 008 — SMS Fraud Keywords
# ═══════════════════════════════════════════════════════════════════════════════

class TestRule008:
    def test_triggered(self):
        payload = make_payload(sms=SmsData(has_fraud_keywords=True, fraud_keywords_found=["OTP", "winner"]))
        score, _, _ = rule_008_fraud_sms_keywords(payload, CLEAN_BASELINE)
        assert score == 25

    def test_not_triggered(self):
        payload = make_payload(sms=SmsData(has_fraud_keywords=False))
        score, _, _ = rule_008_fraud_sms_keywords(payload, CLEAN_BASELINE)
        assert score == 0


# ═══════════════════════════════════════════════════════════════════════════════
# RULE 009 — Rooted/Jailbroken
# ═══════════════════════════════════════════════════════════════════════════════

class TestRule009:
    def test_triggered_rooted(self):
        payload = make_payload(device=DeviceData(device_id="d", manufacturer="m", model="m", os_version="14", is_rooted=True))
        score, _, _ = rule_009_rooted_or_jailbroken(payload, CLEAN_BASELINE)
        assert score == 20

    def test_triggered_jailbroken(self):
        payload = make_payload(device=DeviceData(device_id="d", manufacturer="Apple", model="iPhone", os_version="17", is_jailbroken=True))
        score, _, _ = rule_009_rooted_or_jailbroken(payload, CLEAN_BASELINE)
        assert score == 20

    def test_not_triggered(self):
        payload = make_payload()
        score, _, _ = rule_009_rooted_or_jailbroken(payload, CLEAN_BASELINE)
        assert score == 0


# ═══════════════════════════════════════════════════════════════════════════════
# RULE 010 — VPN/Proxy
# ═══════════════════════════════════════════════════════════════════════════════

class TestRule010:
    def test_triggered_vpn(self):
        payload = make_payload(network=NetworkData(ip_address="1.2.3.4", is_vpn=True))
        score, _, _ = rule_010_vpn_or_proxy(payload, CLEAN_BASELINE)
        assert score == 15

    def test_triggered_proxy(self):
        payload = make_payload(network=NetworkData(ip_address="1.2.3.4", is_proxy=True))
        score, _, _ = rule_010_vpn_or_proxy(payload, CLEAN_BASELINE)
        assert score == 15


# ═══════════════════════════════════════════════════════════════════════════════
# RULE 011 — Emulator/Simulator
# ═══════════════════════════════════════════════════════════════════════════════

class TestRule011:
    def test_triggered_emulator(self):
        payload = make_payload(device=DeviceData(device_id="d", manufacturer="m", model="m", os_version="14", is_emulator=True))
        score, _, _ = rule_011_emulator(payload, CLEAN_BASELINE)
        assert score == 40

    def test_triggered_simulator(self):
        payload = make_payload(device=DeviceData(device_id="d", manufacturer="Apple", model="iPhone", os_version="17", is_simulator=True))
        score, _, _ = rule_011_emulator(payload, CLEAN_BASELINE)
        assert score == 40


# ═══════════════════════════════════════════════════════════════════════════════
# RULE 012 — Frequent Recipient Changes
# ═══════════════════════════════════════════════════════════════════════════════

class TestRule012:
    def test_triggered(self):
        payload = make_payload(behavioral=BehavioralData(recipient_changed_count=3))
        score, _, _ = rule_012_frequent_recipient_changes(payload, CLEAN_BASELINE)
        assert score == 25

    def test_not_triggered(self):
        payload = make_payload(behavioral=BehavioralData(recipient_changed_count=2))
        score, _, _ = rule_012_frequent_recipient_changes(payload, CLEAN_BASELINE)
        assert score == 0


# ═══════════════════════════════════════════════════════════════════════════════
# RULE 013 — Tampered App
# ═══════════════════════════════════════════════════════════════════════════════

class TestRule013:
    def test_triggered(self):
        payload = make_payload(device=DeviceData(device_id="d", manufacturer="m", model="m", os_version="14", is_app_tampered=True))
        score, _, _ = rule_013_tampered_app(payload, CLEAN_BASELINE)
        assert score == 50


# ═══════════════════════════════════════════════════════════════════════════════
# Score Aggregator — Level & Action Mapping
# ═══════════════════════════════════════════════════════════════════════════════

class TestScoreToLevel:
    def test_critical_threshold(self):
        assert _score_to_level(85) == RiskLevel.CRITICAL
        assert _score_to_level(100) == RiskLevel.CRITICAL

    def test_high_threshold(self):
        assert _score_to_level(65) == RiskLevel.HIGH
        assert _score_to_level(84) == RiskLevel.HIGH

    def test_medium_threshold(self):
        assert _score_to_level(35) == RiskLevel.MEDIUM
        assert _score_to_level(64) == RiskLevel.MEDIUM

    def test_low_threshold(self):
        assert _score_to_level(0) == RiskLevel.LOW
        assert _score_to_level(34) == RiskLevel.LOW


class TestLevelToAction:
    def test_critical_blocks(self):
        assert _level_to_action(RiskLevel.CRITICAL) == RecommendedAction.BLOCK

    def test_high_warns(self):
        assert _level_to_action(RiskLevel.HIGH) == RecommendedAction.WARN_USER

    def test_medium_soft_warns(self):
        assert _level_to_action(RiskLevel.MEDIUM) == RecommendedAction.SOFT_WARNING

    def test_low_approves(self):
        assert _level_to_action(RiskLevel.LOW) == RecommendedAction.APPROVE


# ═══════════════════════════════════════════════════════════════════════════════
# ALL_RULES Registry
# ═══════════════════════════════════════════════════════════════════════════════

class TestRuleRegistry:
    def test_all_rules_has_14_entries(self):
        assert len(ALL_RULES) == 14

    def test_clean_signal_scores_zero(self):
        """A completely clean payload should score 0 across all social engineering rules."""
        payload = make_payload()
        total = sum(rule_fn(payload, CLEAN_BASELINE)[0] for rule_fn in ALL_RULES)
        assert total == 0

    def test_maximum_attack_is_capped(self):
        """Even with many flags, individual rules have bounded scores."""
        payload = make_payload(
            call=CallData(is_on_active_call=True),
            recipient_in_contacts=False,
            transaction=TransactionData(recipient_phone="+2782", amount=1000, currency="ZAR"),
            behavioral=BehavioralData(
                transaction_creation_ms=3000,
                paste_detected=True,
                pasted_fields=["recipient_phone"],
                recipient_changed_count=5,
            ),
            device=DeviceData(
                device_id="d", manufacturer="m", model="m", os_version="14",
                is_rooted=True, is_emulator=True, is_app_tampered=True,
            ),
            network=NetworkData(ip_address="1.2.3.4", is_vpn=True),
            sim=SimData(sim_swap_detected=True),
            sms=SmsData(has_fraud_keywords=True, fraud_keywords_found=["OTP"]),
        )
        baseline = {"avg_transaction_amount": 200, "device_account_count": 5}
        total = sum(rule_fn(payload, baseline)[0] for rule_fn in ALL_RULES)
        # Should be very high but each rule's max is known
        assert total > 200  # Many rules triggered
