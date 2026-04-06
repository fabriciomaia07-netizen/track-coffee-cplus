import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Get the display name for a coffee lot.
 * Uses the `notes` field (city-code name) if available,
 * otherwise falls back to "origin - variety".
 */
export function getCoffeeName(lot: {
  notes?: string | null;
  origin_country?: string;
  variety?: string;
} | null): string {
  if (!lot) return "-";
  if (lot.notes?.trim()) return lot.notes.trim();
  return `${lot.origin_country ?? ""} - ${lot.variety ?? ""}`;
}
