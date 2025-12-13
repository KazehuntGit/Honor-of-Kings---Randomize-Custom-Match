import React, { useState, useEffect, useRef } from 'react';
import { Button } from './Button';

interface SpinWheelProps {
  candidates: string[];
  winnerName: string;
  onComplete: () => void;
  onCancel: () => void;
  team: 'azure' | 'crimson';
  roleName: string;
  roomId: string;
}

export const SpinWheel: React.FC<SpinWheelProps> = ({ candidates, winnerName, onComplete, onCancel, team, roleName, roomId }) => {
  const [status, setStatus] = useState<'idle' | 'scrolling' | 'completed'>('idle');
  const [scrollPosition, setScrollPosition] = useState(0);
  
  // Ref for the scroll container
  const reelRef = useRef<HTMLDivElement>(null);
  
  // Ref to track the main animation timer so we can kill it on skip
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Configuration
  const ITEM_HEIGHT = 80; 
  const VISIBLE_ITEMS = 5; 
  const TOTAL_DURATION = 8000; 
  const WINNER_INDEX = 150; 

  const [reelItems, setReelItems] = useState<string[]>([]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    const items: string[] = [];
    const uniqueCandidates = Array.from(new Set(candidates)) as string[];
    
    // If we only have 1 candidate (or 0), we can't avoid duplicates
    if (uniqueCandidates.length <= 1) {
       for (let i = 0; i < WINNER_INDEX + VISIBLE_ITEMS + 5; i++) {
          if (i === WINNER_INDEX) {
            items.push(winnerName);
          } else {
            items.push(uniqueCandidates[0] || winnerName);
          }
       }
       setReelItems(items);
       return;
    }

    let previousName = '';

    for (let i = 0; i < WINNER_INDEX + VISIBLE_ITEMS + 5; i++) {
       if (i === WINNER_INDEX) {
         items.push(winnerName);
         previousName = winnerName;
       } else {
         // Filter available candidates to exclude the one we just added (previousName)
         // This guarantees no immediate duplicates (e.g. A, B, A, C, B) instead of (A, A, B, B)
         const availableCandidates = uniqueCandidates.filter(name => name !== previousName);
         
         // Fallback if filter empties list (shouldn't happen if uniqueCandidates > 1)
         const pool = availableCandidates.length > 0 ? availableCandidates : uniqueCandidates;
         
         const randomName = pool[Math.floor(Math.random() * pool.length)];
         items.push(randomName);
         previousName = randomName;
       }
    }
    setReelItems(items);
  }, [candidates, winnerName]);

  const calculateTargetPosition = () => {
    const containerHeight = ITEM_HEIGHT * VISIBLE_ITEMS;
    const centerOffset = (containerHeight / 2) - (ITEM_HEIGHT / 2);
    return -(WINNER_INDEX * ITEM_HEIGHT) + centerOffset;
  };

  const handleLock = () => {
    if (status !== 'idle') return;
    setStatus('scrolling');

    const targetY = calculateTargetPosition();
    setScrollPosition(targetY);

    // Set the main timer
    timerRef.current = setTimeout(() => {
       setStatus('completed');
       // Auto-close after a second if not skipped
       setTimeout(() => {
         onComplete();
       }, 1000);
    }, TOTAL_DURATION);
  };

  const handleSkip = () => {
     // 1. Kill the long animation timer immediately
     if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
     }

     // 2. Force status to completed (removes CSS transition)
     setStatus('completed');
     
     // 3. Snap to target position immediately
     const targetY = calculateTargetPosition();
     setScrollPosition(targetY);

     // 4. Slight delay to let user see the result, then close
     setTimeout(() => {
         onComplete();
     }, 500);
  };

  const themeColor = team === 'azure' ? '#00d2ff' : '#ef4444';

  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/90 backdrop-blur-xl animate-slide-in">
      
      {/* Controls: Skip & Abort */}
      <div className="absolute top-6 right-6 z-50 flex gap-4">
        {/* Skip Animation */}
        {status === 'scrolling' && (
           <button 
             onClick={handleSkip}
             className="px-4 py-2 bg-[#dcb06b]/20 border border-[#dcb06b] text-[#dcb06b] font-orbitron font-bold text-xs uppercase tracking-widest hover:bg-[#dcb06b] hover:text-black transition-colors"
           >
             Fast Forward
           </button>
        )}

        {/* Cancel Button */}
        {status === 'idle' && (
          <button 
            onClick={onCancel}
            className="group flex items-center gap-2 text-[#4a5f78] hover:text-white transition-colors"
          >
            <span className="text-xs uppercase tracking-widest font-bold opacity-0 group-hover:opacity-100 transition-opacity">Abort</span>
            <div className="w-10 h-10 rounded-full border border-[#1e3a5f] group-hover:border-red-500 flex items-center justify-center bg-[#05090f]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </button>
        )}
      </div>

      <div className="mb-8 text-center relative z-10 pointer-events-none select-none flex flex-col items-center">
        {/* HIGHLIGHTED ROOM ID */}
        <div className="relative group p-[1px] rounded clip-corner-sm mb-4">
            <div className="absolute inset-0 bg-gradient-to-r from-[#dcb06b] via-[#8a6d3b] to-[#dcb06b] animate-[spin-slow_4s_linear_infinite] opacity-80 blur-sm"></div>
            <div className="bg-[#05090f] px-6 py-2 relative z-10 clip-corner-sm border border-[#dcb06b] shadow-[inset_0_0_15px_rgba(220,176,107,0.2)]">
                <span className="text-[#f3dcb1] font-orbitron text-sm tracking-[0.2em] font-bold drop-shadow-[0_0_5px_#dcb06b]">ROOM: {roomId}</span>
            </div>
        </div>

        <h3 className="text-[#8a9db8] font-cinzel text-lg tracking-[0.3em] uppercase mb-1">
          Targeting Candidate
        </h3>
        <h2 className="text-4xl md:text-5xl font-black font-orbitron text-white uppercase drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
          <span style={{ color: themeColor }}>{team}</span> {roleName}
        </h2>
      </div>

      {/* Scroller Container */}
      <div className="relative">
         
         <div 
            className="relative overflow-hidden bg-[#05090f] border-x-2 border-[#dcb06b]/30 shadow-[0_0_50px_rgba(0,0,0,0.8)]"
            style={{ 
              width: '320px', 
              height: `${ITEM_HEIGHT * VISIBLE_ITEMS}px`
            }}
         >
            <div 
              ref={reelRef}
              className="w-full flex flex-col items-center will-change-transform"
              style={{
                transform: `translateY(${scrollPosition}px)`,
                // CSS Transition Logic:
                // If scrolling, use the long duration.
                // If completed (or idle), transition is 'none' so it snaps instantly.
                transition: status === 'scrolling' 
                   ? `transform ${TOTAL_DURATION}ms cubic-bezier(0.1, 0, 0.1, 1)` 
                   : 'none',
              }}
            >
               {status === 'idle' && (
                  <div className="absolute inset-0 flex flex-col items-center animate-[scrollFast_0.5s_linear_infinite]">
                     {reelItems.slice(0, 20).map((name, i) => (
                        <div 
                          key={`idle-${i}`} 
                          className="flex items-center justify-center w-full text-[#4a5f78] font-orbitron font-bold text-2xl uppercase opacity-50"
                          style={{ height: `${ITEM_HEIGHT}px`, flexShrink: 0 }}
                        >
                          {name}
                        </div>
                     ))}
                  </div>
               )}

               {status !== 'idle' && reelItems.map((name, index) => (
                  <div 
                    key={index}
                    className={`
                      flex items-center justify-center w-full transition-colors duration-300
                      ${(index === WINNER_INDEX && status === 'completed') 
                          ? 'text-[#dcb06b] text-3xl drop-shadow-[0_0_10px_#dcb06b]' 
                          : 'text-[#f0f4f8] text-2xl opacity-80'}
                      font-orbitron font-bold uppercase tracking-wider
                    `}
                    style={{ height: `${ITEM_HEIGHT}px`, flexShrink: 0 }}
                  >
                     {name}
                  </div>
               ))}
            </div>

            <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-[#05090f] to-transparent z-10 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#05090f] to-transparent z-10 pointer-events-none"></div>

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[80px] z-20 pointer-events-none flex items-center justify-between px-2">
               <div className={`h-full w-4 border-l-4 border-t-4 border-b-4 ${status === 'completed' ? 'border-[#dcb06b] animate-pulse' : 'border-[#4a5f78]'}`}></div>
               <div className="absolute inset-0 bg-[#dcb06b]/5 border-y border-[#dcb06b]/20"></div>
               <div className={`h-full w-4 border-r-4 border-t-4 border-b-4 ${status === 'completed' ? 'border-[#dcb06b] animate-pulse' : 'border-[#4a5f78]'}`}></div>
            </div>

            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-30 pointer-events-none bg-[length:100%_4px,6px_100%]"></div>
         </div>
      </div>

      <div className="mt-12 h-24 flex items-center justify-center">
         {status === 'idle' ? (
            <Button 
               onClick={handleLock}
               className="px-12 py-4 text-xl border-2 border-[#dcb06b] shadow-[0_0_20px_#dcb06b] animate-pulse"
            >
               LOCK TARGET
            </Button>
         ) : status === 'scrolling' ? (
            <div className="text-[#dcb06b] font-orbitron text-sm uppercase tracking-[0.5em] animate-pulse">
               Acquiring Target...
            </div>
         ) : (
             <div className="text-white font-orbitron text-sm uppercase tracking-[0.5em] animate-[bounce_1s_infinite]">
               Target Locked
            </div>
         )}
      </div>

      <style>{`
        @keyframes scrollFast {
          0% { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
      `}</style>
    </div>
  );
};