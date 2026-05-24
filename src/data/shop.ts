import { ALL_COSMETICS } from './cosmetics';
import type { ShopItem } from '../types';

/** Только косметика — без pay-to-win */
export const SHOP_ITEMS: ShopItem[] = ALL_COSMETICS.filter((c) => c.id !== 'ship_default' && c.id !== 'laser_default' && c.id !== 'exp_default').map(
  (c) => ({
    ...c,
    category:
      c.kind === 'ship' || c.kind === 'laser' || c.kind === 'explosion'
        ? 'skin'
        : c.kind === 'trail'
          ? 'trail'
          : c.kind === 'banner'
            ? 'banner'
            : 'effect',
  }),
);

export const EMOTES_SHOP: ShopItem[] = [
  { id: 'emote_salute', name: 'Salute', kind: 'avatar', rarity: 'common', price: { credits: 500 }, category: 'emote' },
  { id: 'emote_laugh', name: 'Cosmic Laugh', kind: 'avatar', rarity: 'rare', price: { credits: 800 }, category: 'emote' },
  { id: 'emote_rage', name: 'Void Rage', kind: 'avatar', rarity: 'epic', price: { shards: 25 }, category: 'emote' },
];

export const UI_THEMES: ShopItem[] = [
  { id: 'ui_void', name: 'Void UI Theme', kind: 'avatar', rarity: 'epic', price: { shards: 30 }, category: 'uiTheme' },
  { id: 'ui_neon', name: 'Neon UI Theme', kind: 'avatar', rarity: 'rare', price: { credits: 2000 }, category: 'uiTheme' },
];

export const FULL_SHOP = [...SHOP_ITEMS, ...EMOTES_SHOP, ...UI_THEMES];
