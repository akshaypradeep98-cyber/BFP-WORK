// Utility functions for the app

export const AVATAR_COLORS = ["#2a5d8f", "#1f7a52", "#c87a23", "#7a4fa0", "#b3392f"];

export const CLASSIFICATIONS = [
  "Partner",
  "Manager",
  "Senior",
  "Semi-Senior",
  "Article Assistant",
  "Trainee",
  "Admin Staff",
];

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function getRandomAvatarColor(): string {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}

export function formatDate(date: string | Date | null): string {
  if (!date) return "";
  const d = new Date(date);
  return d.toISOString().split("T")[0];
}
