export function getCountdownLabel(days: number | undefined | null): string | null {
  if (days == null) return null;
  if (days < 0) return "Expired";
  if (days === 0) return "Closing today";
  if (days === 1) return "1 day left";
  return `${days} days left`;
}

export function getCountdownColor(days: number | undefined | null): string {
  if (days == null) return "rgba(0,0,0,0.55)";
  if (days <= 7) return "#ba1a1a";
  return "rgba(0,0,0,0.55)";
}

export function formatDeadline(dateStr: string | undefined | null): string {
  if (!dateStr) return "N/A";
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}
