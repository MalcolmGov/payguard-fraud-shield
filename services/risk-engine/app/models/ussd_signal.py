"""
USSD Signal Model
=================
Server-side payload schema for USSD / feature phone transactions.
No SDK required — all signals are provided by the institution's backend.
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from app.models.signal import RiskLevel, RecommendedAction


class UssdTransactionData(BaseModel):
    """Transaction details from the USSD session."""
    recipient_msisdn: str
    amount: float
    currency: str
    channel: str = "USSD"  # USSD, STK_PUSH, SHORTCODE
    reference: Optional[str] = None


class UssdSubscriberData(BaseModel):
    """Subscriber / SIM identity signals — available from MNO APIs."""
    msisdn: str
    sim_swap_detected: bool = False
    sim_swap_age_hours: Optional[int] = None
    subscriber_age_days: Optional[int] = None
    operator_name: Optional[str] = None
    country_iso: Optional[str] = None


class UssdBeneficiaryData(BaseModel):
    """Beneficiary account risk signals from network analysis."""
    account_id: Optional[str] = None
    fraud_report_count: int = 0
    unique_sender_count: int = 0
    is_first_interaction: bool = True
    days_since_account_created: Optional[int] = None
    is_blacklisted: bool = False


class UssdSessionData(BaseModel):
    """USSD session metadata."""
    session_id: str
    session_duration_seconds: float = 0
    menu_steps_count: int = 0
    retries_count: int = 0  # PIN retries, menu re-entries


class UssdGeolocationData(BaseModel):
    """Coarse geolocation from cell tower or MNO location API."""
    cell_tower_lat: Optional[float] = None
    cell_tower_lon: Optional[float] = None
    cell_tower_accuracy_km: Optional[float] = None
    country_iso: Optional[str] = None


class UssdPayloadSchema(BaseModel):
    """
    Server-side fraud signal payload for USSD transactions.

    This payload is assembled by the institution's USSD gateway
    and sent to PayGuard's /score/ussd endpoint. No mobile SDK needed.
    """
    payload_id: str
    user_id: str
    timestamp: float
    transaction: UssdTransactionData
    subscriber: UssdSubscriberData
    beneficiary: Optional[UssdBeneficiaryData] = None
    session: UssdSessionData
    geolocation: Optional[UssdGeolocationData] = None
    recipient_in_contacts: bool = False  # USSD has no contact book — default false


class UssdRiskDecision(BaseModel):
    """Risk decision returned for a USSD transaction."""
    transaction_id: str
    user_id: str
    risk_score: int = Field(ge=0, le=100)
    risk_level: RiskLevel
    recommended_action: RecommendedAction
    triggered_rules: List[str]
    score_breakdown: dict
    channel: str = "USSD"
    warning_message: Optional[str] = None
    suggested_ussd_prompt: Optional[str] = None
