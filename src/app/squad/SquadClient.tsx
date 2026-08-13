'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, Search, Plus, Trash2, AlertTriangle, CheckCircle, ArrowRight, Eye, ShieldAlert, Sparkles } from 'lucide-react';
import { formatCurrencyWithSettings } from '@/lib/settings';

interface PlayerSimple {
  player_id: number;
  short_name: string;
  player_positions: string;
  overall: number;
  potential: number;
  value_eur: number | null;
  wage_eur: number | null;
  age: number;
  club_name: string | null;
}

const DEFAULT_POSITIONS = [
  { id: 'gk', label: 'GK', defaultPos: 'GK' },
  { id: 'lb', label: 'LB', defaultPos: 'LB' },
  { id: 'cb1', label: 'CB (Left)', defaultPos: 'CB' },
  { id: 'cb2', label: 'CB (Right)', defaultPos: 'CB' },
  { id: 'rb', label: 'RB', defaultPos: 'RB' },
  { id: 'cm1', label: 'CM / CDM', defaultPos: 'CM' },
  { id: 'cm2', label: 'CM / CAM', defaultPos: 'CAM' },
  { id: 'lw', label: 'LW / LM', defaultPos: 'LW' },
  { id: 'rw', label: 'RW / RM', defaultPos: 'RW' },
  { id: 'st1', label: 'ST / CF', defaultPos: 'ST' },
  { id: 'st2', label: 'SUB / Backup', defaultPos: 'ST' },
];

export default function SquadClient() {
  const [squad, setSquad] = useState<{ [posId: string]: PlayerSimple | null }>({});
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [activeSlot, setActiveSlot] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PlayerSimple[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recommendations, setRecommendations] = useState<{ [posId: string]: PlayerSimple[] }>({});

  // Load saved squad from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('fc24_my_squad');
      if (saved) {
        setSquad(JSON.parse(saved));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Save squad to localStorage
  const saveSquad = (newSquad: typeof squad) => {
    setSquad(newSquad);
    localStorage.setItem('fc24_my_squad', JSON.stringify(newSquad));
  };

  // Search players for slot
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/players?search=${encodeURIComponent(searchQuery)}&limit=10`);
        const data = await res.json();
        setSearchResults(data.players || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const selectPlayerForSlot = (slotId: string, player: PlayerSimple) => {
    const updated = { ...squad, [slotId]: player };
    saveSquad(updated);
    setSearchModalOpen(false);
    setSearchQuery('');
    setActiveSlot(null);
  };

  const removePlayerFromSlot = (slotId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = { ...squad };
    delete updated[slotId];
    saveSquad(updated);
  };

  // Calculate squad statistics
  const filledPlayers = Object.values(squad).filter(Boolean) as PlayerSimple[];
  const avgOvr = filledPlayers.length > 0
    ? Math.round(filledPlayers.reduce((sum, p) => sum + p.overall, 0) / filledPlayers.length)
    : 0;

  // Identify weak positions (slots with OVR < avgOvr - 2 or empty)
  const weakSlots = DEFAULT_POSITIONS.filter(slot => {
    const player = squad[slot.id];
    if (!player) return true;
    return player.overall < (avgOvr - 2);
  });

  // Fetch recommendations for weak slots
  const fetchRecommendationsForSlot = async (slot: typeof DEFAULT_POSITIONS[0]) => {
    const pos = slot.defaultPos;
    const minRating = avgOvr ? avgOvr + 2 : 78;
    try {
      const res = await fetch(`/api/players?position=${pos}&min_overall=${minRating}&sort_by=potential&sort_order=desc&limit=3`);
      const data = await res.json();
      setRecommendations(prev => ({ ...prev, [slot.id]: data.players || [] }));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="content-area" style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: '900', color: 'white', display: 'flex', alignItems: 'center', gap: '0.6rem', textTransform: 'uppercase' }}>
            <Users size={28} style={{ color: 'var(--accent-blue)' }} />
            <span>MY SQUAD & NEED ANALYZER</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.2rem' }}>
            Build your current Career Mode squad, analyze weak positions, and generate targeted scout recommendations.
          </p>
        </div>

        {/* Squad Summary Stats Badge */}
        <div style={{ display: 'flex', gap: '1rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '0.75rem 1.25rem' }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>SQUAD SIZE</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: '900', color: 'var(--text-primary)' }}>
              {filledPlayers.length} / 11
            </div>
          </div>
          <div style={{ width: '1px', background: 'var(--border-color)' }} />
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>AVG OVERALL</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: '900', color: 'var(--accent-green)' }}>
              {avgOvr || '--'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Squad Pitch & Need Analysis */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
        
        {/* Squad Lineup Slots */}
        <div className="stats-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <h3 className="stats-card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>STARTING XI & SQUAD SLOTS</span>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Click slot to pick player</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {DEFAULT_POSITIONS.map((slot) => {
              const player = squad[slot.id];
              const isWeak = player ? player.overall < (avgOvr - 2) : false;

              return (
                <div
                  key={slot.id}
                  onClick={() => {
                    setActiveSlot(slot.id);
                    setSearchModalOpen(true);
                  }}
                  style={{
                    background: player ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.2)',
                    border: `1px solid ${isWeak ? 'rgba(255, 179, 0, 0.4)' : player ? 'var(--border-color)' : 'dashed rgba(255,255,255,0.15)'}`,
                    borderRadius: '8px',
                    padding: '0.75rem 1rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span className="badge-pos pos-mid" style={{ width: '40px', textAlign: 'center', padding: '0.3rem 0', fontWeight: '800' }}>
                      {slot.defaultPos}
                    </span>
                    <div>
                      <div style={{ fontWeight: '700', color: player ? 'white' : 'var(--text-muted)', fontSize: '0.95rem' }}>
                        {player ? player.short_name : `Select ${slot.label}`}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {player ? `${player.club_name || 'Free Agent'} • ${player.age} yrs` : 'Empty position slot'}
                      </div>
                    </div>
                  </div>

                  {player ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span className="badge-rating badge-gold" style={{ width: '32px', height: '32px', fontSize: '0.95rem' }}>
                        {player.overall}
                      </span>
                      <button
                        onClick={(e) => removePlayerFromSlot(slot.id, e)}
                        style={{ background: 'none', border: 'none', color: 'var(--accent-red)', cursor: 'pointer', padding: '0.2rem' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--accent-blue)', fontSize: '0.8rem', fontWeight: '700' }}>
                      <Plus size={16} /> Add
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Squad Need Analysis Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Analysis Report Card */}
          <div className="stats-card">
            <h3 className="stats-card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldAlert size={18} style={{ color: 'var(--accent-gold)' }} />
              <span>SQUAD NEED ANALYSIS REPORT</span>
            </h3>

            {weakSlots.length === 0 && filledPlayers.length === 11 ? (
              <div style={{ background: 'rgba(0, 230, 118, 0.1)', border: '1px solid rgba(0, 230, 118, 0.3)', borderRadius: '8px', padding: '1rem', textAlign: 'center', color: 'var(--accent-green)' }}>
                <CheckCircle size={24} style={{ margin: '0 auto 0.5rem auto' }} />
                <div style={{ fontWeight: '800' }}>YOUR SQUAD IS BALANCED & STRONG!</div>
                <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>No immediate weak positions detected. All ratings match or exceed squad average ({avgOvr}).</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Detected <strong>{weakSlots.length} position(s)</strong> requiring transfer reinforcement:
                </div>

                {weakSlots.map(slot => {
                  const player = squad[slot.id];
                  const slotRecs = recommendations[slot.id] || [];

                  return (
                    <div key={slot.id} style={{ background: 'rgba(255, 179, 0, 0.08)', border: '1px solid rgba(255, 179, 0, 0.25)', borderRadius: '8px', padding: '0.85rem 1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <div style={{ fontWeight: '800', color: 'var(--accent-gold)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <AlertTriangle size={15} />
                          <span>{slot.label} ({slot.defaultPos})</span>
                        </div>
                        <button
                          onClick={() => fetchRecommendationsForSlot(slot)}
                          className="btn btn-secondary"
                          style={{ fontSize: '0.72rem', padding: '0.25rem 0.5rem', borderRadius: '4px' }}
                        >
                          <Sparkles size={12} /> Find Targets
                        </button>
                      </div>

                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {player ? `Current: ${player.short_name} (${player.overall} OVR - Below Squad Avg ${avgOvr})` : 'Position currently empty.'}
                      </div>

                      {/* Display Target Recommendations */}
                      {slotRecs.length > 0 && (
                        <div style={{ marginTop: '0.65rem', borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '0.65rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                          <div style={{ fontSize: '0.72rem', fontWeight: '800', color: 'var(--accent-green)', textTransform: 'uppercase' }}>Recommended Targets:</div>
                          {slotRecs.map(rec => (
                            <Link key={rec.player_id} href={`/players/${rec.player_id}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)', padding: '0.4rem 0.6rem', borderRadius: '4px', textDecoration: 'none' }}>
                              <span style={{ color: 'white', fontWeight: '700', fontSize: '0.82rem' }}>{rec.short_name} ({rec.overall} OVR / {rec.potential} POT)</span>
                              <span style={{ color: 'var(--accent-green)', fontWeight: '700', fontSize: '0.78rem' }}>{formatCurrencyWithSettings(rec.value_eur)}</span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search Player Modal */}
      {searchModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(5px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', width: '100%', maxWidth: '500px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: '800', color: 'white' }}>SEARCH PLAYER FOR SLOT</h3>
              <button onClick={() => setSearchModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <Trash2 size={18} />
              </button>
            </div>

            <div style={{ position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                autoFocus
                placeholder="Type player name (e.g. Bellingham, Haaland)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.6rem 0.6rem 0.6rem 2.4rem', color: 'white', outline: 'none' }}
              />
            </div>

            <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {isSearching ? (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>Searching database...</div>
              ) : searchResults.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                  {searchQuery ? 'No players found.' : 'Type at least 2 characters to search...'}
                </div>
              ) : (
                searchResults.map(p => (
                  <div
                    key={p.player_id}
                    onClick={() => activeSlot && selectPlayerForSlot(activeSlot, p)}
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.6rem 0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                  >
                    <div>
                      <div style={{ fontWeight: '700', color: 'white' }}>{p.short_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.club_name || 'Free Agent'} • {p.player_positions}</div>
                    </div>
                    <span className="badge-rating badge-gold" style={{ width: '28px', height: '28px', fontSize: '0.85rem' }}>{p.overall}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
