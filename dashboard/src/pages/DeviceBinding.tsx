import { useState } from 'react';

interface LocationEntry {
  city: string;
  province: string;
  lat: number;
  lng: number;
  timestamp: string;
  ip: string;
}

interface DeviceRecord {
  id: string;
  fingerprint: string;
  model: string;
  os: string;
  userId: string;
  riskScore: number;
  isRooted: boolean;
  isEmulator: boolean;
  firstSeen: string;
  lastSeen: string;
  linkedAccounts: number;
  blacklisted: boolean;
  // Geolocation
  lastLocation: { city: string; province: string; lat: number; lng: number };
  locationAnomaly: boolean;
  anomalyNote?: string;
  locationHistory: LocationEntry[];
}

const DEVICES: DeviceRecord[] = [
  {
    id: 'd001', fingerprint: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
    model: 'Samsung Galaxy S23', os: 'Android 14', userId: '+27821000001', riskScore: 12,
    isRooted: false, isEmulator: false, firstSeen: '2025-01-15', lastSeen: '2026-03-14',
    linkedAccounts: 1, blacklisted: false,
    lastLocation: { city: 'Sandton', province: 'Gauteng', lat: -26.1076, lng: 28.0567 },
    locationAnomaly: false,
    locationHistory: [
      { city: 'Sandton', province: 'Gauteng', lat: -26.1076, lng: 28.0567, timestamp: '2026-03-14 09:12', ip: '196.21.45.102' },
      { city: 'Johannesburg', province: 'Gauteng', lat: -26.2041, lng: 28.0473, timestamp: '2026-03-13 14:30', ip: '196.21.45.102' },
      { city: 'Pretoria', province: 'Gauteng', lat: -25.7479, lng: 28.2293, timestamp: '2026-03-12 08:45', ip: '196.21.48.87' },
      { city: 'Sandton', province: 'Gauteng', lat: -26.1076, lng: 28.0567, timestamp: '2026-03-11 16:20', ip: '196.21.45.102' },
    ],
  },
  {
    id: 'd002', fingerprint: 'f8a3b4c5d6e7f8a3b4c5d6e7f8a3b4c5d6e7f8a3b4c5d6e7f8a3b4c5d6e7f8a3',
    model: 'iPhone 15 Pro', os: 'iOS 17.4', userId: '+27821000002', riskScore: 8,
    isRooted: false, isEmulator: false, firstSeen: '2024-11-20', lastSeen: '2026-03-14',
    linkedAccounts: 1, blacklisted: false,
    lastLocation: { city: 'Cape Town', province: 'Western Cape', lat: -33.9249, lng: 18.4241 },
    locationAnomaly: false,
    locationHistory: [
      { city: 'Cape Town', province: 'Western Cape', lat: -33.9249, lng: 18.4241, timestamp: '2026-03-14 11:05', ip: '41.185.22.61' },
      { city: 'Stellenbosch', province: 'Western Cape', lat: -33.9321, lng: 18.8602, timestamp: '2026-03-13 09:15', ip: '41.185.22.61' },
      { city: 'Cape Town', province: 'Western Cape', lat: -33.9249, lng: 18.4241, timestamp: '2026-03-12 17:40', ip: '41.185.22.61' },
    ],
  },
  {
    id: 'd003', fingerprint: 'dead0000beef0000dead0000beef0000dead0000beef0000dead0000beef0000',
    model: 'Generic Android (Emulator)', os: 'Android 12', userId: '+27821000003', riskScore: 92,
    isRooted: true, isEmulator: true, firstSeen: '2026-03-10', lastSeen: '2026-03-14',
    linkedAccounts: 4, blacklisted: true,
    lastLocation: { city: 'Lagos', province: 'Lagos State', lat: 6.5244, lng: 3.3792 },
    locationAnomaly: true,
    anomalyNote: 'Device registered in Gauteng but last seen in Lagos, Nigeria via VPN — 5,700km displacement in 2 hours',
    locationHistory: [
      { city: 'Lagos', province: 'Lagos State', lat: 6.5244, lng: 3.3792, timestamp: '2026-03-14 03:22', ip: '105.112.78.45' },
      { city: 'Johannesburg', province: 'Gauteng', lat: -26.2041, lng: 28.0473, timestamp: '2026-03-14 01:15', ip: '196.21.45.200' },
      { city: 'Durban', province: 'KwaZulu-Natal', lat: -29.8587, lng: 31.0218, timestamp: '2026-03-13 22:00', ip: '41.13.252.18' },
      { city: 'Nairobi', province: 'Nairobi', lat: -1.2921, lng: 36.8219, timestamp: '2026-03-12 14:10', ip: '197.232.10.5' },
      { city: 'Pretoria', province: 'Gauteng', lat: -25.7479, lng: 28.2293, timestamp: '2026-03-10 09:00', ip: '196.21.48.87' },
    ],
  },
  {
    id: 'd004', fingerprint: '1234abcd5678ef001234abcd5678ef001234abcd5678ef001234abcd5678ef00',
    model: 'Huawei P40 Lite', os: 'EMUI 13', userId: '+27821000004', riskScore: 35,
    isRooted: false, isEmulator: false, firstSeen: '2025-06-01', lastSeen: '2026-03-13',
    linkedAccounts: 2, blacklisted: false,
    lastLocation: { city: 'Durban', province: 'KwaZulu-Natal', lat: -29.8587, lng: 31.0218 },
    locationAnomaly: true,
    anomalyNote: 'First time seen in KwaZulu-Natal — previous activity was exclusively in Gauteng',
    locationHistory: [
      { city: 'Durban', province: 'KwaZulu-Natal', lat: -29.8587, lng: 31.0218, timestamp: '2026-03-13 10:30', ip: '41.13.252.44' },
      { city: 'Johannesburg', province: 'Gauteng', lat: -26.2041, lng: 28.0473, timestamp: '2026-03-11 15:20', ip: '196.21.45.110' },
      { city: 'Johannesburg', province: 'Gauteng', lat: -26.2041, lng: 28.0473, timestamp: '2026-03-09 09:00', ip: '196.21.45.110' },
    ],
  },
  {
    id: 'd005', fingerprint: 'cafe0101cafe0101cafe0101cafe0101cafe0101cafe0101cafe0101cafe0101',
    model: 'Xiaomi Redmi Note 12', os: 'Android 13', userId: '+27821000005', riskScore: 18,
    isRooted: false, isEmulator: false, firstSeen: '2024-09-20', lastSeen: '2026-03-12',
    linkedAccounts: 2, blacklisted: false,
    lastLocation: { city: 'Bloemfontein', province: 'Free State', lat: -29.0852, lng: 26.1596 },
    locationAnomaly: false,
    locationHistory: [
      { city: 'Bloemfontein', province: 'Free State', lat: -29.0852, lng: 26.1596, timestamp: '2026-03-12 13:45', ip: '41.76.108.22' },
      { city: 'Bloemfontein', province: 'Free State', lat: -29.0852, lng: 26.1596, timestamp: '2026-03-10 10:15', ip: '41.76.108.22' },
    ],
  },
  {
    id: 'd006', fingerprint: 'babe0101babe0101babe0101babe0101babe0101babe0101babe0101babe0101',
    model: 'Oppo A57', os: 'Android 12', userId: '+27609000045', riskScore: 68,
    isRooted: true, isEmulator: false, firstSeen: '2026-02-28', lastSeen: '2026-03-14',
    linkedAccounts: 3, blacklisted: false,
    lastLocation: { city: 'Polokwane', province: 'Limpopo', lat: -23.9045, lng: 29.4689 },
    locationAnomaly: true,
    anomalyNote: 'Rooted device with 3 linked accounts appearing across 3 different provinces in 48 hours',
    locationHistory: [
      { city: 'Polokwane', province: 'Limpopo', lat: -23.9045, lng: 29.4689, timestamp: '2026-03-14 07:30', ip: '41.150.1.88' },
      { city: 'Nelspruit', province: 'Mpumalanga', lat: -25.4753, lng: 30.9694, timestamp: '2026-03-13 19:00', ip: '41.150.3.22' },
      { city: 'Johannesburg', province: 'Gauteng', lat: -26.2041, lng: 28.0473, timestamp: '2026-03-12 14:20', ip: '196.21.45.200' },
      { city: 'Pretoria', province: 'Gauteng', lat: -25.7479, lng: 28.2293, timestamp: '2026-03-11 08:00', ip: '196.21.48.87' },
    ],
  },
];

function getTrustLevel(d: DeviceRecord): { label: string; color: string } {
  if (d.blacklisted) return { label: 'Blacklisted', color: '#EF4444' };
  if (d.isEmulator || d.riskScore >= 70) return { label: 'Suspicious', color: '#F97316' };
  if (d.riskScore >= 30 || d.isRooted) return { label: 'New / Unverified', color: '#FBBF24' };
  return { label: 'Trusted', color: '#10F5A0' };
}

export default function DeviceBinding() {
  const [devices, setDevices] = useState(DEVICES);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const toggleBlacklist = (id: string) => {
    setDevices(prev => prev.map(d => d.id === id ? { ...d, blacklisted: !d.blacklisted } : d));
  };

  const filtered = devices.filter(d =>
    d.model.toLowerCase().includes(search.toLowerCase()) ||
    d.userId.includes(search) ||
    d.fingerprint.includes(search) ||
    d.lastLocation.city.toLowerCase().includes(search.toLowerCase()) ||
    d.lastLocation.province.toLowerCase().includes(search.toLowerCase())
  );
  const selected = devices.find(d => d.id === selectedId);

  const trustedCount = devices.filter(d => !d.blacklisted && d.riskScore < 30).length;
  const suspiciousCount = devices.filter(d => d.riskScore >= 50).length;
  const blacklistedCount = devices.filter(d => d.blacklisted).length;
  const anomalyCount = devices.filter(d => d.locationAnomaly).length;

  return (
    <div style={{ padding: '24px 28px', fontFamily: 'Inter, sans-serif', color: '#F0F6FF' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.02em', margin: 0 }}>
            Device Trust & Binding
          </h1>
          <p style={{ fontSize: 12, color: '#475569', margin: '4px 0 0' }}>{devices.length} devices tracked · SHA-256 fingerprinting · <span style={{ color: '#0EA5E9' }}>GPS + IP geolocation</span></p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {[
            { label: 'TRUSTED', value: trustedCount, color: '#10F5A0' },
            { label: 'SUSPICIOUS', value: suspiciousCount, color: '#F97316' },
            { label: 'BLACKLISTED', value: blacklistedCount, color: '#EF4444' },
            { label: 'LOC ANOMALY', value: anomalyCount, color: '#A78BFA' },
          ].map(s => (
            <div key={s.label} style={{ padding: '8px 14px', borderRadius: 10, background: `${s.color}08`, border: `1px solid ${s.color}25` }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: '#475569', letterSpacing: '0.08em', display: 'block' }}>{s.label}</span>
              <span style={{ fontSize: 18, fontWeight: 900, color: s.color, fontFamily: 'Outfit, sans-serif' }}>{s.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Search */}
      <input placeholder="Search by model, phone, fingerprint, city, or province\u2026" value={search} onChange={e => setSearch(e.target.value)} style={{
        width: '100%', maxWidth: 460, padding: '10px 16px', borderRadius: 10, fontSize: 13, marginBottom: 20,
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
        color: '#F0F6FF', fontFamily: 'JetBrains Mono, monospace',
      }} />

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 380px' : '1fr', gap: 16 }}>
        {/* Device Table */}
        <div style={{
          background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 14, overflow: 'hidden',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 70px 70px 90px 120px 80px 90px', padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', gap: 6 }}>
            {['DEVICE', 'USER', 'RISK', 'ROOT', 'TRUST', 'LOCATION', 'ACCTS', 'ACTION'].map(h => (
              <span key={h} style={{ fontSize: 9, fontWeight: 700, color: '#334155', letterSpacing: '0.1em' }}>{h}</span>
            ))}
          </div>
          {filtered.map((d, i) => {
            const trust = getTrustLevel(d);
            return (
              <div key={d.id} onClick={() => setSelectedId(selectedId === d.id ? null : d.id)} style={{
                display: 'grid', gridTemplateColumns: '1fr 100px 70px 70px 90px 120px 80px 90px',
                padding: '12px 20px', gap: 6, alignItems: 'center', cursor: 'pointer',
                borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                background: selectedId === d.id ? 'rgba(14,165,233,0.05)' : d.blacklisted ? 'rgba(239,68,68,0.03)' : d.locationAnomaly ? 'rgba(167,139,250,0.03)' : 'transparent',
                borderLeft: `2px solid ${d.locationAnomaly ? '#A78BFA30' : trust.color + '30'}`,
                transition: 'background 0.15s',
              }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                onMouseLeave={e => (e.currentTarget.style.background = selectedId === d.id ? 'rgba(14,165,233,0.05)' : d.blacklisted ? 'rgba(239,68,68,0.03)' : 'transparent')}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#F0F6FF' }}>{d.model}</div>
                  <div style={{ fontSize: 10, color: '#475569', fontFamily: 'JetBrains Mono, monospace' }}>{d.fingerprint.slice(0, 16)}\u2026</div>
                </div>
                <span style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'JetBrains Mono, monospace' }}>{d.userId.slice(0, 8)}\u2026</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 30, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)' }}>
                    <div style={{ width: `${d.riskScore}%`, height: '100%', borderRadius: 2, background: d.riskScore >= 70 ? '#EF4444' : d.riskScore >= 30 ? '#FBBF24' : '#10F5A0' }} />
                  </div>
                  <span style={{ fontSize: 10, color: '#64748B', fontFamily: 'JetBrains Mono, monospace' }}>{d.riskScore}</span>
                </div>
                <span style={{ fontSize: 10, color: d.isRooted ? '#EF4444' : '#334155' }}>{d.isRooted ? '\u26A0\uFE0F Yes' : '\u2014'}</span>
                <span style={{ fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: `${trust.color}18`, color: trust.color }}>{trust.label}</span>
                <div>
                  <div style={{ fontSize: 11, color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 4 }}>
                    {d.locationAnomaly && <span style={{ fontSize: 8, color: '#A78BFA' }}>⚠️</span>}
                    📍 {d.lastLocation.city}
                  </div>
                  <div style={{ fontSize: 9, color: '#475569' }}>{d.lastLocation.province}</div>
                </div>
                <span style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'JetBrains Mono, monospace', textAlign: 'center' }}>{d.linkedAccounts}</span>
                <button onClick={e => { e.stopPropagation(); toggleBlacklist(d.id); }} style={{
                  padding: '5px 12px', borderRadius: 6, fontSize: 10, fontWeight: 600, border: 'none', cursor: 'pointer',
                  background: d.blacklisted ? 'rgba(16,245,160,0.1)' : 'rgba(239,68,68,0.1)',
                  color: d.blacklisted ? '#10F5A0' : '#EF4444',
                }}>{d.blacklisted ? 'Whitelist' : 'Blacklist'}</button>
              </div>
            );
          })}
        </div>

        {/* Detail Panel */}
        {selected && (() => {
          const trust = getTrustLevel(selected);
          const uniqueProvinces = [...new Set(selected.locationHistory.map(l => l.province))];
          return (
            <div style={{
              background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 14, padding: '20px', maxHeight: 'calc(100vh - 80px)', overflowY: 'auto',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: trust.color, letterSpacing: '0.1em', marginBottom: 4 }}>
                    {trust.label.toUpperCase()}
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, fontFamily: 'Outfit, sans-serif' }}>{selected.model}</div>
                </div>
                <button onClick={() => setSelectedId(null)} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 18 }}>{'\u2715'}</button>
              </div>

              {/* Risk gauge */}
              <div style={{ fontSize: 10, fontWeight: 700, color: '#475569', letterSpacing: '0.08em', marginBottom: 12 }}>DEVICE REPUTATION</div>
              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: '16px', marginBottom: 16, textAlign: 'center' }}>
                <div style={{ fontSize: 36, fontWeight: 900, color: selected.riskScore >= 70 ? '#EF4444' : selected.riskScore >= 30 ? '#FBBF24' : '#10F5A0', fontFamily: 'JetBrains Mono, monospace' }}>
                  {selected.riskScore}
                </div>
                <div style={{ fontSize: 10, color: '#475569', fontWeight: 700, letterSpacing: '0.08em' }}>RISK SCORE</div>
                <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, marginTop: 8 }}>
                  <div style={{ width: `${selected.riskScore}%`, height: '100%', borderRadius: 2, background: selected.riskScore >= 70 ? '#EF4444' : selected.riskScore >= 30 ? '#FBBF24' : '#10F5A0', transition: 'width 0.5s' }} />
                </div>
              </div>

              {/* Location Anomaly Alert */}
              {selected.locationAnomaly && (
                <div style={{
                  padding: '12px 14px', borderRadius: 12, marginBottom: 16,
                  background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.25)',
                }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#A78BFA', letterSpacing: '0.08em', marginBottom: 6 }}>
                    ⚠️ LOCATION ANOMALY DETECTED
                  </div>
                  <div style={{ fontSize: 12, color: '#C4B5FD', lineHeight: 1.6 }}>
                    {selected.anomalyNote || 'Unusual location change detected for this device.'}
                  </div>
                </div>
              )}

              {/* Last Known Location */}
              <div style={{ fontSize: 10, fontWeight: 700, color: '#475569', letterSpacing: '0.08em', marginBottom: 10 }}>📍 LAST KNOWN LOCATION</div>
              <div style={{
                padding: '14px 16px', borderRadius: 12, marginBottom: 16,
                background: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.2)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#F0F6FF', fontFamily: 'Outfit, sans-serif' }}>{selected.lastLocation.city}</div>
                    <div style={{ fontSize: 11, color: '#64748B' }}>{selected.lastLocation.province}</div>
                  </div>
                  <div style={{
                    padding: '6px 10px', borderRadius: 8,
                    background: selected.locationAnomaly ? 'rgba(239,68,68,0.1)' : 'rgba(16,245,160,0.1)',
                    fontSize: 9, fontWeight: 700,
                    color: selected.locationAnomaly ? '#EF4444' : '#10F5A0',
                  }}>{selected.locationAnomaly ? '⚠️ ANOMALY' : '✅ NORMAL'}</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div style={{ fontSize: 11, color: '#64748B' }}>
                    Lat: <span style={{ color: '#94A3B8', fontFamily: 'JetBrains Mono, monospace' }}>{selected.lastLocation.lat.toFixed(4)}</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#64748B' }}>
                    Lng: <span style={{ color: '#94A3B8', fontFamily: 'JetBrains Mono, monospace' }}>{selected.lastLocation.lng.toFixed(4)}</span>
                  </div>
                </div>
                <div style={{ fontSize: 10, color: '#475569', marginTop: 6 }}>
                  Provinces seen: {uniqueProvinces.map((p, i) => (
                    <span key={p} style={{ color: uniqueProvinces.length > 2 ? '#A78BFA' : '#94A3B8', fontWeight: 600 }}>
                      {p}{i < uniqueProvinces.length - 1 ? ', ' : ''}
                    </span>
                  ))}
                </div>
              </div>

              {/* Location History Timeline */}
              <div style={{ fontSize: 10, fontWeight: 700, color: '#475569', letterSpacing: '0.08em', marginBottom: 10 }}>🕐 LOCATION HISTORY</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 16 }}>
                {selected.locationHistory.map((entry, i) => {
                  const prevEntry = selected.locationHistory[i + 1];
                  const provinceChanged = prevEntry && prevEntry.province !== entry.province;
                  return (
                    <div key={i} style={{
                      display: 'grid', gridTemplateColumns: '14px 1fr',
                      gap: 10, alignItems: 'flex-start',
                    }}>
                      {/* Timeline dot + line */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 4 }}>
                        <div style={{
                          width: 8, height: 8, borderRadius: 4, flexShrink: 0,
                          background: i === 0 ? '#0EA5E9' : provinceChanged ? '#A78BFA' : '#334155',
                          boxShadow: i === 0 ? '0 0 8px rgba(14,165,233,0.5)' : 'none',
                        }} />
                        {i < selected.locationHistory.length - 1 && (
                          <div style={{ width: 1, flex: 1, minHeight: 20, background: 'rgba(255,255,255,0.06)' }} />
                        )}
                      </div>
                      {/* Entry */}
                      <div style={{
                        padding: '8px 10px', borderRadius: 8, marginBottom: 2,
                        background: provinceChanged ? 'rgba(167,139,250,0.05)' : 'rgba(255,255,255,0.02)',
                        borderLeft: provinceChanged ? '2px solid #A78BFA40' : '2px solid transparent',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#F0F6FF' }}>
                            📍 {entry.city}
                            {provinceChanged && <span style={{ fontSize: 9, color: '#A78BFA', marginLeft: 6 }}>NEW PROVINCE</span>}
                          </span>
                          <span style={{ fontSize: 9, color: '#475569', fontFamily: 'JetBrains Mono, monospace' }}>{entry.timestamp}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 12, fontSize: 10, color: '#64748B', marginTop: 3 }}>
                          <span>{entry.province}</span>
                          <span style={{ fontFamily: 'JetBrains Mono, monospace', color: '#475569' }}>IP: {entry.ip}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Device Properties */}
              <div style={{ fontSize: 10, fontWeight: 700, color: '#475569', letterSpacing: '0.08em', marginBottom: 10 }}>DEVICE PROPERTIES</div>
              {[
                { l: 'Fingerprint', v: selected.fingerprint.slice(0, 24) + '\u2026', mono: true },
                { l: 'OS', v: selected.os },
                { l: 'User', v: selected.userId, mono: true },
                { l: 'First Seen', v: selected.firstSeen },
                { l: 'Last Seen', v: selected.lastSeen },
                { l: 'Linked Accounts', v: selected.linkedAccounts.toString() },
                { l: 'Rooted / Jailbroken', v: selected.isRooted ? 'Yes' : 'No' },
                { l: 'Emulator', v: selected.isEmulator ? 'Yes' : 'No' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ fontSize: 12, color: '#64748B' }}>{item.l}</span>
                  <span style={{ fontSize: 12, color: '#F0F6FF', fontWeight: 600, fontFamily: item.mono ? 'JetBrains Mono, monospace' : 'inherit' }}>{item.v}</span>
                </div>
              ))}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
