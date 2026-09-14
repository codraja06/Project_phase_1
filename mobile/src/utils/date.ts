/**
 * Formats dates consistently across Citizen and Authority UI
 * Examples: '13 Sep 2026' or '13 Sep 2026, 08:42 PM'
 */
export const formatDate = (
  dateInput?: string | Date | null,
  includeTime: boolean = false
): string => {
  if (!dateInput) return 'Date unavailable';

  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return 'Date unavailable';

    const datePart = d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    if (!includeTime) {
      return datePart;
    }

    const timePart = d.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    return `${datePart} • ${timePart}`;
  } catch {
    return 'Date unavailable';
  }
};
