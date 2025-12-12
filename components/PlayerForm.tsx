import React, { useState } from 'react';
import { Player, Role } from '../types';
import { Button } from './Button';
import { ROLES_ORDER } from '../constants';

interface PlayerFormProps {
  onAddPlayer: (player: Omit<Player, 'id' | 'isActive' | 'stats'>) => void;
  isCoachMode: boolean; // Received from App
}

export const PlayerForm: React.FC<PlayerFormProps> = ({ onAddPlayer, isCoachMode }) => {
  const [mode, setMode] = useState<'manual' | 'smart'>('manual');
  
  // Manual State
  const [name, setName] = useState('');
  const [isAllRoles, setIsAllRoles] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<Role[]>([]);

  // Smart State
  const [smartInput, setSmartInput] = useState('');

  const toggleRole = (role: Role) => {
    if (isAllRoles) return;
    
    // If selecting Coach, clear other roles as Coach is exclusive in this logic
    if (role === Role.COACH) {
        setSelectedRoles(prev => prev.includes(Role.COACH) ? [] : [Role.COACH]);
        return;
    }

    // If Coach was selected, remove it when selecting others
    let currentRoles = selectedRoles.filter(r => r !== Role.COACH);

    currentRoles = currentRoles.includes(role) 
        ? currentRoles.filter(r => r !== role) 
        : [...currentRoles, role];
        
    // Check if all 5 standard roles are selected
    const isFullSet = ROLES_ORDER.every(r => currentRoles.includes(r));
    
    if (isFullSet) {
        setIsAllRoles(true);
        setSelectedRoles([]);
    } else {
        setSelectedRoles(currentRoles);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (!isAllRoles && selectedRoles.length === 0) return;

    onAddPlayer({
      name: name.trim(),
      isAllRoles,
      roles: isAllRoles ? [] : selectedRoles
    });

    // Reset
    setName('');
    setIsAllRoles(false);
    setSelectedRoles([]);
  };

  const parseAndSubmitSmartInput = (e: React.FormEvent) => {
    e.preventDefault();
    if (!smartInput.trim()) return;

    const lines = smartInput.split(/\n/);
    let count = 0;

    lines.forEach(line => {
      // Clean line
      const cleanLine = line.trim();
      if (!cleanLine) return;

      // Split Name and Roles by ':' or '-'
      const parts = cleanLine.split(/[:|-]/);
      if (parts.length < 2) return;

      const pName = parts[0].trim();
      const pRoleStr = parts[1].toLowerCase();

      let pIsAllRoles = false;
      const pRoles: Role[] = [];

      // Detect All Role / Fill
      if (pRoleStr.includes('all') || pRoleStr.includes('fill') || pRoleStr.includes('any') || pRoleStr.includes('auto')) {
        pIsAllRoles = true;
      } else {
        // Detect Specific Roles
        if (pRoleStr.includes('clash') || pRoleStr.includes('exp') || pRoleStr.includes('fight')) pRoles.push(Role.CLASH);
        if (pRoleStr.includes('mid') || pRoleStr.includes('mage')) pRoles.push(Role.MID);
        if (pRoleStr.includes('jung') || pRoleStr.includes('jg') || pRoleStr.includes('assassin')) pRoles.push(Role.JUNGLE);
        if (pRoleStr.includes('farm') || pRoleStr.includes('gold') || pRoleStr.includes('mm') || pRoleStr.includes('adc') || pRoleStr.includes('archer')) pRoles.push(Role.FARM);
        if (pRoleStr.includes('roam') || pRoleStr.includes('supp') || pRoleStr.includes('tank')) pRoles.push(Role.ROAM);
        
        // Only allow Coach via smart paste if mode is enabled (optional strictness, but good for consistency)
        if (isCoachMode && pRoleStr.includes('coach')) pRoles.push(Role.COACH);
      }

      // Add if valid
      if (pName && (pIsAllRoles || pRoles.length > 0)) {
        onAddPlayer({
          name: pName,
          isAllRoles: pIsAllRoles,
          roles: pRoles
        });
        count++;
      }
    });

    if (count > 0) {
      setSmartInput('');
    }
  };

  // Combine standard roles with Coach for the manual selector IF mode is active
  const availableRolesForSelection = isCoachMode ? [...ROLES_ORDER, Role.COACH] : ROLES_ORDER;

  return (
    <div className="relative group">
      {/* Decorative Border Container */}
      <div className="absolute -inset-[1px] bg-gradient-to-b from-[#dcb06b]/50 to-transparent clip-corner-md opacity-50 pointer-events-none"></div>

      <div className="bg-[#0a1a2f]/90 backdrop-blur-md p-6 clip-corner-md relative overflow-hidden">
        
        {/* Header Decor & Mode Switch */}
        <div className="flex items-center justify-between mb-6 border-b border-[#dcb06b]/20 pb-4">
          <h3 className="text-xl text-[#dcb06b] font-cinzel font-bold tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-6 bg-[#dcb06b] block skew-x-[-12deg]"></span>
            {mode === 'manual' ? 'New Challenger' : 'Smart Import'}
          </h3>
          
          {/* Mode Toggles */}
          <div className="flex bg-[#05090f] p-1 rounded clip-corner-sm border border-[#1e3a5f]">
             <button 
               onClick={() => setMode('manual')}
               className={`px-3 py-1 text-[10px] uppercase font-bold transition-all ${mode === 'manual' ? 'bg-[#dcb06b] text-[#05090f]' : 'text-[#4a5f78] hover:text-[#dcb06b]'}`}
             >
               Manual
             </button>
             <button 
               onClick={() => setMode('smart')}
               className={`px-3 py-1 text-[10px] uppercase font-bold transition-all ${mode === 'smart' ? 'bg-[#dcb06b] text-[#05090f]' : 'text-[#4a5f78] hover:text-[#dcb06b]'}`}
             >
               Smart Paste
             </button>
          </div>
        </div>
        
        {mode === 'manual' ? (
          <form onSubmit={handleManualSubmit}>
            <div className="mb-6">
              <label className="block text-[10px] uppercase tracking-[0.2em] text-[#8a9db8] mb-2 font-bold">Player Name</label>
              <div className="relative">
                 <input 
                  type="text" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="ENTER IGN..."
                  className="w-full bg-[#05090f] border border-[#1e3a5f] p-4 text-[#f0f4f8] placeholder-[#2d4a6d] focus:outline-none focus:border-[#dcb06b] transition-all clip-corner-sm font-orbitron tracking-wide"
                />
                <div className="absolute right-0 bottom-0 h-2 w-2 border-b border-r border-[#dcb06b] pointer-events-none"></div>
              </div>
            </div>

            <div className="mb-8">
              <div className="flex justify-between items-end mb-4">
                 <label className="text-[10px] uppercase tracking-[0.2em] text-[#8a9db8] font-bold">Role Preference</label>
                 <label className="flex items-center cursor-pointer group/toggle">
                  <span className={`mr-3 text-xs font-bold font-orbitron transition-colors uppercase ${isAllRoles ? 'text-[#dcb06b]' : 'text-[#4a5f78] group-hover/toggle:text-[#dcb06b]/70'}`}>
                    Fill / All Roles
                  </span>
                  <div className={`w-10 h-5 rounded-full relative transition-colors ${isAllRoles ? 'bg-[#dcb06b]' : 'bg-[#1e3a5f]'}`}>
                     <div className={`absolute top-1 w-3 h-3 rounded-full bg-white shadow-sm transition-transform duration-300 ${isAllRoles ? 'left-6' : 'left-1'}`}></div>
                  </div>
                  <input 
                    type="checkbox" 
                    className="hidden"
                    checked={isAllRoles}
                    onChange={e => setIsAllRoles(e.target.checked)}
                  />
                </label>
              </div>

              {/* Roles Buttons */}
              <div className={`flex flex-wrap gap-2 transition-all duration-300 ${isAllRoles ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
                {availableRolesForSelection.map(role => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => toggleRole(role)}
                    className={`
                      relative px-4 py-2 flex-grow md:flex-grow-0
                      font-cinzel font-bold text-xs uppercase tracking-widest
                      transition-all duration-300
                      clip-corner-sm
                      ${selectedRoles.includes(role) 
                        ? 'bg-[#dcb06b] text-[#05090f] shadow-[0_0_15px_rgba(220,176,107,0.4)]' 
                        : 'bg-transparent text-[#8a9db8] border border-[#1e3a5f] hover:border-[#dcb06b] hover:text-[#dcb06b]'
                      }
                    `}
                  >
                    {role.replace(' Lane', '')}
                    
                    {/* Small underline decoration for active */}
                    {selectedRoles.includes(role) && (
                      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/30"></div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={!name || (!isAllRoles && selectedRoles.length === 0)}>
               <span className="text-base">Join Lobby</span>
            </Button>
          </form>
        ) : (
          <form onSubmit={parseAndSubmitSmartInput}>
            <div className="mb-4">
              <label className="block text-[10px] uppercase tracking-[0.2em] text-[#8a9db8] mb-2 font-bold">
                Paste Roster List
              </label>
              <div className="relative">
                 <textarea 
                  value={smartInput}
                  onChange={e => setSmartInput(e.target.value)}
                  placeholder={`Supported Formats:\n\nArthur : Clash Lane\nLam - Jungle, Roam\nDiaochan : Mid Lane\nMarco Polo : Farm / Gold\nDolia : Roam, Support\nKPL Coach : Coach\nFaker : All Role\n\n(Separators: : or -)`}
                  className="w-full h-48 bg-[#05090f] border border-[#1e3a5f] p-4 text-[#f0f4f8] placeholder-[#2d4a6d] focus:outline-none focus:border-[#dcb06b] transition-all clip-corner-sm font-orbitron tracking-wide text-sm resize-none"
                />
                <div className="absolute right-0 bottom-0 h-2 w-2 border-b border-r border-[#dcb06b] pointer-events-none"></div>
              </div>
              <p className="mt-2 text-[10px] text-[#4a5f78] italic">
                Supported: Clash/Exp, Mid, Farm/Gold/MM, Jungle/Jg, Roam/Tank, Coach, All Role/Fill.
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={!smartInput.trim()}>
               <span className="text-base">Process Batch</span>
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};