'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Calculator, Star } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { href: '/scouting', label: 'Scouting', icon: Search },
    { href: '/wage-calculator', label: 'Wage Calculator', icon: Calculator },
    { href: '/shortlist', label: 'Shortlist', icon: Star },
  ];

  return (
    <header className="navbar">
      <Link href="/" className="nav-brand">
        <span className="nav-brand-accent">FC24</span>SCOUT
      </Link>
      
      <nav className="nav-links">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href) || (item.href === '/scouting' && pathname === '/');
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={16} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
