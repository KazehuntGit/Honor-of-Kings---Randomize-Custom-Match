
import React, { useState, useEffect, useRef } from 'react';

export const WIBClock: React.FC = () => {
  const [time, setTime] = useState('');
  const [isVisible, setIsVisible] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: window.innerWidth - 180, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Jakarta',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      };
      setTime(new Intl.DateTimeFormat('id-ID', options).format(now));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMinimized) return;
    setIsDragging(true);
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const newX = Math.max(0, Math.min(window.innerWidth - (isMinimized ? 40 : 160), e.clientX - dragOffset.current.x));
      const newY = Math.max(0, Math.min(window.innerHeight - (isMinimized ? 40 : 80), e.clientY - dragOffset.current.y));
      
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isMinimized]);

  if (!isVisible) return (
    <button 
      onClick={() => setIsVisible(true)}
      className="fixed bottom-4 right-4 z-[100] w-10 h-10 bg-[#0a1a2f] border border-[#dcb06b] text-[#dcb06b] flex items-center justify-center clip-corner-sm hover:bg-[#dcb06b] hover:text-black transition-all shadow-[0_0_10px_rgba(220,176,107,0.3)]"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    </button>
  );

  return (
    <div 
      style={{ left: position.x, top: position.y }}
      className={`fixed z-[100] transition-shadow duration-300 ${isDragging ? 'shadow-[0_0_20px_rgba(220,176,107,0.5)]' : 'shadow-xl'}`}
    >
      {isMinimized ? (
        <button 
          onClick={() => setIsMinimized(false)}
          className="w-10 h-10 bg-[#0a1a2f]/90 backdrop-blur-md border border-[#dcb06b] text-[#dcb06b] flex items-center justify-center clip-corner-sm hover:scale-110 transition-transform"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </button>
      ) : (
        <div className="w-40 bg-[#0a1a2f]/90 backdrop-blur-md border border-[#dcb06b]/50 clip-corner-sm flex flex-col overflow-hidden">
          {/* Draggable Header */}
          <div 
            onMouseDown={handleMouseDown}
            className={`h-6 bg-[#dcb06b]/20 flex items-center justify-between px-2 cursor-move select-none border-b border-[#dcb06b]/30 ${isDragging ? 'bg-[#dcb06b]/40' : ''}`}
          >
            <div className="flex gap-1">
               <div className="w-1.5 h-1.5 bg-[#dcb06b] rounded-full animate-pulse"></div>
               <span className="text-[8px] font-orbitron font-bold text-[#dcb06b] tracking-tighter">WIB SYSTEM</span>
            </div>
            <div className="flex gap-1">
              <button onClick={() => setIsMinimized(true)} className="text-[#dcb06b] hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
              </button>
              <button onClick={() => setIsVisible(false)} className="text-[#dcb06b] hover:text-red-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>
          
          {/* Time Display */}
          <div className="p-3 flex flex-col items-center">
             <div className="text-xl font-orbitron font-black text-white tracking-widest drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
                {time}
             </div>
             <div className="text-[7px] font-orbitron text-[#dcb06b] uppercase tracking-[0.3em] mt-1 opacity-60">
                Western Indonesia Time
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
