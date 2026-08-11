'use client';

import { useState, useEffect } from 'react';
import { 
  Calculator, DollarSign, Info, Sliders, RefreshCw, 
  TrendingUp, Award, Shield, User, Globe
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

  // Conversions for typical currencies
  const formatCurrency = (val: number, symbol: string, factor: number) => {
    const converted = val * factor;
    if (converted >= 1000) {
      return `${symbol}${Math.round(converted / 250) * 250}`; // round to nearest 250 for realistic feel
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
      <div className="page-header">
        <h1 className="page-title">Career Mode Wage Calculator</h1>
        <button className="btn btn-secondary" onClick={handleReset}>
          <RefreshCw size={16} />
          <span>Reset</span>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
        {/* Responsive Grid layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr' }} className="player-detail-container">
          
          {/* Inputs Panel */}
          <div className="stats-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h3 className="stats-card-title">
              <Sliders size={18} />
              Calculator Parameters
            </h3>

            {/* Overall Rating Slider */}
            <div className="filter-group">
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <label className="filter-label">Overall Rating (OVR)</label>
                <strong>{overall}</strong>
              </div>
              <input
                type="range"
                min="40"
                max="99"
                value={overall}
                onChange={(e) => {
                  const ovr = parseInt(e.target.value, 10);
                  setOverall(ovr);
                  // Ensure potential is at least equal to overall
                  if (potential < ovr) {
                    setPotential(ovr);
                  }
                }}
                style={{ width: '100%' }}
              />
            </div>

            {/* Potential Rating Slider */}
            <div className="filter-group">
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <label className="filter-label">Potential Rating (POT)</label>
                <strong>{potential}</strong>
              </div>
              <input
                type="range"
                min={overall}
                max="99"
                value={potential}
                onChange={(e) => setPotential(parseInt(e.target.value, 10))}
                style={{ width: '100%' }}
              />
            </div>

            {/* Age Slider */}
            <div className="filter-group">
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <label className="filter-label">Player Age</label>
                <strong>{age} years old</strong>
              </div>
              <input
                type="range"
                min="15"
                max="45"
                value={age}
                onChange={(e) => setAge(parseInt(e.target.value, 10))}
                style={{ width: '100%' }}
              />
            </div>

            {/* International Reputation */}
            <div className="filter-group">
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <label className="filter-label">International Reputation</label>
                <strong>{rep} Star{rep > 1 ? 's' : ''}</strong>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={rep}
                onChange={(e) => setRep(parseInt(e.target.value, 10))}
                style={{ width: '100%' }}
              />
            </div>

            {/* League Select */}
            <div className="filter-group">
              <label className="filter-label">League Prestige</label>
              <select
                className="filter-input"
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
              <label className="filter-label">Player Position</label>
              <select
                className="filter-input"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
              >
                <option value="ST">ST / CF / wingers (Forward - Base)</option>
                <option value="CM">CM / CDM / CAM / RM / LM (Midfielder)</option>
                <option value="CB">CB / LB / RB / LWB / RWB (Defender)</option>
                <option value="GK">GK (Goalkeeper)</option>
              </select>
            </div>
          </div>

          {/* Outputs Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Currency outputs box */}
            <div className="calculator-box">
              <h3 className="stats-card-title">
                <DollarSign size={18} />
                Estimated Weekly Wage
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
                
                {/* EUR */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-sidebar)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Euros (EUR)</span>
                    <h2 style={{ fontSize: '2rem', fontWeight: '900', color: 'var(--accent-gold)' }}>
                      {formatCurrency(wage, '€', 1.0)}
                    </h2>
                  </div>
                  <Globe size={24} style={{ color: 'var(--text-muted)' }} />
                </div>

                {/* GBP */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-sidebar)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', opacity: 0.9 }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Pounds Sterling (GBP)</span>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: 'white' }}>
                      {formatCurrency(wage, '£', 0.85)}
                    </h2>
                  </div>
                  <Globe size={24} style={{ color: 'var(--text-muted)' }} />
                </div>

                {/* USD */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-sidebar)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', opacity: 0.9 }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>US Dollars (USD)</span>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: 'white' }}>
                      {formatCurrency(wage, '$', 1.10)}
                    </h2>
                  </div>
                  <Globe size={24} style={{ color: 'var(--text-muted)' }} />
                </div>

              </div>
            </div>

            {/* Calculations Panel */}
            <div className="stats-card">
              <h3 className="stats-card-title">
                <Info size={16} />
                Calculated Coefficients Breakdown
              </h3>
              <div className="calc-breakdown" style={{ marginTop: '0', paddingTop: '0', borderTop: 'none' }}>
                <div className="calc-breakdown-row">
                  <span>Base Intercept:</span>
                  <span className="calc-breakdown-val">1.821668</span>
                </div>
                <div className="calc-breakdown-row">
                  <span>OVR Multiplier (0.139067 x {overall}):</span>
                  <span className="calc-breakdown-val">+{(0.139067 * overall).toFixed(4)}</span>
                </div>
                <div className="calc-breakdown-row">
                  <span>POT Multiplier (-0.041871 x {potential}):</span>
                  <span className="calc-breakdown-val" style={{ color: 'var(--accent-red)' }}>-{(0.041871 * potential).toFixed(4)}</span>
                </div>
                <div className="calc-breakdown-row">
                  <span>AGE Multiplier (-0.025183 x {age}):</span>
                  <span className="calc-breakdown-val" style={{ color: 'var(--accent-red)' }}>-{(0.025183 * age).toFixed(4)}</span>
                </div>
                <div className="calc-breakdown-row">
                  <span>Reputation (0.302240 x {rep}):</span>
                  <span className="calc-breakdown-val">+{(0.302240 * rep).toFixed(4)}</span>
                </div>
                <div className="calc-breakdown-row">
                  <span>League modifier ({league}):</span>
                  <span className="calc-breakdown-val">+{getLeagueMod(league).toFixed(4)}</span>
                </div>
                <div className="calc-breakdown-row">
                  <span>Position modifier ({getPositionLabel(position)}):</span>
                  <span className="calc-breakdown-val">{getPositionMod(position).toFixed(4)}</span>
                </div>
              </div>
              
              <div className="calc-disclaimer" style={{ marginTop: '1.5rem' }}>
                Disclaimer: The weekly wages calculated represent estimated demands. Career Mode wages have randomness based on current squad sizes, negotiation contract structures (such as sign-on bonuses), and seasonal team budgets.
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
