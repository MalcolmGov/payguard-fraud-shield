"""
Email Reputation Utility
=========================
Calls EmailRep.io (free, no key for basic queries) for email reputation scoring.
This is an on-demand enrichment — NOT called inline with scoring (<100ms budget).
"""

import httpx
from dataclasses import dataclass
from typing import Optional

_EMAILREP_URL = "https://emailrep.io/{email}"
_TIMEOUT = 2.0  # Longer timeout OK — this is not in the scoring path


@dataclass
class EmailReputation:
    email: str
    reputation: str  # "high", "medium", "low", "none"
    suspicious: bool
    references: int  # Number of sources this email appears in
    blacklisted: bool
    malicious_activity: bool
    data_breach: bool
    credentials_leaked: bool
    details: dict


async def check_email_reputation(email: str) -> Optional[EmailReputation]:
    """
    Query EmailRep.io for reputation data on an email address.
    Returns None on failure (fail-open).

    Free tier: no API key, limited to ~25 req/day.
    """
    if not email or "@" not in email:
        return None

    try:
        headers = {
            "User-Agent": "PayGuard-FraudShield/1.0",
            "Accept": "application/json",
        }
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            resp = await client.get(
                _EMAILREP_URL.format(email=email),
                headers=headers,
            )
            if resp.status_code != 200:
                return None
            data = resp.json()

        details = data.get("details", {})
        return EmailReputation(
            email=email,
            reputation=data.get("reputation", "none"),
            suspicious=data.get("suspicious", False),
            references=data.get("references", 0),
            blacklisted=details.get("blacklisted", False),
            malicious_activity=details.get("malicious_activity", False),
            data_breach=details.get("data_breach", False),
            credentials_leaked=details.get("credentials_leaked", False),
            details=details,
        )
    except Exception:
        return None  # Fail-open
