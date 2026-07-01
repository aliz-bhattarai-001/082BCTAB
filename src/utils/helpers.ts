/**
 * Helper utilities for the Class Portal.
 */

/**
 * Validates whether an email matches the strict PCampus BCT domain format:
 * {batchYear}bct{rollNumber:3digits}.{name}@pcampus.edu.np
 * Roll numbers must be 001 - 048.
 */
export function validatePcampusEmail(email: string): boolean {
  const pattern = /^(\d{3})bct(00[1-9]|0[1-3]\d|04[0-8])\.([a-zA-Z0-9.]+)@pcampus\.edu\.np$/i;
  return pattern.test(email);
}

/**
 * Parses roll number, batch year, and name from a valid PCampus email.
 */
export function parsePcampusEmail(email: string) {
  const pattern = /^(\d{3})bct(00[1-9]|0[1-3]\d|04[0-8])\.([a-zA-Z0-9.]+)@pcampus\.edu\.np$/i;
  const match = email.match(pattern);
  if (!match) return null;
  
  // Format name part nicely (e.g. "apil.sharma" -> "Apil Sharma")
  const rawName = match[3];
  const formattedName = rawName
    .split(".")
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  return {
    batchYear: match[1],
    rollNumber: match[2],
    name: formattedName,
  };
}

/**
 * Hacker News ranking score formula:
 * Score = stars / (ageInHours + 2) ^ 1.8
 */
export function calculateProjectScore(stars: number, createdAt: any): number {
  const now = Date.now();
  let createdTime = now;
  
  if (createdAt) {
    if (typeof createdAt.toMillis === "function") {
      createdTime = createdAt.toMillis();
    } else if (createdAt.seconds) {
      createdTime = createdAt.seconds * 1000;
    } else {
      createdTime = new Date(createdAt).getTime();
    }
  }
  
  const ageInHours = (now - createdTime) / (3600 * 1000);
  return stars / Math.pow(ageInHours + 2, 1.8);
}
