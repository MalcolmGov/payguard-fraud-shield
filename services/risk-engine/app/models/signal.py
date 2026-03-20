from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum


class RiskLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class RecommendedAction(str, Enum):
    APPROVE = "APPROVE"
    SOFT_WARNING = "SOFT_WARNING"
    WARN_USER = "WARN_USER"
    BLOCK = "BLOCK"


class TransactionData(BaseModel):
    recipient_phone: str
    amount: float
    currency: str
    note: Optional[str] = None


class DeviceData(BaseModel):
    device_id: str
    manufacturer: str
    model: str
    os_version: str
    is_rooted: bool = False
    is_emulator: bool = False
    is_app_tampered: bool = False
    is_jailbroken: bool = False  # iOS
    is_simulator: bool = False   # iOS


class NetworkData(BaseModel):
    ip_address: str
    is_vpn: bool = False
    is_proxy: bool = False
    connection_type: str = "UNKNOWN"
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    country_iso: Optional[str] = None


class BehavioralData(BaseModel):
    session_duration_ms: float = 0
    keystroke_count: int = 0
    avg_keystroke_interval_ms: float = 0
    paste_detected: bool = False
    pasted_fields: List[str] = []
    recipient_changed_count: int = 0
    transaction_creation_ms: float = 0
    typing_speed_score: float = 0.5
    touch_pressure_score: float = 0.5
    scroll_velocity_score: float = 0.5
    navigation_pattern_score: float = 0.5


class CallData(BaseModel):
    is_on_active_call: bool = False
    call_type: str = "IDLE"
    is_caller_in_contacts: bool = True


class SmsData(BaseModel):
    has_fraud_keywords: bool = False
    fraud_keywords_found: List[str] = []
    recent_sms_count: int = 0
    unknown_sender_count: int = 0


class SimData(BaseModel):
    operator_name: str = ""
    sim_serial_hash: str = ""
    country_iso: str = ""
    sim_swap_detected: bool = False
    is_dual_sim: bool = False


class BeneficiaryData(BaseModel):
    """Beneficiary account risk signals from network analysis."""
    account_id: Optional[str] = None
    fraud_report_count: int = 0
    unique_sender_count: int = 0
    is_first_interaction: bool = True
    days_since_account_created: Optional[int] = None


class RiskPayloadSchema(BaseModel):
    payload_id: str
    user_id: str
    session_id: str
    timestamp: float
    transaction: TransactionData
    device: DeviceData
    network: NetworkData
    behavioral: BehavioralData
    call: CallData
    sms: Optional[SmsData] = None
    sim: Optional[SimData] = None
    beneficiary: Optional[BeneficiaryData] = None
    recipient_in_contacts: bool = True


class RiskDecision(BaseModel):
    transaction_id: str
    user_id: str
    risk_score: int = Field(ge=0, le=100)
    risk_level: RiskLevel
    recommended_action: RecommendedAction
    triggered_rules: List[str]
    score_breakdown: dict
    warning_message: Optional[str] = None
