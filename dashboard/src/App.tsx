import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth, ProtectedRoute, RoleBadge } from './components/AuthGuard';
import type { Auth } from './components/AuthGuard';
import PayGuardVoiceCoPilot from './components/PayGuardVoiceCoPilot';
import './index.css';

import Landing from './pages/Landing';
import Demo from './pages/Demo';
import DemoTransaction from './pages/DemoTransaction';
import DemoTakeover from './pages/DemoTakeover';
import DemoSimSwap from './pages/DemoSimSwap';
import DemoFraudRing from './pages/DemoFraudRing';
import DemoRuleTuning from './pages/DemoRuleTuning';
import DemoFalsePositive from './pages/DemoFalsePositive';
import Ecosystem from './pages/Ecosystem';
import ProductsPage from './pages/ProductsPage';
import ArchitecturePage from './pages/ArchitecturePage';
import DeveloperPortalPage from './pages/DeveloperPortalPage';
import SandboxPage from './pages/SandboxPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import HowItWorksPage from './pages/HowItWorksPage';
import Overview from './pages/Overview';
import Transactions from './pages/Transactions';
import TransactionDetail from './pages/TransactionDetail';
import FraudNetwork from './pages/FraudNetwork';
import Accounts from './pages/Accounts';
import Reports from './pages/Reports';
import Rules from './pages/Rules';
import DeviceBinding from './pages/DeviceBinding';
import UssdDemoPage from './pages/UssdDemoPage';
import ScamWarningModal from './components/ScamWarningModal';
import AskPayGuard from './components/AskPayGuard';
import GeoIntelligence from './pages/GeoIntelligence';
import AttackSimulator from './pages/AttackSimulator';
import PrecrimePage from './pages/PrecrimePage';
import TrajectoryPage from './pages/TrajectoryPage';
import FraudClusterPage from './pages/FraudClusterPage';
import ExecutiveBrief from './components/ExecutiveBrief';
import AuditLog from './pages/AuditLog';
import Settings from './pages/Settings';
import Clients from './pages/Clients';
import Invoices from './pages/Invoices';
import LegalPage from './pages/LegalPage';
import CaseQueue from './pages/CaseQueue';
import UserProfile from './pages/UserProfile';

const ANALYST_NAV = [
  { to: '/dashboard',      label: '\u{1F4CA} Overview' },
  { to: '/case-queue',     label: '\u{1F4CB} Case Queue' },
  { to: '/transactions',   label: '\u{1F4B3} Transactions' },
  { to: '/user-profile',   label: '\u{1F50D} User 360°' },
  { to: '/network',        label: '\u{1F578}\uFE0F Fraud Network' },
  { to: '/accounts',       label: '\u{1F464} Accounts' },
  { to: '/devices',        label: '\u{1F4F1} Device Binding' },
  { to: '/reports',        label: '\u{1F4C4} Reports' },
  { to: '/rules',          label: '\u2699\uFE0F Rules Engine' },
  { to: '/geo',            label: '\u{1F5FA}\uFE0F Geo Intelligence' },
  { to: '/simulator',      label: '\u26A1 Attack Simulator' },
  { to: '/audit',          label: '\u{1F4CB} Audit Log' },
];

// ── Sidebar + main layout ─────────────────────────────────────────────────────
interface DashboardLayoutProps {
  children: React.ReactNode;
  auth: Auth;
}
function DashboardLayout({ children, auth }: DashboardLayoutProps) {
  const [showDemo, setShowDemo] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [showBrief, setShowBrief] = useState(false);

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h1>{'\u{1F6E1}\uFE0F'} PayGuard</h1>
          <p>Swifter Analytics Platform</p>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-label">Analyst Dashboard</div>
          {ANALYST_NAV.map(({ to, label }) => (
            <NavLink key={to} to={to} className={({ isActive }) => isActive ? 'active' : ''}>
              {label}
            </NavLink>
          ))}
          <div className="nav-label" style={{ marginTop: 20 }}>AI Intelligence</div>
          <NavLink to="/precrime"   className={({ isActive }) => isActive ? 'active' : ''}>{'\u{1F9E0}'} Pre-crime Scores</NavLink>
          <NavLink to="/clusters"   className={({ isActive }) => isActive ? 'active' : ''}>{'\u{1F578}\uFE0F'} Fraud Clusters</NavLink>
          <NavLink to="/trajectory" className={({ isActive }) => isActive ? 'active' : ''}>{'\u{1F4C8}'} Trajectory Forecast</NavLink>
          <a onClick={() => setShowBrief(true)} style={{ cursor: 'pointer' }}>{'\u{1F4CB}'} Morning Brief</a>
          <div className="nav-label" style={{ marginTop: 20 }}>Stakeholder</div>
          <NavLink to="/"         className={({ isActive }) => isActive ? 'active' : ''}>{'\u{1F3E0}'} Home</NavLink>
          <NavLink to="/demo"     className={({ isActive }) => isActive ? 'active' : ''}>{'\u25B6'} Interactive Demo</NavLink>
          <NavLink to="/ecosystem" className={({ isActive }) => isActive ? 'active' : ''}>{'\u{1F3D7}\uFE0F'} Architecture</NavLink>
          <div className="nav-label" style={{ marginTop: 20 }}>Demo Tools</div>
          <NavLink to="/ussd-demo" className={({ isActive }) => isActive ? 'active' : ''}>{'\u{1F4F2}'} USSD Push Demo</NavLink>
          <a onClick={() => setShowDemo(true)} style={{ cursor: 'pointer' }}>{'\u26A0\uFE0F'} Scam Warning Modal</a>
          <div className="nav-label" style={{ marginTop: 20 }}>System</div>
          <NavLink to="/clients" className={({ isActive }) => isActive ? 'active' : ''}>{'\u{1F511}'} API Clients</NavLink>
          <NavLink to="/invoices" className={({ isActive }) => isActive ? 'active' : ''}>{'\u{1F4B0}'} Invoices</NavLink>
          <NavLink to="/settings" className={({ isActive }) => isActive ? 'active' : ''}>{'\u2699\uFE0F'} Settings</NavLink>
        </nav>

        {/* User info + role badge + sign out */}
        <div style={{ padding: '16px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
              {'\u{1F464}'} {auth.displayName ?? auth.session?.username}
            </span>
            <span className="live-dot" />
          </div>
          {auth.role && <RoleBadge role={auth.role} />}
          <button
            onClick={auth.logout}
            style={{ background: 'rgba(200,40,40,0.1)', border: '1px solid rgba(200,40,40,0.3)', color: '#FF8080', borderRadius: 6, padding: '5px 10px', fontSize: 11, cursor: 'pointer', marginTop: 4 }}
          >
            {'\u{1F513}'} Sign Out
          </button>
        </div>
      </aside>
      <div className="main-content">{children}</div>
      {showDemo && <ScamWarningModal onClose={() => setShowDemo(false)} />}
      {showBrief && <ExecutiveBrief onClose={() => setShowBrief(false)} />}
      {showAI && <AskPayGuard onClose={() => setShowAI(false)} />}
      {/* Floating AI button */}
      <button
        onClick={() => setShowAI(s => !s)}
        style={{
          position: 'fixed', bottom: 24, right: showAI ? 452 : 24, zIndex: 499,
          width: 52, height: 52, borderRadius: '50%', border: 'none', cursor: 'pointer',
          background: showAI ? 'rgba(14,165,233,0.2)' : 'linear-gradient(135deg,#0EA5E9,#7C3AED)',
          boxShadow: '0 8px 32px rgba(14,165,233,0.4)',
          fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.3s ease',
        }}
        title="Ask PayGuard AI"
      >
        {showAI ? '\u2715' : '\u{1F6E1}\uFE0F'}
      </button>
      <PayGuardVoiceCoPilot />
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const auth = useAuth();

  // Helper: wrap a page in the dashboard layout + RBAC guard
  const dash = (page: React.ReactNode) => (
    <ProtectedRoute auth={auth}>
      <DashboardLayout auth={auth}>{page}</DashboardLayout>
    </ProtectedRoute>
  );

  return (
    <BrowserRouter>
      <Routes>
        {/* ── Public routes (no auth) ──────────────────────────────────── */}
        <Route path="/"                   element={<Landing />} />
        <Route path="/demo"               element={<Demo />} />
        <Route path="/demo/transaction"   element={<DemoTransaction />} />
        <Route path="/demo/takeover"      element={<DemoTakeover />} />
        <Route path="/demo/simswap"       element={<DemoSimSwap />} />
        <Route path="/demo/fraudring"     element={<DemoFraudRing />} />
        <Route path="/demo/ruletuning"    element={<DemoRuleTuning />} />
        <Route path="/demo/falsepositive" element={<DemoFalsePositive />} />
        <Route path="/ecosystem"    element={<Ecosystem />} />
        <Route path="/products"     element={<ProductsPage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/architecture" element={<ArchitecturePage />} />
        <Route path="/developers"   element={<DeveloperPortalPage />} />
        <Route path="/sandbox"      element={<SandboxPage />} />
        <Route path="/about"        element={<AboutPage />} />
        <Route path="/ussd-demo"    element={<UssdDemoPage />} />
        <Route path="/contact"      element={<ContactPage />} />
        <Route path="/legal/:type"  element={<LegalPage />} />

        {/* ── Analyst dashboard routes (auth required) ──────────────────── */}
        <Route path="/dashboard"        element={dash(<Overview />)} />
        <Route path="/transactions"     element={dash(<Transactions />)} />
        <Route path="/transactions/:id" element={dash(<TransactionDetail />)} />
        <Route path="/network"          element={dash(<FraudNetwork />)} />
        <Route path="/accounts"         element={dash(<Accounts />)} />
        <Route path="/devices"          element={dash(<DeviceBinding />)} />
        <Route path="/reports"          element={dash(<Reports />)} />
        <Route path="/rules"            element={dash(<Rules />)} />
        <Route path="/geo"              element={dash(<GeoIntelligence />)} />
        <Route path="/simulator"        element={dash(<AttackSimulator />)} />
        <Route path="/precrime"         element={dash(<PrecrimePage />)} />
        <Route path="/clusters"         element={dash(<FraudClusterPage />)} />
        <Route path="/trajectory"       element={dash(<TrajectoryPage />)} />
        <Route path="/audit"            element={dash(<AuditLog />)} />
        <Route path="/case-queue"       element={dash(<CaseQueue />)} />
        <Route path="/user-profile"     element={dash(<UserProfile />)} />
        <Route path="/settings"         element={dash(<Settings />)} />
        <Route path="/clients"          element={dash(<Clients />)} />
        <Route path="/invoices"         element={dash(<Invoices />)} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
