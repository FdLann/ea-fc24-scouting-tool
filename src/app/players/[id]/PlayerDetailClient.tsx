'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Star, Heart, TrendingUp, DollarSign, Award, Shield, 
  MapPin, HelpCircle, User, Info, Sliders, ChevronDown
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
        backgroundColor: 'rgba(0, 229, 255, 0.2)',
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
        angleLines: { color: 'rgba(36, 47, 61, 0.5)' },
        grid: { color: 'rgba(36, 47, 61, 0.5)' },
        pointLabels: {
          color: '#90A4AE',
          font: { family: 'var(--font-sans)', weight: 'bold', size: 12 }
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

  // Helper for progress bar color
  const getProgressColor = (val: number) => {
    if (val >= 80) return 'var(--accent-green)';
    if (val >= 70) return 'var(--accent-gold)';
    if (val >= 50) return '#FF9100'; // Orange
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

  // League modifiers text helper
  const leagueTier = getLeagueTier(player.league_name || 'Other');
  const positionCat = getGeneralPosition(player.player_positions || 'CM');

  const statsGroups = {
    attacking: {
      title: 'Attacking',
      stats: [
        { label: 'Crossing', val: player.attacking_crossing },
        { label: 'Finishing', val: player.attacking_finishing },
        { label: 'Heading Accuracy', val: player.attacking_heading_accuracy },
        { label: 'Short Passing', val: player.attacking_short_passing },
        { label: 'Volleys', val: player.attacking_volleys }
      ]
    },
    skill: {
      title: 'Skill',
      stats: [
        { label: 'Dribbling', val: player.skill_dribbling },
        { label: 'Curve', val: player.skill_curve },
        { label: 'FK Accuracy', val: player.skill_fk_accuracy },
        { label: 'Long Passing', val: player.skill_long_passing },
        { label: 'Ball Control', val: player.skill_ball_control }
      ]
    },
    movement: {
      title: 'Movement',
      stats: [
        { label: 'Acceleration', val: player.movement_acceleration },
        { label: 'Sprint Speed', val: player.movement_sprint_speed },
        { label: 'Agility', val: player.movement_agility },
        { label: 'Reactions', val: player.movement_reactions },
        { label: 'Balance', val: player.movement_balance }
      ]
    },
    power: {
      title: 'Power',
      stats: [
        { label: 'Shot Power', val: player.power_shot_power },
        { label: 'Jumping', val: player.power_jumping },
        { label: 'Stamina', val: player.power_stamina },
        { label: 'Strength', val: player.power_strength },
        { label: 'Long Shots', val: player.power_long_shots }
      ]
    },
    mentality: {
      title: 'Mentality',
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
      title: 'Defending',
      stats: [
        { label: 'Defending Awareness', val: player.defending_marking_awareness },
        { label: 'Standing Tackle', val: player.defending_standing_tackle },
        { label: 'Sliding Tackle', val: player.defending_sliding_tackle }
      ]
    }
  };

  // If GK, add Goalkeeping stats card
  const isGK = player.player_positions.split(',')[0].trim().toUpperCase() === 'GK';
  const gkGroup = {
    title: 'Goalkeeping',
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
      <div>
        <button className="btn btn-secondary" onClick={() => router.back()}>
          <ArrowLeft size={16} />
          <span>Back to Scouting</span>
        </button>
      </div>

      <div className="player-detail-container">
        
        {/* Left Panel: Identity & Radar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* FUT Identity Card */}
          <div className="player-card-fut">
            <button 
              onClick={toggleShortlist}
              style={{
                position: 'absolute',
                top: '1.5rem',
                right: '1.5rem',
                background: 'none',
                border: 'none',
                color: isStarred ? 'var(--accent-gold)' : 'var(--text-muted)',
                cursor: 'pointer',
                zIndex: 10
              }}
            >
              {isStarred ? <Star size={24} fill="var(--accent-gold)" /> : <Star size={24} />}
            </button>

            <div className="fut-ovr-container">
              <div className="fut-ovr-item">
                <span className={`badge-rating ${getRatingBadgeClass(player.overall)}`} style={{ width: '56px', height: '56px', fontSize: '1.5rem' }}>
                  {player.overall}
                </span>
                <span className="fut-ovr-label">OVR</span>
              </div>
              <div className="fut-ovr-item" style={{ opacity: 0.8 }}>
                <span className={`badge-rating ${getRatingBadgeClass(player.potential)}`} style={{ width: '56px', height: '56px', fontSize: '1.5rem' }}>
                  {player.potential}
                </span>
                <span className="fut-ovr-label">POT</span>
              </div>
            </div>

            <h2 className="player-name-large">{player.short_name}</h2>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: '0.25rem 0 1rem 0' }}>{player.long_name}</div>
            
            <div className="player-club-info">
              <span style={{ fontWeight: '700', color: 'white' }}>{player.club_name || 'Free Agent'}</span>
              <span style={{ fontSize: '0.85rem' }}>{player.league_name || 'No League'}</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Nationality: {player.nationality_name}</span>
            </div>

            <div className="player-badges-horizontal">
              {player.player_positions.split(',').map((pos: string) => (
                <span key={pos} className={`badge-pos ${getPositionBadgeClass(pos)}`} style={{ fontSize: '0.85rem', padding: '0.35rem 0.75rem' }}>
                  {pos.trim()}
                </span>
              ))}
            </div>

            {/* Profile Meta stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', width: '100%', marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <div>Age: <strong style={{ color: 'white' }}>{player.age}</strong></div>
              <div>Foot: <strong style={{ color: 'white' }}>{player.preferred_foot}</strong></div>
              <div>Height: <strong style={{ color: 'white' }}>{player.height_cm} cm</strong></div>
              <div>Weight: <strong style={{ color: 'white' }}>{player.weight_kg} kg</strong></div>
              <div>Skills: <strong style={{ color: 'white' }}>{player.skill_moves} ★</strong></div>
              <div>Weak Foot: <strong style={{ color: 'white' }}>{player.weak_foot} ★</strong></div>
            </div>
          </div>

          {/* Radar Chart Card */}
          <div className="stats-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '320px' }}>
            <h3 className="stats-card-title w-full">Attributes Radar</h3>
            <div style={{ width: '260px', height: '260px' }}>
              <Radar data={radarData} options={radarOptions as any} />
            </div>
          </div>
        </div>

        {/* Right Panel: Detailed Stats & Wage Calculator */}
        <div className="detail-right-panel">
          
          {/* Wage Calculator Panel */}
          <div className="calculator-box">
            <h3 className="stats-card-title">
              <DollarSign size={18} />
              Career Mode Wage Estimation
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
              {/* Actual vs Estimated */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="calculator-results" style={{ borderRight: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 'bold', textTransform: 'uppercase' }}>
                    Actual In-Game Wage
                  </span>
                  <div className="calc-wage-val text-green" style={{ textShadow: 'none' }}>
                    {formatCurrency(player.wage_eur)}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>From database record</span>
                </div>
                
                <div className="calculator-results">
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 'bold', textTransform: 'uppercase' }}>
                    Estimated Model Wage
                  </span>
                  <div className="calc-wage-val">
                    {formatCurrency(estimatedWage)}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Calculated using reverse-engineered coefficients</span>
                </div>
              </div>

              {/* Slider Simulator */}
              <div className="stats-card" style={{ backgroundColor: 'var(--bg-sidebar)', borderStyle: 'dashed' }}>
                <h4 style={{ fontSize: '0.9rem', textTransform: 'uppercase', marginBottom: '1rem', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Sliders size={14} />
                  Wage Calculator Simulator
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  
                  {/* Overall */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Overall Rating (OVR)</span>
                      <strong>{simOvr}</strong>
                    </div>
                    <input 
                      type="range" min="40" max="99" value={simOvr} 
                      onChange={(e) => setSimOvr(parseInt(e.target.value, 10))}
                    />
                  </div>

                  {/* Potential */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Potential Rating (POT)</span>
                      <strong>{simPot}</strong>
                    </div>
                    <input 
                      type="range" min="40" max="99" value={simPot} 
                      onChange={(e) => setSimPot(parseInt(e.target.value, 10))}
                    />
                  </div>

                  {/* Age */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Age</span>
                      <strong>{simAge}</strong>
                    </div>
                    <input 
                      type="range" min="15" max="45" value={simAge} 
                      onChange={(e) => setSimAge(parseInt(e.target.value, 10))}
                    />
                  </div>

                  {/* Reputation */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>International Reputation</span>
                      <strong>{simIr} Star{simIr > 1 ? 's' : ''}</strong>
                    </div>
                    <input 
                      type="range" min="1" max="5" value={simIr} 
                      onChange={(e) => setSimIr(parseInt(e.target.value, 10))}
                    />
                  </div>

                  {/* Sim output result */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-card)', padding: '1rem', borderRadius: '6px', marginTop: '0.5rem', border: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Simulated Wage Demand:</span>
                    <span style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--accent-gold)' }}>
                      {formatCurrency(simWage)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Math breakdown */}
              <div className="calc-breakdown">
                <div className="calc-breakdown-row">
                  <span>Base Regression Constant:</span>
                  <span className="calc-breakdown-val">1.821668</span>
                </div>
                <div className="calc-breakdown-row">
                  <span>Overall Rating Multiplier (x{simOvr}):</span>
                  <span className="calc-breakdown-val">+{(0.139067 * simOvr).toFixed(4)}</span>
                </div>
                <div className="calc-breakdown-row">
                  <span>Potential Rating Dampener (x{simPot}):</span>
                  <span className="calc-breakdown-val" style={{ color: 'var(--accent-red)' }}>-{(0.041871 * simPot).toFixed(4)}</span>
                </div>
                <div className="calc-breakdown-row">
                  <span>Age Rookie Dampener (x{simAge}):</span>
                  <span className="calc-breakdown-val" style={{ color: 'var(--accent-red)' }}>-{(0.025183 * simAge).toFixed(4)}</span>
                </div>
                <div className="calc-breakdown-row">
                  <span>Reputation Premium Multiplier (x{simIr}):</span>
                  <span className="calc-breakdown-val">+{(0.302240 * simIr).toFixed(4)}</span>
                </div>
                <div className="calc-breakdown-row">
                  <span>League Mod ({player.league_name || 'Other'} - Tier {leagueTier}):</span>
                  <span className="calc-breakdown-val">
                    +{leagueTier === 1 ? '1.7540' : leagueTier === 2 ? '1.2878' : leagueTier === 3 ? '0.8507' : '0.0000'}
                  </span>
                </div>
                <div className="calc-breakdown-row">
                  <span>Position Mod ({positionCat}):</span>
                  <span className="calc-breakdown-val">
                    {positionCat === 'GK' ? '-0.3646' : positionCat === 'DEF' ? '-0.1778' : positionCat === 'MID' ? '-0.1487' : '0.0000'}
                  </span>
                </div>
              </div>

              <div className="calc-disclaimer">
                Disclaimer: EA does not publish official career mode wage equations. This calculation is derived using log-linear regression analysis trained on the complete player dataset. Actual wages in Career Mode may vary based on contract length and negotiation bonuses.
              </div>
            </div>
          </div>

          {/* Club Info & Budget */}
          {player.transfer_budget_eur && (
            <div className="stats-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: '4px solid var(--accent-blue)' }}>
              <h3 style={{ fontSize: '1rem', textTransform: 'uppercase', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '800' }}>
                <Shield size={16} />
                Club Economics ({player.club_name})
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.9rem' }}>
                <div>
                  <div style={{ color: 'var(--text-secondary)' }}>Transfer Budget:</div>
                  <strong style={{ fontSize: '1.2rem', color: 'var(--accent-green)' }}>{formatCurrency(player.transfer_budget_eur)}</strong>
                </div>
                <div>
                  <div style={{ color: 'var(--text-secondary)' }}>Club Worth:</div>
                  <strong style={{ fontSize: '1.2rem', color: 'white' }}>{formatCurrency(player.club_worth_eur)}</strong>
                </div>
                <div>
                  <div style={{ color: 'var(--text-secondary)' }}>Squad Rating:</div>
                  <strong style={{ fontSize: '1.1rem', color: 'white' }}>{player.team_overall} OVR</strong>
                </div>
                <div>
                  <div style={{ color: 'var(--text-secondary)' }}>Market Release Clause:</div>
                  <strong style={{ fontSize: '1.1rem', color: 'var(--accent-gold)' }}>{formatCurrency(player.release_clause_eur)}</strong>
                </div>
              </div>
            </div>
          )}

          {/* Player Detailed Stats Cards */}
          <div className="stats-card-group">
            
            {/* GK Goalkeeping Stats card */}
            {isGK && (
              <div className="stats-card">
                <h3 className="stats-card-title">{gkGroup.title}</h3>
                {gkGroup.stats.map((stat, idx) => (
                  <div key={idx} className="stat-row">
                    <span className="stat-label">{stat.label}</span>
                    <div className="stat-value-container">
                      <div className="stat-progress-bar">
                        <div 
                          className="stat-progress-fill" 
                          style={{ width: `${stat.val || 0}%`, backgroundColor: getProgressColor(stat.val || 0) }}
                        ></div>
                      </div>
                      <span className="stat-value" style={{ color: getProgressColor(stat.val || 0) }}>{stat.val || 0}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* General Stats groups */}
            {Object.entries(statsGroups).map(([key, group]) => {
              // Hide defending if the player is a keeper (GK) to make space, or keep it, up to you. Let's keep it.
              return (
                <div key={key} className="stats-card">
                  <h3 className="stats-card-title">{group.title}</h3>
                  {group.stats.map((stat, idx) => (
                    <div key={idx} className="stat-row">
                      <span className="stat-label">{stat.label}</span>
                      <div className="stat-value-container">
                        <div className="stat-progress-bar">
                          <div 
                            className="stat-progress-fill" 
                            style={{ width: `${stat.val || 0}%`, backgroundColor: getProgressColor(stat.val || 0) }}
                          ></div>
                        </div>
                        <span className="stat-value" style={{ color: getProgressColor(stat.val || 0) }}>{stat.val || 0}</span>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>

        </div>

      </div>
    </div>
  );
}
