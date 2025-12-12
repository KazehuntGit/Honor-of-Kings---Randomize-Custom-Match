import React from 'react';
import { MatchResult, TeamSlot, Role } from '../types';
import { ROLES_ORDER, RoleIcons } from '../constants';
import { Button } from './Button';

interface MatchSummaryProps {
  match: MatchResult;
  onReset: (winner: 'azure' | 'crimson' | null) => void;
}

export const MatchSummary: React.FC<MatchSummaryProps> = ({ match, onReset }) => {
  const getPlayer = (slots: TeamSlot[], role: Role) => slots.find(s => s.role === role)?.player;

  return (
    <div className="min-h-screen bg-[url('https://wallpaperaccess.com/full/3739268.jpg')] bg-cover bg-center bg-no-repeat bg-fixed relative flex flex-col items-center justify-center p-4">
       {/* Dark Overlay */}
       <div className="absolute inset-0 bg-[#05090f]/90 backdrop-blur-sm z-0"></div>

       <div className="relative z-10 w-full max-w-7xl animate-slide-in">
          
          {/* Header */}
          <div className="text-center mb-10">
             <h1 className="text-4xl md:text-6xl font-cinzel font-black text-transparent bg-clip-text bg-gradient-to-b from-[#f3dcb1] to-[#dcb06b] drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]">
                BATTLE FINISHED
             </h1>
             <p className="text-[#8a9db8] font-orbitron tracking-[0.3em] mt-2">ROOM ID: {match.roomId}</p>
          </div>

          <div className="flex flex-col lg:flex-row gap-6 items-stretch justify-center relative">
             
             {/* AZURE TEAM */}
             <div className="flex-1 bg-gradient-to-r from-[#0a1a2f]/80 to-transparent p-6 border-l-4 border-cyan-500 clip-corner-md shadow-[0_0_30px_rgba(6,182,212,0.1)]">
                <h2 className="text-3xl font-cinzel text-cyan-400 mb-6 flex items-center gap-3">
                   <div className="w-3 h-12 bg-cyan-500 skew-x-[-12deg]"></div>
                   AZURE GOLEM
                </h2>
                <div className="space-y-4">
                   {ROLES_ORDER.map((role) => {
                      const player = getPlayer(match.azureTeam, role);
                      return (
                        <div key={role} className="flex items-center gap-4 group">
                           {/* Fixed width pill for alignment */}
                           <div className="shrink-0 flex items-center justify-center w-32 py-1 bg-[#05090f] border border-cyan-500/30 rounded text-cyan-500 group-hover:bg-cyan-500 group-hover:text-black transition-colors">
                              {RoleIcons[role]}
                           </div>
                           <div className="min-w-0">
                              <div className="text-xl font-orbitron text-white truncate">{player?.name}</div>
                           </div>
                        </div>
                      );
                   })}
                </div>
             </div>

             {/* VS DIVIDER */}
             {/* Adjusted spacing and positioning to avoid overlap */}
             <div className="relative z-20 flex items-center justify-center shrink-0 my-4 lg:my-0 lg:-mx-8">
                <div className="relative w-24 h-24 lg:w-32 lg:h-32 flex items-center justify-center">
                   <div className="absolute inset-0 bg-[#dcb06b] rotate-45 opacity-20 blur-xl animate-pulse"></div>
                   <div className="absolute inset-0 border-4 border-[#dcb06b] rotate-45 bg-[#05090f] shadow-lg"></div>
                   <span className="text-4xl lg:text-5xl font-black italic text-[#dcb06b] font-orbitron z-10 pr-1 pt-1">VS</span>
                   
                   {/* Lightning Effects */}
                   <div className="absolute top-0 left-1/2 w-[2px] h-full bg-white/50 blur-[1px] -translate-x-1/2 animate-lightning"></div>
                </div>
             </div>

             {/* CRIMSON TEAM */}
             <div className="flex-1 bg-gradient-to-l from-[#1a0505]/80 to-transparent p-6 border-r-4 border-red-500 clip-corner-md text-right shadow-[0_0_30px_rgba(239,68,68,0.1)]">
                <h2 className="text-3xl font-cinzel text-red-500 mb-6 flex items-center justify-end gap-3">
                   CRIMSON GOLEM
                   <div className="w-3 h-12 bg-red-500 skew-x-[12deg]"></div>
                </h2>
                <div className="space-y-4">
                   {ROLES_ORDER.map((role) => {
                      const player = getPlayer(match.crimsonTeam, role);
                      return (
                        <div key={role} className="flex flex-row-reverse items-center gap-4 group">
                           {/* Fixed width pill for alignment */}
                           <div className="shrink-0 flex items-center justify-center w-32 py-1 bg-[#05090f] border border-red-500/30 rounded text-red-500 group-hover:bg-red-500 group-hover:text-black transition-colors">
                              {RoleIcons[role]}
                           </div>
                           <div className="min-w-0">
                              <div className="text-xl font-orbitron text-white truncate">{player?.name}</div>
                           </div>
                        </div>
                      );
                   })}
                </div>
             </div>
          </div>

          {/* Footer Actions: Declare Winner */}
          <div className="mt-16 flex flex-col items-center gap-4">
             <div className="text-[#dcb06b] uppercase tracking-[0.5em] text-xs font-bold mb-2">Declare Winner & Save History</div>
             
             <div className="flex flex-wrap justify-center gap-6">
                <button 
                  onClick={() => onReset('azure')}
                  className="group relative px-10 py-4 bg-[#0a1a2f] border-2 border-cyan-500 clip-corner-sm hover:bg-cyan-900/50 transition-all duration-300 overflow-hidden"
                >
                   <div className="absolute inset-0 bg-cyan-400/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                   <span className="relative z-10 font-cinzel font-black text-xl text-cyan-400 group-hover:text-white tracking-widest">
                      AZURE VICTORY
                   </span>
                </button>

                <Button onClick={() => onReset(null)} variant="secondary" className="px-8 border-[#8a9db8] text-[#8a9db8]">
                   ABANDON / DRAW
                </Button>

                <button 
                  onClick={() => onReset('crimson')}
                  className="group relative px-10 py-4 bg-[#1a0505] border-2 border-red-500 clip-corner-sm hover:bg-red-900/50 transition-all duration-300 overflow-hidden"
                >
                   <div className="absolute inset-0 bg-red-500/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                   <span className="relative z-10 font-cinzel font-black text-xl text-red-500 group-hover:text-white tracking-widest">
                      CRIMSON VICTORY
                   </span>
                </button>
             </div>
          </div>
       </div>
    </div>
  );
};