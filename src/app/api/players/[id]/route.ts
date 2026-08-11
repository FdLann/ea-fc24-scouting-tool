import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { calculateEstimatedWage } from '@/lib/wageCalculator';

interface PlayerRow {
  overall: number;
  potential: number;
  age: number;
  international_reputation?: number;
  league_name?: string;
  player_positions?: string;
  [key: string]: any;
}

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
    
    const player = db.prepare(`
      SELECT * 
      FROM players 
      WHERE player_id = ?
    `).get(playerId) as PlayerRow | undefined;
    
    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }
    
    // Calculate estimated wage
    const estimatedWage = calculateEstimatedWage({
      overall: player.overall,
      potential: player.potential,
      age: player.age,
      internationalReputation: player.international_reputation || 1,
      leagueName: player.league_name || 'Other',
      position: player.player_positions || 'CM'
    });
    
    return NextResponse.json({
      ...player,
      estimated_wage: estimatedWage
    });
  } catch (error: any) {
    console.error("API error in /api/players/[id]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
