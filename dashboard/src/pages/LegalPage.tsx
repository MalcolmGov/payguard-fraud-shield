import { useParams, useNavigate } from 'react-router-dom';

const LEGAL: Record<string, { title: string; icon: string; updated: string; sections: { heading: string; body: string }[] }> = {
  privacy: {
    title: 'Privacy Policy', icon: '🔒', updated: 'March 2026',
    sections: [
      { heading: '1. Information We Collect', body: 'PayGuard collects transaction metadata, device telemetry, behavioural signals, IP addresses, and SIM identity data solely for the purpose of fraud detection and prevention. We do not collect, store, or process personal financial credentials such as PINs, passwords, or full card numbers. All data is encrypted in transit (TLS 1.3) and at rest (AES-256).' },
      { heading: '2. How We Use Your Data', body: 'Data is used exclusively to evaluate fraud risk in real time via our 35-rule scoring engine. Signals are processed within our secure infrastructure and decisions (ALLOW, WARN, BLOCK) are returned to the integrating institution. Aggregated, anonymised data may be used to improve our machine learning models and detection accuracy.' },
      { heading: '3. Data Sharing', body: 'We do not sell personal data. Data may be shared with: (a) the integrating financial institution that deployed PayGuard, (b) regulatory authorities when legally required, and (c) our infrastructure providers (Vercel, AWS) under strict data processing agreements with equivalent security standards.' },
      { heading: '4. Data Retention', body: 'Transaction risk scores and associated metadata are retained for 90 days for investigation purposes. Aggregated analytics data is retained for 24 months. Clients may request custom retention periods under enterprise agreements. Data deletion requests are processed within 30 business days.' },
      { heading: '5. International Transfers', body: 'PayGuard processes data in geographically distributed infrastructure. For African markets, data is processed within the continent where possible. All cross-border transfers comply with applicable data protection regulations including POPIA (South Africa), NDPR (Nigeria), and GDPR (where applicable).' },
      { heading: '6. Your Rights', body: 'You have the right to access, rectify, or delete your personal data. You may also object to processing or request data portability. To exercise these rights, contact privacy@payguard.africa. We will respond within 30 days.' },
      { heading: '7. Cookies & Tracking', body: 'Our marketing website uses essential cookies for functionality and analytics cookies (with consent) to understand visitor behaviour. The PayGuard SDK does not use cookies — it operates via secure API calls within the host application.' },
      { heading: '8. Contact', body: 'For privacy inquiries: privacy@payguard.africa. Data Protection Officer: dpo@swifter.digital. Registered office: Swifter Technologies (Pty) Ltd, Johannesburg, South Africa.' },
    ],
  },
  security: {
    title: 'Security', icon: '🛡️', updated: 'March 2026',
    sections: [
      { heading: '1. Infrastructure Security', body: 'PayGuard runs on enterprise-grade cloud infrastructure with multi-region redundancy. All services are deployed in isolated containers with automated scaling. Network traffic is segmented, and all inter-service communication uses mutual TLS authentication.' },
      { heading: '2. Encryption', body: 'All data in transit is protected with TLS 1.3. Data at rest is encrypted with AES-256. API keys and secrets are managed via hardware security modules (HSMs). Database encryption keys are rotated every 90 days automatically.' },
      { heading: '3. Authentication & Access Control', body: 'Dashboard access requires multi-factor authentication (MFA). API access is secured via time-limited JWT tokens and API keys with granular RBAC permissions. All authentication events are logged and monitored. Failed login attempts trigger progressive lockout policies.' },
      { heading: '4. Monitoring & Incident Response', body: 'All API calls, authentication events, and system changes are logged with tamper-proof audit trails. Our Security Operations Centre (SOC) monitors for anomalies 24/7. Incident response SLA: P1 incidents acknowledged within 15 minutes, resolved within 4 hours.' },
      { heading: '5. Penetration Testing', body: 'Independent third-party penetration tests are conducted quarterly. All critical and high-severity findings are remediated within 14 days. Results are available to enterprise clients under NDA.' },
      { heading: '6. Vulnerability Management', body: 'Automated vulnerability scanning runs daily across all production systems. Dependencies are monitored for CVEs with automated patching for critical vulnerabilities within 24 hours. We maintain a responsible disclosure programme at security@payguard.africa.' },
      { heading: '7. Business Continuity', body: 'PayGuard maintains 99.99% uptime SLA with automated failover across multiple availability zones. Recovery Point Objective (RPO): 1 minute. Recovery Time Objective (RTO): 5 minutes. Disaster recovery drills are conducted quarterly.' },
      { heading: '8. Reporting a Vulnerability', body: 'If you discover a security vulnerability, please report it responsibly to security@payguard.africa. We acknowledge reports within 24 hours and do not pursue legal action against good-faith security researchers.' },
    ],
  },
  terms: {
    title: 'Terms of Service', icon: '📋', updated: 'March 2026',
    sections: [
      { heading: '1. Agreement Overview', body: 'These Terms of Service ("Terms") govern your use of the PayGuard platform, including the SDK, APIs, dashboard, and documentation (collectively, the "Service"). By accessing or using the Service, you agree to be bound by these Terms. The Service is provided by Swifter Technologies (Pty) Ltd ("Swifter", "we", "us").' },
      { heading: '2. Eligibility', body: 'The Service is available to licensed financial institutions, payment service providers, telecommunications companies, and authorised third parties. You must be a registered business entity with appropriate regulatory licences to use PayGuard in production. Sandbox access is available for evaluation purposes.' },
      { heading: '3. Service Description', body: 'PayGuard provides real-time fraud detection and prevention through SDK integration, API endpoints, and a management dashboard. The Service evaluates transactions against 35 fraud detection rules across 5 intelligence layers and returns risk decisions. PayGuard does not process, hold, or move funds.' },
      { heading: '4. Client Obligations', body: 'You agree to: (a) integrate the SDK according to our documentation, (b) maintain the confidentiality of your API keys, (c) not reverse-engineer or attempt to extract the scoring algorithms, (d) comply with all applicable laws and regulations, and (e) promptly report any security incidents or suspected misuse.' },
      { heading: '5. Service Level Agreement', body: 'PayGuard guarantees 99.99% API uptime (measured monthly). Decision latency SLA: 95th percentile responses under 100ms. Scheduled maintenance windows are communicated 48 hours in advance. Service credits are issued for SLA breaches as defined in your enterprise agreement.' },
      { heading: '6. Pricing & Payment', body: 'Pricing is based on transaction volume and selected product modules. Usage is billed monthly in arrears. Payment terms: Net 30 days from invoice date. Late payments accrue interest at 2% per month. Volume discounts are available for enterprise agreements.' },
      { heading: '7. Intellectual Property', body: 'PayGuard, its algorithms, models, and documentation are the intellectual property of Swifter Technologies. You are granted a non-exclusive, non-transferable licence to use the Service during the term of your agreement. You retain ownership of your transaction data.' },
      { heading: '8. Limitation of Liability', body: "PayGuard provides fraud risk scoring as a decision-support tool. Final transaction approval decisions remain the responsibility of the integrating institution. Swifter's total liability is limited to the fees paid in the 12 months preceding any claim. We are not liable for indirect, consequential, or punitive damages." },
      { heading: '9. Termination', body: 'Either party may terminate with 30 days written notice. Upon termination, API access is revoked, and data is retained for 90 days before secure deletion. Accrued fees remain payable. Provisions that by their nature should survive termination will survive.' },
      { heading: '10. Governing Law', body: 'These Terms are governed by the laws of the Republic of South Africa. Disputes shall be resolved through arbitration in Johannesburg under the rules of the Arbitration Foundation of Southern Africa (AFSA).' },
    ],
  },
  soc2: {
    title: 'SOC 2 Type II Compliance', icon: '✅', updated: 'March 2026',
    sections: [
      { heading: '1. Overview', body: 'PayGuard has achieved SOC 2 Type II certification, independently audited by a licensed CPA firm. This certification validates that our systems and processes meet the Trust Service Criteria for Security, Availability, Processing Integrity, Confidentiality, and Privacy over a sustained observation period.' },
      { heading: '2. Security', body: 'Our security controls include: network segmentation, intrusion detection systems, WAF protection, DDoS mitigation, role-based access control, multi-factor authentication, encryption at rest and in transit, and continuous vulnerability management. All production changes require peer review and automated testing.' },
      { heading: '3. Availability', body: 'PayGuard maintains 99.99% uptime through multi-region deployment, automated failover, load balancing, and health monitoring. Capacity planning reviews are conducted monthly. Infrastructure auto-scales based on real-time demand, with burst capacity for 10x normal traffic.' },
      { heading: '4. Processing Integrity', body: 'All 35 fraud detection rules are evaluated deterministically with consistent outputs for identical inputs. Rule changes are version-controlled, tested, and deployed through CI/CD pipelines with automated regression testing. Decision audit trails are immutable and tamper-proof.' },
      { heading: '5. Confidentiality', body: 'Client data is logically isolated per tenant. Access to production data requires approval from two authorised personnel. All access is logged and regularly reviewed. Data classification policies ensure appropriate handling of sensitive information throughout its lifecycle.' },
      { heading: '6. Privacy', body: 'PayGuard processes only the minimum data necessary for fraud detection. Personal data handling complies with POPIA, NDPR, and GDPR requirements. Privacy impact assessments are conducted for all new features. Data subject requests are processed within the statutory timeframes.' },
      { heading: '7. Audit Reports', body: 'SOC 2 Type II audit reports are available to prospective and current clients under NDA. Reports cover a 12-month observation period and are refreshed annually. To request a copy, contact compliance@payguard.africa.' },
      { heading: '8. Continuous Compliance', body: 'Compliance is not a point-in-time achievement — it is continuously maintained through automated compliance monitoring, regular internal audits, employee security training, and an active governance, risk, and compliance (GRC) programme.' },
    ],
  },
};

export default function LegalPage() {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const doc = LEGAL[type || ''];

  if (!doc) {
    navigate('/');
    return null;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#050505', fontFamily: 'Inter, sans-serif', color: 'var(--w-text-1)' }}>
      {/* Nav bar */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 48px', height: 68, background: 'rgba(0,0,0,0.95)', borderBottom: '1px solid var(--w-card-border)', backdropFilter: 'blur(24px)' }}>
        <div onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <img src="/payguard-logo.png" alt="PayGuard" style={{ width: 44, height: 44, borderRadius: 12, objectFit: 'cover', boxShadow: '0 0 30px rgba(255,23,68,0.65)' }} />
          <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 15, fontWeight: 800, color: 'var(--w-text-1)' }}>PayGuard</div>
        </div>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 20px', borderRadius: 8, color: 'var(--w-text-2)', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#F0F6FF'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = '#94A3B8'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}>← Back to Home</button>
      </nav>

      {/* Content */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '120px 32px 80px' }}>
        {/* Header */}
        <div style={{ marginBottom: 56 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>{doc.icon}</div>
          <h1 style={{ fontSize: 44, fontWeight: 900, fontFamily: 'Outfit', letterSpacing: '-0.03em', marginBottom: 12 }}>{doc.title}</h1>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', fontSize: 13, color: 'var(--w-text-3)' }}>
            <span>Last updated: {doc.updated}</span>
            <span>·</span>
            <span>Swifter Technologies (Pty) Ltd</span>
          </div>
          <div style={{ height: 2, marginTop: 32, background: 'linear-gradient(90deg, #FF174480, transparent)' }} />
        </div>

        {/* Legal nav */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 48, flexWrap: 'wrap' }}>
          {Object.entries(LEGAL).map(([key, val]) => (
            <button key={key} onClick={() => navigate(`/legal/${key}`)}
              style={{
                padding: '8px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                background: type === key ? 'rgba(255,23,68,0.12)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${type === key ? 'rgba(255,23,68,0.3)' : 'rgba(255,255,255,0.08)'}`,
                color: type === key ? '#FF4455' : '#64748B',
                transition: 'all 0.2s',
              }}>{val.title}</button>
          ))}
        </div>

        {/* Sections */}
        {doc.sections.map((s, i) => (
          <div key={i} style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, fontFamily: 'Outfit', color: 'var(--w-text-1)', marginBottom: 12, letterSpacing: '-0.01em' }}>{s.heading}</h2>
            <p style={{ fontSize: 15, color: 'var(--w-text-2)', lineHeight: 1.9, margin: 0 }}>{s.body}</p>
          </div>
        ))}

        {/* Footer note */}
        <div style={{ marginTop: 64, padding: '24px 28px', borderRadius: 16, background: 'var(--w-card)', border: '1px solid var(--w-card-border)' }}>
          <p style={{ fontSize: 13, color: '#536380', lineHeight: 1.8, margin: 0 }}>
            For questions about this document, contact <span style={{ color: '#FF4455' }}>legal@payguard.africa</span>. 
            PayGuard is a product of Swifter Technologies (Pty) Ltd, registered in South Africa. 
            All policies are reviewed and updated quarterly.
          </p>
        </div>
      </div>
    </div>
  );
}
