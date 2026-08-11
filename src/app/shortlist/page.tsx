'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Star, Trash2, ArrowUpDown, Eye, ArrowLeft, Loader2, HelpCircle 
} from 'lucide-react';

interface Player {
  player_id: number;
  short_name: string;
  long_name: string;
  player_positions: string;
  overall: number;
  potential: number;
  value_eur: number | null;
  wage_eur: number | null;
  age: number;
  club_name: string | null;
  league_name: string | null;
  nationality_name: string;
}

export default function ShortlistPage() {
  const router = useRouter();
  const [playerIds, setPlayerIds] = useState<number[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Sort states
  const [sortBy, setSortBy] = useState<string>('overall');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Load shortlist on mount
  useEffect(() => {
    const saved = localStorage.getItem('fc24_shortlist');
    if (saved) {
      try {
        const ids = JSON.parse(saved) as number[];
        setPlayerIds(ids);
      } catch (e) {
        console.error(e);
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  // Fetch players matching IDs
  useEffect(() => {
    if (playerIds.length === 0) {
      setPlayers([]);
      setIsLoading(false);
      return;
    }

    const fetchShortlistDetails = async () => {
      try {
        setIsLoading(true);
        // Call the API endpoint we modified to support the ids list
        const res = await fetch(`/api/players?ids=${playerIds.join(',')}&limit=200`);
        if (!res.ok) {
          throw new Error('Failed to load player details');
        }
        const data = await res.json();
        setPlayers(data.players || []);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Error fetching player details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchShortlistDetails();
  }, [playerIds]);

  // Remove player from shortlist
  const removePlayer = (playerId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const updatedIds = playerIds.filter(id => id !== playerId);
    setPlayerIds(updatedIds);
    localStorage.setItem('fc24_shortlist', JSON.stringify(updatedIds));
  };

  // Handle local sorting
  const handleSort = (field: keyof Player) => {
    let order: 'asc' | 'desc' = 'desc';
    if (sortBy === field && sortOrder === 'desc') {
      order = 'asc';
    }
    setSortBy(field);
    setSortOrder(order);
  };

  // Sort players list locally
  const sortedPlayers = [...players].sort((a, b) => {
    let valA = a[sortBy as keyof Player];
    let valB = b[sortBy as keyof Player];

    // Handle null values
    if (valA === null || valA === undefined) valA = 0;
    if (valB === null || valB === undefined) valB = 0;

    if (typeof valA === 'string' && typeof valB === 'string') {
      return sortOrder === 'asc' 
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    }

    // Number comparisons
    return sortOrder === 'asc' 
      ? (valA as number) - (valB as number)
      : (valB as number) - (valA as number);
  });

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

  // Format money helper
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

  return (
    <div className="content-area" style={{ width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
      <div className="page-header">
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Star size={24} fill="var(--accent-gold)" color="var(--accent-gold)" />
          Scouting Shortlist
        </h1>
        <Link href="/scouting" className="btn btn-secondary">
          <ArrowLeft size={16} />
          <span>Back to Scouting</span>
        </Link>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5rem', gap: '1rem', color: 'var(--text-secondary)' }}>
          <Loader2 size={36} className="animate-spin" style={{ color: 'var(--accent-blue)' }} />
          <span>Loading player data...</span>
        </div>
      ) : error ? (
        <div className="stats-card text-center" style={{ padding: '3rem', border: '1px solid var(--accent-red)' }}>
          <h3 className="text-danger" style={{ marginBottom: '1rem' }}>Error Loading Shortlist</h3>
          <p>{error}</p>
        </div>
      ) : sortedPlayers.length === 0 ? (
        <div className="stats-card text-center" style={{ padding: '4rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
          <Star size={48} style={{ color: 'var(--text-muted)' }} />
          <div>
            <h2 style={{ marginBottom: '0.5rem', fontWeight: '800' }}>Your Shortlist is Empty</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Add players to your shortlist while browsing in the Scouting search tool.
            </p>
          </div>
          <Link href="/scouting" className="btn">
            Go Scouting
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div className="scouting-toolbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ArrowUpDown size={14} style={{ color: 'var(--accent-blue)' }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Sort:</span>
              <select
                className="filter-input"
                style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem', width: 'auto', background: 'var(--bg-sidebar)' }}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
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
                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              >
                <span>{sortOrder.toUpperCase()}</span>
                <span style={{ fontSize: '0.85rem' }}>{sortOrder === 'asc' ? '↑' : '↓'}</span>
              </button>
            </div>

            <div className="scouting-results-header">
              <span>Starred Targets: <strong>{sortedPlayers.length}</strong> players</span>
            </div>
          </div>

          {/* Desktop Only View */}
          <div className="desktop-only-table">
            <div className="table-wrapper">
            <table className="scouting-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }} className="text-center">Remove</th>
                  <th className="sortable text-center" style={{ width: '60px' }} onClick={() => handleSort('overall')}>
                    OVR {sortBy === 'overall' && <ArrowUpDown size={12} />}
                  </th>
                  <th className="sortable text-center" style={{ width: '60px' }} onClick={() => handleSort('potential')}>
                    POT {sortBy === 'potential' && <ArrowUpDown size={12} />}
                  </th>
                  <th className="sortable" onClick={() => handleSort('short_name')}>
                    Name {sortBy === 'short_name' && <ArrowUpDown size={12} />}
                  </th>
                  <th style={{ width: '100px' }} className="text-center">Pos</th>
                  <th className="sortable text-center" style={{ width: '60px' }} onClick={() => handleSort('age')}>
                    Age {sortBy === 'age' && <ArrowUpDown size={12} />}
                  </th>
                  <th>Club</th>
                  <th>Nationality</th>
                  <th className="sortable" onClick={() => handleSort('value_eur')} style={{ width: '100px' }}>
                    Value {sortBy === 'value_eur' && <ArrowUpDown size={12} />}
                  </th>
                  <th className="sortable" onClick={() => handleSort('wage_eur')} style={{ width: '100px' }}>
                    Wage {sortBy === 'wage_eur' && <ArrowUpDown size={12} />}
                  </th>
                  <th style={{ width: '60px' }} className="text-center">View</th>
                </tr>
              </thead>
              <tbody>
                {sortedPlayers.map((player) => (
                  <tr key={player.player_id}>
                    <td className="text-center">
                      <button 
                        onClick={(e) => removePlayer(player.player_id, e)}
                        className="btn btn-secondary btn-danger"
                        style={{ padding: '0.4rem', borderRadius: '4px', border: 'none', background: 'rgba(255, 82, 82, 0.1)' }}
                      >
                        <Trash2 size={14} style={{ color: 'var(--accent-red)' }} />
                      </button>
                    </td>
                    <td className="text-center">
                      <span className={`badge-rating ${getRatingBadgeClass(player.overall)}`}>
                        {player.overall}
                      </span>
                    </td>
                    <td className="text-center">
                      <span className={`badge-rating ${getRatingBadgeClass(player.potential)}`} style={{ opacity: 0.85 }}>
                        {player.potential}
                      </span>
                    </td>
                    <td>
                      <Link href={`/players/${player.player_id}`} style={{ fontWeight: '700' }}>
                        {player.short_name}
                      </Link>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{player.long_name}</div>
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
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{player.league_name || 'No League'}</div>
                    </td>
                    <td>{player.nationality_name}</td>
                    <td style={{ fontWeight: '700' }} className="text-green">
                      {formatCurrency(player.value_eur)}
                    </td>
                    <td style={{ fontWeight: '700' }} className="text-gold">
                      {formatCurrency(player.wage_eur)}
                    </td>
                    <td className="text-center">
                      <Link href={`/players/${player.player_id}`} className="btn btn-secondary" style={{ padding: '0.4rem', borderRadius: '4px' }}>
                        <Eye size={14} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Only View */}
        <div className="mobile-only-cards">
          {sortedPlayers.map((player) => {
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
                
                {/* Bottom Row: Positions + Financials + Trash Button */}
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
                      onClick={(e) => removePlayer(player.player_id, e)}
                      title="Remove from shortlist"
                    >
                      <Trash2 size={16} color="var(--accent-red)" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      )}
      
      {/* Custom simple spin animation style */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}
