/**
 * Role-Based Access Control (RBAC) AuthGuard
 *
 * Roles:
 *   admin   — full access including blacklist management and user admin
 *   analyst — read + write on alerts/rules, no user admin
 *   viewer  — read-only (reports, overview, transactions — no actions)
 *
 * Credentials (SHA-256 hashed passwords):
 *   admin/admin      → role: admin
 *   analyst/analyst  → role: analyst
 *   viewer/viewer    → role: viewer
 *
 * Generate a new hash: crypto.subtle.digest in browser or:
 *   echo -n "MyPassword!" | sha256sum
 */
import { useState, useEffect } from 'react';

// ── Role definition ───────────────────────────────────────────────────────────
export type Role = 'admin' | 'analyst' | 'viewer';

export interface Permission {
  canBlacklist:    boolean;
  canEditRules:    boolean;
  canViewReports:  boolean;
  canManageUsers:  boolean;
  canViewDevices:  boolean;
  canExportData:   boolean;
}

const ROLE_PERMISSIONS: Record<Role, Permission> = {
  admin: {
    canBlacklist:   true,
    canEditRules:   true,
    canViewReports: true,
    canManageUsers: true,
    canViewDevices: true,
    canExportData:  true,
  },
  analyst: {
    canBlacklist:   true,
    canEditRules:   true,
    canViewReports: true,
    canManageUsers: false,
    canViewDevices: true,
    canExportData:  true,
  },
  viewer: {
    canBlacklist:   false,
    canEditRules:   false,
    canViewReports: true,
    canManageUsers: false,
    canViewDevices: true,
    canExportData:  false,
  },
};

// ── User registry (sha-256 of password) ──────────────────────────────────────
const USERS: Record<string, { role: Role; displayName: string; hash: string }> = {
  admin: {
    role: 'admin',
    displayName: 'Admin User',
    // SHA-256 of "admin"
    hash: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918',
  },
  analyst: {
    role: 'analyst',
    displayName: 'Fraud Analyst',
    // SHA-256 of "analyst"
    hash: 'f44ceb062e35dfeea6ed7f8524d53bb0bff19f553e25cae7ef4850e4185ccbba',
  },
  viewer: {
    role: 'viewer',
    displayName: 'Read-Only Viewer',
    // SHA-256 of "viewer"
    hash: 'd35ca5051b82ffc326a3b0b6574a9a3161dee16b9478a199ee39cd803ce5b799',
  },
};

const SESSION_KEY     = 'pg_analyst_session';
const SESSION_TTL_MS  = 8 * 60 * 60 * 1000; // 8 hours

async function sha256(message: string): Promise<string> {
  const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(message));
  return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export interface Session {
  username: string;
  displayName: string;
  role: Role;
  expiresAt: number;
}

function getSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Session;
    if (Date.now() > s.expiresAt) { sessionStorage.removeItem(SESSION_KEY); return null; }
    return s;
  } catch { return null; }
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useAuth() {
  const [session, setSession] = useState<Session | null>(getSession);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);

  const login = async (username: string, password: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    if (attempts >= 5) { setError('Too many failed attempts. Wait 30 seconds.'); setLoading(false); return false; }
    try {
      const hash = await sha256(password);
      const user = USERS[username.toLowerCase()];
      if (!user || hash !== user.hash) {
        setAttempts(a => a + 1);
        setError('Invalid username or password.');
        return false;
      }
      const s: Session = { username, displayName: user.displayName, role: user.role, expiresAt: Date.now() + SESSION_TTL_MS };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
      setSession(s);
      setAttempts(0);
      return true;
    } finally { setLoading(false); }
  };

  const logout = () => { sessionStorage.removeItem(SESSION_KEY); setSession(null); };

  const can = (perm: keyof Permission): boolean =>
    session ? ROLE_PERMISSIONS[session.role][perm] : false;

  return { isAuthenticated: !!session, session, role: session?.role, displayName: session?.displayName, login, logout, loading, error, attempts, can };
}

export type Auth = ReturnType<typeof useAuth>;

// ── Login Page ────────────────────────────────────────────────────────────────
export function LoginPage({ auth }: { auth: Auth }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [locked, setLocked]     = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (auth.attempts >= 5) {
      setLocked(true); setCountdown(30);
      const t = setInterval(() => setCountdown(c => { if (c <= 1) { clearInterval(t); setLocked(false); return 0; } return c - 1; }), 1000);
    }
  }, [auth.attempts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locked) await auth.login(username, password);
  };

  const ROLE_BADGES: Record<string, { emoji: string; color: string }> = {
    admin: { emoji: '🔴', color: '#FF4444' },
    analyst: { emoji: '🟡', color: '#FBBF24' },
    viewer: { emoji: '🟢', color: '#10F5A0' },
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#000', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Left — Hero Image */}
      <div style={{
        flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'flex-end',
        background: '#000',
      }}>
        <img
          src="/fraud-hero.png"
          alt="Fraud Detection Visualization"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }}
        />
        {/* Gradient overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, transparent 50%, #000 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 50%)' }} />

        {/* Bottom text overlay */}
        <div style={{ position: 'relative', zIndex: 2, padding: '48px 40px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', color: '#DC2626', textTransform: 'uppercase', marginBottom: 12 }}>
            AI-POWERED FRAUD INTELLIGENCE
          </div>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 32, fontWeight: 900, color: '#fff', margin: '0 0 10px', lineHeight: 1.2, letterSpacing: '-0.02em' }}>
            Protecting Mobile<br />Money in Real-Time
          </h2>
          <p style={{ fontSize: 14, color: '#888', lineHeight: 1.7, maxWidth: 380, margin: 0 }}>
            PayGuard prevents social engineering fraud before transactions complete — stopping vishing, SIM swap, and OTP interception attacks across Africa.
          </p>
          <div style={{ display: 'flex', gap: 20, marginTop: 24 }}>
            {[
              { value: '14ms', label: 'Avg Response' },
              { value: '99.7%', label: 'Accuracy' },
              { value: 'R2.4B', label: 'Protected' },
            ].map(s => (
              <div key={s.label}>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#DC2626', fontFamily: 'Outfit, sans-serif' }}>{s.value}</div>
                <div style={{ fontSize: 10, color: '#555', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Login Form */}
      <div style={{
        width: 480, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 48px',
        background: '#000', borderLeft: '1px solid rgba(220,38,38,0.15)',
      }}>
        {/* Logo */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'linear-gradient(135deg, #DC2626, #7F1D1D)', fontSize: 22,
              boxShadow: '0 4px 20px rgba(220,38,38,0.3)',
            }}>🛡️</div>
            <div>
              <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 28, fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>PayGuard</h1>
            </div>
          </div>
          <p style={{ color: '#555', fontSize: 13, margin: '8px 0 0' }}>Analyst Dashboard — Secure Access</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Username */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', color: '#666', fontSize: 10, fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              USERNAME
            </label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              autoComplete="username"
              placeholder="Enter username"
              disabled={auth.loading || locked}
              style={{
                width: '100%', padding: '14px 16px', background: '#0A0A0A',
                border: '1px solid rgba(220,38,38,0.2)', borderRadius: 12, color: '#fff',
                fontSize: 14, outline: 'none', boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => (e.target.style.borderColor = '#DC2626')}
              onBlur={e => (e.target.style.borderColor = 'rgba(220,38,38,0.2)')}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', color: '#666', fontSize: 10, fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              PASSWORD
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="Enter password"
              disabled={auth.loading || locked}
              style={{
                width: '100%', padding: '14px 16px', background: '#0A0A0A',
                border: '1px solid rgba(220,38,38,0.2)', borderRadius: 12, color: '#fff',
                fontSize: 14, outline: 'none', boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => (e.target.style.borderColor = '#DC2626')}
              onBlur={e => (e.target.style.borderColor = 'rgba(220,38,38,0.2)')}
            />
          </div>

          {/* Error */}
          {auth.error && (
            <div style={{
              background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.3)',
              borderRadius: 10, padding: '12px 16px', color: '#EF4444', fontSize: 13, marginBottom: 20,
            }}>
              ⚠️ {auth.error}{locked && ` Retry in ${countdown}s.`}
            </div>
          )}

          {/* Submit */}
          <button type="submit" disabled={auth.loading || locked} style={{
            width: '100%', padding: '14px', borderRadius: 12, border: 'none', fontSize: 15, fontWeight: 700,
            cursor: locked ? 'not-allowed' : 'pointer',
            background: locked ? '#1A1A1A' : 'linear-gradient(135deg, #DC2626, #991B1B)',
            color: locked ? '#555' : '#fff',
            opacity: auth.loading ? 0.7 : 1,
            boxShadow: locked ? 'none' : '0 4px 20px rgba(220,38,38,0.3)',
            transition: 'all 0.3s',
          }}>
            {auth.loading ? 'Signing in…' : locked ? `🔒 Locked (${countdown}s)` : 'Sign In →'}
          </button>
        </form>

        {/* Role hints */}
        <div style={{ marginTop: 36, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 24 }}>
          <div style={{ color: '#444', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Available Roles</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Object.entries(USERS).map(([uname, info]) => (
              <div key={uname} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#888' }}>
                  {ROLE_BADGES[info.role]?.emoji} <strong style={{ color: '#bbb' }}>{uname}</strong>
                </span>
                <span style={{ textTransform: 'capitalize', color: '#444', fontSize: 11, fontWeight: 600 }}>{info.role}</span>
              </div>
            ))}
          </div>
        </div>

        <p style={{ textAlign: 'center', color: '#333', fontSize: 11, marginTop: 28 }}>🔒 Session expires in 8 hours</p>
      </div>
    </div>
  );
}

// ── ProtectedRoute ─────────────────────────────────────────────────────────────
export function ProtectedRoute({ children, auth }: { children: React.ReactNode; auth: Auth }) {
  if (!auth.isAuthenticated) return <LoginPage auth={auth} />;
  return <>{children}</>;
}

// ── Role badge component ───────────────────────────────────────────────────────
export function RoleBadge({ role }: { role: Role }) {
  const styles: Record<Role, { bg: string; color: string; label: string }> = {
    admin:   { bg: 'rgba(235, 31, 31, 0.15)',  color: '#FF6060', label: '🔴 Admin' },
    analyst: { bg: 'rgba(245, 166, 35, 0.15)', color: '#F5A623', label: '🟡 Analyst' },
    viewer:  { bg: 'rgba(39, 174, 96, 0.15)',  color: '#2ecc71', label: '🟢 Viewer' },
  };
  const s = styles[role];
  return (
    <span style={{ background: s.bg, color: s.color, borderRadius: 6, padding: '3px 8px', fontSize: 11, fontWeight: 600 }}>
      {s.label}
    </span>
  );
}
