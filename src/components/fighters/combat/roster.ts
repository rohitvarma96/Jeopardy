import type { FighterId } from '../../../game/types/fighter';

export type CombatPalette = {
  metal: string; light: string; edge: string; shadow: string; deep: string;
  cloth: string; clothLight: string; clothDark: string; leather: string;
  skin: string; jewel: string; outline: string;
};

export type CombatDesign = {
  silhouette: 'sage' | 'assassin' | 'ranger' | 'bastion' | 'sentinel' | 'warden';
  weapon: 'staff' | 'blades' | 'bow' | 'hammer' | 'sword' | 'axe';
  element: 'astral' | 'eclipse' | 'wildwood' | 'dawn' | 'solar' | 'glacial';
  special: string;
  accent: string;
  glow: string;
  width: number;
  palette: CombatPalette;
};

export const COMBAT_ROSTER = {
  arcane: {
    silhouette: 'sage', weapon: 'staff', element: 'astral', special: 'Astral Convergence',
    accent: '#BC9CFF', glow: '#7953E8', width: 0.94,
    palette: {
      metal: '#7262AC', light: '#C4B6F1', edge: '#F6E2AF', shadow: '#42355F', deep: '#231D3E',
      cloth: '#56428D', clothLight: '#9472CE', clothDark: '#302348', leather: '#2A253D',
      skin: '#D5A887', jewel: '#D9C6FF', outline: '#161425',
    },
  },
  shadow: {
    silhouette: 'assassin', weapon: 'blades', element: 'eclipse', special: 'Eclipse Requiem',
    accent: '#FF718E', glow: '#B52E68', width: 0.8,
    palette: {
      metal: '#454157', light: '#9B94AE', edge: '#E8D6EA', shadow: '#282536', deep: '#181523',
      cloth: '#8E2C52', clothLight: '#DF5273', clothDark: '#4C1C37', leather: '#252231',
      skin: '#C99B86', jewel: '#FF9CA9', outline: '#13121E',
    },
  },
  sylva: {
    silhouette: 'ranger', weapon: 'bow', element: 'wildwood', special: 'Verdant Tempest',
    accent: '#99E6A1', glow: '#358C67', width: 0.88,
    palette: {
      metal: '#53775F', light: '#9EBE8D', edge: '#E1DCA3', shadow: '#314D42', deep: '#20382F',
      cloth: '#3D7758', clothLight: '#7AB77A', clothDark: '#234839', leather: '#544139',
      skin: '#D9AD88', jewel: '#BAF3A9', outline: '#142A24',
    },
  },
  titan: {
    silhouette: 'bastion', weapon: 'hammer', element: 'dawn', special: 'Dawnfall Judgment',
    accent: '#FFE3A0', glow: '#C89548', width: 1.18,
    palette: {
      metal: '#D2C7AF', light: '#F0E7D1', edge: '#FFF5CB', shadow: '#877E77', deep: '#3C3D4E',
      cloth: '#365575', clothLight: '#6589A2', clothDark: '#25364E', leather: '#343440',
      skin: '#C9A68A', jewel: '#FFE6A5', outline: '#292A38',
    },
  },
  ember: {
    silhouette: 'sentinel', weapon: 'sword', element: 'solar', special: 'Solar Cataclysm',
    accent: '#FFB36C', glow: '#E26739', width: 1,
    palette: {
      metal: '#B87A42', light: '#F5CE8B', edge: '#FFE7B0', shadow: '#70472F', deep: '#483129',
      cloth: '#9D3F41', clothLight: '#D56855', clothDark: '#602B36', leather: '#3D3437',
      skin: '#DEA079', jewel: '#FFE3A0', outline: '#292B36',
    },
  },
  frost: {
    silhouette: 'warden', weapon: 'axe', element: 'glacial', special: 'Winterbreak Ascension',
    accent: '#AAEEFF', glow: '#4F9FBE', width: 1.03,
    palette: {
      metal: '#8BAAB9', light: '#D4E7EA', edge: '#EDF7EE', shadow: '#506C88', deep: '#35465D',
      cloth: '#377681', clothLight: '#64A8AA', clothDark: '#28515F', leather: '#303E53',
      skin: '#D9B099', jewel: '#A6F3E2', outline: '#293345',
    },
  },
} as const satisfies Record<FighterId, CombatDesign>;
