import React from 'react';
import { Role } from './types';

export const ROLES_ORDER = [
  Role.CLASH,
  Role.JUNGLE,
  Role.MID,
  Role.FARM,
  Role.ROAM,
];

// Changed from Icons to Text Labels as requested
export const RoleIcons: Record<Role, React.ReactNode> = {
  [Role.CLASH]: (
    <span className="font-orbitron font-bold uppercase tracking-widest text-[10px] md:text-xs whitespace-nowrap">CLASH LANE</span>
  ),
  [Role.JUNGLE]: (
    <span className="font-orbitron font-bold uppercase tracking-widest text-[10px] md:text-xs whitespace-nowrap">JUNGLER</span>
  ),
  [Role.MID]: (
    <span className="font-orbitron font-bold uppercase tracking-widest text-[10px] md:text-xs whitespace-nowrap">MID LANE</span>
  ),
  [Role.FARM]: (
    <span className="font-orbitron font-bold uppercase tracking-widest text-[10px] md:text-xs whitespace-nowrap">FARM LANE</span>
  ),
  [Role.ROAM]: (
    <span className="font-orbitron font-bold uppercase tracking-widest text-[10px] md:text-xs whitespace-nowrap">ROAMER</span>
  ),
  [Role.COACH]: (
    <span className="font-orbitron font-bold uppercase tracking-widest text-[10px] md:text-xs whitespace-nowrap">COACH</span>
  ),
};