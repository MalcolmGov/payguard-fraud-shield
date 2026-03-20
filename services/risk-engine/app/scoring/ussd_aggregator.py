"""
USSD Score Aggregator
=====================
Runs all USSD fraud rules, aggregates scores, and returns a UssdRiskDecision.
Parallel to the SDK aggregator but uses server-side-only signals.
"""
from app.models.ussd_signal import UssdPayloadSchema, UssdRiskDecision
from app.models.signal import RiskLevel, RecommendedAction
from app.rules.ussd_rules import ALL_USSD_RULES


# USSD-specific warning messages — designed for short USSD screen prompts
USSD_WARNING_MESSAGES = {
    RiskLevel.CRITICAL: (
        "🚨 STOP — High Fraud Risk\n\n"
        "This transaction shows signs of fraud. "
        "Your SIM may have been compromised. "
        "Please visit your nearest branch to verify."
    ),
    RiskLevel.HIGH: (
        "⚠️ Possible Scam Warning\n\n"
        "This transaction has unusual patterns. "
        "Are you sure you trust this recipient? "
        "Reply 1 to proceed or 2 to cancel."
    ),
    RiskLevel.MEDIUM: (
        "ℹ️ Please verify this transaction.\n"
        "Reply 1 to proceed or 2 to cancel."
    ),
    RiskLevel.LOW: None,
}

# Short USSD prompts (max 160 chars for USSD screens)
USSD_PROMPTS = {
    RiskLevel.CRITICAL: "FRAUD ALERT: This transaction is blocked for your safety. Visit your branch or call support.",
    RiskLevel.HIGH: "WARNING: Unusual transaction detected. Reply 1 to proceed, 2 to cancel.",
    RiskLevel.MEDIUM: "Please verify: Are you sure you want to send to this number? Reply 1=Yes, 2=No.",
    RiskLevel.LOW: None,
}


async def score_ussd_payload(payload: UssdPayloadSchema, baseline: dict) -> UssdRiskDecision:
    """
    Core USSD scoring function. Evaluates all 8 server-side rules
    and returns a UssdRiskDecision with USSD-formatted prompts.
    """
    total_score = 0
    triggered_rules = []
    score_breakdown = {}

    for rule_fn in ALL_USSD_RULES:
        delta, rule_id, desc = rule_fn(payload, baseline)
        score_breakdown[rule_id] = delta
        if delta > 0:
            triggered_rules.append(rule_id)
            total_score += delta

    # Cap at 100
    final_score = min(total_score, 100)

    risk_level = _score_to_level(final_score)
    action = _level_to_action(risk_level)

    return UssdRiskDecision(
        transaction_id=payload.payload_id,
        user_id=payload.user_id,
        risk_score=final_score,
        risk_level=risk_level,
        recommended_action=action,
        triggered_rules=triggered_rules,
        score_breakdown=score_breakdown,
        channel="USSD",
        warning_message=USSD_WARNING_MESSAGES.get(risk_level),
        suggested_ussd_prompt=USSD_PROMPTS.get(risk_level),
    )


def _score_to_level(score: int) -> RiskLevel:
    if score >= 80:
        return RiskLevel.CRITICAL
    elif score >= 55:
        return RiskLevel.HIGH
    elif score >= 30:
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
