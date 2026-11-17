// The appointments table stores one scheduled_at timestamp; the UI works with a date and a time
export function withScheduledParts<T extends { scheduled_at?: string | null }>(apt: T) {
  if (!apt.scheduled_at) {
    return { ...apt, appointment_date: null, appointment_time: null };
  }
  const [appointment_date, timePart = ""] = apt.scheduled_at.split("T");
  return { ...apt, appointment_date, appointment_time: timePart.slice(0, 5) || null };
}
