import { useEffect } from 'react';

export default function ThemeToggle() {
  // Light mode temporarily disabled — force dark mode
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('payguard-theme', 'dark');
  }, []);

  // Hide the toggle button until light mode is fully polished
  return null;
}
