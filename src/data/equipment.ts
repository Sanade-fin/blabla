import type { EquipmentItem, EquipSlot } from '../types';

export const EQUIP_SLOTS: { id: EquipSlot; label: string }[] = [
  { id: 'coreReactor', label: 'Core Reactor' },
  { id: 'laserModule', label: 'Laser Module' },
  { id: 'shieldGenerator', label: 'Shield Generator' },
  { id: 'engineThrusters', label: 'Engine Thrusters' },
  { id: 'droneBay', label: 'Drone Bay' },
  { id: 'aiChip', label: 'AI Chip' },
  { id: 'quantumAmplifier', label: 'Quantum Amplifier' },
  { id: 'armorPlating', label: 'Armor Plating' },
];

export const EQUIPMENT_CATALOG: EquipmentItem[] = [
  { id: 'reactor_mk1', name: 'Pulse Reactor', slot: 'coreReactor', rarity: 'common', stats: { damage: 5 } },
  { id: 'reactor_void', name: 'Void Core', slot: 'coreReactor', rarity: 'legendary', stats: { damage: 18, critChance: 8 }, effect: 'Void surges on kill', visualTag: 'void-glow' },
  { id: 'laser_standard', name: 'Standard Emitter', slot: 'laserModule', rarity: 'common', stats: { damage: 8, fireRate: 5 } },
  { id: 'laser_plasma', name: 'Plasma Matrix', slot: 'laserModule', rarity: 'epic', stats: { damage: 14, fireRate: 10 }, effect: 'Burning DoT', visualTag: 'plasma-beam' },
  { id: 'shield_basic', name: 'Kinetic Barrier', slot: 'shieldGenerator', rarity: 'common', stats: { shield: 20 } },
  { id: 'shield_cosmic', name: 'Cosmic Aegis', slot: 'shieldGenerator', rarity: 'cosmic', stats: { shield: 45, armor: 10 }, effect: 'Reflect 5% damage', visualTag: 'cosmic-shield' },
  { id: 'engine_boost', name: 'Ion Thrusters', slot: 'engineThrusters', rarity: 'rare', stats: { speed: 12 } },
  { id: 'engine_quantum', name: 'Quantum Slipstream', slot: 'engineThrusters', rarity: 'legendary', stats: { speed: 22 }, effect: 'Dash cooldown -15%', visualTag: 'quantum-trail' },
  { id: 'drone_swarm', name: 'Swarm Bay', slot: 'droneBay', rarity: 'epic', stats: { damage: 6 }, effect: '+2 attack drones' },
  { id: 'ai_tactical', name: 'Tactical AI', slot: 'aiChip', rarity: 'rare', stats: { critChance: 6, lootBonus: 5 } },
  { id: 'amp_chaos', name: 'Chaos Amplifier', slot: 'quantumAmplifier', rarity: 'legendary', stats: { damage: 12 }, effect: '10% random proc', visualTag: 'chaos-pulse' },
  { id: 'armor_titan', name: 'Titan Plating', slot: 'armorPlating', rarity: 'epic', stats: { armor: 25, shield: 8 } },
];

export function getEquipment(id: string): EquipmentItem | undefined {
  return EQUIPMENT_CATALOG.find((e) => e.id === id);
}
