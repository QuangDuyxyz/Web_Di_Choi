
// Function to format date to display format
export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Get relative time (e.g. "2 days ago", "in 3 days")
export function getRelativeTime(date: Date | string): string {
  const now = new Date();
  const targetDate = new Date(date);
  const diffTime = targetDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return 'Hôm nay';
  } else if (diffDays === 1) {
    return 'Ngày mai';
  } else if (diffDays === -1) {
    return 'Hôm qua';
  } else if (diffDays > 0) {
    return `Còn ${diffDays} ngày`;
  } else {
    return `${Math.abs(diffDays)} ngày trước`;
  }
}

// Calculate remaining time for countdown
export function calculateTimeLeft(targetDate: Date | string): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
} {
  const difference = +new Date(targetDate) - +new Date();
  let timeLeft = {
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  };

  if (difference > 0) {
    timeLeft = {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60)
    };
  }

  return timeLeft;
}

// Check if date is today
export function isToday(date: Date | string): boolean {
  const today = new Date();
  const checkDate = new Date(date);
  
  return (
    checkDate.getDate() === today.getDate() &&
    checkDate.getMonth() === today.getMonth() &&
    checkDate.getFullYear() === today.getFullYear()
  );
}

// Extract month and day from date
export function getMonthAndDay(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('vi-VN', {
    month: 'long',
    day: 'numeric'
  });
}
