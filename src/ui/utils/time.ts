/**
 * Formats an ISO date string into a relative time description.
 */
export function formatHumanAge(dateInput: string | null | undefined): string {
  if (!dateInput) return "Recently";

  // Ensure UTC parsing for SQLite format "YYYY-MM-DD HH:MM:SS"
  let parsedDate: Date;
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(dateInput)) {
    parsedDate = new Date(dateInput.replace(" ", "T") + "Z");
  } else {
    parsedDate = new Date(dateInput);
  }

  const now = new Date();
  const diffMs = now.getTime() - parsedDate.getTime();

  if (isNaN(diffMs) || diffMs < 0) {
    return "Just now";
  }

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return "Just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;

  const years = Math.floor(days / 365);
  const remainingMonths = Math.floor((days % 365) / 30);
  if (remainingMonths > 0) {
    return `${years}y ${remainingMonths}mo ago`;
  }
  return `${years}y ago`;
}

/**
 * Formats a timestamp into a short month and time string.
 */
export function formatDateTime(dateInput: string | null | undefined): string {
  if (!dateInput) return "Recently";

  let parsedDate: Date;
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(dateInput)) {
    parsedDate = new Date(dateInput.replace(" ", "T") + "Z");
  } else {
    parsedDate = new Date(dateInput);
  }

  if (isNaN(parsedDate.getTime())) return "Recently";

  return parsedDate.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

