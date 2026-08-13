import db from '@/lib/db';
import ScoutingClient from './ScoutingClient';

export interface Player {
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
  pace: number | null;
  shooting: number | null;
  passing: number | null;
  dribbling: number | null;
  defending: number | null;
  physic: number | null;
  preferred_foot: string;
  skill_moves: number;
  weak_foot: number;
  club_contract_valid_until_year?: number | null;
  release_clause_eur?: number | null;
  player_traits?: string | null;
  player_tags?: string | null;
  work_rate?: string | null;
  body_type?: string | null;
  club_loaned_from?: string | null;
}

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ScoutingPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;

  // Pagination
  const page = parseInt((resolvedParams.page as string) || '1', 10);
  const limit = parseInt((resolvedParams.limit as string) || '20', 10);
  const offset = (page - 1) * limit;

  // Sort
  const sortBy = (resolvedParams.sort_by as string) || 'overall';
  const sortOrder = ((resolvedParams.sort_order as string) || 'desc').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  // Validate sort column
  const allowedSortCols = ['overall', 'potential', 'value_eur', 'wage_eur', 'age', 'short_name', 'long_name'];
  const finalSortBy = allowedSortCols.includes(sortBy) ? sortBy : 'overall';

  // Filters
  const search = (resolvedParams.search as string) || '';
  const position = (resolvedParams.position as string) || '';
  const club = (resolvedParams.club as string) || '';
  const league = (resolvedParams.league as string) || '';
  const nationality = (resolvedParams.nationality as string) || '';

  // Ranges
  const minOverall = parseInt((resolvedParams.min_overall as string) || '0', 10);
  const maxOverall = parseInt((resolvedParams.max_overall as string) || '99', 10);
  const minPotential = parseInt((resolvedParams.min_potential as string) || '0', 10);
  const maxPotential = parseInt((resolvedParams.max_potential as string) || '99', 10);
  const minAge = parseInt((resolvedParams.min_age as string) || '15', 10);
  const maxAge = parseInt((resolvedParams.max_age as string) || '50', 10);
  const minWage = parseInt((resolvedParams.minWage as string) || (resolvedParams.min_wage as string) || '0', 10);
  const maxWage = parseInt((resolvedParams.maxWage as string) || (resolvedParams.max_wage as string) || '1000000', 10);
  const minValue = parseInt((resolvedParams.minValue as string) || (resolvedParams.min_value as string) || '0', 10);
  const maxValue = parseInt((resolvedParams.maxValue as string) || (resolvedParams.max_value as string) || '300000000', 10);

  // Skill Filters
  const minPace = parseInt((resolvedParams.min_pace as string) || '0', 10);
  const maxPace = parseInt((resolvedParams.max_pace as string) || '99', 10);
  const minShooting = parseInt((resolvedParams.min_shooting as string) || '0', 10);
  const maxShooting = parseInt((resolvedParams.max_shooting as string) || '99', 10);
  const minPassing = parseInt((resolvedParams.min_passing as string) || '0', 10);
  const maxPassing = parseInt((resolvedParams.max_passing as string) || '99', 10);
  const minDribbling = parseInt((resolvedParams.min_dribbling as string) || '0', 10);
  const maxDribbling = parseInt((resolvedParams.max_dribbling as string) || '99', 10);
  const minDefending = parseInt((resolvedParams.min_defending as string) || '0', 10);
  const maxDefending = parseInt((resolvedParams.max_defending as string) || '99', 10);
  const minPhysic = parseInt((resolvedParams.min_physic as string) || '0', 10);
  const maxPhysic = parseInt((resolvedParams.max_physic as string) || '99', 10);

  // Build SQL conditions
  const conditions: string[] = [];
  const queryParams: any[] = [];

  conditions.push("overall >= ? AND overall <= ?");
  queryParams.push(minOverall, maxOverall);

  conditions.push("potential >= ? AND potential <= ?");
  queryParams.push(minPotential, maxPotential);

  conditions.push("age >= ? AND age <= ?");
  queryParams.push(minAge, maxAge);

  if (minWage === 0) {
    conditions.push("(wage_eur >= ? AND wage_eur <= ? OR wage_eur IS NULL)");
    queryParams.push(minWage, maxWage);
  } else {
    conditions.push("wage_eur >= ? AND wage_eur <= ?");
    queryParams.push(minWage, maxWage);
  }

  if (minValue === 0) {
    conditions.push("(value_eur >= ? AND value_eur <= ? OR value_eur IS NULL)");
    queryParams.push(minValue, maxValue);
  } else {
    conditions.push("value_eur >= ? AND value_eur <= ?");
    queryParams.push(minValue, maxValue);
  }

  // Skills
  conditions.push("IFNULL(pace, 0) >= ? AND IFNULL(pace, 0) <= ?");
  queryParams.push(minPace, maxPace);
  conditions.push("IFNULL(shooting, 0) >= ? AND IFNULL(shooting, 0) <= ?");
  queryParams.push(minShooting, maxShooting);
  conditions.push("IFNULL(passing, 0) >= ? AND IFNULL(passing, 0) <= ?");
  queryParams.push(minPassing, maxPassing);
  conditions.push("IFNULL(dribbling, 0) >= ? AND IFNULL(dribbling, 0) <= ?");
  queryParams.push(minDribbling, maxDribbling);
  conditions.push("IFNULL(defending, 0) >= ? AND IFNULL(defending, 0) <= ?");
  queryParams.push(minDefending, maxDefending);
  conditions.push("IFNULL(physic, 0) >= ? AND IFNULL(physic, 0) <= ?");
  queryParams.push(minPhysic, maxPhysic);

  if (search) {
    conditions.push("(short_name LIKE ? OR long_name LIKE ?)");
    queryParams.push(`%${search}%`, `%${search}%`);
  }

  if (position) {
    if (['FWD', 'DEF', 'MID', 'GK'].includes(position)) {
      if (position === 'GK') {
        conditions.push("player_positions LIKE '%GK%'");
      } else if (position === 'DEF') {
        conditions.push("(player_positions LIKE '%CB%' OR player_positions LIKE '%LB%' OR player_positions LIKE '%RB%' OR player_positions LIKE '%LWB%' OR player_positions LIKE '%RWB%')");
      } else if (position === 'MID') {
        conditions.push("(player_positions LIKE '%CM%' OR player_positions LIKE '%CDM%' OR player_positions LIKE '%CAM%' OR player_positions LIKE '%LM%' OR player_positions LIKE '%RM%')");
      } else if (position === 'FWD') {
        conditions.push("(player_positions LIKE '%ST%' OR player_positions LIKE '%CF%' OR player_positions LIKE '%LW%' OR player_positions LIKE '%RW%' OR player_positions LIKE '%LF%' OR player_positions LIKE '%RF%')");
      }
    } else {
      conditions.push("(',' || player_positions || ',') LIKE ?");
      queryParams.push(`%, ${position},%`);
    }
  }

  if (club) {
    conditions.push("club_name = ?");
    queryParams.push(club);
  }

  // Contract & Preset filters
  const contractExpiry = (resolvedParams.contract_expiry as string) || (resolvedParams.max_contract_year as string) || '';
  const isFreeAgent = resolvedParams.is_free_agent === 'true' || resolvedParams.free_agent === 'true';
  const preset = (resolvedParams.preset as string) || '';

  if (isFreeAgent) {
    conditions.push("(club_name IS NULL OR club_name = '' OR club_name = 'Free Agent')");
  }

  if (contractExpiry) {
    const year = parseInt(contractExpiry, 10);
    if (!isNaN(year)) {
      conditions.push("club_contract_valid_until_year <= ? AND club_name IS NOT NULL AND club_name != ''");
      queryParams.push(year);
    }
  }

  if (preset === 'wonderkids') {
    conditions.push("age <= 21 AND potential >= 80");
  } else if (preset === 'bargain') {
    conditions.push("value_eur <= 10000000 AND overall >= 75 AND value_eur > 0");
  } else if (preset === 'free_transfers') {
    conditions.push("(club_name IS NULL OR club_name = '' OR club_name = 'Free Agent')");
  } else if (preset === 'expiring') {
    conditions.push("club_contract_valid_until_year <= 2024 AND club_name IS NOT NULL AND club_name != ''");
  }

  if (league) {
    conditions.push("league_name = ?");
    queryParams.push(league);
  }

  if (nationality) {
    conditions.push("nationality_name = ?");
    queryParams.push(nationality);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Get total count
  const countResult = db.prepare(`SELECT COUNT(*) as total FROM players ${whereClause}`).get(...queryParams) as { total: number };
  const total = countResult?.total || 0;

  // Get players
  const selectCols = 'player_id, short_name, long_name, player_positions, overall, potential, value_eur, wage_eur, age, club_name, league_name, nationality_name, pace, shooting, passing, dribbling, defending, physic, preferred_foot, skill_moves, weak_foot, club_contract_valid_until_year, release_clause_eur, player_traits, player_tags, work_rate, body_type, club_loaned_from';
  const players = db.prepare(`
    SELECT ${selectCols} 
    FROM players 
    ${whereClause} 
    ORDER BY ${finalSortBy} ${sortOrder} 
    LIMIT ? OFFSET ?
  `).all(...queryParams, limit, offset) as Player[];

  // Fetch filter metadata (clubs, leagues, nationalities, leagueClubs)
  const clubsResult = db.prepare(`SELECT DISTINCT club_name FROM players WHERE club_name IS NOT NULL AND club_name != '' ORDER BY club_name ASC`).all() as { club_name: string }[];
  const leaguesResult = db.prepare(`SELECT DISTINCT league_name FROM players WHERE league_name IS NOT NULL AND league_name != '' ORDER BY league_name ASC`).all() as { league_name: string }[];
  const nationsResult = db.prepare(`SELECT DISTINCT nationality_name FROM players WHERE nationality_name IS NOT NULL AND nationality_name != '' ORDER BY nationality_name ASC`).all() as { nationality_name: string }[];
  const leagueClubsResult = db.prepare(`SELECT DISTINCT club_name, league_name FROM players WHERE club_name IS NOT NULL AND club_name != '' AND league_name IS NOT NULL AND league_name != '' ORDER BY club_name ASC`).all() as { club_name: string; league_name: string }[];

  const leagueClubs: Record<string, string[]> = {};
  leagueClubsResult.forEach(row => {
    if (!leagueClubs[row.league_name]) {
      leagueClubs[row.league_name] = [];
    }
    leagueClubs[row.league_name].push(row.club_name);
  });

  const metadata = {
    clubs: clubsResult.map(c => c.club_name),
    leagues: leaguesResult.map(l => l.league_name),
    nationalities: nationsResult.map(n => n.nationality_name),
    leagueClubs
  };

  const pagination = {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };

  return (
    <div className="content-area">
      <div className="scouting-layout">
        <ScoutingClient 
          initialPlayers={players} 
          metadata={metadata} 
          pagination={pagination} 
          searchParams={resolvedParams}
        />
      </div>
    </div>
  );
}
