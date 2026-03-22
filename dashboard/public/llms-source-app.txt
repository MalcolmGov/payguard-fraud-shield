import { BrowserRouter, Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect, lazy, Suspense } from 'react';
import { useAuth, ProtectedRoute, RoleBadge } from './components/AuthGuard';
import type { Auth } from './components/AuthGuard';
import PayGuardVoiceCoPilot from './components/PayGuardVoiceCoPilot';
import PageLoader from './components/PageLoader';
import './index.css';

// ── Eager-loaded pages (critical path) ────────────────────────────────────────
import Landing from './pages/Landing';

// ── Lazy-loaded pages (code-split) ────────────────────────────────────────────
const Demo = lazy(() => import('./pages/Demo'));
const DemoTransaction = lazy(() => import('./pages/DemoTransaction'));
const DemoTakeover = lazy(() => import('./pages/DemoTakeover'));
const DemoSimSwap = lazy(() => import('./pages/DemoSimSwap'));
const DemoFraudRing = lazy(() => import('./pages/DemoFraudRing'));
const DemoRuleTuning = lazy(() => import('./pages/DemoRuleTuning'));
const DemoFalsePositive = lazy(() => import('./pages/DemoFalsePositive'));
const Ecosystem = lazy(() => import('./pages/Ecosystem'));
const ProductsPage = lazy(() => import('./pages/ProductsPage'));
const ArchitecturePage = lazy(() => import('./pages/ArchitecturePage'));
const DeveloperPortalPage = lazy(() => import('./pages/DeveloperPortalPage'));
const SandboxPage = lazy(() => import('./pages/SandboxPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const HowItWorksPage = lazy(() => import('./pages/HowItWorksPage'));
const UssdDemoPage = lazy(() => import('./pages/UssdDemoPage'));
const LegalPage = lazy(() => import('./pages/LegalPage'));

// Dashboard pages (behind auth — always lazy)
const Overview = lazy(() => import('./pages/Overview'));
const Transactions = lazy(() => import('./pages/Transactions'));
const TransactionDetail = lazy(() => import('./pages/TransactionDetail'));
const FraudNetwork = lazy(() => import('./pages/FraudNetwork'));
const Accounts = lazy(() => import('./pages/Accounts'));
const Reports = lazy(() => import('./pages/Reports'));
const Rules = lazy(() => import('./pages/Rules'));
const DeviceBinding = lazy(() => import('./pages/DeviceBinding'));
const GeoIntelligence = lazy(() => import('./pages/GeoIntelligence'));
const AttackSimulator = lazy(() => import('./pages/AttackSimulator'));
const PrecrimePage = lazy(() => import('./pages/PrecrimePage'));
const TrajectoryPage = lazy(() => import('./pages/TrajectoryPage'));
const FraudClusterPage = lazy(() => import('./pages/FraudClusterPage'));
const AuditLog = lazy(() => import('./pages/AuditLog'));
const Settings = lazy(() => import('./pages/Settings'));
const Clients = lazy(() => import('./pages/Clients'));
const Invoices = lazy(() => import('./pages/Invoices'));
const CaseQueue = lazy(() => import('./pages/CaseQueue'));
const UserProfile = lazy(() => import('./pages/UserProfile'));

// Lazy modals
const ScamWarningModal = lazy(() => import('./components/ScamWarningModal'));
const AskPayGuard = lazy(() => import('./components/AskPayGuard'));
const ExecutiveBrief = lazy(() => import('./components/ExecutiveBrief'));

// ── Analytics (lightweight) ───────────────────────────────────────────────────
function usePageView() {
  const location = useLocation();
  useEffect(() => {
    // Google Analytics gtag
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('config', 'G-XXXXXXXXXX', {
        page_path: location.pathname + location.search,
      });
    }
  }, [location]);
}

// ── SEO helper ────────────────────────────────────────────────────────────────
const PAGE_META: Record<string, { title: string; description: string }> = {
  '/': { title: 'PayGuard — Stop Social Engineering Fraud', description: 'Real-time fraud detection SDK for mobile money. Blocks vishing, OTP phishing & SIM swap attacks.' },
  '/products': { title: 'Products — PayGuard', description: 'Eight fraud prevention products in one platform. From signal detection to graph investigation.' },
  '/demo': { title: 'Interactive Demos — PayGuard', description: 'Seven interactive fraud scenario walkthroughs. See PayGuard stop real attacks in real-time.' },
  '/how-it-works': { title: 'How It Works — PayGuard', description: 'From signal collection to risk decision in under 100ms. See the PayGuard pipeline.' },
  '/architecture': { title: 'Architecture — PayGuard', description: 'Technical architecture overview of the PayGuard fraud prevention platform.' },
  '/developers': { title: 'Developer Docs — PayGuard', description: 'Integrate PayGuard in 4 lines of code. Kotlin & Swift SDKs, REST API, sandbox mode.' },
  '/about': { title: 'About Us — PayGuard', description: 'PayGuard is built by Swifter Technologies. Africa-first fraud prevention.' },
  '/contact': { title: 'Contact — PayGuard', description: 'Get in touch with the PayGuard team. Book a demo or discuss integration.' },
};

function useDocumentMeta() {
  const location = useLocation();
  useEffect(() => {
    const meta = PAGE_META[location.pathname];
    if (meta) {
      document.title = meta.title;
      const descTag = document.querySelector('meta[name="description"]');
      if (descTag) descTag.setAttribute('content', meta.description);
      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) ogTitle.setAttribute('content', meta.title);
      const ogDesc = document.querySelector('meta[property="og:description"]');
      if (ogDesc) ogDesc.setAttribute('content', meta.description);
    }
  }, [location]);
}

// ── Nav config ────────────────────────────────────────────────────────────────
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
      <Suspense fallback={null}>
        {showDemo && <ScamWarningModal onClose={() => setShowDemo(false)} />}
        {showBrief && <ExecutiveBrief onClose={() => setShowBrief(false)} />}
        {showAI && <AskPayGuard onClose={() => setShowAI(false)} />}
      </Suspense>
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
function AppRoutes() {
  const auth = useAuth();
  usePageView();
  useDocumentMeta();

  const dash = (page: React.ReactNode) => (
    <ProtectedRoute auth={auth}>
      <DashboardLayout auth={auth}>
        <Suspense fallback={<PageLoader />}>{page}</Suspense>
      </DashboardLayout>
    </ProtectedRoute>
  );

  return (
    <>
      <Routes>
        {/* ── Public routes ──────────────────────────────────── */}
        <Route path="/" element={<Landing />} />
        <Route path="/demo"               element={<Suspense fallback={<PageLoader />}><Demo /></Suspense>} />
        <Route path="/demo/transaction"   element={<Suspense fallback={<PageLoader />}><DemoTransaction /></Suspense>} />
        <Route path="/demo/takeover"      element={<Suspense fallback={<PageLoader />}><DemoTakeover /></Suspense>} />
        <Route path="/demo/simswap"       element={<Suspense fallback={<PageLoader />}><DemoSimSwap /></Suspense>} />
        <Route path="/demo/fraudring"     element={<Suspense fallback={<PageLoader />}><DemoFraudRing /></Suspense>} />
        <Route path="/demo/ruletuning"    element={<Suspense fallback={<PageLoader />}><DemoRuleTuning /></Suspense>} />
        <Route path="/demo/falsepositive" element={<Suspense fallback={<PageLoader />}><DemoFalsePositive /></Suspense>} />
        <Route path="/ecosystem"    element={<Suspense fallback={<PageLoader />}><Ecosystem /></Suspense>} />
        <Route path="/products"     element={<Suspense fallback={<PageLoader />}><ProductsPage /></Suspense>} />
        <Route path="/how-it-works" element={<Suspense fallback={<PageLoader />}><HowItWorksPage /></Suspense>} />
        <Route path="/architecture" element={<Suspense fallback={<PageLoader />}><ArchitecturePage /></Suspense>} />
        <Route path="/developers"   element={<Suspense fallback={<PageLoader />}><DeveloperPortalPage /></Suspense>} />
        <Route path="/sandbox"      element={<Suspense fallback={<PageLoader />}><SandboxPage /></Suspense>} />
        <Route path="/about"        element={<Suspense fallback={<PageLoader />}><AboutPage /></Suspense>} />
        <Route path="/ussd-demo"    element={<Suspense fallback={<PageLoader />}><UssdDemoPage /></Suspense>} />
        <Route path="/contact"      element={<Suspense fallback={<PageLoader />}><ContactPage /></Suspense>} />
        <Route path="/legal/:type"  element={<Suspense fallback={<PageLoader />}><LegalPage /></Suspense>} />

        {/* ── Analyst dashboard routes (auth required) ──────── */}
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
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
