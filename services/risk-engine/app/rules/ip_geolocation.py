"""
IP Geolocation Fraud Rules (RULE_027 – RULE_029)
==================================================
Uses ip-api.com (free, no key, 45 req/min) to enrich risk scoring
with IP-based geolocation intelligence.

All rules fail-open: if the API is unreachable, rules return 0 score.
"""

import httpx
import math
from typing import Tuple

# ── IP Geolocation Lookup ──────────────────────────────────────────────────────

_IP_API_URL = "http://ip-api.com/json/{ip}?fields=status,country,countryCode,city,lat,lon,isp,org,hosting,proxy"
_TIMEOUT = 0.5  # 500ms max — never block scoring


async def lookup_ip(ip_address: str) -> dict:
    """
    Lookup IP geolocation via ip-api.com.
    Returns empty dict on failure (fail-open).
    """
    if not ip_address or ip_address in ("127.0.0.1", "0.0.0.0", "::1"):
        return {}
    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            resp = await client.get(_IP_API_URL.format(ip=ip_address))
            data = resp.json()
            if data.get("status") == "success":
                return data
    except Exception:
        pass  # Fail-open — API issues must never block scoring
    return {}


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two lat/lon points in kilometres."""
    R = 6371  # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


# ── RULE 027 — IP Country ≠ SIM Country ───────────────────────────────────────

def rule_027_ip_country_mismatch(
    ip_geo: dict, sim_country_iso: str
) -> Tuple[int, str, str]:
    """
    If the IP is geolocated to a different country than the SIM card,
    the user may be using a foreign proxy or stolen SIM.
    """
    RULE_ID = "RULE_027"
    if not ip_geo or not sim_country_iso:
        return 0, RULE_ID, "No data for comparison"

    ip_country = ip_geo.get("countryCode", "").upper()
    sim_country = sim_country_iso.upper()

    if ip_country and sim_country and ip_country != sim_country:
        return 20, RULE_ID, (
            f"IP country ({ip_country}) does not match SIM country ({sim_country}) — "
            "possible foreign proxy or stolen SIM"
        )
    return 0, RULE_ID, "IP and SIM country match"


# ── RULE 028 — Hosting/Datacenter IP ──────────────────────────────────────────

def rule_028_hosting_ip(ip_geo: dict) -> Tuple[int, str, str]:
    """
    If the IP belongs to a hosting provider or datacenter, the user
    is likely running through a VPS/cloud instance — common in fraud.
    """
    RULE_ID = "RULE_028"
    if not ip_geo:
        return 0, RULE_ID, "No IP data"

    is_hosting = ip_geo.get("hosting", False)
    is_proxy = ip_geo.get("proxy", False)

    if is_hosting or is_proxy:
        isp = ip_geo.get("isp", "Unknown")
        return 15, RULE_ID, (
            f"IP belongs to hosting/datacenter provider ({isp}) — "
            "not a residential connection"
        )
    return 0, RULE_ID, "Residential IP"


# ── RULE 029 — IP Geo ≠ Device GPS (>500km) ──────────────────────────────────

def rule_029_ip_device_distance(
    ip_geo: dict, device_lat: float | None, device_lon: float | None
) -> Tuple[int, str, str]:
    """
    If the IP geolocation and device GPS location are more than 500km apart,
    the user may be spoofing their location or using a remote proxy.
    """
    RULE_ID = "RULE_029"
    if not ip_geo or device_lat is None or device_lon is None:
        return 0, RULE_ID, "Insufficient location data"

    ip_lat = ip_geo.get("lat")
    ip_lon = ip_geo.get("lon")
    if ip_lat is None or ip_lon is None:
        return 0, RULE_ID, "No IP coordinates"

    distance_km = _haversine_km(ip_lat, ip_lon, device_lat, device_lon)

    if distance_km > 500:
        return 10, RULE_ID, (
            f"IP location is {distance_km:.0f}km from device GPS — "
            "possible location spoofing or remote proxy"
        )
    return 0, RULE_ID, f"IP and device within {distance_km:.0f}km"


# ── Convenience list ──────────────────────────────────────────────────────────

IP_GEO_RULES = [
    rule_027_ip_country_mismatch,
    rule_028_hosting_ip,
    rule_029_ip_device_distance,
]
