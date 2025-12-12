import React, { useState } from 'react';
import { MatchResult, TeamSlot, Role, Player } from '../types';
import { RoleIcons, ROLES_ORDER } from '../constants';
import { Button } from './Button';
import { SpinWheel } from './SpinWheel';
import { PortalTransition } from './PortalTransition';
import { MatchSummary } from './MatchSummary';
import { VictoryCelebration } from './VictoryCelebration';
import { EvaluationScreen } from './EvaluationScreen';

interface MatchDisplayProps {
  match: MatchResult;
  activePlayers: Player[]; 
  onReset: () => void; // For Abort
  onCompleteMatch: (winner: 'azure' | 'crimson' | null, mvpId?: string, ratings?: Record<string, number>) => void; // For Finish
  onReroll: (team: 'azure' | 'crimson', role: Role, newPlayer: Player) => void;
}

type ViewState = 'drafting' | 'transition' | 'final' | 'celebration' | 'evaluation';

export const MatchDisplay: React.FC<MatchDisplayProps> = ({ match, activePlayers, onReset, onCompleteMatch, onReroll }) => {
  const [viewState, setViewState] = useState<ViewState>('drafting');
  const [winningTeam, setWinningTeam] = useState<'azure' | 'crimson' | null>(null);
  
  // Dynamic Role Order: If Coach mode, append Coach to standard order
  const displayRoles = match.isCoachMode ? [...ROLES_ORDER, Role.COACH] : ROLES_ORDER;

  // -1: Not started
  // 0-4: Revealing pairs (0=Clash, ... 4=Roam)
  // 5: Coach (if exists)
  const [currentRoleIndex, setCurrentRoleIndex] = useState(-1);
  
  // New State for the Modal Wheel
  const [wheelState, setWheelState] = useState<{
    isOpen: boolean;
    type: 'draft' | 'reroll'; // Differentiate between initial draft reveal and manual reroll
    team: 'azure' | 'crimson';
    role: Role;
    winnerName: string;
    winnerPlayer?: Player; // Needed for reroll
    candidates: string[];
  } | null>(null);

  // Tracks which individual cards are visible
  const [revealedCards, setRevealedCards] = useState<Set<string>>(new Set());

  const getPlayerForRole = (team: TeamSlot[], role: Role) => {
    return team.find(slot => slot.role === role);
  };

  const getCardId = (team: 'azure' | 'crimson', role: Role) => `${team}-${role}`;

  const handleNext = () => {
    const nextIndex = currentRoleIndex + 1;
    if (nextIndex >= displayRoles.length) return;
    
    const roleToReveal = displayRoles[nextIndex];
    
    // Step 1: Check if Azure is revealed
    const azureId = getCardId('azure', roleToReveal);
    if (!revealedCards.has(azureId)) {
      startWheel('azure', roleToReveal);
      return;
    }

    // Step 2: Check if Crimson is revealed
    const crimsonId = getCardId('crimson', roleToReveal);
    if (!revealedCards.has(crimsonId)) {
      startWheel('crimson', roleToReveal);
      return;
    }
  };

  const handleSkipAll = () => {
    // Debug: Instantly reveal everything
    const allCards = new Set<string>();
    displayRoles.forEach(r => {
      allCards.add(getCardId('azure', r));
      allCards.add(getCardId('crimson', r));
    });
    setRevealedCards(allCards);
    setCurrentRoleIndex(displayRoles.length); // Set to finished state
  };

  const startWheel = (team: 'azure' | 'crimson', role: Role) => {
    const teamSlots = team === 'azure' ? match.azureTeam : match.crimsonTeam;
    const winner = getPlayerForRole(teamSlots, role)?.player;
    if (!winner) return;

    // Get candidates for the wheel
    // STRICT COACH LOGIC: If role is Coach, ONLY allow players with Coach role.
    const candidates = activePlayers
      .filter(p => {
          if (role === Role.COACH) {
              return p.roles.includes(Role.COACH);
          }
          return p.isAllRoles || p.roles.includes(role);
      })
      .map(p => p.name);

    setWheelState({
      isOpen: true,
      type: 'draft',
      team,
      role,
      winnerName: winner.name,
      candidates
    });
  };

  // Triggered when user clicks the re-roll button on a card
  const handleRerollClick = (team: 'azure' | 'crimson', role: Role) => {
    const azureIds = new Set(match.azureTeam.map(s => s.player.id));
    const crimsonIds = new Set(match.crimsonTeam.map(s => s.player.id));
    
    const benchPlayers = activePlayers.filter(p => !azureIds.has(p.id) && !crimsonIds.has(p.id));

    if (benchPlayers.length === 0) {
      alert("No available bench players to re-roll with!");
      return;
    }

    const candidates = benchPlayers.filter(p => {
       if (role === Role.COACH) {
          return p.roles.includes(Role.COACH);
       }
       return p.isAllRoles || p.roles.includes(role);
    });

    if (candidates.length === 0) {
       alert(`No available bench players found for role: ${role}`);
       return;
    }

    const newPlayer = candidates[Math.floor(Math.random() * candidates.length)];
    const candidateNames = candidates.map(p => p.name);

    setWheelState({
        isOpen: true,
        type: 'reroll',
        team,
        role,
        winnerName: newPlayer.name,
        winnerPlayer: newPlayer,
        candidates: candidateNames
    });
  };

  const handleWheelComplete = () => {
    if (!wheelState) return;

    if (wheelState.type === 'draft') {
        const { team, role } = wheelState;
        setRevealedCards(prev => new Set(prev).add(getCardId(team, role)));
        if (team === 'crimson') {
           setCurrentRoleIndex(prev => prev + 1);
        }
    } else if (wheelState.type === 'reroll' && wheelState.winnerPlayer) {
        onReroll(wheelState.team, wheelState.role, wheelState.winnerPlayer);
    }

    setWheelState(null);
  };

  const handleWheelCancel = () => {
    setWheelState(null);
  };

  const handleInitializeBattle = () => {
    setViewState('transition');
  };

  const handleTransitionComplete = () => {
    setViewState('final');
  };

  const handleMatchDecided = (winner: 'azure' | 'crimson' | null) => {
    if (winner) {
      setWinningTeam(winner);
      setViewState('celebration');
    } else {
      onCompleteMatch(null);
    }
  };

  const handleCelebrationDismiss = () => {
    setViewState('evaluation');
  };

  const handleEvaluationComplete = (mvpId?: string, ratings?: Record<string, number>) => {
    onCompleteMatch(winningTeam, mvpId, ratings);
  }

  // --- RENDER LOGIC ---

  if (viewState === 'evaluation' && winningTeam) {
    return (
      <EvaluationScreen 
        match={match} 
        winner={winningTeam} 
        onComplete={handleEvaluationComplete} 
      />
    );
  }

  if (viewState === 'celebration' && winningTeam) {
    const winningTeamSlots = winningTeam === 'azure' ? match.azureTeam : match.crimsonTeam;
    return (
      <VictoryCelebration 
        winner={winningTeam} 
        teamSlots={winningTeamSlots}
        onDismiss={handleCelebrationDismiss} 
      />
    );
  }

  if (viewState === 'transition') {
    return (
      <PortalTransition 
        azureTeam={match.azureTeam} 
        crimsonTeam={match.crimsonTeam} 
        onComplete={handleTransitionComplete} 
      />
    );
  }

  if (viewState === 'final') {
    return <MatchSummary match={match} onReset={handleMatchDecided} />;
  }

  // --- DRAFTING VIEW ---

  const renderPlayerCard = (role: Role, roleIndex: number, team: 'azure' | 'crimson') => {
    const teamSlots = team === 'azure' ? match.azureTeam : match.crimsonTeam;
    const player = getPlayerForRole(teamSlots, role)?.player;
    const isRevealed = revealedCards.has(getCardId(team, role));
    const isCoach = role === Role.COACH;

    // HoK Color Palettes
    // If Coach, override with Special White/Silver Theme
    let theme;
    if (isCoach) {
        theme = {
            bg: 'bg-[#1a1a1a]',
            border: 'border-white',
            glow: 'shadow-[0_0_20px_rgba(255,255,255,0.8)]',
            text: 'text-white',
            gradient: 'from-white/20 to-transparent'
        };
    } else {
        theme = team === 'azure' 
          ? {
              bg: 'bg-[#0a1a2f]',
              border: 'border-hok-cyan',
              glow: 'shadow-[0_0_10px_#00d2ff]',
              text: 'text-hok-cyan',
              gradient: 'from-[#00d2ff]/20 to-transparent'
            } 
          : {
              bg: 'bg-[#1a0505]',
              border: 'border-hok-red',
              glow: 'shadow-[0_0_10px_#ef4444]',
              text: 'text-hok-red',
              gradient: 'from-[#c02d2d]/20 to-transparent'
            };
    }

    // State 1: Hidden
    if (!isRevealed) {
       return (
         <div className="h-16 w-full relative overflow-hidden clip-corner-md border border-[#1e3a5f] bg-[#05090f]/80 flex flex-col items-center justify-center opacity-40 group">
            <div className="text-[#1e3a5f] group-hover:text-[#dcb06b]/50 transition-colors duration-500 transform scale-90 opacity-50">
               {RoleIcons[role]}
            </div>
            {/* Tech Scanlines */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz4KPHBhdGggZD0iTTAgNEw0IDBaIiBzdHJva2U9IiMwMDAiIHN0cm9rZS13aWR0aD0iMSIvPgo8L3N2Zz4=')] opacity-20"></div>
         </div>
       );
    }

    // State 2: Revealed (UPDATED LAYOUT FOR TEXT ROLES & MIRRORING)
    return (
      <div className={`relative h-16 w-full animate-slide-in perspective-container group`}>
        <div className={`
            absolute inset-0 clip-corner-md border-l-4 tilt-card
            ${theme.bg} ${theme.border} 
            ${theme.glow}
            shadow-[0_0_15px_rgba(0,0,0,0.5)]
            transition-all duration-300 hover:brightness-110
        `}>
           <div className={`flex flex-col h-full relative z-10 px-4 py-1 justify-center ${team === 'crimson' ? 'items-end text-right' : 'items-start text-left'}`}>
             
             {/* Text Role Label (Top) */}
             <div className={`mb-0.5 px-2 py-0.5 rounded-sm bg-black/40 border border-white/10 ${theme.text} transform transition-transform duration-500 w-auto inline-block scale-90 origin-${team === 'crimson' ? 'right' : 'left'}`}>
                {RoleIcons[role]}
             </div>

             {/* Name Section */}
             <span className={`block text-lg md:text-xl font-bold text-white truncate font-orbitron drop-shadow-md w-full`}>
                {player?.name}
             </span>

             <div className={`absolute inset-0 bg-gradient-to-r ${theme.gradient} opacity-50 pointer-events-none`}></div>
           </div>
           
           {/* Decorative Tech Corners */}
           <div className={`absolute top-0 w-8 h-8 border-t border-${isCoach ? 'white' : (team === 'azure' ? 'cyan' : 'red')}-500/50 ${team === 'azure' ? 'left-0' : 'right-0'}`}></div>
           <div className={`absolute bottom-0 w-8 h-8 border-b border-${isCoach ? 'white' : (team === 'azure' ? 'cyan' : 'red')}-500/50 ${team === 'azure' ? 'right-0' : 'left-0'}`}></div>

           {/* Re-roll Button Overlay - Mirrored Position */}
           {/* If Azure (Left Align): Button on Right. If Crimson (Right Align): Button on Left */}
           <button 
             onClick={(e) => { e.stopPropagation(); handleRerollClick(team, role); }}
             className={`absolute top-1 p-1.5 bg-black/50 hover:bg-[#dcb06b] rounded-full transition-colors group-hover:opacity-100 opacity-0 text-white hover:text-black z-50 border border-white/20
                ${team === 'azure' ? 'right-2' : 'left-2'}
             `}
             title="Re-roll this specific slot"
           >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
             </svg>
           </button>
        </div>
      </div>
    );
  };

  const nextRoleIndex = currentRoleIndex + 1;
  const nextRoleName = nextRoleIndex < displayRoles.length ? displayRoles[nextRoleIndex] : null;
  const isFinished = currentRoleIndex >= displayRoles.length - 1 && revealedCards.size === (match.isCoachMode ? 12 : 10);
  
  let buttonText = "START DRAFT";
  if (nextRoleName) {
     if (!revealedCards.has(getCardId('azure', nextRoleName))) {
        buttonText = `SELECT AZURE ${nextRoleName.split(' ')[0].toUpperCase()}`;
     } else if (!revealedCards.has(getCardId('crimson', nextRoleName))) {
        buttonText = `SELECT CRIMSON ${nextRoleName.split(' ')[0].toUpperCase()}`;
     } else {
        buttonText = "NEXT LANE";
     }
  }

  // Turret SVG Path
  const TurretIcon = (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-16 h-16 opacity-30 animate-pulse">
        <path d="M12,2 L2,22 L12,18 L22,22 L12,2 Z" />
        <path d="M12,5 L5,20 L12,17 L19,20 L12,5 Z" fillOpacity="0.5" />
    </svg>
  );

  return (
    <>
      {/* The Spin Wheel Overlay */}
      {wheelState && wheelState.isOpen && (
        <SpinWheel 
          candidates={wheelState.candidates}
          winnerName={wheelState.winnerName}
          team={wheelState.team}
          roleName={wheelState.role}
          roomId={match.roomId}
          onComplete={handleWheelComplete}
          onCancel={handleWheelCancel}
        />
      )}

      <div className="w-full max-w-7xl mx-auto px-4 py-8 pb-32 relative">
        
        {/* Top Controls: Abort & Instant Result */}
        <div className="absolute top-4 left-4 right-4 z-40 flex justify-between">
           <Button variant="outline" size="sm" onClick={() => onReset()} className="border-red-900/50 text-red-500 hover:bg-red-900/20 text-[10px] px-3">
              <span className="flex items-center gap-2">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z" />
                 </svg>
                 ABORT DRAFT
              </span>
           </Button>

           {/* Debug / Instant Result Button */}
           {!isFinished && (
             <Button variant="outline" size="sm" onClick={handleSkipAll} className="border-[#dcb06b]/50 text-[#dcb06b] hover:bg-[#dcb06b]/10 text-[10px] px-3">
                <span className="flex items-center gap-2">
                   INSTANT RESULT (DEBUG)
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                   </svg>
                </span>
             </Button>
           )}
        </div>

        {/* Header Info - PERFECTLY CENTERED */}
        <div className="flex flex-col items-center mb-6 pt-8">
           <div className="flex justify-center w-full mb-4">
              <div className="bg-[#05090f] border border-[#dcb06b]/40 px-8 py-2 clip-diamond relative shadow-[0_0_15px_rgba(220,176,107,0.2)]">
                  <div className="absolute inset-0 bg-[#dcb06b]/5 pointer-events-none"></div>
                  <span className="text-[#dcb06b] font-cinzel font-bold text-xs tracking-widest uppercase block text-center">Room ID</span>
                  <span className="text-xl font-orbitron font-bold text-white tracking-widest text-center block">{match.roomId}</span>
              </div>
           </div>

           <div className="flex justify-between items-center w-full relative max-w-5xl">
              <div className="w-1/3 text-center relative group">
                 <div className="absolute -inset-4 bg-cyan-500/10 blur-xl rounded-full opacity-50 group-hover:opacity-100 transition-opacity"></div>
                 <div className="absolute -left-10 top-0 text-cyan-500/20">{TurretIcon}</div>
                 <h2 className="relative text-2xl md:text-4xl font-cinzel font-black text-transparent bg-clip-text bg-gradient-to-b from-cyan-200 to-cyan-600 drop-shadow-[0_0_15px_rgba(6,182,212,0.8)]">
                  AZURE
                 </h2>
                 <p className="text-[10px] md:text-xs text-cyan-400 font-orbitron tracking-[0.4em] mt-1 opacity-70">GOLEM TEAM</p>
                 <div className="h-1 w-24 bg-cyan-500 mx-auto mt-2 shadow-[0_0_10px_#00d2ff]"></div>
              </div>

              <div className="w-1/3 flex justify-center items-center z-10">
                <div className="relative w-20 h-20 md:w-28 md:h-28 flex items-center justify-center">
                  <div className="absolute inset-0 border-2 border-[#dcb06b] rotate-45 animate-spin-slow bg-[#05090f]"></div>
                  <div className="absolute inset-2 border border-[#dcb06b]/50 rotate-45"></div>
                  <span className="text-3xl font-black italic text-[#dcb06b] font-orbitron z-10 pr-2 pt-1 animate-pulse-fast">VS</span>
                </div>
              </div>

              <div className="w-1/3 text-center relative group">
                 <div className="absolute -inset-4 bg-red-500/10 blur-xl rounded-full opacity-50 group-hover:opacity-100 transition-opacity"></div>
                 <div className="absolute -right-10 top-0 text-red-500/20 transform scale-x-[-1]">{TurretIcon}</div>
                 <h2 className="relative text-2xl md:text-4xl font-cinzel font-black text-transparent bg-clip-text bg-gradient-to-b from-red-200 to-red-600 drop-shadow-[0_0_15px_rgba(220,45,45,0.8)]">
                  CRIMSON
                 </h2>
                 <p className="text-[10px] md:text-xs text-red-400 font-orbitron tracking-[0.4em] mt-1 opacity-70">GOLEM TEAM</p>
                 <div className="h-1 w-24 bg-red-500 mx-auto mt-2 shadow-[0_0_10px_#ef4444]"></div>
              </div>
           </div>
        </div>

        {/* Matchup Grid - Compact Gaps */}
        <div className="relative space-y-2 md:space-y-3">
          <div className="absolute left-1/2 top-0 bottom-0 w-[2px] bg-gradient-to-b from-transparent via-[#dcb06b]/30 to-transparent hidden md:block"></div>
          
          {displayRoles.map((role, idx) => (
            <div key={role} className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-8 items-center">
               <div className="order-1 md:order-none">
                  {renderPlayerCard(role, idx, 'azure')}
               </div>
               <div className="order-2 md:order-none">
                  {renderPlayerCard(role, idx, 'crimson')}
               </div>
            </div>
          ))}
        </div>

        {/* Control Bar */}
        <div className="fixed bottom-0 left-0 right-0 p-8 z-50 flex justify-center items-end bg-gradient-to-t from-[#05090f] via-[#05090f]/90 to-transparent pointer-events-none h-48">
           <div className="pointer-events-auto transform transition-all hover:scale-105">
              {!isFinished ? (
                 <div className="flex flex-col items-center">
                    <button 
                      onClick={handleNext}
                      className="
                        group relative w-72 h-16
                        bg-[#0a1a2f] border border-[#dcb06b] 
                        clip-corner-md
                        flex items-center justify-center
                        text-[#dcb06b] font-cinzel font-bold text-xl tracking-widest
                        overflow-hidden
                        hover:bg-[#dcb06b] hover:text-[#05090f]
                        transition-all duration-300
                        shadow-[0_0_20px_rgba(220,176,107,0.2)]
                      "
                    >
                       <span className="relative z-10">
                         {buttonText}
                       </span>
                       <div className="absolute inset-0 w-full h-full bg-white/20 -translate-x-full group-hover:animate-[shimmer_1s_infinite]"></div>
                    </button>
                 </div>
              ) : (
                 <div className="flex flex-col items-center animate-slide-in">
                    <p className="text-[#00d2ff] font-bold mb-4 uppercase tracking-[0.3em] text-sm font-orbitron drop-shadow-[0_0_5px_rgba(0,210,255,0.8)]">
                       Draft Completed
                    </p>
                    <Button 
                      onClick={handleInitializeBattle} 
                      className="px-12 border-[#dcb06b] shadow-[0_0_20px_#dcb06b] animate-pulse"
                    >
                       INITIALIZE BATTLE
                    </Button>
                 </div>
              )}
           </div>
        </div>
      </div>
    </>
  );
};