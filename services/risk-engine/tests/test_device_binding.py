"""
Standalone tests for device binding rules RULE_015-020.
These test the device_binding module in isolation without importing the
full social_engineering or aggregator stacks.
"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.rules.device_binding import evaluate_device_binding_rules


def db_signal(**overrides) -> dict:
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


def test_rule_015_new_device():
    result = evaluate_device_binding_rules(db_signal(device_trust_status="new_device"))
    assert "RULE_015" in result.triggered_rules
    assert result.score_delta >= 55
    assert result.requires_step_up is True
    assert result.step_up_method == "otp_verification"


def test_rule_015_trusted_device_clean():
    result = evaluate_device_binding_rules(db_signal())
    assert result.triggered_rules == []
    assert result.score_delta == 0


def test_rule_016_blacklisted_device():
    result = evaluate_device_binding_rules(
        db_signal(device_trust_status="suspicious_device", device_classification="blacklisted")
    )
    assert "RULE_016" in result.triggered_rules
    assert result.score_delta >= 80
    assert result.step_up_method == "support_confirmation"


def test_rule_017_multi_account_device():
    result = evaluate_device_binding_rules(db_signal(device_account_count=5))
    assert "RULE_017" in result.triggered_rules
    assert result.score_delta >= 60


def test_rule_017_threshold_boundary():
    result = evaluate_device_binding_rules(db_signal(device_account_count=3))
    assert "RULE_017" not in result.triggered_rules


def test_rule_018_emulator():
    result = evaluate_device_binding_rules(db_signal(device_is_emulator=True))
    assert "RULE_018" in result.triggered_rules
    assert result.score_delta >= 40


def test_rule_019_country_mismatch():
    result = evaluate_device_binding_rules(db_signal(device_country_mismatch=True))
    assert "RULE_019" in result.triggered_rules
    assert result.score_delta >= 35


def test_rule_020_rapid_switch():
    result = evaluate_device_binding_rules(db_signal(device_rapid_switch=True))
    assert "RULE_020" in result.triggered_rules
    assert result.score_delta >= 45


def test_no_double_counting():
    result = evaluate_device_binding_rules(
        db_signal(device_trust_status="new_device", device_binding_risk_delta=55)
    )
    assert result.score_delta == 0
