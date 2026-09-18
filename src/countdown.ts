export interface Remaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function timeLeft(target: Date, now: Date): Remaining | null {
  const millis = target.getTime() - now.getTime();
  if (millis <= 0) return null;

  const seconds = Math.ceil(millis / 1000);
  return {
    days: Math.floor(seconds / 86_400),
    hours: Math.floor(seconds / 3600) % 24,
    minutes: Math.floor(seconds / 60) % 60,
    seconds: seconds % 60,
  };
}

export function formatTarget(target: Date): string {
  return target.toLocaleString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}
