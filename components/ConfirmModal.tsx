
import React from 'react';
import { Button } from './Button';

interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title = "SYSTEM CONFIRMATION",
  message,
  onConfirm,
  onCancel,
  confirmText = "CONFIRM",
  cancelText = "CANCEL",
  isDestructive = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md animate-fade-in" 
        onClick={onCancel}
      ></div>

      {/* Modal Box */}
      <div className="relative w-full max-w-md bg-[#0a1a2f] border border-[#dcb06b] clip-corner-md shadow-[0_0_50px_rgba(0,0,0,0.9)] animate-slide-in overflow-hidden">
        
        {/* Header Decoration */}
        <div className="h-1 bg-gradient-to-r from-transparent via-[#dcb06b] to-transparent opacity-50"></div>
        
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 flex items-center justify-center rounded-full border ${isDestructive ? 'border-red-500 text-red-500 bg-red-500/10' : 'border-[#dcb06b] text-[#dcb06b] bg-[#dcb06b]/10'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-[#dcb06b] font-cinzel font-black text-lg tracking-widest uppercase">
              {title}
            </h3>
          </div>

          {/* Message */}
          <p className="text-[#8a9db8] font-orbitron text-xs leading-relaxed mb-8 tracking-wider">
            {message}
          </p>

          {/* Buttons */}
          <div className="flex gap-4">
            <Button 
              variant="secondary" 
              onClick={onCancel} 
              className="flex-1 border-[#1e3a5f] text-[#4a5f78] hover:text-white"
            >
              {cancelText}
            </Button>
            <Button 
              variant={isDestructive ? 'danger' : 'primary'} 
              onClick={() => {
                onConfirm();
                onCancel(); // Use cancel as the generic "close" after action
              }} 
              className="flex-1"
            >
              {confirmText}
            </Button>
          </div>
        </div>

        {/* Footer Decoration */}
        <div className="absolute bottom-0 right-0 w-8 h-8 pointer-events-none">
          <div className="absolute bottom-1 right-1 w-3 h-3 border-r-2 border-b-2 border-[#dcb06b]/40"></div>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};
