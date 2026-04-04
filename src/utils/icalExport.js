/**
 * Export iCal / Sync Agenda — ESGIS Campus §3.3
 * Génère un fichier .ics compatible avec Google Calendar, Apple Calendar, Outlook
 */

const escapeIcal = (str) => (str || '').replace(/[\\;,]/g, (m) => `\\${m}`).replace(/\n/g, '\\n');

const formatIcalDate = (date) => {
  const d = new Date(date);
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
};

/**
 * Génère le contenu iCal pour une liste d'événements
 * @param {Array} events - [{title, description, location, start, end, uid}]
 * @param {string} calendarName - Nom du calendrier
 * @returns {string} Contenu .ics
 */
export const generateICalContent = (events, calendarName = 'ESGIS Campus') => {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:-//ESGIS Campus//FR`,
    `X-WR-CALNAME:${escapeIcal(calendarName)}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  events.forEach((event) => {
    const uid = event.uid || `${event.id || Date.now()}@esgis-campus`;
    lines.push(
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTART:${formatIcalDate(event.start)}`,
      `DTEND:${formatIcalDate(event.end)}`,
      `SUMMARY:${escapeIcal(event.title)}`,
    );
    if (event.description) lines.push(`DESCRIPTION:${escapeIcal(event.description)}`);
    if (event.location) lines.push(`LOCATION:${escapeIcal(event.location)}`);
    if (event.recurrence) lines.push(`RRULE:${event.recurrence}`);
    lines.push(
      `DTSTAMP:${formatIcalDate(new Date())}`,
      'END:VEVENT',
    );
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
};

/**
 * Télécharge un fichier .ics
 */
export const downloadICalFile = (events, fileName = 'esgis-calendar.ics', calendarName) => {
  const content = generateICalContent(events, calendarName);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
};

/**
 * Convertit les sessions de cours en événements iCal
 */
export const convertSessionsToICalEvents = (sessions) => {
  return (sessions || []).map((session) => {
    const start = session.date || session.date_debut;
    const duration = session.duration || 120;
    const end = session.date_fin || new Date(new Date(start).getTime() + duration * 60000).toISOString();

    return {
      id: session.id,
      title: session.cours?.name || session.title || 'Cours',
      description: `Professeur: ${session.professeur?.full_name || '-'}\nSalle: ${session.salle || session.room || '-'}`,
      location: session.salle || session.room || '',
      start,
      end,
      uid: `session-${session.id}@esgis-campus`,
    };
  });
};

/**
 * Convertit les événements institutionnels en événements iCal
 */
export const convertEventsToICalEvents = (events) => {
  return (events || []).map((event) => ({
    id: event.id,
    title: event.title,
    description: event.description || '',
    location: event.location || event.lieu || '',
    start: event.start_date || event.date_debut,
    end: event.end_date || event.date_fin || event.start_date,
    uid: `event-${event.id}@esgis-campus`,
  }));
};
