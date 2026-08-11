'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Star, DollarSign, SlidersHorizontal, Shield, Wallet
} from 'lucide-react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import { calculateEstimatedWage, getLeagueTier, getGeneralPosition } from '@/lib/wageCalculator';

// Register ChartJS
ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

interface PlayerDetailClientProps {
  player: any;
  estimatedWage: number;
}

export default function PlayerDetailClient({ player, estimatedWage }: PlayerDetailClientProps) {
  const router = useRouter();
  const [isStarred, setIsStarred] = useState(false);
  
  // Interactive simulator states
  const [simOvr, setSimOvr] = useState<number>(player.overall);
  const [simPot, setSimPot] = useState<number>(player.potential);
  const [simAge, setSimAge] = useState<number>(player.age);
  const [simIr, setSimIr] = useState<number>(player.international_reputation || 1);
  const [simWage, setSimWage] = useState<number>(estimatedWage);

  // Check shortlist on mount
  useEffect(() => {
    const shortlist = localStorage.getItem('fc24_shortlist');
    if (shortlist) {
      try {
        const ids = JSON.parse(shortlist) as number[];
        setIsStarred(ids.includes(player.player_id));
      } catch (e) {
        console.error(e);
      }
    }
  }, [player.player_id]);

  // Recalculate simulation wage when simulator inputs change
  useEffect(() => {
    const updated = calculateEstimatedWage({
      overall: simOvr,
      potential: simPot,
      age: simAge,
      internationalReputation: simIr,
      leagueName: player.league_name || 'Other',
      position: player.player_positions || 'CM'
    });
    setSimWage(updated);
  }, [simOvr, simPot, simAge, simIr, player.league_name, player.player_positions]);

  const toggleShortlist = () => {
    const saved = localStorage.getItem('fc24_shortlist');
    let ids: number[] = [];
    if (saved) {
      try {
        ids = JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    
    let updated: number[];
    if (ids.includes(player.player_id)) {
      updated = ids.filter(id => id !== player.player_id);
      setIsStarred(false);
    } else {
      updated = [...ids, player.player_id];
      setIsStarred(true);
    }
    localStorage.setItem('fc24_shortlist', JSON.stringify(updated));
  };

  // Helper to format currency
  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return '€0';
    if (value >= 1000000) {
      return `€${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `€${(value / 1000).toFixed(0)}K`;
    }
    return `€${value}`;
  };

  // Radar Chart Data Configuration
  const radarData = {
    labels: ['Pace', 'Shooting', 'Passing', 'Dribbling', 'Defending', 'Physicality'],
    datasets: [
      {
        label: player.short_name,
        data: [
          player.pace || 0,
          player.shooting || 0,
          player.passing || 0,
          player.dribbling || 0,
          player.defending || 0,
          player.physic || 0
        ],
        backgroundColor: 'rgba(0, 229, 255, 0.25)',
        borderColor: '#00E5FF',
        borderWidth: 2,
        pointBackgroundColor: '#00E5FF',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#00E5FF'
      }
    ]
  };

  const radarOptions = {
    scales: {
      r: {
        angleLines: { color: 'rgba(30, 45, 66, 0.6)' },
        grid: { color: 'rgba(30, 45, 66, 0.6)' },
        pointLabels: {
          color: '#8BA3BC',
          font: { family: 'var(--font-sans)', weight: '600', size: 11 }
        },
        ticks: { display: false },
        suggestedMin: 30,
        suggestedMax: 100
      }
    },
    plugins: {
      legend: { display: false }
    }
  };

  // Stat color code helper
  const getStatColor = (val: number | null) => {
    if (!val) return 'var(--text-muted)';
    if (val >= 80) return '#00E676'; // Bright green
    if (val >= 70) return '#00E5FF'; // Cyan
    if (val >= 50) return '#FFFFFF'; // White
    return 'var(--accent-red)';
  };

  // Rating badge helpers
  const getRatingBadgeClass = (val: number) => {
    if (val >= 85) return 'badge-gold';
    if (val >= 75) return 'badge-silver';
    return 'badge-bronze';
  };

  const getPositionBadgeClass = (positions: string) => {
    const primary = positions.split(',')[0].trim().toUpperCase();
    if (primary === 'GK') return 'pos-gk';
    if (['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(primary)) return 'pos-def';
    if (['CM', 'CDM', 'CAM', 'LM', 'RM'].includes(primary)) return 'pos-mid';
    return 'pos-fwd';
  };

  const leagueTier = getLeagueTier(player.league_name || 'Other');
  const positionCat = getGeneralPosition(player.player_positions || 'CM');

  const statsGroups = {
    attacking: {
      title: 'ATTACKING',
      stats: [
        { label: 'Crossing', val: player.attacking_crossing },
        { label: 'Finishing', val: player.attacking_finishing },
        { label: 'Heading Accuracy', val: player.attacking_heading_accuracy },
        { label: 'Short Passing', val: player.attacking_short_passing },
        { label: 'Volleys', val: player.attacking_volleys }
      ]
    },
    skill: {
      title: 'SKILL',
      stats: [
        { label: 'Dribbling', val: player.skill_dribbling },
        { label: 'Curve', val: player.skill_curve },
        { label: 'FK Accuracy', val: player.skill_fk_accuracy },
        { label: 'Long Passing', val: player.skill_long_passing },
        { label: 'Ball Control', val: player.skill_ball_control }
      ]
    },
    movement: {
      title: 'MOVEMENT',
      stats: [
        { label: 'Acceleration', val: player.movement_acceleration },
        { label: 'Sprint Speed', val: player.movement_sprint_speed },
        { label: 'Agility', val: player.movement_agility },
        { label: 'Reactions', val: player.movement_reactions },
        { label: 'Balance', val: player.movement_balance }
      ]
    },
    power: {
      title: 'POWER',
      stats: [
        { label: 'Shot Power', val: player.power_shot_power },
        { label: 'Jumping', val: player.power_jumping },
        { label: 'Stamina', val: player.power_stamina },
        { label: 'Strength', val: player.power_strength },
        { label: 'Long Shots', val: player.power_long_shots }
      ]
    },
    mentality: {
      title: 'MENTALITY',
      stats: [
        { label: 'Aggression', val: player.mentality_aggression },
        { label: 'Interceptions', val: player.mentality_interceptions },
        { label: 'Positioning', val: player.mentality_positioning },
        { label: 'Vision', val: player.mentality_vision },
        { label: 'Penalties', val: player.mentality_penalties },
        { label: 'Composure', val: player.mentality_composure }
      ]
    },
    defending: {
      title: 'DEFENDING',
      stats: [
        { label: 'Defending Awareness', val: player.defending_marking_awareness },
        { label: 'Standing Tackle', val: player.defending_standing_tackle },
        { label: 'Sliding Tackle', val: player.defending_sliding_tackle }
      ]
    }
  };

  const isGK = player.player_positions.split(',')[0].trim().toUpperCase() === 'GK';
  const gkGroup = {
    title: 'GOALKEEPING',
    stats: [
      { label: 'GK Diving', val: player.goalkeeping_diving },
      { label: 'GK Handling', val: player.goalkeeping_handling },
      { label: 'GK Kicking', val: player.goalkeeping_kicking },
      { label: 'GK Positioning', val: player.goalkeeping_positioning },
      { label: 'GK Reflexes', val: player.goalkeeping_reflexes }
    ]
  };

  return (
    <div className="content-area">
      {/* Back button */}
      <div style={{ marginBottom: '1.25rem' }}>
        <button 
          className="btn btn-secondary" 
          onClick={() => router.back()}
          style={{ textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px' }}
        >
          <ArrowLeft size={14} />
          <span>BACK TO SCOUTING</span>
        </button>
      </div>

      <div className="player-detail-container">
        
        {/* Left Column: Identity & Radar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* FUT Identity Card */}
          <div className="player-card-fut">
            {/* Star shortlist button */}
            <button 
              onClick={toggleShortlist}
              style={{
                position: 'absolute',
                top: '1.25rem',
                right: '1.25rem',
                background: 'none',
                border: 'none',
                color: isStarred ? 'var(--accent-gold)' : 'var(--text-muted)',
                cursor: 'pointer',
                zIndex: 10
              }}
            >
              {isStarred ? <Star size={22} fill="var(--accent-gold)" /> : <Star size={22} />}
            </button>

            {/* Badges OVR & POT */}
            <div className="fut-ovr-container">
              <div className="fut-ovr-item">
                <span className={`badge-rating ${getRatingBadgeClass(player.overall)}`} style={{ width: '52px', height: '52px', fontSize: '1.4rem' }}>
                  {player.overall}
                </span>
                <span className="fut-ovr-label">OVR</span>
              </div>
              <div className="fut-ovr-item">
                <span className={`badge-rating ${getRatingBadgeClass(player.potential)}`} style={{ width: '52px', height: '52px', fontSize: '1.4rem' }}>
                  {player.potential}
                </span>
                <span className="fut-ovr-label">POT</span>
              </div>
            </div>

            <h2 className="player-name-display">{player.short_name}</h2>
            <div className="player-full-name">{player.long_name}</div>
            
            {/* Club Info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '4px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                <Shield size={18} style={{ color: 'var(--accent-blue)', margin: 'auto' }} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: '800', color: 'white', fontSize: '0.95rem' }}>{player.club_name || 'Free Agent'}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{player.league_name || 'No League'}</div>
              </div>
            </div>

            {/* Position Badges */}
            <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center', marginBottom: '1.25rem' }}>
              {player.player_positions.split(',').map((pos: string) => (
                <span key={pos} className={`badge-pos ${getPositionBadgeClass(pos)}`} style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}>
                  {pos.trim()}
                </span>
              ))}
            </div>

            {/* Market Value Highlight Banner */}
            <div style={{ 
              width: '100%', 
              background: 'rgba(0, 230, 118, 0.08)', 
              border: '1px solid rgba(0, 230, 118, 0.25)', 
              borderRadius: '8px', 
              padding: '0.65rem 0.9rem', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '1rem' 
            }}>
              <span style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Market Value
              </span>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: '900', color: 'var(--accent-green)' }}>
                {formatCurrency(player.value_eur)}
              </span>
            </div>

            {/* Profile Meta Info */}
            <div style={{ width: '100%', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Age: <strong style={{ color: 'white' }}>{player.age}</strong></span>
                <span style={{ color: 'var(--text-muted)' }}>Foot: <strong style={{ color: 'white' }}>{player.preferred_foot}</strong></span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Height: <strong style={{ color: 'white' }}>{player.height_cm} cm</strong></span>
                <span style={{ color: 'var(--text-muted)' }}>Weight: <strong style={{ color: 'white' }}>{player.weight_kg} kg</strong></span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Skills: <strong style={{ color: 'white' }}>{player.skill_moves} ★</strong></span>
                <span style={{ color: 'var(--text-muted)' }}>Weak Foot: <strong style={{ color: 'white' }}>{player.weak_foot} ★</strong></span>
              </div>
            </div>
          </div>

          {/* Attributes Radar */}
          <div className="stats-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h3 className="stats-card-title w-full">ATTRIBUTES RADAR</h3>
            <div style={{ width: '100%', maxWidth: '280px', height: '280px' }}>
              <Radar data={radarData} options={radarOptions as any} />
            </div>
          </div>
        </div>

        {/* Right Column: Wage Estimation & Detailed Stats */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Header Title */}
          <div>
            <h1 className="detail-header-title">
              <Wallet size={24} style={{ color: 'var(--accent-blue)' }} />
              <span>CAREER MODE WAGE ESTIMATION</span>
            </h1>

            {/* Wage Metrics Comparison Grid */}
            <div className="wage-metrics-grid">
              <div className="wage-metric-card">
                <span className="wage-metric-label">MARKET VALUE</span>
                <div className="wage-metric-val text-green">
                  {formatCurrency(player.value_eur)}
                </div>
                <span className="wage-metric-sub">Transfer market valuation</span>
              </div>

              <div className="wage-metric-card">
                <span className="wage-metric-label">ACTUAL IN-GAME WAGE</span>
                <div className="wage-metric-val text-blue">
                  {formatCurrency(player.wage_eur)}
                </div>
                <span className="wage-metric-sub">From database record</span>
              </div>

              <div className="wage-metric-card">
                <span className="wage-metric-label">ESTIMATED MODEL WAGE</span>
                <div className="wage-metric-val text-gold">
                  {formatCurrency(estimatedWage)}
                </div>
                <span className="wage-metric-sub">Calculated coefficients</span>
              </div>
            </div>

            {/* Wage Calculator Simulator Box */}
            <div className="sim-box-panel">
              <div className="sim-box-title">
                <SlidersHorizontal size={16} />
                <span>WAGE CALCULATOR SIMULATOR</span>
              </div>

              <div className="sim-slider-group">
                {/* Overall */}
                <div className="skill-slider-row">
                  <div className="skill-slider-header">
                    <span className="skill-slider-label">Overall Rating (OVR)</span>
                    <span className="skill-slider-value">{simOvr}</span>
                  </div>
                  <input 
                    type="range" min="40" max="99" value={simOvr} 
                    onChange={(e) => setSimOvr(parseInt(e.target.value, 10))}
                  />
                </div>

                {/* Potential */}
                <div className="skill-slider-row">
                  <div className="skill-slider-header">
                    <span className="skill-slider-label">Potential Rating (POT)</span>
                    <span className="skill-slider-value">{simPot}</span>
                  </div>
                  <input 
                    type="range" min="40" max="99" value={simPot} 
                    onChange={(e) => setSimPot(parseInt(e.target.value, 10))}
                  />
                </div>

                {/* Age */}
                <div className="skill-slider-row">
                  <div className="skill-slider-header">
                    <span className="skill-slider-label">Age</span>
                    <span className="skill-slider-value">{simAge}</span>
                  </div>
                  <input 
                    type="range" min="15" max="45" value={simAge} 
                    onChange={(e) => setSimAge(parseInt(e.target.value, 10))}
                  />
                </div>

                {/* Reputation */}
                <div className="skill-slider-row">
                  <div className="skill-slider-header">
                    <span className="skill-slider-label">International Reputation</span>
                    <span className="skill-slider-value">{simIr} Stars</span>
                  </div>
                  <input 
                    type="range" min="1" max="5" value={simIr} 
                    onChange={(e) => setSimIr(parseInt(e.target.value, 10))}
                  />
                </div>
              </div>

              {/* Simulated Wage Banner Result */}
              <div className="sim-result-banner">
                <span className="sim-result-label">Simulated Wage Demand:</span>
                <span className="sim-result-amount">{formatCurrency(simWage)}</span>
              </div>
            </div>

            {/* Monospace Math Breakdown */}
            <div className="math-breakdown-code">
              <div>Base Regression Constant: 1.821668</div>
              <div>Overall Rating Multiplier (x{simOvr}): +{(0.139067 * simOvr).toFixed(4)}</div>
              <div>Potential Rating Dampener (x{simPot}): -{(0.041871 * simPot).toFixed(4)}</div>
              <div>Age Rookie Dampener (x{simAge}): -{(0.025183 * simAge).toFixed(4)}</div>
              <div>Reputation Premium Multiplier (x{simIr}): +{(0.302240 * simIr).toFixed(4)}</div>
              <div>League Mod ({player.league_name || 'Other'} - Tier {leagueTier}): +{leagueTier === 1 ? '1.7540' : leagueTier === 2 ? '1.2878' : leagueTier === 3 ? '0.8507' : '0.0000'}</div>
              <div>Position Mod ({positionCat}): {positionCat === 'GK' ? '-0.3646' : positionCat === 'DEF' ? '-0.1778' : positionCat === 'MID' ? '-0.1487' : '0.0000'}</div>
            </div>

            <p className="calc-disclaimer-text">
              Disclaimer: EA does not publish official career mode wage equations. This calculation is derived using log-linear regression analysis trained on the complete player dataset. Actual wages in Career Mode may vary based on contract length and negotiation bonuses.
            </p>
          </div>

          {/* Detailed Attributes Cards Grid */}
          <div className="detailed-stats-grid">
            {/* Goalkeeping if GK */}
            {isGK && (
              <div className="stat-category-card">
                <div className="stat-category-title">{gkGroup.title}</div>
                {gkGroup.stats.map((stat, idx) => (
                  <div key={idx} className="stat-item-row">
                    <span className="stat-item-name">{stat.label}</span>
                    <span className="stat-item-num" style={{ color: getStatColor(stat.val) }}>{stat.val || 0}</span>
                  </div>
                ))}
              </div>
            )}

            {/* All 6 Stat Groups */}
            {Object.entries(statsGroups).map(([key, group]) => (
              <div key={key} className="stat-category-card">
                <div className="stat-category-title">{group.title}</div>
                {group.stats.map((stat, idx) => (
                  <div key={idx} className="stat-item-row">
                    <span className="stat-item-name">{stat.label}</span>
                    <span className="stat-item-num" style={{ color: getStatColor(stat.val) }}>{stat.val || 0}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>

        </div>

      </div>
    </div>
  );
}
