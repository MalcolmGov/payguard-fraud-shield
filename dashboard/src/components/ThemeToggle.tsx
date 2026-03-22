import { useState, useEffect } from 'react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('payguard-theme');
    return saved === 'light' ? 'light' : 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('payguard-theme', theme);
  }, [theme]);

  return (
    <button
      className="theme-toggle-inline"
      onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      aria-label="Toggle theme"
      style={{
        width: 36,
        height: 36,
        borderRadius: 8,
        border: '1px solid rgba(255,255,255,0.1)',
        background: 'var(--w-card)',
        color: '#94A3B8',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 16,
        transition: 'all 0.3s ease',
        flexShrink: 0,
      }}
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}
