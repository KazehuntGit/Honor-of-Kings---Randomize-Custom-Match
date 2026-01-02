
import { Player, Role, TeamSlot, MatchResult, BracketMatchResult, BracketTeam } from '../types';
import { ROLES_ORDER } from '../constants';

const BRACKET_NAMES = ["Alpha", "Beta", "Charlie", "Delta", "Echo", "Foxtrot", "Golf", "Hotel"];
const BRACKET_COLORS = [
  "#00d2ff", // Cyan
  "#ef4444", // Red
  "#fbbf24", // Gold
  "#a855f7", // Purple
  "#10b981", // Emerald
  "#f97316", // Orange
  "#ec4899", // Pink
  "#ffffff"  // White
];

export const TBD_PLAYER: Player = {
  id: 'tbd',
  name: '?',
  roles: [],
  isAllRoles: false,
  isActive: true,
  stats: { matchesPlayed: 0, wins: 0, currentStreak: 0, maxStreak: 0 }
};

// Fisher-Yates Shuffle for true randomness
function shuffle<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

// Check if a player can play a specific role
export const canPlay = (player: Player, role: Role): boolean => {
  if (player.id === 'tbd') return true;
  
  if (role === Role.COACH) {
    return player.roles.includes(Role.COACH);
  }
  
  if (player.roles.includes(Role.COACH) && player.roles.length === 1 && !player.isAllRoles) {
     return false; 
  }

  if (player.isAllRoles) return true;
  return player.roles.includes(role);
};

// Calculate versatility score 
// Lower score = Less flexible (Higher priority to pick)
// Higher score = More flexible (Can wait)
const getPlayerVersatility = (player: Player): number => {
  if (player.isAllRoles) return 6; // Treat "All Roles" as effectively 6 roles
  return player.roles.length;
};

// Helper function to sort players with "Noise"
// This prevents players with 1 role from ALWAYS being picked first if a 2-role player is available.
// It creates a "soft priority" instead of a "hard priority".
const noisySort = (a: Player, b: Player) => {
  // Add random noise (0.0 to 2.0) to the score
  // 1 Role Player: 1.0 to 3.0
  // 2 Role Player: 2.0 to 4.0
  // There is overlap! A 2-role player can sometimes be prioritized over a 1-role player.
  const scoreA = getPlayerVersatility(a) + (Math.random() * 2.5);
  const scoreB = getPlayerVersatility(b) + (Math.random() * 2.5);
  return scoreA - scoreB;
};

// Helper to get a random valid candidate from a pool
// Used heavily in Bracket JIT logic
export const getFlexibleCandidate = (pool: Player[], role: Role): Player | null => {
  let candidates = pool.filter(p => canPlay(p, role));
  
  if (candidates.length === 0) return null;
  
  // 1. Shuffle first to ensure candidates with EQUAL specs are random
  candidates = shuffle(candidates);
  
  // 2. If we have a healthy number of candidates (> 2), use the Noisy Sort.
  // This ensures that "Kazehunt" (e.g., Farm only) isn't ALWAYS picked immediately 
  // if "Player B" (Farm + Mid) is also available.
  if (candidates.length > 1) {
      candidates.sort(noisySort);
  }
  
  // Return the best fit (first one after sort)
  return candidates[0];
};

export const generateMatch = (players: Player[], roomId: string, isCoachMode: boolean): MatchResult | null => {
  const requiredPlayers = isCoachMode ? 12 : 10;
  if (players.length < requiredPlayers) return null;

  const neededRoles: { team: 'azure' | 'crimson', role: Role }[] = [];
  ROLES_ORDER.forEach(role => neededRoles.push({ team: 'azure', role }));
  ROLES_ORDER.forEach(role => neededRoles.push({ team: 'crimson', role }));

  if (isCoachMode) {
    neededRoles.push({ team: 'azure', role: Role.COACH });
    neededRoles.push({ team: 'crimson', role: Role.COACH });
  }

  const totalSlots = neededRoles.length;
  
  // Shuffle the pool initially
  let pool = shuffle(players);
  
  // Sort pool using Noisy Sort to allow variation in standard matches too
  // This prevents the same roster configuration every time a match is generated with the same 10 people
  pool.sort(noisySort);

  const assignments: Map<number, Player> = new Map();
  const usedPlayerIds = new Set<string>();

  const solve = (slotIndex: number): boolean => {
    if (slotIndex >= totalSlots) return true;
    const currentSlot = neededRoles[slotIndex];
    
    // Create a local randomized version of the pool for this specific slot check
    // This adds another layer of randomness during the backtracking process
    // We only shuffle players who are roughly equally eligible to avoid breaking constraints too much
    // But since we already noisy-sorted the main pool, simple iteration is usually fine.
    // However, iterating strictly can still lead to patterns.
    
    for (const player of pool) {
      if (!usedPlayerIds.has(player.id)) {
        if (canPlay(player, currentSlot.role)) {
          assignments.set(slotIndex, player);
          usedPlayerIds.add(player.id);
          if (solve(slotIndex + 1)) return true;
          assignments.delete(slotIndex);
          usedPlayerIds.delete(player.id);
        }
      }
    }
    return false;
  };

  if (solve(0)) {
    const azureTeam: TeamSlot[] = [];
    const crimsonTeam: TeamSlot[] = [];
    for (let i = 0; i < totalSlots; i++) {
        const slot = neededRoles[i];
        const player = assignments.get(i)!;
        if (slot.team === 'azure') azureTeam.push({ role: slot.role, player });
        else crimsonTeam.push({ role: slot.role, player });
    }
    const roleOrderMap = [...ROLES_ORDER, Role.COACH];
    const sortTeam = (a: TeamSlot, b: TeamSlot) => roleOrderMap.indexOf(a.role) - roleOrderMap.indexOf(b.role);
    azureTeam.sort(sortTeam);
    crimsonTeam.sort(sortTeam);
    return { roomId, azureTeam, crimsonTeam, isCoachMode, timestamp: Date.now() };
  }
  return null;
};

// --- BRACKET VALIDATION & GENERATION ---

// 1. Validator: Checks if it is theoretically possible to form teams
export const validateBracketPool = (players: Player[], numTeams: number): { valid: boolean; error?: string } => {
  const totalSlots = numTeams * 5;
  if (players.length < totalSlots) {
      return { valid: false, error: `INSUFFICIENT PLAYERS: Need ${totalSlots} active players for ${numTeams} teams. Current: ${players.length}` };
  }

  // Fast Fail: Check if each role has enough capable players
  for (const role of ROLES_ORDER) {
      const capablePlayers = players.filter(p => canPlay(p, role));
      if (capablePlayers.length < numTeams) {
          return { valid: false, error: `CRITICAL SHORTAGE: Need ${numTeams} players for ${role.toUpperCase()}, but only ${capablePlayers.length} are available.` };
      }
  }

  // Use the same logic as generation to ensure solvability
  const neededRoles: Role[] = [];
  ROLES_ORDER.forEach(role => {
      for(let i=0; i<numTeams; i++) neededRoles.push(role);
  });

  // Optimize: Sort roles by scarcity (hardest to fill first)
  const roleCounts: Record<string, number> = {};
  ROLES_ORDER.forEach(r => {
      roleCounts[r] = players.filter(p => canPlay(p, r)).length;
  });
  neededRoles.sort((a, b) => roleCounts[a] - roleCounts[b]);

  const usedIds = new Set<string>();

  const solve = (index: number): boolean => {
      if (index >= neededRoles.length) return true;
      const currentRole = neededRoles[index];

      // Optimization: Sort candidates by versatility (least flexible first)
      let candidates = players.filter(p => !usedIds.has(p.id) && canPlay(p, currentRole));
      candidates.sort((a, b) => getPlayerVersatility(a) - getPlayerVersatility(b));

      for (const player of candidates) {
          usedIds.add(player.id);
          if (solve(index + 1)) return true;
          usedIds.delete(player.id);
      }
      return false;
  };

  if (!solve(0)) {
      return { valid: false, error: "IMPOSSIBLE COMPOSITION: Unable to assign all roles validly with the current player pool constraints." };
  }

  return { valid: true };
};

// 2. Generator: Produces the actual assignment (No TBDs if validation passes)
export const generateBracketMatch = (players: Player[], roomId: string, numTeams: number): BracketMatchResult | null => {
  const totalSlots = numTeams * 5;
  if (players.length < totalSlots) return null;

  // Flatten needed slots: Team 0 [Roles], Team 1 [Roles]...
  const slotsToFill: { teamIdx: number, role: Role }[] = [];
  for(let i=0; i<numTeams; i++) {
      ROLES_ORDER.forEach(r => slotsToFill.push({ teamIdx: i, role: r }));
  }

  // Shuffle and Noisy Sort the pool for variety
  let pool = shuffle(players);
  pool.sort(noisySort);

  const assignments = new Map<number, Player>(); // index in slotsToFill -> Player
  const usedIds = new Set<string>();

  const solve = (idx: number): boolean => {
      if (idx >= slotsToFill.length) return true;
      const { role } = slotsToFill[idx];

      let candidates = pool.filter(p => !usedIds.has(p.id) && canPlay(p, role));
      candidates.sort((a, b) => getPlayerVersatility(a) - getPlayerVersatility(b));

      for (const p of candidates) {
          assignments.set(idx, p);
          usedIds.add(p.id);
          if (solve(idx + 1)) return true;
          usedIds.delete(p.id);
          assignments.delete(idx);
      }
      return false;
  };

  if (!solve(0)) return null;

  const teams: BracketTeam[] = [];
  
  for (let t = 0; t < numTeams; t++) {
    const teamSlots: TeamSlot[] = [];
    
    ROLES_ORDER.forEach(role => {
        // Find our specific assignment
        // slotsToFill is ordered by Team, then Role
        const rIdx = ROLES_ORDER.indexOf(role);
        const flatIdx = (t * 5) + rIdx;
        const player = assignments.get(flatIdx)!;
        teamSlots.push({ role, player });
    });
    
    teams.push({
      name: `TEAM ${BRACKET_NAMES[t]}`,
      slots: teamSlots,
      color: BRACKET_COLORS[t]
    });
  }
  
  return { roomId, teams, timestamp: Date.now() };
};
