
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
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  useEffect(() => {
    const handleClickOutside = () => setMenuOpenId(null);
    if (menuOpenId) document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [menuOpenId]);

  const toggleMenu = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPosition({ top: rect.bottom + 5, left: rect.right - 128 });
    setMenuOpenId(menuOpenId === id ? null : id);
  };

  const handleFilterClick = (val: string) => {
      setFilter(val as FilterType);
  };

  const filteredPlayers = players.filter(p => {
    let matchesCategory = true;
    if (filter === 'ACTIVE') matchesCategory = p.isActive;
    else if (filter === 'BENCH') matchesCategory = !p.isActive;
    else if (Object.values(Role).includes(filter as Role)) {
       const targetRole = filter as Role;
       matchesCategory = p.roles.includes(targetRole) || (p.isAllRoles && targetRole !== Role.COACH);
    }
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getRoleBadgeStyle = (role: Role) => {
      switch (role) {
          case Role.COACH: return 'text-white border-white bg-white/10';
          case Role.CLASH: return 'text-orange-400 border-orange-500/50 bg-orange-900/20'; 
          case Role.JUNGLE: return 'text-emerald-400 border-emerald-500/50 bg-emerald-900/20'; 
          case Role.MID: return 'text-blue-400 border-blue-500/50 bg-blue-900/20'; 
          case Role.FARM: return 'text-yellow-400 border-yellow-500/50 bg-yellow-900/20'; 
          case Role.ROAM: return 'text-cyan-400 border-cyan-500/50 bg-cyan-900/20'; 
          default: return 'text-gray-400 border-gray-600 bg-gray-800/30';
      }
  };

  const renderRatingArrows = (rating: number) => {
    if (!rating || rating === 0) return null;
    
    // Pastikan panah dirender dua kali jika nilai mutlaknya adalah 2
    if (rating > 0) {
      return (
        <div className="flex flex-col -space-y-1.5 ml-1 text-green-400 items-center justify-center">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
           {Math.abs(rating) === 2 && <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>}
        </div>
      );
    } else {
      return (
        <div className="flex flex-col -space-y-1.5 ml-1 text-red-500 items-center justify-center">
           {Math.abs(rating) === 2 && <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>}
           <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
        </div>
      );
    }
  };

  const gridClasses = isSidebarOpen ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6";

  return (
    <div>
      <div className="mb-6 flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between">
         <div className="w-full xl:flex-1 overflow-x-auto pb-2">
             <div className="flex gap-2 min-w-max">
                {['ALL', 'ACTIVE', 'BENCH', ...ROLES_ORDER, Role.COACH].map(val => (
                  <button key={val} onClick={() => handleFilterClick(val)} className={`px-4 py-2 text-[10px] uppercase font-bold tracking-wider clip-corner-sm border transition-all ${filter === val ? 'bg-[#dcb06b] text-[#05090f] border-[#dcb06b]' : 'bg-[#05090f] text-[#8a9db8] border-[#1e3a5f] hover:border-[#dcb06b]'}`}>
                    {val.split(' ')[0]}
                  </button>
                ))}
             </div>
         </div>
         <div className="relative w-full xl:w-64">
             <input type="text" placeholder="Find Player..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-[#05090f] border border-[#1e3a5f] px-3 py-1.5 pl-8 text-xs text-white focus:outline-none focus:border-[#dcb06b] clip-corner-sm font-orbitron"/>
             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-2 top-1.5 text-[#4a5f78]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
         </div>
      </div>

      <div className={`grid gap-3 ${gridClasses}`}>
        {filteredPlayers.map(player => {
          const ws = player.stats.currentStreak || 0;
          const isMvp = player.isLastMatchMvp;
          const isCoach = player.roles.includes(Role.COACH);
          
          let animationLayer = null;
          let glowColor = '';
          let primaryColor = '';

          // Hirarki Status & Warna Trace Border
          if (player.isActive) {
            if (isMvp) {
              primaryColor = '#fbbf24'; // Emas
              glowColor = 'drop-shadow-[0_0_12px_#fbbf24]';
            } else if (isCoach) {
              primaryColor = '#ffffff'; // Putih
              glowColor = 'drop-shadow-[0_0_12px_rgba(255,255,255,0.6)]';
            } else if (ws >= 2) {
              if (ws >= 5) primaryColor = '#ef4444'; // Merah
              else if (ws >= 4) primaryColor = '#f97316'; // Oren
              else if (ws >= 3) primaryColor = '#a855f7'; // Ungu
              else primaryColor = '#00d2ff'; // Biru Cyan
              
              glowColor = `drop-shadow-[0_0_10px_${primaryColor}]`;
            }

            if (primaryColor) {
               animationLayer = (
                 <div 
                   className="absolute inset-[-150%] animate-[spin_4s_linear_infinite]"
                   style={{
                     background: `conic-gradient(from 0deg, ${primaryColor} 0deg, ${primaryColor} 40deg, transparent 40deg, transparent 180deg, ${primaryColor} 180deg, ${primaryColor} 220deg, transparent 220deg, transparent 360deg)`
                   }}
                 />
               );
            }
          }

          return (
            <div key={player.id} className={`relative group h-full transition-all duration-300 min-h-[90px] ${glowColor}`}>
              {/* Animated Border Background */}
              <div className="absolute inset-0 clip-corner-sm overflow-hidden z-0 bg-[#1e3a5f]/20">
                 {animationLayer}
              </div>
              
              {/* Inner Card content */}
              <div className={`absolute inset-[2px] clip-corner-sm z-10 flex flex-col p-2 ${player.isActive ? (isCoach ? 'bg-[#000000]' : 'bg-[#05090f]') : 'bg-[#05090f]/80 grayscale backdrop-blur-sm'}`}>
                
                {/* BENCHED STAMP - Only for inactive players */}
                {!player.isActive && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none overflow-hidden">
                        <div className="absolute inset-0 bg-red-900/10 mix-blend-overlay"></div>
                        <div className="rotate-[-15deg] border-4 border-red-600/80 px-4 py-1 text-red-600/90 font-black text-2xl tracking-[0.3em] uppercase bg-black/40 backdrop-blur-sm shadow-[0_0_20px_rgba(220,38,38,0.4)] animate-pulse-fast">
                            BENCHED
                        </div>
                    </div>
                )}

                <div className="flex justify-between items-start mb-2 relative z-10">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <div className={`text-lg font-bold font-orbitron truncate ${isMvp ? 'text-yellow-400' : 'text-white'}`}>{player.name}</div>
                      {player.isActive && renderRatingArrows(player.lastMatchRating || 0)}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {isCoach ? (
                        <span className="text-[7px] border border-white text-white px-1.5 py-0.5 rounded uppercase font-black bg-white/10">COACH</span>
                      ) : player.isAllRoles ? (
                        <span className="text-[7px] border border-purple-500 text-purple-400 px-1 py-0.5 rounded uppercase">All Roles</span>
                      ) : (
                        player.roles.map(r => <span key={r} className={`text-[7px] border px-1 py-0.5 rounded uppercase ${getRoleBadgeStyle(r)}`}>{r.split(' ')[0]}</span>)
                      )}
                    </div>
                  </div>
                  
                  {/* Status Mini-Tags */}
                  <div className="flex flex-col items-end gap-1">
                    <button onClick={(e) => toggleMenu(e, player.id)} className="p-1 text-[#4a5f78] hover:text-[#dcb06b] mb-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                    </button>

                    <div className="flex flex-col gap-1 items-end">
                       {/* MVP Mini-Tag */}
                       {isMvp && player.isActive && (
                         <div className="px-2 py-0.5 text-[8px] font-black uppercase tracking-tighter bg-[#fbbf24] text-black clip-corner-sm shadow-[0_0_8px_rgba(251,191,36,0.6)]">
                            MVP
                         </div>
                       )}

                       {/* Win Streak Mini-Tag */}
                       {ws >= 2 && player.isActive && (
                         <div 
                           className="px-2 py-0.5 text-[8px] font-black uppercase tracking-tighter text-white clip-corner-sm shadow-md"
                           style={{ backgroundColor: primaryColor }}
                         >
                            {ws} WS
                         </div>
                       )}
                    </div>
                  </div>
                </div>

                <div className="mt-auto flex justify-between text-[9px] font-mono border-t border-white/5 pt-1 relative z-10">
                  <span className="text-[#8a9db8]">Matches: <span className="text-white">{player.stats.matchesPlayed}</span></span>
                  <span className="text-[#8a9db8]">WR: <span className="text-white">{player.stats.matchesPlayed > 0 ? Math.round((player.stats.wins/player.stats.matchesPlayed)*100) : 0}%</span></span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {menuOpenId && createPortal(<div className="fixed z-[9999] w-32 bg-[#05090f] border border-[#dcb06b] clip-corner-sm flex flex-col shadow-2xl" style={{ top: menuPosition.top, left: menuPosition.left }} onClick={e => e.stopPropagation()}><button onClick={() => { onToggleActive(menuOpenId); }} className="px-3 py-3 text-left text-[10px] uppercase font-bold text-white hover:bg-[#dcb06b] hover:text-black transition-colors">Toggle Active</button><button onClick={() => { onEdit(players.find(p => p.id === menuOpenId)!); }} className="px-3 py-3 text-left text-[10px] uppercase font-bold text-white hover:bg-[#dcb06b] hover:text-black transition-colors">Edit</button><button onClick={() => { onRemove(menuOpenId); }} className="px-3 py-3 text-left text-[10px] uppercase font-bold text-red-500 hover:bg-red-500 hover:text-white transition-colors">Remove</button></div>, document.body)}
    </div>
  );
};
