import db from '@/lib/db';
import { notFound } from 'next/navigation';
import { calculateEstimatedWage } from '@/lib/wageCalculator';
import PlayerDetailClient from './PlayerDetailClient';

interface PlayerProps {
  params: Promise<{ id: string }>;
}

export default async function PlayerPage({ params }: PlayerProps) {
  const { id } = await params;
  const playerId = parseInt(id, 10);

  if (isNaN(playerId)) {
    notFound();
  }

  // Fetch player and join team details (like budget and club worth)
  const player = db.prepare(`
    SELECT 
      p.*, 
      t.transfer_budget_eur, 
      t.club_worth_eur,
      t.overall as team_overall,
      t.attack as team_attack,
      t.midfield as team_midfield,
      t.defence as team_defence
    FROM players p
    LEFT JOIN teams t ON p.club_team_id = t.team_id
    WHERE p.player_id = ?
  `).get(playerId) as any;

  if (!player) {
    notFound();
  }

  // Pre-calculate estimated wage
  const estimatedWage = calculateEstimatedWage({
    overall: player.overall,
    potential: player.potential,
    age: player.age,
    internationalReputation: player.international_reputation || 1,
    leagueName: player.league_name || 'Other',
    position: player.player_positions || 'CM'
  });

  return (
    <PlayerDetailClient player={player} estimatedWage={estimatedWage} />
  );
}
