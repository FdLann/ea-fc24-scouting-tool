'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Star, Trash2, ArrowUpDown, Eye, ArrowLeft, Loader2, HelpCircle, Printer, FileText, Tag, Download 
} from 'lucide-react';
import { formatCurrencyWithSettings } from '@/lib/settings';

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

export type ShortlistCategory = 'Target Musim Ini' | 'Long-term Wishlist' | 'Backup Plan' | 'Uncategorized';

export default function ShortlistPage() {
  const router = useRouter();
  const [playerIds, setPlayerIds] = useState<number[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Sort states
  const [sortBy, setSortBy] = useState<string>('overall');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Category & Notes state
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');
  const [shortlistMeta, setShortlistMeta] = useState<{ [id: number]: { note?: string; category?: ShortlistCategory } }>({});

  // Load shortlist & metadata on mount
  useEffect(() => {
    const saved = localStorage.getItem('fc24_shortlist');
    const savedMeta = localStorage.getItem('fc24_shortlist_meta');
    if (saved) {
      try {
        const ids = JSON.parse(saved) as number[];
        setPlayerIds(ids);
      } catch (e) {
        console.error(e);
      }
    }
    if (savedMeta) {
      try {
        setShortlistMeta(JSON.parse(savedMeta));
      } catch (e) {
        console.error(e);
      }
    }
    setIsLoading(false);
  }, []);

  const updateMeta = (playerId: number, updates: { note?: string; category?: ShortlistCategory }) => {
    const next = {
      ...shortlistMeta,
      [playerId]: { ...shortlistMeta[playerId], ...updates }
    };
    setShortlistMeta(next);
    localStorage.setItem('fc24_shortlist_meta', JSON.stringify(next));
  };

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

  // Filter sorted players by category
  const filteredCategoryPlayers = sortedPlayers.filter((player: Player) => {
    if (selectedCategoryFilter === 'ALL') return true;
    const cat = shortlistMeta[player.player_id]?.category || 'Uncategorized';
    return cat === selectedCategoryFilter;
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
      ) : players.length === 0 ? (
        <div className="empty-state">
          <Star size={48} className="empty-state-icon" />
          <div className="empty-state-text">
            <h3>Your Shortlist is Empty</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Tag size={14} style={{ color: 'var(--accent-gold)' }} />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700' }}>Category:</span>
                <select
                  className="filter-input"
                  style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem', width: 'auto', background: 'var(--bg-sidebar)' }}
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                >
                  <option value="ALL">All Categories</option>
                  <option value="Target Musim Ini">Target Musim Ini</option>
                  <option value="Long-term Wishlist">Long-term Wishlist</option>
                  <option value="Backup Plan">Backup Plan</option>
                  <option value="Uncategorized">Uncategorized</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ArrowUpDown size={14} style={{ color: 'var(--accent-blue)' }} />
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
                  style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                  onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                >
                  {sortOrder === 'asc' ? '↑ ASC' : '↓ DESC'}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <button
                onClick={() => window.print()}
                className="btn btn-secondary btn-sm"
                style={{ gap: '0.4rem', padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
              >
                <Printer size={14} /> Export / Print
              </button>
              <div className="scouting-results-header">
                <span>Targets: <strong>{filteredCategoryPlayers.length}</strong></span>
              </div>
            </div>
          </div>

          {/* Desktop Only View */}
          <div className="desktop-only-table">
            <div className="table-wrapper">
            <table className="scouting-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }} className="text-center">Remove</th>
                  <th className="sortable text-center" style={{ width: '60px' }} onClick={() => handleSort('overall')}>OVR</th>
                  <th className="sortable text-center" style={{ width: '60px' }} onClick={() => handleSort('potential')}>POT</th>
                  <th className="sortable" onClick={() => handleSort('short_name')}>Name</th>
                  <th style={{ width: '90px' }} className="text-center">Pos</th>
                  <th>Category</th>
                  <th>Scout Note</th>
                  <th className="sortable" onClick={() => handleSort('value_eur')} style={{ width: '95px' }}>Value</th>
                  <th className="sortable" onClick={() => handleSort('wage_eur')} style={{ width: '95px' }}>Wage</th>
                  <th style={{ width: '50px' }} className="text-center">View</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategoryPlayers.map((player) => {
                  const meta = shortlistMeta[player.player_id] || {};
                  return (
                    <tr key={player.player_id}>
                      <td className="text-center">
                        <button 
                          onClick={(e) => removePlayer(player.player_id, e)}
                          className="btn btn-secondary btn-danger"
                          style={{ padding: '0.35rem', borderRadius: '4px' }}
                        >
                          <Trash2 size={12} style={{ color: 'var(--accent-red)' }} />
                        </button>
                      </td>
                      <td className="text-center">
                        <span className="badge-rating badge-gold">{player.overall}</span>
                      </td>
                      <td className="text-center">
                        <span className="badge-rating badge-silver">{player.potential}</span>
                      </td>
                      <td>
                        <Link href={`/players/${player.player_id}`} style={{ fontWeight: '700' }}>
                          {player.short_name}
                        </Link>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{player.club_name || 'Free Agent'}</div>
                      </td>
                      <td className="text-center">
                        <span className="badge-pos pos-mid">{player.player_positions.split(',')[0]}</span>
                      </td>
                      <td>
                        <select
                          value={meta.category || 'Uncategorized'}
                          onChange={(e) => updateMeta(player.player_id, { category: e.target.value as ShortlistCategory })}
                          style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '4px', color: 'var(--accent-gold)', fontSize: '0.75rem', padding: '0.2rem 0.4rem', outline: 'none' }}
                        >
                          <option value="Target Musim Ini">🎯 Target Musim Ini</option>
                          <option value="Long-term Wishlist">⭐ Long-term Wishlist</option>
                          <option value="Backup Plan">🛡️ Backup Plan</option>
                          <option value="Uncategorized">📌 Uncategorized</option>
                        </select>
                      </td>
                      <td>
                        <input
                          type="text"
                          placeholder="Add scout note..."
                          value={meta.note || ''}
                          onChange={(e) => updateMeta(player.player_id, { note: e.target.value })}
                          style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '4px', color: 'white', fontSize: '0.78rem', padding: '0.25rem 0.5rem', outline: 'none' }}
                        />
                      </td>
                      <td style={{ fontWeight: '700' }} className="text-green">
                        {formatCurrencyWithSettings(player.value_eur)}
                      </td>
                      <td style={{ fontWeight: '700' }} className="text-gold">
                        {formatCurrencyWithSettings(player.wage_eur)}
                      </td>
                      <td className="text-center">
                        <Link href={`/players/${player.player_id}`} className="btn btn-secondary" style={{ padding: '0.35rem', borderRadius: '4px' }}>
                          <Eye size={14} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </div>

        {/* Mobile Only View */}
        <div className="mobile-only-cards">
          {filteredCategoryPlayers.map((player) => {
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
