"""
Prometheus metrics for the PayGuard Risk Engine.

Exposes /metrics endpoint with:
  - risk_scoring_duration_seconds  (latency histogram)
  - risk_score_distribution        (score buckets)
  - scoring_requests_total         (by outcome)
  - rule_trigger_total             (by rule ID)
  - cache_hits_total / cache_misses_total
  - decisions_by_level_total       (LOW/MEDIUM/HIGH/CRITICAL)
"""

from prometheus_client import (
    CollectorRegistry,
    Counter,
    Histogram,
    generate_latest,
    CONTENT_TYPE_LATEST,
    multiprocess,
    REGISTRY,
)
import os

# Use the default registry (works for single-process deployments)
METRICS_REGISTRY = REGISTRY


# ── Latency ───────────────────────────────────────────────────────────────────
scoring_duration = Histogram(
    "risk_scoring_duration_seconds",
    "End-to-end scoring latency in seconds",
    buckets=[0.005, 0.01, 0.025, 0.05, 0.075, 0.1, 0.25, 0.5, 1.0],
)

# ── Score distribution ────────────────────────────────────────────────────────
risk_score_histogram = Histogram(
    "risk_score_distribution",
    "Distribution of computed fraud risk scores",
    buckets=[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
)

# ── Request totals ────────────────────────────────────────────────────────────
scoring_requests_total = Counter(
    "scoring_requests_total",
    "Total scoring requests by outcome",
    ["outcome"],  # 'success' | 'cache_hit' | 'error'
)

# ── Rule triggers ─────────────────────────────────────────────────────────────
rule_trigger_total = Counter(
    "rule_trigger_total",
    "Number of times each rule has been triggered",
    ["rule_id"],
)

# ── Cache ──────────────────────────────────────────────────────────────────────
cache_hits_total = Counter(
    "score_cache_hits_total",
    "Number of scoring requests served from cache",
)
cache_misses_total = Counter(
    "score_cache_misses_total",
    "Number of scoring requests that missed the cache",
)

# ── Decision level breakdown ──────────────────────────────────────────────────
decisions_by_level = Counter(
    "decisions_by_level_total",
    "Fraud decisions broken down by risk level",
    ["level"],  # LOW | MEDIUM | HIGH | CRITICAL
)


def record_decision_metrics(decision, triggered_rules: list[str]) -> None:
    """Helper — call after scoring to update all metrics at once."""
    risk_score_histogram.observe(decision.risk_score)
    decisions_by_level.labels(level=decision.risk_level).inc()
    for rule_id in triggered_rules:
        rule_trigger_total.labels(rule_id=rule_id).inc()


def get_metrics_response() -> tuple[bytes, str]:
    """Returns (body, content_type) for the /metrics endpoint."""
    return generate_latest(METRICS_REGISTRY), CONTENT_TYPE_LATEST
