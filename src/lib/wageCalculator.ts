export interface WageParams {
  overall: number;
  potential: number;
  age: number;
  internationalReputation: number; // 1 to 5
  leagueName: string;
  position: string; // e.g. ST, CB, CM, GK
}

export function getLeagueTier(league: string): number {
  if (league === 'Premier League') {
    return 1;
  } else if (['La Liga', 'Serie A', 'Ligue 1', 'Bundesliga'].includes(league)) {
    return 2;
  } else if ([
    'Championship', 'Pro League', 'Super Lig', 'Jupiler Pro League', 
    'Premiership', 'Liga Profesional', '2. Bundesliga', 'Liga Portugal', 
    'Superliga', 'Eredivisie', 'La Liga 2'
  ].includes(league)) {
    return 3;
  }
  return 4;
}

export function getGeneralPosition(pos: string): 'GK' | 'DEF' | 'MID' | 'FWD' {
  if (!pos) return 'MID';
  const p = pos.split(',')[0].trim().toUpperCase();
  if (p === 'GK') return 'GK';
  if (['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(p)) return 'DEF';
  if (['CM', 'CDM', 'CAM', 'LM', 'RM'].includes(p)) return 'MID';
  if (['ST', 'CF', 'LW', 'RW', 'LF', 'RF'].includes(p)) return 'FWD';
  return 'MID';
}

export function calculateEstimatedWage(params: WageParams): number {
  const { overall, potential, age, internationalReputation, leagueName, position } = params;
  
  const tier = getLeagueTier(leagueName);
  let leagueMod = 0;
  if (tier === 1) leagueMod = 1.753978;
  else if (tier === 2) leagueMod = 1.287846;
  else if (tier === 3) leagueMod = 0.850702;
  
  const genPos = getGeneralPosition(position);
  let posMod = 0;
  if (genPos === 'DEF') posMod = -0.177837;
  else if (genPos === 'MID') posMod = -0.148725;
  else if (genPos === 'GK') posMod = -0.364570;
  
  const logWage = 1.821668
    + 0.139067 * overall
    - 0.041871 * potential
    - 0.025183 * age
    + 0.302240 * internationalReputation
    + leagueMod
    + posMod;
    
  const rawWage = Math.exp(logWage);
  
  const minWage = 500;
  if (rawWage < minWage) return minWage;
  
  // Custom rounding to make it look clean like in-game contracts
  if (rawWage > 100000) {
    return Math.round(rawWage / 1000) * 1000;
  } else if (rawWage > 10000) {
    return Math.round(rawWage / 500) * 500;
  } else {
    return Math.round(rawWage / 250) * 250;
  }
}
