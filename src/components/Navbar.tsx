'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Calculator, Star, Users, Eye, EyeOff, Menu, X, DollarSign } from 'lucide-react';
import { 
  Currency, 
  getStoredCurrency, 
  setStoredCurrency, 
  getStoredScoutMode, 
  setStoredScoutMode 
} from '@/lib/settings';

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currency, setCurrency] = useState<Currency>('EUR');
  const [scoutMode, setScoutMode] = useState<boolean>(false);

  useEffect(() => {
    setCurrency(getStoredCurrency());
    setScoutMode(getStoredScoutMode());

    const handleSettingsChange = () => {
      setCurrency(getStoredCurrency());
      setScoutMode(getStoredScoutMode());
    };

    window.addEventListener('fc24_settings_change', handleSettingsChange);
    return () => window.removeEventListener('fc24_settings_change', handleSettingsChange);
  }, []);

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value as Currency;
    setCurrency(val);
    setStoredCurrency(val);
  };

  const handleScoutModeToggle = () => {
    const next = !scoutMode;
    setScoutMode(next);
    setStoredScoutMode(next);
  };

  const navItems = [
    { href: '/scouting', label: 'Scouting', icon: Search },
    { href: '/wage-calculator', label: 'Wage Calc', icon: Calculator },
    { href: '/shortlist', label: 'Shortlist', icon: Star },
    { href: '/squad', label: 'My Squad', icon: Users },
  ];

  const isActive = (href: string) =>
    pathname.startsWith(href) || (href === '/scouting' && pathname === '/');

  return (
    <>
      <header className="navbar">
        <Link href="/" className="nav-brand" onClick={() => setMobileOpen(false)}>
          <span className="nav-brand-fc">FC</span>
          <span className="nav-brand-24">24</span>
          <span className="nav-brand-scout">SCOUT</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="nav-links">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link ${isActive(item.href) ? 'active' : ''}`}
              >
                <Icon size={15} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Controls: Currency & Scout Mode */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginLeft: 'auto', marginRight: '0.5rem' }}>
          {/* Currency Toggle */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <select
              value={currency}
              onChange={handleCurrencyChange}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                color: 'var(--accent-gold)',
                fontSize: '0.78rem',
                fontWeight: '700',
                padding: '0.35rem 0.6rem',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="USD">USD ($)</option>
            </select>
          </div>

          {/* Scout Report Mode Toggle */}
          <button
            onClick={handleScoutModeToggle}
            title={scoutMode ? 'Disable Scout Report Mode' : 'Enable Scout Report Mode (Mask exact ratings as ranges)'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              background: scoutMode ? 'rgba(0, 229, 255, 0.15)' : 'var(--bg-card)',
              border: `1px solid ${scoutMode ? 'var(--accent-blue)' : 'var(--border-color)'}`,
              borderRadius: '6px',
              color: scoutMode ? 'var(--accent-blue)' : 'var(--text-muted)',
              fontSize: '0.75rem',
              fontWeight: '700',
              padding: '0.35rem 0.65rem',
              cursor: 'pointer'
            }}
          >
            {scoutMode ? <EyeOff size={14} /> : <Eye size={14} />}
            <span style={{ fontSize: '0.78rem' }}>
              {scoutMode ? 'Scout Mode ON' : 'Scout Mode'}
            </span>
          </button>
        </div>

        {/* Mobile Toggle */}
        <button
          className="nav-mobile-toggle"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Mobile Drawer */}
      <nav className={`mobile-nav-drawer ${mobileOpen ? 'open' : ''}`}>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link ${isActive(item.href) ? 'active' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
