import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a timestamp to relative time (e.g., "2 giờ trước", "5 phút trước")
 * @param timestamp ISO string timestamp
 * @returns formatted relative time string
 */
export function formatRelativeTime(timestamp: string): string {
  const now = new Date();
  const date = new Date(timestamp);
  const secondsAgo = Math.floor((now.getTime() - date.getTime()) / 1000);

  // Define time intervals in seconds
  const intervals = {
    năm: 31536000,
    tháng: 2592000,
    tuần: 604800,
    ngày: 86400,
    giờ: 3600,
    phút: 60,
    giây: 1
  };

  // Handle future dates
  if (secondsAgo < 0) {
    return 'Vừa xong';
  }

  // Find the appropriate interval
  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(secondsAgo / secondsInUnit);
    
    if (interval >= 1) {
      return `${interval} ${unit}${interval > 1 && unit !== 'tháng' ? '' : ''} trước`;
    }
  }

  return 'Vừa xong';
}
