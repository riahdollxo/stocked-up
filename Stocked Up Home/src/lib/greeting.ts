import type { AppSettings } from "./store";

export function getDeviceTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "UTC";
  }
}

export function getActiveTimeZone(settings: AppSettings): string {
  if (settings.useDeviceTimeZone) return getDeviceTimeZone();
  return settings.manualTimeZone || getDeviceTimeZone();
}

export function getHourInTimeZone(timeZone: string, date = new Date()): number {
  try {
    return Number(
      new Intl.DateTimeFormat("en-US", {
        timeZone,
        hour: "numeric",
        hour12: false,
      }).format(date),
    );
  } catch {
    return date.getHours();
  }
}

export function getGreeting(profileName: string | undefined, settings: AppSettings): string {
  const tz = getActiveTimeZone(settings);
  const hour = getHourInTimeZone(tz);

  let greeting = "Good morning";
  let emoji = "👋";
  if (hour >= 12 && hour < 17) {
    greeting = "Good afternoon";
    emoji = "☀️";
  } else if (hour >= 17 && hour < 21) {
    greeting = "Good evening";
    emoji = "🌿";
  } else if (hour >= 21 || hour < 5) {
    greeting = "Good night";
    emoji = "🌙";
  }

  return profileName ? `${greeting}, ${profileName} ${emoji}` : `${greeting} ${emoji}`;
}

export function formatInTimeZone(date: string | Date, settings: AppSettings, opts?: Intl.DateTimeFormatOptions): string {
  const tz = getActiveTimeZone(settings);
  const d = typeof date === "string" ? new Date(date) : date;
  try {
    return new Intl.DateTimeFormat(undefined, {
      timeZone: tz,
      month: "short",
      day: "numeric",
      ...opts,
    }).format(d);
  } catch {
    return d.toLocaleString();
  }
}

export function timeAgo(dateISO: string): string {
  const ms = Date.now() - new Date(dateISO).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return "Yesterday";
  if (d < 7) return `${d}d ago`;
  return new Date(dateISO).toLocaleDateString();
}

// Common IANA time zones for the manual selector
export const TIME_ZONES: string[] = [
  "America/Los_Angeles",
  "America/Denver",
  "America/Chicago",
  "America/New_York",
  "America/Toronto",
  "America/Mexico_City",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Madrid",
  "Europe/Rome",
  "Europe/Athens",
  "Africa/Cairo",
  "Africa/Johannesburg",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Bangkok",
  "Asia/Singapore",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Asia/Seoul",
  "Australia/Sydney",
  "Pacific/Auckland",
  "UTC",
];
