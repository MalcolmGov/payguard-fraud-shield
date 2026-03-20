"""
AI-Powered Fraud Detection Rules (RULE_030 – RULE_035)
=======================================================
Detects emerging AI-driven attack vectors: voice deepfakes,
liveness spoofing, synthetic identities, AI-scripted social engineering,
remote access tool abuse, and AI-generated document forgery.

These rules consume signals enriched by the SDK's media-analysis
pipeline and the server-side AI classifier microservice.
"""
from __future__ import annotations

import logging
from typing import Tuple

from app.models.signal import RiskPayloadSchema

logger = logging.getLogger(__name__)

RuleResult = Tuple[int, str, str]  # (score_delta, rule_id, description)


# ── RULE_030: Voice Deepfake Shield ──────────────────────────────────────────

def rule_030_voice_deepfake(payload: RiskPayloadSchema, baseline: dict) -> RuleResult:
    """
    Detects AI-generated / cloned voice during an active phone call.

    The SDK's audio pipeline (running on-device via a lightweight ONNX model)
    analyses call audio for synthetic speech markers:
      - Missing micro-pauses and breath patterns
      - Uniform pitch variance (too perfect = fake)
      - Spectral artifacts from neural vocoder output
      - Absence of natural ambient / room noise
      - Frame-level consistency score (real speech has micro-variations)

    The SDK sends a `voice_authenticity_score` (0.0 = clearly fake, 1.0 = clearly real)
    and a list of detected anomaly flags.

    Score tiers:
      - score < 0.25 : very likely deepfake → +70 pts (CRITICAL)
      - score < 0.50 : suspicious           → +40 pts (HIGH)
      - score < 0.70 : mildly suspicious    → +15 pts (MEDIUM)
    """
    if not payload.call or not payload.call.is_on_active_call:
        return 0, "RULE_030", ""

    voice_data = getattr(payload, "voice_analysis", None)
    if not voice_data:
        return 0, "RULE_030", ""

    authenticity = voice_data.get("voice_authenticity_score", 1.0)
    anomaly_flags = voice_data.get("anomaly_flags", [])

    if authenticity < 0.25:
        flags = ", ".join(anomaly_flags[:3]) if anomaly_flags else "multiple synthetic markers"
        logger.warning(
            "RULE_030 CRITICAL: voice deepfake detected (score=%.2f, flags=%s)",
            authenticity, flags,
        )
        return 70, "RULE_030", (
            f"Voice deepfake detected (authenticity={authenticity:.0%}) — "
            f"synthetic markers: {flags}"
        )
    elif authenticity < 0.50:
        return 40, "RULE_030", (
            f"Suspicious voice pattern (authenticity={authenticity:.0%}) — "
            "possible AI-generated speech"
        )
    elif authenticity < 0.70:
        return 15, "RULE_030", (
            f"Mildly suspicious voice (authenticity={authenticity:.0%}) — monitoring"
        )

    return 0, "RULE_030", ""


# ── RULE_031: Liveness Spoofing Guard ────────────────────────────────────────

def rule_031_liveness_spoofing(payload: RiskPayloadSchema, baseline: dict) -> RuleResult:
    """
    Detects deepfake / spoofing attacks during video KYC or selfie liveness checks.

    The SDK captures liveness signals during face verification:
      - GAN artifact detection (checkerboard patterns, blending edges)
      - Screen replay detection (moiré patterns from filming a screen)
      - 3D depth check (flat images / masks vs real 3D face)
      - Micro-expression analysis (deepfakes lack natural micro-expressions)
      - Injection attack detection (virtual camera / video feed injection)

    Signals consumed:
      - liveness_passed (bool)
      - liveness_score (0.0–1.0)
      - spoof_type (str | None): 'screen_replay', 'printed_photo', 'mask', 'deepfake', 'injection'
    """
    liveness = getattr(payload, "liveness_check", None)
    if not liveness:
        return 0, "RULE_031", ""

    passed = liveness.get("liveness_passed", True)
    score = liveness.get("liveness_score", 1.0)
    spoof_type = liveness.get("spoof_type")

    if not passed and spoof_type == "deepfake":
        logger.warning("RULE_031 CRITICAL: deepfake liveness attack — spoof_type=%s", spoof_type)
        return 85, "RULE_031", (
            f"Deepfake liveness spoofing detected (confidence={1 - score:.0%}) — "
            "GAN-generated face presentation"
        )
    elif not passed and spoof_type == "injection":
        return 80, "RULE_031", (
            "Virtual camera injection detected — video feed is not from physical camera"
        )
    elif not passed and spoof_type in ("screen_replay", "printed_photo", "mask"):
        return 60, "RULE_031", (
            f"Liveness spoofing detected: {spoof_type.replace('_', ' ')} "
            f"(score={score:.0%})"
        )
    elif score < 0.40:
        return 30, "RULE_031", (
            f"Low liveness confidence ({score:.0%}) — possible spoofing attempt"
        )

    return 0, "RULE_031", ""


# ── RULE_032: Synthetic Identity Detector ────────────────────────────────────

def rule_032_synthetic_identity(payload: RiskPayloadSchema, baseline: dict) -> RuleResult:
    """
    Detects synthetic / fabricated identities assembled from real + fake data.

    Synthetic identity fraud combines:
      - Real ID numbers (stolen from minors, deceased, or dormant accounts)
      - Fake names + addresses
      - Freshly created phone numbers + email addresses
      - AI-generated selfie photos

    Cross-correlation signals:
      - SIM age vs account age mismatch
      - Email domain reputation
      - Phone number recycling patterns
      - Identity document metadata inconsistencies
      - Social graph isolation (no connections to legitimate accounts)
    """
    identity = getattr(payload, "identity_signals", None)
    if not identity:
        return 0, "RULE_032", ""

    score = 0
    reasons = []

    # SIM age doesn't match claimed identity tenure
    sim_age_days = identity.get("sim_age_days", 365)
    account_claimed_age = identity.get("account_claimed_age_days", 365)
    if sim_age_days < 30 and account_claimed_age > 365:
        score += 25
        reasons.append(f"SIM {sim_age_days}d old but claimed account age {account_claimed_age}d")

    # Disposable / temp email
    if identity.get("email_is_disposable", False):
        score += 15
        reasons.append("disposable email provider")

    # Phone number flagged as recently recycled
    if identity.get("phone_recently_recycled", False):
        score += 20
        reasons.append("recently recycled phone number")

    # Social graph isolation — no connections to other legitimate users
    graph_connections = identity.get("legitimate_graph_connections", 10)
    if graph_connections == 0:
        score += 20
        reasons.append("zero legitimate graph connections (isolated node)")
    elif graph_connections < 2:
        score += 10
        reasons.append(f"only {graph_connections} graph connection(s)")

    # AI-generated profile photo detected
    if identity.get("profile_photo_synthetic", False):
        score += 25
        reasons.append("AI-generated profile photo detected")

    if score > 0:
        severity = "CRITICAL" if score >= 50 else "HIGH"
        logger.info(
            "RULE_032: synthetic identity signals (score=%d) — %s",
            score, "; ".join(reasons),
        )
        return min(score, 65), "RULE_032", (
            f"Synthetic identity indicators ({severity}) — " + "; ".join(reasons)
        )

    return 0, "RULE_032", ""


# ── RULE_033: AI Conversation Detector ───────────────────────────────────────

def rule_033_ai_conversation(payload: RiskPayloadSchema, baseline: dict) -> RuleResult:
    """
    Detects AI-driven social engineering calls (AI chatbot impersonating bank staff).

    Modern AI voice agents can:
      - Impersonate bank customer service representatives
      - Follow scripted social engineering playbooks
      - Adapt responses in real-time to victim's answers
      - Operate at scale (hundreds of simultaneous calls)

    Detection signals (from SDK audio analysis):
      - Uniform response timing (AI responds in consistent intervals)
      - No breathing / swallowing sounds between sentences
      - Perfect grammar with no filler words (um, uh, er)
      - Background audio profile is perfectly clean (no office noise)
      - TTS watermark patterns (some AI speech APIs embed watermarks)
    """
    if not payload.call or not payload.call.is_on_active_call:
        return 0, "RULE_033", ""

    ai_call = getattr(payload, "ai_call_detection", None)
    if not ai_call:
        return 0, "RULE_033", ""

    is_ai_caller = ai_call.get("is_ai_caller", False)
    confidence = ai_call.get("ai_confidence", 0.0)
    indicators = ai_call.get("indicators", [])

    if is_ai_caller and confidence > 0.80:
        flags = ", ".join(indicators[:3]) if indicators else "multiple AI speech patterns"
        logger.warning(
            "RULE_033 CRITICAL: AI caller detected (confidence=%.2f) — %s",
            confidence, flags,
        )
        return 65, "RULE_033", (
            f"AI-powered social engineering call detected ({confidence:.0%} confidence) — "
            f"indicators: {flags}"
        )
    elif is_ai_caller and confidence > 0.55:
        return 30, "RULE_033", (
            f"Possible AI caller ({confidence:.0%} confidence) — monitoring"
        )

    return 0, "RULE_033", ""


# ── RULE_034: Remote Access Tool Blocker ─────────────────────────────────────

def rule_034_remote_access_tool(payload: RiskPayloadSchema, baseline: dict) -> RuleResult:
    """
    Detects active remote access / screen sharing applications during payment sessions.

    Scammers instruct victims to install remote access tools (AnyDesk, TeamViewer,
    QuickSupport) so they can navigate the banking app themselves or "guide" the
    victim through a fraudulent transfer while using deepfake personas.

    Detection methods:
      - Running process scan for known RAT package names
      - Accessibility service abuse detection (Android)
      - Screen capture API usage detection
      - Overlay / drawing-over-apps permission check
      - USB debugging + ADB connection detection
    """
    remote = getattr(payload, "remote_access", None)
    if not remote:
        # Also check device-level flags
        if hasattr(payload, "device"):
            if getattr(payload.device, "is_screen_shared", False):
                return 75, "RULE_034", (
                    "Screen sharing detected during payment session — "
                    "possible remote-controlled fraud"
                )
            if getattr(payload.device, "is_remote_controlled", False):
                return 85, "RULE_034", (
                    "Remote access tool active (device is being remotely controlled)"
                )
        return 0, "RULE_034", ""

    is_active = remote.get("is_active", False)
    tool_name = remote.get("tool_name", "unknown")
    connection_type = remote.get("connection_type", "unknown")

    if is_active and connection_type == "remote_control":
        logger.warning(
            "RULE_034 CRITICAL: remote control active via %s", tool_name,
        )
        return 85, "RULE_034", (
            f"Remote control active via {tool_name} — "
            "attacker may be operating the device"
        )
    elif is_active and connection_type == "screen_share":
        return 65, "RULE_034", (
            f"Screen sharing active via {tool_name} during payment session"
        )
    elif is_active:
        return 45, "RULE_034", (
            f"Remote access tool detected: {tool_name} ({connection_type})"
        )

    return 0, "RULE_034", ""


# ── RULE_035: Document Forgery Scanner ───────────────────────────────────────

def rule_035_document_forgery(payload: RiskPayloadSchema, baseline: dict) -> RuleResult:
    """
    Detects AI-generated or digitally manipulated identity documents.

    AI tools (Stable Diffusion, DALL-E, fine-tuned GANs) can now produce
    photorealistic ID documents. Detection relies on:
      - EXIF metadata analysis (AI-generated images lack camera EXIF)
      - Font consistency checks (AI mixes font styles within a document)
      - Micro-pattern analysis (holograms, guilloche patterns poorly replicated)
      - JPEG compression artifact analysis (double-compression detection)
      - Face-to-document correlation (does the face match the document photo?)
      - MRZ / barcode validation (machine-readable zones must be internally consistent)
    """
    doc = getattr(payload, "document_verification", None)
    if not doc:
        return 0, "RULE_035", ""

    is_authentic = doc.get("is_authentic", True)
    forgery_type = doc.get("forgery_type")
    confidence = doc.get("forgery_confidence", 0.0)
    document_type = doc.get("document_type", "ID")

    if not is_authentic and forgery_type == "ai_generated":
        logger.warning(
            "RULE_035 CRITICAL: AI-generated %s detected (confidence=%.2f)",
            document_type, confidence,
        )
        return 80, "RULE_035", (
            f"AI-generated {document_type} detected ({confidence:.0%} confidence) — "
            "document was not photographed from a physical original"
        )
    elif not is_authentic and forgery_type == "digitally_altered":
        return 60, "RULE_035", (
            f"Digitally altered {document_type} detected — "
            f"tampering confidence {confidence:.0%}"
        )
    elif not is_authentic and forgery_type == "template_based":
        return 50, "RULE_035", (
            f"Template-based forgery detected for {document_type} — "
            "document matches known fake template patterns"
        )
    elif not is_authentic:
        return 40, "RULE_035", (
            f"Suspicious {document_type} — forgery type: {forgery_type or 'unknown'}"
        )

    return 0, "RULE_035", ""


# ── Rule Registry ─────────────────────────────────────────────────────────────

ALL_AI_FRAUD_RULES = [
    rule_030_voice_deepfake,
    rule_031_liveness_spoofing,
    rule_032_synthetic_identity,
    rule_033_ai_conversation,
    rule_034_remote_access_tool,
    rule_035_document_forgery,
]
