import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const playerId = parseInt(id, 10);
    
    if (isNaN(playerId)) {
      return NextResponse.json({ error: "Invalid player ID" }, { status: 400 });
    }

    const target = db.prepare(`
      SELECT player_id, short_name, player_positions, overall, potential, pace, shooting, passing, dribbling, defending, physic, value_eur, wage_eur
      FROM players 
      WHERE player_id = ?
    `).get(playerId) as any;

    if (!target) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    const primaryPos = target.player_positions.split(',')[0].trim();
    
    // Query candidate players with similar position & rating range
    const candidates = db.prepare(`
      SELECT player_id, short_name, long_name, player_positions, overall, potential, value_eur, wage_eur, age, club_name, league_name, nationality_name, pace, shooting, passing, dribbling, defending, physic
      FROM players
      WHERE player_id != ? 
        AND (player_positions LIKE ? OR player_positions LIKE ?)
        AND overall BETWEEN ? AND ?
      LIMIT 100
    `).all(
      playerId, 
      `%${primaryPos}%`, 
      `%${target.player_positions.split(',')[1]?.trim() || primaryPos}%`,
      Math.max(40, target.overall - 10),
      Math.min(99, target.overall + 10)
    ) as any[];

    // Calculate Euclidean distance on key vector attributes
    const tPace = target.pace || 60;
    const tShoot = target.shooting || 60;
    const tPass = target.passing || 60;
    const tDrib = target.dribbling || 60;
    const tDef = target.defending || 60;
    const tPhys = target.physic || 60;

    const scored = candidates.map(p => {
      const dist = Math.sqrt(
        Math.pow((p.pace || 60) - tPace, 2) +
        Math.pow((p.shooting || 60) - tShoot, 2) +
        Math.pow((p.passing || 60) - tPass, 2) +
        Math.pow((p.dribbling || 60) - tDrib, 2) +
        Math.pow((p.defending || 60) - tDef, 2) +
        Math.pow((p.physic || 60) - tPhys, 2) +
        Math.pow((p.overall || 60) - target.overall, 2) * 1.5
      );
      const similarityPercent = Math.max(50, Math.min(99, Math.round(100 - dist * 0.85)));
      return { ...p, similarityPercent, dist };
    });

    scored.sort((a, b) => a.dist - b.dist);
    const topSimilar = scored.slice(0, 4);

    return NextResponse.json({ similarPlayers: topSimilar });
  } catch (error: any) {
    console.error("API error in /api/players/[id]/similar:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
