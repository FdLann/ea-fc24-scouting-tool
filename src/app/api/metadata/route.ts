import { NextResponse } from 'next/server';
import db from '@/lib/db';

interface ClubRow { club_name: string; }
interface LeagueRow { league_name: string; }
interface NationRow { nationality_name: string; }
interface LeagueClubRow { club_name: string; league_name: string; }

let cache: {
  clubs: string[];
  leagues: string[];
  nationalities: string[];
  leagueClubs: Record<string, string[]>;
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

    // Fetch league to clubs mapping
    const leagueClubsResult = db.prepare(`
      SELECT DISTINCT club_name, league_name 
      FROM players 
      WHERE club_name IS NOT NULL AND club_name != '' AND league_name IS NOT NULL AND league_name != ''
      ORDER BY club_name ASC
    `).all() as LeagueClubRow[];

    const leagueClubs: Record<string, string[]> = {};
    leagueClubsResult.forEach(row => {
      if (!leagueClubs[row.league_name]) {
        leagueClubs[row.league_name] = [];
      }
      leagueClubs[row.league_name].push(row.club_name);
    });
    
    cache = { clubs, leagues, nationalities, leagueClubs };
    
    return NextResponse.json(cache);
  } catch (error: any) {
    console.error("API error in /api/metadata:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
