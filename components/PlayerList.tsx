import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Player, Role } from '../types';
import { ROLES_ORDER } from '../constants';

interface PlayerListProps {
  players: Player[];
  onRemove: (id: string) => void;
  onToggleActive: (id: string) => void;
  onEdit: (player: Player) => void;
  isSidebarOpen?: boolean;
}

type FilterType = 'ALL' | 'ACTIVE' | 'BENCH' | Role;

export const PlayerList: React.FC<PlayerListProps> = ({ players, onRemove, onToggleActive, onEdit, isSidebarOpen = true }) => {
  const [filter, setFilter] = useState<FilterType>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Menu State (Only for Player Context Menu now)
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
        setMenuOpenId(null);
    };
    const handleScroll = () => {
        setMenuOpenId(null);
    }; 

    if (menuOpenId) {
      document.addEventListener('click', handleClickOutside);
      window.addEventListener('scroll', handleScroll, true);
    }
    return () => {
      document.removeEventListener('click', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [menuOpenId]);

  const toggleMenu = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (menuOpenId === id) {
        setMenuOpenId(null);
    } else {
        const rect = e.currentTarget.getBoundingClientRect();
        setMenuPosition({
            top: rect.bottom + 5,
            left: rect.right - 128
        });
        setMenuOpenId(id);
    }
  };

  const filteredPlayers = players.filter(p => {
    let matchesCategory = true;
    if (filter === 'ACTIVE') matchesCategory = p.isActive;
    else if (filter === 'BENCH') matchesCategory = !p.isActive;
    else if (Object.values(Role).includes(filter as Role)) {
       matchesCategory = p.roles.includes(filter as Role);
    }
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const filters: { label: string; value: FilterType; icon?: React.ReactNode }[] = [
    { label: 'All', value: 'ALL' },
    { label: 'Playing', value: 'ACTIVE' },
    { label: 'Benched', value: 'BENCH' },
    ...ROLES_ORDER.map(r => ({ label: r.split(' ')[0], value: r })),
    { label: 'Coach', value: Role.COACH }
  ];

  const getRoleBadgeStyle = (role: Role) => {
      switch (role) {
          case Role.COACH: return 'text-white border-white bg-white/10 shadow-[0_0_10px_rgba(255,255,255,0.5)]';
          case Role.CLASH: return 'text-orange-400 border-orange-500/50 bg-orange-900/20'; 
          case Role.JUNGLE: return 'text-emerald-400 border-emerald-500/50 bg-emerald-900/20'; 
          case Role.MID: return 'text-blue-400 border-blue-500/50 bg-blue-900/20'; 
          case Role.FARM: return 'text-yellow-400 border-yellow-500/50 bg-yellow-900/20'; 
          case Role.ROAM: return 'text-cyan-400 border-cyan-500/50 bg-cyan-900/20'; 
          default: return 'text-gray-400 border-gray-600 bg-gray-800/30';
      }
  };

  if (players.length === 0) {
    return (
      <div className="h-full min-h-[300px] flex flex-col items-center justify-center border border-dashed border-[#1e3a5f] rounded-lg bg-[#0a1a2f]/30 p-8">
        <div className="w-20 h-20 rounded-full bg-[#1e3a5f]/50 flex items-center justify-center mb-4 border border-[#dcb06b]/20">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#dcb06b]/50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
        </div>
        <p className="text-[#8a9db8] font-cinzel tracking-widest text-sm">Waiting for Challengers</p>
      </div>
    );
  }

  // Adjusted Grid Logic: 3xN when Sidebar Open
  const gridClasses = isSidebarOpen
      ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" 
      : "grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6";

  return (
    <div>
      {/* FILTER & SEARCH BAR */}
      <div className="mb-6 flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between">
         
         {/* Filter Horizontal Scroll List (1x9) */}
         <div className="w-full xl:flex-1 overflow-x-auto pb-2">
             <div className="flex gap-2 min-w-max">
                {filters.map(f => (
                  <button
                    key={f.value}
                    onClick={() => setFilter(f.value)}
                    className={`
                      flex items-center justify-center px-4 py-2 text-[10px] uppercase font-bold tracking-wider clip-corner-sm border transition-all
                      ${filter === f.value 
                          ? 'bg-[#dcb06b] text-[#05090f] border-[#dcb06b] shadow-[0_0_10px_#dcb06b] scale-105' 
                          : 'bg-[#05090f] text-[#8a9db8] border-[#1e3a5f] hover:border-[#dcb06b] hover:text-white hover:bg-[#1e3a5f]/30'}
                    `}
                  >
                    {f.label}
                  </button>
                ))}
             </div>
         </div>

         <div className="relative w-full xl:w-64 shrink-0">
             <input 
               type="text" 
               placeholder="Find Player..." 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="w-full bg-[#05090f] border border-[#1e3a5f] px-3 py-1.5 pl-8 text-xs text-[#f0f4f8] focus:outline-none focus:border-[#dcb06b] clip-corner-sm font-orbitron placeholder-[#4a5f78]"
             />
             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-2 top-1.5 text-[#4a5f78]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
             </svg>
         </div>
      </div>

      {/* PLAYER GRID */}
      <div className={`grid gap-3 transition-all duration-500 ${gridClasses}`}>
        {filteredPlayers.map(player => {
          const isActive = player.isActive;
          const stats = player.stats || { matchesPlayed: 0, wins: 0, currentStreak: 0, maxStreak: 0 };
          const winRate = stats.matchesPlayed > 0 
            ? Math.round((stats.wins / stats.matchesPlayed) * 100) 
            : 0;
          
          const streak = stats.currentStreak;
          const isHot = streak >= 3 && streak < 6; 
          const isGodlike = streak >= 6;
          const isMvp = player.isLastMatchMvp;
          const hasCoachRole = player.roles.includes(Role.COACH);

          // --- ANIMATED BORDER LOGIC ---
          let animationLayer = null;
          let glowClass = "";

          if (isActive) {
              if (isMvp) {
                  glowClass = "drop-shadow-[0_0_15px_rgba(251,191,36,0.6)]";
                  animationLayer = (
                      <div className="absolute inset-[-50%] bg-[conic-gradient(from_0deg,transparent_0deg,#fbbf24_90deg,transparent_180deg,#fbbf24_270deg,transparent_360deg)] animate-[spin_4s_linear_infinite] opacity-100"></div>
                  );
              } else if (hasCoachRole) {
                  glowClass = "drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]";
                  animationLayer = (
                      <div className="absolute inset-[-50%] bg-[conic-gradient(from_0deg,transparent_0deg,#ffffff_90deg,transparent_180deg,#ffffff_270deg,transparent_360deg)] animate-[spin_6s_linear_infinite] opacity-80"></div>
                  );
              } else if (isGodlike) {
                  glowClass = "drop-shadow-[0_0_20px_rgba(239,68,68,0.8)]";
                  animationLayer = (
                      <div className="absolute inset-[-50%] bg-[conic-gradient(from_0deg,transparent_0deg,#ef4444_60deg,#7f1d1d_120deg,transparent_180deg,#ef4444_240deg,transparent_360deg)] animate-[spin_2s_linear_infinite] opacity-100"></div>
                  );
              } else if (isHot) {
                  glowClass = "drop-shadow-[0_0_10px_rgba(6,182,212,0.6)]";
                  animationLayer = (
                      <div className="absolute inset-[-50%] bg-[conic-gradient(from_0deg,transparent_0deg,#06b6d4_90deg,transparent_180deg,#06b6d4_270deg,transparent_360deg)] animate-[spin_3s_linear_infinite] opacity-100"></div>
                  );
              }
          }

          const cardBg = isActive && hasCoachRole ? 'bg-[#000000]' : 'bg-[#05090f]';

          return (
            <React.Fragment key={player.id}>
              {menuOpenId === player.id && createPortal(
                <div 
                   className="fixed z-[9999] w-32 bg-[#05090f] border border-[#dcb06b] shadow-[0_0_20px_rgba(0,0,0,0.9)] clip-corner-sm flex flex-col animate-slide-in"
                   style={{ 
                      top: menuPosition.top, 
                      left: menuPosition.left 
                   }}
                   onClick={(e) => e.stopPropagation()}
                >
                    <button 
                      onClick={(e) => { e.stopPropagation(); onToggleActive(player.id); setMenuOpenId(null); }}
                      className="px-3 py-3 text-left text-[10px] uppercase font-bold text-[#f0f4f8] hover:bg-[#dcb06b] hover:text-[#05090f] transition-colors"
                    >
                       {isActive ? 'Bench Player' : 'Activate'}
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onEdit(player); setMenuOpenId(null); }}
                      className="px-3 py-3 text-left text-[10px] uppercase font-bold text-[#f0f4f8] hover:bg-[#dcb06b] hover:text-[#05090f] transition-colors"
                    >
                       Edit Details
                    </button>
                    <div className="h-[1px] bg-[#1e3a5f] w-full"></div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onRemove(player.id); setMenuOpenId(null); }}
                      className="px-3 py-3 text-left text-[10px] uppercase font-bold text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                    >
                       Remove
                    </button>
                 </div>,
                 document.body
              )}

              <div className={`relative group ${glowClass} tilt-card h-full transition-all duration-300`}>
                
                <div className="absolute inset-0 clip-corner-sm overflow-hidden z-0">
                    <div className="absolute inset-0 bg-[#1e3a5f]"></div>
                    {animationLayer}
                </div>

                <div 
                  className={`
                    absolute inset-[1px] clip-corner-sm z-10 flex flex-col gap-1 p-2
                    ${cardBg}
                    ${!isActive ? 'opacity-50 grayscale hover:opacity-80 transition-opacity' : ''}
                  `}
                >
                  
                  <div className="flex justify-between items-start gap-2">
                     
                     <div className="flex-1 min-w-0">
                        {/* Name */}
                        <div className="flex items-center gap-2 mb-1">
                            <div 
                                className={`text-lg font-bold font-orbitron tracking-wide leading-none truncate ${isMvp ? 'text-yellow-400' : 'text-[#e2e8f0]'}`}
                                title={player.name}
                            >
                                {player.name}
                            </div>
                            
                            {/* Badges */}
                            {isMvp && <div className="text-[8px] font-black bg-gradient-to-r from-yellow-400 to-yellow-600 text-black px-1.5 py-0.5 rounded-sm shadow-[0_0_10px_#fbbf24] animate-pulse">MVP</div>}
                            
                            {!isMvp && isGodlike && isActive && (
                               <span className="text-[8px] text-red-500 animate-pulse font-black">GODLIKE</span>
                            )}
                        </div>

                        <div className="flex flex-wrap gap-1">
                            {hasCoachRole ? (
                                // Exclusive Coach Badge - If player is Coach, ONLY show this.
                                <div className={`px-1.5 py-0.5 border clip-corner-sm ${getRoleBadgeStyle(Role.COACH)}`}>
                                    <span className="text-[7px] uppercase font-bold leading-none whitespace-nowrap opacity-100">
                                        COACH
                                    </span>
                                </div>
                            ) : (
                                // Standard Role Rendering
                                player.isAllRoles ? (
                                  <div className={`px-1.5 py-0.5 border clip-corner-sm bg-purple-900/20 text-purple-400 border-purple-500/30`}>
                                    <span className="text-[8px] font-bold uppercase whitespace-nowrap">All Roles</span>
                                  </div>
                                ) : (
                                  player.roles.map(role => (
                                      <div key={role} className={`px-1.5 py-0.5 border clip-corner-sm ${getRoleBadgeStyle(role)}`}>
                                          <span className="text-[7px] uppercase font-bold leading-none whitespace-nowrap opacity-100">
                                              {role.split(' ')[0]}
                                          </span>
                                      </div>
                                  ))
                                )
                            )}
                        </div>
                     </div>

                     <div className="relative shrink-0">
                        <button 
                           onClick={(e) => toggleMenu(e, player.id)}
                           className={`p-1 text-[#4a5f78] hover:text-[#dcb06b] hover:bg-white/5 transition-colors rounded`}
                        >
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                           </svg>
                        </button>
                     </div>
                  </div>

                  {/* Stats - ALWAYS Visible */}
                  <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] font-mono mt-auto pt-2 border-t border-white/5 ${isActive ? 'text-gray-400' : 'text-[#4a5f78]/50'}`}>
                      <div className="whitespace-nowrap">
                        Match: <span className="text-[#f0f4f8]">{stats.matchesPlayed}</span>
                      </div>
                      <div className="whitespace-nowrap">
                        WR: <span className={`${winRate >= 60 ? 'text-[#dcb06b]' : winRate >= 50 ? 'text-[#f0f4f8]' : 'text-red-400'}`}>{winRate}%</span>
                      </div>
                      {streak > 1 && (
                        <div className="whitespace-nowrap ml-auto">
                            <span className={`${isGodlike ? 'text-red-500 font-black animate-pulse' : isHot ? 'text-cyan-400 font-bold' : 'text-gray-400'}`}>
                                {streak} Win Streak
                            </span>
                        </div>
                      )}
                  </div>
                  
                  {!isActive && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                      <span className="text-[#0a1a2f] font-black text-xl -rotate-12 opacity-40 uppercase tracking-widest select-none bg-[#dcb06b] px-1 mix-blend-screen">Benched</span>
                    </div>
                  )}
                </div>
                
                <div className="invisible p-2 flex flex-col gap-1 min-h-[72px]">
                   <div className="text-lg">Placeholder</div>
                   <div className="text-[7px]">Roles</div>
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};