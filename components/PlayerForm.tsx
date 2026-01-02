
import React, { useState } from 'react';
import { Player, Role } from '../types';
import { Button } from './Button';
import { ROLES_ORDER } from '../constants';

interface BatchItem {
  name: string;
  roles: Role[];
  isAllRoles: boolean;
  action: 'add' | 'bench';
}

interface PlayerFormProps {
  onBatchProcess: (items: BatchItem[]) => void;
  isCoachMode: boolean;
}

export const PlayerForm: React.FC<PlayerFormProps> = ({ onBatchProcess, isCoachMode }) => {
  const [mode, setMode] = useState<'manual' | 'smart'>('manual');
  const [name, setName] = useState('');
  const [isAllRoles, setIsAllRoles] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<Role[]>([]);
  const [smartInput, setSmartInput] = useState('');

  const toggleRole = (role: Role) => {
    if (isAllRoles) return;
    if (role === Role.COACH) {
        setSelectedRoles(prev => prev.includes(Role.COACH) ? [] : [Role.COACH]);
        return;
    }
    let currentRoles = selectedRoles.filter(r => r !== Role.COACH);
    currentRoles = currentRoles.includes(role) ? currentRoles.filter(r => r !== role) : [...currentRoles, role];
    if (ROLES_ORDER.every(r => currentRoles.includes(r))) { setIsAllRoles(true); setSelectedRoles([]); }
    else { setSelectedRoles(currentRoles); }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || (!isAllRoles && selectedRoles.length === 0)) return;
    onBatchProcess([{ name: name.trim(), isAllRoles, roles: isAllRoles ? [] : selectedRoles, action: 'add' }]);
    setName(''); setIsAllRoles(false); setSelectedRoles([]);
  };

  const parseAndSubmitSmartInput = (e: React.FormEvent) => {
    e.preventDefault();
    if (!smartInput.trim()) return;
    
    const lines = smartInput.split(/\n/);
    const batchItems: BatchItem[] = [];
    
    lines.forEach(line => {
      const cleanLine = line.trim();
      if (!cleanLine) return;
      
      // Skip Discord system lines like " — 2:57"
      if (cleanLine.startsWith('—') || /^\d+:\d+/.test(cleanLine)) return;
      
      // Look for role definitions (lines containing : or - or " )
      // Discord names can end with . or " as seen in user examples
      const parts = cleanLine.split(/[:|-]/);
      
      // If we only have one part, it might just be a header or a name without roles
      // We ignore these to avoid cluttering unless it's clearly an "All Roles" player
      if (parts.length < 2) {
         if (cleanLine.toLowerCase().includes('(all roles)') || cleanLine.toLowerCase().includes('(fill)')) {
            const pName = cleanLine.split('(')[0].trim();
            if (pName) batchItems.push({ name: pName, isAllRoles: true, roles: [], action: 'add' });
         }
         return;
      }
      
      const pName = parts[0].trim();
      const pRoleStr = parts.slice(1).join(' ').toLowerCase();

      let pIsAllRoles = false;
      const pRoles: Role[] = [];
      let pAction: 'add' | 'bench' = 'add';

      // Action detection
      if (pRoleStr.includes('stop') || pRoleStr.includes('bench') || pRoleStr.includes('out') || pRoleStr.includes('afk') || pRoleStr.includes('off')) {
         pAction = 'bench';
      } else {
         // Role detection
         if (pRoleStr.includes('all') || pRoleStr.includes('fill') || pRoleStr.includes('any') || pRoleStr.includes('auto')) {
            pIsAllRoles = true;
         } else {
            if (pRoleStr.includes('clash') || pRoleStr.includes('exp') || pRoleStr.includes('fight') || pRoleStr.includes('clsh')) pRoles.push(Role.CLASH);
            if (pRoleStr.includes('mid') || pRoleStr.includes('mage') || pRoleStr.includes('central')) pRoles.push(Role.MID);
            if (pRoleStr.includes('jung') || pRoleStr.includes('jg') || pRoleStr.includes('assassin') || pRoleStr.includes('hunt')) pRoles.push(Role.JUNGLE);
            if (pRoleStr.includes('farm') || pRoleStr.includes('gold') || pRoleStr.includes('mm') || pRoleStr.includes('adc') || pRoleStr.includes('archer') || pRoleStr.includes('marksman')) pRoles.push(Role.FARM);
            if (pRoleStr.includes('roam') || pRoleStr.includes('supp') || pRoleStr.includes('tank') || pRoleStr.includes('helper')) pRoles.push(Role.ROAM);
            if (isCoachMode && (pRoleStr.includes('coach') || pRoleStr.includes('trainer') || pRoleStr.includes('mgr'))) pRoles.push(Role.COACH);
         }
      }
      
      if (pName && (pAction === 'bench' || pIsAllRoles || pRoles.length > 0)) {
        batchItems.push({ name: pName, isAllRoles: pIsAllRoles, roles: pRoles, action: pAction });
      }
    });
    
    if (batchItems.length > 0) { 
      onBatchProcess(batchItems); 
      setSmartInput(''); 
    }
  };

  const smartPlaceholder = `--- DISCORD COPY-PASTE SUPPORTED ---
Luccy : farm, clash
Kazehunt. : Jungle, mm, clash lane
Matchadanu" : Jungle. roam, clash, farm 

P3 (All Roles)
CoachElite : Coach

--- BENCHING ---
IGN: stop
P2 - bench`;

  return (
    <div className="relative group">
      <div className="absolute -inset-[1px] bg-gradient-to-b from-[#dcb06b]/50 to-transparent clip-corner-md opacity-50"></div>
      <div className="bg-[#0a1a2f]/90 backdrop-blur-md p-6 clip-corner-md relative">
        <div className="flex items-center justify-between mb-6 border-b border-[#dcb06b]/20 pb-4">
          <h3 className="text-xl text-[#dcb06b] font-cinzel font-bold tracking-widest">{mode === 'manual' ? 'New Challenger' : 'Smart Import'}</h3>
          <div className="flex bg-[#05090f] p-1 rounded clip-corner-sm border border-[#1e3a5f]">
             <button onClick={() => setMode('manual')} className={`px-3 py-1 text-[10px] uppercase font-bold transition-all ${mode === 'manual' ? 'bg-[#dcb06b] text-[#05090f]' : 'text-[#4a5f78] hover:text-[#dcb06b]'}`}>Manual</button>
             <button onClick={() => setMode('smart')} className={`px-3 py-1 text-[10px] uppercase font-bold transition-all ${mode === 'smart' ? 'bg-[#dcb06b] text-[#05090f]' : 'text-[#4a5f78] hover:text-[#dcb06b]'}`}>Smart Paste</button>
          </div>
        </div>
        
        {mode === 'manual' ? (
          <form onSubmit={handleManualSubmit}>
            <div className="mb-6">
              <label className="block text-[10px] uppercase tracking-widest text-[#8a9db8] mb-2 font-bold">Player Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="ENTER IGN..." className="w-full bg-[#05090f] border border-[#1e3a5f] p-4 text-[#f0f4f8] focus:outline-none focus:border-[#dcb06b] clip-corner-sm font-orbitron"/>
            </div>
            <div className="mb-8">
              <div className="flex justify-between items-end mb-4">
                 <label className="text-[10px] uppercase tracking-widest text-[#8a9db8] font-bold">Role Preference</label>
                 <label className="flex items-center cursor-pointer">
                  <span className={`mr-3 text-xs font-bold font-orbitron transition-colors ${isAllRoles ? 'text-[#dcb06b]' : 'text-[#4a5f78]'}`}>All Roles</span>
                  <input type="checkbox" className="hidden" checked={isAllRoles} onChange={e => setIsAllRoles(e.target.checked)}/>
                  <div className={`w-10 h-5 rounded-full relative transition-colors ${isAllRoles ? 'bg-[#dcb06b]' : 'bg-[#1e3a5f]'}`}>
                     <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-transform ${isAllRoles ? 'left-6' : 'left-1'}`}></div>
                  </div>
                </label>
              </div>
              <div className={`flex flex-wrap gap-2 ${isAllRoles ? 'opacity-30 pointer-events-none' : ''}`}>
                {(isCoachMode ? [...ROLES_ORDER, Role.COACH] : ROLES_ORDER).map(role => (
                  <button key={role} type="button" onClick={() => toggleRole(role)} className={`px-4 py-2 font-cinzel font-bold text-[10px] uppercase tracking-widest clip-corner-sm border transition-all ${selectedRoles.includes(role) ? 'bg-[#dcb06b] text-[#05090f] border-[#dcb06b] shadow-[0_0_10px_#dcb06b]' : 'text-[#8a9db8] border-[#1e3a5f] hover:border-[#dcb06b] hover:text-[#dcb06b]'}`}>
                    {role.replace(' Lane', '')}
                  </button>
                ))}
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={!name || (!isAllRoles && selectedRoles.length === 0)}>Join Lobby</Button>
          </form>
        ) : (
          <form onSubmit={parseAndSubmitSmartInput}>
            <div className="mb-4">
              <label className="block text-[10px] uppercase tracking-widest text-[#8a9db8] mb-2 font-bold">Paste Roster List</label>
              <textarea value={smartInput} onChange={e => setSmartInput(e.target.value)} placeholder={smartPlaceholder} className="w-full h-56 bg-[#05090f] border border-[#1e3a5f] p-4 text-[#f0f4f8] placeholder-[#2d4a6d] focus:outline-none focus:border-[#dcb06b] clip-corner-sm font-orbitron text-[10px] leading-relaxed resize-none"/>
            </div>
            <Button type="submit" className="w-full" disabled={!smartInput.trim()}>Process Batch</Button>
          </form>
        )}
      </div>
    </div>
  );
};
