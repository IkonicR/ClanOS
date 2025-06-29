import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Crop } from "react-image-crop";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getTownHallImage(level: number) {
  return `/town-hall-icons/Town_Hall_${level}.png`;
}

export function getAssetPath(type: 'hero' | 'troop', name: string) {
  const formattedName = name.toLowerCase().replace(/\s+/g, '-');
  return `/${type}-icons/${formattedName}.png`;
}
