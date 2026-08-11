import { NextResponse } from 'next/server';
import db from '@/lib/db';

interface ClubRow { club_name: string; }
interface LeagueRow { league_name: string; }
interface NationRow { nationality_name: string; }

let cache: {
  clubs: string[];
  leagues: string[];
  nationalities: string[];
} | null = null;

export async function GET() {
  try {
    if (cache) {
      return NextResponse.json(cache);
    }
    
    // Fetch unique clubs
    const clubsResult = db.prepare(`
      SELECT DISTINCT club_name 
      FROM players 
      WHERE club_name IS NOT NULL AND club_name != '' 
      ORDER BY club_name ASC
    `).all() as ClubRow[];
    const clubs = clubsResult.map(c => c.club_name);
    
    // Fetch unique leagues
    const leaguesResult = db.prepare(`
      SELECT DISTINCT league_name 
      FROM players 
      WHERE league_name IS NOT NULL AND league_name != '' 
      ORDER BY league_name ASC
    `).all() as LeagueRow[];
    const leagues = leaguesResult.map(l => l.league_name);
    
    // Fetch unique nationalities
    const nationalitiesResult = db.prepare(`
      SELECT DISTINCT nationality_name 
      FROM players 
      WHERE nationality_name IS NOT NULL AND nationality_name != '' 
      ORDER BY nationality_name ASC
    `).all() as NationRow[];
    const nationalities = nationalitiesResult.map(n => n.nationality_name);
    
    cache = { clubs, leagues, nationalities };
    
    return NextResponse.json(cache);
  } catch (error: any) {
    console.error("API error in /api/metadata:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
