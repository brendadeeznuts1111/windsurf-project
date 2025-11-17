export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toISOString();
}

export function getCurrentTimestamp(): number {
  return Date.now();
}

export function isMarketHours(timestamp: number, timezone: string = 'America/New_York'): boolean {
  const date = new Date(timestamp);
  const time = date.toLocaleTimeString('en-US', { 
    timeZone: timezone, 
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  
  const day = date.getDay();
  const hours = parseInt(time.split(':')[0]);
  const minutes = parseInt(time.split(':')[1]);
  const timeInMinutes = hours * 60 + minutes;
  
  // Weekdays only, 9:30 AM - 4:00 PM
  return day >= 1 && day <= 5 && timeInMinutes >= 570 && timeInMinutes <= 960;
}

export function addSeconds(timestamp: number, seconds: number): number {
  return timestamp + (seconds * 1000);
}

export function addMinutes(timestamp: number, minutes: number): number {
  return timestamp + (minutes * 60 * 1000);
}
