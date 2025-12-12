import React, { useState } from 'react';
import { MatchHistoryEntry, Role } from '../types';
import { ROLES_ORDER, RoleIcons } from '../constants';

interface HistoryListProps {
  history: MatchHistoryEntry[];
  onClear: () => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({ history, onClear }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (history.length === 0) {
    return (
      <div className="p-8 text-center border border-[#1e3a5f] bg-[#0a1a2f]/40 rounded">
        <p className="text-[#8a9db8] font-cinzel tracking-widest text-sm">No match history recorded yet.</p>
      </div>
    );
  }

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleString();
  };

  const renderRatingArrow = (rating: number) => {
      if (!rating || rating === 0) return null;
      
      if (rating > 0) {
          // Positive
          return (
             <div className="flex flex-col -space-y-1 text-green-400 ml-2" title="Performance: Good">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
                 {rating === 2 && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
                 )}
             </div>
          );
      } else {
          // Negative
          return (
             <div className="flex flex-col -space-y-1 text-red-500 ml-2" title="Performance: Bad">
                 {rating === -2 && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                 )}
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
             </div>
          );
      }
  };

  return (
    <div className="space-y-4">
       <div className="flex justify-between items-center mb-4">
          <h3 className="text-[#dcb06b] font-cinzel text-lg tracking-widest">Recent Matches</h3>
          <button onClick={onClear} className="text-[10px] text-red-400 hover:text-red-200 uppercase tracking-wider">
             Clear History
          </button>
       </div>

       <div className="space-y-3">
         {history.map((match) => {
            const isAzureWin = match.winningTeam === 'azure';
            const isCrimsonWin = match.winningTeam === 'crimson';
            const isDraw = !match.winningTeam;
            
            // Determine display roles (Coach first if present in this match history)
            const displayRoles = match.isCoachMode ? [Role.COACH, ...ROLES_ORDER] : ROLES_ORDER;

            return (
              <div key={match.id} className="border border-[#1e3a5f] bg-[#05090f] clip-corner-sm transition-all hover:border-[#dcb06b]/30">
                {/* Header Summary */}
                <div 
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-[#1e3a5f]/20 transition-colors"
                  onClick={() => toggleExpand(match.id)}
                >
                   <div className="flex items-center gap-4">
                      <div className={`
                         w-2 h-12 skew-x-[-12deg]
                         ${isAzureWin ? 'bg-cyan-500 shadow-[0_0_10px_#06b6d4]' : isCrimsonWin ? 'bg-red-500 shadow-[0_0_10px_#ef4444]' : 'bg-gray-500'}
                      `}></div>
                      <div>
                         <div className="text-xs text-[#8a9db8] font-orbitron tracking-widest mb-1">
                            ROOM: {match.roomId}
                         </div>
                         <div className={`font-cinzel font-bold text-lg ${isAzureWin ? 'text-cyan-400' : isCrimsonWin ? 'text-red-500' : 'text-gray-400'}`}>
                            {isAzureWin ? 'AZURE VICTORY' : isCrimsonWin ? 'CRIMSON VICTORY' : 'MATCH ENDED'}
                         </div>
                         <div className="text-[10px] text-[#4a5f78]">{formatDate(match.timestamp)}</div>
                      </div>
                   </div>
                   
                   <div className={`transform transition-transform duration-300 ${expandedId === match.id ? 'rotate-180' : ''}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#dcb06b]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                   </div>
                </div>

                {/* Details Accordion */}
                {expandedId === match.id && (
                  <div className="border-t border-[#1e3a5f] p-4 bg-[#0a1a2f]/30">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Azure Roster */}
                        <div>
                           <h4 className="text-cyan-500 font-cinzel text-xs tracking-widest mb-3 border-b border-cyan-500/20 pb-1">AZURE TEAM</h4>
                           <div className="space-y-2">
                              {displayRoles.map(role => {
                                 const p = match.azureTeam.find(s => s.role === role)?.player;
                                 if (!p) return null;
                                 
                                 const isMvp = match.mvpId === p.id;
                                 const rating = match.ratings?.[p.id] || 0;

                                 return (
                                    <div key={role} className="flex items-center justify-between text-sm">
                                       <span className="flex items-center gap-2 text-[#8a9db8]">
                                          <div className={`scale-90 ${role === Role.COACH ? 'text-white' : 'text-cyan-500/70'}`}>{RoleIcons[role]}</div>
                                       </span>
                                       <div className="flex items-center gap-2">
                                           {isMvp && (
                                              <span className="text-[8px] font-black bg-yellow-500 text-black px-1 rounded shadow-[0_0_5px_gold]">MVP</span>
                                           )}
                                           <span className="text-white font-orbitron">{p.name}</span>
                                           {renderRatingArrow(rating)}
                                       </div>
                                    </div>
                                 );
                              })}
                           </div>
                        </div>

                        {/* Crimson Roster */}
                        <div>
                           <h4 className="text-red-500 font-cinzel text-xs tracking-widest mb-3 border-b border-red-500/20 pb-1">CRIMSON TEAM</h4>
                           <div className="space-y-2">
                              {displayRoles.map(role => {
                                 const p = match.crimsonTeam.find(s => s.role === role)?.player;
                                 if (!p) return null;
                                 
                                 const isMvp = match.mvpId === p.id;
                                 const rating = match.ratings?.[p.id] || 0;

                                 return (
                                    <div key={role} className="flex items-center justify-between text-sm">
                                       <span className="flex items-center gap-2 text-[#8a9db8]">
                                          <div className={`scale-90 ${role === Role.COACH ? 'text-white' : 'text-red-500/70'}`}>{RoleIcons[role]}</div>
                                       </span>
                                       <div className="flex items-center gap-2">
                                           {isMvp && (
                                              <span className="text-[8px] font-black bg-yellow-500 text-black px-1 rounded shadow-[0_0_5px_gold]">MVP</span>
                                           )}
                                           <span className="text-white font-orbitron">{p.name}</span>
                                           {renderRatingArrow(rating)}
                                       </div>
                                    </div>
                                 );
                              })}
                           </div>
                        </div>
                     </div>
                  </div>
                )}
              </div>
            );
         })}
       </div>
    </div>
  );
};
