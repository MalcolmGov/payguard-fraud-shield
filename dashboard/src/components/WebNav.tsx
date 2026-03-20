import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TalkToSalesModal from './TalkToSalesModal';

export default function WebNav() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [showSales, setShowSales] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  // Close menu on route change
  const go = (path: string) => { navigate(path); setMenuOpen(false); };

  const links = [
    { label: 'Products', path: '/products' },
    { label: 'How It Works', path: '/how-it-works' },
    { label: 'Architecture', path: '/architecture' },
    { label: 'Developers', path: '/developers' },
    { label: 'Sandbox', path: '/sandbox' },
    { label: 'About', path: '/about' },
    { label: 'Contact', path: '/contact' },
  ];

  return (
    <>
      <nav className="web-nav" style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 48px',
        background: scrolled || menuOpen ? 'rgba(11,17,33,0.95)' : 'transparent',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
        backdropFilter: scrolled || menuOpen ? 'blur(16px)' : 'none',
        transition: 'background 0.3s, border-color 0.3s, backdrop-filter 0.3s',
      }}>
        {/* Logo */}
        <div onClick={() => go('/')} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', flexShrink: 0 }}>
          <img src="/payguard-logo.png" alt="PayGuard" style={{
            width: 36, height: 36, borderRadius: 10, objectFit: 'cover',
            boxShadow: '0 0 20px rgba(59,130,246,0.3)',
          }} />
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#F0F6FF', fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.02em' }}>PayGuard</div>
            <div style={{ fontSize: 8, fontWeight: 600, color: '#475569', letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>Powered by Swifter</div>
          </div>
        </div>

        {/* Desktop Links */}
        <div className="nav-desktop-links" style={{ display: 'flex', gap: 28 }}>
          {links.map(l => (
            <span key={l.label} onClick={() => go(l.path)} style={{
              cursor: 'pointer', fontSize: 13.5, fontWeight: 500, color: '#64748B',
              fontFamily: 'Inter, sans-serif', transition: 'color 0.15s',
            }}
              onMouseEnter={e => (e.currentTarget as HTMLSpanElement).style.color = '#94A3B8'}
              onMouseLeave={e => (e.currentTarget as HTMLSpanElement).style.color = '#64748B'}
            >{l.label}</span>
          ))}
        </div>

        {/* Desktop CTAs */}
        <div className="nav-desktop-ctas" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => go('/sandbox')} className="w-btn-secondary" style={{ padding: '9px 20px', fontSize: 13 }}>Try Sandbox</button>
          <button onClick={() => setShowSales(true)} style={{
            padding: '9px 20px', fontSize: 13, fontWeight: 700,
            background: 'linear-gradient(135deg,#3B82F6,#2563EB)', color: '#fff',
            border: 'none', borderRadius: 8, cursor: 'pointer',
            boxShadow: '0 2px 16px rgba(59,130,246,0.35)',
            transition: 'opacity 0.2s', display: 'flex', alignItems: 'center', gap: 6,
          }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.opacity = '1'}
          >🤝 Talk to Sales</button>
        </div>

        {/* Hamburger Button (mobile only, shown via CSS) */}
        <button
          className="hamburger-btn"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
          style={{
            display: 'none', /* shown via media query */
            flexDirection: 'column', gap: 5, background: 'none', border: 'none',
            cursor: 'pointer', padding: 8, zIndex: 110,
          }}
        >
          <span style={{ width: 22, height: 2, background: '#F0F6FF', borderRadius: 2, transition: 'all 0.3s',
            transform: menuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none' }} />
          <span style={{ width: 22, height: 2, background: '#F0F6FF', borderRadius: 2, transition: 'all 0.3s',
            opacity: menuOpen ? 0 : 1 }} />
          <span style={{ width: 22, height: 2, background: '#F0F6FF', borderRadius: 2, transition: 'all 0.3s',
            transform: menuOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none' }} />
        </button>
      </nav>

      {/* Mobile Menu Overlay */}
      <div className="mobile-menu-overlay" style={{
        position: 'fixed', top: 68, left: 0, right: 0, bottom: 0, zIndex: 99,
        background: 'rgba(11,17,33,0.97)', backdropFilter: 'blur(20px)',
        display: menuOpen ? 'flex' : 'none',
        flexDirection: 'column', padding: '24px', overflowY: 'auto',
      }}>
        {links.map(l => (
          <button key={l.label} onClick={() => go(l.path)} style={{
            display: 'block', width: '100%', padding: '16px 0', background: 'none', border: 'none',
            borderBottom: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer',
            fontSize: 16, fontWeight: 600, color: '#94A3B8', textAlign: 'left',
            fontFamily: 'Inter, sans-serif',
          }}>{l.label}</button>
        ))}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 24 }}>
          <button onClick={() => go('/sandbox')} className="w-btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>Try Sandbox</button>
          <button onClick={() => { setShowSales(true); setMenuOpen(false); }} className="w-btn-primary" style={{ width: '100%', justifyContent: 'center' }}>🤝 Talk to Sales</button>
        </div>
      </div>

      {showSales && <TalkToSalesModal onClose={() => setShowSales(false)} />}
    </>
  );
}

export function WebFooter() {
  const navigate = useNavigate();
  const [showSales, setShowSales] = useState(false);

  return (
    <>
      <footer className="web-footer" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '64px 48px 40px', background: 'rgba(255,255,255,0.01)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="footer-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: 40, marginBottom: 56 }}>
            {/* Brand */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <img src="/payguard-logo.png" alt="PayGuard" style={{
                  width: 28, height: 28, borderRadius: 8, objectFit: 'cover',
                  boxShadow: '0 0 12px rgba(59,130,246,0.2)',
                }} />
                <span style={{ fontSize: 14, fontWeight: 700, color: '#F0F6FF', letterSpacing: '-0.02em', fontFamily: 'Outfit, sans-serif' }}>PayGuard</span>
              </div>
              <p style={{ fontSize: 14, color: '#94A3B8', lineHeight: 1.8, maxWidth: 280, fontWeight: 500, marginBottom: 16 }}>Real-Time Fraud Prevention Infrastructure for Modern Payments.</p>
              <button onClick={() => setShowSales(true)} style={{
                background: 'linear-gradient(135deg,#3B82F6,#2563EB)', border: 'none',
                borderRadius: 8, padding: '9px 18px', fontSize: 12, fontWeight: 700,
                color: '#fff', cursor: 'pointer', boxShadow: '0 2px 12px rgba(59,130,246,0.3)',
                transition: 'opacity 0.2s', display: 'flex', alignItems: 'center', gap: 6,
              }}
                onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'}
                onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.opacity = '1'}
              >🤝 Talk to Sales</button>
              <div style={{ marginTop: 16, fontSize: 11, color: '#334155', fontFamily: 'JetBrains Mono' }}>SDK v1.0.0 · © 2026 Swifter</div>
            </div>
            {/* Columns */}
            {[
              { title: 'Product', links: [['Products', '/products'], ['Architecture', '/architecture'], ['Interactive Demo', '/demo'], ['Dashboard', '/dashboard']] },
              { title: 'Developers', links: [['SDK Docs', '/developers'], ['API Reference', '/developers#api'], ['Sandbox', '/sandbox'], ['GitHub', '#']] },
              { title: 'Company', links: [['About Us', '/about'], ['Contact', '/contact'], ['Careers', '#'], ['Press', '/about#press']] },
              { title: 'Legal', links: [['Privacy', '#'], ['Security', '#'], ['Terms', '#'], ['SOC 2 Type II', '#']] },
            ].map(col => (
              <div key={col.title}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: '#00D4AA', textTransform: 'uppercase', marginBottom: 16 }}>{col.title}</div>
                {col.links.map(([label, path]) => (
                  <div key={label} onClick={() => { if (path !== '#') navigate(path); }} style={{ fontSize: 13, color: '#475569', marginBottom: 10, cursor: 'pointer', transition: 'color 0.15s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.color = '#94A3B8'}
                    onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.color = '#475569'}>{label}</div>
                ))}
              </div>
            ))}
          </div>
          {/* Contact bar */}
          <div className="footer-contact-bar" style={{ display: 'flex', justifyContent: 'center', gap: 32, marginBottom: 24, padding: '16px 0', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', flexWrap: 'wrap' }}>
            <a href="mailto:partnerships@payguard.africa" style={{ fontSize: 13, color: '#64748B', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.color = '#0EA5E9'}
              onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.color = '#64748B'}
            >📧 partnerships@payguard.africa</a>
            <a href="mailto:sales@payguard.africa" style={{ fontSize: 13, color: '#64748B', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.color = '#0EA5E9'}
              onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.color = '#64748B'}
            >📧 sales@payguard.africa</a>
            <span onClick={() => navigate('/contact')} style={{ fontSize: 13, color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget as HTMLSpanElement).style.color = '#0EA5E9'}
              onMouseLeave={e => (e.currentTarget as HTMLSpanElement).style.color = '#64748B'}
            >📝 Contact Form</span>
          </div>
          <div className="footer-bottom" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: '#334155', flexWrap: 'wrap', gap: 12 }}>
            <span>{'\u00A9'} 2026 Swifter Technologies. All rights reserved.</span>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <span>🔒 SOC 2 Type II</span>
              <span>🌍 Africa-first infrastructure</span>
              <span>⚡ 99.99% SLA</span>
            </div>
          </div>
        </div>
      </footer>
      {showSales && <TalkToSalesModal onClose={() => setShowSales(false)} />}
    </>
  );
}
