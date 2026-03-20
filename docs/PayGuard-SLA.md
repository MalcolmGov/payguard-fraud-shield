# PayGuard — Service Level Agreement (SLA)

**Effective Date:** ____________________  
**Between:** Swifter Technologies (Pty) Ltd ("Provider") and _______________________ ("Client")  
**Agreement Reference:** PG-SLA-2026-____

---

## 1. Service Description

PayGuard is a real-time fraud detection and prevention platform provided as a Software-as-a-Service (SaaS). The service includes:

- Real-time transaction risk scoring via REST API and mobile SDK
- Fraud signal collection (call state, device telemetry, SIM identity, behavioural biometrics)
- Risk decisioning engine (ALLOW / WARN / BLOCK)
- Fraud analytics dashboard
- Graph-based fraud intelligence
- AML & sanctions screening
- API key management and usage reporting

---

## 2. Service Availability

| Metric | Target |
|--------|--------|
| **Monthly Uptime** | 99.9% (excludes scheduled maintenance) |
| **API Response Time** | < 100ms (p95) |
| **API Response Time** | < 200ms (p99) |
| **Dashboard Availability** | 99.5% |
| **Scheduled Maintenance Window** | Sundays 02:00–04:00 SAST (with 48hr notice) |

### Uptime Calculation

```
Monthly Uptime % = ((Total Minutes − Downtime Minutes) / Total Minutes) × 100
```

Downtime excludes: scheduled maintenance, force majeure, Client-side issues, third-party service outages beyond Provider's control.

---

## 3. Incident Classification & Response Times

| Severity | Definition | Response Time | Resolution Target |
|----------|-----------|---------------|-------------------|
| **P1 — Critical** | Service completely unavailable; all API calls failing | 15 minutes | 2 hours |
| **P2 — Major** | Significant degradation; > 5% of requests affected | 30 minutes | 4 hours |
| **P3 — Moderate** | Minor feature impairment; dashboard issues; non-critical | 2 hours | 8 business hours |
| **P4 — Low** | Cosmetic issues, feature requests, general enquiries | 1 business day | 5 business days |

### Escalation Path

1. **Level 1** — Technical support (support@swifter.co.za)
2. **Level 2** — Engineering on-call (automatic for P1/P2)
3. **Level 3** — CTO / Head of Engineering (P1 only, if unresolved after 1 hour)

---

## 4. Support Channels & Hours

| Channel | Availability |
|---------|-------------|
| **Email** | support@swifter.co.za — 24/7 monitoring |
| **Emergency Hotline** | +27 XX XXX XXXX — P1/P2 only |
| **Dashboard Tickets** | Available via PayGuard admin portal |
| **Slack / Teams Integration** | Available for Enterprise clients |

**Business Hours:** Monday–Friday, 08:00–18:00 SAST  
**On-Call (P1/P2):** 24/7/365

---

## 5. Service Credits

If monthly uptime falls below the guaranteed threshold, the Client is entitled to service credits applied to the next invoice:

| Monthly Uptime | Service Credit |
|---------------|---------------|
| 99.0% – 99.9% | 10% of monthly fee |
| 95.0% – 99.0% | 25% of monthly fee |
| 90.0% – 95.0% | 50% of monthly fee |
| Below 90.0% | 100% of monthly fee |

### Credit Request Process
- Client must submit a credit request within 30 days of the incident
- Provider will validate against internal monitoring logs
- Credits are applied to the next billing cycle (not refunded as cash)
- Maximum credit per month: 100% of that month's fees

---

## 6. API Rate Limits & Fair Use

| Tier | Rate Limit | Burst Allowance |
|------|-----------|----------------|
| Standard | As per client agreement | 2x for 60 seconds |
| Enterprise | As per client agreement | 5x for 60 seconds |

Requests exceeding the rate limit will receive a `429 Too Many Requests` response. Rate limit headers are included in every API response.

---

## 7. Data Handling & Retention

| Data Type | Retention Period |
|-----------|-----------------|
| Transaction signals & risk scores | 12 months |
| Audit logs | 24 months |
| API key usage logs | 12 months |
| Aggregated analytics | Indefinite |
| Raw device telemetry | 90 days |

All data is encrypted at rest (AES-256) and in transit (TLS 1.3). See the Data Processing Agreement for full details.

---

## 8. Change Management

- **Non-breaking API changes** (new optional fields, new endpoints): Deployed with release notes, no advance notice required
- **Breaking API changes** (field removal, schema changes): 90 calendar days advance notice
- **SDK major version updates**: 60 calendar days advance notice with migration guide
- **Deprecation of endpoints**: 6 months advance notice

---

## 9. Disaster Recovery

| Metric | Target |
|--------|--------|
| **Recovery Point Objective (RPO)** | 1 hour |
| **Recovery Time Objective (RTO)** | 4 hours |
| **Backup Frequency** | Every 6 hours (database), real-time (transaction logs) |
| **Backup Location** | Geographically separate data centre |

---

## 10. Reporting

Provider will deliver the following reports:

- **Monthly SLA Report** — uptime %, incident summary, API performance metrics
- **Quarterly Business Review** — fraud trends, model performance, feature roadmap
- **Incident Post-Mortems** — delivered within 5 business days of any P1 incident

---

## 11. Term & Termination

- This SLA is effective for the duration of the service agreement
- Either party may terminate with **90 days written notice**
- Provider reserves the right to suspend service for non-payment (30 days overdue)
- Upon termination, Client data will be available for export for 30 days, after which it is permanently deleted

---

## 12. Signatures

| | Provider | Client |
|---|----------|--------|
| **Name** | _________________________ | _________________________ |
| **Title** | _________________________ | _________________________ |
| **Signature** | _________________________ | _________________________ |
| **Date** | _________________________ | _________________________ |

---

*Swifter Technologies (Pty) Ltd · PayGuard Fraud Detection Platform*  
*This document is confidential and intended for the named parties only.*
