import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = (page - 1) * limit;
    
    // Sort
    const sortBy = searchParams.get('sort_by') || 'overall';
    const sortOrder = (searchParams.get('sort_order') || 'desc').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    
    // Validate sort column to prevent SQL injection
    const allowedSortCols = ['overall', 'potential', 'value_eur', 'wage_eur', 'age', 'short_name', 'long_name'];
    const finalSortBy = allowedSortCols.includes(sortBy) ? sortBy : 'overall';
    
    // Filters
    const ids = searchParams.get('ids') || '';
    const search = searchParams.get('search') || '';
    const position = searchParams.get('position') || '';
    const club = searchParams.get('club') || '';
    const league = searchParams.get('league') || '';
    const nationality = searchParams.get('nationality') || '';
    
    // Ranges
    const minOverall = parseInt(searchParams.get('min_overall') || '0', 10);
    const maxOverall = parseInt(searchParams.get('max_overall') || '99', 10);
    const minPotential = parseInt(searchParams.get('min_potential') || '0', 10);
    const maxPotential = parseInt(searchParams.get('max_potential') || '99', 10);
    const minAge = parseInt(searchParams.get('min_age') || '15', 10);
    const maxAge = parseInt(searchParams.get('max_age') || '50', 10);
    const minWage = parseInt(searchParams.get('min_wage') || '0', 10);
    const maxWage = parseInt(searchParams.get('max_wage') || '1000000', 10);
    const minValue = parseInt(searchParams.get('min_value') || '0', 10);
    const maxValue = parseInt(searchParams.get('max_value') || '300000000', 10);
    
    // Skill filters
    const minPace = parseInt(searchParams.get('min_pace') || '0', 10);
    const maxPace = parseInt(searchParams.get('max_pace') || '99', 10);
    const minShooting = parseInt(searchParams.get('min_shooting') || '0', 10);
    const maxShooting = parseInt(searchParams.get('max_shooting') || '99', 10);
    const minPassing = parseInt(searchParams.get('min_passing') || '0', 10);
    const maxPassing = parseInt(searchParams.get('max_passing') || '99', 10);
    const minDribbling = parseInt(searchParams.get('min_dribbling') || '0', 10);
    const maxDribbling = parseInt(searchParams.get('max_dribbling') || '99', 10);
    const minDefending = parseInt(searchParams.get('min_defending') || '0', 10);
    const maxDefending = parseInt(searchParams.get('max_defending') || '99', 10);
    const minPhysic = parseInt(searchParams.get('min_physic') || '0', 10);
    const maxPhysic = parseInt(searchParams.get('max_physic') || '99', 10);
    
    // Build query conditions
    const conditions: string[] = [];
    const params: any[] = [];
    
    // IDs filter (for shortlist)
    if (ids) {
      const idArray = ids.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id));
      if (idArray.length > 0) {
        conditions.push(`player_id IN (${idArray.map(() => '?').join(',')})`);
        params.push(...idArray);
      }
    }
    
    // Range conditions
    conditions.push("overall >= ? AND overall <= ?");
    params.push(minOverall, maxOverall);
    
    conditions.push("potential >= ? AND potential <= ?");
    params.push(minPotential, maxPotential);
    
    conditions.push("age >= ? AND age <= ?");
    params.push(minAge, maxAge);
    
    // Handle NULL values in wage_eur and value_eur if searching from 0
    if (minWage === 0) {
      conditions.push("(wage_eur >= ? AND wage_eur <= ? OR wage_eur IS NULL)");
      params.push(minWage, maxWage);
    } else {
      conditions.push("wage_eur >= ? AND wage_eur <= ?");
      params.push(minWage, maxWage);
    }
    
    if (minValue === 0) {
      conditions.push("(value_eur >= ? AND value_eur <= ? OR value_eur IS NULL)");
      params.push(minValue, maxValue);
    } else {
      conditions.push("value_eur >= ? AND value_eur <= ?");
      params.push(minValue, maxValue);
    }

    // Skills (handling null values as 0)
    conditions.push("(IFNULL(pace, 0) >= ? AND IFNULL(pace, 0) <= ?)");
    params.push(minPace, maxPace);
    conditions.push("(IFNULL(shooting, 0) >= ? AND IFNULL(shooting, 0) <= ?)");
    params.push(minShooting, maxShooting);
    conditions.push("(IFNULL(passing, 0) >= ? AND IFNULL(passing, 0) <= ?)");
    params.push(minPassing, maxPassing);
    conditions.push("(IFNULL(dribbling, 0) >= ? AND IFNULL(dribbling, 0) <= ?)");
    params.push(minDribbling, maxDribbling);
    conditions.push("(IFNULL(defending, 0) >= ? AND IFNULL(defending, 0) <= ?)");
    params.push(minDefending, maxDefending);
    conditions.push("(IFNULL(physic, 0) >= ? AND IFNULL(physic, 0) <= ?)");
    params.push(minPhysic, maxPhysic);
    
    // Text search
    if (search) {
      conditions.push("(short_name LIKE ? OR long_name LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }
    
    // Position filter (GK, DEF, MID, FWD or specific position)
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
        // Specific position (e.g. ST)
        conditions.push("(',' || player_positions || ',') LIKE ?");
        params.push(`%, ${position},%`); // Note: positions are space-separated or comma-separated, like "ST, LW"
      }
    }
    
    if (club) {
      conditions.push("club_name = ?");
      params.push(club);
    }
    
    if (league) {
      conditions.push("league_name = ?");
      params.push(league);
    }
    
    if (nationality) {
      conditions.push("nationality_name = ?");
      params.push(nationality);
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    // Query total count
    const countQuery = `SELECT COUNT(*) as total FROM players ${whereClause}`;
    const totalResult = db.prepare(countQuery).get(...params) as { total: number };
    const total = totalResult?.total || 0;
    
    // Query data
    const selectCols = 'player_id, short_name, long_name, player_positions, overall, potential, value_eur, wage_eur, age, club_name, league_name, nationality_name, pace, shooting, passing, dribbling, defending, physic, preferred_foot, skill_moves, weak_foot';
    const dataQuery = `
      SELECT ${selectCols} 
      FROM players 
      ${whereClause} 
      ORDER BY ${finalSortBy} ${sortOrder} 
      LIMIT ? OFFSET ?
    `;
    const players = db.prepare(dataQuery).all(...params, limit, offset);
    
    return NextResponse.json({
      players,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error("API error in /api/players:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
