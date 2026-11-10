export function schoolDate(timeZone = 'Africa/Casablanca') {
  try {
    return new Intl.DateTimeFormat('sv-SE', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}
