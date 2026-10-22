/**
 * Friendly greeting name. Many Malaysian names carry a patronymic ("Nur Aisyah binti Ahmad",
 * "Arjun a/l Raman"), where the given name is everything before the marker, so "first word"
 * would be wrong. Without a marker we greet by the full name rather than guess.
 */
const PATRONYMIC = /\s+(?:bin|binti|bte|bt|a\/l|a\/p|s\/o|d\/o)\s+/i;

export function displayName(fullName: string) {
  const [given] = fullName.trim().split(PATRONYMIC);
  return given || fullName.trim();
}
