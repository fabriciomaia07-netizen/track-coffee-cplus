/** Badge color classes per process method */
export const processColors: Record<string, string> = {
  washed: "bg-blue-100 text-blue-800",
  natural: "bg-orange-100 text-orange-800",
  honey: "bg-amber-100 text-amber-800",
  anaerobic: "bg-purple-100 text-purple-800",
  other: "bg-gray-100 text-gray-800",
};

/** Available brew methods */
export const BREW_METHODS = [
  "espresso",
  "v60",
  "french_press",
  "aeropress",
  "chemex",
  "cold_brew",
  "moka_pot",
  "weber_bird",
  "other",
] as const;

/** Available coffee process methods */
export const PROCESS_METHODS = [
  "washed",
  "natural",
  "honey",
  "anaerobic",
  "other",
] as const;
