import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Player, MatchResult, Role, MatchHistoryEntry } from './types';
import { PlayerForm } from './components/PlayerForm';
import { PlayerList } from './components/PlayerList';
import { MatchDisplay } from './components/MatchDisplay';
import { EditPlayerModal } from './components/EditPlayerModal';
import { HistoryList } from './components/HistoryList';
import { generateMatch } from './utils/matchmaker';
import { Button } from './components/Button';
import { BackgroundParticles } from './components/BackgroundParticles';

// Quick Fill Data: Honor of Kings Heroes
const HOK_HEROES = [
  { name: "Arthur", roles: [Role.CLASH] },
  { name: "Sun Ce", roles: [Role.CLASH, Role.JUNGLE] },
  { name: "Kaizer", roles: [Role.CLASH, Role.JUNGLE] },
  { name: "Biron", roles: [Role.CLASH] },
  { name: "Li Xin", roles: [Role.CLASH] },
  { name: "Charlotte", roles: [Role.CLASH] },
  { name: "Lam", roles: [Role.JUNGLE] },
  { name: "Prince of Lanling", roles: [Role.JUNGLE, Role.ROAM] },
  { name: "Wukong", roles: [Role.JUNGLE] },
  { name: "Li Bai", roles: [Role.JUNGLE] },
  { name: "Han Xin", roles: [Role.JUNGLE] },
  { name: "Luna", roles: [Role.JUNGLE, Role.MID] },
  { name: "Angela", roles: [Role.MID] },
  { name: "Diaochan", roles: [Role.MID] },
  { name: "Xiao Qiao", roles: [Role.MID] },
  { name: "Mai Shiranui", roles: [Role.MID, Role.JUNGLE] },
  { name: "Lady Zhen", roles: [Role.MID] },
  { name: "Milady", roles: [Role.MID] },
  { name: "Luban No.7", roles: [Role.FARM] },
  { name: "Marco Polo", roles: [Role.FARM] },
  { name: "Hou Yi", roles: [Role.FARM] },
  { name: "Consort Yu", roles: [Role.FARM] },
  { name: "Di Renjie", roles: [Role.FARM] },
  { name: "Arli", roles: [Role.FARM, Role.JUNGLE] },
  { name: "Dolia", roles: [Role.ROAM] },
  { name: "Kui", roles: [Role.ROAM] },
  { name: "Zhuangzi", roles: [Role.ROAM, Role.CLASH] },
  { name: "Zhang Fei", roles: [Role.ROAM] },
  { name: "Da Qiao", roles: [Role.ROAM, Role.MID] },
  { name: "Yaria", roles: [Role.ROAM] }
];

// --- UTILS FOR HASHING ---
const encodeState = (data: any): string => {
  try {
    const json = JSON.stringify(data);
    // Handle Unicode strings (names) safely for btoa
    return btoa(encodeURIComponent(json).replace(/%([0-9A-F]{2})/g,
        function toSolidBytes(match, p1) {
            return String.fromCharCode(parseInt(p1, 16));
    }));
  } catch (e) {
    console.error("Encoding error", e);
    return "";
  }
};

const decodeState = (str: string): any => {
  try {
    const decodedStr = decodeURIComponent(Array.prototype.map.call(atob(str), function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(decodedStr);
  } catch (e) {
    console.error("Decoding error", e);
    return null;
  }
};

type ViewMode = 'lobby' | 'match' | 'battle';

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('lobby');
  
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentMatch, setCurrentMatch] = useState<MatchResult | null>(null);
  const [matchHistory, setMatchHistory] = useState<MatchHistoryEntry[]>([]);
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string>('');
  const [isCoachMode, setIsCoachMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Edit State
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const rosterFileInputRef = useRef<HTMLInputElement>(null);
  const historyFileInputRef = useRef<HTMLInputElement>(null);

  // --- ROUTER & STATE SYNC ---

  // 1. Navigation Helper (Writes to URL)
  const navigate = useCallback((mode: ViewMode, data: any) => {
    const hash = encodeState(data);
    // Use replaceState to avoid cluttering history stack too much with every keystroke
    // But pushState is better for significant view changes.
    window.location.hash = `${mode}/${hash}`;
  }, []);

  // 2. Hash Listener (Reads from URL)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.substring(1); // Remove #
      if (!hash) {
         setViewMode('lobby');
         return;
      }

      // Format: mode/data
      const separatorIndex = hash.indexOf('/');
      if (separatorIndex === -1) return;

      const mode = hash.substring(0, separatorIndex) as ViewMode;
      const dataStr = hash.substring(separatorIndex + 1);
      const data = decodeState(dataStr);

      if (!data) return;

      if (mode === 'lobby') {
         setViewMode('lobby');
         if (Array.isArray(data)) {
            setPlayers(data);
            setCurrentMatch(null);
         }
      } else if (mode === 'match') {
         setViewMode('match');
         setCurrentMatch(data);
         // Restore players from match to keep context if needed, or rely on match data
         if (data.azureTeam && data.crimsonTeam) {
            // We don't strictly overwrite 'players' here to avoid losing bench players not in the match object
            // Ideally match object should contain bench, but for now we just render the match.
         }
      } else if (mode === 'battle') {
         setViewMode('battle');
         setCurrentMatch(data);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Run on mount

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // 3. Auto-Save Lobby State (Debounced)
  // Only runs when we are strictly in LOBBY mode to avoid overwriting Match URL
  useEffect(() => {
    if (viewMode === 'lobby') {
       const timer = setTimeout(() => {
          navigate('lobby', players);
       }, 500);
       return () => clearTimeout(timer);
    }
  }, [players, viewMode, navigate]);

  // --- ACTIONS ---

  const handleBatchProcess = (batchData: { name: string; roles: Role[]; isAllRoles: boolean; action?: 'add' | 'bench' }[]) => {
    setPlayers(prev => {
      let updatedPlayers = [...prev];
      batchData.forEach(item => {
        const normalizedName = item.name.trim().toLowerCase();
        const existingIndex = updatedPlayers.findIndex(p => p.name.trim().toLowerCase() === normalizedName);

        if (item.action === 'bench') {
           if (existingIndex !== -1) {
              updatedPlayers[existingIndex] = { ...updatedPlayers[existingIndex], isActive: false };
           }
        } else {
           if (existingIndex !== -1) {
              updatedPlayers[existingIndex] = {
                 ...updatedPlayers[existingIndex],
                 roles: item.roles,
                 isAllRoles: item.isAllRoles,
                 isActive: true
              };
           } else {
              updatedPlayers.push({
                 id: crypto.randomUUID(),
                 name: item.name,
                 roles: item.roles,
                 isAllRoles: item.isAllRoles,
                 isActive: true,
                 isLastMatchMvp: false,
                 stats: { matchesPlayed: 0, wins: 0, currentStreak: 0, maxStreak: 0 }
              });
           }
        }
      });
      return updatedPlayers;
    });
    setErrorMsg(null);
  };

  const removePlayer = (id: string) => {
    setPlayers(prev => prev.filter(p => p.id !== id));
  };

  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to clear the entire roster? This cannot be undone.")) {
       setPlayers([]);
       setRoomId('');
       setErrorMsg(null);
       navigate('lobby', []);
    }
  };

  const togglePlayerActive = (id: string) => {
    setPlayers(prev => prev.map(p => p.id === id ? { ...p, isActive: !p.isActive } : p));
  };

  const handleEditPlayer = (player: Player) => {
    setEditingPlayer(player);
    setIsEditModalOpen(true);
  };

  const handleUpdatePlayer = (updatedPlayer: Player) => {
    setPlayers(prev => prev.map(p => p.id === updatedPlayer.id ? updatedPlayer : p));
    setErrorMsg(null);
  };

  const activePlayers = players.filter(p => p.isActive);

  // --- MATCH ACTIONS ---

  const handleGenerate = () => {
    if (!roomId.trim()) {
      setErrorMsg("Please enter a Room ID.");
      return;
    }
    const required = isCoachMode ? 12 : 10;
    if (activePlayers.length < required) {
      setErrorMsg(`Need ${required} ACTIVE players for ${isCoachMode ? 'Coach' : 'Standard'} Mode. Current: ${activePlayers.length}`);
      return;
    }
    if (isCoachMode) {
       const coachCandidates = activePlayers.filter(p => p.roles.includes(Role.COACH));
       if (coachCandidates.length < 2) {
         setErrorMsg(`Coach Mode requires 2 players with 'COACH' role. Found: ${coachCandidates.length}`);
         return;
       }
    }

    const result = generateMatch(activePlayers, roomId, isCoachMode);
    if (result) {
      setCurrentMatch(result);
      setErrorMsg(null);
      // Change View to Match
      navigate('match', result);
    } else {
      setErrorMsg("Failed to find valid composition.");
    }
  };

  const handleRerollSlot = (team: 'azure' | 'crimson', role: Role, newPlayer: Player) => {
    if (!currentMatch) return;

    const updatedMatch = {
        ...currentMatch,
        azureTeam: currentMatch.azureTeam.map(slot => 
            (team === 'azure' && slot.role === role) ? { ...slot, player: newPlayer } : slot
        ),
        crimsonTeam: currentMatch.crimsonTeam.map(slot => 
            (team === 'crimson' && slot.role === role) ? { ...slot, player: newPlayer } : slot
        )
    };

    setCurrentMatch(updatedMatch);
    // Sync Reroll to URL
    navigate('match', updatedMatch);
  };

  const handleStartBattle = () => {
     if (!currentMatch) return;
     // Move to Battle Mode
     navigate('battle', currentMatch);
  };

  const handleMatchFinish = (winner: 'azure' | 'crimson' | null, mvpId?: string, ratings?: Record<string, number>) => {
    if (!currentMatch) return;
    
    // Save History
    const historyEntry: MatchHistoryEntry = {
       ...currentMatch,
       id: crypto.randomUUID(),
       winningTeam: winner,
       mvpId: mvpId,
       ratings: ratings 
    };
    setMatchHistory(prev => [historyEntry, ...prev]);

    // Update Player Stats
    if (winner) {
      const azureIds = new Set(currentMatch.azureTeam.map(slot => slot.player.id));
      const crimsonIds = new Set(currentMatch.crimsonTeam.map(slot => slot.player.id));

      const updatedPlayers = players.map(p => {
        let isLastMatchMvp = false;
        if (mvpId && p.id === mvpId) isLastMatchMvp = true;

        if (!azureIds.has(p.id) && !crimsonIds.has(p.id)) return { ...p, isLastMatchMvp: false };

        const isAzure = azureIds.has(p.id);
        const isWinner = (isAzure && winner === 'azure') || (!isAzure && winner === 'crimson');

        const newStats = { ...p.stats };
        newStats.matchesPlayed += 1;

        if (isWinner) {
           newStats.wins += 1;
           newStats.currentStreak += 1;
           if (newStats.currentStreak > newStats.maxStreak) newStats.maxStreak = newStats.currentStreak;
        } else {
           newStats.currentStreak = 0;
        }
        return { ...p, stats: newStats, isLastMatchMvp };
      });
      
      setPlayers(updatedPlayers);
      // Navigate back to Lobby with updated stats
      navigate('lobby', updatedPlayers);
    } else {
      // Draw/Abandon
      navigate('lobby', players);
    }

    setCurrentMatch(null);
    setRoomId(''); 
  };

  const handleAbortMatch = () => {
      setCurrentMatch(null);
      navigate('lobby', players);
  };

  // --- UTILS ---

  const quickFill = () => {
     const shuffledHeroes = [...HOK_HEROES].sort(() => 0.5 - Math.random());
     const heroesToAdd = shuffledHeroes.slice(0, 15);
     const batchData = heroesToAdd.map(hero => ({
        name: hero.name,
        roles: hero.roles,
        isAllRoles: false,
        action: 'add' as const
     }));
     for(let i=0; i<5; i++) {
        batchData.push({ name: `Flex Player ${i+1}`, roles: [], isAllRoles: true, action: 'add' });
     }
     if (isCoachMode) {
        batchData.push({ name: "Coach Gemik", roles: [Role.COACH], isAllRoles: false, action: 'add' });
        batchData.push({ name: "Coach KPL", roles: [Role.COACH], isAllRoles: false, action: 'add' });
     }
     handleBatchProcess(batchData);
  };

  // Fullscreen
  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => console.error(err));
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  };

  // --- RENDER ---

  // Determine Main Content based on View Mode
  let mainContent;
  if (viewMode === 'lobby') {
     mainContent = (
        <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative transition-all duration-500">
              {/* Left Panel */}
              <div className={`lg:col-span-4 space-y-6 transition-all duration-500 ease-in-out ${isSidebarOpen ? 'opacity-100 translate-x-0' : 'hidden opacity-0 -translate-x-full lg:col-span-0'}`}>
                 
                 {/* Room ID - HIGHLY VISIBLE UPDATE */}
                 <div className="relative group p-[2px] rounded clip-corner-sm">
                    {/* Animated Gold/Yellow Gradient Border/Glow */}
                    <div className="absolute inset-0 bg-gradient-to-r from-[#dcb06b] via-[#8a6d3b] to-[#dcb06b] animate-[spin-slow_4s_linear_infinite] opacity-80 blur-sm"></div>
                    
                    <div className="bg-[#05090f] p-5 flex items-center gap-4 relative z-10 clip-corner-sm border border-[#dcb06b] shadow-[inset_0_0_20px_rgba(220,176,107,0.2)]">
                       <label className="text-sm uppercase text-[#dcb06b] font-black font-orbitron whitespace-nowrap tracking-widest drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                          Room ID
                       </label>
                       <div className="h-8 w-[2px] bg-[#dcb06b] shadow-[0_0_10px_#dcb06b]"></div>
                       <input 
                          type="text" 
                          value={roomId}
                          onChange={(e) => { if (/^\d*$/.test(e.target.value) && e.target.value.length <= 4) setRoomId(e.target.value); }}
                          maxLength={4}
                          placeholder="0000"
                          className="bg-transparent text-2xl font-orbitron font-bold text-[#f3dcb1] w-full focus:outline-none tracking-[0.2em] placeholder-[#1e3a5f] drop-shadow-[0_0_5px_#dcb06b]"
                       />
                    </div>
                 </div>

                 {/* Coach Mode */}
                 <div className="flex items-center justify-between bg-[#0a1a2f]/60 p-4 border border-[#1e3a5f] clip-corner-sm">
                     <span className="text-[#dcb06b] font-cinzel font-bold text-sm tracking-widest flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        COACH MODE <span className="text-[8px] bg-[#dcb06b] text-black px-1.5 py-0.5 rounded font-orbitron font-bold ml-1">(BETA)</span>
                     </span>
                     <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={isCoachMode} onChange={(e) => setIsCoachMode(e.target.checked)} />
                        <div className="w-11 h-6 bg-[#1e3a5f] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#dcb06b]"></div>
                     </label>
                 </div>

                 <PlayerForm onBatchProcess={handleBatchProcess} isCoachMode={isCoachMode} />
                 
                 <div className="relative p-6 clip-corner-md bg-gradient-to-b from-[#1a2c42] to-[#05090f] border border-[#dcb06b]/20 group hover:border-[#dcb06b]/50 transition-colors duration-500">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#dcb06b] to-transparent opacity-50"></div>
                    <div className="flex justify-between items-end mb-6">
                       <div>
                          <div className="text-[#8a9db8] text-[10px] uppercase tracking-widest font-bold mb-1">Active Players</div>
                          <div className="text-5xl font-orbitron font-bold text-white relative">
                             {activePlayers.length}
                             <span className="text-lg text-[#4a5f78] absolute top-0 -right-12">/ {isCoachMode ? 12 : 10}</span>
                          </div>
                       </div>
                       <div className="text-right">
                          <button onClick={quickFill} className="text-[10px] text-[#dcb06b] border border-[#dcb06b] px-3 py-1 hover:bg-[#dcb06b] hover:text-black transition-colors uppercase tracking-wider">
                             Quick Fill
                          </button>
                       </div>
                    </div>
                    {errorMsg && <div className="mb-4 p-3 border-l-2 border-red-500 bg-red-900/20 text-red-200 text-xs">{errorMsg}</div>}
                    <Button onClick={handleGenerate} className="w-full text-lg shadow-[0_0_20px_rgba(220,176,107,0.3)]" disabled={activePlayers.length < (isCoachMode ? 12 : 10)}>
                       START MATCHMAKING
                    </Button>
                 </div>
              </div>

              {/* Right Panel */}
              <div className={`transition-all duration-500 ${isSidebarOpen ? 'lg:col-span-8' : 'lg:col-span-12'}`}>
                 <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 border border-[#1e3a5f] hover:border-[#dcb06b] text-[#dcb06b] clip-corner-sm transition-all bg-[#0a1a2f]/50">
                           {isSidebarOpen ? (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                           ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                           )}
                        </button>
                        <h2 className="text-2xl font-cinzel font-black tracking-[0.2em] uppercase drop-shadow-sm text-[#dcb06b] flex items-center gap-3">
                           <span className="w-2 h-2 bg-[#dcb06b] rotate-45"></span> SQUAD ROSTER
                        </h2>
                    </div>
                    <div className="flex items-center gap-2">
                       <button onClick={() => rosterFileInputRef.current?.click()} className="flex items-center gap-2 px-3 py-1 text-[10px] uppercase font-bold tracking-wider text-[#4a5f78] border border-[#1e3a5f] hover:border-[#dcb06b] hover:text-[#dcb06b] transition-all clip-corner-sm">
                          Load
                       </button>
                       <div className="h-4 w-[1px] bg-[#1e3a5f] mx-2"></div>
                       <button onClick={handleClearAll} className="text-xs text-[#4a5f78] hover:text-red-400 uppercase tracking-widest transition-colors">Clear All</button>
                    </div>
                 </div>
                 
                 <div className="perspective-container tech-border p-6 bg-[#0a1a2f]/40 min-h-[400px] mb-8">
                    <PlayerList players={players} onRemove={removePlayer} onToggleActive={togglePlayerActive} onEdit={handleEditPlayer} isSidebarOpen={isSidebarOpen} />
                 </div>

                 <div className="mt-12">
                     <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-cinzel font-black tracking-[0.2em] uppercase drop-shadow-sm text-[#dcb06b] flex items-center gap-3">
                           <span className="w-2 h-2 bg-[#dcb06b] rotate-45"></span> BATTLE HISTORY
                        </h2>
                     </div>
                     <div className="tech-border p-6 bg-[#0a1a2f]/40">
                        <HistoryList history={matchHistory} onClear={() => setMatchHistory([])} />
                     </div>
                 </div>
              </div>
            </div>
        </div>
     );
  } else if (currentMatch) {
     // Match or Battle Mode
     mainContent = (
        <MatchDisplay 
          match={currentMatch} 
          activePlayers={activePlayers} // Used for reroll pool
          initialMode={viewMode === 'battle' ? 'battle' : 'draft'}
          onReset={handleAbortMatch}
          onCompleteMatch={handleMatchFinish}
          onReroll={handleRerollSlot}
          onStartBattle={handleStartBattle}
        />
     );
  }

  return (
    <div className="min-h-screen text-slate-200 font-inter overflow-x-hidden relative flex flex-col">
      <BackgroundParticles />
      <div className="fixed inset-0 bg-black -z-10">
         <img src="https://www.levelinfinite.com/wp-content/uploads/2024/03/honor-of-kings-global-launch-pc.jpg" alt="HoK" className="absolute inset-0 w-full h-full object-cover opacity-50" />
         <div className="absolute inset-0 bg-gradient-to-b from-[#05090f]/90 via-[#05090f]/60 to-[#05090f] mix-blend-multiply"></div>
      </div>
      
      {/* Hidden File Inputs */}
      <input type="file" ref={rosterFileInputRef} onChange={(e) => {}} accept=".json" className="hidden" />
      <input type="file" ref={historyFileInputRef} onChange={(e) => {}} accept=".json" className="hidden" />

      {/* Edit Modal */}
      {editingPlayer && (
        <EditPlayerModal player={editingPlayer} isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onSave={handleUpdatePlayer} />
      )}

      {/* Header - Only Show in Lobby */}
      {viewMode === 'lobby' && (
        <header className="sticky top-0 z-50 h-16 flex items-center justify-center border-b border-[#dcb06b]/20 bg-[#05090f]/90 backdrop-blur-md shadow-lg transition-all">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#dcb06b]/5 to-transparent"></div>
          
          <div className="flex items-center gap-3 animate-float">
             <div className="w-8 h-8 border-2 border-[#dcb06b] rotate-45 flex items-center justify-center bg-[#0a1a2f] shadow-[0_0_10px_#dcb06b]">
                <div className="w-4 h-4 bg-[#dcb06b] shadow-inner"></div>
             </div>
             
             <h1 className="text-2xl font-cinzel font-black tracking-[0.2em] text-white flex flex-col leading-none drop-shadow-[0_0_10px_rgba(220,176,107,0.5)]">
               <span><span className="hok-gold-text">HONOR</span> OF <span className="hok-gold-text">KINGS</span></span>
             </h1>
          </div>
          
          <button onClick={toggleFullScreen} className="absolute right-4 sm:right-8 p-2 text-[#4a5f78] hover:text-[#dcb06b] transition-colors">
             {isFullscreen ? <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg> : <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>}
          </button>
        </header>
      )}

      <main className="relative z-10 pt-8 px-4 flex-grow">
         {mainContent}
      </main>

      {/* Footer - Only in Lobby */}
      {viewMode === 'lobby' && (
        <footer className="relative z-10 py-4 mt-8 text-center border-t border-[#dcb06b]/10 bg-[#05090f] w-full">
            <div className="max-w-4xl mx-auto px-4 text-[#4a5f78] font-orbitron text-[9px] tracking-widest leading-relaxed uppercase opacity-80">
                <span className="block mb-1 text-[#dcb06b] font-bold">APPLICATION DEVELOPED BY KAZEHUNT</span>
                <span className="block mb-1">DESIGNED EXCLUSIVELY FOR HONOR OF KINGS CUSTOM FUN MATCHES ON THE OFFICIAL DISCORD.</span>
                <span className="block opacity-50 text-[8px]">THE DEVELOPER ASSUMES NO RESPONSIBILITY FOR USAGE OUTSIDE THIS INTENDED SCOPE.</span>
            </div>
        </footer>
      )}
    </div>
  );
}