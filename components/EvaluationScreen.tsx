import React, { useEffect, useState } from 'react';
import { MatchResult, Role } from '../types';
import { ROLES_ORDER, RoleIcons } from '../constants';
import { Button } from './Button';

interface EvaluationScreenProps {
  match: MatchResult;
  winner: 'azure' | 'crimson';
  onComplete: (mvpId?: string, ratings?: Record<string, number>) => void;
}

export const EvaluationScreen: React.FC<EvaluationScreenProps> = ({ match, winner, onComplete }) => {
  const [mvpId, setMvpId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Rating State: Map of player ID to score: 2 (Excellent), 1 (Good), 0 (Neutral), -1 (Bad), -2 (Very Bad)
  const [ratings, setRatings] = useState<Record<string, number>>({});

  useEffect(() => {
    // Simulate Calculation Loading
    const timer = setTimeout(() => {
        setIsLoading(false);
    }, 2500); // 2.5s loading time

    return () => clearTimeout(timer);
  }, [match, winner]);

  // Handle Drag Start for MVP Badge
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("type", "mvp-token");
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessary to allow dropping
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, playerId: string) => {
     e.preventDefault();
     const type = e.dataTransfer.getData("type");
     if (type === "mvp-token") {
        setMvpId(playerId);
     }
  };

  // Up Click: 0 -> 1 -> 2 -> 0
  const cycleRatingUp = (playerId: string) => {
      setRatings(prev => {
          const current = prev[playerId] || 0;
          let next = 0;
          if (current <= 0) next = 1;
          else if (current === 1) next = 2;
          else next = 0;
          
          const newState = { ...prev, [playerId]: next };
          if (next === 0) delete newState[playerId];
          return newState;
      });
  };

  // Down Click: 0 -> -1 -> -2 -> 0
  const cycleRatingDown = (playerId: string) => {
    setRatings(prev => {
        const current = prev[playerId] || 0;
        let next = 0;
        if (current >= 0) next = -1;
        else if (current === -1) next = -2;
        else next = 0;

        const newState = { ...prev, [playerId]: next };
        if (next === 0) delete newState[playerId];
        return newState;
    });
  };

  if (isLoading) {
    return (
        <div className="fixed inset-0 z-[100] bg-[#05090f] flex flex-col items-center justify-center">
            <div className="w-16 h-16 border-4 border-[#1e3a5f] border-t-[#dcb06b] rounded-full animate-spin mb-6"></div>
            <h2 className="text-[#dcb06b] font-orbitron text-xl tracking-[0.2em] animate-pulse">CALCULATING BATTLE DATA</h2>
            <div className="w-64 h-1 bg-[#1e3a5f] mt-4 rounded overflow-hidden">
                <div className="h-full bg-[#dcb06b] animate-[loading-bar_2s_ease-in-out_infinite]"></div>
            </div>
            <style>{`
                @keyframes loading-bar {
                    0% { width: 0%; transform: translateX(-100%); }
                    50% { width: 100%; transform: translateX(0); }
                    100% { width: 0%; transform: translateX(100%); }
                }
            `}</style>
        </div>
    );
  }

  // MVP Draggable Token Component
  const MVPToken = () => (
    <div 
      draggable 
      onDragStart={handleDragStart}
      className="cursor-grab active:cursor-grabbing hover:scale-110 transition-transform"
      title="Drag me to the MVP player!"
    >
       <div className="w-12 h-12 bg-gradient-to-br from-yellow-300 to-yellow-600 rounded-full flex items-center justify-center shadow-[0_0_15px_#fbbf24] border-2 border-white animate-pulse">
           <span className="font-black italic text-[#05090f] text-xs">MVP</span>
       </div>
    </div>
  );

  const winningTeam = winner === 'azure' ? match.azureTeam : match.crimsonTeam;
  const losingTeam = winner === 'azure' ? match.crimsonTeam : match.azureTeam;

  // Determine role display order (Coach at top if active)
  const rolesToRender = match.isCoachMode ? [Role.COACH, ...ROLES_ORDER] : ROLES_ORDER;

  const renderTeamColumn = (teamSlots: typeof winningTeam, teamName: string, isWinner: boolean, teamColor: 'cyan' | 'red') => {
      const borderColor = teamColor === 'cyan' ? 'border-[#00d2ff]' : 'border-[#ef4444]';
      const bgColor = teamColor === 'cyan' ? 'bg-[#00d2ff]/10' : 'bg-[#ef4444]/10';
      const textColor = teamColor === 'cyan' ? 'text-cyan-400' : 'text-red-500';

      return (
        <div className={`flex-1 w-full border ${borderColor} ${bgColor} p-0 clip-corner-md transition-all`}>
            <div className={`p-4 bg-opacity-30 border-b border-white/10 flex justify-between items-center ${teamColor === 'cyan' ? 'bg-[#00d2ff]' : 'bg-[#ef4444]'}`}>
                <div className="flex items-center gap-2">
                    <div className={`w-1 h-6 ${teamColor === 'cyan' ? 'bg-cyan-500' : 'bg-red-500'}`}></div>
                    <h3 className={`${textColor} font-cinzel font-bold text-xl`}>{teamName}</h3>
                </div>
                {isWinner && <span className="text-[#dcb06b] font-bold uppercase tracking-widest text-xs border border-[#dcb06b] px-2 py-1 rounded">Victory</span>}
            </div>
            
            <div className="p-4 space-y-2">
                {rolesToRender.map(role => {
                    const slot = teamSlots.find(s => s.role === role);
                    if(!slot) return null;
                    const isMvp = slot.player.id === mvpId;
                    const rating = ratings[slot.player.id] || 0;
                    const isCoach = role === Role.COACH;

                    return (
                        <div 
                            key={role} 
                            // Only allow drag drop if NOT Coach
                            onDragOver={!isCoach ? handleDragOver : undefined}
                            onDrop={!isCoach ? (e) => handleDrop(e, slot.player.id) : undefined}
                            className={`
                                flex items-center justify-between bg-[#0a1a2f]/50 p-3 rounded border relative overflow-hidden group transition-all
                                ${isMvp ? 'border-yellow-400 shadow-[0_0_15px_rgba(251,191,36,0.3)]' : isCoach ? 'border-white/20 bg-white/5' : 'border-white/5 hover:border-white/20'}
                            `}
                        >
                            {/* MVP Background Highlight */}
                            {isMvp && (
                                <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-transparent pointer-events-none"></div>
                            )}

                            <div className="flex items-center gap-4 relative z-10 flex-1 min-w-0">
                                <div className={`shrink-0 ${isCoach ? 'text-white' : (teamColor === 'cyan' ? 'text-cyan-500/50' : 'text-red-500/50')}`}>
                                    {RoleIcons[role]}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className={`text-lg font-orbitron truncate ${isMvp ? 'text-[#dcb06b]' : 'text-white'}`}>{slot.player.name}</div>
                                </div>
                            </div>

                            {/* Right Side: Arrows & MVP Status */}
                            <div className="flex items-center gap-4 relative z-10 shrink-0">
                                
                                {/* Performance Arrows */}
                                <div className="flex flex-col gap-1 mr-2 items-center">
                                    <button 
                                        onClick={() => cycleRatingUp(slot.player.id)}
                                        className={`p-1 rounded hover:bg-white/10 transition-colors flex flex-col items-center leading-none ${rating > 0 ? 'text-green-400 drop-shadow-[0_0_5px_lime]' : 'text-gray-600'}`}
                                        title="Cycle: Good (1) -> Excellent (2) -> Neutral"
                                    >
                                        {/* Dynamic Arrow Icon based on rating level */}
                                        {rating === 2 && (
                                            <div className="flex flex-col -space-y-1">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                                                </svg>
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                                                </svg>
                                            </div>
                                        )}
                                        {rating !== 2 && (
                                             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                                            </svg>
                                        )}
                                    </button>

                                    <button 
                                        onClick={() => cycleRatingDown(slot.player.id)}
                                        className={`p-1 rounded hover:bg-white/10 transition-colors flex flex-col items-center leading-none ${rating < 0 ? 'text-red-500 drop-shadow-[0_0_5px_red]' : 'text-gray-600'}`}
                                        title="Cycle: Bad (-1) -> Very Bad (-2) -> Neutral"
                                    >
                                         {rating === -2 && (
                                            <div className="flex flex-col -space-y-1">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                                </svg>
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>
                                        )}
                                        {rating !== -2 && (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                            </svg>
                                        )}
                                    </button>
                                </div>

                                {/* MVP Badge Drop Zone / Display */}
                                {/* COACH CANNOT BE MVP */}
                                {!isCoach ? (
                                    <div className="w-12 h-12 flex items-center justify-center">
                                        {isMvp ? (
                                            <div className="w-10 h-10 bg-gradient-to-br from-yellow-300 to-yellow-600 rounded-full flex items-center justify-center shadow-[0_0_10px_#fbbf24] animate-[pop_0.3s_ease-out]">
                                                <span className="font-black italic text-[#05090f] text-[10px]">MVP</span>
                                            </div>
                                        ) : (
                                            <div className="w-10 h-10 border-2 border-dashed border-white/10 rounded-full flex items-center justify-center text-[8px] text-white/20 opacity-0 group-hover:opacity-100 transition-opacity">
                                                DROP
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                     <div className="w-12 h-12 flex items-center justify-center opacity-30">
                                         <div className="text-[8px] text-white/50 uppercase tracking-tighter text-center leading-none">
                                            Coach
                                         </div>
                                     </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-[url('https://wallpaperaccess.com/full/3739268.jpg')] bg-cover bg-center fixed inset-0 z-[50] flex flex-col items-center justify-center p-4">
       <div className="absolute inset-0 bg-[#05090f]/90 backdrop-blur-md"></div>
       
       <div className="relative z-10 w-full max-w-6xl animate-slide-in h-full overflow-y-auto py-8">
          
          <div className="text-center mb-6">
             <div className="flex items-center justify-center gap-3 mb-2">
                 <div className="w-2 h-2 bg-[#dcb06b] rounded-full"></div>
                 <h2 className="text-[#dcb06b] font-cinzel font-bold text-xl tracking-[0.3em] uppercase">Battle Report</h2>
                 <div className="w-2 h-2 bg-[#dcb06b] rounded-full"></div>
             </div>
             <h1 className="text-3xl md:text-5xl font-orbitron font-black text-white uppercase drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
                Evaluation
             </h1>
          </div>

          {/* MVP Drag Source Area */}
          <div className="flex flex-col items-center justify-center mb-8 p-4 bg-[#0a1a2f]/50 border border-[#dcb06b]/30 rounded-lg max-w-md mx-auto">
             <div className="text-[#8a9db8] text-[10px] uppercase tracking-widest mb-3 font-bold">
                 {!mvpId ? "Drag MVP Badge to Player" : "MVP Assigned"}
             </div>
             {!mvpId ? (
                <MVPToken />
             ) : (
                <div className="flex items-center gap-2">
                     <button onClick={() => setMvpId('')} className="text-xs text-red-400 underline">Reset Selection</button>
                </div>
             )}
          </div>

          <div className="flex flex-col md:flex-row gap-8 items-start justify-center">
             
             {/* Left Column (Azure) */}
             {renderTeamColumn(match.azureTeam, "AZURE GOLEM", winner === 'azure', 'cyan')}

             {/* Right Column (Crimson) */}
             {renderTeamColumn(match.crimsonTeam, "CRIMSON GOLEM", winner === 'crimson', 'red')}

          </div>

          <div className="mt-12 flex justify-center pb-8">
             <Button onClick={() => onComplete(mvpId, ratings)} className="px-16 py-4 text-xl shadow-[0_0_20px_#dcb06b]">
                CONTINUE TO LOBBY
             </Button>
          </div>
       </div>
    </div>
  );
};
