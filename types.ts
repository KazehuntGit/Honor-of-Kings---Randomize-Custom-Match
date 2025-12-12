
export enum Role {
  CLASH = 'Clash Lane',
  JUNGLE = 'Jungler',
  MID = 'Mid Lane',
  FARM = 'Farm Lane',
  ROAM = 'Roam',
  COACH = 'Coach',
}

export interface PlayerStats {
  matchesPlayed: number;
  wins: number;
  currentStreak: number;
  maxStreak: number;
}

export interface Player {
  id: string;
  name: string;
  roles: Role[]; 
  isAllRoles: boolean;
  isActive: boolean; // Menandakan apakah pemain ikut match kali ini
  isLastMatchMvp?: boolean; // New: Tracks if player was MVP in the specific last match
  stats: PlayerStats;
}

export interface TeamSlot {
  role: Role;
  player: Player;
}

export interface MatchResult {
  roomId: string;
  azureTeam: TeamSlot[];
  crimsonTeam: TeamSlot[];
  isCoachMode: boolean;
  timestamp: number;
}

export interface MatchHistoryEntry extends MatchResult {
  id: string;
  winningTeam: 'azure' | 'crimson' | null; // null means draw or abandoned
  mvpId?: string; // Track who was MVP in history
  ratings?: Record<string, number>; // 2 (Excellent), 1 (Good), -1 (Bad), -2 (Very Bad)
}
