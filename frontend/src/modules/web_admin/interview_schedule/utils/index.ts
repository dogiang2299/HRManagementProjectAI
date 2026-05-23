export function formatDateToInputDate(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatDateToInputTime(date: Date) {
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function addMinutesToTime(dateStr: string, timeStr: string, minutesToAdd: number) {
  if (!dateStr || !timeStr) return "";

  const start = new Date(`${dateStr}T${timeStr}:00`);
  if (Number.isNaN(start.getTime())) return "";

  const end = new Date(start.getTime() + minutesToAdd * 60 * 1000);

  const hh = `${end.getHours()}`.padStart(2, "0");
  const mm = `${end.getMinutes()}`.padStart(2, "0");
  return `${hh}:${mm}`;
}

export function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}