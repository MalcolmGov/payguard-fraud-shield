# PayGuard — Data Processing Agreement

**Under the Protection of Personal Information Act, 2013 (POPIA)**

**Effective Date:** ____________________  
**Between:**  
**Responsible Party ("Client"):** _______________________  
**Operator ("Provider"):** Swifter Technologies (Pty) Ltd, trading as PayGuard  
**Agreement Reference:** PG-DPA-2026-____

---

## 1. Purpose & Scope

This Data Processing Agreement ("DPA") governs the processing of personal information by the Provider on behalf of the Client in connection with the PayGuard fraud detection and prevention platform.

This DPA is entered into pursuant to Section 19–22 of the Protection of Personal Information Act, No. 4 of 2013 ("POPIA") and applies to all personal information processed by the Provider in the course of delivering the PayGuard service.

---

## 2. Definitions

| Term | Meaning |
|------|---------|
| **Personal Information** | As defined in Section 1 of POPIA — information relating to an identifiable, living, natural person or juristic person |
| **Processing** | As defined in Section 1 of POPIA — any operation concerning personal information, including collection, storage, use, modification, dissemination, or destruction |
| **Responsible Party** | The Client, who determines the purpose and means of processing |
| **Operator** | The Provider (Swifter Technologies), who processes personal information on behalf of the Client |
| **Data Subject** | The individual whose personal information is being processed (i.e., the Client's end-customers) |
| **Information Regulator** | The South African Information Regulator established under POPIA |

---

## 3. Categories of Personal Information Processed

In delivering the PayGuard service, the Provider may process the following categories of personal information:

### 3.1 Transaction Data
- Transaction reference numbers, amounts, timestamps
- Payment method identifiers (masked/tokenised — no full card numbers)
- Recipient account identifiers (hashed)
- Transaction velocity and frequency patterns

### 3.2 Device & Technical Data
- Device fingerprint (model, OS version, screen resolution)
- IP address (anonymised after 90 days)
- Network type and carrier information
- App version, SDK version
- Emulator / root / remote-access detection flags

### 3.3 Behavioural & Signal Data
- Call state during transaction (active call yes/no — no call content)
- Keystroke cadence patterns (timing only — no content captured)
- Paste event detection (clipboard access yes/no — no content captured)
- Screen overlay / screen sharing detection flags

### 3.4 Identity & SIM Data
- MSISDN (mobile number) — hashed
- SIM serial / ICCID — hashed
- SIM change / porting event flags
- IMEI — hashed

### 3.5 Risk & Decision Data
- Risk scores and decision outcomes (ALLOW / WARN / BLOCK)
- Rule trigger details
- Graph linkage data (anonymised device/account relationship graphs)

> **Important:** The Provider does **NOT** process: call recordings or content, SMS content, banking credentials, full card numbers, biometric templates (facial/fingerprint), GPS location (unless explicitly enabled by Client), or any special personal information as defined in Section 26–33 of POPIA.

---

## 4. Purpose Limitation

The Provider shall process personal information **solely** for the following purposes:

1. Real-time fraud risk assessment and decisioning
2. Generation of fraud risk scores and signals
3. Maintenance and improvement of fraud detection models
4. Graph intelligence for fraud ring detection
5. AML and sanctions screening (where contracted)
6. Generation of analytics, reports, and dashboards for the Client
7. Service monitoring, debugging, and incident resolution

The Provider shall **not** process personal information for any other purpose, including but not limited to: marketing, profiling for advertising, sale of data to third parties, or any purpose unrelated to fraud prevention.

---

## 5. Provider Obligations

The Provider undertakes to:

### 5.1 Security Measures (Section 19 of POPIA)
- Encrypt all personal information in transit using TLS 1.3
- Encrypt all personal information at rest using AES-256
- Implement role-based access control (RBAC) for all employees accessing data
- Maintain network security controls (firewalls, intrusion detection, DDoS protection)
- Conduct annual penetration testing by an independent security assessor
- Implement multi-factor authentication for all administrative access
- Maintain a documented information security policy

### 5.2 Confidentiality
- Ensure all employees and contractors processing personal information are bound by confidentiality obligations
- Limit access to personal information to personnel who require it for service delivery

### 5.3 Sub-Processors
- Not engage any sub-processor without prior written consent of the Client
- Ensure any approved sub-processor is bound by equivalent data protection obligations
- Current sub-processors are listed in **Annexure A**

### 5.4 Data Subject Rights
- Assist the Client in fulfilling Data Subject access, correction, and deletion requests within 5 business days of notification
- Not respond directly to Data Subjects unless instructed by the Client

### 5.5 Breach Notification
- Notify the Client of any actual or suspected data breach within **72 hours** of becoming aware
- Provide full details: nature of breach, categories and approximate number of Data Subjects affected, likely consequences, and measures taken to mitigate
- Cooperate with the Client in notifying the Information Regulator and affected Data Subjects as required by Section 22 of POPIA

### 5.6 Data Protection Impact Assessments
- Assist the Client in conducting data protection impact assessments where required
- Provide information reasonably requested for regulatory compliance

---

## 6. Data Retention & Deletion

| Data Category | Retention Period | Deletion Method |
|--------------|-----------------|----------------|
| Transaction signals & risk scores | 12 months | Automated purge |
| Raw device telemetry | 90 days | Automated purge |
| IP addresses (raw) | 90 days (then anonymised) | Automated anonymisation |
| Hashed identifiers (MSISDN, IMEI, SIM) | 12 months | Automated purge |
| Audit & access logs | 24 months | Automated purge |
| Aggregated/anonymous analytics | Indefinite | N/A (no personal information) |
| API usage logs | 12 months | Automated purge |

Upon termination of the service agreement:
- Client data will be available for export for **30 calendar days**
- After 30 days, all personal information will be permanently and irreversibly deleted
- Provider will issue a written certificate of destruction upon request

---

## 7. Cross-Border Transfers

The Provider processes data in the following jurisdictions:

| Purpose | Location | Safeguards |
|---------|----------|-----------|
| Primary processing | South Africa | POPIA compliant |
| Disaster recovery | [Secondary location] | Equivalent protection, encrypted |
| Cloud infrastructure | AWS / Railway (region: EU/SA) | Standard contractual clauses, encryption |

The Provider shall not transfer personal information to any jurisdiction that does not provide an adequate level of protection without prior written consent of the Client and appropriate safeguards in place (Section 72 of POPIA).

---

## 8. Audit Rights

- The Client may audit the Provider's compliance with this DPA **once per calendar year** with 30 days written notice
- The Provider shall cooperate fully and provide access to relevant systems, processes, and documentation
- Audit costs are borne by the Client unless the audit reveals material non-compliance, in which case costs are borne by the Provider
- The Provider will provide SOC 2 Type II reports or equivalent upon request

---

## 9. Liability & Indemnification

- The Provider shall indemnify the Client against any loss, damage, or regulatory penalty arising directly from the Provider's breach of this DPA or negligent processing of personal information
- Liability is capped at the total fees paid by the Client to the Provider in the 12 months preceding the claim
- Neither party shall be liable for indirect, consequential, or punitive damages

---

## 10. Term & Termination

- This DPA is effective for the duration of the underlying service agreement
- This DPA survives termination of the service agreement to the extent necessary to comply with data retention and deletion obligations
- Either party may terminate this DPA for material breach with 30 days written notice and failure to cure

---

## 11. Governing Law

This DPA is governed by the laws of the Republic of South Africa. Any dispute arising under this DPA shall be subject to the jurisdiction of the South African courts.

---

## 12. Signatures

| | Provider (Operator) | Client (Responsible Party) |
|---|---------------------|---------------------------|
| **Name** | _________________________ | _________________________ |
| **Title** | _________________________ | _________________________ |
| **Signature** | _________________________ | _________________________ |
| **Date** | _________________________ | _________________________ |

---

## Annexure A — Approved Sub-Processors

| Sub-Processor | Purpose | Location | Data Processed |
|--------------|---------|----------|---------------|
| Railway | Cloud hosting & compute | EU / US | All service data (encrypted) |
| Vercel | Dashboard hosting | Global CDN | Dashboard session data only |
| PostgreSQL (Railway) | Database | EU | All structured data (encrypted) |

*This list will be updated with 30 days written notice to the Client prior to engaging any new sub-processor.*

---

## Annexure B — Technical & Organisational Measures

1. **Encryption**: AES-256 at rest, TLS 1.3 in transit
2. **Access Control**: RBAC, MFA, principle of least privilege
3. **Network Security**: Firewalls, WAF, DDoS protection, VPN for admin access
4. **Monitoring**: 24/7 uptime monitoring, anomaly detection, automated alerting
5. **Backup**: 6-hourly database backups, real-time transaction log replication
6. **Incident Response**: Documented incident response plan, tested quarterly
7. **Employee Training**: Annual POPIA and information security awareness training
8. **Physical Security**: Data centre access controls, CCTV, biometric entry (cloud provider managed)
9. **Data Minimisation**: Only data necessary for fraud detection is collected; hashing applied to sensitive identifiers
10. **Pseudonymisation**: MSISDN, IMEI, SIM identifiers are hashed; IP addresses anonymised after 90 days

---

*Swifter Technologies (Pty) Ltd · PayGuard Fraud Detection Platform*  
*This document is confidential and intended for the named parties only.*  
*This DPA does not constitute legal advice. Parties are advised to seek independent legal counsel.*
