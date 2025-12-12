import React, { useEffect, useState } from 'react';
import { TeamSlot, Role } from '../types';
import { Button } from './Button';
import { RoleIcons } from '../constants';

interface PortalTransitionProps {
  onComplete: () => void;
  azureTeam: TeamSlot[];
  crimsonTeam: TeamSlot[];
}

export const PortalTransition: React.FC<PortalTransitionProps> = ({ onComplete, azureTeam, crimsonTeam }) => {
  const [stage, setStage] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    // Sequence:
    // 0ms: Start (Empty)
    // 100ms: Slide In (Stage 1)
    // 800ms: Impact/Shake (Stage 2) - Rosters Fade In
    
    const t1 = setTimeout(() => setStage(1), 100);
    const t2 = setTimeout(() => setStage(2), 800);

    // Timer Interval
    const interval = setInterval(() => {
       setElapsedSeconds(prev => prev + 1);
    }, 1000);

    return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearInterval(interval);
    };
  }, []);

  const handleNext = () => {
    setStage(3); // Fade out
    setTimeout(() => {
        onComplete();
    }, 500);
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const renderTeamSection = (teamSlots: TeamSlot[], alignment: 'left' | 'right') => {
      // Separate Coach from Players
      const coachSlot = teamSlots.find(s => s.role === Role.COACH);
      const playerSlots = teamSlots.filter(s => s.role !== Role.COACH);

      const isRightAligned = alignment === 'right'; // Azure (Left Panel) aligns content to the right
      
      // Styling config based on side (Azure vs Crimson) - PLAYERS ONLY
      const mainColor = isRightAligned ? '#00d2ff' : '#ef4444'; // Cyan vs Red
      const borderColor = isRightAligned ? 'border-[#00d2ff]' : 'border-[#ef4444]';
      const bgColor = isRightAligned ? 'bg-[#00d2ff]/10' : 'bg-[#ef4444]/10';
      const textColor = isRightAligned ? 'text-[#00d2ff]' : 'text-[#ef4444]';
      const gradient = isRightAligned 
         ? 'bg-gradient-to-l from-[#00d2ff]/20 to-transparent' 
         : 'bg-gradient-to-r from-[#ef4444]/20 to-transparent';

      return (
        <div className={`flex flex-col ${isRightAligned ? 'items-end' : 'items-start'} relative`}>
            
            {/* COACH SECTION (TOP) */}
            {coachSlot && (
                <div className={`mb-6 relative flex flex-col ${isRightAligned ? 'items-end' : 'items-start'}`}>
                    {/* Connecting Line from Coach to Players */}
                    <div className={`
                        absolute top-full w-[2px] h-full bg-gradient-to-b from-white via-white/50 to-transparent z-0
                        ${isRightAligned ? 'right-8' : 'left-8'}
                        ${stage >= 2 ? 'opacity-50' : 'opacity-0'} transition-opacity duration-1000
                    `}></div>

                    <div 
                        className={`
                            flex items-center gap-4 transition-all duration-700 transform relative z-10
                            ${stage >= 2 ? 'translate-x-0 opacity-100' : (isRightAligned ? '-translate-x-10' : 'translate-x-10') + ' opacity-0'}
                            ${!isRightAligned ? 'flex-row-reverse' : ''}
                        `}
                    >
                         {/* Name Card - WHITE THEME */}
                         <div className={`
                            bg-white/10 border-white/50 py-3 px-6 clip-corner-sm relative group overflow-hidden min-w-[220px] 
                            ${isRightAligned ? 'text-right border-r-2' : 'text-left border-l-2'}
                            shadow-[0_0_15px_rgba(255,255,255,0.3)]
                         `}>
                            <div className={`absolute inset-0 ${isRightAligned ? 'bg-gradient-to-l' : 'bg-gradient-to-r'} from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                            <span className="block text-[9px] uppercase tracking-widest text-white/70 mb-0.5 font-bold">Team Coach</span>
                            <span className="relative z-10 text-white font-orbitron font-bold text-xl md:text-2xl drop-shadow-md tracking-wide">
                              {coachSlot.player.name}
                            </span>
                         </div>

                         {/* Coach Icon */}
                         <div className="relative">
                           <div className="px-2 py-2 flex items-center justify-center bg-[#0a1a2f] border border-white text-white clip-corner-sm shadow-[0_0_15px_white] w-32 h-[3.5rem]">
                              <div className="scale-90">{RoleIcons[Role.COACH]}</div>
                           </div>
                         </div>
                    </div>
                </div>
            )}

            {/* PLAYERS SECTION */}
            <div className={`space-y-4 ${coachSlot ? 'mt-2' : ''}`}>
                {playerSlots.map((slot, idx) => (
                    <div 
                    key={idx} 
                    className={`
                        flex items-center gap-4 transition-all duration-500 transform
                        ${stage >= 2 ? 'translate-x-0 opacity-100' : (isRightAligned ? '-translate-x-10' : 'translate-x-10') + ' opacity-0'}
                        ${!isRightAligned ? 'flex-row-reverse' : ''}
                    `}
                    style={{ transitionDelay: `${800 + (idx * 100)}ms` }}
                    >
                        {/* Name Card */}
                        <div className={`
                            ${bgColor} ${isRightAligned ? 'border-r-2 pr-4 pl-8 text-right' : 'border-l-2 pl-4 pr-8 text-left'} 
                            ${borderColor} py-2 clip-corner-sm relative group overflow-hidden min-w-[200px]
                        `}>
                            <div className={`absolute inset-0 ${gradient} opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                            <span className="relative z-10 text-white font-orbitron font-bold text-lg md:text-xl drop-shadow-md tracking-wide">
                                {slot.player.name}
                            </span>
                        </div>

                        {/* Role Icon/Badge */}
                        <div className="relative">
                            <div className={`px-2 py-2 flex items-center justify-center bg-[#0a1a2f] border ${borderColor} ${textColor} clip-corner-sm shadow-[0_0_10px_currentColor] w-32`}>
                                <div className="scale-75">{RoleIcons[slot.role]}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      );
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center overflow-hidden font-inter">
        
        {/* Background Flash on Impact */}
        <div className={`
            absolute inset-0 bg-white pointer-events-none z-50
            ${stage === 2 ? 'animate-[impact-flash_0.5s_ease-out_forwards]' : 'opacity-0'}
        `}></div>

        {/* Shake Container */}
        <div className={`
            absolute inset-0 flex items-center justify-center w-full h-full
            ${stage === 2 ? 'animate-[clash-shake_0.5s_ease-in-out]' : ''}
            transition-opacity duration-500
            ${stage === 3 ? 'opacity-0' : 'opacity-100'}
        `}>
            
            {/* LEFT SIDE - AZURE GOLEM */}
            <div className={`
                absolute left-0 top-0 bottom-0 w-1/2 
                bg-gradient-to-r from-[#0a1a2f] to-[#00d2ff]/30
                flex flex-col items-end justify-center
                border-r-4 border-[#00d2ff]
                pr-8 md:pr-48
                transform transition-all duration-700 ease-in
                ${stage >= 1 ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="text-right w-full max-w-xl">
                    <div className="text-[#00d2ff] font-cinzel font-black text-3xl md:text-5xl tracking-[0.1em] drop-shadow-[0_0_20px_#00d2ff] whitespace-nowrap mb-8 relative">
                        AZURE GOLEM
                        <div className="absolute -bottom-2 right-0 w-1/2 h-1 bg-[#00d2ff] shadow-[0_0_10px_#00d2ff]"></div>
                    </div>
                    
                    {renderTeamSection(azureTeam, 'right')}
                </div>
            </div>

            {/* RIGHT SIDE - CRIMSON GOLEM */}
            <div className={`
                absolute right-0 top-0 bottom-0 w-1/2 
                bg-gradient-to-l from-[#1a0505] to-[#ef4444]/30
                flex flex-col items-start justify-center
                border-l-4 border-[#ef4444]
                pl-8 md:pl-48
                transform transition-all duration-700 ease-in
                ${stage >= 1 ? 'translate-x-0' : 'translate-x-full'}
            `}>
                <div className="text-left w-full max-w-xl">
                    <div className="text-[#ef4444] font-cinzel font-black text-3xl md:text-5xl tracking-[0.1em] drop-shadow-[0_0_20px_#ef4444] whitespace-nowrap mb-8 relative">
                        CRIMSON GOLEM
                        <div className="absolute -bottom-2 left-0 w-1/2 h-1 bg-[#ef4444] shadow-[0_0_10px_#ef4444]"></div>
                    </div>

                    {renderTeamSection(crimsonTeam, 'left')}
                </div>
            </div>

            {/* CENTER VS & Loading State */}
            <div className={`
                absolute z-40 flex flex-col items-center justify-center transform transition-all duration-300
                ${stage >= 2 ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}
            `}>
                <div className="relative w-24 h-24 md:w-32 md:h-32 flex items-center justify-center mb-8">
                    <div className="absolute inset-0 bg-[#dcb06b] rotate-45 animate-pulse"></div>
                    <div className="absolute inset-1 bg-black rotate-45"></div>
                    <span className="relative z-10 text-[#dcb06b] font-orbitron font-black text-4xl md:text-5xl italic">VS</span>
                </div>

                {/* Loading / Timer UI */}
                <div className="flex flex-col items-center gap-2 mb-8 bg-black/50 p-4 rounded-lg backdrop-blur-sm border border-[#dcb06b]/30">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-[#dcb06b] border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-[#dcb06b] text-xs font-orbitron tracking-widest uppercase animate-pulse">Match in Progress</span>
                    </div>
                    <div className="text-white font-mono text-2xl tracking-widest font-bold">
                       {formatTime(elapsedSeconds)}
                    </div>
                </div>

                <Button onClick={handleNext} className="px-8 border-[#dcb06b] shadow-[0_0_15px_#dcb06b] hover:scale-110">
                    ENTER BATTLEFIELD
                </Button>
            </div>

        </div>

        {/* Particles / Debris (Simple CSS) */}
        {stage >= 2 && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-1/2 left-1/2 w-1 h-20 bg-[#dcb06b] rotate-45 animate-[fly-out_0.5s_ease-out_forwards]"></div>
            </div>
        )}
    </div>
  );
};