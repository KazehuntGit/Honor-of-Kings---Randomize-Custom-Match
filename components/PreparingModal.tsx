
import React from 'react';
import { Button } from './Button';

interface PreparingModalProps {
  isOpen: boolean;
  message: string;
  error: string | null;
  onClose: () => void;
}

export const PreparingModal: React.FC<PreparingModalProps> = ({ isOpen, message, error, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/90 backdrop-blur-xl animate-fade-in px-4">
      <div className="flex flex-col items-center max-w-lg w-full text-center p-8 border-y-2 border-[#dcb06b] bg-[#0a1a2f]/40 relative overflow-hidden clip-corner-md shadow-[0_0_50px_rgba(220,176,107,0.2)]">
        {/* Shimmer Effect Top */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#dcb06b] to-transparent animate-[shimmer_2s_infinite]"></div>
        
        {error ? (
          <div className="animate-slide-in">
            <div className="text-red-500 text-6xl mb-6 drop-shadow-[0_0_15px_rgba(239,68,68,0.6)]">⚠️</div>
            <h2 className="text-red-500 font-cinzel font-black text-2xl tracking-[0.2em] mb-4">VALIDATION FAILED</h2>
            <p className="text-white/80 font-orbitron text-xs md:text-sm leading-relaxed mb-8 tracking-wide border-l-2 border-red-500/30 pl-4 text-left">
              {error}
            </p>
            <Button onClick={onClose} variant="secondary" className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white w-full">
              ACKNOWLEDGE
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="relative mb-8">
                <div className="w-20 h-20 border-4 border-[#dcb06b]/30 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-[#dcb06b] border-t-transparent rounded-full animate-spin shadow-[0_0_20px_#dcb06b]"></div>
                <div className="absolute inset-4 bg-[#dcb06b] rounded-full animate-pulse opacity-20"></div>
            </div>
            
            <h2 className="text-[#dcb06b] font-cinzel font-black text-2xl md:text-3xl tracking-[0.3em] mb-3 uppercase animate-pulse drop-shadow-[0_0_10px_rgba(220,176,107,0.5)]">
              SYSTEM CHECK
            </h2>
            
            <div className="h-[1px] w-32 bg-gradient-to-r from-transparent via-[#dcb06b] to-transparent mb-6"></div>

            <p className="text-[#4a5f78] font-orbitron text-xs tracking-[0.2em] animate-pulse uppercase">
              {message}
            </p>
            
            {/* Tech Decoration */}
            <div className="mt-8 flex gap-1 opacity-50">
                <div className="w-2 h-2 bg-[#dcb06b] rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                <div className="w-2 h-2 bg-[#dcb06b] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-[#dcb06b] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        )}
        
        {/* Shimmer Effect Bottom */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#dcb06b] to-transparent animate-[shimmer_2s_infinite_reverse]"></div>
      </div>
      
      <style>{`
        @keyframes shimmer {
            0% { transform: translateX(-100%); opacity: 0; }
            50% { opacity: 1; }
            100% { transform: translateX(100%); opacity: 0; }
        }
      `}</style>
    </div>
  );
};
