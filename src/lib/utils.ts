import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getTownHallImage = (thLevel: number, thWeaponLevel?: number) => {
    // The highest known Town Hall level with a distinct image.
    const maxThLevel = 16;
    const effectiveThLevel = Math.min(thLevel, maxThLevel);
    
    // Weapon level suffix only applies to certain TH levels, e.g. 14+
    const weaponSuffix = (thWeaponLevel && thLevel >= 14) ? `_${thWeaponLevel}`: '';
    
    return `/town-hall-icons/Town_Hall_${effectiveThLevel}${weaponSuffix}.png`;
}

export const getAssetPath = (type: 'hero' | 'troop', name: string) => {
  const sanitizedName = name.toLowerCase().replace(/[\s.]+/g, '-');
  return `/${type}-icons/${sanitizedName}.png`;
} 