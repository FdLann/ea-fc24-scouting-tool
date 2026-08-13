'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Player } from './page';
import { 
  Search, SlidersHorizontal, ArrowUpDown, ChevronLeft, ChevronRight, 
  Star, StarOff, FilterX, HelpCircle, Eye, Menu, X, Sparkles, Zap, DollarSign, CheckSquare, Square, Maximize2 
} from 'lucide-react';
import { formatCurrencyWithSettings, getStoredScoutMode } from '@/lib/settings';
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

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

interface ScoutingClientProps {
  initialPlayers: Player[];
  metadata: {
    clubs: string[];
    leagues: string[];
    nationalities: string[];
    leagueClubs?: Record<string, string[]>;
  };
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  searchParams: { [key: string]: any };
}

export default function ScoutingClient({ 
  initialPlayers, 
  metadata, 
  pagination, 
  searchParams 
}: ScoutingClientProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Local state for sidebar visibility on mobile
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  // Local state for Accordions in filters
  const [isSkillsOpen, setIsSkillsOpen] = useState(false);
  
  // Local state for shortlist player IDs
  const [shortlist, setShortlist] = useState<number[]>([]);

  // Compare Players state (max 3 players)
  const [compareList, setCompareList] = useState<Player[]>([]);
  const [compareModalOpen, setCompareModalOpen] = useState(false);

  // Jump to Page input state
  const [jumpPageInput, setJumpPageInput] = useState('');

  // Scout Mode state
  const [isMounted, setIsMounted] = useState(false);
  const [scoutMode, setScoutMode] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setScoutMode(getStoredScoutMode());
    const handleSettings = () => setScoutMode(getStoredScoutMode());
    window.addEventListener('fc24_settings_change', handleSettings);
    return () => window.removeEventListener('fc24_settings_change', handleSettings);
  }, []);

  // Load shortlist on mount
  useEffect(() => {
    const saved = localStorage.getItem('fc24_shortlist');
    if (saved) {
      try {
        setShortlist(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Toggle Shortlist function
  const toggleShortlist = (playerId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    let updated: number[];
    if (shortlist.includes(playerId)) {
      updated = shortlist.filter(id => id !== playerId);
    } else {
      updated = [...shortlist, playerId];
    }
    setShortlist(updated);
    localStorage.setItem('fc24_shortlist', JSON.stringify(updated));
  };

  // Toggle Compare Player
  const toggleComparePlayer = (player: Player, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (compareList.some(p => p.player_id === player.player_id)) {
      setCompareList(compareList.filter(p => p.player_id !== player.player_id));
    } else {
      if (compareList.length >= 3) {
        alert('You can compare up to 3 players at once.');
        return;
      }
      setCompareList([...compareList, player]);
    }
  };

  // Render rating with Scout Mode support
  const renderRatingDisplay = (rating: number) => {
    if (!isMounted || !scoutMode) return rating.toString();
    const low = Math.max(40, rating - 2);
    const high = Math.min(99, rating + 2);
    return `${low}-${high}`;
  };

  // Helper to get rating badge class
  const getRatingBadgeClass = (rating: number) => {
    if (rating >= 85) return 'badge-gold';
    if (rating >= 75) return 'badge-silver';
    return 'badge-bronze';
  };

  // Helper to get position badge class
  const getPositionBadgeClass = (positions: string) => {
    const primary = positions.split(',')[0].trim().toUpperCase();
    if (primary === 'GK') return 'pos-gk';
    if (['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(primary)) return 'pos-def';
    if (['CM', 'CDM', 'CAM', 'LM', 'RM'].includes(primary)) return 'pos-mid';
    return 'pos-fwd';
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

  // State values initialized from searchParams (sync UI with URL)
  const [searchVal, setSearchVal] = useState(searchParams.search || '');
  const [positionVal, setPositionVal] = useState(searchParams.position || '');
  const [clubVal, setClubVal] = useState(searchParams.club || '');
  const [leagueVal, setLeagueVal] = useState(searchParams.league || '');
  const [nationalityVal, setNationalityVal] = useState(searchParams.nationality || '');
  const [minOvr, setMinOvr] = useState(searchParams.min_overall || '0');
  const [maxOvr, setMaxOvr] = useState(searchParams.max_overall || '99');
  const [minPot, setMinPot] = useState(searchParams.min_potential || '0');
  const [maxPot, setMaxPot] = useState(searchParams.max_potential || '99');
  const [minAgeVal, setMinAgeVal] = useState(searchParams.min_age || '15');
  const [maxAgeVal, setMaxAgeVal] = useState(searchParams.max_age || '50');
  const [minValue, setMinValue] = useState(searchParams.min_value || searchParams.minValue || '0');
  const [maxValue, setMaxValue] = useState(searchParams.max_value || searchParams.maxValue || '300000000');
  const [minWage, setMinWage] = useState(searchParams.min_wage || searchParams.minWage || '0');
  const [maxWage, setMaxWage] = useState(searchParams.max_wage || searchParams.maxWage || '600000');

  // Skill Filters state
  const [minPace, setMinPace] = useState(searchParams.min_pace || '0');
  const [maxPace, setMaxPace] = useState(searchParams.max_pace || '99');
  const [minShooting, setMinShooting] = useState(searchParams.min_shooting || '0');
  const [maxShooting, setMaxShooting] = useState(searchParams.max_shooting || '99');
  const [minPassing, setMinPassing] = useState(searchParams.min_passing || '0');
  const [maxPassing, setMaxPassing] = useState(searchParams.max_passing || '99');
  const [minDribbling, setMinDribbling] = useState(searchParams.min_dribbling || '0');
  const [maxDribbling, setMaxDribbling] = useState(searchParams.max_dribbling || '99');
  const [minDefending, setMinDefending] = useState(searchParams.min_defending || '0');
  const [maxDefending, setMaxDefending] = useState(searchParams.max_defending || '99');
  const [minPhysic, setMinPhysic] = useState(searchParams.min_physic || '0');
  const [maxPhysic, setMaxPhysic] = useState(searchParams.max_physic || '99');

  // Filter available clubs dynamically based on selected league
  const availableClubs = useMemo(() => {
    if (leagueVal && metadata.leagueClubs && metadata.leagueClubs[leagueVal]) {
      return metadata.leagueClubs[leagueVal];
    }
    return metadata.clubs;
  }, [leagueVal, metadata]);

  // Trigger search updates (re-build query string and reload route)
  const applyFilters = (updates: { [key: string]: any }) => {
    const params = new URLSearchParams();
    
    // Core parameters to keep/set
    const current = {
      search: searchVal,
      position: positionVal,
      club: clubVal,
      league: leagueVal,
      nationality: nationalityVal,
      min_overall: minOvr,
      max_overall: maxOvr,
      min_potential: minPot,
      max_potential: maxPot,
      min_age: minAgeVal,
      max_age: maxAgeVal,
      min_value: minValue,
      max_value: maxValue,
      min_wage: minWage,
      max_wage: maxWage,
      min_pace: minPace,
      max_pace: maxPace,
      min_shooting: minShooting,
      max_shooting: maxShooting,
      min_passing: minPassing,
      max_passing: maxPassing,
      min_dribbling: minDribbling,
      max_dribbling: maxDribbling,
      min_defending: minDefending,
      max_defending: maxDefending,
      min_physic: minPhysic,
      max_physic: maxPhysic,
      sort_by: searchParams.sort_by || 'overall',
      sort_order: searchParams.sort_order || 'desc',
      page: '1',
      limit: searchParams.limit || '20',
      ...updates
    };

    Object.entries(current).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        params.set(k, v.toString());
      }
    });

    router.push(`${pathname}?${params.toString()}`);
  };

  const handleSort = (field: string) => {
    const currentSort = searchParams.sort_by || 'overall';
    const currentOrder = searchParams.sort_order || 'desc';
    
    let newOrder = 'desc';
    if (currentSort === field && currentOrder === 'desc') {
      newOrder = 'asc';
    }
    applyFilters({ sort_by: field, sort_order: newOrder, page: '1' });
  };

  const handlePageChange = (newPage: number) => {
    applyFilters({ page: newPage.toString() });
  };

  const clearFilters = () => {
    setSearchVal('');
    setPositionVal('');
    setClubVal('');
    setLeagueVal('');
    setNationalityVal('');
    setMinOvr('0');
    setMaxOvr('99');
    setMinPot('0');
    setMaxPot('99');
    setMinAgeVal('15');
    setMaxAgeVal('50');
    setMinValue('0');
    setMaxValue('300000000');
    setMinWage('0');
    setMaxWage('600000');
    setMinPace('0');
    setMaxPace('99');
    setMinShooting('0');
    setMaxShooting('99');
    setMinPassing('0');
    setMaxPassing('99');
    setMinDribbling('0');
    setMaxDribbling('99');
    setMinDefending('0');
    setMaxDefending('99');
    setMinPhysic('0');
    setMaxPhysic('99');
    router.push(pathname);
  };

  return (
    <>
      {/* Sidebar Backdrop Overlay */}
      {isSidebarOpen && (
        <div className="sidebar-backdrop" onClick={() => setIsSidebarOpen(false)} />
      )}
      
      {/* Sidebar Filters */}
      <aside className={`sidebar-filter ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-title">
          <h2>Search Filters</h2>
          <button 
            className="sidebar-toggle-btn"
            style={{ display: 'none' }}
            onClick={() => setIsSidebarOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        <div className="sidebar-content">
          {/* Text Search */}
          <div className="filter-group">
            <label className="filter-label">Player Name</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="filter-input"
                placeholder="e.g. Messi, Mbappe..."
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && applyFilters({ search: searchVal })}
              />
              <Search 
                size={16} 
                style={{ position: 'absolute', right: '12px', top: '12px', color: 'var(--text-muted)', cursor: 'pointer' }}
                onClick={() => applyFilters({ search: searchVal })}
              />
            </div>
          </div>

          {/* Position */}
          <div className="filter-group">
            <label className="filter-label">Position</label>
            <select
              className="filter-input"
              value={positionVal}
              onChange={(e) => {
                setPositionVal(e.target.value);
                applyFilters({ position: e.target.value });
              }}
            >
              <option value="">All Positions</option>
              <optgroup label="General">
                <option value="FWD">FWD (Forwards)</option>
                <option value="MID">MID (Midfielders)</option>
                <option value="DEF">DEF (Defenders)</option>
                <option value="GK">GK (Goalkeepers)</option>
              </optgroup>
              <optgroup label="Specific">
                <option value="ST">ST (Striker)</option>
                <option value="CF">CF (Center Forward)</option>
                <option value="LW">LW (Left Wing)</option>
                <option value="RW">RW (Right Wing)</option>
                <option value="CAM">CAM (Attacking Mid)</option>
                <option value="CM">CM (Central Mid)</option>
                <option value="CDM">CDM (Defensive Mid)</option>
                <option value="LM">LM (Left Mid)</option>
                <option value="RM">RM (Right Mid)</option>
                <option value="CB">CB (Center Back)</option>
                <option value="LB">LB (Left Back)</option>
                <option value="RB">RB (Right Back)</option>
                <option value="LWB">LWB (Left Wing Back)</option>
                <option value="RWB">RWB (Right Wing Back)</option>
              </optgroup>
            </select>
          </div>

          {/* Overall Rating Range */}
          <div className="filter-group">
            <div className="skill-slider-header">
              <label className="filter-label">Overall Rating</label>
              <span className="skill-slider-value">{minOvr} - {maxOvr}</span>
            </div>
            <div className="filter-range-group">
              <div className="skill-slider-row">
                <div className="skill-slider-header">
                  <span className="sub-label">Min</span>
                  <span className="sub-value">{minOvr}</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="99"
                  value={minOvr}
                  onChange={(e) => setMinOvr(e.target.value)}
                  onMouseUp={() => applyFilters({ min_overall: minOvr })}
                  onTouchEnd={() => applyFilters({ min_overall: minOvr })}
                />
              </div>
              <div className="skill-slider-row">
                <div className="skill-slider-header">
                  <span className="sub-label">Max</span>
                  <span className="sub-value">{maxOvr}</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="99"
                  value={maxOvr}
                  onChange={(e) => setMaxOvr(e.target.value)}
                  onMouseUp={() => applyFilters({ max_overall: maxOvr })}
                  onTouchEnd={() => applyFilters({ max_overall: maxOvr })}
                />
              </div>
            </div>
          </div>

          {/* Potential Range */}
          <div className="filter-group">
            <div className="skill-slider-header">
              <label className="filter-label">Potential</label>
              <span className="skill-slider-value">{minPot} - {maxPot}</span>
            </div>
            <div className="filter-range-group">
              <div className="skill-slider-row">
                <div className="skill-slider-header">
                  <span className="sub-label">Min</span>
                  <span className="sub-value">{minPot}</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="99"
                  value={minPot}
                  onChange={(e) => setMinPot(e.target.value)}
                  onMouseUp={() => applyFilters({ min_potential: minPot })}
                  onTouchEnd={() => applyFilters({ min_potential: minPot })}
                />
              </div>
              <div className="skill-slider-row">
                <div className="skill-slider-header">
                  <span className="sub-label">Max</span>
                  <span className="sub-value">{maxPot}</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="99"
                  value={maxPot}
                  onChange={(e) => setMaxPot(e.target.value)}
                  onMouseUp={() => applyFilters({ max_potential: maxPot })}
                  onTouchEnd={() => applyFilters({ max_potential: maxPot })}
                />
              </div>
            </div>
          </div>

          {/* Age Range */}
          <div className="filter-group">
            <div className="skill-slider-header">
              <label className="filter-label">Age Range</label>
              <span className="skill-slider-value">{minAgeVal} - {maxAgeVal} yrs</span>
            </div>
            <div className="filter-range-group">
              <div className="skill-slider-row">
                <div className="skill-slider-header">
                  <span className="sub-label">Min</span>
                  <span className="sub-value">{minAgeVal}</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="45"
                  value={minAgeVal}
                  onChange={(e) => setMinAgeVal(e.target.value)}
                  onMouseUp={() => applyFilters({ min_age: minAgeVal })}
                  onTouchEnd={() => applyFilters({ min_age: minAgeVal })}
                />
              </div>
              <div className="skill-slider-row">
                <div className="skill-slider-header">
                  <span className="sub-label">Max</span>
                  <span className="sub-value">{maxAgeVal}</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="45"
                  value={maxAgeVal}
                  onChange={(e) => setMaxAgeVal(e.target.value)}
                  onMouseUp={() => applyFilters({ max_age: maxAgeVal })}
                  onTouchEnd={() => applyFilters({ max_age: maxAgeVal })}
                />
              </div>
            </div>
          </div>

          {/* Market Value Range */}
          <div className="filter-group">
            <div className="skill-slider-header">
              <label className="filter-label">Market Value Range</label>
              <span className="skill-slider-value">
                {formatCurrency(parseInt(minValue || '0'))} - {formatCurrency(parseInt(maxValue || '300000000'))}
              </span>
            </div>
            <div className="filter-range-group">
              <div className="skill-slider-row">
                <div className="skill-slider-header">
                  <span className="sub-label">Min</span>
                  <span className="sub-value">{formatCurrency(parseInt(minValue || '0'))}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200000000"
                  step="5000000"
                  value={minValue}
                  onChange={(e) => setMinValue(e.target.value)}
                  onMouseUp={() => applyFilters({ min_value: minValue })}
                  onTouchEnd={() => applyFilters({ min_value: minValue })}
                />
              </div>
              <div className="skill-slider-row">
                <div className="skill-slider-header">
                  <span className="sub-label">Max</span>
                  <span className="sub-value">{formatCurrency(parseInt(maxValue || '300000000'))}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200000000"
                  step="5000000"
                  value={maxValue}
                  onChange={(e) => setMaxValue(e.target.value)}
                  onMouseUp={() => applyFilters({ max_value: maxValue })}
                  onTouchEnd={() => applyFilters({ max_value: maxValue })}
                />
              </div>
            </div>
          </div>

          {/* Weekly Wage Range */}
          <div className="filter-group">
            <div className="skill-slider-header">
              <label className="filter-label">Weekly Wage Range</label>
              <span className="skill-slider-value">
                {formatCurrency(parseInt(minWage || '0'))} - {formatCurrency(parseInt(maxWage || '600000'))}
              </span>
            </div>
            <div className="filter-range-group">
              <div className="skill-slider-row">
                <div className="skill-slider-header">
                  <span className="sub-label">Min</span>
                  <span className="sub-value">{formatCurrency(parseInt(minWage || '0'))}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="500000"
                  step="10000"
                  value={minWage}
                  onChange={(e) => setMinWage(e.target.value)}
                  onMouseUp={() => applyFilters({ min_wage: minWage })}
                  onTouchEnd={() => applyFilters({ min_wage: minWage })}
                />
              </div>
              <div className="skill-slider-row">
                <div className="skill-slider-header">
                  <span className="sub-label">Max</span>
                  <span className="sub-value">{formatCurrency(parseInt(maxWage || '600000'))}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="500000"
                  step="10000"
                  value={maxWage}
                  onChange={(e) => setMaxWage(e.target.value)}
                  onMouseUp={() => applyFilters({ max_wage: maxWage })}
                  onTouchEnd={() => applyFilters({ max_wage: maxWage })}
                />
              </div>
            </div>
          </div>

          {/* League */}
          <div className="filter-group">
            <label className="filter-label">League</label>
            <select
              className="filter-input"
              value={leagueVal}
              onChange={(e) => {
                const newLeague = e.target.value;
                setLeagueVal(newLeague);
                setClubVal('');
                applyFilters({ league: newLeague, club: '' });
              }}
            >
              <option value="">All Leagues</option>
              {metadata.leagues.map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>

          {/* Club (Filtered by selected League) */}
          <div className="filter-group">
            <label className="filter-label">
              Club {leagueVal ? `(${availableClubs.length})` : ''}
            </label>
            <select
              className="filter-input"
              value={clubVal}
              onChange={(e) => {
                setClubVal(e.target.value);
                applyFilters({ club: e.target.value });
              }}
            >
              <option value="">
                {leagueVal ? `All Clubs in ${leagueVal}` : 'All Clubs'}
              </option>
              {availableClubs.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Nationality */}
          <div className="filter-group">
            <label className="filter-label">Nationality</label>
            <select
              className="filter-input"
              value={nationalityVal}
              onChange={(e) => {
                setNationalityVal(e.target.value);
                applyFilters({ nationality: e.target.value });
              }}
            >
              <option value="">All Nationalities</option>
              {metadata.nationalities.map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          {/* Accordion: Skill Attributes */}
          <div className="filter-group">
            <button 
              type="button"
              className="filter-accordion-btn"
              onClick={() => setIsSkillsOpen(!isSkillsOpen)}
            >
              <span>Skill Attributes</span>
              <SlidersHorizontal size={14} />
            </button>
            {isSkillsOpen && (
              <div className="filter-accordion-content">
                {/* Pace */}
                <div className="skill-slider-row">
                  <div className="skill-slider-header">
                    <span className="skill-slider-label">Pace</span>
                    <span className="skill-slider-value">{minPace}+</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="99"
                    value={minPace}
                    onChange={(e) => setMinPace(e.target.value)}
                    onMouseUp={() => applyFilters({ min_pace: minPace })}
                    onTouchEnd={() => applyFilters({ min_pace: minPace })}
                  />
                </div>
                {/* Shooting */}
                <div className="skill-slider-row">
                  <div className="skill-slider-header">
                    <span className="skill-slider-label">Shooting</span>
                    <span className="skill-slider-value">{minShooting}+</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="99"
                    value={minShooting}
                    onChange={(e) => setMinShooting(e.target.value)}
                    onMouseUp={() => applyFilters({ min_shooting: minShooting })}
                    onTouchEnd={() => applyFilters({ min_shooting: minShooting })}
                  />
                </div>
                {/* Passing */}
                <div className="skill-slider-row">
                  <div className="skill-slider-header">
                    <span className="skill-slider-label">Passing</span>
                    <span className="skill-slider-value">{minPassing}+</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="99"
                    value={minPassing}
                    onChange={(e) => setMinPassing(e.target.value)}
                    onMouseUp={() => applyFilters({ min_passing: minPassing })}
                    onTouchEnd={() => applyFilters({ min_passing: minPassing })}
                  />
                </div>
                {/* Dribbling */}
                <div className="skill-slider-row">
                  <div className="skill-slider-header">
                    <span className="skill-slider-label">Dribbling</span>
                    <span className="skill-slider-value">{minDribbling}+</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="99"
                    value={minDribbling}
                    onChange={(e) => setMinDribbling(e.target.value)}
                    onMouseUp={() => applyFilters({ min_dribbling: minDribbling })}
                    onTouchEnd={() => applyFilters({ min_dribbling: minDribbling })}
                  />
                </div>
                {/* Defending */}
                <div className="skill-slider-row">
                  <div className="skill-slider-header">
                    <span className="skill-slider-label">Defending</span>
                    <span className="skill-slider-value">{minDefending}+</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="99"
                    value={minDefending}
                    onChange={(e) => setMinDefending(e.target.value)}
                    onMouseUp={() => applyFilters({ min_defending: minDefending })}
                    onTouchEnd={() => applyFilters({ min_defending: minDefending })}
                  />
                </div>
                {/* Physic */}
                <div className="skill-slider-row">
                  <div className="skill-slider-header">
                    <span className="skill-slider-label">Physicality</span>
                    <span className="skill-slider-value">{minPhysic}+</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="99"
                    value={minPhysic}
                    onChange={(e) => setMinPhysic(e.target.value)}
                    onMouseUp={() => applyFilters({ min_physic: minPhysic })}
                    onTouchEnd={() => applyFilters({ min_physic: minPhysic })}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Clear Filters Button */}
          <button 
            className="btn btn-secondary w-full"
            onClick={clearFilters}
            style={{ marginTop: '0.5rem' }}
          >
            <FilterX size={16} />
            <span>Clear Filters</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <section className="scouting-main">
        {/* Quick Presets Bar */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', flexShrink: 0 }}>
            <Sparkles size={14} style={{ color: 'var(--accent-gold)' }} /> PRESETS:
          </span>
          <button
            onClick={() => applyFilters({ preset: 'wonderkids', page: '1' })}
            style={{ background: searchParams.preset === 'wonderkids' ? 'var(--accent-gold)' : 'var(--bg-card)', color: searchParams.preset === 'wonderkids' ? '#000' : 'white', border: '1px solid var(--border-color)', borderRadius: '20px', padding: '0.3rem 0.75rem', fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer', flexShrink: 0 }}
          >
            🌟 Wonderkids (U21 • POT 80+)
          </button>
          <button
            onClick={() => applyFilters({ preset: 'bargain', page: '1' })}
            style={{ background: searchParams.preset === 'bargain' ? 'var(--accent-green)' : 'var(--bg-card)', color: searchParams.preset === 'bargain' ? '#000' : 'white', border: '1px solid var(--border-color)', borderRadius: '20px', padding: '0.3rem 0.75rem', fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer', flexShrink: 0 }}
          >
            💰 Bargain Buys (&lt;€10M • OVR 75+)
          </button>
          <button
            onClick={() => applyFilters({ preset: 'free_transfers', page: '1' })}
            style={{ background: searchParams.preset === 'free_transfers' ? 'var(--accent-blue)' : 'var(--bg-card)', color: searchParams.preset === 'free_transfers' ? '#000' : 'white', border: '1px solid var(--border-color)', borderRadius: '20px', padding: '0.3rem 0.75rem', fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer', flexShrink: 0 }}
          >
            🆓 Free Transfers
          </button>
          <button
            onClick={() => applyFilters({ preset: 'expiring', page: '1' })}
            style={{ background: searchParams.preset === 'expiring' ? 'var(--accent-red)' : 'var(--bg-card)', color: searchParams.preset === 'expiring' ? '#white' : 'white', border: '1px solid var(--border-color)', borderRadius: '20px', padding: '0.3rem 0.75rem', fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer', flexShrink: 0 }}
          >
            ⏳ Expiring Contract (≤2024)
          </button>
          {searchParams.preset && (
            <button
              onClick={() => applyFilters({ preset: '', page: '1' })}
              style={{ background: 'rgba(255,82,82,0.1)', color: 'var(--accent-red)', border: 'none', borderRadius: '20px', padding: '0.3rem 0.6rem', fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer', flexShrink: 0 }}
            >
              Clear Preset ✕
            </button>
          )}
        </div>

        <div className="scouting-toolbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button 
              className="sidebar-toggle-btn"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              <Menu size={18} />
              <span>Filters</span>
            </button>
            <h1 className="page-title">Scouting</h1>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            {/* Quick Sort Bar for Mobile & Desktop */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ArrowUpDown size={14} style={{ color: 'var(--accent-blue)' }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Sort:</span>
              <select
                className="filter-input"
                style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem', width: 'auto', background: 'var(--bg-sidebar)' }}
                value={searchParams.sort_by || 'overall'}
                onChange={(e) => applyFilters({ sort_by: e.target.value, page: '1' })}
              >
                <option value="overall">Overall (OVR)</option>
                <option value="potential">Potential (POT)</option>
                <option value="short_name">Player Name</option>
                <option value="age">Age</option>
                <option value="value_eur">Market Value</option>
                <option value="wage_eur">Weekly Wage</option>
              </select>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', gap: '0.2rem' }}
                onClick={() => {
                  const currentOrder = searchParams.sort_order || 'desc';
                  const newOrder = currentOrder === 'desc' ? 'asc' : 'desc';
                  applyFilters({ sort_order: newOrder, page: '1' });
                }}
              >
                <span>{(searchParams.sort_order || 'desc').toUpperCase()}</span>
                <span style={{ fontSize: '0.85rem' }}>{searchParams.sort_order === 'asc' ? '↑' : '↓'}</span>
              </button>
            </div>

            <div className="scouting-results-header">
              <span><strong>{pagination.total.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</strong> players</span>
            </div>
          </div>
        </div>

        {/* Players Table (Desktop Only) */}
        <div className="desktop-only-table">
          <div className="table-wrapper">
          <table className="scouting-table">
            <thead>
              <tr>
                <th style={{ width: '35px' }} className="text-center">Compare</th>
                <th style={{ width: '35px' }} className="text-center">Fav</th>
                <th className="sortable text-center" style={{ width: '60px' }} onClick={() => handleSort('overall')}>
                  OVR <ArrowUpDown size={12} />
                </th>
                <th className="sortable text-center" style={{ width: '60px' }} onClick={() => handleSort('potential')}>
                  POT <ArrowUpDown size={12} />
                </th>
                <th className="sortable" onClick={() => handleSort('short_name')}>
                  Name <ArrowUpDown size={12} />
                </th>
                <th style={{ width: '100px' }} className="text-center">Pos</th>
                <th className="sortable text-center" onClick={() => handleSort('age')} style={{ width: '50px' }}>
                  Age <ArrowUpDown size={12} />
                </th>
                <th>Club</th>
                <th className="sortable" onClick={() => handleSort('value_eur')} style={{ width: '95px' }}>
                  Value <ArrowUpDown size={12} />
                </th>
                <th className="sortable" onClick={() => handleSort('wage_eur')} style={{ width: '95px' }}>
                  Wage <ArrowUpDown size={12} />
                </th>
                <th style={{ width: '50px' }} className="text-center">View</th>
              </tr>
            </thead>
            <tbody>
              {initialPlayers.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center" style={{ padding: '3rem', color: 'var(--text-muted)' }}>
                    No players found matching your criteria.
                  </td>
                </tr>
              ) : (
                initialPlayers.map((player) => {
                  const isStarred = shortlist.includes(player.player_id);
                  const isCompared = compareList.some(p => p.player_id === player.player_id);

                  return (
                    <tr key={player.player_id} style={{ background: isCompared ? 'rgba(0, 229, 255, 0.08)' : undefined }}>
                      <td className="text-center">
                        <button
                          type="button"
                          onClick={(e) => toggleComparePlayer(player, e)}
                          title="Select to compare side-by-side"
                          style={{ background: 'none', border: 'none', color: isCompared ? 'var(--accent-blue)' : 'var(--text-muted)', cursor: 'pointer' }}
                        >
                          {isCompared ? <CheckSquare size={16} /> : <Square size={16} />}
                        </button>
                      </td>
                      <td className="text-center">
                        <button 
                          onClick={(e) => toggleShortlist(player.player_id, e)}
                          style={{ background: 'none', border: 'none', color: isStarred ? 'var(--accent-gold)' : 'var(--text-muted)', cursor: 'pointer' }}
                        >
                          {isStarred ? <Star size={16} fill="var(--accent-gold)" /> : <Star size={16} />}
                        </button>
                      </td>
                      <td className="text-center">
                        <span className={`badge-rating ${getRatingBadgeClass(player.overall)}`}>
                          {renderRatingDisplay(player.overall)}
                        </span>
                      </td>
                      <td className="text-center">
                        <span className={`badge-rating ${getRatingBadgeClass(player.potential)}`} style={{ opacity: 0.85 }}>
                          {renderRatingDisplay(player.potential)}
                        </span>
                      </td>
                      <td>
                        <Link href={`/players/${player.player_id}`} style={{ fontWeight: '700' }}>
                          {player.short_name}
                        </Link>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{player.long_name}</div>
                      </td>
                      <td className="text-center">
                        <div style={{ display: 'flex', gap: '2px', justifyContent: 'center' }}>
                          {player.player_positions.split(',').map(pos => (
                            <span key={pos} className={`badge-pos ${getPositionBadgeClass(pos)}`}>
                              {pos.trim()}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="text-center">{player.age}</td>
                      <td>
                        <div style={{ fontWeight: '500' }}>{player.club_name || 'Free Agent'}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {player.club_contract_valid_until_year ? `Contract ':${player.club_contract_valid_until_year}` : 'Free Agent'}
                        </div>
                      </td>
                      <td style={{ fontWeight: '700' }} className="text-green">
                        {formatCurrencyWithSettings(player.value_eur)}
                      </td>
                      <td style={{ fontWeight: '700' }} className="text-gold">
                        {formatCurrencyWithSettings(player.wage_eur)}
                      </td>
                      <td className="text-center">
                        <Link href={`/players/${player.player_id}`} className="btn btn-secondary" style={{ padding: '0.4rem', borderRadius: '4px' }}>
                          <Eye size={14} />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile View Player Cards (Mobile Only) */}
      <div className="mobile-only-cards">
        {initialPlayers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Search size={48} /></div>
            <p>No players found matching your criteria.</p>
          </div>
        ) : (
          initialPlayers.map((player) => {
            const isStarred = shortlist.includes(player.player_id);
            const ovrClass = player.overall >= 85 ? 'badge-box-ovr' : player.overall >= 75 ? 'badge-box-ovr-silver' : 'badge-box-ovr-bronze';
            const potClass = player.potential >= 88 ? 'badge-box-pot-high' : 'badge-box-pot';

            return (
              <div key={player.player_id} className="mobile-player-card" onClick={() => router.push(`/players/${player.player_id}`)}>
                {/* Top Row: Name + Subinfo & Dual Badges (OVR & POT) */}
                <div className="mobile-card-top-row">
                  <div className="mobile-card-identity">
                    <div className="mobile-card-name">{player.short_name}</div>
                    <div className="mobile-card-subinfo">
                      {(player.club_name || 'Free Agent').toUpperCase()} &bull; {(player.league_name || 'No League').toUpperCase()}
                    </div>
                  </div>
                  <div className="mobile-card-badges-pair">
                    <div className={`badge-box ${ovrClass}`} title={`Overall: ${player.overall}`}>
                      {player.overall}
                    </div>
                    <div className={`badge-box ${potClass}`} title={`Potential: ${player.potential}`}>
                      {player.potential}
                    </div>
                  </div>
                </div>
                
                {/* Bottom Row: Positions + Financials + Star */}
                <div className="mobile-card-bottom-row">
                  <div className="mobile-card-positions">
                    {player.player_positions.split(',').map((pos: string) => (
                      <span key={pos} className={`badge-pos ${getPositionBadgeClass(pos)}`}>
                        {pos.trim()}
                      </span>
                    ))}
                    <span className="mobile-card-age">&bull; {player.age} yrs</span>
                  </div>

                  <div className="mobile-card-financials">
                    <div className="mobile-financial-item">
                      <span className="mobile-val-text">{formatCurrency(player.value_eur)}</span>
                      <span className="mobile-wage-text">{formatCurrency(player.wage_eur)}/wk</span>
                    </div>
                    <button 
                      type="button"
                      className="mobile-star-btn"
                      onClick={(e) => toggleShortlist(player.player_id, e)}
                    >
                      {isStarred ? <Star size={16} fill="var(--accent-gold)" color="var(--accent-gold)" /> : <Star size={16} color="var(--text-muted)" />}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

        {/* Pagination & Nav Controls */}
        {pagination.totalPages > 1 && (
          <div className="pagination-container" style={{ flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong> ({pagination.total} players)
              </span>

              {/* Items per page selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <span>Show:</span>
                <select
                  value={searchParams.limit || '20'}
                  onChange={(e) => applyFilters({ limit: e.target.value, page: '1' })}
                  style={{ background: 'var(--bg-sidebar)', border: '1px solid var(--border-color)', borderRadius: '4px', color: 'white', fontSize: '0.8rem', padding: '0.2rem 0.4rem' }}
                >
                  <option value="20">20 / page</option>
                  <option value="50">50 / page</option>
                  <option value="100">100 / page</option>
                </select>
              </div>

              {/* Jump to page */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <input
                  type="number"
                  placeholder="Jump..."
                  value={jumpPageInput}
                  onChange={(e) => setJumpPageInput(e.target.value)}
                  style={{ width: '65px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '0.2rem 0.4rem', color: 'white', fontSize: '0.8rem' }}
                />
                <button
                  onClick={() => {
                    const p = parseInt(jumpPageInput, 10);
                    if (!isNaN(p) && p >= 1 && p <= pagination.totalPages) {
                      handlePageChange(p);
                      setJumpPageInput('');
                    }
                  }}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                >
                  Go
                </button>
              </div>
            </div>

            <div className="pagination-buttons">
              <button 
                className="pagination-btn"
                disabled={pagination.page <= 1}
                onClick={() => handlePageChange(pagination.page - 1)}
              >
                <ChevronLeft size={14} /> Prev
              </button>
              
              {/* Page numbers with unique keys */}
              {(() => {
                const total = pagination.totalPages;
                const current = pagination.page;
                let pages: number[] = [];

                if (total <= 5) {
                  pages = Array.from({ length: total }, (_, i) => i + 1);
                } else if (current <= 3) {
                  pages = [1, 2, 3, 4, 5];
                } else if (current >= total - 2) {
                  pages = [total - 4, total - 3, total - 2, total - 1, total];
                } else {
                  pages = [current - 2, current - 1, current, current + 1, current + 2];
                }

                return pages.map((pageNum) => (
                  <button
                    key={pageNum}
                    className={`pagination-btn ${current === pageNum ? 'active' : ''}`}
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum}
                  </button>
                ));
              })()}

              <button 
                className="pagination-btn"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => handlePageChange(pagination.page + 1)}
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Floating Compare Action Bar */}
      {isMounted && compareList.length > 0 && (
        <div style={{
          position: 'fixed',
          bottom: '1.5rem',
          right: '1.5rem',
          background: 'var(--bg-card)',
          border: '1px solid var(--accent-blue)',
          boxShadow: '0 8px 32px rgba(0, 229, 255, 0.25)',
          borderRadius: '12px',
          padding: '0.75rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          zIndex: 999
        }}>
          <div style={{ color: 'white', fontWeight: '800', fontSize: '0.88rem' }}>
            <span style={{ color: 'var(--accent-blue)' }}>{compareList.length}</span> / 3 Players Selected
          </div>
          <button
            onClick={() => setCompareModalOpen(true)}
            className="btn"
            style={{ padding: '0.4rem 0.9rem', fontSize: '0.82rem', gap: '0.4rem' }}
          >
            <Maximize2 size={14} /> Compare Side-by-Side
          </button>
          <button
            onClick={() => setCompareList([])}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem' }}
          >
            Clear
          </button>
        </div>
      )}

      {/* Side-by-Side Compare Modal */}
      {isMounted && compareModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', width: '100%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.85rem' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: '900', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={22} style={{ color: 'var(--accent-blue)' }} />
                <span>SIDE-BY-SIDE PLAYER COMPARISON</span>
              </h2>
              <button onClick={() => setCompareModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>

            {/* Comparison Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                    <th style={{ textAlign: 'left', padding: '0.6rem', color: 'var(--text-muted)' }}>Attribute</th>
                    {compareList.map(p => (
                      <th key={p.player_id} style={{ textAlign: 'center', padding: '0.6rem', width: `${90 / compareList.length}%` }}>
                        <div style={{ fontWeight: '900', fontSize: '1rem', color: 'white' }}>{p.short_name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{p.club_name || 'Free Agent'}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '0.6rem', fontWeight: '700', color: 'var(--text-muted)' }}>Overall (OVR)</td>
                    {compareList.map(p => (
                      <td key={p.player_id} style={{ textAlign: 'center', padding: '0.6rem' }}>
                        <span className="badge-rating badge-gold" style={{ fontSize: '1rem' }}>{p.overall}</span>
                      </td>
                    ))}
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '0.6rem', fontWeight: '700', color: 'var(--text-muted)' }}>Potential (POT)</td>
                    {compareList.map(p => (
                      <td key={p.player_id} style={{ textAlign: 'center', padding: '0.6rem' }}>
                        <span className="badge-rating badge-silver" style={{ fontSize: '1rem' }}>{p.potential}</span>
                      </td>
                    ))}
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '0.6rem', fontWeight: '700', color: 'var(--text-muted)' }}>Position</td>
                    {compareList.map(p => (
                      <td key={p.player_id} style={{ textAlign: 'center', padding: '0.6rem' }}>
                        <span className="badge-pos pos-mid">{p.player_positions}</span>
                      </td>
                    ))}
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '0.6rem', fontWeight: '700', color: 'var(--text-muted)' }}>Age</td>
                    {compareList.map(p => (
                      <td key={p.player_id} style={{ textAlign: 'center', padding: '0.6rem', fontWeight: '700' }}>{p.age} yrs</td>
                    ))}
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '0.6rem', fontWeight: '700', color: 'var(--text-muted)' }}>Market Value</td>
                    {compareList.map(p => (
                      <td key={p.player_id} style={{ textAlign: 'center', padding: '0.6rem', fontWeight: '800', color: 'var(--accent-green)' }}>
                        {formatCurrencyWithSettings(p.value_eur)}
                      </td>
                    ))}
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '0.6rem', fontWeight: '700', color: 'var(--text-muted)' }}>Weekly Wage</td>
                    {compareList.map(p => (
                      <td key={p.player_id} style={{ textAlign: 'center', padding: '0.6rem', fontWeight: '800', color: 'var(--accent-gold)' }}>
                        {formatCurrencyWithSettings(p.wage_eur)}
                      </td>
                    ))}
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '0.6rem', fontWeight: '700', color: 'var(--text-muted)' }}>Pace</td>
                    {compareList.map(p => (
                      <td key={p.player_id} style={{ textAlign: 'center', padding: '0.6rem', fontWeight: '800' }}>{p.pace || '--'}</td>
                    ))}
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '0.6rem', fontWeight: '700', color: 'var(--text-muted)' }}>Shooting</td>
                    {compareList.map(p => (
                      <td key={p.player_id} style={{ textAlign: 'center', padding: '0.6rem', fontWeight: '800' }}>{p.shooting || '--'}</td>
                    ))}
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '0.6rem', fontWeight: '700', color: 'var(--text-muted)' }}>Passing</td>
                    {compareList.map(p => (
                      <td key={p.player_id} style={{ textAlign: 'center', padding: '0.6rem', fontWeight: '800' }}>{p.passing || '--'}</td>
                    ))}
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '0.6rem', fontWeight: '700', color: 'var(--text-muted)' }}>Dribbling</td>
                    {compareList.map(p => (
                      <td key={p.player_id} style={{ textAlign: 'center', padding: '0.6rem', fontWeight: '800' }}>{p.dribbling || '--'}</td>
                    ))}
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '0.6rem', fontWeight: '700', color: 'var(--text-muted)' }}>Defending</td>
                    {compareList.map(p => (
                      <td key={p.player_id} style={{ textAlign: 'center', padding: '0.6rem', fontWeight: '800' }}>{p.defending || '--'}</td>
                    ))}
                  </tr>
                  <tr>
                    <td style={{ padding: '0.6rem', fontWeight: '700', color: 'var(--text-muted)' }}>Physicality</td>
                    {compareList.map(p => (
                      <td key={p.player_id} style={{ textAlign: 'center', padding: '0.6rem', fontWeight: '800' }}>{p.physic || '--'}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
