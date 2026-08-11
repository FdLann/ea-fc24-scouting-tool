'use client';

import { useState, useEffect } from 'react';
import { 
  SlidersHorizontal, Wallet, Info, RotateCcw
} from 'lucide-react';
import { calculateEstimatedWage } from '@/lib/wageCalculator';

export default function WageCalculatorPage() {
  const [overall, setOverall] = useState<number>(75);
  const [potential, setPotential] = useState<number>(80);
  const [age, setAge] = useState<number>(23);
  const [rep, setRep] = useState<number>(1);
  const [league, setLeague] = useState<string>('Premier League');
  const [position, setPosition] = useState<string>('CM');
  const [wage, setWage] = useState<number>(0);

  // Recalculate estimated wage
  useEffect(() => {
    const calculated = calculateEstimatedWage({
      overall,
      potential,
      age,
      internationalReputation: rep,
      leagueName: league,
      position
    });
    setWage(calculated);
  }, [overall, potential, age, rep, league, position]);

  const handleReset = () => {
    setOverall(75);
    setPotential(80);
    setAge(23);
    setRep(1);
    setLeague('Premier League');
    setPosition('CM');
  };

  // Conversions for typical currencies with realistic rounding
  const formatCurrency = (val: number, symbol: string, factor: number) => {
    const converted = val * factor;
    if (converted >= 1000) {
      const rounded = Math.round(converted / 250) * 250;
      return `${symbol}${rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
    }
    return `${symbol}${Math.round(converted)}`;
  };

  // Modifier breakdown helpers
  const getLeagueMod = (l: string) => {
    if (l === 'Premier League') return 1.753978;
    if (['La Liga', 'Serie A', 'Ligue 1', 'Bundesliga'].includes(l)) return 1.287846;
    if ([
      'Championship', 'Pro League', 'Super Lig', 'Jupiler Pro League', 
      'Premiership', 'Liga Profesional', '2. Bundesliga', 'Liga Portugal', 
      'Superliga', 'Eredivisie', 'La Liga 2'
    ].includes(l)) return 0.850702;
    return 0.0;
  };

  const getPositionMod = (pos: string) => {
    if (pos === 'GK') return -0.364570;
    if (['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(pos)) return -0.177837;
    if (['CM', 'CDM', 'CAM', 'LM', 'RM'].includes(pos)) return -0.148725;
    return 0.0; // FWD
  };

  const getPositionLabel = (pos: string) => {
    if (pos === 'GK') return 'Goalkeeper';
    if (['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(pos)) return 'Defender';
    if (['CM', 'CDM', 'CAM', 'LM', 'RM'].includes(pos)) return 'Midfielder';
    return 'Forward';
  };

  return (
    <div className="content-area">
      
      {/* Title & Reset Button Bar */}
      <div className="calc-header-bar">
        <h1 className="page-title" style={{ margin: 0 }}>
          CAREER MODE WAGE CALCULATOR
        </h1>
        <button 
          className="btn btn-secondary btn-sm" 
          onClick={handleReset}
          style={{ gap: '0.4rem', padding: '0.45rem 0.85rem' }}
        >
          <RotateCcw size={14} />
          <span>RESET</span>
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        
        {/* PARAMETERS CARD */}
        <div className="stats-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
            <SlidersHorizontal size={16} style={{ color: 'var(--accent-blue)' }} />
            <span style={{ fontSize: '0.85rem', fontWeight: '800', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--accent-blue)' }}>
              CALCULATOR PARAMETERS
            </span>
          </div>

          <div className="calc-params-grid">
            {/* Left Column: Sliders */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              
              {/* Overall */}
              <div className="skill-slider-row">
                <div className="skill-slider-header">
                  <span className="skill-slider-label">OVERALL RATING (OVR)</span>
                  <span className="skill-slider-value">{overall}</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="99"
                  value={overall}
                  onChange={(e) => {
                    const ovr = parseInt(e.target.value, 10);
                    setOverall(ovr);
                    if (potential < ovr) setPotential(ovr);
                  }}
                />
              </div>

              {/* Potential */}
              <div className="skill-slider-row">
                <div className="skill-slider-header">
                  <span className="skill-slider-label">POTENTIAL RATING (POT)</span>
                  <span className="skill-slider-value">{potential}</span>
                </div>
                <input
                  type="range"
                  min={overall}
                  max="99"
                  value={potential}
                  onChange={(e) => setPotential(parseInt(e.target.value, 10))}
                />
              </div>

              {/* Age */}
              <div className="skill-slider-row">
                <div className="skill-slider-header">
                  <span className="skill-slider-label">PLAYER AGE</span>
                  <span className="skill-slider-value">{age} years old</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="45"
                  value={age}
                  onChange={(e) => setAge(parseInt(e.target.value, 10))}
                />
              </div>

              {/* International Reputation */}
              <div className="skill-slider-row">
                <div className="skill-slider-header">
                  <span className="skill-slider-label">INTERNATIONAL REPUTATION</span>
                  <span className="skill-slider-value">{rep} Star{rep > 1 ? 's' : ''}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={rep}
                  onChange={(e) => setRep(parseInt(e.target.value, 10))}
                />
              </div>

            </div>

            {/* Right Column: Dropdowns */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* League Select */}
              <div className="filter-group">
                <label className="filter-label">LEAGUE PRESTIGE</label>
                <select
                  className="filter-input"
                  style={{ background: 'var(--bg-input)', padding: '0.7rem 0.85rem' }}
                  value={league}
                  onChange={(e) => setLeague(e.target.value)}
                >
                  <option value="Premier League">Premier League (England - Tier 1)</option>
                  <option value="La Liga">La Liga (Spain - Tier 2)</option>
                  <option value="Serie A">Serie A (Italy - Tier 2)</option>
                  <option value="Ligue 1">Ligue 1 (France - Tier 2)</option>
                  <option value="Bundesliga">Bundesliga (Germany - Tier 2)</option>
                  <option value="Championship">EFL Championship (England - Tier 3)</option>
                  <option value="Eredivisie">Eredivisie (Netherlands - Tier 3)</option>
                  <option value="Liga Portugal">Liga Portugal (Portugal - Tier 3)</option>
                  <option value="Super Lig">Süper Lig (Turkey - Tier 3)</option>
                  <option value="Liga Profesional">Liga Profesional (Argentina - Tier 3)</option>
                  <option value="Other">Other Leagues / Rest of World (Tier 4)</option>
                </select>
              </div>

              {/* Position Select */}
              <div className="filter-group">
                <label className="filter-label">PLAYER POSITION</label>
                <select
                  className="filter-input"
                  style={{ background: 'var(--bg-input)', padding: '0.7rem 0.85rem' }}
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                >
                  <option value="ST">ST / CF / LW / RW (Forward - Base)</option>
                  <option value="CM">CM / CDM / CAM / RM / LM (Midfielder)</option>
                  <option value="CB">CB / LB / RB / LWB / RWB (Defender)</option>
                  <option value="GK">GK (Goalkeeper)</option>
                </select>
              </div>

            </div>
          </div>
        </div>

        {/* ESTIMATED WEEKLY WAGE SECTION */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Wallet size={18} style={{ color: 'var(--text-secondary)' }} />
            <span style={{ fontSize: '0.8rem', fontWeight: '800', letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
              ESTIMATED WEEKLY WAGE
            </span>
          </div>

          <div className="currency-cards-grid">
            {/* EUR */}
            <div className="currency-card">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <span className="wage-metric-label">EUROS (EUR)</span>
                <span className="wage-metric-val text-gold">
                  {formatCurrency(wage, '€', 1.0)}
                </span>
              </div>
              <span className="currency-symbol-watermark">€</span>
            </div>

            {/* GBP */}
            <div className="currency-card">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <span className="wage-metric-label">POUNDS STERLING (GBP)</span>
                <span className="wage-metric-val" style={{ color: '#FFFFFF' }}>
                  {formatCurrency(wage, '£', 0.85)}
                </span>
              </div>
              <span className="currency-symbol-watermark">£</span>
            </div>

            {/* USD */}
            <div className="currency-card">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <span className="wage-metric-label">US DOLLARS (USD)</span>
                <span className="wage-metric-val" style={{ color: '#FFFFFF' }}>
                  {formatCurrency(wage, '$', 1.10)}
                </span>
              </div>
              <span className="currency-symbol-watermark">$</span>
            </div>
          </div>
        </div>

        {/* CALCULATED COEFFICIENTS BREAKDOWN */}
        <div className="stats-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
            <Info size={16} style={{ color: 'var(--text-secondary)' }} />
            <span style={{ fontSize: '0.85rem', fontWeight: '800', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
              CALCULATED COEFFICIENTS BREAKDOWN
            </span>
          </div>

          <div className="math-breakdown-code" style={{ marginTop: 0 }}>
            <div>Base Intercept: 1.821668</div>
            <div>OVR Multiplier (0.139067 x {overall}): <span style={{ color: 'var(--accent-blue)' }}>+{(0.139067 * overall).toFixed(4)}</span></div>
            <div>POT Multiplier (-0.041871 x {potential}): <span style={{ color: 'var(--accent-red)' }}>-{(0.041871 * potential).toFixed(4)}</span></div>
            <div>AGE Multiplier (-0.025183 x {age}): <span style={{ color: 'var(--accent-red)' }}>-{(0.025183 * age).toFixed(4)}</span></div>
            <div>Reputation (0.302240 x {rep}): <span style={{ color: 'var(--accent-blue)' }}>+{(0.302240 * rep).toFixed(4)}</span></div>
            <div>League modifier ({league}): <span style={{ color: 'var(--accent-blue)' }}>+{getLeagueMod(league).toFixed(4)}</span></div>
            <div>Position modifier ({getPositionLabel(position)}): <span style={{ color: getPositionMod(position) < 0 ? 'var(--accent-red)' : 'var(--text-secondary)' }}>{getPositionMod(position).toFixed(4)}</span></div>
          </div>

          <p className="calc-disclaimer-text">
            Disclaimer: The weekly wages calculated represent estimated demands. Career Mode wages have randomness based on current squad sizes, negotiation contract structures (such as sign-on bonuses), and seasonal team budgets.
          </p>
        </div>

      </div>
    </div>
  );
}
