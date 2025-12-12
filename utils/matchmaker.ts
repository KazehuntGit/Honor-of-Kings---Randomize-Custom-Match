import { Player, Role, TeamSlot, MatchResult } from '../types';
import { ROLES_ORDER } from '../constants';

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
const canPlay = (player: Player, role: Role): boolean => {
  // STRICT COACH MODE: Only players with the explicit COACH role can be assigned to Coach.
  // 'All Role' / 'Fill' players are NOT allowed to Coach unless they also explicitly selected Coach.
  if (role === Role.COACH) {
    return player.roles.includes(Role.COACH);
  }
  
  // For other roles, Allow if 'All Roles' is checked OR they have the specific role
  if (player.roles.includes(Role.COACH) && player.roles.length === 1 && !player.isAllRoles) {
     // If a player is ONLY a Coach and nothing else, they can't play lanes
     return false; 
  }

  if (player.isAllRoles) return true;
  return player.roles.includes(role);
};

export const generateMatch = (players: Player[], roomId: string, isCoachMode: boolean): MatchResult | null => {
  const requiredPlayers = isCoachMode ? 12 : 10;
  if (players.length < requiredPlayers) return null;

  // Define roles needed
  const neededRoles: { team: 'azure' | 'crimson', role: Role }[] = [];
  
  // 1. Standard Lanes
  ROLES_ORDER.forEach(role => neededRoles.push({ team: 'azure', role }));
  ROLES_ORDER.forEach(role => neededRoles.push({ team: 'crimson', role }));

  // 2. Coaches (if active)
  if (isCoachMode) {
    neededRoles.push({ team: 'azure', role: Role.COACH });
    neededRoles.push({ team: 'crimson', role: Role.COACH });
  }

  const totalSlots = neededRoles.length;
  
  // Shuffle pool deeply
  const pool = shuffle(players);

  const assignments: Map<number, Player> = new Map();
  const usedPlayerIds = new Set<string>();

  // Backtracking function
  const solve = (slotIndex: number): boolean => {
    // Base case: All slots filled
    if (slotIndex >= totalSlots) return true;

    const currentSlot = neededRoles[slotIndex];

    // Try to find a player from the pool for this slot
    for (const player of pool) {
      if (!usedPlayerIds.has(player.id)) {
        if (canPlay(player, currentSlot.role)) {
          // Assign
          assignments.set(slotIndex, player);
          usedPlayerIds.add(player.id);

          // Recurse
          if (solve(slotIndex + 1)) return true;

          // Backtrack
          assignments.delete(slotIndex);
          usedPlayerIds.delete(player.id);
        }
      }
    }
    return false;
  };

  // Run the solver
  if (solve(0)) {
    const azureTeam: TeamSlot[] = [];
    const crimsonTeam: TeamSlot[] = [];

    // Separate assignments into teams
    for (let i = 0; i < totalSlots; i++) {
        const slot = neededRoles[i];
        const player = assignments.get(i)!;
        
        if (slot.team === 'azure') {
            azureTeam.push({ role: slot.role, player });
        } else {
            crimsonTeam.push({ role: slot.role, player });
        }
    }

    // Sort teams to ensure standard order: Clash -> Jungle -> Mid -> Farm -> Roam -> (Coach)
    const roleOrderMap = [...ROLES_ORDER, Role.COACH]; // Coach is last
    const sortTeam = (a: TeamSlot, b: TeamSlot) => roleOrderMap.indexOf(a.role) - roleOrderMap.indexOf(b.role);
    
    azureTeam.sort(sortTeam);
    crimsonTeam.sort(sortTeam);

    return {
      roomId,
      azureTeam,
      crimsonTeam,
      isCoachMode,
      timestamp: Date.now(),
    };
  }

  return null; // Could not find a valid composition
};