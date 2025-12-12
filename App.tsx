import React, { useState, useRef } from 'react';
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

export default function App() {
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

  const rosterFileInputRef = useRef<HTMLInputElement>(null);
  const historyFileInputRef = useRef<HTMLInputElement>(null);

  const addPlayer = (newPlayer: Omit<Player, 'id' | 'isActive' | 'stats'>) => {
    setPlayers(prev => {
      // Check if player already exists (case-insensitive normalization)
      const normalizedName = newPlayer.name.trim().toLowerCase();
      const existingIndex = prev.findIndex(p => p.name.trim().toLowerCase() === normalizedName);

      if (existingIndex !== -1) {
        // UPDATE Existing Player Logic
        const updatedPlayers = [...prev];
        updatedPlayers[existingIndex] = {
          ...updatedPlayers[existingIndex],
          roles: newPlayer.roles,
          isAllRoles: newPlayer.isAllRoles,
          // We also ensure they are active if they are being updated/re-added
          isActive: true 
        };
        return updatedPlayers;
      }

      // CREATE New Player Logic
      const player: Player = { 
        ...newPlayer, 
        id: crypto.randomUUID(),
        isActive: true, // Default to active when added
        isLastMatchMvp: false,
        stats: {
          matchesPlayed: 0,
          wins: 0,
          currentStreak: 0,
          maxStreak: 0
        }
      };
      return [...prev, player];
    });
    setErrorMsg(null);
  };

  const removePlayer = (id: string) => {
    setPlayers(prev => prev.filter(p => p.id !== id));
  };

  const togglePlayerActive = (id: string) => {
    setPlayers(prev => prev.map(p => 
      p.id === id ? { ...p, isActive: !p.isActive } : p
    ));
  };

  // Edit Handlers
  const handleEditPlayer = (player: Player) => {
    setEditingPlayer(player);
    setIsEditModalOpen(true);
  };

  const handleUpdatePlayer = (updatedPlayer: Player) => {
    setPlayers(prev => prev.map(p => 
      p.id === updatedPlayer.id ? updatedPlayer : p
    ));
    setErrorMsg(null);
  };

  const activePlayers = players.filter(p => p.isActive);

  const handleGenerate = () => {
    if (!roomId.trim()) {
      setErrorMsg("Please enter a Room ID.");
      return;
    }
    
    const required = isCoachMode ? 12 : 10;
    if (activePlayers.length < required) {
      setErrorMsg(`Need ${required} ACTIVE players for ${isCoachMode ? 'Coach' : 'Standard'} Mode. Current Active: ${activePlayers.length}`);
      return;
    }

    // COACH MODE VALIDATION
    if (isCoachMode) {
       // STRICT: Only players with the explicit COACH role can be coach. 
       // All Roles/Fill does NOT count for coach slots.
       const coachCandidates = activePlayers.filter(p => p.roles.includes(Role.COACH));
       
       if (coachCandidates.length < 2) {
         setErrorMsg(`Coach Mode requires at least 2 players with the specific 'COACH' role. Found: ${coachCandidates.length}`);
         return;
       }
    }

    // Only pass active players to the matchmaker
    const result = generateMatch(activePlayers, roomId, isCoachMode);
    if (result) {
      setCurrentMatch(result);
      setErrorMsg(null);
    } else {
      setErrorMsg("Failed to find valid composition. Ensure role coverage.");
    }
  };

  const handleRerollSlot = (team: 'azure' | 'crimson', role: Role, newPlayer: Player) => {
    if (!currentMatch) return;

    // Update Match State with the new player chosen by the wheel
    setCurrentMatch(prev => {
       if (!prev) return null;
       
       const newAzure = prev.azureTeam.map(slot => {
          if (team === 'azure' && slot.role === role) {
             return { ...slot, player: newPlayer };
          }
          return slot;
       });

       const newCrimson = prev.crimsonTeam.map(slot => {
          if (team === 'crimson' && slot.role === role) {
             return { ...slot, player: newPlayer };
          }
          return slot;
       });

       return {
          ...prev,
          azureTeam: newAzure,
          crimsonTeam: newCrimson
       };
    });
  };

  const handleMatchFinish = (winner: 'azure' | 'crimson' | null, mvpId?: string, ratings?: Record<string, number>) => {
    if (!currentMatch) return;
    
    // 1. Save History with Ratings
    const historyEntry: MatchHistoryEntry = {
       ...currentMatch,
       id: crypto.randomUUID(),
       winningTeam: winner,
       mvpId: mvpId,
       ratings: ratings // Store the ratings
    };
    setMatchHistory(prev => [historyEntry, ...prev]);

    // 2. Update Player Stats if there is a winner
    if (winner) {
      const azurePlayerIds = new Set(currentMatch.azureTeam.map(slot => slot.player.id));
      const crimsonPlayerIds = new Set(currentMatch.crimsonTeam.map(slot => slot.player.id));

      setPlayers(prevPlayers => prevPlayers.map(p => {
        let isLastMatchMvp = false;

        // If player matches the manually provided MVP ID, set flag
        if (mvpId && p.id === mvpId) {
          isLastMatchMvp = true;
        }

        if (!azurePlayerIds.has(p.id) && !crimsonPlayerIds.has(p.id)) {
          return { ...p, isLastMatchMvp: false }; // Clear old MVP if they didn't play
        }

        const isAzure = azurePlayerIds.has(p.id);
        const isWinner = (isAzure && winner === 'azure') || (!isAzure && winner === 'crimson');

        const newStats = { ...p.stats };
        newStats.matchesPlayed += 1;

        if (isWinner) {
           newStats.wins += 1;
           newStats.currentStreak += 1;
           if (newStats.currentStreak > newStats.maxStreak) {
             newStats.maxStreak = newStats.currentStreak;
           }
        } else {
           // Reset streak on loss
           newStats.currentStreak = 0;
        }

        return { ...p, stats: newStats, isLastMatchMvp };
      }));
    }

    // 3. Clear match and Room ID (Reset ID)
    setCurrentMatch(null);
    setRoomId(''); 
  };

  const handleAbortMatch = () => setCurrentMatch(null);

  const quickFill = () => {
     const shuffledHeroes = [...HOK_HEROES].sort(() => 0.5 - Math.random());
     const heroesToAdd = shuffledHeroes.slice(0, 15);
     const newPlayers: Player[] = heroesToAdd.map(hero => ({
        id: crypto.randomUUID(),
        name: hero.name,
        isAllRoles: false,
        roles: hero.roles,
        isActive: true,
        isLastMatchMvp: false,
        stats: { matchesPlayed: 0, wins: 0, currentStreak: 0, maxStreak: 0 }
     }));
     // Add some flexible minions/players if needed to ensure we have enough
     for(let i=0; i<5; i++) {
        newPlayers.push({
           id: crypto.randomUUID(),
           name: `Flex Player ${i+1}`,
           isAllRoles: true,
           roles: [],
           isActive: true,
           isLastMatchMvp: false,
           stats: { matchesPlayed: 0, wins: 0, currentStreak: 0, maxStreak: 0 }
        });
     }

     // If Coach Mode is active, ensuring we have coaches
     if (isCoachMode) {
        newPlayers.push(
           {
              id: crypto.randomUUID(),
              name: "Coach Gemik",
              isAllRoles: false,
              roles: [Role.COACH],
              isActive: true,
              isLastMatchMvp: false,
              stats: { matchesPlayed: 0, wins: 0, currentStreak: 0, maxStreak: 0 }
           },
           {
              id: crypto.randomUUID(),
              name: "Coach KPL",
              isAllRoles: false,
              roles: [Role.COACH],
              isActive: true,
              isLastMatchMvp: false,
              stats: { matchesPlayed: 0, wins: 0, currentStreak: 0, maxStreak: 0 }
           }
        );
     }
     
     setPlayers(prev => {
        const existingNames = new Set(prev.map(p => p.name));
        const filteredNew = newPlayers.filter(p => !existingNames.has(p.name));
        return [...prev, ...filteredNew].slice(0, 30);
     });
     
     // NOTE: We do NOT set Room ID automatically anymore per user request.
  };

  // --- SAVE / LOAD FUNCTIONALITY ---
  
  const getFormattedTimestamp = () => {
    const date = new Date();
    const YYYY = date.getFullYear();
    const MM = String(date.getMonth() + 1).padStart(2, '0');
    const DD = String(date.getDate()).padStart(2, '0');
    const HH = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    return `${YYYY}-${MM}-${DD}_${HH}-${mm}`;
  };
  
  const handleExportRoster = () => {
    if (players.length === 0) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(players, null, 2));
    const filename = `hok-squad-roster_${getFormattedTimestamp()}.json`;
    
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", filename);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleExportHistory = () => {
    if (matchHistory.length === 0) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(matchHistory, null, 2));
    const filename = `hok-match-history_${getFormattedTimestamp()}.json`;

    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", filename);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleRosterImportClick = () => {
    rosterFileInputRef.current?.click();
  };

  const handleHistoryImportClick = () => {
    historyFileInputRef.current?.click();
  };

  const handleRosterFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileObj = event.target.files && event.target.files[0];
    if (!fileObj) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = e.target?.result;
        if (typeof json === 'string') {
          const parsedData = JSON.parse(json);
          // Basic validation
          if (Array.isArray(parsedData) && parsedData.length > 0 && parsedData[0].name) {
             const importedPlayers: Player[] = parsedData.map((p: any) => ({
               ...p,
               id: crypto.randomUUID(),
               // Ensure properties exist for backward compatibility with old JSONs
               isActive: typeof p.isActive === 'boolean' ? p.isActive : true,
               isLastMatchMvp: typeof p.isLastMatchMvp === 'boolean' ? p.isLastMatchMvp : false,
               stats: p.stats || { matchesPlayed: 0, wins: 0, currentStreak: 0, maxStreak: 0 }
             }));
             setPlayers(importedPlayers);
             setErrorMsg(null);
          } else {
             setErrorMsg("Invalid Roster JSON file format.");
          }
        }
      } catch (err) {
        setErrorMsg("Failed to parse Roster JSON file.");
      }
    };
    reader.readAsText(fileObj);
    event.target.value = '';
  };

  const handleHistoryFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileObj = event.target.files && event.target.files[0];
    if (!fileObj) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = e.target?.result;
        if (typeof json === 'string') {
          const parsedData = JSON.parse(json);
          // Basic validation for match history
          if (Array.isArray(parsedData) && (parsedData.length === 0 || parsedData[0].roomId)) {
             setMatchHistory(parsedData);
             setErrorMsg(null);
          } else {
             setErrorMsg("Invalid History JSON file format.");
          }
        }
      } catch (err) {
        setErrorMsg("Failed to parse History JSON file.");
      }
    };
    reader.readAsText(fileObj);
    event.target.value = '';
  };

  const handleRoomIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Only allow numeric input and max 4 digits
    if (/^\d*$/.test(val) && val.length <= 4) {
      setRoomId(val);
    }
  };

  return (
    <div className="min-h-screen text-slate-200 font-inter overflow-x-hidden relative">
      <BackgroundParticles />

      {/* New Background Image (HoK Global Launch) */}
      <div className="fixed inset-0 bg-black -z-10">
         <img 
           src="https://www.levelinfinite.com/wp-content/uploads/2024/03/honor-of-kings-global-launch-pc.jpg" 
           alt="Honor of Kings Background" 
           className="absolute inset-0 w-full h-full object-cover opacity-50"
         />
         <div className="absolute inset-0 bg-gradient-to-b from-[#05090f]/90 via-[#05090f]/60 to-[#05090f] mix-blend-multiply"></div>
         <div className="absolute inset-0 bg-gradient-to-t from-[#05090f] via-transparent to-[#05090f]/80"></div>
      </div>
      
      {/* Hidden File Inputs */}
      <input 
        type="file" 
        ref={rosterFileInputRef}
        onChange={handleRosterFileChange}
        accept=".json"
        className="hidden"
      />
      <input 
        type="file" 
        ref={historyFileInputRef}
        onChange={handleHistoryFileChange}
        accept=".json"
        className="hidden"
      />

      {/* Edit Modal */}
      {editingPlayer && (
        <EditPlayerModal 
          player={editingPlayer}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleUpdatePlayer}
        />
      )}

      {/* Cinematic Header - Sticky & Compact - Only show in Lobby */}
      {!currentMatch && (
        <header className="sticky top-0 z-50 h-16 flex items-center justify-center border-b border-[#dcb06b]/20 bg-[#05090f]/90 backdrop-blur-md shadow-lg transition-all">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#dcb06b]/5 to-transparent"></div>
          <div className="flex items-center gap-2 animate-float">
             <div className="w-6 h-6 border border-[#dcb06b] rotate-45 flex items-center justify-center bg-[#0a1a2f]">
                <div className="w-3 h-3 bg-[#dcb06b]"></div>
             </div>
             <h1 className="text-xl font-cinzel font-black tracking-[0.2em] text-white flex flex-col md:flex-row md:items-center md:gap-2 leading-none">
               <span>
                 <span className="hok-gold-text">HONOR</span> OF <span className="hok-gold-text">KINGS</span>
               </span>
               <span className="text-[7px] text-[#8a9db8] tracking-[0.3em] font-orbitron md:mt-0 mt-1">OPEN MABAR</span>
             </h1>
          </div>
        </header>
      )}

      <main className="relative z-10 pt-8 px-4 pb-20">
        {currentMatch ? (
          <MatchDisplay 
            match={currentMatch} 
            activePlayers={activePlayers} 
            onReset={handleAbortMatch}
            onCompleteMatch={handleMatchFinish}
            onReroll={handleRerollSlot}
          />
        ) : (
          <div className="max-w-7xl mx-auto">
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative transition-all duration-500">
              
              {/* Left Panel: Controls (Collapsible) */}
              <div className={`
                 lg:col-span-4 space-y-6 transition-all duration-500 ease-in-out
                 ${isSidebarOpen ? 'opacity-100 translate-x-0' : 'hidden opacity-0 -translate-x-full lg:col-span-0'}
              `}>

                 {/* Room ID & Coach Mode Toggle */}
                 <div className="bg-[#0a1a2f]/80 p-1 clip-corner-sm border border-[#1e3a5f] shadow-[0_0_25px_rgba(220,176,107,0.15)] relative group space-y-2">
                    <div className="absolute -inset-1 bg-gradient-to-r from-transparent via-[#dcb06b]/30 to-transparent blur opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                    
                    <div className="bg-[#05090f] p-4 flex items-center gap-4 clip-corner-sm relative z-10">
                       <label className="text-xs uppercase text-[#dcb06b] font-bold font-orbitron whitespace-nowrap tracking-widest">Room ID</label>
                       <div className="h-8 w-[1px] bg-[#1e3a5f]"></div>
                       <input 
                          type="text" 
                          value={roomId}
                          onChange={handleRoomIdChange}
                          maxLength={4}
                          placeholder="0000"
                          className="bg-transparent text-lg font-orbitron text-white w-full focus:outline-none tracking-widest placeholder-[#1e3a5f]"
                       />
                    </div>
                 </div>

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

                 <PlayerForm onAddPlayer={addPlayer} isCoachMode={isCoachMode} />
                 
                 {/* Status Panel */}
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

                    {errorMsg && (
                      <div className="mb-4 p-3 border-l-2 border-red-500 bg-red-900/20 text-red-200 text-xs">
                        {errorMsg}
                      </div>
                    )}

                    <Button 
                      onClick={handleGenerate} 
                      className="w-full text-lg shadow-[0_0_20px_rgba(220,176,107,0.3)]"
                      disabled={activePlayers.length < (isCoachMode ? 12 : 10)}
                    >
                       START MATCHMAKING
                    </Button>
                 </div>
              </div>

              {/* Right Panel: Player Grid & History */}
              <div className={`transition-all duration-500 ${isSidebarOpen ? 'lg:col-span-8' : 'lg:col-span-12'}`}>
                 <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
                    
                    {/* Header with Expand Button */}
                    <div className="flex items-center gap-4">
                        <button 
                           onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
                           className="p-2 border border-[#1e3a5f] hover:border-[#dcb06b] text-[#dcb06b] clip-corner-sm transition-all bg-[#0a1a2f]/50"
                           title={isSidebarOpen ? "Maximize List" : "Show Controls"}
                        >
                           {isSidebarOpen ? (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                              </svg>
                           ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                              </svg>
                           )}
                        </button>

                        <h2 className="text-2xl font-cinzel font-black tracking-[0.2em] uppercase drop-shadow-sm text-[#dcb06b] flex items-center gap-3">
                           <span className="w-2 h-2 bg-[#dcb06b] rotate-45"></span>
                           SQUAD ROSTER
                        </h2>
                    </div>

                    <div className="flex items-center gap-2">
                       {/* Import/Export Controls */}
                       <button 
                         onClick={handleRosterImportClick}
                         className="flex items-center gap-2 px-3 py-1 text-[10px] uppercase font-bold tracking-wider text-[#4a5f78] border border-[#1e3a5f] hover:border-[#dcb06b] hover:text-[#dcb06b] transition-all clip-corner-sm"
                         title="Load Roster JSON"
                       >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                          Load
                       </button>

                       <button 
                         onClick={handleExportRoster}
                         disabled={players.length === 0}
                         className="flex items-center gap-2 px-3 py-1 text-[10px] uppercase font-bold tracking-wider text-[#4a5f78] border border-[#1e3a5f] hover:border-[#dcb06b] hover:text-[#dcb06b] transition-all clip-corner-sm disabled:opacity-30 disabled:cursor-not-allowed"
                         title="Save Roster JSON"
                       >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Save
                       </button>

                       <div className="h-4 w-[1px] bg-[#1e3a5f] mx-2"></div>

                       <button onClick={() => setPlayers([])} className="text-xs text-[#4a5f78] hover:text-red-400 uppercase tracking-widest transition-colors">
                          Clear All
                       </button>
                    </div>
                 </div>
                 
                 <div className="perspective-container tech-border p-6 bg-[#0a1a2f]/40 min-h-[400px] mb-8">
                    <PlayerList 
                      players={players} 
                      onRemove={removePlayer} 
                      onToggleActive={togglePlayerActive}
                      onEdit={handleEditPlayer}
                      isSidebarOpen={isSidebarOpen}
                    />
                 </div>

                 {/* MATCH HISTORY SECTION */}
                 <div className="mt-12">
                     <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-cinzel font-black tracking-[0.2em] uppercase drop-shadow-sm text-[#dcb06b] flex items-center gap-3">
                           <span className="w-2 h-2 bg-[#dcb06b] rotate-45"></span>
                           BATTLE HISTORY
                        </h2>
                        
                        <div className="flex items-center gap-2">
                           <button 
                             onClick={handleHistoryImportClick}
                             className="flex items-center gap-2 px-3 py-1 text-[10px] uppercase font-bold tracking-wider text-[#4a5f78] border border-[#1e3a5f] hover:border-[#dcb06b] hover:text-[#dcb06b] transition-all clip-corner-sm"
                           >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                              </svg>
                              Import
                           </button>

                           <button 
                              onClick={handleExportHistory}
                              disabled={matchHistory.length === 0}
                              className="flex items-center gap-2 px-3 py-1 text-[10px] uppercase font-bold tracking-wider text-[#4a5f78] border border-[#1e3a5f] hover:border-[#dcb06b] hover:text-[#dcb06b] transition-all clip-corner-sm disabled:opacity-30 disabled:cursor-not-allowed"
                           >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Export
                           </button>
                        </div>
                     </div>

                     <div className="tech-border p-6 bg-[#0a1a2f]/40">
                        <HistoryList history={matchHistory} onClear={() => setMatchHistory([])} />
                     </div>
                 </div>
              </div>

            </div>
          </div>
        )}
      </main>
    </div>
  );
}