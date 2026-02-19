/**
 * @param {string} value
 * @returns {string}
 */
function escapeIcsText(value) {
  return String(value || '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/**
 * @param {Date} date
 * @returns {string}
 */
function formatUtc(date) {
  const value = new Date(date);
  const year = value.getUTCFullYear();
  const month = String(value.getUTCMonth() + 1).padStart(2, '0');
  const day = String(value.getUTCDate()).padStart(2, '0');
  const hour = String(value.getUTCHours()).padStart(2, '0');
  const minute = String(value.getUTCMinutes()).padStart(2, '0');
  const second = String(value.getUTCSeconds()).padStart(2, '0');
  return `${year}${month}${day}T${hour}${minute}${second}Z`;
}

/**
 * @param {{
 *  appointmentId: string,
 *  startAt: Date,
 *  endAt: Date,
 *  structureName: string,
 *  serviceName: string,
 *  manageUrl?: string,
 * }} input
 */
export function buildAppointmentIcs(input) {
  const now = new Date();
  const uid = `${String(input.appointmentId || '').trim() || 'rdv'}@accesdirectaide.fr`;
  const summary = `RDV - ${String(input.structureName || 'Acces Direct Aide').trim()}`;
  const descriptionLines = [
    `Service: ${String(input.serviceName || 'Rendez-vous').trim()}`,
    input.manageUrl ? `Gestion du RDV: ${String(input.manageUrl).trim()}` : '',
  ].filter(Boolean);

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Acces Direct Aide//Rendez-vous//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${escapeIcsText(uid)}`,
    `DTSTAMP:${formatUtc(now)}`,
    `DTSTART:${formatUtc(input.startAt)}`,
    `DTEND:${formatUtc(input.endAt)}`,
    `SUMMARY:${escapeIcsText(summary)}`,
    `DESCRIPTION:${escapeIcsText(descriptionLines.join('\n'))}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  return `${lines.join('\r\n')}\r\n`;
}
