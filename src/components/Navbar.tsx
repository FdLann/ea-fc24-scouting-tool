'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Calculator, Star, Menu, X } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { href: '/scouting', label: 'Scouting', icon: Search },
    { href: '/wage-calculator', label: 'Wage Calc', icon: Calculator },
    { href: '/shortlist', label: 'Shortlist', icon: Star },
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
