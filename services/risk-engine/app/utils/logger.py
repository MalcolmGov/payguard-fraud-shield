"""
Structured logging for the PayGuard Risk Engine.

Replaces the basic logging.basicConfig with structlog JSON output,
including PII masking, request_id correlation, and service metadata.

Usage:
    from app.utils.logger import get_logger
    logger = get_logger(__name__)
    logger.info("scored_payload", payload_id=payload.payload_id, score=decision.risk_score)
"""

import logging
import os
import re
import structlog


# ── PII masking ───────────────────────────────────────────────────────────────
_PII_PATTERNS = [
    (re.compile(r'(\+?27|0)[6-8][0-9]{8}'), '***PHONE***'),          # SA numbers
    (re.compile(r'(\+?234)[0-9]{10}'),       '***PHONE***'),          # NG numbers
    (re.compile(r'\b[0-9]{10,15}\b'),        '***PHONE***'),          # Generic
    (re.compile(r'\b[\w.-]+@[\w.-]+\.\w{2,}\b'), '***EMAIL***'),     # Email
    (re.compile(
        r'\b((25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(25[0-5]|2[0-4]\d|[01]?\d\d?)\b'
    ), '***IP***'),
]


def _mask_pii(value: str) -> str:
    for pattern, replacement in _PII_PATTERNS:
        value = pattern.sub(replacement, value)
    return value


def _pii_masking_processor(logger, method, event_dict):  # noqa: ARG001
    """structlog processor: mask PII in all string values."""
    for key, value in list(event_dict.items()):
        if isinstance(value, str):
            event_dict[key] = _mask_pii(value)
    return event_dict


# ── structlog configuration ───────────────────────────────────────────────────
def _configure_structlog() -> None:
    is_production = os.getenv("NODE_ENV", "development") == "production"

    shared_processors = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_log_level,
        structlog.stdlib.add_logger_name,
        structlog.processors.TimeStamper(fmt="iso", utc=True),
        structlog.processors.StackInfoRenderer(),
        _pii_masking_processor,
    ]

    if is_production:
        renderer = structlog.processors.JSONRenderer()
    else:
        renderer = structlog.dev.ConsoleRenderer(colors=True)

    structlog.configure(
        processors=shared_processors + [
            structlog.stdlib.ProcessorFormatter.wrap_for_formatter,
        ],
        wrapper_class=structlog.make_filtering_bound_logger(
            logging.getLevelName(os.getenv("LOG_LEVEL", "INFO"))
        ),
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )

    formatter = structlog.stdlib.ProcessorFormatter(
        processors=shared_processors + [renderer],
        foreign_pre_chain=shared_processors,
    )

    handler = logging.StreamHandler()
    handler.setFormatter(formatter)
    root_logger = logging.getLogger()
    root_logger.addHandler(handler)
    root_logger.setLevel(logging.getLevelName(os.getenv("LOG_LEVEL", "INFO")))

    # Silence noisy third-party loggers
    for noisy in ("uvicorn.access", "asyncio", "kafka"):
        logging.getLogger(noisy).setLevel(logging.WARNING)


_configure_structlog()


def get_logger(name: str = "risk-engine"):
    return structlog.get_logger(name).bind(service="risk-engine")
